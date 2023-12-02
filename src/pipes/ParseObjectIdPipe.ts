import {
  ArgumentMetadata,
  Injectable,
  NotFoundException,
  PipeTransform,
} from '@nestjs/common';
import { Types } from 'mongoose';
@Injectable()
export class ParseObjectIdPipe implements PipeTransform {
  // transform(value: any, metadata: ArgumentMetadata) {
  //   return new Object(value);
  // }
  transform(value: any, metadata: ArgumentMetadata) {
    console.log(metadata);
    try {
      return new Types.ObjectId(value);
    } catch (e) {
      throw new NotFoundException();
    }
  }
}
