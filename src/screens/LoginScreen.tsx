import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import { COLORS } from '../constants/colors';
import AuthContext from '../contexts/AuthContext';

// Mock navigation prop
type NavigationProp = {
  navigate: (screen: string) => void;
};

const LoginScreen = ({ navigation }: { navigation: NavigationProp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useContext(AuthContext);

  const handleLogin = () => {
    // Validação básica
    if (!email || !password) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    signIn({ email, password });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
      </View>
      <Text style={styles.title}>Entrar</Text>
      <InputField
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <InputField
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <CustomButton title="Entrar" onPress={handleLogin} />
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Não tem conta? Cadastre-se</Text>
      </TouchableOpacity>
      <Text style={styles.terms}>
        Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: COLORS.primary,
    padding: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  link: {
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 10,
  },
  terms: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: 'center',
    color: COLORS.icon,
    fontSize: 12,
  },
});

export default LoginScreen;
