import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Transform } from "class-transformer";

export type SubjectTestQuestionDocument = SubjectTestQuestion & Document;

@Schema({ collection: 'subject_test_questions', timestamps: true })
export class SubjectTestQuestion {
  @Transform(({ value }) => value.toString())
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'SubjectTest', index: true })
  subjectTestId: Types.ObjectId;

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

export const SubjectTestQuestionSchema = SchemaFactory.createForClass(SubjectTestQuestion);

// Indexes
SubjectTestQuestionSchema.index({ subjectTestId: 1, questionId: 1 }, { unique: true });
SubjectTestQuestionSchema.index({ subjectTestId: 1, questionOrder: 1 }, { unique: true });
SubjectTestQuestionSchema.index({ subjectTestId: 1 });

// Virtual for ID
SubjectTestQuestionSchema.virtual('id').get(function () {
  return this._id.toString();
});

// JSON Transform
SubjectTestQuestionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    ret.subjectTestId = ret.subjectTestId?.toString();
    ret.questionId = ret.questionId?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});