import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Activity } from '../activity/activity.entity';

@Entity()
export class Categories {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ length: 30 })
  name: string;

  @Column({ type: 'integer' })
  target: number;

  seconds?: number;
  minutes?: number;

  @Column({ type: 'timestamptz' })
  deleted_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => Activity, (activity) => activity.category)
  activity: Activity[];
}
