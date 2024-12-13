import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CategoriesTransactions } from '../categories/categories.entity';

@Entity('transactions')
export class Transactions {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  category_id: string;

  @Column({ type: 'varchar', length: 30 })
  name: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  description: string;

  @Column({ type: 'int' })
  money: number;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({ type: 'uuid' })
  from_wallet: string;

  @Column({ type: 'uuid' })
  to_wallet: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(
    () => CategoriesTransactions,
    (categoryTransaction) => categoryTransaction.transactions,
  )
  @JoinColumn({ name: 'category_id' })
  category: CategoriesTransactions;
}
