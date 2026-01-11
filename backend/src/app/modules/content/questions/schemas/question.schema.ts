import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Transform } from 'class-transformer';

export type QuestionDocument = Question & Document;

export enum QuestionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum QuestionType {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
  NUMERICAL = 'numerical',
  MCQ = 'mcq',
}

export enum QuestionSource {
  PREVIOUS_YEAR = 'previous_year',
  MOCK = 'mock',
  SUBJECT = 'subject',
}

@Schema({ _id: true })
class Option {
  @Transform(({ value }) => value?.toString())
  _id: Types.ObjectId;

  @Prop({ required: true })
  optionKey: string; // A, B, C, D

  @Prop({ required: true })
  textEn: string;

  @Prop()
  textHi?: string;

  @Prop()
  image?: string;

  @Prop({ required: true, default: false })
  isCorrect: boolean;
}

const OptionSchema = SchemaFactory.createForClass(Option);

@Schema({ _id: false })
class QuestionContent {
  @Prop({ required: true })
  question: string;

  @Prop({ type: [Object], default: [] })
  options: any[];

  @Prop()
  explanation?: string;
}

@Schema({ _id: false })
class Marks {
  @Prop({ required: true })
  positive: number;

  @Prop({ required: true })
  negative: number;

  @Prop()
  partial?: number;
}

@Schema({ _id: false })
class Solution {
  @Prop()
  text?: string;

  @Prop()
  type?: string;

  @Prop()
  videoUrl?: string;
}

@Schema({ timestamps: true, collection: 'questions' })
export class Question {
  @Transform(({ value }) => value.toString())
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  examId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  subjectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  chapterId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  topicId?: Types.ObjectId;

  @Prop({ type: String, enum: QuestionType, default: QuestionType.MCQ })
  type: string;

  @Prop({ type: Marks, required: true })
  marks: Marks;

  @Prop({ type: Object, required: true })
  content: {
    en: QuestionContent;
    hn?: QuestionContent;
  };

  @Prop({ default: false })
  hasImage: boolean;

  @Prop()
  correctOption?: string;

  @Prop({ type: [String] })
  multiCorrectOptions?: string[];

  @Prop({ type: Object })
  range?: {
    start: string;
    end: string;
  };

  @Prop({ type: Object })
  solution?: {
    en?: Solution;
    hn?: Solution;
  };

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;

  @Prop({ type: Date })
  createdAt: Date;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

// Indexes
QuestionSchema.index({ examId: 1, subjectId: 1 });
QuestionSchema.index({ examId: 1, subjectId: 1, chapterId: 1 });
QuestionSchema.index({ examId: 1, subjectId: 1, chapterId: 1, topicId: 1 });
QuestionSchema.index({ examId: 1, isActive: 1 });
QuestionSchema.index({ subjectId: 1, isActive: 1 });
QuestionSchema.index({ tags: 1 });

// Virtual for ID
QuestionSchema.virtual('id').get(function () {
  return this._id.toString();
});

QuestionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    ret.examId = ret.examId?.toString();
    ret.subjectId = ret.subjectId?.toString();
    ret.chapterId = ret.chapterId?.toString();
    ret.topicId = ret.topicId?.toString();
    
    // Transform option IDs
    if (ret.options) {
      ret.options = ret.options.map((opt: any) => ({
        ...opt,
        id: opt._id?.toString(),
        _id: undefined,
      }));
    }
    
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});