import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserRoleDocument = UserRole & Document;

@Schema({ timestamps: true, collection: 'user_roles' })
export class UserRole {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  roleId!: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  assignedAt!: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedBy?: Types.ObjectId;
}

export const UserRoleSchema = SchemaFactory.createForClass(UserRole);

UserRoleSchema.index({ userId: 1, roleId: 1 }, { unique: true });
UserRoleSchema.index({ userId: 1 });
UserRoleSchema.index({ roleId: 1 });