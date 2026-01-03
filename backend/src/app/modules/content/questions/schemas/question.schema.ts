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

@Schema({ timestamps: true, collection: 'questions' })
export class Question {
  @Transform(({ value }) => value.toString())
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  examId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  subjectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, index: true })
  topicId?: Types.ObjectId;

  @Prop({ type: String, enum: QuestionDifficulty, required: true, index: true })
  difficulty: QuestionDifficulty;

  @Prop({ type: String, enum: QuestionType, default: QuestionType.SINGLE })
  questionType: QuestionType;

  @Prop({ required: true })
  questionEn: string;

  @Prop()
  questionHi?: string;

  @Prop()
  explanationEn?: string;

  @Prop()
  explanationHi?: string;

  @Prop()
  questionImage?: string;

  @Prop({ default: false })
  hasImage: boolean;

  @Prop({ type: Number, default: 1.0 })
  marks: number;

  @Prop({ type: Number, default: 0.25 })
  negativeMarks: number;

  @Prop({ type: String, enum: QuestionSource })
  createdFrom?: QuestionSource;

  @Prop()
  sourceReference?: string;

  @Prop()
  year?: string;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ type: [OptionSchema], default: [] })
  options: Option[];

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

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