import React, { useState, useContext, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import api from '../services/api';
import AuthContext from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { AppTabNavigationProp } from '../navigation/types';
import { globalStyles } from '../constants/styles';
import { Ionicons } from '@expo/vector-icons';
import { useFeedbackModal } from '../contexts/FeedbackModalContext';

type PostType = 'help_request' | 'donation';
type Category = 'alimentos' | 'roupas' | 'medicamentos' | 'brinquedos';

interface StateOption {
  id: number;
  name: string;
  abbreviation: string;
}

interface CityOption {
  id: number;
  name: string;
}

interface SelectedImage {
  uri: string;
  base64: string;
}

const CATEGORY_OPTIONS: { key: Category; label: string }[] = [
  { key: 'alimentos', label: 'Alimentos' },
  { key: 'roupas', label: 'Roupas' },
  { key: 'medicamentos', label: 'Medicamentos' },
  { key: 'brinquedos', label: 'Brinquedos' },
];

const CreateScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AppTabNavigationProp>();
  const { user } = useContext(AuthContext);
  const { showModal } = useFeedbackModal();

  // Se o usuário não estiver autenticado, exibe mensagem ou redireciona
  if (!user) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}
        edges={['left', 'right', 'bottom']}
      >
        <View style={globalStyles.container}>
          <Text style={{ color: COLORS.primary, fontSize: 18, textAlign: 'center' }}>
            Você precisa estar logado para criar uma publicação.
          </Text>
          <CustomButton title="Ir para Login" onPress={() => navigation.navigate('Login' as never)} />
        </View>
      </SafeAreaView>
    );
  }
  const [postType, setPostType] = useState<PostType>('help_request');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('alimentos');
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [states, setStates] = useState<StateOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [selectedState, setSelectedState] = useState<StateOption | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [statesLoading, setStatesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        setStatesLoading(true);
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
        const data = await response.json();
        const mapped: StateOption[] = data.map((item: any) => ({
          id: item.id,
          name: item.nome,
          abbreviation: item.sigla,
        }));
        setStates(mapped);
      } catch (error) {
        console.error('Erro ao carregar estados:', error);
      } finally {
        setStatesLoading(false);
      }
    };

    fetchStates();
  }, []);

  useEffect(() => {
    const fetchCities = async () => {
      if (!selectedState) {
        setCities([]);
        return;
      }

      try {
        setCitiesLoading(true);
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState.abbreviation}/municipios`);
        const data = await response.json();
        const mapped: CityOption[] = data.map((item: any) => ({
          id: item.id,
          name: item.nome,
        }));
        setCities(mapped);
      } catch (error) {
        console.error('Erro ao carregar cidades:', error);
        showModal({
          title: 'Erro ao carregar cidades',
          message: 'Não foi possível carregar as cidades. Tente novamente.',
          type: 'error',
        });
      } finally {
        setCitiesLoading(false);
      }
    };

    fetchCities();
  }, [selectedState, showModal]);

  const filteredStates = useMemo(() => {
    const search = stateSearch.trim().toLowerCase();
    if (!search) return states;
    return states.filter(
      (state) =>
        state.name.toLowerCase().includes(search) ||
        state.abbreviation.toLowerCase().includes(search)
    );
  }, [states, stateSearch]);

  const filteredCities = useMemo(() => {
    const search = citySearch.trim().toLowerCase();
    if (!search) return cities;
    return cities.filter((city) => city.name.toLowerCase().includes(search));
  }, [cities, citySearch]);

  const handleAddImage = async () => {
    if (images.length >= 3) {
      showModal({
        title: 'Limite de imagens',
        message: 'Você pode adicionar no máximo 3 fotos.',
        type: 'warning',
      });
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showModal({
        title: 'Permissão necessária',
        message: 'Precisamos da sua permissão para acessar a galeria.',
        type: 'warning',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    try {
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: 'base64',
      });
      const mimeType = asset.mimeType || 'image/jpeg';
      const newImage: SelectedImage = {
        uri: asset.uri,
        base64: `data:${mimeType};base64,${base64}`,
      };
      setImages((prev) => [...prev, newImage]);
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      showModal({
        title: 'Erro ao adicionar imagem',
        message: 'Não foi possível adicionar a imagem. Tente novamente.',
        type: 'error',
      });
    }
  };

  const handleRemoveImage = (uri: string) => {
    setImages((prev) => prev.filter((image) => image.uri !== uri));
  };

  const handleSelectState = (state: StateOption) => {
    setSelectedState(state);
    setSelectedCity(null);
    setStateModalVisible(false);
    setStateSearch('');
  };

  const handleSelectCity = (city: CityOption) => {
    setSelectedCity(city);
    setCityModalVisible(false);
    setCitySearch('');
  };

  const handlePublish = async () => {
    if (!title || !description) {
      showModal({
        title: 'Campos obrigatórios',
        message: 'Por favor, preencha o título e a descrição do post.',
        type: 'warning',
      });
      return;
    }

    if (!selectedState || !selectedCity) {
      showModal({
        title: 'Defina a localização',
        message: 'Selecione o estado e a cidade da publicação.',
        type: 'warning',
      });
      return;
    }

    // Regra: Empresas não podem pedir ajuda
    if (user?.userType === 'company' && postType === 'help_request') {
      showModal({
        title: 'Ação não permitida',
        message: 'Empresas podem apenas criar posts de doação.',
        type: 'warning',
      });
      setPostType('donation'); // Força a seleção para 'doação'
      return;
    }

    const formattedAddress = `${selectedCity.name} - ${selectedState.abbreviation}`;

    const postData = {
      postType,
      title,
      description,
      category,
      location: { address: formattedAddress },
      images: images.map((image) => image.base64),
      // incluir tags futuramente
    };

    try {
      setIsPublishing(true);
      await api.post('/posts', postData);
      setTitle('');
      setDescription('');
      setImages([]);
      setSelectedState(null);
      setSelectedCity(null);
      setPostType(user?.userType === 'company' ? 'donation' : 'help_request');
      setCategory('alimentos');
      showModal({
        title: 'Post publicado',
        message: 'Seu post foi publicado com sucesso!',
        type: 'success',
        actions: [
          {
            label: 'Ver feed',
            variant: 'primary',
            onPress: () => navigation.navigate('Home'),
          },
        ],
      });
    } catch (error) {
      console.error('Erro ao publicar:', error);
      const message = (error as any)?.response?.data?.message || 'Ocorreu um erro ao publicar seu post.';
      showModal({
        title: 'Erro ao publicar',
        message,
        type: 'error',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.formContainer, { paddingTop: insets.top + 24 }]}>
          <Text style={styles.primaryHeading}>O que você precisa?</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeCard,
                postType === 'help_request' ? styles.helpCardSelected : styles.cardUnselected,
                user?.userType === 'company' && styles.cardDisabled,
              ]}
              onPress={() => setPostType('help_request')}
              disabled={user?.userType === 'company'}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.typeCardTitle,
                  postType === 'help_request' ? styles.helpTitleSelected : styles.cardTitleUnselected,
                ]}
              >
                Preciso de Ajuda
              </Text>
              <Text
                style={[
                  styles.typeCardSubtitle,
                  postType === 'help_request' ? styles.helpSubtitleSelected : styles.cardSubtitleUnselected,
                ]}
              >
                Solicitar Doações
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeCard,
                postType === 'donation' ? styles.donationCardSelected : styles.cardUnselected,
              ]}
              onPress={() => setPostType('donation')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.typeCardTitle,
                  postType === 'donation' ? styles.donationTitleSelected : styles.cardTitleUnselected,
                ]}
              >
                Posso Ajudar
              </Text>
              <Text
                style={[
                  styles.typeCardSubtitle,
                  postType === 'donation' ? styles.donationSubtitleSelected : styles.cardSubtitleUnselected,
                ]}
              >
                Oferecer Doações
              </Text>
            </TouchableOpacity>
          </View>

          <InputField placeholder="Título do post" value={title} onChangeText={setTitle} />
          <InputField
            placeholder="Descrição detalhada"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
          <Text style={styles.sectionTitle}>Localização</Text>
          <View style={styles.dropdownRow}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                setStateSearch('');
                setStateModalVisible(true);
              }}
            >
              <View style={styles.dropdownTextWrapper}>
                <Text style={styles.dropdownLabel}>Estado</Text>
                <Text style={selectedState ? styles.dropdownValue : styles.dropdownPlaceholder}>
                  {selectedState ? `${selectedState.name} (${selectedState.abbreviation})` : 'Selecione o estado'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={COLORS.icon} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dropdown, !selectedState && styles.dropdownDisabled]}
              disabled={!selectedState}
              onPress={() => {
                setCitySearch('');
                setCityModalVisible(true);
              }}
            >
              <View style={styles.dropdownTextWrapper}>
                <Text style={styles.dropdownLabel}>Cidade</Text>
                <Text style={selectedCity ? styles.dropdownValue : styles.dropdownPlaceholder}>
                  {selectedCity ? selectedCity.name : selectedState ? 'Selecione a cidade' : 'Escolha o estado primeiro'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color={COLORS.icon} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Categoria</Text>
          <View style={styles.categoryContainer}>
            {CATEGORY_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.categoryChip, category === item.key && styles.categoryChipSelected]}
                onPress={() => setCategory(item.key)}
              >
                <Text style={[styles.categoryChipText, category === item.key && styles.categoryChipTextSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Fotos</Text>
          <View style={styles.imagesContainer}>
            {images.map((image, index) => (
              <View key={`${image.uri}-${index}`} style={styles.imageCard}>
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(image.uri)}
                >
                  <Ionicons name="close" size={18} color={COLORS.card} />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 3 && (
              <TouchableOpacity style={styles.addImageCard} onPress={handleAddImage}>
                <Ionicons name="add" size={32} color={COLORS.icon} />
                <Text style={styles.addImageText}>Adicionar foto</Text>
                <Text style={styles.addImageSubText}>Máx. 3 imagens</Text>
              </TouchableOpacity>
            )}
          </View>

          <CustomButton title="Publicar" onPress={handlePublish} disabled={isPublishing} />
        </View>
      </ScrollView>
      {isPublishing && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Publicando seu post...</Text>
          </View>
        </View>
      )}

      {/* Modal Estados */}
      <Modal visible={stateModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione o Estado</Text>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={COLORS.icon} style={styles.modalSearchIcon} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Pesquisar estado..."
                placeholderTextColor={COLORS.icon}
                value={stateSearch}
                onChangeText={setStateSearch}
              />
            </View>
            {statesLoading ? (
              <ActivityIndicator style={{ marginTop: 20 }} size="large" color={COLORS.primary} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {filteredStates.map((state) => (
                  <TouchableOpacity
                    key={state.id}
                    style={styles.modalOption}
                    onPress={() => handleSelectState(state)}
                  >
                    <Text style={styles.modalOptionText}>{state.name} ({state.abbreviation})</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setStateModalVisible(false)}>
              <Text style={styles.closeModalText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Cidades */}
      <Modal visible={cityModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedState ? `Cidades de ${selectedState.name}` : 'Selecione um estado'}
            </Text>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={COLORS.icon} style={styles.modalSearchIcon} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Pesquisar cidade..."
                placeholderTextColor={COLORS.icon}
                value={citySearch}
                onChangeText={setCitySearch}
              />
            </View>
            {citiesLoading ? (
              <ActivityIndicator style={{ marginTop: 20 }} size="large" color={COLORS.primary} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {filteredCities.map((city) => (
                  <TouchableOpacity
                    key={city.id}
                    style={styles.modalOption}
                    onPress={() => handleSelectCity(city)}
                  >
                    <Text style={styles.modalOptionText}>{city.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setCityModalVisible(false)}>
              <Text style={styles.closeModalText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 10,
  },
  dropdownRow: {
    flexDirection: 'column',
    gap: 12,
  },
  dropdown: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownDisabled: {
    opacity: 0.6,
  },
  dropdownTextWrapper: {
    flex: 1,
    marginRight: 12,
  },
  dropdownLabel: {
    fontSize: 12,
    color: COLORS.icon,
    fontFamily: FONTS.medium,
    marginBottom: 4,
  },
  dropdownPlaceholder: {
    color: COLORS.icon,
    fontFamily: FONTS.medium,
  },
  dropdownValue: {
    color: COLORS.text,
    fontFamily: FONTS.semiBold,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary,
  },
  categoryChipText: {
    color: COLORS.primary,
    fontFamily: FONTS.medium,
  },
  categoryChipTextSelected: {
    color: COLORS.card,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageCard: {
    width: 100,
    height: 100,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageCard: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  addImageText: {
    color: COLORS.text,
    fontFamily: FONTS.medium,
    marginTop: 8,
  },
  addImageSubText: {
    color: COLORS.icon,
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: 12,
  },
  searchInputContainer: {
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    height: 48,
  },
  modalSearchIcon: {
    marginRight: 8,
    color: COLORS.icon,
  },
  modalSearchInput: {
    flex: 1,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    fontSize: 16,
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.secondary,
  },
  modalOptionText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  closeModalButton: {
    marginTop: 16,
    alignSelf: 'flex-end',
  },
  closeModalText: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  formContainer: {
    paddingHorizontal: 15,
    paddingBottom: 32,
  },
  primaryHeading: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    columnGap: 16,
    marginBottom: 24,
  },
  typeCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    paddingVertical: 18,
    paddingHorizontal: 18,
    minHeight: 120,
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    alignItems: 'center',
  },
  helpCardSelected: {
    backgroundColor: 'rgba(255, 68, 68, 0.15)',
    borderColor: 'rgba(255, 68, 68, 0.45)',
  },
  donationCardSelected: {
    backgroundColor: 'rgba(46, 125, 50, 0.18)',
    borderColor: 'rgba(46, 125, 50, 0.45)',
  },
  cardUnselected: {
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.icon,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  typeCardTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  helpTitleSelected: {
    color: COLORS.error,
  },
  donationTitleSelected: {
    color: COLORS.success,
  },
  cardTitleUnselected: {
    color: COLORS.icon,
  },
  typeCardSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  helpSubtitleSelected: {
    color: 'rgba(255, 68, 68, 0.8)',
  },
  donationSubtitleSelected: {
    color: 'rgba(46, 125, 50, 0.8)',
  },
  cardSubtitleUnselected: {
    color: COLORS.icon,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 16,
    width: '80%',
    maxWidth: 320,
  },
  loadingText: {
    color: COLORS.text,
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default CreateScreen;
