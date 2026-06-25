import { IsNumber, IsString } from 'class-validator';

export class CreateAttachmentDto {
  @IsNumber()
  noteId: number;

  @IsString()
  name: string;

  @IsString()
  mimeType: string;

  @IsString()
  encryptedData: string;

  @IsNumber()
  size: number;
}
