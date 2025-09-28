import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Share,
  Linking,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { Post } from '../types/Post';
import api from '../services/api';
import { useFeedbackModal } from '../contexts/FeedbackModalContext';

const { width: screenWidth } = Dimensions.get('window');

type PostDetailsParamList = {
  PostDetails: {
    post: Post;
  };
};

type PostDetailsRouteProp = RouteProp<PostDetailsParamList, 'PostDetails'>;

const formatLikesLabel = (likes: number) => {
  if (likes === 0) return 'Curtir';
  if (likes === 1) return '1 Curtida';
  return `${likes} Curtidas`;
};

const PostDetailsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<PostDetailsRouteProp>();
  const { post } = route.params;
  const { showModal } = useFeedbackModal();

  const [liked, setLiked] = useState<boolean>(post.isLiked ?? false);
  const [likes, setLikes] = useState<number>(post.likesCount ?? 0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const normalizedUserType = post.authorId?.userType
    ? String(post.authorId.userType).trim().toLowerCase()
    : null;
  const isCompanyAuthor = normalizedUserType === 'company';
  const showVerifiedBadge = isCompanyAuthor || post.authorId?.isVerified;

  const createdAtLabel = useMemo(
    () =>
      new Date(post.createdAt).toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [post.createdAt]
  );

  const images = post.images?.length ? post.images : [];

  const handleLike = async () => {
    const previousLiked = liked;
    const previousLikes = likes;

    setLiked(!previousLiked);
    setLikes(previousLiked ? previousLikes - 1 : previousLikes + 1);

    try {
      const response = await api.post(`/posts/${post._id}/like`);
      if (response?.data?.likes !== undefined) {
        setLikes(response.data.likes);
      }
    } catch (error) {
      console.error('Error liking/unliking post:', error);
      setLiked(previousLiked);
      setLikes(previousLikes);
    }
  };

  const handleShare = async () => {
    try {
      const messageParts = [post.title];
      if (post.description) {
        messageParts.push(post.description);
      }
      if (post.location?.address) {
        messageParts.push(`Local: ${post.location.address}`);
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
    const rawPhone = post.authorId?.phone ?? '';
    const sanitizedPhone = rawPhone.replace(/\D/g, '');

    if (!sanitizedPhone) {
      showModal({
        title: 'Contato indisponível',
        message: 'Este usuário ainda não cadastrou um número de telefone.',
        type: 'warning',
      });
      return;
    }

    const postTypeDescription = post.postType === 'help_request' ? 'pedido de ajuda' : 'oferecimento de ajuda';
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

  const handleImageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const layoutWidth = event.nativeEvent.layoutMeasurement.width;
    const nextIndex = Math.round(offsetX / layoutWidth);
    setActiveImageIndex(nextIndex);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          {post.postType === 'help_request' ? (
            <View style={[styles.badge, styles.helpBadge]}>
              <Text style={styles.badgeText}>Preciso de Ajuda</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.donationBadge]}>
              <Text style={styles.badgeText}>Doação</Text>
            </View>
          )}
        </View>

        <View style={styles.carouselWrapper}>
          {images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleImageScroll}
            >
              {images.map((uri, index) => (
                <Image
                  key={`${post._id}-image-${index}`}
                  source={{ uri }}
                  style={styles.postImage}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={42} color={COLORS.icon} />
              <Text style={styles.placeholderText}>Este post não possui imagens</Text>
            </View>
          )}
          {images.length > 1 && (
            <View style={styles.imageIndicator}>
              <Text style={styles.imageIndicatorText}>
                {activeImageIndex + 1} / {images.length}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.authorRow}>
            <Image
              source={post.authorId?.profileImage ? { uri: post.authorId.profileImage } : require('../../assets/icon.png')}
              style={styles.authorAvatar}
            />
            <View style={styles.authorInfo}>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName}>{post.authorId?.name || 'Usuário'}</Text>
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
              <Text style={styles.metaText}>{createdAtLabel}</Text>
              {post.location?.address && (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={16} color={COLORS.icon} />
                  <Text style={styles.locationText}>{post.location.address}</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={styles.title}>{post.title}</Text>
          {post.category && (
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{post.category}</Text>
            </View>
          )}
          <Text style={styles.description}>{post.description}</Text>

          {post.tags && post.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {post.tags.map((tag) => (
                <View style={styles.tagChip} key={`${post._id}-${tag}`}>
                  <Text style={styles.tagChipText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.secondaryAction} onPress={handleLike}>
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={22}
                color={liked ? COLORS.error : COLORS.primary}
              />
              <Text style={styles.secondaryActionText}>{formatLikesLabel(likes)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryAction} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={22} color={COLORS.primary} />
              <Text style={styles.secondaryActionText}>Compartilhar</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.primaryAction} onPress={handleContact}>
            <Ionicons name="logo-whatsapp" size={22} color={COLORS.card} />
            <Text style={styles.primaryActionText}>
              {post.postType === 'donation' ? 'Quero Ajuda' : 'Quero Ajudar'}
            </Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  donationBadge: {
    backgroundColor: COLORS.primary,
  },
  helpBadge: {
    backgroundColor: COLORS.error,
  },
  badgeText: {
    color: COLORS.card,
    fontFamily: FONTS.semiBold,
    fontSize: 12,
  },
  carouselWrapper: {
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    backgroundColor: COLORS.card,
  },
  postImage: {
    width: screenWidth,
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
  },
  placeholderText: {
    color: COLORS.icon,
    fontFamily: FONTS.medium,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  imageIndicatorText: {
    color: '#FFF',
    fontFamily: FONTS.medium,
    fontSize: 12,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 16,
  },
  authorRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  authorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  authorInfo: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    color: COLORS.text,
  },
  verifiedIcon: {
    marginTop: 1,
  },
  metaText: {
    color: COLORS.icon,
    fontFamily: FONTS.regular,
    fontSize: 13,
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  locationText: {
    color: COLORS.text,
    fontFamily: FONTS.regular,
    fontSize: 14,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.text,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  categoryChipText: {
    color: COLORS.primary,
    fontFamily: FONTS.medium,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  description: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagChipText: {
    color: COLORS.text,
    fontFamily: FONTS.medium,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  secondaryActionText: {
    color: COLORS.primary,
    fontFamily: FONTS.medium,
    fontSize: 14,
  },
  primaryAction: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
  },
  primaryActionText: {
    color: COLORS.card,
    fontFamily: FONTS.semiBold,
    fontSize: 16,
  },
});

export default PostDetailsScreen;
