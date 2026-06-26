import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  uid: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'varchar', nullable: true })
  displayName: string | null;

  @Column({ type: 'text', nullable: true })
  photoURL: string | null;

  @Column({ default: false })
  isGuest: boolean;

  @Column({ type: 'datetime', nullable: true })
  guestExpiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
