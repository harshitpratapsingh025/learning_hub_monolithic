import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Transform } from "class-transformer";

export type MockTestQuestionDocument = MockTestQuestion & Document;

@Schema({ collection: 'mock_test_questions', timestamps: true })
export class MockTestQuestion {
  @Transform(({ value }) => value.toString())
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'MockTest', index: true })
  mockTestId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Question' })
  questionId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  questionOrder: number;

  @Prop()
  section?: string;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const MockTestQuestionSchema = SchemaFactory.createForClass(MockTestQuestion);

// Indexes
MockTestQuestionSchema.index({ mockTestId: 1, questionId: 1 }, { unique: true });
MockTestQuestionSchema.index({ mockTestId: 1, questionOrder: 1 }, { unique: true });
MockTestQuestionSchema.index({ mockTestId: 1 });

// Virtual for ID
MockTestQuestionSchema.virtual('id').get(function () {
  return this._id.toString();
});

// JSON Transform
MockTestQuestionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    ret.mockTestId = ret.mockTestId?.toString();
    ret.questionId = ret.questionId?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});