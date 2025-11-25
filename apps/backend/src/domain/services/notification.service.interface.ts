/**
 * Interfaz de servicio de notificaciones
 * Define el contrato para el envío de emails y SMS desde la capa de dominio
 */

export interface IEmailVariables {
  [key: string]: string | number | boolean | undefined | null;
}

export interface INotificationService {
  /**
   * Enviar email de creación de perfil
   * @param to - dirección de destino
   * @param variables - variables para la plantilla
   */
  sendProfileCreated(to: string, variables: IEmailVariables): Promise<void>;

  /**
   * Enviar email de confirmación de reserva
   * @param to - dirección de destino
   * @param variables - variables para la plantilla
   */
  sendReservationConfirmation(
    to: string,
    variables: IEmailVariables,
  ): Promise<void>;

  /**
   * Enviar SMS (implementación opcional)
   * @param to - número destino en formato E.164
   * @param message - texto del SMS
   */
  sendSMS(to: string, message: string): Promise<void>;
}
