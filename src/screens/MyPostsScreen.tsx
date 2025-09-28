import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import PostCard, { PostCardProps } from '../components/PostCard';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { globalStyles } from '../constants/styles';
import { Ionicons } from '@expo/vector-icons';
import { useFeedbackModal } from '../contexts/FeedbackModalContext';

// Interface para o formato do post vindo da API
interface ApiPost {
  _id: string;
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
  likesCount?: number; // Add likesCount
  isLiked?: boolean; // Add isLiked
}

const MyPostsScreen = () => {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { showModal } = useFeedbackModal();

  const fetchMyPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/posts/my-posts');
      setPosts(response.data);
    } catch (error) {
      console.error("Erro ao buscar meus posts:", error);
      showModal({
        title: 'Erro ao carregar',
        message: 'Não foi possível carregar seus posts. Tente novamente.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [showModal]);

  useFocusEffect(
    useCallback(() => {
      fetchMyPosts();
    }, [fetchMyPosts])
  );

  const handleDeletePost = (postId: string) => {
    showModal({
      title: 'Excluir post',
      message: 'Tem certeza de que deseja excluir este post? Esta ação não pode ser desfeita.',
      type: 'warning',
      dismissible: false,
      actions: [
        {
          label: 'Cancelar',
          variant: 'ghost',
        },
        {
          label: 'Excluir',
          variant: 'danger',
          onPress: async () => {
            try {
              await api.delete(`/posts/${postId}`);
              setPosts((prev) => prev.filter((post) => post._id !== postId));
              showModal({
                title: 'Post excluído',
                message: 'Seu post foi removido com sucesso.',
                type: 'success',
              });
            } catch (error) {
              console.error('Erro ao deletar post:', error);
              showModal({
                title: 'Erro ao excluir',
                message: 'Não foi possível deletar o post. Tente novamente.',
                type: 'error',
              });
            }
          },
        },
      ],
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={[globalStyles.header, { paddingTop: insets.top + 15 }]}>
        <Text style={globalStyles.headerTitle}>Meus Posts</Text>
      </View>
      <View style={globalStyles.container}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.postWrapper}>
                <PostCard {...item} likes={item.likesCount} isLiked={item.isLiked} />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePost(item._id)}
                  accessibilityLabel="Excluir post"
                >
                  <Ionicons name="trash-outline" size={20} color={COLORS.card} />
                  <Text style={styles.deleteButtonText}>Excluir</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={styles.emptyText}>Você ainda não criou nenhum post.</Text>
              </View>
            }
            contentContainerStyle={{ flexGrow: 1 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.icon,
    fontFamily: FONTS.medium,
  },
  postWrapper: {
    marginBottom: 16,
  },
  deleteButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.error,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: COLORS.card,
    fontFamily: FONTS.medium,
  },
});

export default MyPostsScreen;
