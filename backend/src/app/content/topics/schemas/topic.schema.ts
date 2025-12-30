import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Transform } from 'class-transformer';
import { MongoSerialized } from '../../../common';

export type TopicDocument = Topic & Document;

@Schema({ timestamps: true, collection: 'topics' })
export class Topic {
  @Transform(({ value }) => value.toString())
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true, ref: 'Subject' })
  subjectId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ default: 0 })
  displayOrder!: number;
}

export const TopicSchema = SchemaFactory.createForClass(Topic);

TopicSchema.index({ subjectId: 1 });
TopicSchema.index({ subjectId: 1, displayOrder: 1 });
TopicSchema.index({ subjectId: 1, name: 1 }, { unique: true });

TopicSchema.virtual('id').get(function () {
  return this._id.toString();
});

TopicSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: MongoSerialized) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
