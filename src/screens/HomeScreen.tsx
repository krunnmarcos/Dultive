import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import PostCard from '../components/PostCard';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import api from '../services/api';

import { useNavigation } from '@react-navigation/native';
import { useFeedbackModal } from '../contexts/FeedbackModalContext';
import { Post } from '../types/Post';
import { HomeStackNavigationProp } from '../navigation/types';

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'Todos' | 'Doações' | 'Pedidos'>('Todos');
  const { showModal } = useFeedbackModal();
  const navigation = useNavigation<HomeStackNavigationProp>();

  const loadPosts = useCallback(async () => {
    try {
      const response = await api.get<Post[]>('/posts');
      setPosts(response.data);
    } catch (error) {
      console.error("Erro ao buscar posts:", error);
      showModal({
        title: 'Erro ao carregar feed',
        message: 'Não foi possível carregar o feed. Tente novamente.',
        type: 'error',
      });
    }
  }, [showModal]);

  useEffect(() => {
    const fetchInitialPosts = async () => {
      setLoading(true);
      await loadPosts();
      setLoading(false);
    };

    fetchInitialPosts();
  }, [loadPosts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }, [loadPosts]);

  const filteredPosts = posts.filter((post) => {
    if (filter === 'Todos') return true;
    if (filter === 'Pedidos') return post.postType === 'help_request';
    if (filter === 'Doações') return post.postType === 'donation';
    return true;
  });

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
              {...item}
              authorId={{
                ...item.authorId,
                name: item.authorId?.name || 'Usuário Anônimo',
              }}
              location={{
                address: item.location?.address || 'Localização não informada',
              }}
              likes={item.likesCount}
              onPress={() => navigation.navigate('PostDetails', { post: item })}
            />
          )}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
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
