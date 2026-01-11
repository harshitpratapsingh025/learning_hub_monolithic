import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Transform } from 'class-transformer';
import { MongoSerialized } from '../../../../common';

export type ChapterDocument = Chapter & Document;

@Schema({ timestamps: true, collection: 'chapters' })
export class Chapter {
  @Transform(({ value }) => value.toString())
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Subject' })
  subjectId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop()
  shortName?: string;

  @Prop()
  icon?: string;

  @Prop({ default: 0 })
  displayOrder!: number;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const ChapterSchema = SchemaFactory.createForClass(Chapter);

// Indexes
ChapterSchema.index({ subjectId: 1, displayOrder: 1 });
ChapterSchema.index({ subjectId: 1, isActive: 1 });
ChapterSchema.index({ subjectId: 1, name: 1 }, { unique: true });

ChapterSchema.virtual('id').get(function () {
  return this._id.toString();
});

ChapterSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: MongoSerialized) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});