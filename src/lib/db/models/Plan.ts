import mongoose, { Schema } from 'mongoose';
import { connectToDB } from '../connection';

// Interface para o modelo de Plano
export interface IPlan {
  name: string;
  description?: string;
  price: number;
  credits: number;
  features: string[];
  mercadoPagoId?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Schema para o modelo de Plano
const PlanSchema = new Schema<IPlan>({
  name: { 
    type: String, 
    required: [true, 'Nome do plano é obrigatório'],
  },
  description: { 
    type: String,
    default: '',
  },
  price: { 
    type: Number, 
    required: [true, 'Preço do plano é obrigatório'],
    min: 0,
  },
  credits: { 
    type: Number, 
    required: [true, 'Quantidade de créditos é obrigatória'],
    min: 0,
  },
  features: [{ 
    type: String 
  }],
  mercadoPagoId: { 
    type: String
  },
  active: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true, // Adiciona createdAt e updatedAt
});

// Verifica se o modelo já existe para evitar redefinição
const Plan = mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema);

export default Plan;

// Função helper para obter todos os planos ativos
export async function getActivePlans() {
  await connectToDB();
  return Plan.find({ active: true }).sort({ price: 1 }).exec();
}

// Função helper para obter um plano pelo ID
export async function getPlanById(id: string) {
  await connectToDB();
  return Plan.findById(id).exec();
}

// Função helper para criar um plano
export async function createPlan(planData: Omit<IPlan, 'createdAt' | 'updatedAt'>) {
  await connectToDB();
  return Plan.create(planData);
}

// Função helper para atualizar um plano
export async function updatePlan(id: string, planData: Partial<IPlan>) {
  await connectToDB();
  return Plan.findByIdAndUpdate(id, planData, { new: true }).exec();
} 