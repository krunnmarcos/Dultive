import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps, BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// Tipos para o AuthNavigator (Stack)
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Tipos para o AppNavigator (Tabs)
export type AppTabParamList = {
  Home: undefined;
  Search: undefined;
  Create: undefined;
  Account: { screen: string }; // Para poder navegar para telas aninhadas
};

// Tipos para o AccountNavigator (Stack)
export type AccountStackParamList = {
  AccountRoot: undefined;
  EditProfile: undefined;
  MyPosts: undefined;
  Settings: undefined;
  Help: undefined;
};

// Props para cada tela do Auth Stack
export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

// Props para cada tela do App Tabs
export type HomeScreenProps = BottomTabScreenProps<AppTabParamList, 'Home'>;
export type SearchScreenProps = BottomTabScreenProps<AppTabParamList, 'Search'>;
export type CreateScreenProps = BottomTabScreenProps<AppTabParamList, 'Create'>;
export type AccountScreenProps = BottomTabScreenProps<AppTabParamList, 'Account'>;

// Props para cada tela do Account Stack
export type AccountRootScreenProps = NativeStackScreenProps<AccountStackParamList, 'AccountRoot'>;
export type EditProfileScreenProps = NativeStackScreenProps<AccountStackParamList, 'EditProfile'>;


// Tipo para o hook useNavigation dentro do Tab Navigator
export type AppTabNavigationProp = BottomTabNavigationProp<AppTabParamList>;

// Tipo para o hook useNavigation dentro do Account Stack
export type AccountStackNavigationProp = NativeStackNavigationProp<AccountStackParamList>;
