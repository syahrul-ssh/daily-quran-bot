import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table
export class User extends Model<User> {
  @Column({
    type: DataType.BIGINT,
  })
  chatId: number;

  @Column({
    type: DataType.INTEGER,
  })
  setHour: number;

  @Column({
    type: DataType.INTEGER,
  })
  setMinute: number;

  @Column({
    type: DataType.JSONB,
  })
  suffledSurah: any;

  @Column({
    type: DataType.INTEGER,
  })
  currentSurah: number;

  @Column({
    type: DataType.INTEGER,
  })
  currentAyah: number;
}
