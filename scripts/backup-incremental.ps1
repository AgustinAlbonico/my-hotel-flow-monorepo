<#
.SYNOPSIS
    Script de backup incremental para MyHotelFlow
    
.DESCRIPTION
    Realiza un backup incremental de cambios desde el último backup completo:
    - Cambios en base de datos
    - Archivos nuevos o modificados en uploads
    
.PARAMETER BackupDir
    Directorio donde se almacenarán los backups (por defecto: .\backups\incremental)
    
.PARAMETER SinceDate
    Fecha desde la cual hacer el backup incremental (por defecto: último backup)
    
.EXAMPLE
    .\backup-incremental.ps1
    .\backup-incremental.ps1 -BackupDir "D:\backups\incremental"
#>

param(
    [string]$BackupDir = ".\backups\incremental",
    [datetime]$SinceDate
)

# Configuración
$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupName = "backup-incr-$timestamp"
$tempDir = Join-Path $env:TEMP $backupName
$logFile = ".\backups\logs\backup-incr-$timestamp.log"

# Función de logging
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    $logDir = Split-Path $logFile -Parent
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Force -Path $logDir | Out-Null
    }
    
    Add-Content -Path $logFile -Value $logMessage
    
    switch ($Level) {
        "ERROR" { Write-Host $logMessage -ForegroundColor Red }
        "WARNING" { Write-Host $logMessage -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
        default { Write-Output $logMessage }
    }
}

Write-Log "=== Iniciando Backup Incremental de MyHotelFlow ===" "INFO"

try {
    # Determinar fecha de referencia
    if (-not $SinceDate) {
        # Buscar último backup completo
        $lastFullBackup = Get-ChildItem -Path ".\backups\full" -Filter "backup-full-*.zip" -ErrorAction SilentlyContinue | 
            Sort-Object LastWriteTime -Descending | 
            Select-Object -First 1
        
        if ($lastFullBackup) {
            $SinceDate = $lastFullBackup.LastWriteTime
            Write-Log "Usando fecha del último backup completo: $($SinceDate.ToString('yyyy-MM-dd HH:mm:ss'))" "INFO"
        }
        else {
            $SinceDate = (Get-Date).AddDays(-1)
            Write-Log "No se encontró backup completo, usando últimas 24 horas" "WARNING"
        }
    }
    
    # Crear directorios
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
    }
    if (-not (Test-Path $tempDir)) {
        New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
    }
    
    # 1. BACKUP INCREMENTAL DE BASE DE DATOS
    Write-Log "=== Exportando cambios de base de datos ===" "INFO"
    $dbBackupFile = Join-Path $tempDir "database-incremental.sql"
    
    # Exportar dump completo (PostgreSQL no soporta dumps incrementales nativos)
    # En producción, considerar usar WAL archiving para verdaderos incrementales
    $dbExportCmd = "docker exec myhotelflow-postgres pg_dump -U postgres -d myhotelflow -F c -b -v"
    Invoke-Expression "$dbExportCmd" | Set-Content -Path $dbBackupFile -Encoding Byte
    
    $dbSize = (Get-Item $dbBackupFile).Length / 1MB
    Write-Log "Base de datos exportada ($([math]::Round($dbSize, 2)) MB)" "SUCCESS"
    
    # 2. BACKUP INCREMENTAL DE UPLOADS
    Write-Log "=== Copiando archivos modificados desde $($SinceDate.ToString('yyyy-MM-dd HH:mm:ss')) ===" "INFO"
    $uploadsPath = ".\apps\backend\uploads"
    $uploadsBackupPath = Join-Path $tempDir "uploads"
    
    if (Test-Path $uploadsPath) {
        New-Item -ItemType Directory -Force -Path $uploadsBackupPath | Out-Null
        
        $modifiedFiles = Get-ChildItem -Path $uploadsPath -Recurse -File | 
            Where-Object { $_.LastWriteTime -gt $SinceDate }
        
        if ($modifiedFiles) {
            foreach ($file in $modifiedFiles) {
                $relativePath = $file.FullName.Substring($uploadsPath.Length + 1)
                $destPath = Join-Path $uploadsBackupPath $relativePath
                $destDir = Split-Path $destPath -Parent
                
                if (-not (Test-Path $destDir)) {
                    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
                }
                
                Copy-Item -Path $file.FullName -Destination $destPath -Force
            }
            
            $fileCount = $modifiedFiles.Count
            $uploadsSize = ($modifiedFiles | Measure-Object -Property Length -Sum).Sum / 1MB
            Write-Log "Archivos copiados: $fileCount ($([math]::Round($uploadsSize, 2)) MB)" "SUCCESS"
        }
        else {
            Write-Log "No hay archivos modificados desde el último backup" "INFO"
        }
    }
    
    # 3. CREAR METADATA
    $metadata = @{
        BackupDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        BackupType = "incremental"
        SinceDate = $SinceDate.ToString("yyyy-MM-dd HH:mm:ss")
        DatabaseSize = [math]::Round((Get-Item $dbBackupFile).Length / 1MB, 2)
        FilesModified = if ($modifiedFiles) { $modifiedFiles.Count } else { 0 }
        Version = "1.0"
    }
    
    $metadata | ConvertTo-Json | Out-File -FilePath (Join-Path $tempDir "metadata.json") -Encoding UTF8
    
    # 4. COMPRIMIR
    Write-Log "=== Comprimiendo backup incremental ===" "INFO"
    $zipFile = Join-Path $BackupDir "$backupName.zip"
    Compress-Archive -Path "$tempDir\*" -DestinationPath $zipFile -CompressionLevel Optimal -Force
    
    $zipSize = (Get-Item $zipFile).Length / 1MB
    Write-Log "Backup comprimido: $([math]::Round($zipSize, 2)) MB" "SUCCESS"
    
    # 5. CHECKSUM
    $hash = Get-FileHash -Path $zipFile -Algorithm SHA256
    "$($hash.Hash)  $backupName.zip" | Out-File -FilePath "$zipFile.sha256" -Encoding ASCII
    
    # 6. LIMPIAR TEMPORALES
    Remove-Item -Path $tempDir -Recurse -Force
    
    # 7. RETENCIÓN (7 días para incrementales)
    $retentionDays = 7
    $cutoffDate = (Get-Date).AddDays(-$retentionDays)
    
    Get-ChildItem -Path $BackupDir -Filter "backup-incr-*.zip" | 
        Where-Object { $_.LastWriteTime -lt $cutoffDate } |
        ForEach-Object {
            Write-Log "Eliminando backup antiguo: $($_.Name)" "INFO"
            Remove-Item -Path $_.FullName -Force
            if (Test-Path "$($_.FullName).sha256") {
                Remove-Item -Path "$($_.FullName).sha256" -Force
            }
        }
    
    Write-Log "=== BACKUP INCREMENTAL COMPLETADO ===" "SUCCESS"
    Write-Log "Archivo: $backupName.zip ($([math]::Round($zipSize, 2)) MB)" "INFO"
    
    return @{
        Success = $true
        BackupFile = "$backupName.zip"
        BackupPath = $BackupDir
        Timestamp = $timestamp
    }
}
catch {
    Write-Log "ERROR: $($_.Exception.Message)" "ERROR"
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    throw
}
