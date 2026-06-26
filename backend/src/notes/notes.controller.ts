import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { NotesService } from './notes.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreateNoteDto } from './dto/create-note.dto.js';
import { UpdateNoteDto } from './dto/update-note.dto.js';
import { NoteQueryDto } from './dto/note-query.dto.js';

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  findAll(@CurrentUser() user: { uid: string }, @Query() query: NoteQueryDto) {
    return this.notesService.findAll(user.uid, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: { uid: string }, @Param('id', ParseIntPipe) id: number) {
    return this.notesService.findOne(id, user.uid);
  }

  @Post()
  create(@CurrentUser() user: { uid: string }, @Body() dto: CreateNoteDto) {
    return this.notesService.create(user.uid, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { uid: string },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.update(id, user.uid, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { uid: string }, @Param('id', ParseIntPipe) id: number) {
    return this.notesService.remove(id, user.uid);
  }

  @Post('reorder')
  reorder(
    @CurrentUser() user: { uid: string },
    @Body() body: { groupKey: string; noteIds: number[] },
  ) {
    return this.notesService.reorder(user.uid, body.groupKey, body.noteIds);
  }
}
