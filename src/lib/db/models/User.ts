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