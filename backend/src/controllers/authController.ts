import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

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


export const register = async (req: Request, res: Response) => {
  const { userType, name, email, password, phone, cpf, cnpj } = req.body;
  console.log('Recebido no registro:', req.body);

  try {
    console.log('Iniciando validações...');
    // Validar dados de entrada
    if (!userType || !name || !email || !password) {
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

    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Usuário já cadastrado:', email);
      return res.status(400).json({ message: 'Usuário já cadastrado com este e-mail.' });
    }

    // Hash da senha
  console.log('Gerando hash da senha...');
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

    // Criar novo usuário
    const newUser = new User({
      userType,
      name,
      email,
      password: hashedPassword,
      phone,
      cpf: userType === 'person' ? cpf : undefined,
      cnpj: userType === 'company' ? cnpj : undefined,
    });
    console.log('Novo usuário criado:', newUser);
    try {
      await newUser.save();
      console.log('Usuário salvo com sucesso!');
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
