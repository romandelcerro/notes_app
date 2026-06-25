import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SectionEntity } from '../entities/section.entity.js';
import { NoteEntity } from '../entities/note.entity.js';
import { SectionsController } from './sections.controller.js';
import { SectionsService } from './sections.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([SectionEntity, NoteEntity])],
  controllers: [SectionsController],
  providers: [SectionsService],
  exports: [SectionsService],
})
export class SectionsModule {}
