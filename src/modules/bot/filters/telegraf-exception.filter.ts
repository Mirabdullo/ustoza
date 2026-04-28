import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { TelegrafArgumentsHost } from 'nestjs-telegraf';
import { BotContext } from '../bot.context';

@Catch()
export class TelegrafExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TelegrafExceptionFilter.name);

  async catch(exception: Error, host: ArgumentsHost): Promise<void> {
    this.logger.error(`Exception: ${exception.message}`, exception.stack);

    const telegrafHost = TelegrafArgumentsHost.create(host);
    const ctx = telegrafHost.getContext<BotContext>();

    try {
      await ctx.reply('❌ Xatolik yuz berdi. Iltimos qayta urinib ko\'ring.');
    } catch (e) {
      this.logger.error('Failed to send error message', e);
    }
  }
}
