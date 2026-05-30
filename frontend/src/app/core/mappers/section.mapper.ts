import type { Section } from '../models/section.model';

export function mapNewSection(name: string, userId: string, order: number): Section {
  return { name, userId, order, createdAt: new Date() };
}
