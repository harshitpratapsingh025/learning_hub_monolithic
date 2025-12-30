import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Exclude, Transform } from 'class-transformer';
import { MongoSerialized } from '../../common';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Transform(({ value }) => value.toString())
  _id!: Types.ObjectId;

  @Prop({ required: true })
  fullName!: string;

  @Prop({ required: true, unique: true, index: true })
  email!: string;

  @Prop({ unique: true, sparse: true })
  phone?: string;

  @Prop({ required: true })
  @Exclude()
  passwordHash!: string;

  @Prop()
  image?: string;

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Role' }], default: [] })
  roles!: Types.ObjectId[];

  @Prop({ type: Date, default: null })
  deletedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Virtual for ID
UserSchema.virtual('id').get(function () {
  return this._id.toString();
});

// Ensure virtuals are included
UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: MongoSerialized) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});