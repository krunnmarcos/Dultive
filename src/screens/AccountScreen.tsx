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

const AccountScreen = () => {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useContext(AuthContext);
  const navigation = useNavigation<AccountStackNavigationProp>();

  const menuItems = [
    { title: 'Editar Perfil', icon: 'person-outline', screen: 'EditProfile' },
    { title: 'Meus Posts', icon: 'list-outline', screen: 'MyPosts' },
    { title: 'Configurações', icon: 'settings-outline', screen: 'Settings' },
    { title: 'Ajuda & Suporte', icon: 'help-circle-outline', screen: 'Help' },
  ];

  const handleNavigation = (screen: any) => {
    navigation.navigate(screen);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView>
        <View style={[styles.profileHeader, { paddingTop: insets.top + 30 }]}>
          <Image
            source={user && user.profileImage ? { uri: user.profileImage } : require('../../assets/icon.png')}
            style={styles.avatar}
          />
          <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
          <View style={styles.pointsContainer}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Text style={styles.pointsText}>{user?.points || 0} Pontos</Text>
          </View>
        </View>
        <View style={globalStyles.container}>
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => handleNavigation(item.screen)}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name={item.icon as any} size={24} color={COLORS.primary} />
                  <Text style={styles.menuItemText}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={22} color={COLORS.icon} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
            <Text style={styles.logoutButtonText}>Sair</Text>
          </TouchableOpacity>
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
  profileHeader: {
    backgroundColor: COLORS.primary,
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
    color: COLORS.card,
    marginBottom: 5,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  pointsText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.card,
    marginLeft: 5,
  },
  menuContainer: {
    marginTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
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
  logoutButton: {
    marginVertical: 20,
    backgroundColor: COLORS.error,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: COLORS.card,
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});

export default AccountScreen;
