/**
 * Reset Password With Token DTO
 *
 * Data Transfer Object for password reset using a token.
 * Used when user resets password via email link.
 */
export class ResetPasswordWithTokenDto {
  /**
   * Password reset token received via email
   */
  token: string;

  /**
   * New password to set
   */
  newPassword: string;

  constructor(data: { token: string; newPassword: string }) {
    this.token = data.token;
    this.newPassword = data.newPassword;
  }
}
