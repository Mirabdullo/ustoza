import { Update, On, Ctx } from 'nestjs-telegraf';
import { Logger } from '@nestjs/common';
import { ContentService } from '../../content/content.service';
import { BotContext } from '../bot.context';
import { buildMainMenuKeyboard } from '../keyboards/main-menu.keyboard';
import { buildSubcategoryKeyboard } from '../keyboards/subcategory.keyboard';
import { buildLessonKeyboard } from '../keyboards/lesson.keyboard';
import { AdminCommand } from './admin.command';

@Update()
export class MenuCommand {
  private readonly logger = new Logger(MenuCommand.name);

  constructor(
    private readonly contentService: ContentService,
    private readonly adminCommand: AdminCommand,
  ) {}

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const text = (ctx.message as any).text as string;

    if (text.startsWith('/')) return;
    if (text === '🏠 Bosh menyu') return;

    // Admin matn input (kategoriya/sub/lesson nomi kiritish)
    const inputType = ctx.session.data?.inputType;
    if (inputType) {
      await this.adminCommand.handleTextInput(ctx, text);
      return;
    }

    const { state } = ctx.session;

    // Level 3: lesson tanlash
    if (state?.subcategoryId) {
      if (text === '◀️ Orqaga') {
        const subs = await this.contentService.getSubcategories(state.categoryId);
        ctx.session.state = { categoryId: state.categoryId, categoryTitle: state.categoryTitle };
        await ctx.reply(state.categoryTitle, buildSubcategoryKeyboard(subs));
        return;
      }

      const lessons = await this.contentService.getLessons(state.subcategoryId);
      const lesson = lessons.find((l) => l.title === text);
      if (lesson) {
        await this.sendLesson(ctx, lesson.id);
        return;
      }
    }

    // Level 2: subcategory tanlash
    if (state?.categoryId) {
      if (text === '◀️ Orqaga') {
        ctx.session.state = undefined;
        const cats = await this.contentService.getCategories();
        await ctx.reply('Asosiy menyu:', buildMainMenuKeyboard(cats));
        return;
      }

      const subs = await this.contentService.getSubcategories(state.categoryId);
      const sub = subs.find((s) => s.title === text);
      if (sub) {
        const lessons = await this.contentService.getLessons(sub.id);
        if (!lessons.length) {
          await ctx.reply("Bu bo'limda hali fayl yo'q.");
          return;
        }
        ctx.session.state = { ...state, subcategoryId: sub.id, subcategoryTitle: sub.title };
        await ctx.reply(sub.title, buildLessonKeyboard(lessons));
        return;
      }
    }

    // Level 1: category tanlash
    const cats = await this.contentService.getCategories();
    const cat = cats.find((c) => c.title === text);
    if (cat) {
      const subs = await this.contentService.getSubcategories(cat.id);
      if (!subs.length) {
        await ctx.reply("Bu bo'limda hali bo'lim yo'q.");
        return;
      }
      ctx.session.state = { categoryId: cat.id, categoryTitle: cat.title };
      await ctx.reply(cat.title, buildSubcategoryKeyboard(subs));
      return;
    }

    await ctx.reply('Iltimos, menyudan tanlang 👇');
  }

  private async sendLesson(ctx: BotContext, lessonId: number) {
    const lesson = await this.contentService.getLessonById(lessonId);
    if (!lesson) return;

    if (!lesson.files.length) {
      await ctx.reply(`📂 <b>${lesson.title}</b>\n\nFayl hali yuklanmagan.`, {
        parse_mode: 'HTML',
      });
      return;
    }

    await ctx.reply(`📂 <b>${lesson.title}</b>`, { parse_mode: 'HTML' });

    for (const file of lesson.files) {
      try {
        switch (file.fileType) {
          case 'PHOTO':
            await ctx.replyWithPhoto(file.fileId, { caption: file.fileName });
            break;
          case 'VIDEO':
            await ctx.replyWithVideo(file.fileId, { caption: file.fileName });
            break;
          case 'AUDIO':
            await ctx.replyWithAudio(file.fileId, { title: file.fileName });
            break;
          default:
            await ctx.replyWithDocument(file.fileId, { caption: file.fileName });
        }
      } catch (err) {
        this.logger.error(`File send error: ${file.fileId}`, err);
        await ctx.reply(`⚠️ Faylni yuborishda xatolik: ${file.fileName}`);
      }
    }
  }
}
