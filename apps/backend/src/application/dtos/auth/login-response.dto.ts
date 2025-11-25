/**
 * Login Response DTO
 *
 * Data Transfer Object for successful login responses.
 * Contains access token, refresh token, and user information.
 */
export class LoginResponseDto {
  /**
   * JWT access token
   */
  accessToken: string;

  /**
   * JWT refresh token
   */
  refreshToken: string;

  /**
   * User ID
   */
  userId: number;

  /**
   * Username
   */
  username: string;

  /**
   * User email
   */
  email: string;

  /**
   * User's group IDs
   */
  groupIds: number[];

  /**
   * User's direct action keys
   */
  actionKeys: string[];

  constructor(data: {
    accessToken: string;
    refreshToken: string;
    userId: number;
    username: string;
    email: string;
    groupIds: number[];
    actionKeys: string[];
  }) {
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.userId = data.userId;
    this.username = data.username;
    this.email = data.email;
    this.groupIds = data.groupIds;
    this.actionKeys = data.actionKeys;
  }
}
