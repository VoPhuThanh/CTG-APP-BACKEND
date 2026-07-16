import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post as HttpPost,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { Authorized } from '@/cores/decorators/authorized.decorators';
import { CurrentUser } from '@/cores/decorators/current-user.decorators';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-users.interface';
import { PostCategoryCreateDto } from './dtos/create-post-category.dto';
import { PostCreateDto } from './dtos/create-post.dto';
import { PostCategoryQueryDto } from './dtos/post-category-query.dto';
import { PostQueryDto } from './dtos/post-query.dto';
import { PostCategoryUpdateDto } from './dtos/update-post-category.dto';
import { PostUpdateDto } from './dtos/update-post.dto';
import { PostStatus } from './enums/post.enum';
import { PostsService } from './posts.service';

@ApiTags('Posts')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiOperation({
    summary: 'Find public published posts without full HTML bodies',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'categorySlug', required: false, type: String })
  @ApiQuery({ name: 'isFeatured', required: false, enum: ['true', 'false'] })
  @Get('public')
  findPublicPosts(@Query() query: PostQueryDto) {
    return this.postsService.findPublicPosts(query);
  }

  @ApiOperation({ summary: 'Find public active post categories' })
  @Get('public/categories')
  findPublicCategories() {
    return this.postsService.findPublicCategories();
  }

  @ApiOperation({
    summary: 'Find public published post detail with sanitized bilingual HTML',
  })
  @Get('public/:slug')
  findPublicPostBySlug(@Param('slug') slug: string) {
    return this.postsService.findPublicPostBySlug(slug);
  }

  @ApiOperation({ summary: 'Find all post categories' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, enum: ['true', 'false'] })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description:
      'Allowed values: nameEn, nameVi, slug, isActive, displayOrder, createdAt, updatedAt',
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @Authorized('posts:read')
  @Get('categories')
  findAllCategories(@Query() query: PostCategoryQueryDto) {
    return this.postsService.findAllCategories(query);
  }

  @ApiOperation({ summary: 'Find post category by id' })
  @Authorized('posts:read')
  @Get('categories/:categoryId')
  findCategory(@Param('categoryId') categoryId: string) {
    return this.postsService.findCategory(categoryId);
  }

  @ApiOperation({ summary: 'Create post category' })
  @Authorized('posts:create')
  @HttpPost('categories')
  createCategory(
    @Body() dto: PostCategoryCreateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.postsService.createCategory(dto, currentUser);
  }

  @ApiOperation({ summary: 'Update post category by id' })
  @Authorized('posts:update')
  @Patch('categories/:categoryId')
  updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() dto: PostCategoryUpdateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.postsService.updateCategory(categoryId, dto, currentUser);
  }

  @ApiOperation({ summary: 'Soft delete post category' })
  @Authorized('posts:delete')
  @Delete('categories/:categoryId')
  deleteCategory(
    @Param('categoryId') categoryId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.postsService.deleteCategory(categoryId, currentUser);
  }

  @ApiOperation({
    summary: 'Find all post list items without full HTML bodies',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Search by title, slug, short description, content URL, category name, or category slug',
  })
  @ApiQuery({ name: 'status', required: false, enum: PostStatus })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'categorySlug', required: false, type: String })
  @ApiQuery({ name: 'isFeatured', required: false, enum: ['true', 'false'] })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description:
      'Allowed values: titleEn, titleVi, slug, status, isFeatured, displayOrder, publishedAt, createdAt, updatedAt',
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @Authorized('posts:read')
  @Get()
  findAllPosts(@Query() query: PostQueryDto) {
    return this.postsService.findAllPosts(query);
  }

  @ApiOperation({ summary: 'Find post detail with sanitized bilingual HTML' })
  @Authorized('posts:read')
  @Get(':id')
  findPost(@Param('id') id: string) {
    return this.postsService.findPost(id);
  }

  @ApiOperation({ summary: 'Create post' })
  @ApiPayloadTooLargeResponse({
    description: 'POST.CONTENT_TOO_LARGE',
  })
  @Authorized('posts:create')
  @HttpPost()
  createPost(
    @Body() dto: PostCreateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.postsService.createPost(dto, currentUser);
  }

  @ApiOperation({ summary: 'Update post by id' })
  @ApiPayloadTooLargeResponse({
    description: 'POST.CONTENT_TOO_LARGE',
  })
  @Authorized('posts:update')
  @Patch(':id')
  updatePost(
    @Param('id') id: string,
    @Body() dto: PostUpdateDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.postsService.updatePost(id, dto, currentUser);
  }

  @ApiOperation({ summary: 'Soft delete post' })
  @Authorized('posts:delete')
  @Delete(':id')
  deletePost(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.postsService.deletePost(id, currentUser);
  }
}
