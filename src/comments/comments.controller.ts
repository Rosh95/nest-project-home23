import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommentsQueryRepository } from './commentsQuery.repository';
import { CommentsViewModel, LikeStatusOptionVariable } from './comments.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessTokenHeader, UserId } from '../users/decorators/user.decorator';
import { CreateCommentDto } from '../posts/post.types';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteCommentByIdCommand } from './application/use-cases/DeleteCommentById';
import { UpdateCommentByIdCommand } from './application/use-cases/UpdateCommentById';
import { mappingErrorStatus, ResultCode } from '../helpers/heplersType';
import { UpdateCommentLikeStatusByIdCommand } from './application/use-cases/UpdateCommentLikeStatusById';
import { GetUserIdByAccessTokenCommand } from '../jwt/application/use-cases/GetUserIdByAccessToken';
import { ParseObjectIdPipe } from '../pipes/ParseObjectIdPipe';
import { Types } from 'mongoose';

@Injectable()
@Controller('comments')
export class CommentsController {
  constructor(
    public commentQueryRepository: CommentsQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Get(':commentId')
  async getCommentById(
    @Param('commentId', new ParseObjectIdPipe()) commentId: Types.ObjectId,
    @AccessTokenHeader() accessToken: string,
  ) {
    const currentAccessToken = accessToken ? accessToken : null;
    const userId = await this.commandBus.execute(
      new GetUserIdByAccessTokenCommand(currentAccessToken),
    );

    const commentInfo: CommentsViewModel | null =
      await this.commentQueryRepository.getCommentById(
        commentId.toString(),
        userId,
      );

    return commentInfo
      ? commentInfo
      : mappingErrorStatus({
          data: null,
          resultCode: ResultCode.NotFound,
          message: 'couldn`t find comment',
        });
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':commentId')
  @HttpCode(204)
  async deleteCommentById(
    @Param('commentId') commentId: string,
    @UserId() userId: string,
  ) {
    // const isDeleted = await this.commentsService.deleteCommentById(commentId);
    const isDeleted = await this.commandBus.execute(
      new DeleteCommentByIdCommand(commentId, userId),
    );
    if (isDeleted.data === null) return mappingErrorStatus(isDeleted);
    return true;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':commentId')
  @HttpCode(204)
  async updateComment(
    @Param('commentId') commentId: string,
    @Body() { content }: CreateCommentDto,
    @UserId() userId: string,
  ) {
    const updatedComment = await this.commandBus.execute(
      new UpdateCommentByIdCommand(commentId, content, userId),
    );
    if (updatedComment.data === null) return mappingErrorStatus(updatedComment);
    return true;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':commentId/like-status')
  @HttpCode(204)
  async updateCommentLikeStatus(
    @Param('commentId') commentId: string,
    @Body() { likeStatus }: LikeStatusOptionVariable,
    @UserId() userId: string,
  ) {
    const result = await this.commandBus.execute(
      new UpdateCommentLikeStatusByIdCommand(commentId, likeStatus, userId),
    );
    if (result.data === null) return mappingErrorStatus(result);
    return true;
  }
}
