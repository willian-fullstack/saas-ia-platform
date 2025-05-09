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
  return User.create(userData);
}

// Função de helper para verificar se um email está em uso
export async function isEmailInUse(email: string): Promise<boolean> {
  await connectToDB();
  const user = await User.findOne({ email }).exec();
  return !!user;
}

// Função de helper para obter usuário por ID
export async function getUserById(id: string) {
  await connectToDB();
  return User.findById(id).exec();
}

// Função de helper para atualizar créditos do usuário
export async function updateUserCredits(userId: string, credits: number, replace: boolean = false) {
  await connectToDB();
  
  if (replace) {
    // Se replace for true, substitui o valor atual pelos créditos informados
    return User.findByIdAndUpdate(
      userId,
      { credits },
      { new: true }
    ).exec();
  } else {
    // Caso contrário, adiciona os créditos ao valor atual (comportamento padrão)
    return User.findByIdAndUpdate(
      userId,
      { $inc: { credits: credits } },
      { new: true }
    ).exec();
  }
}

// Função de helper para consumir créditos do usuário
export async function consumeUserCredits(userId: string, amount: number) {
  await connectToDB();
  const user = await User.findById(userId).exec();
  
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
  return User.findByIdAndUpdate(
    userId,
    { subscriptionId },
    { new: true }
  ).exec();
}

// Função de helper para obter todos os administradores
export async function getAdminUsers() {
  await connectToDB();
  return User.find({ role: 'admin' }).exec();
} 