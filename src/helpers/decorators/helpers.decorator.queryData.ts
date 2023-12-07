import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SortDirection } from 'mongodb';

export const QueryData = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    function skipPages(pageNumber: number, pageSize: number) {
      return (+pageNumber - 1) * +pageSize;
    }
    const query = request.query;
    //getDataFromQuery(query: any): queryDataType
    const pageNumber: number = query.pageNumber ? +query.pageNumber : 1; // NaN
    const pageSize: number = query.pageSize ? +query.pageSize : 10; // NaN
    const sortBy: string = query.sortBy ? query.sortBy : 'createdAt';
    const sortDirection: SortDirection = query.sortDirection === 'asc' ? 1 : -1;
    const searchNameTerm = query.searchNameTerm ? query.searchNameTerm : '';
    const searchLoginTerm = query.searchLoginTerm ? query.searchLoginTerm : '';
    const searchEmailTerm = query.searchEmailTerm ? query.searchEmailTerm : '';
    const skippedPages: number = skipPages(pageNumber, pageSize);

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
  },
);
