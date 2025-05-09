import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Inicializar configurações do dotenv
dotenv.config();

async function removeIndexes() {
  try {
    // Conectar ao MongoDB
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado com sucesso!');
    
    // Acessar a coleção diretamente
    const collections = await mongoose.connection.db.collections();
    const usersCollection = collections.find(c => c.collectionName === 'users');
    
    if (!usersCollection) {
      console.log('Coleção "users" não encontrada!');
      return;
    }
    
    // Listar os índices existentes
    console.log('Índices existentes:');
    const indexes = await usersCollection.indexes();
    console.log(indexes);
    
    // Procurar por índices que incluem o campo cpf
    const cpfIndexes = indexes.filter(idx => idx.key && idx.key.cpf);
    
    if (cpfIndexes.length > 0) {
      console.log('Encontrados os seguintes índices relacionados ao CPF:');
      console.log(cpfIndexes);
      
      for (const idx of cpfIndexes) {
        console.log(`Removendo índice com nome ${idx.name ? idx.name : 'sem nome'}...`);
        try {
          if (idx.name) {
            await usersCollection.dropIndex(idx.name);
          } else {
            // Se não tiver nome explícito, tenta remover pelo padrão "cpf_1"
            await usersCollection.dropIndex("cpf_1");
          }
          console.log(`Índice removido com sucesso!`);
        } catch (dropError) {
          console.error(`Erro ao remover índice:`, dropError);
          // Tenta uma abordagem alternativa
          console.log('Tentando abordagem alternativa...');
          try {
            await usersCollection.dropIndex({ "cpf": 1 });
            console.log('Índice removido com sucesso usando abordagem alternativa!');
          } catch (altError) {
            console.error('Também falhou com abordagem alternativa:', altError);
          }
        }
      }
    } else {
      console.log('Nenhum índice relacionado ao CPF encontrado.');
    }
    
    // Verificar se o índice foi removido
    console.log('Índices após tentativa de remoção:');
    const updatedIndexes = await usersCollection.indexes();
    console.log(updatedIndexes);
    
    console.log('Processo concluído!');
  } catch (error) {
    console.error('Erro ao remover índices:', error);
  } finally {
    // Fechar a conexão
    await mongoose.connection.close();
    console.log('Conexão fechada.');
  }
}

removeIndexes(); 