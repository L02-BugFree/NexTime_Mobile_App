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

export enum VisibilitySetting {
  EVERYONE = 'everyone',
  FRIENDS = 'friends',
  CONTACTS = 'contacts',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email!: string;

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

  @Prop({
    type: {
      isAnonymousOnHeatmap: { type: Boolean, default: false },
      showBirthday: { type: Boolean, default: true },
      isActiveStatus: { type: Boolean, default: true },
      anonymousOnGroupCalendar: { type: Boolean, default: false },
    },
  })
  privacySettings: {
    isAnonymousOnHeatmap: boolean;
    showBirthday: boolean;
    isActiveStatus: boolean;
    anonymousOnGroupCalendar: boolean;
  };

  @Prop({ type: String })
  bio?: string;

  @Prop()
  birthdate?: Date;

  @Prop({ type: String, enum: Gender })
  gender?: Gender;

  @Prop({ type: String, enum: VisibilitySetting, default: VisibilitySetting.EVERYONE })
  visibilitySetting: VisibilitySetting;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  friends: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  friendRequests: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  blockedUsers: Types.ObjectId[];

  @Prop({ type: String })
  otpCode?: string;

  @Prop({ type: Date })
  otpExpiry?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

