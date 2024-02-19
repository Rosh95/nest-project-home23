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
@Injectable()
export class ParseStringPipe implements PipeTransform {
  // transform(value: any, metadata: ArgumentMetadata) {
  //   return new Object(value);
  // }
  transform(value: any, metadata: ArgumentMetadata) {
    console.log(metadata);
    try {
      const isValid =
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89AB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/i.test(
          value,
        );
      if (isValid) {
        return String(value);
      }
      throw new NotFoundException();
    } catch (e) {
      throw new NotFoundException();
    }
  }
}
