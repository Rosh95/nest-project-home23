import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';

export type DeviceViewModel = {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;
};

export type DeviceViewModelArray = DeviceViewModel[];

export type DeviceDBModel = {
  userId: string;
  issuedAt: number;
  expirationAt: number;
  deviceId: string;
  ip: string;
  deviceName: string;
};

export type deviceInputValue = {
  userId: string;
  deviceId: string;
  refreshToken: string;
  deviceName: string;
  ip: string;
};

// export const DeviceSchema = new mongoose.Schema<DeviceDBModel>({
//   userId: { type: String, require: true },
//   issuedAt: { type: Number, require: true },
//   expirationAt: { type: Number, require: true },
//   deviceId: { type: String, require: true },
//   ip: { type: String, require: true },
//   deviceName: { type: String, require: true },
// });

export type DeviceDocument = HydratedDocument<Device>;

@Schema()
export class Device {
  _id: ObjectId;
  @Prop({ type: String, required: true })
  userId: string;
  @Prop({ type: Number, required: true })
  issuedAt: number;
  @Prop({ type: Number, required: true })
  expirationAt: number;
  @Prop({ type: String, required: true })
  deviceId: string;
  @Prop({ type: String, required: true })
  ip: string;

  @Prop({ type: String, required: true })
  deviceName: string;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
