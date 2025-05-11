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

// Interface para criação de assinatura (aceita string ou ObjectId)
export interface ICreateSubscriptionInput {
  userId: string | Schema.Types.ObjectId;
  planId: string | Schema.Types.ObjectId;
  status: 'active' | 'cancelled' | 'pending';
  mercadoPagoId?: string;
  startDate?: Date;
  endDate?: Date;
  renewalDate?: Date;
  paymentHistory: IPaymentHistory[];
}

// Interface para atualização de assinatura
export interface IUpdateSubscriptionInput {
  planId?: string | Schema.Types.ObjectId;
  status?: 'active' | 'cancelled' | 'pending';
  mercadoPagoId?: string;
  startDate?: Date;
  endDate?: Date;
  renewalDate?: Date;
  [key: string]: any;
}

// Esquema para o histórico de pagamentos
const PaymentHistorySchema = new Schema({
  paymentId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now }
});

// Esquema para o modelo de Assinatura
const SubscriptionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
  status: { 
    type: String,
    enum: ['active', 'cancelled', 'pending'],
    default: 'pending',
    required: true
  },
  mercadoPagoId: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  renewalDate: { type: Date },
  paymentHistory: [PaymentHistorySchema]
}, {
  timestamps: true
});

// Modelo de assinatura (inicializado sob demanda)
let Subscription: mongoose.Model<ISubscription> | null = null;

// Garantir que o modelo seja inicializado apenas uma vez
export const getSubscriptionModel = async () => {
  await connectToDB();
  
  if (!Subscription) {
    if (mongoose.models.Subscription) {
      Subscription = mongoose.models.Subscription as mongoose.Model<ISubscription>;
    } else {
      Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
    }
  }
  
  return Subscription;
};

/**
 * Cria uma nova assinatura
 * @param subscription Dados da assinatura
 * @returns Assinatura criada
 */
export const createSubscription = async (subscription: ICreateSubscriptionInput) => {
  const SubscriptionModel = await getSubscriptionModel();
  return await SubscriptionModel.create(subscription);
};

/**
 * Atualiza o status de uma assinatura
 * @param subscriptionId ID da assinatura
 * @param status Novo status
 * @param updateData Dados adicionais para atualizar
 * @returns Assinatura atualizada
 */
export const updateSubscriptionStatus = async (
  subscriptionId: string,
  status: 'active' | 'cancelled' | 'pending',
  updateData: IUpdateSubscriptionInput = {}
) => {
  const SubscriptionModel = await getSubscriptionModel();
  
  const updatedData = {
    status,
    ...updateData
  };
  
  return await SubscriptionModel.findByIdAndUpdate(
    subscriptionId,
    updatedData,
    { new: true }
  );
};

/**
 * Busca uma assinatura pelo ID do usuário
 * @param userId ID do usuário
 * @returns Assinatura do usuário
 */
export const getUserSubscription = async (userId: string) => {
  const SubscriptionModel = await getSubscriptionModel();
  return await SubscriptionModel.findOne({ userId })
    .populate({
      path: 'planId',
      model: 'Plan',
      select: '_id name price credits features description'
    })
    .sort({ createdAt: -1 })
    .exec();
};

/**
 * Busca uma assinatura pelo ID do Mercado Pago ou external_reference
 * @param mpId ID do Mercado Pago ou external_reference
 * @returns Assinatura encontrada
 */
export const getSubscriptionByMPId = async (mpId: string) => {
  const SubscriptionModel = await getSubscriptionModel();
  
  // Tentar encontrar por mercadoPagoId primeiro
  let subscription = await SubscriptionModel.findOne({ mercadoPagoId: mpId });
  
  // Se não encontrar, tente encontrar pelo ID do usuário (external_reference)
  if (!subscription) {
    subscription = await SubscriptionModel.findOne({ userId: mpId });
    
    // Se ainda não encontrar, tente encontrar pelo ID da própria assinatura
    if (!subscription) {
      try {
        const objectId = new mongoose.Types.ObjectId(mpId);
        subscription = await SubscriptionModel.findById(objectId);
      } catch (error) {
        // Não é um ObjectId válido, então não há correspondência
        console.log(`ID '${mpId}' não é um ObjectId válido`);
      }
    }
  }
  
  return subscription;
};

/**
 * Adiciona um registro de pagamento ao histórico da assinatura
 * @param subscriptionId ID da assinatura
 * @param payment Dados do pagamento
 * @returns Assinatura atualizada
 */
export const addPaymentRecord = async (
  subscriptionId: string,
  payment: IPaymentHistory
) => {
  const SubscriptionModel = await getSubscriptionModel();
  
  return await SubscriptionModel.findByIdAndUpdate(
    subscriptionId,
    { 
      $push: { 
        paymentHistory: {
          paymentId: payment.paymentId,
          amount: payment.amount,
          status: payment.status,
          date: payment.date
        } 
      } 
    },
    { new: true }
  );
}; 