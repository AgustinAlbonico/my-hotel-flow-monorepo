import * as crypto from 'crypto';
import type { DNI } from '../value-objects/dni.value-object';
import type { Email } from '../value-objects/email.value-object';
import type { Phone } from '../value-objects/phone.value-object';
import { Group } from './group.entity';

export class Client {
  private readonly _id: number;
  private readonly _dni: DNI;
  private _firstName: string;
  private _lastName: string;
  private _email: Email;
  private _phone: Phone | null;
  private _birthDate: Date | null;
  private _address: string | null;
  private _city: string | null;
  private _country: string | null;
  private _nationality: string | null;
  private _observations: string | null;
  private _password: string;
  private _isActive: boolean;
  private _outstandingBalance: number; // Saldo pendiente/deuda
  private _groups: Group[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private _passwordResetToken?: string;
  private _passwordResetExpires?: Date;
  private static readonly PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;

  private constructor(data: {
    id: number;
    dni: DNI;
    firstName: string;
    lastName: string;
    email: Email;
    phone: Phone | null;
    birthDate: Date | null;
    address: string | null;
    city: string | null;
    country: string | null;
    nationality: string | null;
    observations: string | null;
    password: string;
    isActive: boolean;
    outstandingBalance: number;
    groups: Group[];
    createdAt: Date;
    updatedAt: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
  }) {
    this._id = data.id;
    this._dni = data.dni;
    this._firstName = data.firstName;
    this._lastName = data.lastName;
    this._email = data.email;
    this._phone = data.phone;
    this._birthDate = data.birthDate;
    this._address = data.address;
    this._city = data.city;
    this._country = data.country;
    this._nationality = data.nationality;
    this._observations = data.observations;
    this._password = data.password;
    this._isActive = data.isActive;
    this._outstandingBalance = data.outstandingBalance;
    this._groups = data.groups;
    this._createdAt = data.createdAt;
    this._updatedAt = data.updatedAt;
    this._passwordResetToken = data.passwordResetToken;
    this._passwordResetExpires = data.passwordResetExpires;
  }

  static create(
    dni: DNI,
    firstName: string,
    lastName: string,
    email: Email,
    phone: Phone | null,
  ): Client {
    return new Client({
      id: 0,
      dni,
      firstName,
      lastName,
      email,
      phone,
      birthDate: null,
      address: null,
      city: null,
      country: null,
      nationality: null,
      observations: null,
      password: '',
      isActive: true,
      outstandingBalance: 0,
      groups: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstruct(data: {
    id: number;
    dni: DNI;
    firstName: string;
    lastName: string;
    email: Email;
    phone: Phone | null;
    birthDate: Date | null;
    address: string | null;
    city: string | null;
    country: string | null;
    nationality: string | null;
    observations: string | null;
    password: string;
    isActive: boolean;
    outstandingBalance: number;
    groups: Group[];
    createdAt: Date;
    updatedAt: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
  }): Client {
    return new Client(data);
  }

  static generatePassword(): string {
    return crypto.randomBytes(4).toString('hex');
  }

  get id(): number {
    return this._id;
  }
  get dni(): DNI {
    return this._dni;
  }
  get firstName(): string {
    return this._firstName;
  }
  get lastName(): string {
    return this._lastName;
  }
  get email(): Email {
    return this._email;
  }
  get phone(): Phone | null {
    return this._phone;
  }
  get birthDate(): Date | null {
    return this._birthDate;
  }
  get address(): string | null {
    return this._address;
  }
  get city(): string | null {
    return this._city;
  }
  get country(): string | null {
    return this._country;
  }
  get nationality(): string | null {
    return this._nationality;
  }
  get observations(): string | null {
    return this._observations;
  }
  get password(): string {
    return this._password;
  }
  get isActive(): boolean {
    return this._isActive;
  }
  get groups(): Group[] {
    return this._groups;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
  get passwordResetToken(): string | undefined {
    return this._passwordResetToken;
  }
  get passwordResetExpires(): Date | undefined {
    return this._passwordResetExpires;
  }

  get outstandingBalance(): number {
    return this._outstandingBalance;
  }

  /**
   * Verifica si el cliente tiene deudas pendientes
   */
  hasOutstandingDebt(): boolean {
    return this._outstandingBalance > 0;
  }

  /**
   * Incrementa el saldo pendiente del cliente
   */
  addDebt(amount: number): void {
    if (amount <= 0) {
      throw new Error('El monto de la deuda debe ser mayor a 0');
    }
    this._outstandingBalance += amount;
    this._updatedAt = new Date();
  }

  /**
   * Reduce el saldo pendiente del cliente
   */
  reduceDebt(amount: number): void {
    if (amount <= 0) {
      throw new Error('El monto del pago debe ser mayor a 0');
    }
    if (amount > this._outstandingBalance) {
      throw new Error(
        `El pago ($${amount}) excede el saldo pendiente ($${this._outstandingBalance})`,
      );
    }
    this._outstandingBalance -= amount;
    this._updatedAt = new Date();
  }

  setPassword(hashedPassword: string): void {
    this._password = hashedPassword;
    this._updatedAt = new Date();
  }

  updateEmail(email: Email): void {
    this._email = email;
    this._updatedAt = new Date();
  }

  updatePhone(phone: Phone | null): void {
    this._phone = phone;
    this._updatedAt = new Date();
  }

  updatePersonalInfo(firstName: string, lastName: string): void {
    this._firstName = firstName;
    this._lastName = lastName;
    this._updatedAt = new Date();
  }

  updateContactInfo(email: Email, phone: Phone | null): void {
    this._email = email;
    this._phone = phone;
    this._updatedAt = new Date();
  }

  updateAdditionalInfo(
    birthDate: Date | null,
    address: string | null,
    city: string | null,
    country: string | null,
    nationality: string | null,
    observations: string | null,
  ): void {
    this._birthDate = birthDate;
    this._address = address;
    this._city = city;
    this._country = country;
    this._nationality = nationality;
    this._observations = observations;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  addGroup(group: Group): void {
    if (!this._groups.find((g) => g.id === group.id)) {
      this._groups.push(group);
      this._updatedAt = new Date();
    }
  }

  removeGroup(groupId: number): void {
    this._groups = this._groups.filter((g) => g.id !== groupId);
    this._updatedAt = new Date();
  }

  /**
   * Genera un token de recuperación de contraseña
   */
  generatePasswordResetToken(): string {
    const token = crypto.randomBytes(32).toString('hex');
    this._passwordResetToken = token;
    const now = new Date();
    this._passwordResetExpires = new Date(
      now.getTime() + Client.PASSWORD_RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
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
   * Limpia el token de recuperación de contraseña
   */
  clearPasswordResetToken(): void {
    this._passwordResetToken = undefined;
    this._passwordResetExpires = undefined;
    this._updatedAt = new Date();
  }
}
