<#
.SYNOPSIS
    Script de backup completo para MyHotelFlow
    
.DESCRIPTION
    Realiza un backup completo de:
    - Base de datos PostgreSQL
    - Archivos de uploads
    - Configuraciones
    - Logs (opcional)
    
.PARAMETER BackupDir
    Directorio donde se almacenarán los backups (por defecto: .\backups\full)
    
.PARAMETER IncludeLogs
    Incluir logs en el backup (por defecto: $false)
    
.PARAMETER Compress
    Comprimir el backup (por defecto: $true)
    
.EXAMPLE
    .\backup-full.ps1
    .\backup-full.ps1 -BackupDir "D:\backups" -IncludeLogs $true
#>

param(
    [string]$BackupDir = ".\backups\full",
    [switch]$IncludeLogs = $false,
    [switch]$Compress = $true
)

# Configuración
$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupName = "backup-full-$timestamp"
$tempDir = Join-Path $env:TEMP $backupName
$logFile = ".\backups\logs\backup-full-$timestamp.log"

# Colores para output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# Función de logging
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    # Crear directorio de logs si no existe
    $logDir = Split-Path $logFile -Parent
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Force -Path $logDir | Out-Null
    }
    
    Add-Content -Path $logFile -Value $logMessage
    
    switch ($Level) {
        "ERROR" { Write-ColorOutput Red $logMessage }
        "WARNING" { Write-ColorOutput Yellow $logMessage }
        "SUCCESS" { Write-ColorOutput Green $logMessage }
        default { Write-Output $logMessage }
    }
}

