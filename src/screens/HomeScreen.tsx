import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import PostCard, { PostCardProps } from '../components/PostCard';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import api from '../services/api';

import { useFocusEffect } from '@react-navigation/native';
import { useFeedbackModal } from '../contexts/FeedbackModalContext';

// ... (imports)

// Interface para o formato do post vindo da API
interface ApiPost {
  _id: string;
  authorId: {
    name: string;
    profileImage?: string;
    phone?: string;
    userType?: 'person' | 'company';
    isVerified?: boolean;
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

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'Todos' | 'Doações' | 'Pedidos'>('Todos');
  const { showModal } = useFeedbackModal();

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/posts');
      setPosts(response.data);
    } catch (error) {
      console.error("Erro ao buscar posts:", error);
      showModal({
        title: 'Erro ao carregar feed',
        message: 'Não foi possível carregar o feed. Tente novamente.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [showModal]);

  // useFocusEffect para recarregar os posts sempre que a tela ganhar foco
  useFocusEffect(
    React.useCallback(() => {
      fetchPosts();
    }, [fetchPosts])
  );

  const filteredPosts = posts.filter((post) => {
    if (filter === 'Todos') return true;
    if (filter === 'Pedidos') return post.postType === 'help_request';
    if (filter === 'Doações') return post.postType === 'donation';
    return true;
  });

  // Função para formatar o tempo (ex: '2h atrás')
  const formatTimestamp = (date: string) => {
    // Lógica de formatação de data (simplificada)
    return new Date(date).toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <Text style={styles.headerTitle}>DULTIVE</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'Todos' && styles.filterSelected]}
          onPress={() => setFilter('Todos')}
        >
          <Text style={[styles.filterText, filter === 'Todos' && styles.filterSelectedText]}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'Doações' && styles.filterSelected]}
          onPress={() => setFilter('Doações')}
        >
          <Text style={[styles.filterText, filter === 'Doações' && styles.filterSelectedText]}>Doações</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'Pedidos' && styles.filterSelected]}
          onPress={() => setFilter('Pedidos')}
        >
          <Text style={[styles.filterText, filter === 'Pedidos' && styles.filterSelectedText]}>Pedidos</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }}/>
      ) : (
        <FlatList
          data={filteredPosts}
          renderItem={({ item }) => (
            <PostCard
              _id={item._id}
              authorId={{
                name: item.authorId?.name || 'Usuário Anônimo',
                profileImage: item.authorId?.profileImage,
                phone: item.authorId?.phone,
                userType: item.authorId?.userType,
                isVerified: item.authorId?.isVerified,
              }}
              location={{
                address: item.location?.address || 'Localização não informada'
              }}
              createdAt={item.createdAt}
              postType={item.postType}
              title={item.title}
              description={item.description}
              images={item.images}
              likes={item.likesCount} // Pass likesCount
              isLiked={item.isLiked} // Pass isLiked
            />
          )}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          onRefresh={fetchPosts} // Adiciona pull-to-refresh
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
    filterContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 16,
      marginBottom: 16,
    paddingHorizontal: 24,
    columnGap: 12,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  filterSelected: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.primary,
    fontFamily: FONTS.medium,
  },
  filterSelectedText: {
    color: '#FFF',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    paddingTop: 0,
  },
});

export default HomeScreen;
