import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity.js';
import { SectionEntity } from './section.entity.js';

@Entity('notes')
export class NoteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'varchar' })
  color: string;

  @Column({ default: false })
  pinned: boolean;

  @Column({ default: false })
  hasAttachments: boolean;

  @Column()
  userId: string;

  @Column({ nullable: true })
  sectionId: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => SectionEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sectionId' })
  section: SectionEntity;
}
