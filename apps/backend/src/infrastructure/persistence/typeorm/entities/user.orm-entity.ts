/**
 * User ORM Entity
 * Entidad TypeORM para persistir usuarios en la base de datos
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
import { GroupOrmEntity } from './group.orm-entity';
import { ActionOrmEntity } from './action.orm-entity';

@Entity('user')
export class UserOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  passwordHash: string;

  @Column({ length: 255, nullable: true })
  fullName?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil?: Date;

  @ManyToMany(() => GroupOrmEntity)
  @JoinTable({
    name: 'user_groups',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'group_id', referencedColumnName: 'id' },
  })
  groups: GroupOrmEntity[];

  @ManyToMany(() => ActionOrmEntity)
  @JoinTable({
    name: 'user_actions',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'action_id', referencedColumnName: 'id' },
  })
  actions: ActionOrmEntity[];

  @Column({ length: 255, nullable: true })
  passwordResetToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpires?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
