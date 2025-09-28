import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import PostCard, { PostCardProps } from '../components/PostCard';
import api from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { globalStyles } from '../constants/styles';
import { Ionicons } from '@expo/vector-icons';
import { useFeedbackModal } from '../contexts/FeedbackModalContext';

type FilterType = 'all' | 'donation' | 'help_request';

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

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [results, setResults] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { showModal } = useFeedbackModal();

  const handleSearch = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const params: { q?: string; postType?: string } = {};
      if (query) {
        params.q = query;
      }
      if (filter !== 'all') {
        params.postType = filter;
      }

      const response = await api.get('/posts/search', { params });
      setResults(response.data);
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      showModal({
        title: 'Erro na busca',
        message: 'Não foi possível carregar os resultados. Tente novamente.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [filter, showModal]);

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, filter, handleSearch]);

  useFocusEffect(
    useCallback(() => {
      handleSearch(searchQuery);
    }, [handleSearch, searchQuery])
  );

  const handleTagPress = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null);
      setSearchQuery('');
    } else {
      setSelectedTag(tag);
      setSearchQuery(tag);
    }
  };

  const clearFilter = () => {
    setSelectedTag(null);
    setSearchQuery('');
  };

  const quickTags = ['Alimentos', 'Roupas', 'São Paulo', 'Medicamentos', 'Móveis'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={globalStyles.container}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={COLORS.icon} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="O que você está procurando?"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => handleSearch(searchQuery)}
              />
            </View>
          </View>

          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'all' && styles.filterSelected]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterSelectedText]}>Todos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'donation' && styles.filterSelected]}
              onPress={() => setFilter('donation')}
            >
              <Text style={[styles.filterText, filter === 'donation' && styles.filterSelectedText]}>Doações</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'help_request' && styles.filterSelected]}
              onPress={() => setFilter('help_request')}
            >
              <Text style={[styles.filterText, filter === 'help_request' && styles.filterSelectedText]}>Pedidos</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickTagsContainer}>
            <Text style={styles.sectionTitle}>Buscas rápidas:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {quickTags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.tag, selectedTag === tag && styles.tagSelected]}
                  onPress={() => handleTagPress(tag)}
                >
                  <Text style={[styles.tagText, selectedTag === tag && styles.tagSelectedText]}>{tag}</Text>
                </TouchableOpacity>
              ))}
              {selectedTag && (
                <TouchableOpacity onPress={clearFilter} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>Limpar</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>Resultados</Text>
            {loading ? (
              <ActivityIndicator size="large" color={COLORS.primary} />
            ) : results.length > 0 ? (
              results.map((post) => <PostCard key={post._id} {...post} likes={post.likesCount} isLiked={post.isLiked} />)
            ) : (
              <Text style={styles.noResultsText}>Nenhum resultado encontrado para sua busca.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    paddingTop: 20,
    marginBottom: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  searchIcon: {
    padding: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
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
  quickTagsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: '#333',
    marginBottom: 10,
  },
  tag: {
    backgroundColor: COLORS.lightGray,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginRight: 10,
  },
  tagSelected: {
    backgroundColor: COLORS.primary,
  },
  tagText: {
    color: COLORS.text,
    fontFamily: FONTS.regular,
  },
  tagSelectedText: {
    color: '#FFF',
  },
  clearButton: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  clearButtonText: {
    color: COLORS.primary,
    fontFamily: FONTS.medium,
  },
  resultsContainer: {
    marginTop: 10,
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    color: COLORS.text,
    fontFamily: FONTS.regular,
  },
});

export default SearchScreen;
