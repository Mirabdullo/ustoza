import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { User, Role } from '@prisma/client';
import { Context } from 'telegraf';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findOrCreate(ctx: Context): Promise<User> {
    const tgUser = ctx.from;
    if (!tgUser) throw new Error('No user in context');

    return this.prisma.user.upsert({
      where: { telegramId: BigInt(tgUser.id) },
      update: {
        username: tgUser.username,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        languageCode: tgUser.language_code,
      },
      create: {
        telegramId: BigInt(tgUser.id),
        username: tgUser.username,
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        languageCode: tgUser.language_code,
        isBot: tgUser.is_bot,
      },
    });
  }

  async findByTelegramId(telegramId: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async updateRole(telegramId: number, role: Role): Promise<User> {
    return this.prisma.user.update({
      where: { telegramId: BigInt(telegramId) },
      data: { role },
    });
  }

  async blockUser(telegramId: number): Promise<User> {
    return this.prisma.user.update({
      where: { telegramId: BigInt(telegramId) },
      data: { isBlocked: true },
    });
  }

  async isAdmin(telegramId: number): Promise<boolean> {
    const user = await this.findByTelegramId(telegramId);
    return user?.role === Role.ADMIN || user?.role === Role.MODERATOR;
  }
}
