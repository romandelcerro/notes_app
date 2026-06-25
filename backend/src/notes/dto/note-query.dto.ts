import {
  IsOptional,
  IsString,
  IsBooleanString,
  IsNumberString,
} from 'class-validator';

export class NoteQueryDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsNumberString()
  sectionId?: string;

  @IsOptional()
  @IsBooleanString()
  pinned?: string;
}
