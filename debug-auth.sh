#!/bin/bash

# Script para diagnosticar problemas de autenticação

echo "=== Diagnóstico de Autenticação ==="
echo "Data e hora: $(date)"
echo ""

# Verificar configuração do ambiente
echo "=== Verificando variáveis de ambiente ==="
echo "NEXTAUTH_URL: $(grep NEXTAUTH_URL .env || echo 'Não encontrado')"
echo "NEXT_PUBLIC_BASE_URL: $(grep NEXT_PUBLIC_BASE_URL .env || echo 'Não encontrado')"
echo "NEXTAUTH_SECRET está definido: $(if grep -q NEXTAUTH_SECRET .env; then echo 'Sim'; else echo 'Não'; fi)"
echo "MONGODB_URI está definido: $(if grep -q MONGODB_URI .env; then echo 'Sim'; else echo 'Não'; fi)"
echo ""

# Verificar conexão com MongoDB
echo "=== Verificando conexão com MongoDB ==="
echo "Testando conexão com MongoDB..."
mongo_uri=$(grep MONGODB_URI .env | cut -d '=' -f2)
if [ -z "$mongo_uri" ]; then
  echo "ERRO: URI do MongoDB não encontrada no arquivo .env"
else
  # Extrair host e porta do URI do MongoDB
  mongo_host=$(echo $mongo_uri | sed -n 's/.*@\(.*\)\/.*/\1/p')
  echo "Tentando conectar a: $mongo_host"
  
  # Testar conectividade
  if ping -c 1 $mongo_host &> /dev/null; then
    echo "✓ Conectividade com MongoDB OK"
  else
    echo "✗ Não foi possível conectar ao MongoDB. Verifique a conexão de rede."
  fi
fi
echo ""

# Verificar configuração do Nginx
echo "=== Verificando configuração do Nginx ==="
if [ -f "/etc/nginx/sites-available/default" ]; then
  echo "Configuração do Nginx:"
  grep -A 20 "location / {" /etc/nginx/sites-available/default
  
  echo ""
  echo "Verificando se o Nginx está rodando:"
  if systemctl is-active --quiet nginx; then
    echo "✓ Nginx está rodando"
  else
    echo "✗ Nginx não está rodando"
  fi
else
  echo "Arquivo de configuração do Nginx não encontrado"
fi
echo ""

# Verificar logs recentes
echo "=== Logs recentes relacionados à autenticação ==="
echo "Últimos logs de autenticação:"
grep -i "\[AUTH\]" ~/.pm2/logs/sas-ia-platform-out.log | tail -n 20
echo ""

echo "Últimos logs de hooks de autenticação:"
grep -i "\[AUTH-HOOK\]" ~/.pm2/logs/sas-ia-platform-out.log | tail -n 20
echo ""

echo "Últimos logs de login:"
grep -i "\[LOGIN\]" ~/.pm2/logs/sas-ia-platform-out.log | tail -n 20
echo ""

# Verificar cookies
echo "=== Verificando configuração de cookies ==="
grep -A 15 "cookies:" src/app/api/auth/[...nextauth]/route.ts
echo ""

# Verificar erros recentes
echo "=== Erros recentes ==="
grep -i "error\|erro\|exception\|falha" ~/.pm2/logs/sas-ia-platform-out.log ~/.pm2/logs/sas-ia-platform-error.log | tail -n 20
echo ""

# Verificar status da aplicação
echo "=== Status da aplicação ==="
pm2 status
echo ""

echo "=== Recomendações ==="
echo "1. Limpe os cookies do navegador"
echo "2. Verifique se o MongoDB está acessível"
echo "3. Verifique se o Nginx está configurado corretamente"
echo "4. Reinicie a aplicação com: pm2 restart sas-ia-platform"
echo "5. Verifique os logs em tempo real com: pm2 logs"
echo ""

echo "Diagnóstico concluído em $(date)" 