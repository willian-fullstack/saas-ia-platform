import mongoose from 'mongoose';

// Certifique-se de que a variável de ambiente MONGODB_URI está definida
const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  console.error('⚠️ A variável de ambiente MONGODB_URI não está definida');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('A variável de ambiente MONGODB_URI é obrigatória em produção');
  } else {
    console.warn('⚠️ Usando conexão local como fallback em ambiente de desenvolvimento');
  }
}

// Estrutura para cache de conexão
interface ConnectionCache {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

// Declaração do tipo global
declare global {
  // eslint-disable-next-line no-var
  var mongoConnection: ConnectionCache;
}

// Inicializar o cache de conexão
global.mongoConnection = global.mongoConnection || {
  conn: null,
  promise: null
};

export async function connectToDB(): Promise<mongoose.Connection> {
  // Se já temos uma conexão, retorna-a
  if (global.mongoConnection.conn) {
    console.log('Usando conexão existente com MongoDB');
    return global.mongoConnection.conn;
  }

  // Se não há uma promessa de conexão em andamento, cria uma
  if (!global.mongoConnection.promise) {
    const uri = MONGODB_URI || (process.env.NODE_ENV !== 'production' 
      ? 'mongodb://localhost:27017/sas-platform' 
      : undefined);
    
    if (!uri) {
      throw new Error('Não foi possível estabelecer conexão com MongoDB: URI não definida');
    }
    
    console.log('Iniciando nova conexão com MongoDB...');
    global.mongoConnection.promise = mongoose
      .connect(uri)
      .then(mongoose => {
        console.log('✓ Conectado ao MongoDB');
        return mongoose.connection;
      });
  }

  try {
    // Aguarda a promessa de conexão resolver
    global.mongoConnection.conn = await global.mongoConnection.promise;
    return global.mongoConnection.conn;
  } catch (error) {
    // Em caso de erro, limpa a promessa para tentar novamente
    global.mongoConnection.promise = null;
    console.error('✗ Erro ao conectar ao MongoDB:', error);
    throw error;
  }
} 