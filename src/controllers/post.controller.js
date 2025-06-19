import { AppError } from '../middleware/errorHandler.js';
import Post from '../models/post.model.js';

// Create post
export const createPost = async (req, res, next) => {
  try {
    const { title, content, type = 'text', tags = [], organizationId, groupId } = req.body;

    const post = await Post.create({
      title,
      content,
      type,
      tags,
      author: req.user.id,
      organization: organizationId,
      group: groupId
    });

    await post.populate('author', 'username');

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// Get all posts
export const getPosts = async (req, res, next) => {
  try {
    const { 
      organizationId, 
      groupId, 
      type,
      tags,
      page = 1,
      limit = 10,
      sort = '-createdAt'
    } = req.query;

    const query = {};

    if (organizationId) query.organization = organizationId;
    if (groupId) query.group = groupId;
    if (type) query.type = type;
    if (tags) query.tags = { $in: tags.split(',') };

    const posts = await Post.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'username')
      .populate('organization', 'name')
      .populate('group', 'name');

    const total = await Post.countDocuments(query);

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get post by ID
export const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username')
      .populate('organization', 'name')
      .populate('group', 'name')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username'
        }
      });

    if (!post) {
      throw new AppError(404, 'Post not found');
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// Update post
export const updatePost = async (req, res, next) => {
  try {
    const { title, content, tags } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      throw new AppError(404, 'Post not found');
    }

    // Check if user is author
    if (post.author.toString() !== req.user.id) {
      throw new AppError(403, 'Not authorized to update this post');
    }

    post.title = title || post.title;
    post.content = content || post.content;
    post.tags = tags || post.tags;
    await post.save();

    await post.populate('author', 'username');

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// Delete post
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      throw new AppError(404, 'Post not found');
    }

    // Check if user is author
    if (post.author.toString() !== req.user.id) {
      throw new AppError(403, 'Not authorized to delete this post');
    }

    await post.remove();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Like/unlike post
export const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      throw new AppError(404, 'Post not found');
    }

    const likeIndex = post.likes.indexOf(req.user.id);

    if (likeIndex === -1) {
      post.likes.push(req.user.id);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// Add comment
export const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      throw new AppError(404, 'Post not found');
    }

    post.comments.push({
      content,
      author: req.user.id
    });

    await post.save();
    await post.populate({
      path: 'comments.author',
      select: 'username'
    });

    res.status(200).json({
      success: true,
      data: post.comments[post.comments.length - 1]
    });
  } catch (error) {
    next(error);
  }
};

// Delete comment
export const deleteComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      throw new AppError(404, 'Post not found');
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      throw new AppError(404, 'Comment not found');
    }

    // Check if user is comment author
    if (comment.author.toString() !== req.user.id) {
      throw new AppError(403, 'Not authorized to delete this comment');
    }

    comment.remove();
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
