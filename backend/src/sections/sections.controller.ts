import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { SectionsService } from './sections.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { CreateSectionDto } from './dto/create-section.dto.js';
import { UpdateSectionDto } from './dto/update-section.dto.js';

@Controller('sections')
@UseGuards(JwtAuthGuard)
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get()
  findAll(@CurrentUser() user: { uid: string }) {
    return this.sectionsService.findAll(user.uid);
  }

  @Post()
  create(@CurrentUser() user: { uid: string }, @Body() dto: CreateSectionDto) {
    return this.sectionsService.create(user.uid, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { uid: string },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.sectionsService.update(id, user.uid, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { uid: string },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.sectionsService.remove(id, user.uid);
  }
}
