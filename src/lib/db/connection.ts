import mongoose from 'mongoose';

// Certifique-se de que a variável de ambiente MONGODB_URI está definida
const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  console.error('⚠️ A variável de ambiente MONGODB_URI não está definida');
  throw new Error('A variável de ambiente MONGODB_URI é obrigatória');
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
    // Sempre usar a URI do MongoDB Atlas, nunca fallback para localhost
    if (!MONGODB_URI) {
      throw new Error('Falha ao conectar ao MongoDB: URI não definida');
    }
    
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
  } catch (error: any) {
    // Em caso de erro, limpa a promessa para tentar novamente
    global.mongoConnection.promise = null;
    console.error('✗ Erro ao conectar ao MongoDB:', error);
    throw new Error(`Falha ao conectar ao MongoDB: ${error.message}`);
  }
} 