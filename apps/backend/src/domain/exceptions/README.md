# Sistema de Excepciones de Dominio

## 📋 Descripción

Sistema robusto y profesional de manejo de excepciones basado en una clase base `DomainException` que garantiza consistencia en toda la aplicación.

## 🏗️ Arquitectura

```
DomainException (Clase Base Abstracta)
    ├── InvalidCredentialsException
    ├── UserNotActiveException
    ├── UserLockedException
    ├── UserAlreadyExistsException
    └── ... (futuras excepciones)
```

## ✨ Beneficios

1. **Consistencia**: Todas las excepciones siguen el mismo patrón
2. **Mantenibilidad**: Un solo filtro maneja todas las excepciones de dominio
3. **Escalabilidad**: Agregar nuevas excepciones es trivial
4. **Type Safety**: TypeScript garantiza que todas las propiedades estén presentes
5. **Metadata**: Puedes incluir información adicional en cada excepción

## 🎯 Cómo Crear una Nueva Excepción de Dominio

### Paso 1: Crear el archivo de la excepción

```typescript
// src/domain/exceptions/resource-not-found.exception.ts
import { HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';

/**
 * Resource Not Found Exception
 * Se lanza cuando un recurso solicitado no existe
 */
export class ResourceNotFoundException extends DomainException {
  constructor(resourceType: string, resourceId: string | number) {
    super(
      `${resourceType} con ID '${resourceId}' no encontrado`,
      HttpStatus.NOT_FOUND,           // Código HTTP
      'RESOURCE_NOT_FOUND',            // Código de error semántico
      { resourceType, resourceId },    // Metadata adicional (opcional)
    );
  }
}
```

### Paso 2: Usar la excepción en tu código

```typescript
// En un Use Case o Service
import { ResourceNotFoundException } from '../exceptions/resource-not-found.exception';

async findReservation(id: number) {
  const reservation = await this.repository.findById(id);
  
  if (!reservation) {
    throw new ResourceNotFoundException('Reserva', id);
  }
  
  return reservation;
}
```

### Paso 3: ¡Eso es todo!

El `DomainExceptionFilter` automáticamente capturará y manejará la excepción, devolviendo:

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Reserva con ID '123' no encontrado",
    "resourceType": "Reserva",
    "resourceId": 123
  },
  "meta": {
    "timestamp": "2025-10-31T...",
    "requestId": "uuid..."
  }
}
```

## 📚 Ejemplos de Excepciones Comunes

### 1. Excepción Simple (sin metadata)

```typescript
export class EmailAlreadyVerifiedException extends DomainException {
  constructor() {
    super(
      'El email ya ha sido verificado',
      HttpStatus.BAD_REQUEST,
      'EMAIL_ALREADY_VERIFIED',
    );
  }
}
```

### 2. Excepción con Metadata

```typescript
export class InsufficientPermissionsException extends DomainException {
  constructor(requiredPermissions: string[]) {
    super(
      'No tienes permisos suficientes para realizar esta acción',
      HttpStatus.FORBIDDEN,
      'INSUFFICIENT_PERMISSIONS',
      { requiredPermissions },
    );
  }
}
```

### 3. Excepción con Múltiples Parámetros

```typescript
export class InvalidDateRangeException extends DomainException {
  constructor(startDate: Date, endDate: Date) {
    super(
      `El rango de fechas es inválido: ${startDate.toISOString()} - ${endDate.toISOString()}`,
      HttpStatus.BAD_REQUEST,
      'INVALID_DATE_RANGE',
      { startDate, endDate },
    );
  }
}
```

## 🎨 Códigos HTTP Recomendados

| Código | Situación |
|--------|-----------|
| `400 BAD_REQUEST` | Datos inválidos, validación fallida |
| `401 UNAUTHORIZED` | Credenciales incorrectas, token inválido |
| `403 FORBIDDEN` | Usuario autenticado pero sin permisos |
| `404 NOT_FOUND` | Recurso no existe |
| `409 CONFLICT` | Conflicto (email duplicado, username existente) |
| `422 UNPROCESSABLE_ENTITY` | Regla de negocio violada |

## 🔧 Códigos de Error Semánticos

Usa nombres descriptivos en UPPER_SNAKE_CASE:

✅ Buenos ejemplos:
- `INVALID_CREDENTIALS`
- `ACCOUNT_LOCKED`
- `RESOURCE_NOT_FOUND`
- `INSUFFICIENT_PERMISSIONS`
- `EMAIL_ALREADY_VERIFIED`

❌ Evitar:
- `ERROR` (muy genérico)
- `error_1` (no descriptivo)
- `invalidCredentials` (usar UPPER_SNAKE_CASE)

## 🧪 Testing

```typescript
describe('ResourceNotFoundException', () => {
  it('should create exception with correct properties', () => {
    const exception = new ResourceNotFoundException('Hotel', 123);
    
    expect(exception.message).toBe("Hotel con ID '123' no encontrado");
    expect(exception.httpStatus).toBe(HttpStatus.NOT_FOUND);
    expect(exception.errorCode).toBe('RESOURCE_NOT_FOUND');
    expect(exception.metadata).toEqual({
      resourceType: 'Hotel',
      resourceId: 123,
    });
  });
});
```

## 📊 Ventajas vs Enfoque Anterior

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| Crear excepción | 15-20 líneas | 8-10 líneas |
| Filtro | if/else para cada excepción | Un solo `@Catch(DomainException)` |
| Agregar nueva excepción | Modificar filtro | Solo crear clase |
| Consistencia | Manual | Garantizada por tipo |
| Metadata | Ad-hoc | Estandarizada |

## 🚀 Próximos Pasos

1. Crea excepciones específicas para cada caso de uso de tu dominio
2. Reemplaza `throw new Error()` por excepciones de dominio
3. Documenta los posibles errores en cada endpoint (Swagger)
4. Mantén los mensajes en español y user-friendly
