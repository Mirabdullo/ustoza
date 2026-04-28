import { Markup } from 'telegraf';
import { Category } from '@prisma/client';

export function buildMainMenuKeyboard(categories: Category[]) {
  const buttons = categories.map((c) => [Markup.button.text(c.title)]);
  buttons.push([Markup.button.text('🏠 Bosh menyu')]);

  return Markup.keyboard(buttons).resize();
}
