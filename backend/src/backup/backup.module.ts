import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoteEntity } from '../entities/note.entity.js';
import { SectionEntity } from '../entities/section.entity.js';
import { AttachmentEntity } from '../entities/attachment.entity.js';
import { BackupController } from './backup.controller.js';
import { BackupService } from './backup.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([NoteEntity, SectionEntity, AttachmentEntity])],
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}
