import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import AuthContext from '../contexts/AuthContext';
import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';
import api from '../services/api';
import { globalStyles } from '../constants/styles';
import { useFeedbackModal } from '../contexts/FeedbackModalContext';
import { AccountStackNavigationProp } from '../navigation/types';

const EditProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AccountStackNavigationProp>();
  const { user, updateUser, refreshUser } = useContext(AuthContext);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const { showModal } = useFeedbackModal();

  if (!user) {
    return (
      <SafeAreaView
        style={[styles.container, { justifyContent: 'center', alignItems: 'center' }] }
        edges={['left', 'right', 'bottom']}
      >
        <View style={globalStyles.container}>
          <Text style={{ color: COLORS.primary, fontSize: 18 }}>
            Você precisa estar logado para editar o perfil.
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  const [loading, setLoading] = useState(false);

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      if (!user) return;

      const trimmedName = name.trim();
      const trimmedPhone = phone.trim();

      if (!trimmedName) {
        showModal({
          title: 'Nome inválido',
          message: 'Informe um nome válido para continuar.',
          type: 'warning',
        });
        return;
      }

      const payload: Record<string, any> = {
        name: trimmedName,
      };

      if (trimmedPhone || phone.length === 0) {
        payload.phone = trimmedPhone;
      }

      if (profileImage !== null) {
        payload.profileImage = profileImage;
      }

      const response = await api.put('/users/me', payload);
      await updateUser(response.data);
      await refreshUser();
      showModal({
        title: 'Perfil atualizado',
        message: 'Suas informações foram salvas com sucesso.',
        type: 'success',
      });
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      const message = (error as any)?.response?.data?.message || 'Não foi possível atualizar o perfil.';
      showModal({
        title: 'Erro ao atualizar perfil',
        message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={[globalStyles.header, { paddingTop: insets.top + 15 }]}>
          <Text style={globalStyles.headerTitle}>Editar Perfil</Text>
        </View>
        <View style={[globalStyles.container, styles.formContent]}>

          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              <Image
                source={profileImage ? { uri: profileImage } : require('../../assets/icon.png')}
                style={styles.avatar}
              />
              <TouchableOpacity
                style={styles.avatarCameraButton}
                onPress={handleImagePick}
                activeOpacity={0.85}
              >
                <Feather name="camera" size={20} color={COLORS.card} />
              </TouchableOpacity>
            </View>
          </View>

          <InputField label="Nome Completo" value={name} onChangeText={setName} />
          <InputField label="Telefone (WhatsApp)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <CustomButton title="Salvar Alterações" onPress={handleSaveChanges} disabled={loading} />
          {loading && <ActivityIndicator style={{ marginTop: 10 }} size="large" color={COLORS.primary} />}
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
  formContent: {
    paddingTop: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 24,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  avatarCameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
});

export default EditProfileScreen;
