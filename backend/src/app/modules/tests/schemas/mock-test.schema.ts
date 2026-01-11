import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from 'mongoose';
import { Transform } from 'class-transformer';
import { Cutoffs } from './cutoffs.schema';

export type MockTestDocument = MockTest & Document;

@Schema({ collection: 'mock_tests', timestamps: true })
export class MockTest {
  @Transform(({ value }) => value.toString())
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Exam', index: true })
  examId: Types.ObjectId;

  @Prop({ required: true, index: true })
  name: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  code?: string;

  @Prop()
  examType?: string;

  @Prop({ default: false })
  isPreviousYear: boolean;

  @Prop({ index: true })
  year?: string;

  @Prop()
  shift?: string;

  @Prop()
  course?: string;

  @Prop({ required: true, enum: ['easy', 'medium', 'hard'], index: true })
  difficulty: string;

  @Prop({ required: true, min: 1 })
  durationMinutes: number;

  @Prop({ required: true, min: 1 })
  totalQuestions: number;

  @Prop({ required: true, type: Number, min: 0 })
  totalMarks: number;

  @Prop({ default: false })
  sectionTimeShared: boolean;

  @Prop({ default: false })
  isSectionalSubmit: boolean;

  @Prop({ default: false })
  showCalculator: boolean;

  @Prop({ type: [String], default: ['en'] })
  supportedLanguages: string[];

  @Prop({ type: [String] })
  instructions?: string[];

  @Prop({ type: Cutoffs })
  cutoffs?: Cutoffs;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const MockTestSchema = SchemaFactory.createForClass(MockTest);

// Indexes
MockTestSchema.index({ examId: 1, difficulty: 1 });
MockTestSchema.index({ examId: 1, isActive: 1 });
MockTestSchema.index({ code: 1 }, { sparse: true });

// Virtual for ID
MockTestSchema.virtual('id').get(function () {
  return this._id.toString();
});

// JSON Transform
MockTestSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    ret.examId = ret.examId?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});