import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export type MockTestQuestionDocument = MockTestQuestion & Document;

@Schema({ collection: 'mock_test_questions' })
export class MockTestQuestion {
  @Prop({ required: true, type: Types.ObjectId, ref: 'MockTest' })
  mock_test_id: Types.ObjectId;

  @Prop({ required: true })
  question_id: number;

  @Prop({ required: true })
  question_order: number;

  @Prop()
  section: string;
}

export const MockTestQuestionSchema = SchemaFactory.createForClass(MockTestQuestion);

MockTestQuestionSchema.index({ mock_test_id: 1, question_id: 1 }, { unique: true });
MockTestQuestionSchema.index({ mock_test_id: 1, question_order: 1 }, { unique: true });