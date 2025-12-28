import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Role extends Document {
  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({ trim: true, nullable: true })
  description?: string;

  @Prop({ name: 'is_active', default: true })
  isActive!: boolean;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
