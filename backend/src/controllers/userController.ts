import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';

const serializeUser = (user: any) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  userType: user.userType,
  phone: user.phone,
  profileImage: user.profileImage,
  points: user.points,
  location: user.location,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json(serializeUser(user));
  } catch (error) {
    console.error('getProfile error:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar perfil.', error });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    const { name, phone, profileImage, location } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'O nome é obrigatório.' });
    }

    const updateData: any = {
      name: name.trim(),
    };

    if (typeof phone !== 'undefined') {
      updateData.phone = phone;
    }

    if (typeof profileImage !== 'undefined') {
      updateData.profileImage = profileImage;
    }

    if (location) {
      updateData.location = location;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    res.status(200).json(serializeUser(updatedUser));
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ message: 'Erro no servidor ao atualizar perfil.', error });
  }
};
