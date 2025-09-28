import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps, BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Post } from '../types/Post';

type PostDetailsParams = { post: Post };

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

// Tipos para os stacks de Home e Search
export type HomeStackParamList = {
  HomeRoot: undefined;
  PostDetails: PostDetailsParams;
};

export type SearchStackParamList = {
  SearchRoot: undefined;
  PostDetails: PostDetailsParams;
};

// Tipos para o AccountNavigator (Stack)
export type AccountStackParamList = {
  AccountRoot: undefined;
  EditProfile: undefined;
  MyPosts: undefined;
  Settings: undefined;
  Help: undefined;
  PostDetails: PostDetailsParams;
};

// Props para cada tela do Auth Stack
export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

// Props para cada tela do App Tabs
export type HomeScreenProps = BottomTabScreenProps<AppTabParamList, 'Home'>;
export type SearchScreenProps = BottomTabScreenProps<AppTabParamList, 'Search'>;
export type CreateScreenProps = BottomTabScreenProps<AppTabParamList, 'Create'>;
export type AccountScreenProps = BottomTabScreenProps<AppTabParamList, 'Account'>;

// Props para stacks específicos
export type HomeStackScreenProps = NativeStackScreenProps<HomeStackParamList, 'HomeRoot'>;
export type SearchStackScreenProps = NativeStackScreenProps<SearchStackParamList, 'SearchRoot'>;
export type PostDetailsScreenProps = NativeStackScreenProps<{ PostDetails: PostDetailsParams }, 'PostDetails'>;

// Props para cada tela do Account Stack
export type AccountRootScreenProps = NativeStackScreenProps<AccountStackParamList, 'AccountRoot'>;
export type EditProfileScreenProps = NativeStackScreenProps<AccountStackParamList, 'EditProfile'>;


// Tipo para o hook useNavigation dentro do Tab Navigator
export type AppTabNavigationProp = BottomTabNavigationProp<AppTabParamList>;

// Tipo para o hook useNavigation dentro do Account Stack
export type AccountStackNavigationProp = NativeStackNavigationProp<AccountStackParamList>;

export type HomeStackNavigationProp = NativeStackNavigationProp<HomeStackParamList>;
export type SearchStackNavigationProp = NativeStackNavigationProp<SearchStackParamList>;
export type PostDetailsNavigationProp = NativeStackNavigationProp<{ PostDetails: PostDetailsParams }>;
