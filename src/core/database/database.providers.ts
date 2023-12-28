/* eslint-disable prefer-const */
import { Sequelize } from 'sequelize-typescript';
import { databaseConfig } from './database.config';
import { join } from 'path';

export const databaseProviders = [
  {
    provide: 'SEQUELIZE',
    useFactory: async () => {
      let config;
      config = databaseConfig.development;
      const sequelize = new Sequelize(config);
      sequelize.addModels([join(__dirname, '../../models/core')]);
      await sequelize.sync();
      return sequelize;
    },
  },
];
