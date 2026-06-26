import { IsString, IsBoolean, IsOptional, IsNumber, IsIn } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsString()
  @IsIn(['text', 'link', 'image', 'file'])
  type: string;

  @IsString()
  color: string;

  @IsBoolean()
  pinned: boolean;

  @IsOptional()
  @IsNumber()
  sectionId?: number;
}
