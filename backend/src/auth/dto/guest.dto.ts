import { IsString, IsOptional } from 'class-validator';

export class GuestDto {
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  email?: string;
}
