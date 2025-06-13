#!/bin/bash

# Script para corrigir problemas comuns de sessão e autenticação

echo "=== Iniciando correção de problemas de autenticação ==="
echo "Data e hora: $(date)"
echo ""

# Backup dos arquivos de configuração
echo "=== Criando backups dos arquivos de configuração ==="
mkdir -p backups
cp .env backups/.env.bak
cp src/app/api/auth/[...nextauth]/route.ts backups/route.ts.bak
cp nginx-config.conf backups/nginx-config.conf.bak
echo "✓ Backups criados em ./backups/"
echo ""

# Corrigir configuração do .env
echo "=== Corrigindo configuração do .env ==="
# Remover porta 3000 das URLs se o Nginx estiver configurado
sed -i 's|http://31.97.64.164:3000|http://31.97.64.164|g' .env
sed -i 's|http://31.97.64.164:3000|http://31.97.64.164|g' .env.local

# Garantir que o NEXTAUTH_SECRET esteja definido
if ! grep -q "NEXTAUTH_SECRET" .env; then
  echo "NEXTAUTH_SECRET=2jnyu4jspJ1vnQZ8shb9qHtIKAg_7GBWTzReysTXTKt4rkzed" >> .env
fi
echo "✓ Configuração do .env atualizada"
echo ""

# Corrigir configuração do Nginx
echo "=== Atualizando configuração do Nginx ==="
cat > nginx-config.conf << 'EOL'
server {
    listen 80;
    server_name 31.97.64.164;

    # Logs
    access_log /var/log/nginx/saas-ia-platform-access.log;
    error_log /var/log/nginx/saas-ia-platform-error.log;

    # Configurações de proxy para o Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Aumentar timeout para evitar problemas com operações longas
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
}
EOL
echo "✓ Configuração do Nginx atualizada"
echo ""

# Instruções para aplicar as alterações no servidor
echo "=== Instruções para aplicar as alterações no servidor ==="
echo "Execute os seguintes comandos no servidor:"
echo ""
echo "1. Copie a configuração do Nginx:"
echo "   sudo cp nginx-config.conf /etc/nginx/sites-available/default"
echo ""
echo "2. Teste a configuração do Nginx:"
echo "   sudo nginx -t"
echo ""
echo "3. Reinicie o Nginx:"
echo "   sudo systemctl restart nginx"
echo ""
echo "4. Limpe o cache do PM2 e reinicie a aplicação:"
echo "   pm2 flush"
echo "   pm2 delete all"
echo "   pm2 start pm2-config.json"
echo ""
echo "5. Limpe os cookies do navegador e tente fazer login novamente"
echo ""

echo "=== Correções adicionais que podem ser necessárias ==="
echo "1. Verifique se o MongoDB está acessível:"
echo "   mongo mongodb+srv://cwsgkfvf:8z2d1R5tIK3l46PI@pontopix.wljeeai.mongodb.net/test"
echo ""
echo "2. Se o problema persistir, tente modificar o arquivo .env para usar HTTPS:"
echo "   NEXTAUTH_URL=https://31.97.64.164"
echo "   NEXT_PUBLIC_BASE_URL=https://31.97.64.164"
echo ""
echo "3. Verifique os logs em tempo real para identificar problemas:"
echo "   pm2 logs"
echo ""

echo "Script concluído em $(date)" 