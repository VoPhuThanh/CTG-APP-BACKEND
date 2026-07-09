import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { PostCategory } from './entities/post-category.entity';
import { Post } from './entities/post.entity';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostCategory, User])],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
