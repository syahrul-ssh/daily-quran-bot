import { CronLog } from 'src/models/core/CronLog';
import { HistoryShuffledSurah } from 'src/models/core/HistoryShuffledSurah';
import { User } from 'src/models/core/User';

export const usersProviders = [
  {
    provide: 'USER_REPOSITORY',
    useValue: User,
  },
];

export const historyProviders = [
  {
    provide: 'HISTORY_REPOSITORY',
    useValue: HistoryShuffledSurah,
  },
];

export const cronProviders = [
  {
    provide: 'CRON_REPOSITORY',
    useValue: CronLog,
  },
];
