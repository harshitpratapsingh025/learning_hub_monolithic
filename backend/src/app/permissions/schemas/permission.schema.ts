import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { MongoSerialized } from '../../common';

@Schema({ timestamps: true })
export class Permission extends Document {
  @Prop({ required: true, trim: true, index: true })
  name!: string;

  @Prop({ required: true, trim: true })
  resource!: string;

  @Prop({ required: true, trim: true })
  action!: string;

  @Prop({ trim: true, nullable: true })
  description?: string;

  @Prop({ default: true })
  isActive!: boolean;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);

PermissionSchema.set('toJSON', {
  transform: (_doc, ret: MongoSerialized) => {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
