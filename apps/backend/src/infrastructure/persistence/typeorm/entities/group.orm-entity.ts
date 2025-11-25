/**
 * Group ORM Entity
 * Entidad TypeORM para persistir grupos en la base de datos
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ActionOrmEntity } from './action.orm-entity';

@Entity('group')
export class GroupOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  key: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToMany(() => ActionOrmEntity)
  @JoinTable({
    name: 'group_actions',
    joinColumn: { name: 'group_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'action_id', referencedColumnName: 'id' },
  })
  actions: ActionOrmEntity[];

  @ManyToMany(() => GroupOrmEntity)
  @JoinTable({
    name: 'group_children',
    joinColumn: { name: 'parent_group_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'child_group_id', referencedColumnName: 'id' },
  })
  children?: GroupOrmEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
