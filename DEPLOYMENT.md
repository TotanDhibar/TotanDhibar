# Deployment Guide - UCC Engineering CMS

This guide covers various deployment options for the UCC Engineering CMS website.

## Quick Start (Local Development)

```bash
git clone https://github.com/TotanDhibar/TotanDhibar.git
cd TotanDhibar
npm install
npm run init-db
npm start
```

Visit: http://localhost:3000
Admin: http://localhost:3000/admin (admin / admin123)

## Production Deployment Options

### Option 1: VPS / Dedicated Server (Recommended for Full Control)

**Requirements:**
- Ubuntu/Debian server with SSH access
- Node.js 14+ installed
- PM2 for process management

**Steps:**

1. **SSH into your server**
```bash
ssh user@your-server-ip
```

2. **Install Node.js (if not installed)**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Install PM2 globally**
```bash
sudo npm install -g pm2
```

4. **Clone and setup the project**
```bash
cd /var/www
git clone https://github.com/TotanDhibar/TotanDhibar.git ucc-engineering
cd ucc-engineering
npm install
npm run init-db
```

5. **Start with PM2**
```bash
pm2 start server.js --name ucc-website
pm2 save
pm2 startup
```

6. **Configure Nginx as reverse proxy**
```bash
sudo nano /etc/nginx/sites-available/ucc-engineering
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/ucc-engineering /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

7. **SSL with Let's Encrypt (Optional but Recommended)**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Option 2: Heroku

1. **Create Heroku account and install CLI**
```bash
curl https://cli-assets.heroku.com/install.sh | sh
heroku login
```

2. **Create Procfile in project root**
```
web: node server.js
```

3. **Deploy**
```bash
git init
heroku create ucc-engineering
git add .
git commit -m "Initial commit"
git push heroku main
heroku run npm run init-db
heroku open
```

### Option 3: Railway.app

1. Visit https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select TotanDhibar/TotanDhibar
5. Add these settings:
   - Build Command: `npm install && npm run init-db`
   - Start Command: `npm start`
   - PORT: 3000
6. Deploy!

### Option 4: Render.com

1. Visit https://render.com
2. Create New → Web Service
3. Connect GitHub repository
4. Configure:
   - Name: ucc-engineering
   - Environment: Node
   - Build Command: `npm install && npm run init-db`
   - Start Command: `npm start`
5. Deploy

### Option 5: DigitalOcean App Platform

1. Visit DigitalOcean and go to App Platform
2. Create App → Select GitHub repository
3. Configure:
   - Type: Web Service
   - Build Command: `npm install && npm run init-db`
   - Run Command: `npm start`
4. Deploy

## Environment Variables

For production deployment, set these environment variables:

```bash
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-super-secret-random-string-here
```

**Generate secure session secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Database Backup

**Automated backup script** (save as `backup.sh`):
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp database.db backups/database_$DATE.db
find backups/ -name "database_*.db" -mtime +30 -delete
```

Make executable and add to cron:
```bash
chmod +x backup.sh
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

## Performance Optimization

### 1. Enable Gzip Compression
Add to server.js before routes:
```javascript
const compression = require('compression');
app.use(compression());
```

Install: `npm install compression`

### 2. Use MySQL/PostgreSQL for Production
For better performance with many concurrent users, consider upgrading from SQLite:

**Install MySQL driver:**
```bash
npm install mysql2
```

Update `server/database.js` to use MySQL connection.

### 3. Cache Static Assets
Add to Nginx config:
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Monitoring

**View PM2 logs:**
```bash
pm2 logs ucc-website
pm2 monit
```

**Setup PM2 monitoring (Optional):**
```bash
pm2 install pm2-logrotate
```

## Troubleshooting

**Port already in use:**
```bash
# Kill process on port 3000
sudo lsof -ti:3000 | xargs kill -9
```

**Database locked error:**
```bash
# Restart the server
pm2 restart ucc-website
```

**Upload directory permissions:**
```bash
chmod -R 755 public/uploads
chown -R www-data:www-data public/uploads
```

## Security Checklist

- [ ] Change default admin password
- [ ] Set strong SESSION_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Set NODE_ENV=production
- [ ] Configure firewall (allow only 80, 443, 22)
- [ ] Regular database backups
- [ ] Keep dependencies updated (`npm audit`)
- [ ] Restrict file upload sizes
- [ ] Use strong database passwords (if using MySQL/PostgreSQL)

## Updating Production

```bash
cd /var/www/ucc-engineering
git pull origin main
npm install
pm2 restart ucc-website
```

## Support

For deployment issues:
- Check server logs: `pm2 logs`
- Verify Node.js version: `node -v`
- Test database: `sqlite3 database.db ".tables"`
- Check port availability: `netstat -tlnp | grep 3000`

---

**Need help?** Open an issue on GitHub or contact UCC Engineering support.
