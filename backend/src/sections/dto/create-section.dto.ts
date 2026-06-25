import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
