import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Transform } from "class-transformer";

export type SubjectTestDocument = SubjectTest & Document;

@Schema({ collection: 'subject_tests', timestamps: true })
export class SubjectTest {
  @Transform(({ value }) => value.toString())
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Exam', index: true })
  examId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Subject', index: true })
  subjectId: Types.ObjectId;

  @Prop({ required: true, index: true })
  name: string;

  @Prop({ min: 1 })
  durationMinutes?: number;

  @Prop({ required: true, min: 1 })
  totalQuestions: number;

  @Prop({ required: true, type: Number, min: 0 })
  totalMarks: number;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const SubjectTestSchema = SchemaFactory.createForClass(SubjectTest);

// Indexes
SubjectTestSchema.index({ examId: 1, subjectId: 1 });
SubjectTestSchema.index({ examId: 1, isActive: 1 });
SubjectTestSchema.index({ subjectId: 1, isActive: 1 });

// Virtual for ID
SubjectTestSchema.virtual('id').get(function () {
  return this._id.toString();
});

// JSON Transform
SubjectTestSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    ret.examId = ret.examId?.toString();
    ret.subjectId = ret.subjectId?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});