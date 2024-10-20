import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  category_id: string;

  @Column({ type: 'timestamptz' })
  start_date: Date;

  @Column({ type: 'int' })
  time: number;

  @Column({ type: 'timestamptz' })
  end_date: Date;
}
