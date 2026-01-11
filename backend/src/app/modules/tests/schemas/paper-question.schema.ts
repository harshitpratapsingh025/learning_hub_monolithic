import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Transform } from "class-transformer";

export type PaperSectionDocument = PaperSection & Document;

@Schema({ collection: 'paper_sections', timestamps: true })
export class PaperSection {
  @Transform(({ value }) => value.toString())
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Paper', index: true })
  paperId: Types.ObjectId;

  @Prop({ required: true, index: true })
  sectionId: string;

  @Prop({ required: true })
  sectionName: string;

  @Prop({ default: false })
  isOptional: boolean;

  @Prop({ default: true })
  isMandatory: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Question' }], required: true })
  questionIds: Types.ObjectId[];

  @Prop({ min: 1 })
  displayOrder?: number;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const PaperSectionSchema = SchemaFactory.createForClass(PaperSection);

// Virtual for ID
PaperSectionSchema.virtual('id').get(function () {
  return this._id.toString();
});

// JSON Transform
PaperSectionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    ret.paperId = ret.paperId?.toString();
    ret.questionIds = ret.questionIds?.map((id: Types.ObjectId) => id.toString());
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

// Legacy exports for backward compatibility
export const PaperQuestion = PaperSection;
export const PaperQuestionSchema = PaperSectionSchema;