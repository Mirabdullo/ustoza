import { Scene, SceneEnter, On, Ctx } from 'nestjs-telegraf';
import { BotContext } from '../bot.context';

export const REGISTRATION_SCENE = 'REGISTRATION_SCENE';

@Scene(REGISTRATION_SCENE)
export class RegistrationScene {
  @SceneEnter()
  async onEnter(@Ctx() ctx: BotContext) {
    ctx.session.step = 1;
    await ctx.reply('📝 Ismingizni kiriting:');
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const { step = 1 } = ctx.session;
    const text = (ctx.message as any).text;

    if (step === 1) {
      ctx.session.data = { name: text };
      ctx.session.step = 2;
      await ctx.reply('📞 Telefon raqamingizni kiriting (+998901234567):');
    } else if (step === 2) {
      const { name } = ctx.session.data || {};
      await ctx.reply(`✅ Ro'yxatdan o'tdingiz!\nIsm: ${name}\nTelefon: ${text}`);
      await ctx.scene.leave();
    }
  }
}
