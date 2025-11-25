## Plantillas de Email — MyHotelFlow

Documento con plantillas de correo transaccional para MyHotelFlow.

Se usan variables tipo `{{nombre}}` y estilos inspirados en el `DESIGN_SYSTEM.md` del proyecto. Las plantillas están pensadas para envíos transaccionales: creación de perfil y confirmación de reserva. Incluyen versión HTML (con estilos inline para máxima compatibilidad), texto plano y ejemplos de payload.

---

## 1 — Notas generales

- From recomendado: "MyHotelFlow <no-reply@myhotelflow.example>"
- Reply-To: soporte@myhotelflow.example
- Headers sugeridos: `List-Unsubscribe` (cuando aplique), `Precedence: bulk` (si corresponde), `X-Entity-Ref: reservation-{{reservation_id}}`.
- Encoding: UTF-8.
- Plantillas deben incluir versión texto plano para clientes que no renderizan HTML.
- Usar valores dinámicos/templating del backend al enviar (ej. handlebars, mustache, ejs, o string replace seguro).

## 2 — Variables disponibles (ejemplo)

Usar estos placeholders en las plantillas:

- `{{customer_name}}` — Nombre del cliente
- `{{customer_email}}` — Email
- `{{reservation_id}}`
- `{{hotel_name}}`
- `{{room_type}}`
- `{{checkin_date}}`
- `{{checkout_date}}`
- `{{nights}}`
- `{{guests}}`
- `{{total_price}}`
- `{{currency}}`
- `{{booking_link}}` — link para ver/editar reserva
- `{{support_email}}`

---

## 3 — Paleta y tokens (adaptados del DESIGN_SYSTEM)

Usaremos una versión reducida de tu sistema de diseño para emails (colores en HEX):

- Primary: `#3b82f6` (primary-500)
- Primary dark: `#2563eb` (primary-600)
- Accent / gold: `#eab308`
- Success: `#10b981`
- Text principal: `#111827` (gray-900)
- Text secundario: `#6b7280` (gray-500)
- Background: `#ffffff` / exterior `#f9fafb` (gray-50)

En emails hay que preferir estilos inline y evitar dependencias JS.

---

## 4 — Plantilla: Creación de perfil (HTML + texto plano)

Subject sugerido: "Bienvenido a MyHotelFlow, {{customer_name}} — Activa tu cuenta"

HTML (compatible, con estilos inline):

```html
<!-- MAIL: Creación de perfil (HTML) -->
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Bienvenido a MyHotelFlow</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f9fafb;font-family:Inter, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <!-- Header -->
            <tr>
              <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;">
                <img src="CID_OR_URL_LOGO" alt="MyHotelFlow" width="140" style="display:block;border:0;outline:none;text-decoration:none;" />
              </td>
            </tr>

            <!-- Hero -->
            <tr>
              <td style="padding:28px 24px 18px 24px;">
                <h1 style="margin:0;font-size:20px;color:#111827;font-weight:700;">Bienvenido a MyHotelFlow, {{customer_name}} 🎉</h1>
                <p style="margin:12px 0 0 0;color:#6b7280;line-height:1.4;font-size:14px;">Tu perfil ha sido creado correctamente. Puedes activar tu cuenta y completar los datos usando el siguiente botón.</p>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td style="padding:0 24px 24px 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="left">
                      <a href="{{activation_link}}" style="display:inline-block;padding:12px 20px;background:#3b82f6;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Activar mi cuenta</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Info -->
            <tr>
              <td style="padding:0 24px 28px 24px;border-top:1px solid #f3f4f6;">
                <p style="margin:12px 0 0 0;color:#6b7280;font-size:13px;">Si no solicitaste este correo, ignóralo o contáctanos en <a href="mailto:{{support_email}}" style="color:#2563eb;text-decoration:none;">{{support_email}}</a>.</p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:16px 24px;background:#f9fafb;color:#9ca3af;font-size:12px;text-align:center;">© {{year}} MyHotelFlow. Todos los derechos reservados.</td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

Texto plano (fallback):

```
Asunto: Bienvenido a MyHotelFlow, {{customer_name}}

Hola {{customer_name}},

Tu cuenta ha sido creada en MyHotelFlow.
Activa tu cuenta aquí: {{activation_link}}

Si no solicitaste esta cuenta, contacta a {{support_email}}.