# Función para verificar si Docker está corriendo
function Test-DockerRunning {
    try {
        docker info 2>&1 | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Inicio del script
Write-Log "=== Iniciando Backup Completo de MyHotelFlow ===" "INFO"
Write-Log "Timestamp: $timestamp" "INFO"
Write-Log "Directorio de backup: $BackupDir" "INFO"

try {
    # Verificar Docker
    Write-Log "Verificando Docker..." "INFO"
    if (-not (Test-DockerRunning)) {
        throw "Docker no está corriendo. Inicie Docker Desktop e intente nuevamente."
    }
    Write-Log "Docker está corriendo correctamente" "SUCCESS"
    
    # Crear directorios necesarios
    Write-Log "Creando directorios de trabajo..." "INFO"
    if (-not (Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
    }
    if (-not (Test-Path $tempDir)) {
        New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
    }
    
    # 1. BACKUP DE BASE DE DATOS
    Write-Log "=== Iniciando backup de base de datos ===" "INFO"
    $dbBackupFile = Join-Path $tempDir "database.sql"
    
    Write-Log "Exportando base de datos PostgreSQL..." "INFO"
    $dbExportCmd = "docker exec myhotelflow-postgres pg_dump -U postgres -d myhotelflow -F c -b -v"
    
    try {
        Invoke-Expression "$dbExportCmd" | Set-Content -Path $dbBackupFile -Encoding Byte
        $dbSize = (Get-Item $dbBackupFile).Length / 1MB
        Write-Log "Base de datos exportada correctamente ($([math]::Round($dbSize, 2)) MB)" "SUCCESS"
    }
    catch {
        Write-Log "Error al exportar base de datos: $_" "ERROR"
        throw
    }
    
    # 2. BACKUP DE ARCHIVOS UPLOADS
    Write-Log "=== Iniciando backup de archivos uploads ===" "INFO"
    $uploadsPath = ".\apps\backend\uploads"
    $uploadsBackupPath = Join-Path $tempDir "uploads"
    
    if (Test-Path $uploadsPath) {
        Write-Log "Copiando archivos de uploads..." "INFO"
        Copy-Item -Path $uploadsPath -Destination $uploadsBackupPath -Recurse -Force
        
        $fileCount = (Get-ChildItem -Path $uploadsBackupPath -Recurse -File).Count
        $uploadsSize = (Get-ChildItem -Path $uploadsBackupPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Log "Uploads copiados: $fileCount archivos ($([math]::Round($uploadsSize, 2)) MB)" "SUCCESS"
    }
    else {
        Write-Log "Directorio uploads no encontrado, omitiendo..." "WARNING"
    }
    
    # 3. BACKUP DE CONFIGURACIONES
    Write-Log "=== Iniciando backup de configuraciones ===" "INFO"
    $configBackupPath = Join-Path $tempDir "config"
    New-Item -ItemType Directory -Force -Path $configBackupPath | Out-Null
    
    # Copiar archivos de configuración importantes
    $configFiles = @(
        "docker-compose.yml",
        "package.json",
        "turbo.json"
    )
    
    foreach ($file in $configFiles) {
        if (Test-Path $file) {
            Copy-Item -Path $file -Destination $configBackupPath -Force
            Write-Log "Copiado: $file" "INFO"
        }
    }
    
    # Copiar .env si existe (SIN credenciales sensibles en el log)
    if (Test-Path ".\apps\backend\.env") {
        Copy-Item -Path ".\apps\backend\.env" -Destination (Join-Path $configBackupPath "backend.env") -Force
        Write-Log "Copiado: backend .env" "INFO"
    }
    
    if (Test-Path ".\apps\web\.env") {
        Copy-Item -Path ".\apps\web\.env" -Destination (Join-Path $configBackupPath "web.env") -Force
        Write-Log "Copiado: web .env" "INFO"
    }
    
    Write-Log "Configuraciones copiadas correctamente" "SUCCESS"
    
    # 4. BACKUP DE LOGS (opcional)
    if ($IncludeLogs) {
        Write-Log "=== Iniciando backup de logs ===" "INFO"
        $logsBackupPath = Join-Path $tempDir "logs"
        
        # Copiar logs de los últimos 30 días
        if (Test-Path ".\apps\backend\logs") {
            $cutoffDate = (Get-Date).AddDays(-30)
            New-Item -ItemType Directory -Force -Path $logsBackupPath | Out-Null
            Get-ChildItem -Path ".\apps\backend\logs" -Recurse | 
                Where-Object { $_.LastWriteTime -gt $cutoffDate } |
                Copy-Item -Destination $logsBackupPath -Force
            Write-Log "Logs de los últimos 30 días copiados" "SUCCESS"
        }
    }
    
    # 5. CREAR METADATA
    Write-Log "=== Creando metadata del backup ===" "INFO"
    $metadata = @{
        BackupDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        BackupType = "full"
        DatabaseSize = [math]::Round((Get-Item $dbBackupFile).Length / 1MB, 2)
        IncludeLogs = $IncludeLogs.IsPresent
        Version = "1.0"
        PostgresVersion = (docker exec myhotelflow-postgres psql -U postgres -c "SELECT version();" -t).Trim()
    }
    
    $metadata | ConvertTo-Json | Out-File -FilePath (Join-Path $tempDir "metadata.json") -Encoding UTF8
    Write-Log "Metadata creada" "SUCCESS"
    
    # 6. COMPRIMIR BACKUP
    if ($Compress) {
        Write-Log "=== Comprimiendo backup ===" "INFO"
        $zipFile = Join-Path $BackupDir "$backupName.zip"
        
        try {
            Compress-Archive -Path "$tempDir\*" -DestinationPath $zipFile -CompressionLevel Optimal -Force
            $zipSize = (Get-Item $zipFile).Length / 1MB
            Write-Log "Backup comprimido correctamente ($([math]::Round($zipSize, 2)) MB)" "SUCCESS"
            Write-Log "Archivo: $zipFile" "SUCCESS"
        }
        catch {
            Write-Log "Error al comprimir backup: $_" "ERROR"
            throw
        }
    }
    else {
        # Mover directorio sin comprimir
        $finalPath = Join-Path $BackupDir $backupName
        Move-Item -Path $tempDir -Destination $finalPath -Force
        Write-Log "Backup guardado en: $finalPath" "SUCCESS"
    }
    
    # 7. GENERAR CHECKSUM
    Write-Log "=== Generando checksum ===" "INFO"
    if ($Compress) {
        $zipFile = Join-Path $BackupDir "$backupName.zip"
        $hash = Get-FileHash -Path $zipFile -Algorithm SHA256
        $checksumFile = "$zipFile.sha256"
        "$($hash.Hash)  $backupName.zip" | Out-File -FilePath $checksumFile -Encoding ASCII
        Write-Log "Checksum SHA256: $($hash.Hash)" "INFO"
        Write-Log "Checksum guardado en: $checksumFile" "SUCCESS"
    }
    
    # 8. LIMPIAR ARCHIVOS TEMPORALES
    Write-Log "=== Limpiando archivos temporales ===" "INFO"
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force
        Write-Log "Archivos temporales eliminados" "SUCCESS"
    }
    
    # 9. LIMPIAR BACKUPS ANTIGUOS (retención: 4 semanas para backups completos)
    Write-Log "=== Aplicando política de retención ===" "INFO"
    $retentionDays = 28 # 4 semanas
    $cutoffDate = (Get-Date).AddDays(-$retentionDays)
    
    Get-ChildItem -Path $BackupDir -Filter "backup-full-*.zip" | 
        Where-Object { $_.LastWriteTime -lt $cutoffDate } |
        ForEach-Object {
            Write-Log "Eliminando backup antiguo: $($_.Name)" "INFO"
            Remove-Item -Path $_.FullName -Force
            
            # Eliminar checksum asociado
            $checksumPath = "$($_.FullName).sha256"
            if (Test-Path $checksumPath) {
                Remove-Item -Path $checksumPath -Force
            }
        }
    
    # RESUMEN FINAL
    Write-Log "=== BACKUP COMPLETADO EXITOSAMENTE ===" "SUCCESS"
    Write-Log "Tipo: Backup Completo" "INFO"
    Write-Log "Fecha: $timestamp" "INFO"
    if ($Compress) {
        $finalBackupFile = Join-Path $BackupDir "$backupName.zip"
        $finalSize = (Get-Item $finalBackupFile).Length / 1MB
        Write-Log "Archivo: $backupName.zip" "INFO"
        Write-Log "Tamaño: $([math]::Round($finalSize, 2)) MB" "INFO"
    }
    Write-Log "Log: $logFile" "INFO"
    
    # Retornar información del backup
    return @{
        Success = $true
        BackupFile = if ($Compress) { "$backupName.zip" } else { $backupName }
        BackupPath = $BackupDir
        Timestamp = $timestamp
        LogFile = $logFile
    }
}
catch {
    Write-Log "ERROR CRÍTICO: $($_.Exception.Message)" "ERROR"
    Write-Log "Stack Trace: $($_.ScriptStackTrace)" "ERROR"
    
    # Limpiar en caso de error
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    throw
}
finally {
    Write-Log "=== Fin del proceso de backup ===" "INFO"
}
