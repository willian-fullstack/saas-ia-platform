#!/bin/bash

# Script para verificar erros de autenticação nos logs

echo "Verificando erros de autenticação nos logs..."

echo "=== Logs de autenticação ==="
pm2 logs --lines 100 | grep -i "autenticação\|auth\|login\|senha\|password\|session\|cookie\|jwt\|token"

echo ""
echo "=== Erros recentes ==="
pm2 logs --lines 50 --err

echo ""
echo "=== Status da aplicação ==="
pm2 status

echo ""
echo "=== Status da conexão MongoDB ==="
grep -i "mongodb\|conectado" ~/.pm2/logs/sas-ia-platform-out.log | tail -n 10

echo ""
echo "Para verificar mais logs, execute: pm2 logs"
echo "" 