— El equipo de MyHotelFlow
```

---

## 5 — Plantilla: Confirmación de reserva (HTML + texto plano)

Subject sugerido: "Reserva confirmada — {{hotel_name}} ({{checkin_date}} – {{checkout_date}})"

HTML (inlined, tabla para compatibilidad):

```html
<!-- MAIL: Confirmación de reserva (HTML) -->
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reserva confirmada</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f9fafb;font-family:Inter, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">
                <img src="CID_OR_URL_LOGO" alt="MyHotelFlow" width="140" style="display:block;border:0;outline:none;text-decoration:none;" />
              </td>
            </tr>

            <tr>
              <td style="padding:20px 24px;">
                <h2 style="margin:0;font-size:18px;color:#111827;font-weight:700;">Reserva confirmada — {{hotel_name}}</h2>
                <p style="margin:8px 0 16px 0;color:#6b7280;font-size:14px;">Gracias {{customer_name}}. Tu reserva ha sido confirmada. Aquí tienes los detalles:</p>

                <!-- Detalles de la reserva -->
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;margin-bottom:16px;">
                  <tr>
                    <td style="padding:8px 0;color:#6b7280;font-size:13px;width:35%;">Reserva</td>
                    <td style="padding:8px 0;color:#111827;font-weight:600;font-size:13px;">#{{reservation_id}}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#6b7280;font-size:13px;">Check-in</td>
                    <td style="padding:8px 0;color:#111827;font-weight:600;font-size:13px;">{{checkin_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#6b7280;font-size:13px;">Check-out</td>
                    <td style="padding:8px 0;color:#111827;font-weight:600;font-size:13px;">{{checkout_date}}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#6b7280;font-size:13px;">Habitación</td>
                    <td style="padding:8px 0;color:#111827;font-weight:600;font-size:13px;">{{room_type}} · {{guests}} huésped(es)</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#6b7280;font-size:13px;">Total</td>
                    <td style="padding:8px 0;color:#111827;font-weight:700;font-size:16px;">{{currency}} {{total_price}}</td>
                  </tr>
                </table>

                <!-- CTA -->
                <p style="margin:12px 0 12px 0;"><a href="{{booking_link}}" style="display:inline-block;padding:10px 16px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Ver mi reserva</a></p>

                <p style="margin:0;color:#6b7280;font-size:13px;">Si necesitas cambiar algo, entra a tu perfil o contáctanos en <a href="mailto:{{support_email}}" style="color:#2563eb;text-decoration:none;">{{support_email}}</a>.</p>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 24px;background:#f9fafb;color:#9ca3af;font-size:12px;text-align:center;">© {{year}} MyHotelFlow</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

Texto plano (fallback):

```
Asunto: Reserva confirmada — {{hotel_name}} ({{checkin_date}} – {{checkout_date}})

Hola {{customer_name}},

Tu reserva #{{reservation_id}} ha sido confirmada.

Check-in: {{checkin_date}}
Check-out: {{checkout_date}}
Habitación: {{room_type}}
Huéspedes: {{guests}}
Total: {{currency}} {{total_price}}

Ver/editar: {{booking_link}}

Si necesitas ayuda: {{support_email}}

— MyHotelFlow
```

---

## 6 — SMS vs Email: comportamiento esperado

- Cuando el usuario selecciona "Enviar notificación por mail": enviar la plantilla de email con variables rellenadas.
- Cuando selecciona "Enviar notificación por SMS": enviar SMS con resumen minimalista (texto corto) — ejemplo:

  "Reserva confirmada: {{hotel_name}} {{checkin_date}}-{{checkout_date}}. Total: {{currency}} {{total_price}}. Ref: {{reservation_id}}"

- Si ambos seleccionados, enviar por ambos canales.

## 7 — Ejemplo de payload JSON (backend)

```json
{
  "to": "cliente@correo.example",
  "channel": "email",
  "template": "reservation_confirmation",
  "variables": {
    "customer_name": "Agustín",
    "reservation_id": "ABC123",
    "hotel_name": "Hotel Central",
    "checkin_date": "2025-12-10",
    "checkout_date": "2025-12-13",
    "room_type": "Suite Deluxe",
    "nights": 3,
    "guests": 2,
    "total_price": "446.00",
    "currency": "$",
    "booking_link": "https://app.myhotelflow.example/bookings/ABC123",
    "support_email": "soporte@myhotelflow.example"
  }
}
```

## 8 — Sugerencias de integración (backend)

- Recomendado: usar un servicio de envío transaccional (SendGrid, Mailgun, Amazon SES) o `nodemailer` con un SMTP seguro para ambiente de pruebas.
- Generar el HTML en el backend con un motor de plantillas (handlebars/ejs) y asegurarse de escapar/validar variables.
- Adjuntar cabeceras: Message-ID, In-Reply-To si aplica, y `X-Mailer: MyHotelFlow`.
- Para imágenes: preferir CID o links HTTPS públicos.

## 9 — Checklist de pruebas antes de producción

- [ ] Render en Gmail (web + móvil)
- [ ] Render en Outlook (desktop) — verificar que el layout basado en tablas se vea correcto
- [ ] Render en Apple Mail
- [ ] Texto plano legible y con links
- [ ] Enlaces de tracking (si se usan) funcionan y el `booking_link` apunta al entorno correcto (staging vs prod)
- [ ] Entrega: SPF / DKIM / DMARC configurados para el dominio de envío
- [ ] Pruebas de carga: throttle para evitar bloqueos por SPAM
- [ ] Verificar que los placeholders no queden sin reemplazar (fallbacks seguros)

## 10 — Accesibilidad y buenas prácticas

- Usar texto alternativo en imágenes (`alt`).
- Contraste suficiente para texto importante (usa primary para CTA y texto oscuro para contenido).
- Tamaño de fuente legible (mínimo 13px para cuerpo en HTML emails).
- Añadir role/presentation en tablas de layout si procede.

## 11 — Notas finales y próximos pasos

- Este archivo es la referencia para las plantillas. Puedo generar versiones handlebars/jinja o integrarlas directamente en el servicio de notificaciones si quieres.
- Siguientes pasos recomendados:
  1. Implementar template renderer en backend (handlebars) y probar con nodemailer / SES en staging.
  2. Configurar registros SPF/DKIM para dominio.
  3. Realizar pruebas manuales en 3 clientes de email principales.

---

Archivo generado automáticamente desde la especificación del sistema de diseño y requisitos de notificación.
