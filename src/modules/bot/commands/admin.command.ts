import { Command, Ctx, Update, On, Action } from 'nestjs-telegraf';
import { UseGuards, Logger } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { ContentService } from '../../content/content.service';
import { BotContext } from '../bot.context';
import { AdminGuard } from '../guards/admin.guard';
import { Markup } from 'telegraf';
import { FileType } from '@prisma/client';

@Update()
export class AdminCommand {
  private readonly logger = new Logger(AdminCommand.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly contentService: ContentService,
  ) {}

  // ── /admin — Bosh admin menyu ────────────────────────────────────
  @UseGuards(AdminGuard)
  @Command('admin')
  async onAdmin(@Ctx() ctx: BotContext) {
    const users = await this.usersService.findAll();
    await ctx.reply(
      `👨‍💼 <b>Admin Panel</b>\n\n👥 Foydalanuvchilar: <b>${users.length}</b>`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📂 Kategoriyalar', 'admin:categories')],
          [Markup.button.callback('➕ Kategoriya qo\'shish', 'admin:add_category')],
          [Markup.button.callback('📊 Statistika', 'admin:stats')],
        ]),
      },
    );
  }

  // ── Kategoriyalar ro'yxati ────────────────────────────────────────
  @UseGuards(AdminGuard)
  @Action('admin:categories')
  async onCategories(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    const cats = await this.contentService.getAllCategories();

    if (!cats.length) {
      await ctx.editMessageText('Kategoriyalar yo\'q.', {
        ...Markup.inlineKeyboard([
          [Markup.button.callback('➕ Qo\'shish', 'admin:add_category')],
          [Markup.button.callback('🔙 Orqaga', 'admin:back')],
        ]),
      });
      return;
    }

    const buttons = cats.map((c) => [
      Markup.button.callback(`${c.isActive ? '✅' : '❌'} ${c.title}`, `admin:cat:${c.id}`),
    ]);
    buttons.push([Markup.button.callback('➕ Yangi kategoriya', 'admin:add_category')]);
    buttons.push([Markup.button.callback('🔙 Orqaga', 'admin:back')]);

    await ctx.editMessageText('📂 <b>Kategoriyalar:</b>', {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard(buttons),
    });
  }

  // ── Kategoriya detail ────────────────────────────────────────────
  @UseGuards(AdminGuard)
  @Action(/admin:cat:(\d+)/)
  async onCategoryDetail(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    const catId = parseInt((ctx.match as any)[1]);
    const cat = await this.contentService.getCategoryById(catId);
    const subs = await this.contentService.getAllSubcategories(catId);

    const buttons = subs.map((s) => [
      Markup.button.callback(`📁 ${s.title}`, `admin:sub:${s.id}`),
    ]);
    buttons.push([Markup.button.callback('➕ Bo\'lim qo\'shish', `admin:add_sub:${catId}`)]);
    buttons.push([Markup.button.callback('🗑 Kategoriyani o\'chirish', `admin:del_cat:${catId}`)]);
    buttons.push([Markup.button.callback('🔙 Orqaga', 'admin:categories')]);

    await ctx.editMessageText(
      `📂 <b>${cat.title}</b>\n\n📁 Bo'limlar: ${subs.length}`,
      { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) },
    );
  }

  // ── Subkategoriya detail ─────────────────────────────────────────
  @UseGuards(AdminGuard)
  @Action(/admin:sub:(\d+)/)
  async onSubcategoryDetail(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    const subId = parseInt((ctx.match as any)[1]);
    const lessons = await this.contentService.getAllLessons(subId);

    const buttons = lessons.map((l) => [
      Markup.button.callback(`📄 ${l.title}`, `admin:lesson:${l.id}`),
    ]);
    buttons.push([Markup.button.callback('➕ Dars qo\'shish', `admin:add_lesson:${subId}`)]);
    buttons.push([Markup.button.callback('🗑 Bo\'limni o\'chirish', `admin:del_sub:${subId}`)]);
    buttons.push([Markup.button.callback('🔙 Orqaga', `admin:cat_back:${subId}`)]);

    await ctx.editMessageText(
      `📁 <b>Bo'lim darslari:</b> ${lessons.length} ta`,
      { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) },
    );
  }

  // ── Lesson detail ────────────────────────────────────────────────
  @UseGuards(AdminGuard)
  @Action(/admin:lesson:(\d+)/)
  async onLessonDetail(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    const lessonId = parseInt((ctx.match as any)[1]);
    const lesson = await this.contentService.getLessonById(lessonId);
    const files = lesson.files;

    const fileButtons = files.map((f, i) => [
      Markup.button.callback(
        `${f.fileType === 'VIDEO' ? '🎥' : f.fileType === 'AUDIO' ? '🎵' : f.fileType === 'PHOTO' ? '🖼' : '📄'} ${f.fileName || `Fayl ${i + 1}`}`,
        `admin:del_file:${f.id}:${lessonId}`,
      ),
    ]);

    const buttons = [
      ...fileButtons,
      [Markup.button.callback('📤 Fayl yuklash', `admin:upload:${lessonId}`)],
      [Markup.button.callback('🗑 Darsni o\'chirish', `admin:del_lesson:${lessonId}`)],
      [Markup.button.callback('🔙 Orqaga', `admin:lesson_back:${lessonId}`)],
    ];

    await ctx.editMessageText(
      `📄 <b>${lesson.title}</b>\n\n📎 Fayllar: ${files.length} ta\n\nFaylni o'chirish uchun ustiga bosing.`,
      { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) },
    );
  }

  // ── Fayl yuklash rejimi ──────────────────────────────────────────
  @UseGuards(AdminGuard)
  @Action(/admin:upload:(\d+)/)
  async onUploadMode(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    const lessonId = parseInt((ctx.match as any)[1]);
    ctx.session.data = { uploadLessonId: lessonId };
    ctx.session.state = { ...ctx.session.state, mode: 'upload' } as any;

    await ctx.reply(
      `📤 Faylni yuboring (hujjat, video, audio yoki rasm).\n\nBekor qilish: /cancel`,
    );
  }

  // ── Fayl qabul qilish ────────────────────────────────────────────
  @On(['document', 'video', 'audio', 'photo'])
  async onFileReceived(@Ctx() ctx: BotContext) {
    const mode = (ctx.session.state as any)?.mode;
    const lessonId = ctx.session.data?.uploadLessonId;

    if (mode !== 'upload' || !lessonId) return;

    const msg = ctx.message as any;
    let fileId: string;
    let fileType: FileType;
    let fileName: string;

    if (msg.document) {
      fileId = msg.document.file_id;
      fileType = FileType.DOCUMENT;
      fileName = msg.document.file_name || 'Hujjat';
    } else if (msg.video) {
      fileId = msg.video.file_id;
      fileType = FileType.VIDEO;
      fileName = msg.video.file_name || 'Video';
    } else if (msg.audio) {
      fileId = msg.audio.file_id;
      fileType = FileType.AUDIO;
      fileName = msg.audio.title || msg.audio.file_name || 'Audio';
    } else if (msg.photo) {
      const photo = msg.photo[msg.photo.length - 1];
      fileId = photo.file_id;
      fileType = FileType.PHOTO;
      fileName = 'Rasm';
    } else {
      return;
    }

    await this.contentService.addFile(lessonId, fileId, fileType, fileName);

    // Reset upload mode
    ctx.session.data = {};
    (ctx.session.state as any).mode = undefined;

    await ctx.reply(
      `✅ <b>${fileName}</b> saqlandi!`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📤 Yana fayl yuklash', `admin:upload:${lessonId}`)],
          [Markup.button.callback('📄 Darsga qaytish', `admin:lesson:${lessonId}`)],
        ]),
      },
    );
  }

  // ── Faylni o'chirish ─────────────────────────────────────────────
  @UseGuards(AdminGuard)
  @Action(/admin:del_file:(\d+):(\d+)/)
  async onDeleteFile(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    const fileId = parseInt((ctx.match as any)[1]);
    const lessonId = parseInt((ctx.match as any)[2]);
    await this.contentService.deleteFile(fileId);
    await ctx.answerCbQuery('🗑 Fayl o\'chirildi');
    // Refresh lesson view
    await this.refreshLesson(ctx, lessonId);
  }

  // ── Darsni o'chirish ─────────────────────────────────────────────
  @UseGuards(AdminGuard)
  @Action(/admin:del_lesson:(\d+)/)
  async onDeleteLesson(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    const lessonId = parseInt((ctx.match as any)[1]);
    const lesson = await this.contentService.getLessonById(lessonId);
    const subId = lesson.subcategoryId;
    await this.contentService.deleteLesson(lessonId);
    await ctx.editMessageText(`✅ Dars o'chirildi.`, {
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Bo\'limga qaytish', `admin:sub:${subId}`)],
      ]),
    });
  }

  // ── Bo'limni o'chirish ────────────────────────────────────────────
  @UseGuards(AdminGuard)
  @Action(/admin:del_sub:(\d+)/)
  async onDeleteSub(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    const subId = parseInt((ctx.match as any)[1]);
    const subs = await this.contentService.getAllSubcategories(0);
    await this.contentService.deleteSubcategory(subId);
    await ctx.editMessageText(`✅ Bo'lim o'chirildi.`, {
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Kategoriyalarga qaytish', 'admin:categories')],
      ]),
    });
  }

  // ── Kategoriyani o'chirish ────────────────────────────────────────
  @UseGuards(AdminGuard)
  @Action(/admin:del_cat:(\d+)/)
  async onDeleteCat(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    const catId = parseInt((ctx.match as any)[1]);
    await this.contentService.deleteCategory(catId);
    await ctx.editMessageText(`✅ Kategoriya o'chirildi.`, {
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Kategoriyalarga qaytish', 'admin:categories')],
      ]),
    });
  }

  // ── Matn kiritish (kategoriya/subkategoriya/dars nomi) ───────────
  @UseGuards(AdminGuard)
  @Action('admin:add_category')
  async onAddCategory(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    ctx.session.data = { inputType: 'category' };
    await ctx.reply('📝 Yangi kategoriya nomini kiriting:\n\nBekor qilish: /cancel');
  }

  @UseGuards(AdminGuard)
  @Action(/admin:add_sub:(\d+)/)
  async onAddSub(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    const catId = parseInt((ctx.match as any)[1]);
    ctx.session.data = { inputType: 'subcategory', catId };
    await ctx.reply(`📝 Yangi bo'lim nomini kiriting:\n\nBekor qilish: /cancel`);
  }

  @UseGuards(AdminGuard)
  @Action(/admin:add_lesson:(\d+)/)
  async onAddLesson(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    const subId = parseInt((ctx.match as any)[1]);
    ctx.session.data = { inputType: 'lesson', subId };
    await ctx.reply(`📝 Yangi dars nomini kiriting:\n\nBekor qilish: /cancel`);
  }

  // ── Back navigations ─────────────────────────────────────────────
  @UseGuards(AdminGuard)
  @Action('admin:back')
  async onBack(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    const users = await this.usersService.findAll();
    await ctx.editMessageText(
      `👨‍💼 <b>Admin Panel</b>\n\n👥 Foydalanuvchilar: <b>${users.length}</b>`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📂 Kategoriyalar', 'admin:categories')],
          [Markup.button.callback('➕ Kategoriya qo\'shish', 'admin:add_category')],
          [Markup.button.callback('📊 Statistika', 'admin:stats')],
        ]),
      },
    );
  }

  @UseGuards(AdminGuard)
  @Action(/admin:cat_back:(\d+)/)
  async onCatBack(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    const subId = parseInt((ctx.match as any)[1]);
    const sub = await this.contentService.getAllSubcategories(0);
    // find sub to get catId
    const allSubs = await this.prisma_findSubById(subId);
    if (allSubs) {
      // trigger cat detail
      (ctx.match as any)[1] = allSubs.categoryId.toString();
      await this.onCategoryDetail(ctx);
    }
  }

  @UseGuards(AdminGuard)
  @Action(/admin:lesson_back:(\d+)/)
  async onLessonBack(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    const lessonId = parseInt((ctx.match as any)[1]);
    const lesson = await this.contentService.getLessonById(lessonId);
    (ctx.match as any)[1] = lesson.subcategoryId.toString();
    await this.onSubcategoryDetail(ctx);
  }

  @UseGuards(AdminGuard)
  @Action('admin:stats')
  async onStats(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    const users = await this.usersService.findAll();
    const cats = await this.contentService.getAllCategories();
    await ctx.editMessageText(
      `📊 <b>Statistika</b>\n\n` +
      `👥 Foydalanuvchilar: <b>${users.length}</b>\n` +
      `📂 Kategoriyalar: <b>${cats.length}</b>`,
      {
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔙 Orqaga', 'admin:back')],
        ]),
      },
    );
  }

  @Command('cancel')
  async onCancel(@Ctx() ctx: BotContext) {
    ctx.session.data = {};
    (ctx.session.state as any).mode = undefined;
    await ctx.reply('❌ Bekor qilindi.');
  }

  // ── Matn input handler (category/sub/lesson nomi) ────────────────
  async handleTextInput(ctx: BotContext, text: string) {
    const { inputType, catId, subId } = ctx.session.data || {};

    if (inputType === 'category') {
      const cat = await this.contentService.createCategory(text);
      ctx.session.data = {};
      await ctx.reply(
        `✅ Kategoriya yaratildi: <b>${cat.title}</b>`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('📂 Kategoriyalar', 'admin:categories')],
            [Markup.button.callback(`➕ Bo'lim qo'shish`, `admin:add_sub:${cat.id}`)],
          ]),
        },
      );
    } else if (inputType === 'subcategory' && catId) {
      const sub = await this.contentService.createSubcategory(catId, text);
      ctx.session.data = {};
      await ctx.reply(
        `✅ Bo'lim yaratildi: <b>${sub.title}</b>`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback(`➕ Dars qo'shish`, `admin:add_lesson:${sub.id}`)],
            [Markup.button.callback('🔙 Kategoriyaga qaytish', `admin:cat:${catId}`)],
          ]),
        },
      );
    } else if (inputType === 'lesson' && subId) {
      const lesson = await this.contentService.createLesson(subId, text);
      ctx.session.data = {};
      await ctx.reply(
        `✅ Dars yaratildi: <b>${lesson.title}</b>`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('📤 Fayl yuklash', `admin:upload:${lesson.id}`)],
            [Markup.button.callback('🔙 Bo\'limga qaytish', `admin:sub:${subId}`)],
          ]),
        },
      );
    }
  }

  private async refreshLesson(ctx: BotContext, lessonId: number) {
    const lesson = await this.contentService.getLessonById(lessonId);
    const files = lesson.files;
    const fileButtons = files.map((f, i) => [
      Markup.button.callback(
        `${f.fileType === 'VIDEO' ? '🎥' : f.fileType === 'AUDIO' ? '🎵' : f.fileType === 'PHOTO' ? '🖼' : '📄'} ${f.fileName || `Fayl ${i + 1}`}`,
        `admin:del_file:${f.id}:${lessonId}`,
      ),
    ]);
    const buttons = [
      ...fileButtons,
      [Markup.button.callback('📤 Fayl yuklash', `admin:upload:${lessonId}`)],
      [Markup.button.callback('🗑 Darsni o\'chirish', `admin:del_lesson:${lessonId}`)],
    ];
    await ctx.editMessageText(
      `📄 <b>${lesson.title}</b>\n\n📎 Fayllar: ${files.length} ta`,
      { parse_mode: 'HTML', ...Markup.inlineKeyboard(buttons) },
    );
  }

  private async prisma_findSubById(subId: number) {
    return this.contentService['prisma'].subcategory.findUnique({ where: { id: subId } });
  }
}
