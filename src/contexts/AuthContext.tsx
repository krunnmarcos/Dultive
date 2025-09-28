import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { useFeedbackModal } from './FeedbackModalContext';

interface User {
  id: string;
  name: string;
  email: string;
  userType: 'person' | 'company';
  profileImage?: string | null;
  points?: number;
  phone?: string;
  location?: {
    address?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextData {
  token: string | null;
  user: User | null;
  loading: boolean;
  updateUser(user: User): Promise<void>;
  refreshUser(): Promise<void>;
  signIn(credentials: object): Promise<void>;
  signOut(): void;
  register(userData: object): Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { showModal } = useFeedbackModal();

  const refreshUser = useCallback(async () => {
    if (!api.defaults.headers.Authorization) {
      return;
    }

    try {
      const { data } = await api.get('/users/me');
      setUser(data);
      await AsyncStorage.setItem('@Dultive:user', JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
    }
  }, []);

  useEffect(() => {
    async function loadStorageData() {
      const storagedUser = await AsyncStorage.getItem('@Dultive:user');
      const storagedToken = await AsyncStorage.getItem('@Dultive:token');

      if (storagedUser) {
        setUser(JSON.parse(storagedUser));
      }

      if (storagedToken) {
        api.defaults.headers.Authorization = `Bearer ${storagedToken}`;
        setToken(storagedToken);
        await refreshUser();
      }
      setLoading(false);
    }

    loadStorageData();
  }, [refreshUser]);

  async function signIn(credentials: object) {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, user } = response.data;

      setUser(user);
      setToken(token);

      api.defaults.headers.Authorization = `Bearer ${token}`;

      await AsyncStorage.setItem('@Dultive:user', JSON.stringify(user));
      await AsyncStorage.setItem('@Dultive:token', token);

      await refreshUser();
    } catch (error) {
      console.error('Erro no login:', error);
      showModal({
        title: 'Falha no login',
        message: 'Verifique suas credenciais e tente novamente.',
        type: 'error',
      });
    }
  }

  async function register(userData: object) {
    try {
      await api.post('/auth/register', userData);
      showModal({
        title: 'Cadastro realizado!',
        message: 'Faça o login para continuar.',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      if (error.response && error.response.data && error.response.data.message) {
        if (error.response.data.message.includes('CPF')) {
          showModal({
            title: 'CPF já cadastrado',
            message: 'Já existe um cadastro com este CPF.',
            type: 'warning',
          });
          return;
        }
        if (error.response.data.message.includes('CNPJ')) {
          showModal({
            title: 'CNPJ já cadastrado',
            message: 'Já existe um cadastro com este CNPJ.',
            type: 'warning',
          });
          return;
        }
        showModal({
          title: 'Erro no cadastro',
          message: error.response.data.message,
          type: 'error',
        });
        return;
      }
      showModal({
        title: 'Falha no cadastro',
        message: 'Verifique os dados e tente novamente.',
        type: 'error',
      });
    }
  }

  function signOut() {
    AsyncStorage.clear().then(() => {
      setUser(null);
      setToken(null);
      delete api.defaults.headers.Authorization;
    });
  }

  const updateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    await AsyncStorage.setItem('@Dultive:user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, updateUser, refreshUser, signIn, signOut, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
