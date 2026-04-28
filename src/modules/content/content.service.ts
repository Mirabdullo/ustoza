import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Category, Subcategory, Lesson, LessonFile, FileType } from '@prisma/client';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Categories ───────────────────────────────────────────────────
  async getCategories(): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async getAllCategories(): Promise<Category[]> {
    return this.prisma.category.findMany({ orderBy: { order: 'asc' } });
  }

  async getCategoryById(id: number): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { id } });
  }

  async createCategory(title: string): Promise<Category> {
    const count = await this.prisma.category.count();
    const key = `cat_${Date.now()}`;
    return this.prisma.category.create({ data: { key, title, order: count } });
  }

  async deleteCategory(id: number): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }

  // ── Subcategories ────────────────────────────────────────────────
  async getSubcategories(categoryId: number): Promise<Subcategory[]> {
    return this.prisma.subcategory.findMany({
      where: { categoryId, isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async getAllSubcategories(categoryId: number): Promise<Subcategory[]> {
    return this.prisma.subcategory.findMany({
      where: { categoryId },
      orderBy: { order: 'asc' },
    });
  }

  async createSubcategory(categoryId: number, title: string): Promise<Subcategory> {
    const count = await this.prisma.subcategory.count({ where: { categoryId } });
    const key = `sub_${Date.now()}`;
    return this.prisma.subcategory.create({
      data: { categoryId, key, title, order: count },
    });
  }

  async deleteSubcategory(id: number): Promise<void> {
    await this.prisma.subcategory.delete({ where: { id } });
  }

  // ── Lessons ──────────────────────────────────────────────────────
  async getLessons(subcategoryId: number): Promise<Lesson[]> {
    return this.prisma.lesson.findMany({
      where: { subcategoryId, isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async getAllLessons(subcategoryId: number): Promise<Lesson[]> {
    return this.prisma.lesson.findMany({
      where: { subcategoryId },
      orderBy: { order: 'asc' },
    });
  }

  async getLessonById(id: number): Promise<(Lesson & { files: LessonFile[] }) | null> {
    return this.prisma.lesson.findUnique({
      where: { id },
      include: { files: { orderBy: { order: 'asc' } } },
    });
  }

  async createLesson(subcategoryId: number, title: string): Promise<Lesson> {
    const count = await this.prisma.lesson.count({ where: { subcategoryId } });
    return this.prisma.lesson.create({
      data: { subcategoryId, title, order: count },
    });
  }

  async deleteLesson(id: number): Promise<void> {
    await this.prisma.lesson.delete({ where: { id } });
  }

  // ── Files ────────────────────────────────────────────────────────
  async addFile(lessonId: number, fileId: string, fileType: FileType, fileName?: string): Promise<LessonFile> {
    const count = await this.prisma.lessonFile.count({ where: { lessonId } });
    return this.prisma.lessonFile.create({
      data: { lessonId, fileId, fileType, fileName, order: count },
    });
  }

  async deleteFile(id: number): Promise<void> {
    await this.prisma.lessonFile.delete({ where: { id } });
  }

  async getLessonFiles(lessonId: number): Promise<LessonFile[]> {
    return this.prisma.lessonFile.findMany({
      where: { lessonId },
      orderBy: { order: 'asc' },
    });
  }

  // ── Seed ─────────────────────────────────────────────────────────
  async seedDefaultCategories() {
    const defaults = [
      { key: 'topik1', title: 'TOPIK I test',  order: 1 },
      { key: 'topik2', title: 'TOPIK II test', order: 2 },
      { key: 'mock',   title: 'Mock test',     order: 3 },
      { key: 'lugat',  title: "Lug'atlar",     order: 4 },
    ];
    for (const cat of defaults) {
      await this.prisma.category.upsert({
        where: { key: cat.key },
        update: {},
        create: cat,
      });
    }
  }
}
