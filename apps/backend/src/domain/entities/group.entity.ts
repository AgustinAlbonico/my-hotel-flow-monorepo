/**
 * Group Domain Entity
 * Entidad de dominio que representa un grupo de permisos con composición jerárquica
 *
 * Responsabilidades:
 * - Validar la estructura y consistencia del grupo
 * - Gestionar acciones asignadas
 * - Gestionar grupos hijos (composición)
 * - Detectar ciclos en la jerarquía
 * - Calcular acciones efectivas (propias + heredadas)
 */

import { Action } from './action.entity';

export class Group {
  private readonly _id: number;
  private _key: string;
  private _name: string;
  private _description?: string;
  private _actions: Action[];
  private _children: Group[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: number,
    key: string,
    name: string,
    description: string | undefined,
    actions: Action[],
    children: Group[],
    createdAt: Date,
    updatedAt: Date,
  ) {
    this._id = id;
    this._key = key;
    this._name = name;
    this._description = description;
    this._actions = actions;
    this._children = children;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;

    this.validate();
  }

  // Getters
  get id(): number {
    return this._id;
  }

  get key(): string {
    return this._key;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }

  get actions(): Action[] {
    return [...this._actions];
  }

  get children(): Group[] {
    return [...this._children];
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Valida que el grupo tenga datos consistentes
   */
  private validate(): void {
    if (!this._key || this._key.trim().length === 0) {
      throw new Error('Group key cannot be empty');
    }

    if (this._key.length > 100) {
      throw new Error('Group key cannot exceed 100 characters');
    }

    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Group name cannot be empty');
    }

    if (this._name.length > 255) {
      throw new Error('Group name cannot exceed 255 characters');
    }

    // Validar que no haya ciclos en la jerarquía
    this.validateNoCycles();
  }

  /**
   * Valida que el grupo no se contenga a sí mismo en la jerarquía
   * Detecta ciclos directos e indirectos
   */
  private validateNoCycles(visited: Set<number> = new Set()): void {
    if (visited.has(this._id)) {
      throw new Error(
        `Cycle detected: group ${this._key} appears in its own hierarchy`,
      );
    }

    visited.add(this._id);

    for (const child of this._children) {
      child.validateNoCycles(new Set(visited));
    }
  }

  /**
   * Actualiza la información básica del grupo
   */
  updateInfo(name: string, description?: string): void {
    this._name = name;
    this._description = description;
    this._updatedAt = new Date();
    this.validate();
  }

  /**
   * Asigna acciones al grupo (reemplaza las existentes)
   */
  assignActions(actions: Action[]): void {
    this._actions = [...actions];
    this._updatedAt = new Date();
  }

  /**
   * Añade una acción al grupo
   */
  addAction(action: Action): void {
    if (!this.hasAction(action.id)) {
      this._actions.push(action);
      this._updatedAt = new Date();
    }
  }

  /**
   * Elimina una acción del grupo
   */
  removeAction(actionId: number): void {
    this._actions = this._actions.filter((a) => a.id !== actionId);
    this._updatedAt = new Date();
  }

  /**
   * Verifica si el grupo tiene una acción específica
   */
  hasAction(actionId: number): boolean {
    return this._actions.some((a) => a.id === actionId);
  }

  /**
   * Asigna grupos hijos (reemplaza los existentes)
   */
  assignChildren(children: Group[]): void {
    this._children = [...children];
    this._updatedAt = new Date();
    this.validateNoCycles();
  }

  /**
   * Añade un grupo hijo
   */
  addChild(child: Group): void {
    if (child.id === this._id) {
      throw new Error('A group cannot be its own child');
    }

    if (!this.hasChild(child.id)) {
      this._children.push(child);
      this._updatedAt = new Date();
      this.validateNoCycles();
    }
  }

  /**
   * Elimina un grupo hijo
   */
  removeChild(childId: number): void {
    this._children = this._children.filter((c) => c.id !== childId);
    this._updatedAt = new Date();
  }

  /**
   * Verifica si el grupo tiene un hijo específico
   */
  hasChild(childId: number): boolean {
    return this._children.some((c) => c.id === childId);
  }

  /**
   * Obtiene todas las acciones efectivas del grupo
   * Incluye acciones propias + acciones heredadas de grupos hijos
   * Elimina duplicados
   */
  getEffectiveActions(): Action[] {
    const actionMap = new Map<number, Action>();

    // Agregar acciones propias
    for (const action of this._actions) {
      actionMap.set(action.id, action);
    }

    // Agregar acciones de hijos recursivamente
    for (const child of this._children) {
      const childActions = child.getEffectiveActions();
      for (const action of childActions) {
        actionMap.set(action.id, action);
      }
    }

    return Array.from(actionMap.values());
  }

  /**
   * Obtiene todos los IDs de acciones efectivas
   */
  getEffectiveActionIds(): number[] {
    return this.getEffectiveActions().map((a) => a.id);
  }

  /**
   * Verifica si el grupo tiene una acción efectiva (propia o heredada)
   */
  hasEffectiveAction(actionId: number): boolean {
    return this.getEffectiveActionIds().includes(actionId);
  }

  /**
   * Verifica si el grupo tiene una acción efectiva por key
   */
  hasEffectiveActionByKey(actionKey: string): boolean {
    return this.getEffectiveActions().some((a) => a.key === actionKey);
  }

  /**
   * Obtiene la profundidad máxima de la jerarquía
   */
  getHierarchyDepth(): number {
    if (this._children.length === 0) {
      return 0;
    }

    const childDepths = this._children.map((c) => c.getHierarchyDepth());
    return 1 + Math.max(...childDepths);
  }

  /**
   * Obtiene todos los descendientes (hijos, nietos, etc.)
   */
  getAllDescendants(): Group[] {
    const descendants: Group[] = [];

    for (const child of this._children) {
      descendants.push(child);
      descendants.push(...child.getAllDescendants());
    }

    return descendants;
  }

  /**
   * Verifica si un grupo es descendiente de este grupo
   */
  isDescendantOf(groupId: number): boolean {
    return this.getAllDescendants().some((g) => g.id === groupId);
  }

  /**
   * Factory method para crear un nuevo grupo
   */
  static create(key: string, name: string, description?: string): Group {
    return new Group(
      0, // El ID será asignado por la base de datos
      key,
      name,
      description,
      [],
      [],
      new Date(),
      new Date(),
    );
  }

  /**
   * Factory method para reconstruir un grupo desde la persistencia
   */
  static reconstruct(
    id: number,
    key: string,
    name: string,
    description: string | undefined,
    actions: Action[],
    children: Group[],
    createdAt: Date,
    updatedAt: Date,
  ): Group {
    return new Group(
      id,
      key,
      name,
      description,
      actions,
      children,
      createdAt,
      updatedAt,
    );
  }
}
