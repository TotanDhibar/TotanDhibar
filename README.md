# UCC Engineering Contractors - CMS Website

A complete, full-stack Content Management System (CMS) website for UCC Engineering Contractors, specializing in power plant maintenance and engineering services.

## 🏭 About UCC Engineering Contractors

UCC Engineering Contractors is a professional engineering company based in Asansol, West Bengal, providing expert services in:
- AMC (Annual Maintenance Contract)
- Boiler Maintenance
- ESP (Electrostatic Precipitator)
- APH (Air Preheater)
- AHP (Auxiliary Heating Plant)
- Hoist Operations
- Shutdown Services
- Overhauling

**Trusted by major clients:** WBPDCL, NTPC, NSPCL, DPL, DSTPS

## 🚀 Technology Stack

- **Backend:** Node.js with Express.js
- **Database:** SQLite (easily upgradeable to MySQL)
- **Template Engine:** EJS (Embedded JavaScript)
- **Authentication:** bcryptjs with session management
- **File Upload:** Multer with Sharp image processing
- **Image Processing:** Sharp for auto-resize and optimization
- **Security:** CSRF protection, password hashing, input validation
- **CSS:** Custom responsive CSS with animations and modern styling

## ✨ Features

### Public Website
- **Home Page** - Dynamic hero section, animated text, statistics counter
- **About Us** - Company information with team members section
- **Services** - Comprehensive services list with individual detail pages (`/services/:slug`)
- **Clients** - Client showcase with individual detail pages (`/clients/:slug`)
- **Projects Gallery** - Image gallery with category filtering and lightbox preview
- **Certificates & Downloads** - PDF certificates and downloadable documents
- **Contact Form** - Functional contact form with Google Maps embed support
- **Responsive Design** - Mobile-friendly with modern animations

### Admin Panel (CMS) - **✨ NEWLY MODERNIZED!**
- **🌓 Dark Mode** - Toggle between light and dark themes with persistent settings
- **📊 Modern Dashboard** - Animated statistics, interactive charts, activity timeline
- **🔐 Secure Login** - Password-protected with forgot password feature
- **🏠 Home Page Config** - Customize hero, animated text, and statistics
- **📄 Page Management** - Edit home and about page content with **rich text editor**
- **🔧 Services Management** - Add/Edit/Delete services with images and detailed descriptions
- **👥 Clients Management** - Manage clients with logos, websites, and detailed info
- **📁 Projects Management** - Add projects with categories for gallery filtering
- **👨‍💼 Team Management** - Add/Edit/Delete team members with photos
- **🏭 Equipment Manager** - **NEW!** Track inventory, status, and locations
- **📅 Maintenance Scheduler** - **NEW!** Schedule and manage maintenance tasks
- **📜 Certificates Upload** - Upload and manage PDF certificates
- **📥 Downloads Manager** - Manage downloadable documents
- **🏢 Company Info** - Update contact info, GST number, Google Maps embed
- **✉️ Submissions Viewer** - View and manage contact form submissions with **advanced tables**
- **📊 DataTables Integration** - **NEW!** Sort, search, export to CSV/Excel/PDF
- **🔔 Notifications System** - **NEW!** Real-time notifications and alerts
- **⚙️ Settings** - Admin settings with session activity log
- **🔑 Password Change** - Secure password update functionality

### 🎨 Modern UI Features
- **Gradient Design** - Beautiful gradient colors throughout
- **Animated Counters** - Statistics animate on page load
- **Interactive Charts** - Chart.js visualization (doughnut charts)
- **Progress Bars** - System status with animated progress indicators
- **Toast Notifications** - Auto-dismissing success/error messages
- **Smooth Transitions** - 300ms animations on all interactions
- **Hover Effects** - Cards lift and shadow on hover
- **Loading States** - Spinner animations on form submissions
- **Export Functions** - Export tables to CSV, Excel, PDF, or Print
- **Rich Text Editor** - TinyMCE for content editing
- **Responsive Tables** - Mobile-friendly with pagination

### Dynamic URL Structure
```
/                   → Homepage with hero, stats, and previews
/about              → About us with team members
/services           → All services list
/services/:slug     → Individual service detail page
/clients            → All clients list
/clients/:slug      → Individual client detail page
/projects           → Project gallery with category filter
/certificates       → Certificates and downloads
/contact            → Contact form with Google Maps

Admin Panel:
/admin/login        → Admin login
/admin/dashboard    → Dashboard overview
/admin/home-config  → Home page configuration
/admin/pages        → Page content editor
/admin/services     → Services manager
/admin/clients      → Clients manager
/admin/projects     → Projects manager
/admin/team         → Team members manager
/admin/equipment    → Equipment & inventory manager (NEW!)
/admin/maintenance  → Maintenance scheduler (NEW!)
/admin/certificates → Certificates manager
/admin/downloads    → Downloads manager
/admin/contact-info → Company information
/admin/submissions  → Contact form submissions
/admin/settings     → Admin settings
```

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Step 1: Clone the Repository
```bash
git clone https://github.com/TotanDhibar/TotanDhibar.git
cd TotanDhibar
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Initialize Database
```bash
npm run init-db
```

This will create the SQLite database with:
- All necessary tables
- Default admin user (username: `admin`, password: `admin123`)
- Sample services and clients
- Default contact information

### Step 3.5: Run Enhanced Features Migration (Optional but Recommended)
```bash
npm run migrate-enhanced
```

This adds modern business features:
- Equipment management tables
- Maintenance scheduling
- Notifications system
- Activity logging
- Sample data for new features

### Step 4: Start the Server
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 🔐 Default Admin Credentials

**IMPORTANT:** Change these credentials after first login!

- **Username:** `admin`
- **Password:** `admin123`
- **Admin URL:** `http://localhost:3000/admin`

