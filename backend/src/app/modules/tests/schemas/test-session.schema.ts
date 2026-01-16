import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Transform } from "class-transformer";

export type TestSessionDocument = TestSession & Document;

@Schema({ collection: 'test_sessions', timestamps: true })
export class TestSession {
  @Transform(({ value }) => value.toString())
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: ['paper', 'mock', 'subject'], index: true })
  testType: string;

  @Prop({ required: true, type: Types.ObjectId, index: true })
  testId: Types.ObjectId;

  @Prop({ required: true })
  testTitle: string;

  @Prop({ required: true, type: Date, default: Date.now })
  startedAt: Date;

  @Prop({ type: Date })
  submittedAt?: Date;

  @Prop({ min: 0 })
  timeTakenSeconds?: number;

  @Prop({ min: 0 })
  totalDurationMinutes?: number;

  @Prop({ enum: ['in_progress', 'submitted', 'abandoned'], default: 'in_progress', index: true })
  status: string;

  @Prop({ default: 0, min: 0 })
  totalAttempted: number;

  @Prop({ default: 0, min: 0 })
  correctAnswers: number;

  @Prop({ default: 0, min: 0 })
  incorrectAnswers: number;

  @Prop({ min: 0 })
  unanswered?: number;

  @Prop({ type: Number })
  totalMarksScored?: number;

  @Prop({ type: Number, min: 0 })
  totalMarksPossible?: number;

  @Prop({ type: Number, min: 0, max: 100 })
  accuracyPercentage?: number;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const TestSessionSchema = SchemaFactory.createForClass(TestSession);

// Indexes
TestSessionSchema.index({ userId: 1, status: 1 });
TestSessionSchema.index({ userId: 1, testType: 1, testId: 1, status: 1 });
TestSessionSchema.index({ userId: 1, createdAt: -1 });

// Virtual for ID
TestSessionSchema.virtual('id').get(function () {
  return this._id.toString();
});

// JSON Transform
TestSessionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    ret.userId = ret.userId?.toString();
    ret.testId = ret.testId?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
