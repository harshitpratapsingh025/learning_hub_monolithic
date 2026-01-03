import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export type PaperQuestionDocument = PaperQuestion & Document;

@Schema({ collection: 'paper_questions' })
export class PaperQuestion {
  @Prop({ required: true, type: Types.ObjectId, ref: 'Paper' })
  paper_id: Types.ObjectId;

  @Prop({ required: true })
  question_id: number;

  @Prop({ required: true })
  question_order: number;

  @Prop()
  section: string;
}

export const PaperQuestionSchema = SchemaFactory.createForClass(PaperQuestion);

PaperQuestionSchema.index({ paper_id: 1, question_id: 1 }, { unique: true });
PaperQuestionSchema.index({ paper_id: 1, question_order: 1 }, { unique: true });