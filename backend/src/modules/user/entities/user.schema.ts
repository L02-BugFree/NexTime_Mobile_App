import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum Language {
  VI = 'vi',
  EN = 'en',
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
  NOT_SPECIFIED = 'NotSpecified',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ default: 'https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff&size=128' })
  avatarUrl: string;

  @Prop({ required: true, unique: true })
  friendCode: string;

  @Prop({ type: String, enum: Language, default: Language.EN })
  language: Language;

  @Prop({ type: String, enum: Theme, default: Theme.DARK })
  theme: Theme;

  @Prop({ type: {
    isAnonymousOnHeatmap: { type: Boolean, default: false },
    showBirthday: { type: Boolean, default: true },
  }})
  privacySettings: {
    isAnonymousOnHeatmap: boolean;
    showBirthday: boolean;
  };

  @Prop()
  birthdate?: Date;

  @Prop({ type: String, enum: Gender })
  gender?: Gender;
}

export const UserSchema = SchemaFactory.createForClass(User);

