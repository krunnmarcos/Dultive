import { Response } from 'express';
import Post from '../models/Post';
import User from '../models/User';
import Like from '../models/Like'; // Import Like model
import { AuthRequest } from '../middlewares/authMiddleware'; // Importando a interface

export const createPost = async (req: AuthRequest, res: Response) => {
  const { postType, title, description, category, tags, images, location } = req.body;
  const authorId = req.user?.id;

  try {
    const user = await User.findById(authorId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // Regra de negócio: Empresas só podem criar posts de doação
    if (user.userType === 'company' && postType !== 'donation') {
      return res.status(403).json({ message: 'Empresas podem apenas criar posts de doação.' });
    }

    const newPost = new Post({
      authorId,
      postType,
      title,
      description,
      category,
      tags,
      images,
      location,
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor ao criar post.', error });
  }
};

export const getPosts = async (req: AuthRequest, res: Response) => {
  try {
    const posts = await Post.find({ isActive: true })
      .populate('authorId', 'name profileImage phone userType isVerified') // Popula com informações do autor
      .sort({ createdAt: -1 }); // Ordena pelos mais recentes

    const userId = req.user?.id; // Get authenticated user ID

    const postsWithLikeStatus = await Promise.all(posts.map(async (post) => {
      let isLiked = false;
      if (userId) {
        const existingLike = await Like.findOne({ postId: post._id, userId });
        isLiked = !!existingLike;
      }
      return { ...post.toObject(), isLiked };
    }));

    res.status(200).json(postsWithLikeStatus);
  } catch (error) {
    console.error('getPosts error:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar posts.', error });
  }
};

export const searchPosts = async (req: AuthRequest, res: Response) => {
  const { q, postType, category } = req.query;

  try {
    const query: any = { isActive: true };

    if (q) {
      const regex = new RegExp(q as string, 'i'); // 'i' para case-insensitive
      query.$or = [{ title: regex }, { description: regex }, { tags: regex }];
    }

    if (postType && ['donation', 'help_request'].includes(postType as string)) {
      query.postType = postType;
    }

    if (category) {
      query.category = category;
    }

    const posts = await Post.find(query)
      .populate('authorId', 'name profileImage phone userType isVerified')
      .sort({ createdAt: -1 });

    const userId = req.user?.id; // Get authenticated user ID

    const postsWithLikeStatus = await Promise.all(posts.map(async (post) => {
      let isLiked = false;
      if (userId) {
        const existingLike = await Like.findOne({ postId: post._id, userId });
        isLiked = !!existingLike;
      }
      return { ...post.toObject(), isLiked };
    }));

    res.status(200).json(postsWithLikeStatus);
  } catch (error) {
    console.error('searchPosts error:', error);
    res.status(500).json({ message: 'Erro no servidor ao realizar busca.', error });
  }
};

export const getMyPosts = async (req: AuthRequest, res: Response) => {
  const authorId = req.user?.id;

  try {
    const posts = await Post.find({ authorId: authorId, isActive: true })
      .populate('authorId', 'name profileImage phone userType isVerified')
      .sort({ createdAt: -1 });

    const userId = req.user?.id; // Get authenticated user ID

    const postsWithLikeStatus = await Promise.all(posts.map(async (post) => {
      let isLiked = false;
      if (userId) {
        const existingLike = await Like.findOne({ postId: post._id, userId });
        isLiked = !!existingLike;
      }
      return { ...post.toObject(), isLiked };
    }));

    res.status(200).json(postsWithLikeStatus);
  } catch (error) {
    console.error('getMyPosts error:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar seus posts.', error });
  }
};

export const toggleLike = async (req: AuthRequest, res: Response) => {
  const { id: postId } = req.params; // Get post ID from parameters
  const userId = req.user?.id; // Get user ID from authenticated user

  try {
    const post = await Post.findById(postId);
    if (!post) {
      console.log(`ToggleLike Error: Post with ID ${postId} not found.`);
      return res.status(404).json({ message: 'Post não encontrado.' });
    }

    // Check if user has already liked the post
    const existingLike = await Like.findOne({
      postId,
      userId,
    });

    if (existingLike) {
      // If already liked, unlike it
      await Like.deleteOne({ _id: existingLike._id });
      post.likesCount = (post.likesCount || 0) - 1;
      await post.save();
      console.log(`ToggleLike Success: User ${userId} unliked post ${postId}. New likes count: ${post.likesCount}`);
      res.status(200).json({ message: 'Like removido com sucesso.', likes: post.likesCount });
    } else {
      // If not liked, like it
      const newLike = new Like({
        postId,
        userId,
      });
      await newLike.save();
      post.likesCount = (post.likesCount || 0) + 1;
      await post.save();
      console.log(`ToggleLike Success: User ${userId} liked post ${postId}. New likes count: ${post.likesCount}`);
      res.status(200).json({ message: 'Like adicionado com sucesso.', likes: post.likesCount });
    }
  } catch (error) {
    console.error(`ToggleLike Error: Failed to process like for post ${postId} by user ${userId}. Error:`, error);
    res.status(500).json({ message: 'Erro no servidor ao processar like.', error });
  }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const post = await Post.findById(id);

    if (!post || !post.isActive) {
      return res.status(404).json({ message: 'Post não encontrado.' });
    }

    if (post.authorId.toString() !== userId) {
      return res.status(403).json({ message: 'Você não tem permissão para deletar este post.' });
    }

    post.isActive = false;
    await post.save();

    res.status(200).json({ message: 'Post deletado com sucesso.' });
  } catch (error) {
    console.error('deletePost error:', error);
    res.status(500).json({ message: 'Erro no servidor ao deletar post.', error });
  }
};

