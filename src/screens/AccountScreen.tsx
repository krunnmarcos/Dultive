import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import AuthContext from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AccountStackNavigationProp } from '../navigation/types';
import { globalStyles } from '../constants/styles';

import { AccountStackParamList } from '../navigation/types';

interface MenuItem {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen?: keyof AccountStackParamList;
  onPress?: () => void;
  iconColor?: string;
  textColor?: string;
}

const AccountScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useContext(AuthContext);
  const navigation = useNavigation<AccountStackNavigationProp>();

  const menuItems: MenuItem[] = [
    { title: 'Editar Perfil', icon: 'person-outline', screen: 'EditProfile' },
    { title: 'Meus Posts', icon: 'list-outline', screen: 'MyPosts' },
    { title: 'Configurações', icon: 'settings-outline', screen: 'Settings' },
    { title: 'Ajuda & Suporte', icon: 'help-circle-outline', screen: 'Help' },
    {
      title: 'Sair da Conta',
      icon: 'log-out-outline',
      onPress: signOut,
      iconColor: COLORS.error,
      textColor: COLORS.error,
    },
  ];

  const handleNavigation = (screen?: keyof AccountStackParamList) => {
    if (!screen) {
      return;
    }
    navigation.navigate(screen);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={[styles.profileHeader, { paddingTop: insets.top + 30 }]}>
          <Image
            source={user?.profileImage ? { uri: user.profileImage } : require('../../assets/icon.png')}
            style={styles.avatar}
          />
          <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsText}>{user?.points || 0} Pontos</Text>
          </View>
        </View>

        <View style={globalStyles.container}>
          <View style={styles.menuContainer}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.title}
                style={[styles.menuItem, item.onPress && styles.logoutItem]}
                activeOpacity={0.85}
                onPress={() => (item.onPress ? item.onPress() : handleNavigation(item.screen))}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name={item.icon} size={24} color={item.iconColor ?? COLORS.primary} />
                  <Text style={[styles.menuItemText, item.textColor && { color: item.textColor }]}>{item.title}</Text>
                </View>
                {!item.onPress && (
                  <Ionicons name="chevron-forward-outline" size={20} color={COLORS.icon} />
                )}
              </TouchableOpacity>
            ))}
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
  scrollContainer: {
    paddingBottom: 32,
  },
  profileHeader: {
    backgroundColor: COLORS.background,
    alignItems: 'center',
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.card,
    marginBottom: 10,
  },
  userName: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    marginBottom: 5,
  },
  pointsContainer: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  pointsText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
    textAlign: 'center',
  },
  menuContainer: {
    marginTop: 24,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  logoutItem: {
    borderColor: COLORS.error,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.text,
    marginLeft: 15,
  },
});

export default AccountScreen;
