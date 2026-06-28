import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { NoteEntity } from './note.entity.js';
import { SectionEntity } from './section.entity.js';
import { SessionEntity } from './session.entity.js';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  uid: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'text', nullable: true })
  photoURL: string | null;

  @Column({ type: 'varchar' })
  username: string;

  @Column({ default: false })
  isGuest: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'varchar', default: 'basic' })
  plan: string;

  @Column({ type: 'bigint', default: 0 })
  storageUsedBytes: number;

  @Column({ type: 'datetime', nullable: true })
  guestExpiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => NoteEntity, (n) => n.user)
  notes: NoteEntity[];

  @OneToMany(() => SectionEntity, (s) => s.user)
  sections: SectionEntity[];

  @OneToMany(() => SessionEntity, (s) => s.user)
  sessions: SessionEntity[];
}
