import mongoose from 'mongoose';

// Interface para mensagens da sessão
interface SessionMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Interface para o modelo DeepSiteSession
export interface IDeepSiteSession {
  _id?: string;
  userId: string;
  title: string;
  status: 'draft' | 'published';
  content: string;
  html?: string;
  landingPageId?: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: SessionMessage[];
}

// Schema para mensagens
const SessionMessageSchema = new mongoose.Schema<SessionMessage>({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Schema para DeepSiteSession
const DeepSiteSessionSchema = new mongoose.Schema<IDeepSiteSession>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    default: 'Nova Landing Page'
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  content: {
    type: String,
    required: true
  },
  html: {
    type: String
  },
  landingPageId: {
    type: String,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  messages: {
    type: [SessionMessageSchema],
    default: []
  }
});

// Criação do modelo
export const DeepSiteSession = mongoose.models.DeepSiteSession || 
  mongoose.model<IDeepSiteSession>('DeepSiteSession', DeepSiteSessionSchema);

// Funções auxiliares para o modelo
export async function createDeepSiteSession(sessionData: Partial<IDeepSiteSession>): Promise<IDeepSiteSession> {
  const session = new DeepSiteSession({
    ...sessionData,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  await session.save();
  return session;
}

export async function getDeepSiteSessionById(id: string): Promise<IDeepSiteSession | null> {
  return DeepSiteSession.findById(id);
}

export async function getDeepSiteSessionsByUserId(userId: string): Promise<IDeepSiteSession[]> {
  return DeepSiteSession.find({ userId }).sort({ updatedAt: -1 });
}

export async function updateDeepSiteSession(id: string, data: Partial<IDeepSiteSession>): Promise<IDeepSiteSession | null> {
  return DeepSiteSession.findByIdAndUpdate(
    id,
    { ...data, updatedAt: new Date() },
    { new: true }
  );
}

export async function deleteDeepSiteSession(id: string): Promise<boolean> {
  const result = await DeepSiteSession.deleteOne({ _id: id });
  return result.deletedCount > 0;
} 