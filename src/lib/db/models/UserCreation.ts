import mongoose from 'mongoose';
import { connectToDB } from '../connection';

// Tipos de criações suportadas
export type CreationType = 'copywriting' | 'landing-page' | 'offer' | 'creative' | 'video' | 'consultant';

// Interfaces para os diferentes tipos de conteúdo
export interface CopywritingContent {
  topic: string;
  copyType: string;
  tone: string;
  targetAudience?: string;
  keyPoints?: string[];
  structure?: string;
  wordCount?: string;
  result: string;
}

export interface LandingPageContent {
  title: string;
  description: string;
  sections: Array<{
    type: string;
    title?: string;
    content: string;
    style?: string;
  }>;
  style?: string;
  targetAudience?: string;
  result: string;
}

export interface OfferContent {
  productName: string;
  description: string;
  benefits: string[];
  price?: string;
  bonuses?: string[];
  result: string;
}

// Tipo de união para todos os conteúdos possíveis
export type ContentType = 
  | CopywritingContent 
  | LandingPageContent 
  | OfferContent 
  | Record<string, unknown>;

// Interface para o modelo de criações do usuário
export interface IUserCreation {
  userId: mongoose.Types.ObjectId;
  title: string;
  type: CreationType;
  content: ContentType;
  createdAt: Date;
  updatedAt: Date;
}

// Schema para o modelo de criações
const userCreationSchema = new mongoose.Schema<IUserCreation>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ID do usuário é obrigatório'],
      index: true, // Índice para melhorar a performance de busca
    },
    title: {
      type: String,
      required: [true, 'Título é obrigatório'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Tipo de criação é obrigatório'],
      enum: ['copywriting', 'landing-page', 'offer', 'creative', 'video', 'consultant'],
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Conteúdo é obrigatório'],
    },
  },
  {
    timestamps: true, // Adiciona createdAt e updatedAt
  }
);

// Verifica se o modelo já existe para evitar redefinição
const UserCreation = mongoose.models.UserCreation || 
  mongoose.model<IUserCreation>('UserCreation', userCreationSchema);

export default UserCreation;

// Função para salvar uma nova criação de usuário
export async function saveUserCreation(
  userId: string | mongoose.Types.ObjectId,
  title: string,
  type: CreationType,
  content: ContentType
) {
  await connectToDB();
  
  const userIdObj = typeof userId === 'string' 
    ? new mongoose.Types.ObjectId(userId) 
    : userId;
  
  return UserCreation.create({
    userId: userIdObj,
    title,
    type,
    content,
  });
}

// Função para obter todas as criações de um usuário
export async function getUserCreations(userId: string | mongoose.Types.ObjectId) {
  await connectToDB();
  
  const userIdObj = typeof userId === 'string' 
    ? new mongoose.Types.ObjectId(userId) 
    : userId;
  
  return UserCreation.find({ userId: userIdObj })
    .sort({ createdAt: -1 }) // Ordenar do mais recente para o mais antigo
    .exec();
}

// Função para obter criações de um usuário por tipo
export async function getUserCreationsByType(
  userId: string | mongoose.Types.ObjectId,
  type: CreationType
) {
  await connectToDB();
  
  const userIdObj = typeof userId === 'string' 
    ? new mongoose.Types.ObjectId(userId) 
    : userId;
  
  return UserCreation.find({ userId: userIdObj, type })
    .sort({ createdAt: -1 })
    .exec();
}

// Função para obter uma criação específica
export async function getUserCreationById(creationId: string | mongoose.Types.ObjectId) {
  await connectToDB();
  
  const creationIdObj = typeof creationId === 'string' 
    ? new mongoose.Types.ObjectId(creationId) 
    : creationId;
  
  return UserCreation.findById(creationIdObj).exec();
}

// Função para excluir uma criação
export async function deleteUserCreation(
  creationId: string | mongoose.Types.ObjectId,
  userId: string | mongoose.Types.ObjectId
) {
  await connectToDB();
  
  const creationIdObj = typeof creationId === 'string' 
    ? new mongoose.Types.ObjectId(creationId) 
    : creationId;
  
  const userIdObj = typeof userId === 'string' 
    ? new mongoose.Types.ObjectId(userId) 
    : userId;
  
  // Exclui apenas se pertencer ao usuário correto
  return UserCreation.findOneAndDelete({
    _id: creationIdObj,
    userId: userIdObj
  }).exec();
} 