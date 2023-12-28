import { Module } from '@nestjs/common';
import { TelegramService } from './telegram/telegram.service';
import { HttpModule } from '@nestjs/axios';
import { usersProviders } from './telegram/telegram.providers';

@Module({
  imports: [HttpModule],
  providers: [TelegramService, ...usersProviders],
})
export class TelegramModule {}
