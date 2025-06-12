#!/bin/bash

# Script de deploy para SaaS IA Platform
# Autor: Willian
# Data: 2024-06-11

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Função para exibir mensagens
log() {
  echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
  echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERRO: $1${NC}"
}

warning() {
  echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] AVISO: $1${NC}"
}

# Diretório base do projeto
BASE_DIR="/var/www/saas-ia-platform"

# Verificar se está rodando como root
if [ "$(id -u)" != "0" ]; then
   error "Este script deve ser executado como root" 
   exit 1
fi

# Iniciar deploy
log "Iniciando deploy do SaaS IA Platform"

# Navegando para o diretório do projeto
log "Navegando para o diretório do projeto"
cd $BASE_DIR || { error "Falha ao acessar o diretório $BASE_DIR"; exit 1; }

# Atualizar código do repositório
log "Atualizando código do repositório"
git pull || { warning "Falha ao atualizar código. Continuando com o código atual."; }

# Verificar arquivo .env.local
log "Verificando arquivo .env.local"
if [ ! -f .env.local ]; then
  warning "Arquivo .env.local não encontrado. Criando a partir do .env.example"
  cp .env.example .env.local
  warning "Lembre-se de editar o arquivo .env.local com suas configurações!"
fi

# Instalar dependências
log "Instalando dependências"
npm ci || { error "Falha ao instalar dependências"; exit 1; }

# Construir a aplicação
log "Construindo a aplicação"
npm run build || { error "Falha ao construir a aplicação"; exit 1; }

# Configurar PM2
log "Configurando PM2"
if ! command -v pm2 &> /dev/null; then
  log "Instalando PM2 globalmente"
  npm install -g pm2
fi

# Reiniciar a aplicação com PM2
log "Reiniciando a aplicação com PM2"
pm2 restart pm2-config.json || pm2 start pm2-config.json

# Configurar PM2 para iniciar com o sistema
log "Configurando PM2 para iniciar com o sistema"
pm2 save
pm2 startup

# Configurar Nginx
log "Configurando Nginx"
if [ -f nginx-config.conf ]; then
  cp nginx-config.conf /etc/nginx/sites-available/saas-ia-platform
  ln -sf /etc/nginx/sites-available/saas-ia-platform /etc/nginx/sites-enabled/
  
  # Remover configuração padrão se existir
  if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
  fi
  
  # Testar e reiniciar Nginx
  nginx -t && systemctl restart nginx
  
  log "Nginx configurado e reiniciado"
else
  warning "Arquivo nginx-config.conf não encontrado. Nginx não foi configurado."
fi

log "Deploy concluído com sucesso!"
log "A aplicação está disponível em: http://31.97.64.164"
log "Para verificar os logs: pm2 logs sas-ia-platform" 