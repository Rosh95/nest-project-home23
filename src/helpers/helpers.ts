import { SortDirection } from 'mongodb';

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
  getDataFromQuery(query: any): queryDataType {
    const pageNumber: number = query.pageNumber ? +query.pageNumber : 1; // NaN
    const pageSize: number = query.pageSize ? +query.pageSize : 10; // NaN
    const sortBy: string = query.sortBy ? query.sortBy : 'createdAt';
    const sortDirection: SortDirection = query.sortDirection === 'asc' ? 1 : -1;
    const searchNameTerm = query.searchNameTerm ? query.searchNameTerm : '';
    const searchLoginTerm = query.searchLoginTerm ? query.searchLoginTerm : '';
    const searchEmailTerm = query.searchEmailTerm ? query.searchEmailTerm : '';
    const skippedPages: number = this.skipPages(pageNumber, pageSize);

    return {
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      searchNameTerm,
      searchLoginTerm,
      searchEmailTerm,
      skippedPages,
    };
  }
  skipPages(pageNumber: number, pageSize: number) {
    return (+pageNumber - 1) * +pageSize;
  }
}
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
