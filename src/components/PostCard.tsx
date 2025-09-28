import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Share, Linking } from 'react-native';
import { COLORS } from '../constants/colors';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import api from '../services/api'; // Import api
import { useFeedbackModal } from '../contexts/FeedbackModalContext';
import { Post } from '../types/Post';

// Interface para as props do PostCard
export interface PostCardProps extends Post {
  likes?: number;
}

interface PostCardComponentProps extends PostCardProps {
  onPress?: () => void;
}

const PostCard: React.FC<PostCardComponentProps> = ({ onPress, ...post }) => {
  const {
    _id,
    authorId,
    location,
    createdAt,
    postType,
    title,
    description,
    images,
    isLiked: initialIsLiked = false,
    likesCount = 0,
    likes: explicitLikes,
  } = post;

  const initialLikes = explicitLikes ?? likesCount ?? 0;
  const [liked, setLiked] = useState(initialIsLiked); // Initialize with initialIsLiked
  const [likes, setLikes] = useState(initialLikes);
  const { showModal } = useFeedbackModal();
  const normalizedUserType = authorId?.userType ? String(authorId.userType).trim().toLowerCase() : null;
  const isCompanyAuthor = normalizedUserType === 'company';
  const showVerifiedBadge = isCompanyAuthor || authorId?.isVerified;

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
    } catch (error: any) {
      if (error.response) {
        console.error('Error liking/unliking post:', error.response.status, error.response.data);
      } else {
        console.error('Error liking/unliking post:', error);
      }
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

  const handleShare = async () => {
    try {
      const messageParts = [title];
      if (description) {
        messageParts.push(description);
      }
      if (location?.address) {
        messageParts.push(`Local: ${location.address}`);
      }

      await Share.share({
        title: 'Compartilhar publicação Dultive',
        message: messageParts.join('\n\n'),
      });
    } catch (error) {
      console.error('Erro ao compartilhar post:', error);
    }
  };

  const handleContact = async () => {
    const rawPhone = authorId?.phone ?? '';
    const sanitizedPhone = rawPhone.replace(/\D/g, '');

    if (!sanitizedPhone) {
      showModal({
        title: 'Contato indisponível',
        message: 'Este usuário ainda não cadastrou um número de telefone.',
        type: 'warning',
      });
      return;
    }

    const postTypeDescription = postType === 'help_request' ? 'pedido de ajuda' : 'oferecimento de ajuda';
    const message = `Olá! Vi seu post de ${postTypeDescription} no app Dultive! Podemos conversar?`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `whatsapp://send?phone=${sanitizedPhone}&text=${encodedMessage}`;
    const webFallbackUrl = `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`;

    try {
      const canOpenWhatsapp = await Linking.canOpenURL(whatsappUrl);
      if (canOpenWhatsapp) {
        await Linking.openURL(whatsappUrl);
        return;
      }

      const canOpenWeb = await Linking.canOpenURL(webFallbackUrl);
      if (canOpenWeb) {
        await Linking.openURL(webFallbackUrl);
        return;
      }

      showModal({
        title: 'WhatsApp não disponível',
        message: 'Não foi possível abrir o WhatsApp neste dispositivo.',
        type: 'warning',
      });
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
      showModal({
        title: 'Erro ao abrir WhatsApp',
        message: 'Algo deu errado ao tentar iniciar a conversa. Tente novamente mais tarde.',
        type: 'error',
      });
    }
  };

  const cardContent = (
    <>
      {/* Header do Card */}
      <View style={styles.header}>
        <Image
          source={authorId && authorId.profileImage ? { uri: authorId.profileImage } : require('../../assets/icon.png')}
          style={styles.avatar}
        />
        <View style={styles.headerText}>
          <View style={styles.authorRow}>
            <Text style={styles.authorName} numberOfLines={1}>{authorId?.name || 'Usuário'}</Text>
            {showVerifiedBadge && (
              <MaterialIcons
                name="verified"
                size={20}
                color={COLORS.primary}
                style={styles.verifiedIcon}
                accessibilityLabel="Conta verificada"
                accessibilityRole="image"
              />
            )}
          </View>
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
        <TouchableOpacity style={[styles.actionButton, styles.shareButton]} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={24} color={COLORS.icon} />
          <Text style={styles.actionText}>Compartilhar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.donateButton]} onPress={handleContact}>
          <Text style={styles.donateButtonText}>{postType === 'donation' ? 'Quero Ajuda' : 'Quero Ajudar'}</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.92} onPress={onPress}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.card}>
      {cardContent}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 15,
    marginVertical: 8,
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
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    fontWeight: 'bold',
  },
  verifiedIcon: {
    marginTop: 1,
    marginLeft: 4,
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
  shareButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
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
