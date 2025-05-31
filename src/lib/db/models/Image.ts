import mongoose, { Schema, Document, Model } from 'mongoose';
import { connectToDB } from '../connection';

// Interface para o documento Image
export interface IImage extends Document {
  filename: string;
  originalname: string;
  mimetype: string;
  path: string;
  size: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Esquema para o modelo Image
const imageSchema = new Schema<IImage>(
  {
    filename: {
      type: String,
      required: [true, 'Nome do arquivo é obrigatório'],
      trim: true,
      index: true,
    },
    originalname: {
      type: String,
      required: [true, 'Nome original do arquivo é obrigatório'],
      trim: true,
    },
    mimetype: {
      type: String,
      required: [true, 'Tipo MIME é obrigatório'],
      trim: true,
    },
    path: {
      type: String,
      required: [true, 'Caminho do arquivo é obrigatório'],
      trim: true,
    },
    size: {
      type: Number,
      required: [true, 'Tamanho do arquivo é obrigatório'],
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
let ImageModel: Model<IImage> | null = null;

// Função para obter o modelo Image
export async function getImageModel(): Promise<Model<IImage>> {
  try {
    if (!ImageModel) {
      await connectToDB();
      
      // Verificar se o modelo já está registrado
      ImageModel = mongoose.models.Image as Model<IImage> || 
        mongoose.model<IImage>('Image', imageSchema);
      
      console.log('Modelo Image inicializado com sucesso');
    }
    
    return ImageModel;
  } catch (error) {
    console.error('Erro ao inicializar modelo Image:', error);
    throw error;
  }
}

// Buscar imagens por userId
export async function getImagesByUserId(userId: string) {
  try {
    console.log(`Buscando imagens para o usuário: ${userId}`);
    
    await connectToDB();
    const ImageModel = await getImageModel();
    
    // Verificar se o modelo foi inicializado corretamente
    if (!ImageModel) {
      console.error('Modelo Image não foi inicializado corretamente');
      return [];
    }
    
    const images = await ImageModel.find({ userId }).sort({ createdAt: -1 }).exec();
    
    console.log(`Encontradas ${images.length} imagens para o usuário ${userId}`);
    
    return images;
  } catch (error) {
    console.error('Erro ao buscar imagens por userId:', error);
    return [];
  }
}

// Criar uma nova imagem
export async function createImage(imageData: Omit<IImage, 'createdAt' | 'updatedAt'>) {
  try {
    console.log(`Criando imagem para o usuário: ${imageData.userId}`);
    
    await connectToDB();
    const ImageModel = await getImageModel();
    
    // Verificar se o modelo foi inicializado corretamente
    if (!ImageModel) {
      console.error('Modelo Image não foi inicializado corretamente');
      throw new Error('Erro ao inicializar o modelo Image');
    }
    
    const newImage = await ImageModel.create(imageData);
    
    console.log(`Imagem criada com sucesso. ID: ${newImage._id}`);
    
    return newImage;
  } catch (error) {
    console.error('Erro ao criar imagem:', error);
    throw error;
  }
}

// Buscar imagem por ID
export async function getImageById(id: string) {
  try {
    console.log(`Buscando imagem com ID: ${id}`);
    
    await connectToDB();
    const ImageModel = await getImageModel();
    
    if (!ImageModel) {
      console.error('Modelo Image não foi inicializado corretamente');
      return null;
    }
    
    const image = await ImageModel.findById(id).exec();
    
    if (!image) {
      console.log(`Imagem com ID ${id} não encontrada`);
      return null;
    }
    
    return image;
  } catch (error) {
    console.error(`Erro ao buscar imagem com ID ${id}:`, error);
    return null;
  }
}

// Excluir uma imagem
export async function deleteImage(id: string) {
  try {
    console.log(`Excluindo imagem com ID: ${id}`);
    
    await connectToDB();
    const ImageModel = await getImageModel();
    
    if (!ImageModel) {
      console.error('Modelo Image não foi inicializado corretamente');
      return false;
    }
    
    const result = await ImageModel.findByIdAndDelete(id).exec();
    
    if (!result) {
      console.log(`Imagem com ID ${id} não encontrada para exclusão`);
      return false;
    }
    
    console.log(`Imagem excluída com sucesso`);
    
    return true;
  } catch (error) {
    console.error(`Erro ao excluir imagem com ID ${id}:`, error);
    return false;
  }
}

export default await getImageModel(); 