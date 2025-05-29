import mongoose from 'mongoose';

// Certifique-se de que a variável de ambiente MONGODB_URI está definida
const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  console.error('ERRO CRÍTICO: A variável de ambiente MONGODB_URI não está definida!');
  console.error('Por favor, adicione MONGODB_URI ao seu arquivo .env');
  // Em ambiente de desenvolvimento, usar um fallback para MongoDB local
  if (process.env.NODE_ENV === 'development') {
    console.log('Usando conexão local de fallback para MongoDB em ambiente de desenvolvimento');
    // Usar MongoDB local como fallback
    process.env.MONGODB_URI = 'mongodb://localhost:27017/sas-platform';
  } else {
    throw new Error('A variável de ambiente MONGODB_URI não está definida no arquivo .env');
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
  try {
    // Se já temos uma conexão, retorna-a
    if (global.mongoConnection.conn) {
      console.log('Usando conexão existente com MongoDB');
      return global.mongoConnection.conn;
    }

    // Se não há uma promessa de conexão em andamento, cria uma
    if (!global.mongoConnection.promise) {
      console.log('Iniciando nova conexão com MongoDB...');
      const mongoURI = process.env.MONGODB_URI as string;
      console.log('URI do MongoDB:', mongoURI.substring(0, 20) + '...');
      
      // Configurações do mongoose para evitar avisos de depreciação
      mongoose.set('strictQuery', true);
      
      global.mongoConnection.promise = mongoose
        .connect(mongoURI, {
          // Opções de conexão para aumentar a confiabilidade
          serverSelectionTimeoutMS: 10000, // Timeout de 10 segundos
          socketTimeoutMS: 45000, // Timeout de 45 segundos
        })
        .then(mongoose => {
          console.log('✓ Conectado ao MongoDB com sucesso');
          return mongoose.connection;
        })
        .catch(error => {
          console.error('✗ Erro ao conectar ao MongoDB:', error);
          
          // Em ambiente de desenvolvimento, tentar conexão local como fallback
          if (process.env.NODE_ENV === 'development') {
            console.log('Tentando conexão local como fallback...');
            return mongoose
              .connect('mongodb://localhost:27017/sas-platform', {
                serverSelectionTimeoutMS: 5000,
              })
              .then(mongoose => {
                console.log('✓ Conectado ao MongoDB local com sucesso (fallback)');
                return mongoose.connection;
              });
          }
          throw error;
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
  } catch (error) {
    console.error('Erro crítico na conexão com MongoDB:', error);
    throw new Error(`Falha ao conectar ao MongoDB: ${error instanceof Error ? error.message : String(error)}`);
  }
} 