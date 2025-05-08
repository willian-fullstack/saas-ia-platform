// Script para corrigir assinaturas pendentes e créditos
const { connect, connection } = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// URL do MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

// Conexão com o MongoDB
async function connectDB() {
  try {
    await connect(MONGODB_URI);
    console.log('Conectado ao MongoDB');
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
}

// Função principal
async function main() {
  try {
    await connectDB();
    
    // Importar modelos após a conexão
    const Subscription = connection.model('Subscription');
    const User = connection.model('User');
    const Plan = connection.model('Plan');
    const CreditHistory = connection.model('CreditHistory');
    
    // Buscar assinaturas pendentes
    const pendingSubscriptions = await Subscription.find({ status: 'pending' });
    
    console.log(`Encontradas ${pendingSubscriptions.length} assinaturas pendentes`);
    
    for (const subscription of pendingSubscriptions) {
      console.log(`\nProcessando assinatura: ${subscription._id}`);
      
      // Buscar usuário e plano
      const user = await User.findById(subscription.userId);
      const plan = await Plan.findById(subscription.planId);
      
      if (!user || !plan) {
        console.log(`Usuário ou plano não encontrado para assinatura ${subscription._id}`);
        continue;
      }
      
      console.log(`Usuário: ${user.name} (${user.email})`);
      console.log(`Plano: ${plan.name} (${plan.credits} créditos)`);
      console.log(`Status atual da assinatura: ${subscription.status}`);
      
      // Perguntar se deseja atualizar esta assinatura
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const resposta = await new Promise(resolve => {
        readline.question(`Deseja ativar esta assinatura e adicionar ${plan.credits} créditos ao usuário? (S/N) `, answer => {
          readline.close();
          resolve(answer.toLowerCase());
        });
      });
      
      if (resposta === 's' || resposta === 'sim') {
        // Atualizar status da assinatura
        subscription.status = 'active';
        subscription.startDate = new Date();
        subscription.renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 dias
        subscription.mercadoPagoId = `manual-fix-${Date.now()}`;
        
        await subscription.save();
        console.log('Assinatura atualizada para status "active"');
        
        // Atualizar referência de assinatura no usuário
        user.subscriptionId = subscription._id;
        
        // Adicionar créditos ao usuário
        user.credits += plan.credits;
        await user.save();
        console.log(`Adicionados ${plan.credits} créditos ao usuário. Total atual: ${user.credits}`);
        
        // Registrar adição de créditos no histórico
        await new CreditHistory({
          userId: user._id,
          amount: plan.credits,
          type: 'addition',
          description: `Créditos do plano ${plan.name} (correção manual)`,
          date: new Date()
        }).save();
        console.log('Histórico de créditos atualizado');
      } else {
        console.log('Assinatura não alterada');
      }
      
      console.log('----------------------------');
    }
    
    console.log('\nProcessamento concluído!');
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    // Fechar conexão
    await connection.close();
    console.log('Conexão fechada');
  }
}

// Executar o script
main(); 