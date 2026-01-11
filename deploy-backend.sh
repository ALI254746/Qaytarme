#!/bin/bash

# Ranglar
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}=== QaytarMe Backend Deployment Script ===${NC}"

# 1. Tizimni yangilash
echo -e "${GREEN}1. Tizim yangilanmoqda...${NC}"
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx certbot python3-certbot-nginx build-essential

# 2. Node.js o'rnatish (v20)
echo -e "${GREEN}2. Node.js 20 o'rnatilmoqda...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. PM2 o'rnatish
echo -e "${GREEN}3. PM2 o'rnatilmoqda...${NC}"
sudo npm install -g pm2

# 4. Loyihani yuklash (GitHub)
# Eslatma: Bu yerda o'z repozitoriyingizni qo'ying. Agar private bo'lsa, Token so'raladi.
REPO_URL="https://github.com/ALI254746/Qaytarme.git"
PROJECT_DIR="/var/www/qaytarme"

if [ -d "$PROJECT_DIR" ]; then
    echo -e "${GREEN}Loyiha papkasi mavjud, yangilanmoqda...${NC}"
    cd $PROJECT_DIR
    git pull
else
    echo -e "${GREEN}Loyiha klonlanmoqda...${NC}"
    sudo mkdir -p $PROJECT_DIR
    sudo chown -R $USER:$USER /var/www
    git clone $REPO_URL $PROJECT_DIR
    cd $PROJECT_DIR
fi

# 5. Backendni o'rnatish
echo -e "${GREEN}5. Backend dependencies o'rnatilmoqda...${NC}"
cd backend
npm ci
npm run build

# 6. .env faylini sozlash
if [ ! -f .env ]; then
    echo -e "${GREEN}.env fayli yaratilmoqda. Iltimos kerakli o'zgaruvchilarni kiriting:${NC}"
    cp .env.example .env 2>/dev/null || touch .env
    # Bu yerda oddiygina nano orqali ochamiz, user o'zi to'ldiradi
    echo "Hozir .env fayli ochiladi. O'zgaruvchilaringizni (MONGO_URI, BOT_TOKEN va h.k) joylang va Ctrl+X, Y, Enter bosing."
    read -p "Davom etish uchun Enter bosing..."
    nano .env
fi

# 7. PM2 bilan ishga tushirish
echo -e "${GREEN}7. Server ishga tushirilmoqda...${NC}"
pm2 delete qaytarme-backend 2>/dev/null || true
pm2 start dist/main.js --name "qaytarme-backend"
pm2 save
pm2 startup | tail -n 1 | bash 2>/dev/null || true

# 8. Nginx sozlash (Reverse Proxy)
echo -e "${GREEN}8. Nginx sozlanmoqda...${NC}"
DOMAIN="api.qaytarme.uz" # O'zingizning API domeningiz bilan almashtiring
NGINX_CONF="/etc/nginx/sites-available/qaytarme"

sudo bash -c "cat > $NGINX_CONF" <<EOF
server {
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -s $NGINX_CONF /etc/nginx/sites-enabled/ 2>/dev/null
sudo rm /etc/nginx/sites-enabled/default 2>/dev/null
sudo nginx -t && sudo systemctl restart nginx

# 9. SSL Sertifikat (HTTPS)
echo -e "${GREEN}9. SSL (HTTPS) yoqilmoqda...${NC}"
echo "Iltimos, email manzilingizni va rozilikni tasdiqlang."
sudo certbot --nginx -d $DOMAIN

echo -e "${GREEN}=== Muvaffaqiyatli yakunlandi! ===${NC}"
echo "Serveringiz manzil: https://$DOMAIN"
