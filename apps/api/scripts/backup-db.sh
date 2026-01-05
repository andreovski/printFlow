#!/bin/bash
# Script de backup do banco de dados PostgreSQL

# Configurações
BACKUP_DIR="$HOME/backups/magic-system"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="magic_system"
DB_USER="postgres"
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# Fazer backup
echo "🔄 Criando backup do banco de dados..."
PGPASSWORD=postgres pg_dump -h localhost -U "$DB_USER" -d "$DB_NAME" -F p -f "$BACKUP_FILE"

# Comprimir
gzip "$BACKUP_FILE"

echo "✅ Backup criado: ${BACKUP_FILE}.gz"

# Manter apenas últimos 7 backups
find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +7 -delete

echo "🧹 Backups antigos removidos (mantendo últimos 7 dias)"
