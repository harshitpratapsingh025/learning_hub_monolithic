import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export type SubjectTestQuestionDocument = SubjectTestQuestion & Document;

@Schema({ collection: 'subject_test_questions' })
export class SubjectTestQuestion {
  @Prop({ required: true, type: Types.ObjectId, ref: 'SubjectTest' })
  subject_test_id: Types.ObjectId;

  @Prop({ required: true })
  question_id: number;

  @Prop({ required: true })
  question_order: number;
}

export const SubjectTestQuestionSchema = SchemaFactory.createForClass(SubjectTestQuestion);

SubjectTestQuestionSchema.index({ subject_test_id: 1, question_id: 1 }, { unique: true });
SubjectTestQuestionSchema.index({ subject_test_id: 1, question_order: 1 }, { unique: true });