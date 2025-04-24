import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sas-ia-platform';

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
    console.log('Iniciando nova conexão com MongoDB...');
    global.mongoConnection.promise = mongoose
      .connect(MONGODB_URI)
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