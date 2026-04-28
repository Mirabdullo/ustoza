import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { HttpsProxyAgent } from 'https-proxy-agent';

import { UsersModule } from '../users/users.module';
import { ContentModule } from '../content/content.module';

import { StartCommand } from './commands/start.command';
import { MenuCommand } from './commands/menu.command';
import { AdminCommand } from './commands/admin.command';
import { AdminGuard } from './guards/admin.guard';
import { TelegrafExceptionFilter } from './filters/telegraf-exception.filter';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const proxyUrl = config.get<string>('bot.proxyUrl');
        const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
        return {
          token: config.get<string>('bot.token'),
          middlewares: [session()],
          telegram: agent ? { agent } : {},
        };
      },
    }),
    UsersModule,
    ContentModule,
  ],
  providers: [
    StartCommand,
    MenuCommand,
    AdminCommand,
    AdminGuard,
    TelegrafExceptionFilter,
  ],
})
export class BotModule {}
