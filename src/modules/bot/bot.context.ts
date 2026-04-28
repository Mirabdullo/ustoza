import { Context as TelegrafContext, Scenes } from 'telegraf';

export interface NavState {
  categoryId?: number;
  categoryTitle?: string;
  subcategoryId?: number;
  subcategoryTitle?: string;
}

export interface BotSession extends Scenes.SceneSession {
  state?: NavState;
  data?: Record<string, any>;
  step?: number;
}

export interface BotContext extends TelegrafContext {
  session: BotSession;
  scene: Scenes.SceneContextScene<BotContext, BotSession>;
}
