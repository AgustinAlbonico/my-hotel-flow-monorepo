/**
 * Forgot Password DTO
 *
 * Data Transfer Object for forgot password requests.
 * Initiates password reset process by generating a reset token.
 */
export class ForgotPasswordDto {
  /**
   * Email address to send password reset token
   */
  email: string;

  constructor(data: { email: string }) {
    this.email = data.email;
  }
}
