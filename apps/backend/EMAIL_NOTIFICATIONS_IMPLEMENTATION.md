# Implementación de Notificaciones (Email & SMS) — MyHotelFlow

Este documento resume los cambios realizados para soportar notificaciones por correo electrónico y SMS en la arquitectura existente de MyHotelFlow.

Fecha: 2025-11-04

## Objetivo

Implementar notificaciones transaccionales (emails + SMS) siguiendo la arquitectura Clean: contrato en Domain, implementación en Infrastructure y consumo desde Use Cases (Application). Utilizar plantillas Handlebars para el HTML de los correos y Twilio para SMS (opcional/configurable).

## Archivos añadidos/actualizados

- `backend/src/domain/services/notification.service.interface.ts`
  - Interfaz `INotificationService` con métodos: `sendProfileCreated`, `sendReservationConfirmation`, `sendSMS`.

- `backend/src/infrastructure/notifications/mail.module.ts`
  - Configura `@nestjs-modules/mailer` con `HandlebarsAdapter` y ruta a `templates`.

- `backend/src/infrastructure/notifications/mail.service.ts`
  - Implementación de `INotificationService`.
  - Envía emails usando `MailerService` (templates: `profile-created`, `reservation-confirmation`).
  - Envía SMS usando Twilio si las variables `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y `TWILIO_FROM` están configuradas. Si no, hace fallback a log.

- Templates Handlebars:
  - `backend/src/infrastructure/notifications/templates/profile-created.hbs`
  - `backend/src/infrastructure/notifications/templates/reservation-confirmation.hbs`

- Integración con Use Cases (Application):
  - `CreateClientUseCase` ahora inyecta `INotificationService` y envía el email de bienvenida con la contraseña temporal.
  - `CreateReservationUseCase` ahora inyecta `INotificationService` y envía confirmación por email y/o SMS según flags `notifyByEmail` / `notifyBySMS` en el DTO.

- `backend/src/presentation/presentation-common.module.ts`
  - Registra globalmente el provider `'INotificationService'` apuntando a `MailService`.

- `backend/src/config/configuration.ts`
  - Añadida sección `mail` para centralizar variables de entorno de correo.

- Dependencia añadida: `twilio` en `backend/package.json` (para envío SMS).

## Variables de entorno (ejemplo)

Se añadió `backend/.env.example` con las variables necesarias. Variables importantes:

- MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM
- APP_URL, SUPPORT_EMAIL, ASSET_BASE_URL
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM

Ejemplo mínimo (ver `backend/.env.example`):

```
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_FROM="MyHotelFlow <no-reply@myhotelflow.example>"
APP_URL=https://app.myhotelflow.example
SUPPORT_EMAIL=soporte@myhotelflow.example
ASSET_BASE_URL=https://assets.myhotelflow.example

# Twilio (opcional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=
```

## Cómo probar localmente

1. Levantar un server SMTP de pruebas (MailHog, Mailtrap o similar). Por ejemplo MailHog en Docker.
2. Poner `MAIL_HOST` y `MAIL_PORT` apuntando a MailHog.
3. Ejecutar el backend y crear un cliente o reserva mediante los endpoints existentes. Asegurarse de enviar `notifyByEmail: true` o `notifyBySMS: true` cuando se cree una reserva.
4. Ver los emails en MailHog o las trazas en logs para SMS.

Si quieres probar SMS en entorno real, configura las variables Twilio y se enviarán mensajes desde `TWILIO_FROM`.

## Consideraciones y recomendaciones

- No bloquear el flujo de negocio si falla el envío de notificaciones: las llamadas a `INotificationService` capturan errores y registran el fallo.
- Recomendado: añadir una cola (ej. BullMQ) para manejar retries, backoff y dead-letter de envíos fallidos.
- Añadir pruebas end-to-end (con MailHog) que validen el HTML generado por las plantillas.
- Configurar SPF/DKIM/DMARC para el dominio de envío y usar un proveedor transaccional en producción (SES/SendGrid/Mailgun).
- Internationalización: si se requiere, adaptar templates para locales y usar formateo de fechas y moneda vía helpers Handlebars.

## Tests añadidos

- `backend/test/unit/mail.service.spec.ts` — pruebas unitarias básicas para `MailService` usando un mock de `MailerService`.

## Próximos pasos sugeridos

1. Añadir cola para envíos (retries y visibilidad de fallos).
2. Integrar provider SMS (Twilio ya integrado) y agregar validación de números E.164.
3. Crear tests de integración que ejecuten el flujo completo con MailHog y posibles stubs de Twilio.

---

Si quieres, puedo ahora:

- Añadir pruebas e2e que levanten MailHog en Docker Compose y verifiquen el email recibido.
- Integrar retry/cola usando BullMQ.
- Crear helpers Handlebars para formatear fechas/precios.

Indica cuál quieres que haga a continuación.
