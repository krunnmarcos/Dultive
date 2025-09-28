export type PostCategory = 'alimentos' | 'roupas' | 'medicamentos' | 'brinquedos';
export type PostType = 'donation' | 'help_request';

export interface PostAuthor {
  _id?: string;
  name?: string;
  profileImage?: string;
  phone?: string;
  userType?: 'person' | 'company';
  isVerified?: boolean;
}

export interface PostLocation {
  address?: string;
}

export interface Post {
  _id: string;
  authorId: PostAuthor;
  location?: PostLocation;
  createdAt: string;
  postType: PostType;
  title: string;
  description: string;
  category?: PostCategory;
  tags?: string[];
  images?: string[];
  likesCount?: number;
  isLiked?: boolean;
}
