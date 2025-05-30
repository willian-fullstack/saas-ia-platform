import mongoose, { Schema, Document } from 'mongoose';
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
  productDescription: string;
  targetAudience: string;
  features: string[];
  benefits: string[];
  offerDescription: string;
  price: number;
  originalPrice?: number;
  callToAction: string;
  expiration?: string;
  bonuses?: string[];
  guarantees?: string[];
  testimonials?: Array<{
    name: string;
    content: string;
  }>;
}

// Tipo de união para todos os conteúdos possíveis
export type ContentType = 
  | CopywritingContent 
  | LandingPageContent 
  | OfferContent 
  | Record<string, unknown>;

// Interface para o modelo de UserCreation
export interface IUserCreation extends Document {
  userId: mongoose.Types.ObjectId | string;
  title: string;
  type: CreationType;
  content: ContentType;
  createdAt: Date;
  updatedAt: Date;
}

// Schema para o modelo UserCreation
const userCreationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ID do usuário é obrigatório'],
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
    timestamps: true,
  }
);

// Verifica se o modelo já existe para evitar redefinição
const UserCreation = mongoose.models.UserCreation || mongoose.model<IUserCreation>('UserCreation', userCreationSchema);

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
export async function getUserCreations(userId: string) {
  await connectToDB();
  
  // Validar e converter ID
  let userIdObj;
  try {
    userIdObj = new mongoose.Types.ObjectId(userId);
  } catch (error) {
    console.error(`ID de usuário inválido ao listar criações: ${userId}`, error);
    throw new Error('ID de usuário inválido');
  }
  
  return UserCreation.find({ userId: userIdObj })
    .sort({ createdAt: -1 })
    .lean()
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
export async function getUserCreationById(id: string, userId: string) {
  await connectToDB();
  
  // Validar e converter IDs
  let userCreationId, userIdObj;
  try {
    userCreationId = new mongoose.Types.ObjectId(id);
    userIdObj = new mongoose.Types.ObjectId(userId);
  } catch (error) {
    console.error(`ID inválido: userCreationId=${id}, userId=${userId}`, error);
    throw new Error('ID inválido');
  }
  
  return UserCreation.findOne({ 
    _id: userCreationId,
    userId: userIdObj 
  })
    .lean()
    .exec();
}

// Função para criar uma nova criação de usuário
export async function createUserCreation(data: {
  userId: string;
  title: string;
  type: CreationType;
  content: ContentType;
}) {
  await connectToDB();
  
  // Validar e converter ID
  let userIdObj;
  try {
    userIdObj = new mongoose.Types.ObjectId(data.userId);
  } catch (error) {
    console.error(`ID de usuário inválido ao criar: ${data.userId}`, error);
    throw new Error('ID de usuário inválido');
  }
  
  // Criar com o ID convertido
  return UserCreation.create({
    ...data,
    userId: userIdObj
  });
}

// Função para atualizar uma criação existente
export async function updateUserCreation(
  id: string,
  userId: string,
  data: Partial<IUserCreation>
) {
  await connectToDB();
  
  // Validar e converter IDs
  let userCreationId, userIdObj;
  try {
    userCreationId = new mongoose.Types.ObjectId(id);
    userIdObj = new mongoose.Types.ObjectId(userId);
  } catch (error) {
    console.error(`ID inválido: userCreationId=${id}, userId=${userId}`, error);
    throw new Error('ID inválido');
  }
  
  return UserCreation.findOneAndUpdate(
    { _id: userCreationId, userId: userIdObj },
    data,
    { new: true }
  ).exec();
}

// Função para excluir uma criação
export async function deleteUserCreation(id: string, userId: string) {
  await connectToDB();
  
  // Validar e converter IDs
  let userCreationId, userIdObj;
  try {
    userCreationId = new mongoose.Types.ObjectId(id);
    userIdObj = new mongoose.Types.ObjectId(userId);
  } catch (error) {
    console.error(`ID inválido: userCreationId=${id}, userId=${userId}`, error);
    throw new Error('ID inválido');
  }
  
  return UserCreation.findOneAndDelete({ 
    _id: userCreationId,
    userId: userIdObj 
  }).exec();
} 