import { Types } from 'mongoose';

export interface MongoSerialized {
  _id?: Types.ObjectId;
  __v?: number;
  id?: string;
}
