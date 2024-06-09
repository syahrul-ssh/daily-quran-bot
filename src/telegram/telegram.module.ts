import { Module } from '@nestjs/common';
import { TelegramService } from './telegram/telegram.service';
import { HttpModule } from '@nestjs/axios';
import {
  cronProviders,
  historyProviders,
  usersProviders,
} from './telegram/telegram.providers';

@Module({
  imports: [HttpModule],
  providers: [
    TelegramService,
    ...usersProviders,
    ...historyProviders,
    ...cronProviders,
  ],
})
export class TelegramModule {}
