import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Transform } from 'class-transformer';
import { MongoSerialized } from '../../../common';

export type ExamDocument = Exam & Document;

@Schema({ timestamps: true, collection: 'exams' })
export class Exam {
  @Transform(({ value }) => value.toString())
  _id!: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  name!: string;

  @Prop({ required: true, unique: true, index: true })
  code!: string;

  @Prop()
  description?: string;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const ExamSchema = SchemaFactory.createForClass(Exam);

ExamSchema.index({ name: 1 });
ExamSchema.index({ code: 1 });
ExamSchema.index({ isActive: 1 });

ExamSchema.virtual('id').get(function () {
  return this._id.toString();
});

ExamSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: MongoSerialized) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});