## 📂 Project Structure

```
TotanDhibar/
├── server/
│   ├── database.js          # Database connection
│   └── init-db.js           # Database initialization script
├── routes/
│   ├── public.js            # Public website routes
│   └── admin.js             # Admin panel routes
├── views/
│   ├── public/              # Public page templates
│   │   ├── home.ejs
│   │   ├── about.ejs
│   │   ├── services.ejs
│   │   ├── projects.ejs
│   │   ├── certificates.ejs
│   │   └── contact.ejs
│   ├── admin/               # Admin panel templates
│   │   ├── login.ejs
│   │   ├── dashboard.ejs
│   │   ├── pages.ejs
│   │   ├── services.ejs
│   │   └── ...
│   └── partials/            # Reusable template parts
│       ├── header.ejs
│       ├── footer.ejs
│       ├── admin-header.ejs
│       └── admin-sidebar.ejs
├── public/
│   ├── css/
│   │   ├── style.css        # Main public styles
│   │   └── admin.css        # Admin panel styles
│   ├── js/
│   │   └── main.js          # Frontend JavaScript
│   └── uploads/             # Uploaded files (images, PDFs)
│       ├── images/
│       └── certificates/
├── middleware/
│   └── auth.js              # Authentication middleware
├── server.js                # Main application file
├── package.json             # Dependencies and scripts
└── database.db              # SQLite database (created after init)
```

## 🎨 Customization

### Changing Colors
Edit `/public/css/style.css` and `/public/css/admin.css`:
- Primary color: `#1e3a5f` (Dark blue)
- Accent color: `#0066cc` (Light blue)
- Text color: `#333`

### Adding New Pages
1. Create new EJS template in `views/public/`
2. Add route in `routes/public.js`
3. Add navigation link in `views/partials/header.ejs`

### Modifying Content
Use the admin panel at `/admin` to:
- Edit page content (Home, About)
- Manage services, clients, projects
- Update contact information

## 🔒 Security Features

- **Password Hashing:** bcryptjs with salt rounds
- **Session Management:** Secure session cookies
- **CSRF Protection:** Token-based CSRF prevention
- **Input Validation:** express-validator for all forms
- **File Upload Security:** File type and size restrictions
- **SQL Injection Prevention:** Parameterized queries with better-sqlite3

## 📧 Contact Form

The contact form automatically:
- Validates all required fields
- Stores submissions in database
- Allows admin to view and manage submissions
- Marks messages as read/unread

## 🗄️ Database Schema

The SQLite database includes these tables:
- `users` - Admin user accounts
- `pages` - Dynamic page content
- `services` - Service listings
- `clients` - Client information
- `projects` - Project portfolio
- `certificates` - Uploaded certificates
- `downloads` - Downloadable documents
- `contact_info` - Company contact details
- `contact_submissions` - Form submissions

## 🚀 Deployment

### Option 1: Traditional Hosting (VPS/Dedicated Server)

1. Upload files to server
2. Install Node.js
3. Run `npm install`
4. Run `npm run init-db`
5. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start server.js --name ucc-website
pm2 save
```

### Option 2: Platform as a Service (Heroku, Railway, Render)

1. Create account on platform
2. Connect GitHub repository
3. Set build command: `npm install && npm run init-db`
4. Set start command: `npm start`
5. Deploy

### Environment Variables
For production, consider setting:
```
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-secret-key-here
```

## 🛠️ Maintenance

### Backup Database
```bash
cp database.db database.backup.db
```

### Reset Database
```bash
rm database.db
npm run init-db
```

### Update Dependencies
```bash
npm update
```

## 📝 License

MIT License - Feel free to use this project for your own purposes.

## 👨‍💻 Support

For issues or questions about this CMS:
- Open an issue on GitHub
- Contact: UCC Engineering Contractors

## 🎯 Future Enhancements

**✅ Recently Added:**
- ✅ Modern futuristic admin panel design
- ✅ Dark mode with persistent settings
- ✅ Equipment/inventory management
- ✅ Maintenance scheduling system
- ✅ Interactive charts and visualizations
- ✅ Advanced table features (DataTables)
- ✅ Rich text editor (TinyMCE)
- ✅ Toast notifications
- ✅ Export to CSV/Excel/PDF

**🔮 Planned Features:**
- Calendar view for maintenance
- Gantt charts for project timelines
- Image gallery for projects
- News/Blog section
- Employee management
- Equipment inventory tracking with QR codes
- Client portal
- Email notifications for form submissions
- Multi-user support with roles
- Mobile app integration
- Advanced reporting and analytics
- Document version control
- Automated maintenance reminders

---

**Built with ❤️ for UCC Engineering Contractors**

## 📖 Additional Documentation
- **[ADMIN_PANEL.md](ADMIN_PANEL.md)** - Complete admin panel documentation
- **[RELEASE_NOTES.md](RELEASE_NOTES.md)** - Modern admin panel release notes
- **[FEATURES.md](FEATURES.md)** - Detailed feature descriptions
