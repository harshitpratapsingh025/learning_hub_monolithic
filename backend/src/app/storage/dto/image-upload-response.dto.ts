import { ApiProperty } from '@nestjs/swagger';

export class ImageUploadResponseDto {
  @ApiProperty({
    example: true,
    description: 'Indicates if the upload was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'https://storage.googleapis.com/your-bucket/abc-123.jpg',
    description: 'Public URL of the uploaded image',
  })
  url: string;

  @ApiProperty({
    example: 'Image uploaded successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    example: 'profile-picture.jpg',
    description: 'Original filename of the uploaded image',
  })
  filename: string;

  @ApiProperty({
    example: 1048576,
    description: 'File size in bytes',
  })
  size: number;

  @ApiProperty({
    example: 'image/jpeg',
    description: 'MIME type of the uploaded file',
  })
  mimeType: string;
}