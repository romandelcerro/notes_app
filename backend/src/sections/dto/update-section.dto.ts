import { IsBoolean, IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateSectionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
