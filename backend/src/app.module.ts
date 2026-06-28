import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity.js';
import { NoteEntity } from './entities/note.entity.js';
import { SectionEntity } from './entities/section.entity.js';
import { AttachmentEntity } from './entities/attachment.entity.js';
import { SessionEntity } from './entities/session.entity.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { NotesModule } from './notes/notes.module.js';
import { SectionsModule } from './sections/sections.module.js';
import { AttachmentsModule } from './attachments/attachments.module.js';
import { BackupModule } from './backup/backup.module.js';
import { SessionsModule } from './sessions/sessions.module.js';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { I18nService } from './common/i18n/i18n.service.js';
import { CommonModule } from './common/common.module.js';

@Module({
  imports: [
    CacheModule.register({ isGlobal: true, ttl: 60_000 }),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'sqljs',
        location: config.get('DB_PATH', './data/notes.db'),
        autoSave: true,
        entities: [UserEntity, NoteEntity, SectionEntity, AttachmentEntity, SessionEntity],
        synchronize: true,
      }),
    }),
    CommonModule,
    AuthModule,
    UsersModule,
    NotesModule,
    SectionsModule,
    AttachmentsModule,
    BackupModule,
    SessionsModule,
  ],
  controllers: [AppController],
  providers: [AppService, I18nService],
  exports: [I18nService],
})
export class AppModule {}
