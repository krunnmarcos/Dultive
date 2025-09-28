import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CreateScreen from '../screens/CreateScreen';
import AccountNavigator from './AccountNavigator';
import AuthNavigator from './AuthNavigator';
import AuthContext from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import HomeNavigator from './HomeNavigator';
import SearchNavigator from './SearchNavigator';

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? (
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Search') {
                iconName = focused ? 'search' : 'search-outline';
              } else if (route.name === 'Create') {
                iconName = focused ? 'add-circle' : 'add-circle-outline';
              } else if (route.name === 'Account') {
                iconName = focused ? 'person' : 'person-outline';
              }

              return <Ionicons name={iconName as any} size={size} color={color} />;
            },
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.icon,
            headerShown: false,
          })}
        >
          <Tab.Screen name="Home" component={HomeNavigator} options={{ title: 'Início' }} />
          <Tab.Screen name="Search" component={SearchNavigator} options={{ title: 'Pesquisar' }} />
          <Tab.Screen name="Create" component={CreateScreen} options={{ title: 'Criar' }} />
          <Tab.Screen name="Account" component={AccountNavigator} options={{ title: 'Conta' }} />
        </Tab.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
