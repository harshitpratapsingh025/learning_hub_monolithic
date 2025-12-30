import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Transform } from 'class-transformer';
import { MongoSerialized } from '../../../common';

export type SubjectDocument = Subject & Document;

@Schema({ timestamps: true, collection: 'subjects' })
export class Subject {
  @Transform(({ value }) => value.toString())
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true, ref: 'Exam' })
  examId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ default: 0 })
  displayOrder!: number;
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);

SubjectSchema.index({ examId: 1 });
SubjectSchema.index({ examId: 1, displayOrder: 1 });
SubjectSchema.index({ examId: 1, name: 1 }, { unique: true });

SubjectSchema.virtual('id').get(function () {
  return this._id.toString();
});

SubjectSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: MongoSerialized) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});