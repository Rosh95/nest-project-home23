import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsRepository } from './comments.repository';
import { CommentsQueryRepository } from './commentsQuery.repository';
import { JwtService } from '../jwt/jwt.service';
import { CommentsViewModel, LikeStatusOption } from './comments.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessTokenHeader, UserId } from '../users/decorators/user.decorator';
import { CreateCommentDto } from '../posts/post.types';

@Injectable()
@Controller('comments')
export class CommentsController {
  constructor(
    public commentsService: CommentsService,
    public commentRepository: CommentsRepository,
    public commentQueryRepository: CommentsQueryRepository,
    public jwtService: JwtService,
  ) {}

  @Get(':commentId')
  async getCommentById(
    @Param('commentId') commentId: string,
    @AccessTokenHeader() accessToken: string,
  ) {
    const currentAccessToken = accessToken ? accessToken : null;
    const userId =
      await this.jwtService.getUserIdByAccessToken(currentAccessToken);

    const commentInfo: CommentsViewModel | null =
      await this.commentQueryRepository.getCommentById(commentId, userId);

    return commentInfo ? commentInfo : new NotFoundException();
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':commentId')
  @HttpCode(204)
  async deleteCommentById(@Param('commentId') commentId: string) {
    const isDeleted = await this.commentsService.deleteCommentById(commentId);
    return isDeleted ? isDeleted : new NotFoundException();
  }

  @UseGuards(JwtAuthGuard)
  @Put(':commentId')
  @HttpCode(204)
  async updateComment(
    @Param('commentId') commentId: string,
    @Body() { content }: CreateCommentDto,
    @UserId() userId: string,
  ) {
    const updatedComment = await this.commentsService.updateCommentById(
      commentId,
      content,
      userId,
    );
    return updatedComment ? true : new NotFoundException();
  }

  @UseGuards(JwtAuthGuard)
  @Put(':commentId/like-status')
  @HttpCode(204)
  async updateCommentLikeStatus(
    @Param('commentId') commentId: string,
    @Body('likeStatus') likeStatus: LikeStatusOption,
    @UserId() userId: string,
  ) {
    const result = await this.commentsService.updateCommentLikeStatusById(
      commentId,
      likeStatus,
      userId,
    );
    return result ? true : new NotFoundException();
  }
}
