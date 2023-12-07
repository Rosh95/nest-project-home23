import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsRepository } from './comments.repository';
import { CommentsQueryRepository } from './commentsQuery.repository';

import { Request } from 'express';
import { ObjectId } from 'mongodb';
import { jwtService } from '../jwt/jwt.service';
import { CommentsViewModel, LikeStatusOption } from './comments.types';
import { NewUsersDBType } from '../users/user.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Injectable()
@Controller('comments')
export class CommentsController {
  constructor(
    public commentsService: CommentsService,
    public commentRepository: CommentsRepository,
    public commentQueryRepository: CommentsQueryRepository,
  ) {}

  @Get(':commentId')
  async getCommentById(
    @Param('commentId') commentId: string,
    @Req() req: Request,
  ) {
    let userId: ObjectId | null = null;
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      userId = await jwtService.getUserIdByAccessToken(token.toString());
    }
    const commentInfo: CommentsViewModel | null =
      await this.commentQueryRepository.getCommentById(commentId, userId);
    if (!commentInfo) {
      throw new NotFoundException();
    }
    return commentInfo;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':commentId')
  @HttpCode(204)
  async deleteCommentById(@Param('commentId') commentId: string) {
    try {
      const commentInfo =
        await this.commentQueryRepository.getCommentById(commentId);
      if (!commentInfo) {
        throw new NotFoundException();
      }
      const isDeleted = await this.commentsService.deleteCommentById(commentId);

      if (isDeleted) {
        return true;
      } else throw new NotFoundException();
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException();
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(':commentId')
  @HttpCode(204)
  async updateComment(
    @Param('commentId') commentId: string,
    @Body('content') content: string,
  ) {
    try {
      const commentInfo =
        await this.commentQueryRepository.getCommentById(commentId);
      if (!commentInfo) {
        throw new NotFoundException();
      }
      const updatedComment = await this.commentsService.updateCommentById(
        commentId,
        content,
      );
      if (!updatedComment) {
        throw new NotFoundException();
      }
      return true;
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException();
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(':commentId/like-status')
  @HttpCode(204)
  async updateCommentLikeStatus(
    @Param('commentId') commentId: string,
    @Body('likeStatus') likeStatus: LikeStatusOption,
    @Req() req: Request,
  ) {
    const currentUser = req.user;
    try {
      const commentInfo =
        await this.commentRepository.getCommentById(commentId);
      if (!commentInfo) {
        throw new NotFoundException();
      }

      await this.commentsService.updateCommentLikeStatusById(
        commentInfo,
        likeStatus,
        currentUser! as NewUsersDBType,
      );
      return true;
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException();
    }
  }
}
