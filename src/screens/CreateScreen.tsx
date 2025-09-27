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
        alert('Não foi possível carregar as cidades. Tente novamente.');
      } finally {
        setCitiesLoading(false);
      }
    };

    fetchCities();
  }, [selectedState]);

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
      alert('Você pode adicionar no máximo 3 fotos.');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Precisamos da sua permissão para acessar a galeria.');
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
      alert('Não foi possível adicionar a imagem.');
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
      alert('Por favor, preencha o título e a descrição.');
      return;
    }

    if (!selectedState || !selectedCity) {
      alert('Selecione o estado e a cidade.');
      return;
    }

    // Regra: Empresas não podem pedir ajuda
    if (user?.userType === 'company' && postType === 'help_request') {
      alert('Empresas podem apenas criar posts de doação.');
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
      await api.post('/posts', postData);
      alert('Post publicado com sucesso!');
      setTitle('');
      setDescription('');
      setImages([]);
      setSelectedState(null);
      setSelectedCity(null);
      setPostType(user?.userType === 'company' ? 'donation' : 'help_request');
      setCategory('alimentos');
      navigation.navigate('Home'); // Navega para o feed
    } catch (error) {
      console.error('Erro ao publicar:', error);
      alert('Ocorreu um erro ao publicar seu post.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView>
        <View style={[globalStyles.header, { paddingTop: insets.top + 15 }]}>
          <Text style={globalStyles.headerTitle}>Criar Publicação</Text>
        </View>
        <View style={globalStyles.container}>

          <Text style={styles.sectionTitle}>O que você deseja fazer?</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, postType === 'help_request' && styles.typeSelected, user?.userType === 'company' && styles.disabledButton]}
              onPress={() => setPostType('help_request')}
              disabled={user?.userType === 'company'}
            >
              <Text style={[styles.typeText, postType === 'help_request' && styles.typeSelectedText]}>Preciso de Ajuda</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, postType === 'donation' && styles.typeSelected]}
              onPress={() => setPostType('donation')}
            >
              <Text style={[styles.typeText, postType === 'donation' && styles.typeSelectedText]}>Posso Ajudar</Text>
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

          <CustomButton title="Publicar" onPress={handlePublish} />
        </View>
      </ScrollView>

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
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  typeButton: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    width: '48%',
    alignItems: 'center',
  },
  typeSelected: {
    backgroundColor: COLORS.primary,
  },
  typeText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  typeSelectedText: {
    color: COLORS.card,
  },
  disabledButton: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.icon,
  },
});

export default CreateScreen;
