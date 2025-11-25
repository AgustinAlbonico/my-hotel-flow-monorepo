/**
 * Change Password DTO
 *
 * Data Transfer Object for password change requests.
 * Requires current password verification before allowing change.
 */
export class ChangePasswordDto {
  /**
   * Current password for verification
   */
  currentPassword: string;

  /**
   * New password to set
   */
  newPassword: string;

  constructor(data: { currentPassword: string; newPassword: string }) {
    this.currentPassword = data.currentPassword;
    this.newPassword = data.newPassword;
  }
}
