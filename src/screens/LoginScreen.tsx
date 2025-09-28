import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import { COLORS } from '../constants/colors';
import AuthContext from '../contexts/AuthContext';
import { useFeedbackModal } from '../contexts/FeedbackModalContext';

// Mock navigation prop
type NavigationProp = {
  navigate: (screen: string) => void;
};

const LoginScreen = ({ navigation }: { navigation: NavigationProp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useContext(AuthContext);
  const { showModal } = useFeedbackModal();
  const insets = useSafeAreaInsets();
  const headerOffset = insets.top + 180;

  const handleLogin = () => {
    // Validação básica
    if (!email || !password) {
      showModal({
        title: 'Campos obrigatórios',
        message: 'Por favor, preencha todos os campos para continuar.',
        type: 'warning',
      });
      return;
    }
    signIn({ email, password });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 40 }]}>
        <Image source={require('../../assets/logo-branca.png')} style={styles.logo} />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView
          contentContainerStyle={[styles.form, { paddingTop: headerOffset }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Entrar</Text>
          <InputField
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={styles.fieldSpacing}
          />
          <InputField
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.fieldSpacing}
          />
          <CustomButton title="Entrar" onPress={handleLogin} style={styles.buttonSpacing} />
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Não tem conta? Cadastre-se</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Text style={styles.terms}>
        Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 16,
  },
  fieldSpacing: {
    marginVertical: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonSpacing: {
    marginVertical: 0,
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
