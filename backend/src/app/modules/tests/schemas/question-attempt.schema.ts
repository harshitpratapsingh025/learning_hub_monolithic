import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type QuestionAttemptDocument = QuestionAttempt & Document;

@Schema({ collection: 'question_attempts' })
export class QuestionAttempt {
  @Prop({ required: true, type: Types.ObjectId, ref: 'TestSession' })
  session_id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Question' })
  question_id: Types.ObjectId;

  @Prop()
  selected_option_id: string;

  @Prop()
  is_correct: boolean;

  @Prop()
  time_spent_seconds: number;

  @Prop({ default: false })
  marked_for_review: boolean;

  @Prop({ default: 1 })
  attempt_number: number;

  @Prop({ type: Date, default: Date.now })
  attempted_at: Date;
}

export const QuestionAttemptSchema = SchemaFactory.createForClass(QuestionAttempt);

// Create indexes
QuestionAttemptSchema.index({ session_id: 1 });
QuestionAttemptSchema.index({ session_id: 1, question_id: 1 });