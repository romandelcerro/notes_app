import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
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
  create(
    @CurrentUser() user: { uid: string },
    @Body() dto: CreateAttachmentDto,
  ) {
    return this.attachmentsService.create(user.uid, dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.attachmentsService.findOne(id);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { uid: string },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.attachmentsService.remove(id, user.uid);
  }
}
