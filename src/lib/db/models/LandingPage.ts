import mongoose, { Schema, Document, Model } from 'mongoose';
import { connectToDB } from '../connection';

// Interface para o documento LandingPage
export interface ILandingPage extends Document {
  title: string;
  description: string;
  html: string;
  tags: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Esquema para o modelo LandingPage
const landingPageSchema = new Schema<ILandingPage>(
  {
    title: {
      type: String,
      required: [true, 'Título é obrigatório'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    html: {
      type: String,
      required: [true, 'HTML é obrigatório'],
    },
    tags: {
      type: [String],
      default: [],
    },
    userId: {
      type: String,
      required: [true, 'ID do usuário é obrigatório'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Variável para armazenar o modelo
let LandingPageModel: Model<ILandingPage> | null = null;

// Função para obter o modelo LandingPage
export async function getLandingPageModel(): Promise<Model<ILandingPage>> {
  try {
    if (!LandingPageModel) {
      await connectToDB();
      
      // Verificar se o modelo já está registrado
      LandingPageModel = mongoose.models.LandingPage as Model<ILandingPage> || 
        mongoose.model<ILandingPage>('LandingPage', landingPageSchema);
      
      console.log('Modelo LandingPage inicializado com sucesso');
    }
    
    return LandingPageModel;
  } catch (error) {
    console.error('Erro ao inicializar modelo LandingPage:', error);
    throw error;
  }
}

// Buscar landing pages por userId
export async function getLandingPagesByUserId(userId: string) {
  try {
    console.log(`Buscando landing pages para o usuário: ${userId}`);
    
    await connectToDB();
    const LandingPageModel = await getLandingPageModel();
    
    // Verificar se o modelo foi inicializado corretamente
    if (!LandingPageModel) {
      console.error('Modelo LandingPage não foi inicializado corretamente');
      return [];
    }
    
    const landingPages = await LandingPageModel.find({ userId }).sort({ updatedAt: -1 }).exec();
    
    console.log(`Encontradas ${landingPages.length} landing pages para o usuário ${userId}`);
    console.log('IDs das landing pages encontradas:', landingPages.map(lp => lp._id.toString()));
    
    return landingPages;
  } catch (error) {
    console.error('Erro ao buscar landing pages por userId:', error);
    return [];
  }
}

// Criar uma nova landing page
export async function createLandingPage(landingPageData: Omit<ILandingPage, 'createdAt' | 'updatedAt'>) {
  try {
    console.log(`Criando landing page para o usuário: ${landingPageData.userId}`);
    console.log(`Título: ${landingPageData.title}`);
    
    await connectToDB();
    const LandingPageModel = await getLandingPageModel();
    
    // Verificar se o modelo foi inicializado corretamente
    if (!LandingPageModel) {
      console.error('Modelo LandingPage não foi inicializado corretamente');
      throw new Error('Erro ao inicializar o modelo LandingPage');
    }
    
    const newLandingPage = await LandingPageModel.create(landingPageData);
    
    console.log(`Landing page criada com sucesso. ID: ${newLandingPage._id}`);
    
    return newLandingPage;
  } catch (error) {
    console.error('Erro ao criar landing page:', error);
    throw error;
  }
}

// Buscar landing page por ID
export async function getLandingPageById(id: string) {
  try {
    console.log(`Buscando landing page com ID: ${id}`);
    
    await connectToDB();
    const LandingPageModel = await getLandingPageModel();
    
    if (!LandingPageModel) {
      console.error('Modelo LandingPage não foi inicializado corretamente');
      return null;
    }
    
    const landingPage = await LandingPageModel.findById(id).exec();
    
    if (!landingPage) {
      console.log(`Landing page com ID ${id} não encontrada`);
      return null;
    }
    
    console.log(`Landing page encontrada: ${landingPage.title}`);
    
    return landingPage;
  } catch (error) {
    console.error(`Erro ao buscar landing page com ID ${id}:`, error);
    return null;
  }
}

// Atualizar uma landing page
export async function updateLandingPage(id: string, updateData: Partial<ILandingPage>) {
  try {
    console.log(`Atualizando landing page com ID: ${id}`);
    
    await connectToDB();
    const LandingPageModel = await getLandingPageModel();
    
    if (!LandingPageModel) {
      console.error('Modelo LandingPage não foi inicializado corretamente');
      return null;
    }
    
    const updatedLandingPage = await LandingPageModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).exec();
    
    if (!updatedLandingPage) {
      console.log(`Landing page com ID ${id} não encontrada para atualização`);
      return null;
    }
    
    console.log(`Landing page atualizada com sucesso: ${updatedLandingPage.title}`);
    
    return updatedLandingPage;
  } catch (error) {
    console.error(`Erro ao atualizar landing page com ID ${id}:`, error);
    return null;
  }
}

// Excluir uma landing page
export async function deleteLandingPage(id: string) {
  try {
    console.log(`Excluindo landing page com ID: ${id}`);
    
    await connectToDB();
    const LandingPageModel = await getLandingPageModel();
    
    if (!LandingPageModel) {
      console.error('Modelo LandingPage não foi inicializado corretamente');
      return false;
    }
    
    const result = await LandingPageModel.findByIdAndDelete(id).exec();
    
    if (!result) {
      console.log(`Landing page com ID ${id} não encontrada para exclusão`);
      return false;
    }
    
    console.log(`Landing page excluída com sucesso: ${result.title}`);
    
    return true;
  } catch (error) {
    console.error(`Erro ao excluir landing page com ID ${id}:`, error);
    return false;
  }
} 