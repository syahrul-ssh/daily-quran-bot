import { Module } from '@nestjs/common';
import { ScheduleModule as schedule } from '@nestjs/schedule';
import { TelegramModule } from 'src/telegram/telegram.module';

@Module({
  imports: [schedule.forRoot()],
})
export class ScheduleModule {}
