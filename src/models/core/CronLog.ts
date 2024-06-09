import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table
export class CronLog extends Model<CronLog> {
  @Column({
    type: DataType.STRING,
  })
  time: string;

  @Column({
    type: DataType.JSONB,
  })
  foundedChatId: any;
}
