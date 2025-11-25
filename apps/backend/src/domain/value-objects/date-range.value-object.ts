/**
 * DateRange Value Object
 * Patrón: Value Object - DDD
 * Capa: Domain
 * Responsabilidad: Representar un rango de fechas inmutable con validaciones de negocio
 */
export class DateRange {
  private readonly _startDate: Date;
  private readonly _endDate: Date;

  constructor(startDate: Date, endDate: Date) {
    // Validar que las fechas sean válidas
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      throw new Error('Fecha de inicio inválida');
    }

    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      throw new Error('Fecha de fin inválida');
    }

    // Normalizar fechas a medianoche
    const normalizedStart = this.normalizeDate(startDate);
    const normalizedEnd = this.normalizeDate(endDate);

    // Validar que la fecha de inicio sea anterior a la de fin
    if (normalizedStart >= normalizedEnd) {
      throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    // Validar que la fecha de inicio no sea anterior a hoy
    // Comparamos solo las fechas (año, mes, día) ignorando la hora
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    const startDateOnly = normalizedStart.getDate();
    const startMonth = normalizedStart.getMonth();
    const startYear = normalizedStart.getFullYear();

    // Comparar año, luego mes, luego día
    if (
      startYear < todayYear ||
      (startYear === todayYear && startMonth < todayMonth) ||
      (startYear === todayYear &&
        startMonth === todayMonth &&
        startDateOnly < todayDate)
    ) {
      throw new Error('La fecha de inicio no puede ser en el pasado');
    }

    this._startDate = normalizedStart;
    this._endDate = normalizedEnd;
  }

  // Getters
  get startDate(): Date {
    return new Date(this._startDate);
  }

  get endDate(): Date {
    return new Date(this._endDate);
  }

  /**
   * Calcular cantidad de noches entre las fechas
   */
  getNights(): number {
    const diffTime = this._endDate.getTime() - this._startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Verificar si un rango de fechas se superpone con otro
   */
  overlaps(other: DateRange): boolean {
    return this._startDate < other._endDate && this._endDate > other._startDate;
  }

  /**
   * Verificar si una fecha específica está dentro del rango
   */
  contains(date: Date): boolean {
    const normalized = this.normalizeDate(date);
    return normalized >= this._startDate && normalized < this._endDate;
  }

  /**
   * Verificar si este rango es igual a otro
   */
  equals(other: DateRange): boolean {
    return (
      this._startDate.getTime() === other._startDate.getTime() &&
      this._endDate.getTime() === other._endDate.getTime()
    );
  }

  /**
   * Obtener representación en string del rango
   */
  toString(): string {
    return `${this.formatDate(this._startDate)} - ${this.formatDate(this._endDate)}`;
  }

  /**
   * Normalizar fecha a medianoche (00:00:00) en hora local
   * Maneja correctamente fechas parseadas desde strings ISO
   */
  private normalizeDate(date: Date): Date {
    // Crear una nueva fecha usando año, mes y día locales
    // para evitar problemas con zonas horarias
    const normalized = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
      0,
    );
    return normalized;
  }

  /**
   * Formatear fecha como DD/MM/YYYY
   */
  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Crear DateRange desde strings ISO
   */
  static fromStrings(startDateStr: string, endDateStr: string): DateRange {
    // Validar que los strings no estén vacíos
    if (!startDateStr || !endDateStr) {
      throw new Error('Las fechas no pueden estar vacías');
    }

    try {
      // Parsear las fechas en hora local para evitar problemas de zona horaria
      // "2025-11-01" -> Date(2025, 10, 1) en hora local
      const [startYear, startMonth, startDay] = startDateStr
        .split('-')
        .map(Number);
      const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);

      const startDate = new Date(
        startYear,
        startMonth - 1,
        startDay,
        0,
        0,
        0,
        0,
      );
      const endDate = new Date(endYear, endMonth - 1, endDay, 0, 0, 0, 0);

      // Validar que las fechas sean válidas después de parsearlas
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Fechas inválidas');
      }

      return new DateRange(startDate, endDate);
    } catch (error) {
      if (error instanceof Error && error.message !== 'Fechas inválidas') {
        // Propagar errores del constructor de DateRange
        throw error;
      }
      throw new Error(
        'Error al crear DateRange desde strings: ' +
          (error instanceof Error ? error.message : 'Formato inválido'),
      );
    }
  }

  /**
   * Validar si un rango de fechas tiene una duración mínima
   */
  hasMinimumDuration(minNights: number): boolean {
    return this.getNights() >= minNights;
  }

  /**
   * Validar si un rango de fechas tiene una duración máxima
   */
  hasMaximumDuration(maxNights: number): boolean {
    return this.getNights() <= maxNights;
  }

  /**
   * Obtener array con todas las fechas del rango
   */
  getDates(): Date[] {
    const dates: Date[] = [];
    const current = new Date(this._startDate);

    while (current < this._endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }
}
