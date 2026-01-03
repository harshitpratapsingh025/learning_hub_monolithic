import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaperDocument = Paper & Document;

@Schema({ collection: 'papers', timestamps: true })
export class Paper {
  @Prop({ required: true })
  exam_id: number;

  @Prop({ required: true })
  year: string;

  @Prop()
  shift: string;

  @Prop({ required: true })
  paper_name: string;

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

export const PaperSchema = SchemaFactory.createForClass(Paper);