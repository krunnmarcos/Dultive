import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import { COLORS } from '../constants/colors';
import AuthContext from '../contexts/AuthContext';

type UserType = 'person' | 'company';

// Mock navigation prop
type NavigationProp = {
  navigate: (screen: string) => void;
};

const RegisterScreen = ({ navigation }: { navigation: NavigationProp }) => {
  const { register } = useContext(AuthContext);
  const [userType, setUserType] = useState<UserType>('person');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState(''); // Adicionado CNPJ

  const handleRegister = () => {
    if (password !== confirmPassword) {
      alert('As senhas não conferem.');
      return;
    }

    const userData = {
      userType,
      name,
      email,
      password,
      cpf: userType === 'person' ? cpf : undefined,
      cnpj: userType === 'company' ? cnpj : undefined,
    };

    register(userData).then(() => {
      navigation.navigate('Login');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
      </View>
      <Text style={styles.title}>Criar Conta</Text>
      <Text style={styles.subtitle}>Selecione seu tipo de conta</Text>

      <View style={styles.userTypeSelector}>
        <TouchableOpacity
          style={[styles.userTypeButton, userType === 'person' && styles.userTypeSelected]}
          onPress={() => setUserType('person')}
        >
          <Text style={[styles.userTypeText, userType === 'person' && styles.userTypeSelectedText]}>Pessoa Física</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.userTypeButton, userType === 'company' && styles.userTypeSelected]}
          onPress={() => setUserType('company')}
        >
          <Text style={[styles.userTypeText, userType === 'company' && styles.userTypeSelectedText]}>Empresa</Text>
        </TouchableOpacity>
      </View>

      <InputField placeholder="Nome Completo" value={name} onChangeText={setName} />
      <InputField placeholder="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <InputField placeholder="Senha" value={password} onChangeText={setPassword} secureTextEntry />
      <InputField placeholder="Confirme a Senha" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
      {userType === 'person' ? (
        <InputField placeholder="CPF" value={cpf} onChangeText={setCpf} keyboardType="numeric" />
      ) : (
        <InputField placeholder="CNPJ" value={cnpj} onChangeText={setCnpj} keyboardType="numeric" />
      )}

      <CustomButton title="Continuar" onPress={handleRegister} />
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Já tenho conta</Text>
      </TouchableOpacity>
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
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.icon,
    textAlign: 'center',
    marginBottom: 20,
  },
  userTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  userTypeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginHorizontal: 5,
  },
  userTypeSelected: {
    backgroundColor: COLORS.primary,
  },
  userTypeText: {
    color: COLORS.primary,
  },
  userTypeSelectedText: {
    color: COLORS.card,
  },
  link: {
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default RegisterScreen;
