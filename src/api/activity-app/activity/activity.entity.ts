import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Categories } from '../categories/categories.entity';

@Entity()
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid', name: 'category_id' })
  category_id: string;

  @Column({ type: 'timestamptz' })
  start_date: Date;

  @Column({ type: 'timestamptz' })
  end_date: Date;

  @Column({ type: 'boolean' })
  is_done: boolean;

  @Column({ type: 'integer' })
  seconds: number;

  is_deleted: boolean;

  @Column({ type: 'timestamptz' })
  deleted_at: Date;

  @Column({ length: 2000 })
  description: string;

  category_name?: string;

  @ManyToOne(() => Categories, (category) => category.activity)
  @JoinColumn({ name: 'category_id' })
  category: Categories;
}
