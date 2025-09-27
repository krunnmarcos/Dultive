import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import PostCard, { PostCardProps } from '../components/PostCard';
import { COLORS } from '../constants/colors';
import api from '../services/api';

import { useFocusEffect } from '@react-navigation/native';

// ... (imports)

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

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos');

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/posts');
      setPosts(response.data);
    } catch (error) {
      console.error("Erro ao buscar posts:", error);
      alert('Não foi possível carregar o feed. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // useFocusEffect para recarregar os posts sempre que a tela ganhar foco
  useFocusEffect(
    React.useCallback(() => {
      fetchPosts();
    }, [])
  );

  const filteredPosts = posts.filter(post => {
    if (filter === 'Todos') return true;
    if (filter === 'Preciso') return post.postType === 'help_request';
    if (filter === 'Posso Ajudar') return post.postType === 'donation';
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
        {/* ... (filtros) */}
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
                profileImage: item.authorId?.profileImage
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
    padding: 10,
  },
  chip: {
    backgroundColor: COLORS.card,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.primary,
  },
  chipTextSelected: {
    color: COLORS.card,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
});

export default HomeScreen;
