import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type TestSessionDocument = TestSession & Document;

@Schema({ collection: 'test_sessions', timestamps: true })
export class TestSession {
  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true, enum: ['paper', 'mock', 'subject'] })
  test_type: string;

  @Prop({ required: true })
  test_id: string;

  @Prop({ required: true, type: Date, default: Date.now })
  started_at: Date;

  @Prop({ type: Date })
  submitted_at: Date;

  @Prop()
  time_taken_seconds: number;

  @Prop({ enum: ['in_progress', 'submitted', 'abandoned'], default: 'in_progress' })
  status: string;

  @Prop({ default: 0 })
  total_attempted: number;

  @Prop({ default: 0 })
  correct_answers: number;

  @Prop({ default: 0 })
  incorrect_answers: number;

  @Prop()
  unanswered: number;

  @Prop({ type: Number })
  total_marks_scored: number;

  @Prop({ type: Number })
  total_marks_possible: number;

  @Prop({ type: Number })
  accuracy_percentage: number;

  @Prop({ type: Date, default: Date.now })
  created_at: Date;

  @Prop({ type: Date, default: Date.now })
  updated_at: Date;
}

export const TestSessionSchema = SchemaFactory.createForClass(TestSession);

// Create indexes
TestSessionSchema.index({ user_id: 1 });
TestSessionSchema.index({ user_id: 1, status: 1 });
TestSessionSchema.index({ user_id: 1, test_type: 1, test_id: 1, status: 1 });

// Update timestamp on save
TestSessionSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});
