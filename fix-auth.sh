#!/bin/bash

# Script para corrigir problemas de autenticação no servidor

echo "Iniciando correções de autenticação..."

# Atualizar configuração do Nginx
echo "Atualizando configuração do Nginx..."
sudo cp nginx-config.conf /etc/nginx/sites-available/default
sudo nginx -t
if [ $? -eq 0 ]; then
    echo "Configuração do Nginx válida."
    sudo systemctl restart nginx
    echo "Nginx reiniciado."
else
    echo "ERRO: Configuração do Nginx inválida. Verifique o arquivo nginx-config.conf."
    exit 1
fi

# Limpar cache do PM2
echo "Limpando cache do PM2..."
pm2 flush
pm2 delete all

# Reiniciar a aplicação
echo "Reiniciando a aplicação..."
pm2 start pm2-config.json

# Verificar status
echo "Verificando status da aplicação..."
pm2 status

echo "Processo de correção concluído. Verifique os logs para confirmar o funcionamento."
echo "Para verificar os logs, execute: pm2 logs"

# Instruções adicionais
echo ""
echo "IMPORTANTE: Se o problema persistir, tente as seguintes ações:"
echo "1. Limpe os cookies do seu navegador"
echo "2. Verifique se o MongoDB está acessível"
echo "3. Verifique os logs com: pm2 logs"
echo "" 