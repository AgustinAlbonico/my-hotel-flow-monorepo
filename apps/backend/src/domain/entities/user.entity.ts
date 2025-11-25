/**
 * User Domain Entity
 * Entidad de dominio que representa un usuario del sistema
 *
 * Responsabilidades:
 * - Validar datos del usuario
 * - Gestionar el estado de bloqueo por intentos fallidos
 * - Gestionar grupos y acciones asignadas
 * - Calcular permisos efectivos (heredados de grupos)
 * - Gestionar tokens de recuperación de contraseña
 */

import { randomBytes } from 'crypto';
import { Email } from '../value-objects/email.vo';
import { UserLockedException } from '../exceptions/user-locked.exception';
import { UserNotActiveException } from '../exceptions/user-not-active.exception';
import { Group } from './group.entity';
import { Action } from './action.entity';

export class User {
  private readonly _id: number;
  private _username: string;
  private _email: Email;
  private _passwordHash: string;
  private _fullName?: string;
  private _isActive: boolean;
  private _lastLoginAt?: Date;
  private _failedLoginAttempts: number;
  private _lockedUntil?: Date;
  private _groups: Group[];
  private _actions: Action[];
  private _passwordResetToken?: string;
  private _passwordResetExpires?: Date;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  // Constantes de negocio
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MINUTES = 15;
  private static readonly PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;

  constructor(
    id: number,
    username: string,
    email: Email,
    passwordHash: string,
    fullName: string | undefined,
    isActive: boolean,
    lastLoginAt: Date | undefined,
    failedLoginAttempts: number,
    lockedUntil: Date | undefined,
    groups: Group[],
    actions: Action[],
    passwordResetToken: string | undefined,
    passwordResetExpires: Date | undefined,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this._id = id;
    this._username = username;
    this._email = email;
    this._passwordHash = passwordHash;
    this._fullName = fullName;
    this._isActive = isActive;
    this._lastLoginAt = lastLoginAt;
    this._failedLoginAttempts = failedLoginAttempts;
    this._lockedUntil = lockedUntil;
    this._groups = groups;
    this._actions = actions;
    this._passwordResetToken = passwordResetToken;
    this._passwordResetExpires = passwordResetExpires;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;

    this.validate();
  }

  // Getters
  get id(): number {
    return this._id;
  }

  get username(): string {
    return this._username;
  }

