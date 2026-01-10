import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Delete,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StorageService } from '../storage/storage.service';
import { FileValidationInterceptor } from '../common/interceptors/file-validation.interceptor';
import { ImageUploadDto, ImageUploadResponseDto } from './dto';

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('image')
  @ApiOperation({ 
    summary: 'Upload an image',
    description: 'Upload a single image file to Google Cloud Storage. Supported formats: JPEG, PNG, WebP, GIF. Max size: 5MB'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file to upload',
    type: ImageUploadDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    type: ImageUploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid file type or size',
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.',
        error: 'Bad Request',
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
    FileValidationInterceptor,
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImageUploadResponseDto> {
    try {
      const url = await this.storageService.uploadImage(file);
      return {
        success: true,
        url,
        message: 'Image uploaded successfully',
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete('image/:filename')
  @ApiOperation({
    summary: 'Delete an image',
    description: 'Delete an image from Google Cloud Storage by filename',
  })
  @ApiResponse({
    status: 200,
    description: 'Image deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Image deleted successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Failed to delete image',
  })
  @ApiResponse({
    status: 404,
    description: 'Image not found',
  })
  async deleteImage(@Param('filename') filename: string) {
    try {
      await this.storageService.deleteImage(filename);
      return {
        success: true,
        message: 'Image deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}