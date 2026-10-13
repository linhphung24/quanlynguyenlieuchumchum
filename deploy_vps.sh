#!/usr/bin/env bash
# ============================================================
# SCRIPT TRIỂN KHAI CHUM CHUM BAKERY KHO LÊN VPS UBUNTU
# Domain: kho.chumchumbakery.com
# Port ứng dụng: 3005 (tránh xung đột với các app port 3000)
# ============================================================
set -e

echo "==> 1. Kiểm tra môi trường Node.js & PM2..."
if ! command -v node &> /dev/null; then
    echo "Đang cài đặt Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

if ! command -v pm2 &> /dev/null; then
    echo "Đang cài đặt PM2..."
    npm install -g pm2
fi

echo "==> 2. Giải nén code Quản lý kho mới vào /var/www/chumchum-web..."
mkdir -p /var/www/chumchum-web
rm -rf /var/www/chumchum-web/*
tar -xzf /tmp/chumchum_web_deploy.tar.gz -C /var/www/chumchum-web
chown -R root:root /var/www/chumchum-web

echo "==> 3. Khởi động Quản lý kho trên PM2 (Port 3005)..."
cd /var/www/chumchum-web
pm2 delete chumchum-warehouse-web 2>/dev/null || true
# Dừng bất kỳ tiến trình nào đang chiếm port 3005 nếu có
fuser -k 3005/tcp 2>/dev/null || true

if [ -f ecosystem.config.js ]; then
    pm2 start ecosystem.config.js
else
    PORT=3005 HOSTNAME=0.0.0.0 pm2 start server.js --name "chumchum-warehouse-web"
fi
pm2 save --force
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo "Đợi ứng dụng khởi động trên cổng 3005..."
sleep 3

# Kiểm tra ứng dụng nội bộ
if curl -s http://127.0.0.1:3005/ | grep -qi "Quản lý\|Chum"; then
    echo "✅ Ứng dụng Quản lý kho đã chạy thành công trên cổng 3005!"
else
    echo "⚠️ Đang kiểm tra log PM2..."
    pm2 logs chumchum-warehouse-web --lines 20 --nostream
fi

echo "==> 4. Cập nhật Nginx cho domain kho.chumchumbakery.com..."
# Vô hiệu hóa mọi file config cũ đang trỏ domain kho.chumchumbakery.com
for f in /etc/nginx/sites-enabled/*; do
    if [ -f "$f" ] && grep -q "kho.chumchumbakery.com" "$f" 2>/dev/null; then
        echo "Tạm gỡ cấu hình cũ tại: $f"
        rm -f "$f"
    fi
done

# Kiểm tra chứng chỉ SSL Let's Encrypt đã cấp cho domain
SSL_CERT="/etc/letsencrypt/live/kho.chumchumbakery.com/fullchain.pem"
SSL_KEY="/etc/letsencrypt/live/kho.chumchumbakery.com/privkey.pem"

if [ -f "$SSL_CERT" ] && [ -f "$SSL_KEY" ]; then
    echo "Tìm thấy chứng chỉ SSL hợp lệ tại /etc/letsencrypt/live/kho.chumchumbakery.com"
    cat << 'EOF' > /etc/nginx/sites-available/kho.chumchumbakery.com
server {
    listen 80;
    server_name kho.chumchumbakery.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name kho.chumchumbakery.com;

    ssl_certificate /etc/letsencrypt/live/kho.chumchumbakery.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kho.chumchumbakery.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
EOF
else
    echo "Chưa có chứng chỉ SSL có sẵn, cấu hình HTTP và chạy Certbot..."
    cat << 'EOF' > /etc/nginx/sites-available/kho.chumchumbakery.com
server {
    listen 80;
    server_name kho.chumchumbakery.com;

    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
    ln -sf /etc/nginx/sites-available/kho.chumchumbakery.com /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    if command -v certbot &> /dev/null; then
        certbot --nginx -d kho.chumchumbakery.com --non-interactive --agree-tos --redirect -m admin@chumchumbakery.com || true
    fi
fi

ln -sf /etc/nginx/sites-available/kho.chumchumbakery.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "==> 5. Kiểm tra kết quả truy cập qua Nginx..."
sleep 2
TEST_TITLE=$(curl -k -s https://kho.chumchumbakery.com/ | grep -o "<title>.*</title>" || true)
echo "Trang web hiện tại hiển thị: $TEST_TITLE"

echo "=========================================================="
echo "🎉 HOÀN TẤT TRIỂN KHAI BẢN MỚI!"
echo "Kiểm tra ngay tại: https://kho.chumchumbakery.com"
echo "=========================================================="
