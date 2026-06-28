import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AttachmentsService } from './attachments.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreateAttachmentDto } from './dto/create-attachment.dto.js';

@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get('note/:noteId')
  findByNoteId(
    @CurrentUser() user: { uid: string },
    @Param('noteId', ParseIntPipe) noteId: number,
  ) {
    return this.attachmentsService.findByNoteId(noteId, user.uid);
  }

  @Post()
  create(@CurrentUser() user: { uid: string }, @Body() dto: CreateAttachmentDto) {
    return this.attachmentsService.create(user.uid, dto);
  }

  @Get('batch')
  findByNoteIds(@CurrentUser() user: { uid: string }, @Query('noteIds') noteIds: string) {
    const ids = noteIds.split(',').map(Number);
    return this.attachmentsService.findByNoteIds(ids, user.uid);
  }

  @Get(':id')
  findOne(@CurrentUser() user: { uid: string }, @Param('id', ParseIntPipe) id: number) {
    return this.attachmentsService.findOne(id, user.uid);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { uid: string }, @Param('id', ParseIntPipe) id: number) {
    return this.attachmentsService.remove(id, user.uid);
  }
}
