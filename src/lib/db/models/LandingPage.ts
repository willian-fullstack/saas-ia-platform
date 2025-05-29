import mongoose, { Schema } from 'mongoose';
import { connectToDB } from '../connection';

// Interface para o modelo de Landing Page
export interface ILandingPage {
  title: string;
  description?: string;
  html: string;
  tags: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Esquema para o modelo de Landing Page
const LandingPageSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  html: { type: String, required: true },
  tags: { type: [String], default: [] },
  userId: { type: String, required: true },
}, {
  timestamps: true
});

// Modelo de Landing Page (inicializado sob demanda)
let LandingPage: mongoose.Model<ILandingPage> | null = null;

// Garantir que o modelo seja inicializado apenas uma vez
export const getLandingPageModel = async () => {
  await connectToDB();
  
  if (!LandingPage) {
    if (mongoose.models.LandingPage) {
      LandingPage = mongoose.models.LandingPage as mongoose.Model<ILandingPage>;
    } else {
      LandingPage = mongoose.model<ILandingPage>('LandingPage', LandingPageSchema);
    }
  }
  
  return LandingPage;
};

// Funções auxiliares para operações com landing pages

// Criar uma nova landing page
export async function createLandingPage(landingPageData: Omit<ILandingPage, 'createdAt' | 'updatedAt'>) {
  const LandingPageModel = await getLandingPageModel();
  return LandingPageModel.create(landingPageData);
}

// Buscar landing pages por userId
export async function getLandingPagesByUserId(userId: string) {
  const LandingPageModel = await getLandingPageModel();
  return LandingPageModel.find({ userId }).sort({ updatedAt: -1 }).exec();
}

// Buscar uma landing page por ID
export async function getLandingPageById(id: string) {
  const LandingPageModel = await getLandingPageModel();
  return LandingPageModel.findById(id).exec();
}

// Atualizar uma landing page
export async function updateLandingPage(id: string, updateData: Partial<ILandingPage>) {
  const LandingPageModel = await getLandingPageModel();
  return LandingPageModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true }
  ).exec();
}

// Excluir uma landing page
export async function deleteLandingPage(id: string) {
  const LandingPageModel = await getLandingPageModel();
  return LandingPageModel.findByIdAndDelete(id).exec();
} 