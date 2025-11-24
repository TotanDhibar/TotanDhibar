# 🚀 Quick Start Guide - UCC Engineering CMS

Get your UCC Engineering website running in 3 minutes!

## Prerequisites
- Node.js v14 or higher installed
- npm (comes with Node.js)

## Installation Steps

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/TotanDhibar/TotanDhibar.git
cd TotanDhibar
```

### 2️⃣ Install Dependencies
```bash
npm install
```
*This installs Express, SQLite, bcryptjs, Multer, and other dependencies*

### 3️⃣ Initialize Database
```bash
npm run init-db
```
*This creates the database with pre-filled UCC Engineering data*

You'll see:
```
✓ Tables created successfully
✓ Default admin user created (username: admin, password: admin123)
✓ Default services created (AMC, Boiler, ESP, APH, etc.)
✓ Default clients created (WBPDCL, NTPC, NSPCL, DPL, DSTPS)
✓ Database initialization complete!
```

### 4️⃣ Start the Server
```bash
npm start
```

You'll see:
```
Server running on http://localhost:3000
Admin panel: http://localhost:3000/admin
```

## �� Access Your Website

### Public Website
Open your browser and visit: **http://localhost:3000**

You'll see:
- Homepage with services and clients
- Navigation menu
- Contact form
- All UCC Engineering content

### Admin Panel
Visit: **http://localhost:3000/admin**

**Login with:**
- Username: `admin`
- Password: `admin123`

⚠️ **IMPORTANT:** Change the password immediately after first login!

## 🎯 What Can You Do?

### As a Visitor (Public Site)
✅ Browse company information
✅ View all services
✅ See client portfolio
✅ Download certificates
✅ Submit contact form

### As Admin (CMS Panel)
✅ Edit homepage and about page content
✅ Add/Edit/Delete services
✅ Add/Edit/Delete clients (with logo upload)
✅ Add/Edit/Delete projects (with images)
✅ Upload PDF certificates
✅ Manage downloadable documents
✅ Update company contact information
✅ View contact form submissions
✅ Change admin password

## 📝 Quick Tasks After Setup

### 1. Change Admin Password
1. Login to admin panel
2. Click "🔑 Change Password" in sidebar
3. Enter current password: `admin123`
4. Set your new secure password

### 2. Update Contact Information
1. Go to "📞 Contact Info" in admin
2. Update phone number, email, address
3. Click "Save Changes"

### 3. Add Your First Project
1. Go to "📁 Projects"
2. Click "Add New Project"
3. Fill in details and upload image
4. Select client from dropdown
5. Save!

### 4. Upload a Certificate
1. Go to "📜 Certificates"
2. Fill in title and description
3. Choose PDF file
4. Click "Upload Certificate"

## 🛠️ Useful Commands

```bash
# Start server (production)
npm start

# Start with auto-restart (development)
npm run dev

# Reinitialize database (WARNING: deletes all data)
npm run init-db

# View help
npm help
```

## 📂 Important Directories

```
TotanDhibar/
├── public/uploads/images/       # Uploaded images (client logos, projects)
├── public/uploads/certificates/ # Uploaded PDFs
├── database.db                  # SQLite database (created after init)
├── views/public/                # Public website templates
└── views/admin/                 # Admin panel templates
```

## 🔍 Troubleshooting

### "Port 3000 already in use"
Change port in `server.js` or kill the process:
```bash
# On Linux/Mac
lsof -ti:3000 | xargs kill -9

# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### "Cannot find module 'express'"
Run `npm install` again:
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Database is locked"
Restart the server:
```bash
# If using npm start
Ctrl+C (to stop)
npm start (to restart)
```

### Forgot admin password?
Reinitialize database (WARNING: loses all data):
```bash
npm run init-db
```

## 🌍 Next Steps

### For Local Development
✅ You're all set! Make changes and test locally.

### For Production Deployment
📖 Read **DEPLOYMENT.md** for detailed deployment instructions covering:
- VPS/Dedicated Server (Nginx + PM2)
- Heroku
- Railway.app
- Render.com
- DigitalOcean App Platform

## 📞 Need Help?

- **Documentation:** README.md (complete guide)
- **Features:** FEATURES.md (feature overview)
- **Deployment:** DEPLOYMENT.md (production deployment)
- **Summary:** PROJECT_SUMMARY.md (project overview)

## 🎉 You're Ready!

Your UCC Engineering CMS is now running! Start customizing content through the admin panel.

**Admin URL:** http://localhost:3000/admin
**Public Site:** http://localhost:3000

Happy editing! 🚀
