#!/bin/bash
# ============================================================
#  04 - BACKUP TU DONG CHUMCHUMDB TREN VPS UBUNTU
#  Chay hang ngay 01h00 qua cron (xem huong dan cai dat o duoi)
#
#  CAI DAT (chay 1 lan tu thu muc chua file nay tren VPS):
#    sudo mkdir -p /opt/mssql-backup
#    sudo cp 04_backup_vps.sh /opt/mssql-backup/backup.sh
#    sudo chmod 700 /opt/mssql-backup/backup.sh
#    sudo tee /etc/mssql-backup.conf >/dev/null <<'EOF'
#    BACKUP_PASSWORD=dat_mat_khau_chumchum_backup_vao_day
#    EOF
#    sudo chmod 600 /etc/mssql-backup.conf
#    echo '0 1 * * * root /opt/mssql-backup/backup.sh >> /var/log/mssql-backup.log 2>&1' | sudo tee /etc/cron.d/mssql-backup
#
#  File backup: /var/backups/mssql/ChumChumDB_yyyy-MM-dd_HHMM.bak (giu 14 ban)
#  Log: /var/log/mssql-backup.log
# ============================================================
set -euo pipefail

BACKUP_DIR=/var/backups/mssql
SQLCMD=/opt/mssql-tools18/bin/sqlcmd
CONF=/etc/mssql-backup.conf
KEEP_DAYS=14

# Doc mat khau login chumchum_backup tu file conf (chi root doc duoc)
if [ ! -f "$CONF" ]; then
    echo "[LOI] Khong tim thay $CONF - xem huong dan cai dat trong file nay."
    exit 1
fi
# shellcheck disable=SC1090
source "$CONF"
if [ -z "${BACKUP_PASSWORD:-}" ]; then
    echo "[LOI] $CONF thieu bien BACKUP_PASSWORD."
    exit 1
fi

mkdir -p "$BACKUP_DIR"
# SQL Server ghi file backup voi user mssql -> thu muc phai thuoc user nay
chown mssql:mssql "$BACKUP_DIR" 2>/dev/null || true
STAMP=$(date +%F_%H%M)
FILE="$BACKUP_DIR/ChumChumDB_${STAMP}.bak"

echo "[$(date '+%F %T')] Bat dau backup: $FILE"

# -C = tin certificate tu ky cua SQL Server (ODBC Driver 18 yeu cau)
"$SQLCMD" -S localhost -U chumchum_backup -P "$BACKUP_PASSWORD" -C -d master \
    -Q "SET NOCOUNT ON; BACKUP DATABASE [ChumChumDB] TO DISK = N'$FILE' WITH INIT, CHECKSUM, STATS = 10; RESTORE VERIFYONLY FROM DISK = N'$FILE' WITH CHECKSUM;" \
    && echo "[$(date '+%F %T')] BACKUP + VERIFY OK: $FILE" \
    || { echo "[LOI] Backup that bai: $FILE"; exit 1; }

# Xoa ban backup cu hon KEEP_DAYS ngay
find "$BACKUP_DIR" -name 'ChumChumDB_*.bak' -mtime +$((KEEP_DAYS)) -print -delete
