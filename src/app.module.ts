import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { BotModule } from './modules/bot/bot.module';
import { UsersModule } from './modules/users/users.module';
import { ContentModule } from './modules/content/content.module';
import { appConfig, botConfig, databaseConfig } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, botConfig, databaseConfig],
      envFilePath: '.env',
    }),
    PrismaModule,
    UsersModule,
    ContentModule,
    BotModule,
  ],
})
export class AppModule {}
