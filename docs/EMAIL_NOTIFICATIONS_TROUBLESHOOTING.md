# Diagnóstico y Plan para Corregir Envío de Emails

## 1. Contexto: qué debería pasar

Casos requeridos:
- **Creación de perfil de cliente** → Enviar email de bienvenida con contraseña temporal.
- **Creación de reserva** → Si `notifyByEmail = true`, enviar email con datos de la reserva.

Estado del código (backend):
- `CreateClientUseCase` llama a `notificationService.sendProfileCreated(...)`.
- `CreateReservationUseCase` llama a `notificationService.sendReservationConfirmation(...)` cuando `notifyByEmail` es `true`.
- `INotificationService` está implementado por `MailService` (`mail.service.ts`).
- `MailModule` configura `@nestjs-modules/mailer` y plantillas Handlebars.
- `PresentationCommonModule` registra el provider global `'INotificationService'` usando `MailService`.

Esto significa que **lógicamente el flujo está cableado**. Si los mails no llegan, el problema casi seguro es de **infraestructura/configuración**, no de código de negocio.

---

## 2. Posibles causas por las que "no funciona"

### 2.1. Variables de entorno de mail incompletas o incorrectas

El `MailModule` depende de:
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USER` (opcional, según el servidor)
- `MAIL_PASS` (opcional)
- `MAIL_FROM` (opcional, tiene default)

Si `MAIL_HOST`/`MAIL_PORT` no apuntan a un servidor SMTP real (o de pruebas como MailHog/Mailtrap), **no se enviará nada** o fallará silenciosamente en el servidor SMTP.

### 2.2. No hay servidor SMTP levantado en local

En local, lo esperado es usar algo tipo **MailHog/Mailpit/Mailtrap**. Si el backend intenta conectar a `localhost:1025` pero no hay nada escuchando, los envíos fallan.

### 2.3. Plantillas de email faltantes o con errores

`MailService` usa:
- plantilla `profile-created` para `sendProfileCreated`.
- plantilla `reservation-confirmation` para `sendReservationConfirmation`.

Si falta alguna plantilla `.hbs` o tiene errores de Handlebars, el envío lanza excepción interna y se loguea como error.

### 2.4. Provider de notificaciones no registrado o no cargado

En este proyecto ya está resuelto:
- `PresentationCommonModule` es `@Global` y expone `'INotificationService'`.
- Usa `MailModule` → `MailService`.

Si por alguna razón el módulo global no se importa en `AppModule`, el provider no existiría. Pero en este repo ya está importado.

### 2.5. Flags `notifyByEmail` o email del cliente

En reservas, el envío se hace **solo si**:
- `dto.notifyByEmail === true`.
- El cliente existe y tiene email válido.

Si el front no manda `notifyByEmail` o viene en `false`, no se dispara el correo.

---

## 3. Paso a paso para hacerlo funcionar en local

### 3.1. Levantar un servidor SMTP de pruebas

Opción recomendada: **MailHog** con Docker.

```bash
# En PowerShell, desde la raíz del proyecto o cualquier carpeta
docker run --name mailhog -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

- SMTP: `localhost:1025`
- UI web: `http://localhost:8025`

### 3.2. Configurar variables de entorno del backend

En `apps/backend/.env` (o variables del sistema), asegurar:

```env
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_FROM="MyHotelFlow <no-reply@myhotelflow.test>"
APP_URL=http://localhost:5173
SUPPORT_EMAIL=soporte@myhotelflow.test
ASSET_BASE_URL=http://localhost:5173/assets
```

> Nota: Si tu servidor SMTP no requiere autenticación, deja `MAIL_USER` y `MAIL_PASS` vacíos.

Revisar también que el backend esté cargando ese `.env` (Nest suele usar `@nestjs/config` con `ConfigModule.forRoot`).

### 3.3. Verificar que el módulo de mail esté cargado

Archivo clave: `apps/backend/src/presentation/presentation-common.module.ts`.

Puntos a revisar:
- `imports: [UserUseCasesModule, MailModule]` → **MailModule está importado**.
- Provider:
  - `provide: 'INotificationService', useClass: MailService`.

Esto ya está correcto en el repo, pero si se cambió algo, volver a este esquema.

### 3.4. Verificar que las plantillas existan

En `apps/backend/src/infrastructure/notifications/templates/` deberían existir:
- `profile-created.hbs`
- `reservation-confirmation.hbs`

Si no existen, hay que crearlas (según el diseño de `EMAIL_TEMPLATES.md`).

### 3.5. Probar envío en flujo de **creación de cliente**

1. Levantar backend en local:
   ```bash
   cd "apps/backend"
   npm install
   npm run start:dev
   ```
2. Crear cliente desde el frontend o vía API (Postman/Thunder Client) usando el endpoint de crear cliente.
3. Confirmar que en la respuesta viene el campo `temporaryPassword`.
4. Abrir `http://localhost:8025` (MailHog) y verificar que llegó un email de:
   - Asunto: parecido a `Bienvenido a MyHotelFlow, {nombre}`.
   - Cuerpo: contiene la contraseña temporal.

Si no llega:
- Revisar logs del backend: debería aparecer `Enviando email de creación de perfil a ...` o un error concreto.
- Verificar que el mail del cliente es válido (no vacío ni mal formado).

### 3.6. Probar envío en flujo de **creación de reserva**

1. Con backend y MailHog levantados, ir al frontend y abrir el wizard de creación de reserva.
2. Seleccionar un cliente con email válido.
3. Marcar el checkbox **"Notificar por Email"** (esto hace que `notifyByEmail` sea `true`).
4. Completar la reserva hasta el final.
5. Verificar en MailHog:
   - Nuevo correo con asunto tipo: `Reserva confirmada — ...`.
   - Contenido con fechas, habitación y total.

Si no llega:
- Revisar logs del backend (`Error enviando email de reserva:`).
- Comprobar que `notifyByEmail` llega como `true` en el DTO (`CreateReservationDto`).

---

## 4. Checklist rápido de cosas que pueden estar fallando

1. **No hay servidor SMTP**
   - Solución: levantar MailHog y apuntar `MAIL_HOST`/`MAIL_PORT`.

2. **.env del backend mal configurado o no cargado**
   - Verificar rutas, nombres de variables y reiniciar el backend tras cambios.

3. **Plantillas de email faltan o tienen errores**
   - Confirmar existencia de `profile-created.hbs` y `reservation-confirmation.hbs`.
   - Corregir placeholders inválidos de Handlebars.

4. **notifyByEmail = false o no se envía desde el front**
   - Confirmar que el checkbox de notificación está marcado y que el front manda `notifyByEmail: true` en el payload.

5. **Email del cliente vacío o inválido**
   - Revisar que el cliente tenga un email correcto guardado.

6. **Errores en Twilio / SMS (no rompe email)**
   - Si Twilio no está configurado, sólo se loguea un warning para SMS. No afecta al envío de emails.

---

## 5. Resumen

- El código para enviar emails en **creación de cliente** y **creación de reserva** ya está implementado.
- Lo más probable es que el problema sea **configuración de SMTP / .env / plantillas**.
- Siguiendo los pasos de las secciones 3.1 a 3.6 deberías poder ver los correos en MailHog y confirmar que el flujo funciona.

Si quieres, el siguiente paso que puedo hacer es revisar tus `.env` concretos (sin subir secretos) y ajustar la config para tu entorno (dev / prod).