import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import { COLORS } from '../constants/colors';
import AuthContext from '../contexts/AuthContext';
import { useFeedbackModal } from '../contexts/FeedbackModalContext';

type UserType = 'person' | 'company';

// Mock navigation prop
type NavigationProp = {
  navigate: (screen: string) => void;
};

const RegisterScreen = ({ navigation }: { navigation: NavigationProp }) => {
  const { register, requestEmailCode } = useContext(AuthContext);
  const [userType, setUserType] = useState<UserType>('person');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState(''); // Adicionado CNPJ
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [emailUsedForCode, setEmailUsedForCode] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const { showModal } = useFeedbackModal();
  const insets = useSafeAreaInsets();
  const contentBottomInset = insets.bottom + 48;
  const RESEND_INTERVAL_SECONDS = 60;

  useEffect(() => {
    if (!resendTimer) {
      return undefined;
    }

    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleRequestCode = async () => {
    const trimmedEmail = email.trim();
    const normalizedEmail = trimmedEmail.toLowerCase();

    if (!trimmedEmail) {
      showModal({
        title: 'Informe um e-mail',
        message: 'Digite um e-mail válido antes de solicitar o código de verificação.',
        type: 'warning',
      });
      return;
    }

    setIsRequestingCode(true);
    const sent = await requestEmailCode(trimmedEmail);
    setIsRequestingCode(false);

    if (sent) {
      setCodeSent(true);
      setEmailUsedForCode(normalizedEmail);
      setResendTimer(RESEND_INTERVAL_SECONDS);
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      showModal({
        title: 'Senhas diferentes',
        message: 'As senhas informadas não conferem. Verifique e tente novamente.',
        type: 'warning',
      });
      return;
    }

    if (!verificationCode.trim()) {
      showModal({
        title: 'Código obrigatório',
        message: 'Informe o código enviado para o seu e-mail para concluir o cadastro.',
        type: 'warning',
      });
      return;
    }

    const trimmedEmail = email.trim();
    const normalizedEmail = trimmedEmail.toLowerCase();

    if (!emailUsedForCode || emailUsedForCode !== normalizedEmail) {
      showModal({
        title: 'Verifique o e-mail',
        message: 'Solicite e informe o código do mesmo e-mail que deseja cadastrar.',
        type: 'warning',
      });
      return;
    }

    const userData = {
      userType,
      name,
      email: trimmedEmail,
      password,
      cpf: userType === 'person' ? cpf : undefined,
      cnpj: userType === 'company' ? cnpj : undefined,
      verificationCode: verificationCode.trim(),
    };

    setIsSubmitting(true);
    try {
      const success = await register(userData);
      if (success) {
        navigation.navigate('Login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: contentBottomInset }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, { paddingTop: insets.top + 40 }]}>
            <Image source={require('../../assets/logo-branca.png')} style={styles.logo} />
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>Selecione seu tipo de conta</Text>

            <View style={styles.userTypeSelector}>
              <TouchableOpacity
                style={[styles.userTypeButton, userType === 'person' && styles.userTypeSelected]}
                onPress={() => setUserType('person')}
              >
                <Text
                  style={[styles.userTypeText, userType === 'person' && styles.userTypeSelectedText]}
                >
                  Pessoa Física
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.userTypeButton, userType === 'company' && styles.userTypeSelected]}
                onPress={() => setUserType('company')}
              >
                <Text
                  style={[styles.userTypeText, userType === 'company' && styles.userTypeSelectedText]}
                >
                  Empresa
                </Text>
              </TouchableOpacity>
            </View>

            <InputField
              placeholder="Nome Completo"
              value={name}
              onChangeText={setName}
              style={styles.fieldSpacing}
            />
            <InputField
              placeholder="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              style={styles.fieldSpacing}
            />
            <View style={styles.verificationRow}>
              <InputField
                placeholder="Código de verificação"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                style={[styles.fieldSpacing, styles.verificationField]}
              />
              <TouchableOpacity
                style={[styles.codeButton, resendTimer > 0 && styles.codeButtonDisabled]}
                onPress={handleRequestCode}
                disabled={isRequestingCode || resendTimer > 0}
              >
                <Text style={styles.codeButtonText}>
                  {isRequestingCode ? 'Enviando...' : resendTimer > 0 ? `Aguardar ${resendTimer}s` : codeSent ? 'Reenviar' : 'Enviar código'}
                </Text>
              </TouchableOpacity>
            </View>
            {codeSent && (
              <Text style={styles.helperText}>
                Não recebeu? Verifique a caixa de spam ou tente reenviar após alguns segundos.
              </Text>
            )}
            <InputField
              placeholder="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.fieldSpacing}
            />
            <InputField
              placeholder="Confirme a Senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.fieldSpacing}
            />
            {userType === 'person' ? (
              <InputField
                placeholder="CPF"
                value={cpf}
                onChangeText={setCpf}
                keyboardType="numeric"
                style={styles.fieldSpacing}
              />
            ) : (
              <InputField
                placeholder="CNPJ"
                value={cnpj}
                onChangeText={setCnpj}
                keyboardType="numeric"
                style={styles.fieldSpacing}
              />
            )}

            <CustomButton
              title="Concluir cadastro"
              onPress={handleRegister}
              style={styles.buttonSpacing}
              disabled={isSubmitting}
            />
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Já tenho conta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Criando sua conta...</Text>
          </View>
        </View>
      )}
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
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    width: '100%',
    marginBottom: 32,
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
  },
  form: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 16,
  },
  fieldSpacing: {
    marginVertical: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.icon,
    textAlign: 'center',
    marginBottom: 16,
  },
  userTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  userTypeSelected: {
    backgroundColor: COLORS.primary,
  },
  userTypeText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  userTypeSelectedText: {
    color: COLORS.card,
  },
  buttonSpacing: {
    marginVertical: 0,
  },
  link: {
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 10,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  verificationField: {
    flex: 1,
  },
  codeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.card,
  },
  codeButtonDisabled: {
    opacity: 0.6,
  },
  codeButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  helperText: {
    marginTop: -6,
    marginBottom: 12,
    fontSize: 12,
    color: COLORS.icon,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  loadingCard: {
    backgroundColor: COLORS.card,
    paddingVertical: 24,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
    minWidth: 220,
    elevation: 6,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
  },
});

export default RegisterScreen;
