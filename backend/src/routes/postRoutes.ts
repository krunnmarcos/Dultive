import { Router } from 'express';
import { createPost, getPosts, searchPosts, getMyPosts, toggleLike, deletePost } from '../controllers/postController'; // Import toggleLike
import { protect, optionalAuth } from '../middlewares/authMiddleware';

const router = Router();

// Rota de busca
router.get('/search', optionalAuth, searchPosts);

// Rota para buscar os posts do usuário logado
router.get('/my-posts', protect, getMyPosts);

// Rota para dar/remover like em um post
router.post('/:id/like', protect, toggleLike); // New route for liking/unliking
router.delete('/:id', protect, deletePost);

// Rotas de Posts
router.route('/')
  .post(protect, createPost) // Rota para criar post (protegida)
  .get(optionalAuth, getPosts);             // Rota para listar posts (pública)

export default router;
