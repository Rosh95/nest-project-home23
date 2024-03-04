import { SortDirection } from 'mongodb';
import { validateOrReject } from 'class-validator';
import { BadRequestException } from '@nestjs/common';

export type queryDataType = {
  pageNumber: number;
  pageSize: number;
  sortBy: string;
  sortDirection: SortDirection;
  searchNameTerm?: string;
  searchLoginTerm?: string;
  searchEmailTerm?: string;
  skippedPages: number;
};

export class Helpers {
  // getDataFromQuery(query: any): queryDataType {
  //   const pageNumber: number = query.pageNumber ? +query.pageNumber : 1; // NaN
  //   const pageSize: number = query.pageSize ? +query.pageSize : 10; // NaN
  //   const sortBy: string = query.sortBy ? query.sortBy : 'createdAt';
  //   const sortDirection: SortDirection = query.sortDirection === 'asc' ? 1 : -1;
  //   const searchNameTerm = query.searchNameTerm ? query.searchNameTerm : '';
  //   const searchLoginTerm = query.searchLoginTerm ? query.searchLoginTerm : '';
  //   const searchEmailTerm = query.searchEmailTerm ? query.searchEmailTerm : '';
  //   const skippedPages: number = this.skipPages(pageNumber, pageSize);
  //
  //   return {
  //     pageNumber,
  //     pageSize,
  //     sortBy,
  //     sortDirection,
  //     searchNameTerm,
  //     searchLoginTerm,
  //     searchEmailTerm,
  //     skippedPages,
  //   };
  // }
  // skipPages(pageNumber: number, pageSize: number) {
  //   return (+pageNumber - 1) * +pageSize;
  // }

  async validateOrRejectModel(model: any, ctor: any) {
    try {
      if (model instanceof ctor === false) {
        throw new Error('Incorrect input data');
      }
    } catch (e) {
      console.log(e);
      return e.value, e.message;
    }
    try {
      await validateOrReject(model);
      return true;
    } catch (error) {
      const errorsForResponse: any = [];

      error.forEach((e) => {
        const constraintsKeys = Object.keys(e.constraints!);
        constraintsKeys.forEach((ckey) => {
          errorsForResponse.push({
            message: e.constraints![ckey],
            field: e.property,
          });
        });
      });

      throw new BadRequestException(errorsForResponse);
    }
  }
}
export class newPaginatorViewType<T> {
  public pagesCount: number;
  constructor(
    public page: number,
    public pageSize: number,
    public totalCount: number,
    public items: T[],
  ) {
    this.pagesCount = totalCount / pageSize;
  }
}
//const obj: newPaginatorViewType<Blog> = {}
// const newBlog = new Blog();
// new newPaginatorViewType(2, 5, 3, [newBlog]);

// export const getDataFromQuery = async (query: any): Promise<queryDataType> => {
//   const pageNumber: number = query.pageNumber ? +query.pageNumber : 1; // NaN
//   const pageSize: number = query.pageSize ? +query.pageSize : 10; // NaN
//   const sortBy: string = query.sortBy ? query.sortBy : 'createdAt';
//   const sortDirection: SortDirection = query.sortDirection === 'asc' ? 1 : -1;
//   const searchNameTerm = query.searchNameTerm ? query.searchNameTerm : '';
//   const searchLoginTerm = query.searchLoginTerm ? query.searchLoginTerm : '';
//   const searchEmailTerm = query.searchEmailTerm ? query.searchEmailTerm : '';
//   const skippedPages: number = skipPages(pageNumber, pageSize);
//
//   return {
//     pageNumber,
//     pageSize,
//     sortBy,
//     sortDirection,
//     searchNameTerm,
//     searchLoginTerm,
//     searchEmailTerm,
//     skippedPages,
//   };
// };
// export function skipPages(pageNumber: number, pageSize: number) {
//   return (+pageNumber - 1) * +pageSize;
// }
