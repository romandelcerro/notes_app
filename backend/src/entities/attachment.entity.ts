import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { NoteEntity } from './note.entity.js';

@Entity('attachments')
export class AttachmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  noteId: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  mimeType: string;

  @Column({ type: 'text' })
  encryptedData: string;

  @Column()
  size: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => NoteEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'noteId' })
  note: NoteEntity;
}
