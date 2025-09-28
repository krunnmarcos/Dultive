import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import EmailVerification from '../models/EmailVerification';
import { sendVerificationEmail } from '../services/emailService';

const EMAIL_CODE_EXPIRATION_MINUTES = Number(process.env.EMAIL_VERIFICATION_CODE_TTL_MINUTES ?? 10);
const EMAIL_CODE_RESEND_INTERVAL_SECONDS = Number(process.env.EMAIL_VERIFICATION_RESEND_INTERVAL_SECONDS ?? 60);
const EMAIL_MAX_ATTEMPTS = Number(process.env.EMAIL_VERIFICATION_MAX_ATTEMPTS ?? 5);

const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const serializeUser = (user: any) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  userType: user.userType,
  phone: user.phone,
  profileImage: user.profileImage,
  points: user.points,
  location: user.location,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// Função de validação de CPF (simplificada, para exemplo)
function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]+/g,'');
  if(cpf == '') return false;
  // Elimina CPFs invalidos conhecidos
  if (cpf.length != 11 ||
    cpf == "00000000000" ||
    cpf == "11111111111" ||
    cpf == "22222222222" ||
    cpf == "33333333333" ||
    cpf == "44444444444" ||
    cpf == "55555555555" ||
    cpf == "66666666666" ||
    cpf == "77777777777" ||
    cpf == "88888888888" ||
    cpf == "99999999999")
        return false;
  // Valida 1o digito
  let add = 0;
  for (let i=0; i < 9; i ++)
    add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev == 10 || rev == 11)
      rev = 0;
    if (rev != parseInt(cpf.charAt(9)))
      return false;
  // Valida 2o digito
  add = 0;
  for (let i = 0; i < 10; i ++)
    add += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (add % 11);
  if (rev == 10 || rev == 11)
    rev = 0;
  if (rev != parseInt(cpf.charAt(10)))
    return false;
  return true;
}


export const requestEmailVerificationCode = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Informe um e-mail válido.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Este e-mail já está cadastrado.' });
    }

    const now = new Date();
    const verificationRecord = await EmailVerification.findOne({ email: normalizedEmail });

    if (verificationRecord) {
      const secondsSinceLastSend = (now.getTime() - verificationRecord.lastSentAt.getTime()) / 1000;
      if (secondsSinceLastSend < EMAIL_CODE_RESEND_INTERVAL_SECONDS) {
        const waitSeconds = Math.ceil(EMAIL_CODE_RESEND_INTERVAL_SECONDS - secondsSinceLastSend);
        return res.status(429).json({ message: `Aguarde ${waitSeconds}s para solicitar um novo código.` });
      }
    }

    const code = generateVerificationCode();
    const salt = await bcrypt.genSalt(10);
    const codeHash = await bcrypt.hash(code, salt);
    const expiresAt = new Date(now.getTime() + EMAIL_CODE_EXPIRATION_MINUTES * 60 * 1000);

    await EmailVerification.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        codeHash,
        expiresAt,
        attempts: 0,
        resends: (verificationRecord?.resends ?? 0) + 1,
        lastSentAt: now,
      },
      { upsert: true, new: true }
    );

    await sendVerificationEmail(normalizedEmail, code);

    return res.status(200).json({ message: 'Código de verificação enviado para o seu e-mail.' });
  } catch (error) {
    console.error('Erro ao solicitar código de verificação:', error);
    return res.status(500).json({ message: 'Não foi possível enviar o código. Tente novamente mais tarde.' });
  }
};

export const register = async (req: Request, res: Response) => {
  const { userType, name, email, password, phone, cpf, cnpj, verificationCode } = req.body;
  console.log('Recebido no registro:', req.body);

  try {
    console.log('Iniciando validações...');
    // Validar dados de entrada
    if (!userType || !name || !email || !password || !verificationCode) {
      console.log('Campos obrigatórios faltando');
      return res.status(400).json({ message: 'Por favor, forneça todos os campos obrigatórios.' });
    }

    // Validar tipo de usuário
  if (userType !== 'person' && userType !== 'company') {
    console.log('Tipo de usuário inválido:', userType);
    return res.status(400).json({ message: 'Tipo de usuário inválido.' });
  }

    // Validar CPF se for pessoa física
    if (userType === 'person' && cpf && !validateCPF(cpf)) {
      console.log('CPF inválido:', cpf);
      return res.status(400).json({ message: 'CPF inválido.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      console.log('Usuário já cadastrado:', email);
      return res.status(400).json({ message: 'Usuário já cadastrado com este e-mail.' });
    }

    const verificationRecord = await EmailVerification.findOne({ email: normalizedEmail });
    if (!verificationRecord) {
      return res.status(400).json({ message: 'Solicite o código de verificação para este e-mail antes de concluir o cadastro.' });
    }

    if (verificationRecord.expiresAt.getTime() < Date.now()) {
      await EmailVerification.deleteOne({ _id: verificationRecord._id });
      return res.status(400).json({ message: 'Código de verificação expirado. Solicite um novo código.' });
    }

    if (verificationRecord.attempts >= EMAIL_MAX_ATTEMPTS) {
      await EmailVerification.deleteOne({ _id: verificationRecord._id });
      return res.status(400).json({ message: 'Número máximo de tentativas excedido. Solicite um novo código.' });
    }

    const isCodeValid = await bcrypt.compare(String(verificationCode), verificationRecord.codeHash);
    if (!isCodeValid) {
      verificationRecord.attempts += 1;
      await verificationRecord.save();
      return res.status(400).json({ message: 'Código de verificação inválido.' });
    }

    // Hash da senha
  console.log('Gerando hash da senha...');
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

    // Criar novo usuário
    const newUser = new User({
      userType,
      name,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      cpf: userType === 'person' ? cpf : undefined,
      cnpj: userType === 'company' ? cnpj : undefined,
      isVerified: true,
    });
    console.log('Novo usuário criado:', newUser);
    try {
      await newUser.save();
      console.log('Usuário salvo com sucesso!');
      await EmailVerification.deleteOne({ _id: verificationRecord._id });
      res.status(201).json({ message: 'Usuário registrado com sucesso!' });
    } catch (saveError: any) {
      console.error('Erro ao salvar usuário:', saveError);
      if (saveError.code === 11000) {
        // Erro de duplicidade de CPF ou CNPJ
        if (saveError.keyPattern?.cpf) {
          return res.status(400).json({ message: 'Já existe um cadastro com este CPF.' });
        }
        if (saveError.keyPattern?.cnpj) {
          return res.status(400).json({ message: 'Já existe um cadastro com este CNPJ.' });
        }
        return res.status(400).json({ message: 'Já existe um cadastro com este dado único.' });
      }
      res.status(500).json({ message: 'Erro ao salvar usuário.', error: saveError });
      return;
    }

  } catch (error) {
    console.error('Erro inesperado no registro:', error);
    res.status(500).json({ message: 'Erro no servidor.', error });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Verificar se o usuário existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Credenciais inválidas.' });
    }

    // Verificar a senha
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciais inválidas.' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: serializeUser(user),
    });

  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor.', error });
  }
};
