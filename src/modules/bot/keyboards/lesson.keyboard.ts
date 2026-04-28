import { Markup } from 'telegraf';
import { Lesson } from '@prisma/client';

export function buildLessonKeyboard(lessons: Lesson[]) {
  const buttons = lessons.map((l) => [Markup.button.text(l.title)]);
  buttons.push([Markup.button.text('◀️ Orqaga'), Markup.button.text('🏠 Bosh menyu')]);

  return Markup.keyboard(buttons).resize();
}
