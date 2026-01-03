import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type SubjectTestDocument = SubjectTest & Document;

@Schema({ collection: 'subject_tests', timestamps: true })
export class SubjectTest {
  @Prop({ required: true })
  exam_id: number;

  @Prop({ required: true })
  subject_id: number;

  @Prop({ required: true })
  name: string;

  @Prop()
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

export const SubjectTestSchema = SchemaFactory.createForClass(SubjectTest);