  get email(): Email {
    return this._email;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  get fullName(): string | undefined {
    return this._fullName;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get lastLoginAt(): Date | undefined {
    return this._lastLoginAt;
  }

  get failedLoginAttempts(): number {
    return this._failedLoginAttempts;
  }

  get lockedUntil(): Date | undefined {
    return this._lockedUntil;
  }

  get groups(): Group[] {
    return [...this._groups];
  }

  get actions(): Action[] {
    return [...this._actions];
  }

  get passwordResetToken(): string | undefined {
    return this._passwordResetToken;
  }

  get passwordResetExpires(): Date | undefined {
    return this._passwordResetExpires;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Valida que el usuario tenga datos consistentes
   */
  private validate(): void {
    if (!this._username || this._username.trim().length === 0) {
      throw new Error('Username cannot be empty');
    }

    if (this._username.length > 50) {
      throw new Error('Username cannot exceed 50 characters');
    }

    if (!this._passwordHash || this._passwordHash.length === 0) {
      throw new Error('Password hash cannot be empty');
    }

    if (this._fullName && this._fullName.length > 255) {
      throw new Error('Full name cannot exceed 255 characters');
    }
  }

  /**
   * Actualiza la información básica del usuario
   */
  updateInfo(fullName?: string): void {
    if (fullName !== undefined) {
      this._fullName = fullName;
    }
    this._updatedAt = new Date();
    this.validate();
  }

  /**
   * Actualiza el email del usuario
   */
  updateEmail(email: Email): void {
    this._email = email;
    this._updatedAt = new Date();
  }

  /**
   * Actualiza el hash de la contraseña
   */
  updatePasswordHash(passwordHash: string): void {
    if (!passwordHash || passwordHash.length === 0) {
      throw new Error('Password hash cannot be empty');
    }
    this._passwordHash = passwordHash;
    this._updatedAt = new Date();
  }

  /**
   * Activa el usuario
   */
  activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * Desactiva el usuario
   */
  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  /**
   * Verifica si el usuario está actualmente bloqueado
   */
  isLocked(): boolean {
    if (!this._lockedUntil) {
      return false;
    }
    return new Date() < this._lockedUntil;
  }

  /**
   * Obtiene los minutos restantes de bloqueo
   */
  getRemainingLockoutMinutes(): number {
    if (!this._lockedUntil) {
      return 0;
    }

    const now = new Date();
    const remainingMs = this._lockedUntil.getTime() - now.getTime();

    if (remainingMs <= 0) {
      return 0;
    }

    return Math.ceil(remainingMs / (60 * 1000));
  }

  /**
   * Verifica si el usuario puede iniciar sesión
   * Lanza excepciones si no puede
   */
  canLogin(): void {
    if (!this._isActive) {
      throw new UserNotActiveException(this._username);
    }

    if (this.isLocked()) {
      const now = new Date();
      const remainingMs = this._lockedUntil!.getTime() - now.getTime();
      const remainingMinutes = Math.ceil(remainingMs / 1000 / 60);
      throw new UserLockedException(this._lockedUntil!, remainingMinutes);
    }
  }

  /**
   * Registra un intento fallido de login
   * Bloquea el usuario si alcanza el máximo de intentos
   */
  recordFailedLoginAttempt(): void {
    this._failedLoginAttempts += 1;
    this._updatedAt = new Date();

    if (this._failedLoginAttempts >= User.MAX_FAILED_ATTEMPTS) {
      this.lockAccount();
    }
  }

  /**
   * Bloquea la cuenta por el tiempo definido
   */
  private lockAccount(): void {
    const now = new Date();
    this._lockedUntil = new Date(
      now.getTime() + User.LOCKOUT_DURATION_MINUTES * 60 * 1000,
    );
    this._updatedAt = new Date();
  }

  /**
   * Registra un login exitoso
   * Resetea intentos fallidos y actualiza fecha de último login
   */
  recordSuccessfulLogin(): void {
    this._failedLoginAttempts = 0;
    this._lockedUntil = undefined;
    this._lastLoginAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * Desbloquea manualmente la cuenta (admin action)
   */
  unlock(): void {
    this._failedLoginAttempts = 0;
    this._lockedUntil = undefined;
    this._updatedAt = new Date();
  }

  /**
   * Asigna grupos al usuario (reemplaza los existentes)
   */
  assignGroups(groups: Group[]): void {
    this._groups = [...groups];
    this._updatedAt = new Date();
  }

  /**
   * Añade un grupo al usuario
   */
  addGroup(group: Group): void {
    if (!this.hasGroup(group.id)) {
      this._groups.push(group);
      this._updatedAt = new Date();
    }
  }

  /**
   * Elimina un grupo del usuario
   */
  removeGroup(groupId: number): void {
    this._groups = this._groups.filter((g) => g.id !== groupId);
    this._updatedAt = new Date();
  }

  /**
   * Verifica si el usuario tiene un grupo específico
   */
  hasGroup(groupId: number): boolean {
    return this._groups.some((g) => g.id === groupId);
  }

  /**
   * Asigna acciones directas al usuario (reemplaza las existentes)
   */
  assignActions(actions: Action[]): void {
    this._actions = [...actions];
    this._updatedAt = new Date();
  }

  /**
   * Añade una acción al usuario
   */
  addAction(action: Action): void {
    if (!this.hasAction(action.id)) {
      this._actions.push(action);
      this._updatedAt = new Date();
    }
  }

  /**
   * Elimina una acción del usuario
   */
  removeAction(actionId: number): void {
    this._actions = this._actions.filter((a) => a.id !== actionId);
    this._updatedAt = new Date();
  }

  /**
   * Verifica si el usuario tiene una acción directa
   */
  hasAction(actionId: number): boolean {
    return this._actions.some((a) => a.id === actionId);
  }

  /**
   * Obtiene todas las acciones efectivas del usuario
   * Incluye: acciones directas + acciones de grupos + acciones de grupos hijos
   */
  getInheritedActions(): Action[] {
    const actionMap = new Map<number, Action>();

    // Agregar acciones directas
    for (const action of this._actions) {
      actionMap.set(action.id, action);
    }

    // Agregar acciones de grupos (incluyendo efectivas de hijos)
    for (const group of this._groups) {
      const groupActions = group.getEffectiveActions();
      for (const action of groupActions) {
        actionMap.set(action.id, action);
      }
    }

    return Array.from(actionMap.values());
  }

  /**
   * Verifica si el usuario tiene una acción efectiva (directa o heredada)
   */
  hasInheritedAction(actionId: number): boolean {
    return this.getInheritedActions().some((a) => a.id === actionId);
  }

  /**
   * Verifica si el usuario tiene una acción efectiva por key
   */
  hasInheritedActionByKey(actionKey: string): boolean {
    return this.getInheritedActions().some((a) => a.key === actionKey);
  }

  /**
   * Genera un token de recuperación de contraseña
   * Retorna el token generado
   */
  generatePasswordResetToken(): string {
    // Generar token seguro (32 bytes = 64 caracteres hex)
    const token = randomBytes(32).toString('hex');

    this._passwordResetToken = token;
    const now = new Date();
    this._passwordResetExpires = new Date(
      now.getTime() + User.PASSWORD_RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    );
    this._updatedAt = new Date();

    return token;
  }

  /**
   * Valida y consume el token de recuperación de contraseña
   */
  validatePasswordResetToken(token: string): boolean {
    if (!this._passwordResetToken || !this._passwordResetExpires) {
      return false;
    }

    if (this._passwordResetToken !== token) {
      return false;
    }

    if (new Date() > this._passwordResetExpires) {
      return false;
    }

    return true;
  }

  /**
   * Limpia el token de recuperación de contraseña después de usarse
   */
  clearPasswordResetToken(): void {
    this._passwordResetToken = undefined;
    this._passwordResetExpires = undefined;
    this._updatedAt = new Date();
  }

  /**
   * Factory method para crear un nuevo usuario
   */
  static create(
    username: string,
    email: Email,
    passwordHash: string,
    fullName?: string,
  ): User {
    return new User(
      0, // El ID será asignado por la base de datos
      username,
      email,
      passwordHash,
      fullName,
      true, // isActive por defecto
      undefined, // lastLoginAt
      0, // failedLoginAttempts
      undefined, // lockedUntil
      [], // groups
      [], // actions
      undefined, // passwordResetToken
      undefined, // passwordResetExpires
      new Date(),
      new Date(),
    );
  }

  /**
   * Factory method para reconstruir un usuario desde la persistencia
   */
  static reconstruct(
    id: number,
    username: string,
    email: Email,
    passwordHash: string,
    fullName: string | undefined,
    isActive: boolean,
    lastLoginAt: Date | undefined,
    failedLoginAttempts: number,
    lockedUntil: Date | undefined,
    groups: Group[],
    actions: Action[],
    passwordResetToken: string | undefined,
    passwordResetExpires: Date | undefined,
    createdAt: Date,
    updatedAt: Date,
  ): User {
    return new User(
      id,
      username,
      email,
      passwordHash,
      fullName,
      isActive,
      lastLoginAt,
      failedLoginAttempts,
      lockedUntil,
      groups,
      actions,
      passwordResetToken,
      passwordResetExpires,
      createdAt,
      updatedAt,
    );
  }
}
