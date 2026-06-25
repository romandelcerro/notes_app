import { IsString, IsOptional } from 'class-validator';

export class GuestDto {
  @IsString()
  displayName: string;

  @IsOptional()
  @IsString()
  email?: string;
}
