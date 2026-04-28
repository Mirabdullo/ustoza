import { Command, Start, Ctx, Update, Hears } from 'nestjs-telegraf';
import { UsersService } from '../../users/users.service';
import { ContentService } from '../../content/content.service';
import { BotContext } from '../bot.context';
import { Markup } from 'telegraf';
import { buildMainMenuKeyboard } from '../keyboards/main-menu.keyboard';

@Update()
export class StartCommand {
  constructor(
    private readonly usersService: UsersService,
    private readonly contentService: ContentService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    await this.usersService.findOrCreate(ctx);

    const categories = await this.contentService.getCategories();
    const keyboard   = buildMainMenuKeyboard(categories);

    await ctx.reply(
      `Assalomu alaykum! 👋\nSizga nima kerak?`,
      keyboard,
    );
  }

  // ── "Orqaga" tugmasi har yerdan asosiy menuga qaytaradi ──────────
  @Hears('🏠 Bosh menyu')
  async onHome(@Ctx() ctx: BotContext) {
    ctx.session.state = undefined;
    const categories = await this.contentService.getCategories();
    await ctx.reply('Asosiy menyu:', buildMainMenuKeyboard(categories));
  }
}
