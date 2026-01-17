import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Transform } from 'class-transformer';
import { Cutoffs } from './cutoffs.schema';

export type PaperDocument = Paper & Document;

@Schema({ collection: 'papers', timestamps: true })
export class Paper {
  @Transform(({ value }) => value.toString())
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Exam', index: true })
  examId: Types.ObjectId;

  @Prop({ required: true, index: true })
  title: string;

  @Prop()
  code?: string;

  @Prop()
  examType?: string;

  @Prop({ default: true })
  isPreviousYear: boolean;

  @Prop({ default: false, index: true })
  isLive: boolean;

  @Prop({ default: false, index: true })
  isMock: boolean;

  @Prop({ index: true })
  year: string;

  @Prop()
  shift?: string;

  @Prop()
  course?: string;

  @Prop({ required: true })
  paperName: string;

  @Prop({ required: true, min: 1 })
  durationMinutes: number;

  @Prop({ required: true, min: 1 })
  totalQuestions: number;

  @Prop({ required: true, type: Number, min: 0 })
  totalMarks: number;

  @Prop({ default: false })
  sectionTimeShared: boolean;

  @Prop({ type: [String], default: ['en'] })
  supportedLanguages: string[];

  @Prop({ type: Cutoffs })
  cutoffs?: Cutoffs;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const PaperSchema = SchemaFactory.createForClass(Paper);

// Virtual for ID
PaperSchema.virtual('id').get(function () {
  return this._id.toString();
});

// JSON Transform
PaperSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    ret.examId = ret.examId?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});