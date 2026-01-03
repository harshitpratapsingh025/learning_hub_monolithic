import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type MockTestDocument = MockTest & Document;

@Schema({ collection: 'mock_tests', timestamps: true })
export class MockTest {
  @Prop({ required: true })
  exam_id: number;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['easy', 'medium', 'hard'] })
  difficulty: string;

  @Prop({ required: true })
  duration_minutes: number;

  @Prop({ required: true })
  total_questions: number;

  @Prop({ required: true, type: Number })
  total_marks: number;

  @Prop({ default: true })
  is_active: boolean;

  @Prop({ type: Date, default: Date.now })
  created_at: Date;
}

export const MockTestSchema = SchemaFactory.createForClass(MockTest);