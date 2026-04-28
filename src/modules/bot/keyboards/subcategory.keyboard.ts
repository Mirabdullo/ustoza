import { Markup } from 'telegraf';
import { Subcategory } from '@prisma/client';

export function buildSubcategoryKeyboard(subcategories: Subcategory[]) {
  const buttons = subcategories.map((s) => [Markup.button.text(s.title)]);
  buttons.push([Markup.button.text('◀️ Orqaga'), Markup.button.text('🏠 Bosh menyu')]);

  return Markup.keyboard(buttons).resize();
}
