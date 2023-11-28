import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CatDocument = HydratedDocument<Cat>;

@Schema()
export class CatToys {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  price: number;
}

export const CatToysSchema = SchemaFactory.createForClass(CatToys);

@Schema()
export class Cat {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  age: number;

  @Prop({ required: true })
  breed: string;

  @Prop({ default: [] })
  tags: string[];

  @Prop({ default: [], type: [CatToysSchema] })
  toys: CatToys[];
}

export const CatSchema = SchemaFactory.createForClass(Cat);
