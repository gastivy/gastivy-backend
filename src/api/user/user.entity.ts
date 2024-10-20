import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 40 })
  name: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 40, unique: true })
  email: string;

  @CreateDateColumn({ type: 'timestamptz' }) // 'timestamptz' for PostgreSQL
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
