import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api'; // Import api

// Interface para as props do PostCard
export interface PostCardProps {
  _id: string; // Adicionando _id para a key
  authorId: {
    name: string;
    profileImage?: string;
  };
  location?: {
    address: string;
  };
  createdAt: string;
  postType: 'donation' | 'help_request';
  title: string;
  description: string;
  images?: string[];
  likes?: number;
  isLiked?: boolean; // Add isLiked property
}

const PostCard: React.FC<PostCardProps> = (post) => {
  const { _id, authorId, location, createdAt, postType, title, description, images, likes: initialLikes = 0, isLiked: initialIsLiked = false } = post;
  const [liked, setLiked] = useState(initialIsLiked); // Initialize with initialIsLiked
  const [likes, setLikes] = useState(initialLikes);

  // Use useEffect to update 'liked' state when 'initialIsLiked' prop changes
  useEffect(() => {
    setLiked(initialIsLiked);
  }, [initialIsLiked]); // Dependency array: re-run effect when initialIsLiked changes

  useEffect(() => {
    setLikes(initialLikes);
  }, [initialLikes]);

  // Formatar a data para algo mais legível
  const formattedDate = new Date(createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

  const handleLike = async () => {
    const previousLiked = liked;
    const previousLikes = likes;

    setLiked(!previousLiked);
    setLikes(previousLiked ? previousLikes - 1 : previousLikes + 1);

    try {
      const response = await api.post(`/posts/${_id}/like`);

      if (response?.data?.likes !== undefined) {
        setLikes(response.data.likes);
      }
    } catch (error) {
      console.error('Error liking/unliking post:', error);
      // Revert UI changes if API call fails
      setLiked(previousLiked);
      setLikes(previousLikes);
    }
  };

  const formatLikes = (count: number) => {
    if (count === 0) {
      return 'Curtir';
    }
    if (count === 1) {
      return '1 Curtida';
    }
    return `${count} Curtidas`;
  };

  return (
    <View style={styles.card}>
      {/* Header do Card */}
      <View style={styles.header}>
        <Image
          source={authorId && authorId.profileImage ? { uri: authorId.profileImage } : require('../../assets/icon.png')}
          style={styles.avatar}
        />
        <View style={styles.headerText}>
          <Text style={styles.authorName} numberOfLines={1}>{authorId?.name || 'Usuário'}</Text>
          <Text style={styles.location} numberOfLines={1}>{location?.address || 'Local não informado'} • {formattedDate}</Text>
        </View>
        {postType === 'help_request' && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Preciso de Ajuda</Text>
          </View>
        )}
        {postType === 'donation' && (
          <View style={[styles.badge, styles.donationBadge]}>
            <Text style={styles.badgeText}>Doação</Text>
          </View>
        )}
      </View>

      {/* Conteúdo do Post */}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description} numberOfLines={2}>{description}</Text>
      {images && images.length > 0 && <Image source={{ uri: images[0] }} style={styles.postImage} />}

      {/* Ações do Post */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={24} color={liked ? COLORS.error : COLORS.icon} />
          <Text style={styles.actionText}>{formatLikes(likes)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-social-outline" size={24} color={COLORS.icon} />
          <Text style={styles.actionText}>Compartilhar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.donateButton]}>
          <Text style={styles.donateButtonText}>{postType === 'donation' ? 'Quero Ajuda' : 'Quero Ajudar'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 15,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerText: {
    flex: 1,
    flexShrink: 1,
    marginRight: 10,
  },
  authorName: {
    fontWeight: 'bold',
  },
  location: {
    color: COLORS.icon,
    fontSize: 12,
  },
  badge: {
    backgroundColor: COLORS.error,
    borderRadius: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  donationBadge: {
    backgroundColor: COLORS.primary,
  },
  badgeText: {
    color: COLORS.card,
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.background,
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 5,
    color: COLORS.icon,
  },
  donateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  donateButtonText: {
    color: COLORS.card,
    fontWeight: 'bold',
  },
});

export default PostCard;
