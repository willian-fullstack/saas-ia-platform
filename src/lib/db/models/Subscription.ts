import mongoose, { Schema } from 'mongoose';
import { connectToDB } from '../connection';

// Interface para o histórico de pagamentos
interface IPaymentHistory {
  paymentId: string;
  amount: number;
  status: string;
  date: Date;
}

// Interface para o modelo de Assinatura
export interface ISubscription {
  userId: Schema.Types.ObjectId;
  planId: Schema.Types.ObjectId;
  status: 'active' | 'cancelled' | 'pending';
  mercadoPagoId?: string;
  startDate?: Date;
  endDate?: Date;
  renewalDate?: Date;
  paymentHistory: IPaymentHistory[];
  createdAt: Date;
  updatedAt: Date;
}

// Schema para o modelo de Assinatura
const SubscriptionSchema = new Schema<ISubscription>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'ID do usuário é obrigatório'] 
  },
  planId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Plan', 
    required: [true, 'ID do plano é obrigatório'] 
  },
  status: { 
    type: String, 
    enum: ['active', 'cancelled', 'pending'], 
    default: 'pending' 
  },
  mercadoPagoId: { 
    type: String 
  },
  startDate: { 
    type: Date 
  },
  endDate: { 
    type: Date 
  },
  renewalDate: { 
    type: Date 
  },
  paymentHistory: [{
    paymentId: String,
    amount: Number,
    status: String,
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true, // Adiciona createdAt e updatedAt
});

// Verifica se o modelo já existe para evitar redefinição
const Subscription = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

export default Subscription;

// Função helper para obter a assinatura de um usuário
export async function getUserSubscription(userId: string) {
  await connectToDB();
  return Subscription.findOne({ userId })
    .populate('planId')
    .sort({ createdAt: -1 })
    .exec();
}

// Função helper para criar uma assinatura
export async function createSubscription(subscriptionData: Omit<ISubscription, 'createdAt' | 'updatedAt'>) {
  await connectToDB();
  return Subscription.create(subscriptionData);
}

// Função helper para atualizar o status de uma assinatura
export async function updateSubscriptionStatus(id: string, status: 'active' | 'cancelled' | 'pending', updateData: Partial<ISubscription> = {}) {
  await connectToDB();
  return Subscription.findByIdAndUpdate(
    id, 
    { status, ...updateData }, 
    { new: true }
  ).exec();
}

// Função helper para adicionar um registro de pagamento
export async function addPaymentRecord(subscriptionId: string, paymentData: IPaymentHistory) {
  await connectToDB();
  return Subscription.findByIdAndUpdate(
    subscriptionId,
    { $push: { paymentHistory: paymentData } },
    { new: true }
  ).exec();
}

// Função helper para obter assinatura por mercadoPagoId
export async function getSubscriptionByMPId(mercadoPagoId: string) {
  await connectToDB();
  return Subscription.findOne({ mercadoPagoId }).exec();
} 