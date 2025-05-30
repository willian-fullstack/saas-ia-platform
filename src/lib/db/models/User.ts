import mongoose from 'mongoose';
import { connectToDB } from '../connection';

// Definição da interface TypeScript para User
export interface IUser {
  name: string;
  email: string;
  password: string;
  image?: string;
  bio?: string;
  company?: string;
  cpf?: string; // Adicionado o campo CPF explicitamente
  phone?: string;
  credits: number; // Quantidade de créditos disponíveis
  subscriptionId?: mongoose.Schema.Types.ObjectId; // Referência à assinatura atual
  role: 'user' | 'admin'; // Papel do usuário
  notifications?: {
    email?: boolean;
    marketing?: boolean;
    updates?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Definição do Schema do Mongoose
const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Por favor, informe seu nome'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Por favor, informe seu email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g,
        'Por favor, informe um email válido',
      ],
    },
    password: {
      type: String,
      required: [true, 'Por favor, informe sua senha'],
      minlength: [8, 'A senha deve ter pelo menos 8 caracteres'],
    },
    image: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    company: {
      type: String,
      default: '',
    },
    cpf: {
      type: String,
      sparse: true,
      default: undefined,
      // Removido o campo "unique"
    },
    phone: {
      type: String,
      default: '',
    },
    credits: {
      type: Number,
      default: 0,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    notifications: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        email: true,
        marketing: false,
        updates: true,
      },
    },
  },
  {
    timestamps: true, // Adiciona createdAt e updatedAt
  }
);

// Removido o índice para o campo CPF

// Verifica se o modelo já existe para evitar redefinição
const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;

// Função de helper para obter usuário por email
export async function getUserByEmail(email: string) {
  await connectToDB();
  return User.findOne({ email }).exec();
}

// Função de helper para criar um novo usuário
export async function createUser(userData: Omit<IUser, 'createdAt' | 'updatedAt'>) {
  await connectToDB();
  
  // Se o CPF estiver vazio, definir como undefined
  if (!userData.cpf || userData.cpf.trim() === '') {
    userData.cpf = undefined;
  } else {
    // Verificar se já existe usuário com este CPF (validação manual)
    const existingUserWithCpf = await User.findOne({ cpf: userData.cpf }).exec();
    if (existingUserWithCpf) {
      throw new Error('Este CPF já está cadastrado.');
    }
  }
  
  return User.create(userData);
}

// Função de helper para verificar se um email está em uso
export async function isEmailInUse(email: string): Promise<boolean> {
  await connectToDB();
  const user = await User.findOne({ email }).exec();
  return !!user;
}

// Função de helper para verificar se um CPF está em uso
export async function isCpfInUse(cpf: string): Promise<boolean> {
  await connectToDB();
  if (!cpf || cpf.trim() === '') return false; // Se CPF vazio ou não informado, retorna false
  const user = await User.findOne({ cpf }).exec();
  return !!user;
}

// Função de helper para obter usuário por ID
export async function getUserById(id: string) {
  await connectToDB();
  
  // Validar e converter ID
  let userIdObj;
  try {
    userIdObj = new mongoose.Types.ObjectId(id);
  } catch (error) {
    console.error(`ID de usuário inválido ao buscar: ${id}`, error);
    throw new Error('ID de usuário inválido');
  }
  
  return User.findById(userIdObj).exec();
}

// Função de helper para atualizar créditos do usuário
export async function updateUserCredits(userId: string, credits: number, replace: boolean = false) {
  await connectToDB();
  
  // Validar e converter ID
  let userIdObj;
  try {
    userIdObj = new mongoose.Types.ObjectId(userId);
  } catch (error) {
    console.error(`ID de usuário inválido ao atualizar créditos: ${userId}`, error);
    throw new Error('ID de usuário inválido');
  }
  
  if (replace) {
    // Se replace for true, substitui o valor atual pelos créditos informados
    return User.findByIdAndUpdate(
      userIdObj,
      { credits },
      { new: true }
    ).exec();
  } else {
    // Caso contrário, adiciona os créditos ao valor atual (comportamento padrão)
    return User.findByIdAndUpdate(
      userIdObj,
      { $inc: { credits: credits } },
      { new: true }
    ).exec();
  }
}

// Função de helper para consumir créditos do usuário
export async function consumeUserCredits(userId: string, amount: number) {
  await connectToDB();
  
  // Validar e converter ID
  let userIdObj;
  try {
    userIdObj = new mongoose.Types.ObjectId(userId);
  } catch (error) {
    console.error(`ID de usuário inválido ao consumir créditos: ${userId}`, error);
    throw new Error('ID de usuário inválido');
  }
  
  const user = await User.findById(userIdObj).exec();
  
  if (!user) {
    throw new Error('Usuário não encontrado');
  }
  
  if (user.credits < amount) {
    throw new Error('Créditos insuficientes');
  }
  
  user.credits -= amount;
  return user.save();
}

// Função de helper para atualizar a assinatura do usuário
export async function updateUserSubscription(userId: string, subscriptionId: string) {
  await connectToDB();
  
  // Validar e converter IDs
  let userIdObj, subscriptionIdObj;
  try {
    userIdObj = new mongoose.Types.ObjectId(userId);
    subscriptionIdObj = new mongoose.Types.ObjectId(subscriptionId);
  } catch (error) {
    console.error(`ID inválido: userId=${userId}, subscriptionId=${subscriptionId}`, error);
    throw new Error('ID inválido');
  }
  
  return User.findByIdAndUpdate(
    userIdObj,
    { subscriptionId: subscriptionIdObj },
    { new: true }
  ).exec();
}

// Função de helper para obter todos os administradores
export async function getAdminUsers() {
  await connectToDB();
  return User.find({ role: 'admin' }).exec();
} 