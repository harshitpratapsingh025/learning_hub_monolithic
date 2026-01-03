import { Types } from 'mongoose';

export interface MongoSerialized {
  _id?: Types.ObjectId;
  __v?: number;
  id?: string;
  passwordHash?: string;
}

export interface QuestionSerialized {
  _id?: Types.ObjectId;
  __v?: number;
  id?: string;
  examId?: string;
  subjectId?: string;
  topicId?: string;
  options?: any;
}