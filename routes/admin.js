const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../server/database');
const { requireAuth, requireGuest } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Log session activity for security tracking
function logSessionActivity(userId, action, req) {
  try {
    const stmt = db.prepare(`
      INSERT INTO session_log (user_id, action, ip_address, user_agent)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(
      userId,
      action,
      req.ip || req.connection.remoteAddress,
      req.headers['user-agent']
    );
  } catch (err) {
    console.error('Error logging session activity:', err);
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadType = req.body.uploadType || 'images';
    // Validate uploadType to prevent path traversal
    const allowedTypes = ['images', 'certificates'];
    if (!allowedTypes.includes(uploadType)) {
      return cb(new Error('Invalid upload type'));
    }
    const dir = path.join(__dirname, '..', 'public', 'uploads', uploadType);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Sanitize the original filename to prevent path traversal
    const sanitizedName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(sanitizedName);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, PDF, DOC, DOCX are allowed.'));
    }
  }
});

// Login page
router.get('/login', requireGuest, (req, res) => {
  res.render('admin/login', {
    title: 'Admin Login',
    error: null
  });
});

// Login POST
router.post('/login',
  requireGuest,
  [
    body('username').trim().notEmpty(),
    body('password').notEmpty()
  ],
  (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.render('admin/login', {
        title: 'Admin Login',
        error: 'Please provide username and password'
      });
    }

    try {
      const { username, password } = req.body;
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.render('admin/login', {
          title: 'Admin Login',
          error: 'Invalid credentials'
        });
      }

      req.session.user = {
        id: user.id,
        username: user.username
      };

      // Log successful login
      logSessionActivity(user.id, 'login', req);

      res.redirect('/admin/dashboard');
    } catch (err) {
      console.error(err);
      res.render('admin/login', {
        title: 'Admin Login',
        error: 'Error during login'
      });
    }
  }
);

// Logout
router.get('/logout', (req, res) => {
  if (req.session && req.session.user) {
    logSessionActivity(req.session.user.id, 'logout', req);
  }
  req.session.destroy();
  res.redirect('/admin/login');
});

// Dashboard
router.get('/dashboard', requireAuth, (req, res) => {
  try {
    const stats = {
      services: db.prepare('SELECT COUNT(*) as count FROM services').get().count,
      clients: db.prepare('SELECT COUNT(*) as count FROM clients').get().count,
      projects: db.prepare('SELECT COUNT(*) as count FROM projects').get().count,
      certificates: db.prepare('SELECT COUNT(*) as count FROM certificates').get().count,
      submissions: db.prepare('SELECT COUNT(*) as count FROM contact_submissions WHERE is_read = 0').get().count
    };

    const recentSubmissions = db.prepare(`
      SELECT * FROM contact_submissions 
      ORDER BY submitted_at DESC 
      LIMIT 5
    `).all();

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      stats,
      recentSubmissions
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading dashboard');
  }
});

// Pages management
router.get('/pages', requireAuth, (req, res) => {
  try {
    const pages = db.prepare('SELECT * FROM pages ORDER BY page_name').all();
    res.render('admin/pages', {
      title: 'Manage Pages',
      pages
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading pages');
  }
});

router.get('/pages/edit/:pageName', requireAuth, (req, res) => {
  try {
    const page = db.prepare('SELECT * FROM pages WHERE page_name = ?').get(req.params.pageName);
    if (!page) {
      return res.redirect('/admin/pages');
    }
    res.render('admin/edit-page', {
      title: 'Edit Page',
      page,
      errors: [],
      success: false
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading page');
  }
});

router.post('/pages/edit/:pageName',
  requireAuth,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('content').trim().notEmpty().withMessage('Content is required'),
    body('meta_description').optional().trim()
  ],
  (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const page = db.prepare('SELECT * FROM pages WHERE page_name = ?').get(req.params.pageName);
      return res.render('admin/edit-page', {
        title: 'Edit Page',
        page: { ...page, ...req.body },
        errors: errors.array(),
        success: false
      });
    }

    try {
      const { title, content, meta_description } = req.body;
      const stmt = db.prepare(`
        UPDATE pages 
        SET title = ?, content = ?, meta_description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE page_name = ?
      `);
      stmt.run(title, content, meta_description, req.params.pageName);

      const page = db.prepare('SELECT * FROM pages WHERE page_name = ?').get(req.params.pageName);
      res.render('admin/edit-page', {
        title: 'Edit Page',
        page,
        errors: [],
        success: true
      });
    } catch (err) {
      console.error(err);
      const page = db.prepare('SELECT * FROM pages WHERE page_name = ?').get(req.params.pageName);
      res.render('admin/edit-page', {
        title: 'Edit Page',
        page,
        errors: [{ msg: 'Error updating page' }],
        success: false
      });
    }
  }
);

// Services management
router.get('/services', requireAuth, (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services ORDER BY order_index ASC').all();
    res.render('admin/services', {
      title: 'Manage Services',
      services
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading services');
  }
});

router.get('/services/add', requireAuth, (req, res) => {
  res.render('admin/edit-service', {
    title: 'Add Service',
    service: null,
    errors: [],
    success: false
  });
});

router.post('/services/add',
  requireAuth,
  upload.single('image'),
  [
    body('name').trim().notEmpty().withMessage('Service name is required'),
    body('description').optional().trim(),
    body('detailed_description').optional().trim(),
    body('icon').optional().trim(),
    body('order_index').optional().isInt()
  ],
  (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.render('admin/edit-service', {
        title: 'Add Service',
        service: req.body,
        errors: errors.array(),
        success: false
      });
    }

    try {
      const { name, description, detailed_description, icon, order_index } = req.body;
      // Generate slug from name
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const image = req.file ? '/uploads/images/' + req.file.filename : null;
      
      const stmt = db.prepare(`
        INSERT INTO services (name, slug, description, detailed_description, icon, image, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(name, slug, description || null, detailed_description || null, icon || null, image, order_index || 0);

      res.redirect('/admin/services');
    } catch (err) {
      console.error(err);
      res.render('admin/edit-service', {
        title: 'Add Service',
        service: req.body,
        errors: [{ msg: 'Error adding service' }],
        success: false
      });
    }
  }
);

router.get('/services/edit/:id', requireAuth, (req, res) => {
  try {
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
    if (!service) {
      return res.redirect('/admin/services');
    }
    res.render('admin/edit-service', {
      title: 'Edit Service',
      service,
      errors: [],
      success: false
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading service');
  }
});

router.post('/services/edit/:id',
  requireAuth,
  upload.single('image'),
  [
    body('name').trim().notEmpty().withMessage('Service name is required'),
    body('description').optional().trim(),
    body('detailed_description').optional().trim(),
    body('icon').optional().trim(),
    body('order_index').optional().isInt()
  ],
  (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.render('admin/edit-service', {
        title: 'Edit Service',
        service: { id: req.params.id, ...req.body },
        errors: errors.array(),
        success: false
      });
    }

    try {
      const { name, description, detailed_description, icon, order_index } = req.body;
      const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
      
      // Generate slug from name
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      let image = service.image;
      if (req.file) {
        image = '/uploads/images/' + req.file.filename;
      }
      
      const stmt = db.prepare(`
        UPDATE services 
        SET name = ?, slug = ?, description = ?, detailed_description = ?, icon = ?, image = ?, order_index = ?
        WHERE id = ?
      `);
      stmt.run(name, slug, description || null, detailed_description || null, icon || null, image, order_index || 0, req.params.id);

      const updatedService = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
      res.render('admin/edit-service', {
        title: 'Edit Service',
        service: updatedService,
        errors: [],
        success: true
      });
    } catch (err) {
      console.error(err);
      res.render('admin/edit-service', {
        title: 'Edit Service',
        service: { id: req.params.id, ...req.body },
        errors: [{ msg: 'Error updating service' }],
        success: false
      });
    }
  }
);

router.post('/services/delete/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
    res.redirect('/admin/services');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/services');
  }
});

// Clients management
router.get('/clients', requireAuth, (req, res) => {
  try {
    const clients = db.prepare('SELECT * FROM clients ORDER BY order_index ASC').all();
    res.render('admin/clients', {
      title: 'Manage Clients',
      clients
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading clients');
  }
});

router.get('/clients/add', requireAuth, (req, res) => {
  res.render('admin/client-form', {
    title: 'Add Client',
    client: null,
    errors: [],
    success: false
  });
});

router.post('/clients/add',
  requireAuth,
  upload.single('logo'),
  [
    body('name').trim().notEmpty().withMessage('Client name is required'),
    body('description').optional().trim(),
    body('detailed_description').optional().trim(),
    body('website').optional().trim(),
    body('order_index').optional().isInt()
  ],
  (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.render('admin/client-form', {
        title: 'Add Client',
        client: req.body,
        errors: errors.array(),
        success: false
      });
    }

    try {
      const { name, description, detailed_description, website, order_index } = req.body;
      const logo = req.file ? '/uploads/images/' + req.file.filename : null;
      // Generate slug from name
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const stmt = db.prepare(`
        INSERT INTO clients (name, slug, description, detailed_description, website, logo, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(name, slug, description || null, detailed_description || null, website || null, logo, order_index || 0);

      res.redirect('/admin/clients');
    } catch (err) {
      console.error(err);
      res.render('admin/client-form', {
        title: 'Add Client',
        client: req.body,
        errors: [{ msg: 'Error adding client' }],
        success: false
      });
    }
  }
);

router.get('/clients/edit/:id', requireAuth, (req, res) => {
  try {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
    if (!client) {
      return res.redirect('/admin/clients');
    }
    res.render('admin/client-form', {
      title: 'Edit Client',
      client,
      errors: [],
      success: false
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading client');
  }
});

router.post('/clients/edit/:id',
  requireAuth,
  upload.single('logo'),
  [
    body('name').trim().notEmpty().withMessage('Client name is required'),
    body('description').optional().trim(),
    body('detailed_description').optional().trim(),
    body('website').optional().trim(),
    body('order_index').optional().isInt()
  ],
  (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.render('admin/client-form', {
        title: 'Edit Client',
        client: { id: req.params.id, ...req.body },
        errors: errors.array(),
        success: false
      });
    }

    try {
      const { name, description, detailed_description, website, order_index } = req.body;
      const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
      
      // Generate slug from name
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      let logo = client.logo;
      if (req.file) {
        logo = '/uploads/images/' + req.file.filename;
      }

      const stmt = db.prepare(`
        UPDATE clients 
        SET name = ?, slug = ?, description = ?, detailed_description = ?, website = ?, logo = ?, order_index = ?
        WHERE id = ?
      `);
      stmt.run(name, slug, description || null, detailed_description || null, website || null, logo, order_index || 0, req.params.id);

      const updatedClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
      res.render('admin/client-form', {
        title: 'Edit Client',
        client: updatedClient,
        errors: [],
        success: true
      });
    } catch (err) {
      console.error(err);
      res.render('admin/client-form', {
        title: 'Edit Client',
        client: { id: req.params.id, ...req.body },
        errors: [{ msg: 'Error updating client' }],
        success: false
      });
    }
  }
);

router.post('/clients/delete/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
    res.redirect('/admin/clients');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/clients');
  }
});

// Projects management
router.get('/projects', requireAuth, (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT p.*, c.name as client_name 
      FROM projects p 
      LEFT JOIN clients c ON p.client_id = c.id 
      ORDER BY p.completion_date DESC
    `).all();
    res.render('admin/projects', {
      title: 'Manage Projects',
      projects
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading projects');
  }
});

router.get('/projects/add', requireAuth, (req, res) => {
  try {
    const clients = db.prepare('SELECT * FROM clients ORDER BY name ASC').all();
    res.render('admin/edit-project', {
      title: 'Add Project',
      project: null,
      clients,
      errors: [],
      success: false
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading form');
  }
});

router.post('/projects/add',
  requireAuth,
  upload.single('image'),
  [
    body('title').trim().notEmpty().withMessage('Project title is required'),
    body('description').optional().trim(),
    body('client_id').optional().isInt(),
    body('completion_date').optional().isDate()
  ],
  (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const clients = db.prepare('SELECT * FROM clients ORDER BY name ASC').all();
      return res.render('admin/edit-project', {
        title: 'Add Project',
        project: req.body,
        clients,
        errors: errors.array(),
        success: false
      });
    }

    try {
      const { title, description, client_id, completion_date } = req.body;
      const image = req.file ? '/uploads/images/' + req.file.filename : null;
      
      const stmt = db.prepare(`
        INSERT INTO projects (title, description, client_id, image, completion_date)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(
        title, 
        description || null, 
        client_id || null, 
        image, 
        completion_date || null
      );

      res.redirect('/admin/projects');
    } catch (err) {
      console.error(err);
      const clients = db.prepare('SELECT * FROM clients ORDER BY name ASC').all();
      res.render('admin/edit-project', {
        title: 'Add Project',
        project: req.body,
        clients,
        errors: [{ msg: 'Error adding project' }],
        success: false
      });
    }
  }
);

router.post('/projects/delete/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
    res.redirect('/admin/projects');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/projects');
  }
});

// Certificates management
router.get('/certificates', requireAuth, (req, res) => {
  try {
    const certificates = db.prepare('SELECT * FROM certificates ORDER BY upload_date DESC').all();
    res.render('admin/certificates', {
      title: 'Manage Certificates',
      certificates
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading certificates');
  }
});

router.post('/certificates/add',
  requireAuth,
  upload.single('file'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim()
  ],
  (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty() || !req.file) {
      return res.redirect('/admin/certificates?error=1');
    }

    try {
      const { title, description } = req.body;
      const file_path = '/uploads/certificates/' + req.file.filename;
      
      const stmt = db.prepare(`
        INSERT INTO certificates (title, file_path, description)
        VALUES (?, ?, ?)
      `);
      stmt.run(title, file_path, description || null);

      res.redirect('/admin/certificates');
    } catch (err) {
      console.error(err);
      res.redirect('/admin/certificates?error=1');
    }
  }
);

router.post('/certificates/delete/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM certificates WHERE id = ?').run(req.params.id);
    res.redirect('/admin/certificates');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/certificates');
  }
});

// Downloads management
router.get('/downloads', requireAuth, (req, res) => {
  try {
    const downloads = db.prepare('SELECT * FROM downloads ORDER BY upload_date DESC').all();
    res.render('admin/downloads', {
      title: 'Manage Downloads',
      downloads
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading downloads');
  }
});

router.post('/downloads/add',
  requireAuth,
  upload.single('file'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('category').optional().trim()
  ],
  (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty() || !req.file) {
      return res.redirect('/admin/downloads?error=1');
    }

    try {
      const { title, description, category } = req.body;
      const file_path = '/uploads/certificates/' + req.file.filename;
      
      const stmt = db.prepare(`
        INSERT INTO downloads (title, file_path, description, category)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(title, file_path, description || null, category || null);

      res.redirect('/admin/downloads');
    } catch (err) {
      console.error(err);
      res.redirect('/admin/downloads?error=1');
    }
  }
);

router.post('/downloads/delete/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM downloads WHERE id = ?').run(req.params.id);
    res.redirect('/admin/downloads');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/downloads');
  }
});

// Contact info management
router.get('/contact-info', requireAuth, (req, res) => {
  try {
    const contactInfo = db.prepare('SELECT * FROM contact_info WHERE id = 1').get();
    res.render('admin/contact-info', {
      title: 'Edit Contact Information',
      contactInfo,
      errors: [],
      success: false
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading contact info');
  }
});

router.post('/contact-info',
  requireAuth,
  upload.fields([
    { name: 'company_logo', maxCount: 1 },
    { name: 'background_image', maxCount: 1 }
  ]),
  [
    body('company_name').trim().notEmpty().withMessage('Company name is required'),
    body('phone').optional().trim(),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('address').optional().trim(),
    body('location').optional().trim(),
    body('gst_number').optional().trim(),
    body('google_map_embed').optional().trim(),
    body('gps_latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('gps_longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180')
  ],
  (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.render('admin/contact-info', {
        title: 'Edit Contact Information',
        contactInfo: { id: 1, ...req.body },
        errors: errors.array(),
        success: false
      });
    }

    try {
      const { company_name, phone, email, address, location, gst_number, google_map_embed, gps_latitude, gps_longitude } = req.body;
      const contactInfo = db.prepare('SELECT * FROM contact_info WHERE id = 1').get();
      
      let company_logo = contactInfo ? contactInfo.company_logo : null;
      let background_image = contactInfo ? contactInfo.background_image : null;
      
      if (req.files && req.files['company_logo']) {
        company_logo = '/uploads/images/' + req.files['company_logo'][0].filename;
      }
      
      if (req.files && req.files['background_image']) {
        background_image = '/uploads/images/' + req.files['background_image'][0].filename;
      }

      const stmt = db.prepare(`
        UPDATE contact_info 
        SET company_name = ?, company_logo = ?, background_image = ?, phone = ?, email = ?, address = ?, location = ?, gst_number = ?, google_map_embed = ?, gps_latitude = ?, gps_longitude = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `);
      stmt.run(company_name, company_logo, background_image, phone || null, email || null, address || null, location || null, gst_number || null, google_map_embed || null, gps_latitude || null, gps_longitude || null);

      const updatedContactInfo = db.prepare('SELECT * FROM contact_info WHERE id = 1').get();
      res.render('admin/contact-info', {
        title: 'Edit Contact Information',
        contactInfo: updatedContactInfo,
        errors: [],
        success: true
      });
    } catch (err) {
      console.error(err);
      res.render('admin/contact-info', {
        title: 'Edit Contact Information',
        contactInfo: { id: 1, ...req.body },
        errors: [{ msg: 'Error updating contact info' }],
        success: false
      });
    }
  }
);

// Contact submissions
router.get('/submissions', requireAuth, (req, res) => {
  try {
    const submissions = db.prepare(`
      SELECT * FROM contact_submissions 
      ORDER BY submitted_at DESC
    `).all();
    res.render('admin/submissions', {
      title: 'Contact Form Submissions',
      submissions
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading submissions');
  }
});

router.post('/submissions/mark-read/:id', requireAuth, (req, res) => {
  try {
    db.prepare('UPDATE contact_submissions SET is_read = 1 WHERE id = ?').run(req.params.id);
    res.redirect('/admin/submissions');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/submissions');
  }
});

router.post('/submissions/delete/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM contact_submissions WHERE id = ?').run(req.params.id);
    res.redirect('/admin/submissions');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/submissions');
  }
});

// Change password
router.get('/change-password', requireAuth, (req, res) => {
  res.render('admin/change-password', {
    title: 'Change Password',
    errors: [],
    success: false
  });
});

router.post('/change-password',
  requireAuth,
  [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    body('confirm_password').custom((value, { req }) => {
      if (value !== req.body.new_password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
  ],
  (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.render('admin/change-password', {
        title: 'Change Password',
        errors: errors.array(),
        success: false
      });
    }

    try {
      const { current_password, new_password } = req.body;
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);

      if (!bcrypt.compareSync(current_password, user.password)) {
        return res.render('admin/change-password', {
          title: 'Change Password',
          errors: [{ msg: 'Current password is incorrect' }],
          success: false
        });
      }

      const hashedPassword = bcrypt.hashSync(new_password, 10);
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, user.id);

      res.render('admin/change-password', {
        title: 'Change Password',
        errors: [],
        success: true
      });
    } catch (err) {
      console.error(err);
      res.render('admin/change-password', {
        title: 'Change Password',
        errors: [{ msg: 'Error changing password' }],
        success: false
      });
    }
  }
);

// ===== TEAM MANAGEMENT =====
router.get('/team', requireAuth, (req, res) => {
  try {
    const teamMembers = db.prepare('SELECT * FROM team_members ORDER BY order_index ASC').all();
    res.render('admin/team', {
      title: 'Manage Team',
      teamMembers
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading team members');
  }
});

router.get('/team/add', requireAuth, (req, res) => {
  res.render('admin/edit-team', {
    title: 'Add Team Member',
    member: null,
    errors: [],
    success: false
  });
});

router.post('/team/add',
  requireAuth,
  upload.single('photo'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('position').optional().trim(),
    body('bio').optional().trim(),
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('phone').optional().trim(),
    body('order_index').optional().isInt()
  ],
  (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.render('admin/edit-team', {
        title: 'Add Team Member',
        member: req.body,
        errors: errors.array(),
        success: false
      });
    }

    try {
      const { name, position, bio, email, phone, order_index } = req.body;
      const photo = req.file ? '/uploads/images/' + req.file.filename : null;
      
      const stmt = db.prepare(`
        INSERT INTO team_members (name, position, bio, photo, email, phone, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(name, position || null, bio || null, photo, email || null, phone || null, order_index || 0);

      res.redirect('/admin/team');
    } catch (err) {
      console.error(err);
      res.render('admin/edit-team', {
        title: 'Add Team Member',
        member: req.body,
        errors: [{ msg: 'Error adding team member' }],
        success: false
      });
    }
  }
);

router.get('/team/edit/:id', requireAuth, (req, res) => {
  try {
    const member = db.prepare('SELECT * FROM team_members WHERE id = ?').get(req.params.id);
    if (!member) {
      return res.redirect('/admin/team');
    }
    res.render('admin/edit-team', {
      title: 'Edit Team Member',
      member,
      errors: [],
      success: false
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading team member');
  }
});

router.post('/team/edit/:id',
  requireAuth,
  upload.single('photo'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('position').optional().trim(),
    body('bio').optional().trim(),
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('phone').optional().trim(),
    body('order_index').optional().isInt()
  ],
  (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.render('admin/edit-team', {
        title: 'Edit Team Member',
        member: { id: req.params.id, ...req.body },
        errors: errors.array(),
        success: false
      });
    }

    try {
      const { name, position, bio, email, phone, order_index } = req.body;
      const member = db.prepare('SELECT * FROM team_members WHERE id = ?').get(req.params.id);
      
      let photo = member.photo;
      if (req.file) {
        photo = '/uploads/images/' + req.file.filename;
      }

      const stmt = db.prepare(`
        UPDATE team_members 
        SET name = ?, position = ?, bio = ?, photo = ?, email = ?, phone = ?, order_index = ?
        WHERE id = ?
      `);
      stmt.run(name, position || null, bio || null, photo, email || null, phone || null, order_index || 0, req.params.id);

      const updatedMember = db.prepare('SELECT * FROM team_members WHERE id = ?').get(req.params.id);
      res.render('admin/edit-team', {
        title: 'Edit Team Member',
        member: updatedMember,
        errors: [],
        success: true
      });
    } catch (err) {
      console.error(err);
      res.render('admin/edit-team', {
        title: 'Edit Team Member',
        member: { id: req.params.id, ...req.body },
        errors: [{ msg: 'Error updating team member' }],
        success: false
      });
    }
  }
);

router.post('/team/delete/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM team_members WHERE id = ?').run(req.params.id);
    res.redirect('/admin/team');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/team');
  }
});

// ===== HOME PAGE CONFIGURATION =====
router.get('/home-config', requireAuth, (req, res) => {
  try {
    const homeConfig = db.prepare('SELECT * FROM home_config WHERE id = 1').get();
    res.render('admin/home-config', {
      title: 'Home Page Configuration',
      homeConfig,
      errors: [],
      success: false
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading home configuration');
  }
});

router.post('/home-config',
  requireAuth,
  upload.single('hero_background'),
  [
    body('hero_title').optional().trim(),
    body('hero_subtitle').optional().trim(),
    body('animated_text').optional().trim(),
    body('stat1_label').optional().trim(),
    body('stat1_value').optional().isInt(),
    body('stat2_label').optional().trim(),
    body('stat2_value').optional().isInt(),
    body('stat3_label').optional().trim(),
    body('stat3_value').optional().isInt(),
    body('stat4_label').optional().trim(),
    body('stat4_value').optional().isInt()
  ],
  (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.render('admin/home-config', {
        title: 'Home Page Configuration',
        homeConfig: { id: 1, ...req.body },
        errors: errors.array(),
        success: false
      });
    }

    try {
      const { hero_title, hero_subtitle, animated_text, stat1_label, stat1_value, stat2_label, stat2_value, stat3_label, stat3_value, stat4_label, stat4_value } = req.body;
      const homeConfig = db.prepare('SELECT * FROM home_config WHERE id = 1').get();
      
      let hero_background = homeConfig ? homeConfig.hero_background : null;
      if (req.file) {
        hero_background = '/uploads/images/' + req.file.filename;
      }

      const stmt = db.prepare(`
        UPDATE home_config 
        SET hero_title = ?, hero_subtitle = ?, hero_background = ?, animated_text = ?,
            stat1_label = ?, stat1_value = ?, stat2_label = ?, stat2_value = ?,
            stat3_label = ?, stat3_value = ?, stat4_label = ?, stat4_value = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `);
      stmt.run(
        hero_title || 'UCC Engineering Contractors',
        hero_subtitle || 'Excellence in Power Plant Maintenance & Engineering',
        hero_background,
        animated_text || 'Power Plant Maintenance|Industrial Engineering|Quality Services',
        stat1_label || 'Projects Completed',
        stat1_value || 500,
        stat2_label || 'Happy Clients',
        stat2_value || 50,
        stat3_label || 'Years Experience',
        stat3_value || 15,
        stat4_label || 'Team Members',
        stat4_value || 100
      );

      const updatedConfig = db.prepare('SELECT * FROM home_config WHERE id = 1').get();
      res.render('admin/home-config', {
        title: 'Home Page Configuration',
        homeConfig: updatedConfig,
        errors: [],
        success: true
      });
    } catch (err) {
      console.error(err);
      res.render('admin/home-config', {
        title: 'Home Page Configuration',
        homeConfig: { id: 1, ...req.body },
        errors: [{ msg: 'Error updating home configuration' }],
        success: false
      });
    }
  }
);

// ===== ADMIN SETTINGS (Security) =====
router.get('/settings', requireAuth, (req, res) => {
  try {
    const sessionLogs = db.prepare(`
      SELECT * FROM session_log 
      ORDER BY created_at DESC 
      LIMIT 20
    `).all();
    
    res.render('admin/settings', {
      title: 'Admin Settings',
      sessionLogs,
      errors: [],
      success: false
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading settings');
  }
});

// Forgot password (dummy implementation)
router.get('/forgot-password', requireGuest, (req, res) => {
  res.render('admin/forgot-password', {
    title: 'Forgot Password',
    error: null,
    success: false
  });
});

router.post('/forgot-password',
  requireGuest,
  [
    body('email').isEmail().withMessage('Valid email is required')
  ],
  (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.render('admin/forgot-password', {
        title: 'Forgot Password',
        error: 'Please provide a valid email address',
        success: false
      });
    }

    // Dummy implementation - in production, this would send an email
    res.render('admin/forgot-password', {
      title: 'Forgot Password',
      error: null,
      success: true
    });
  }
);

// ============ EQUIPMENT MANAGEMENT ROUTES ============

// Equipment list
router.get('/equipment', requireAuth, (req, res) => {
  try {
    const equipment = db.prepare('SELECT * FROM equipment ORDER BY created_at DESC').all();
    
    // Calculate statistics
    const equipmentStats = {
      total: equipment.length,
      available: equipment.filter(e => e.status === 'Available').length,
      inUse: equipment.filter(e => e.status === 'In Use').length,
      maintenance: equipment.filter(e => e.status === 'Under Maintenance').length
    };

    res.render('admin/equipment', {
      title: 'Equipment Management',
      user: req.session.user,
      unreadCount: db.prepare('SELECT COUNT(*) as count FROM contact_submissions WHERE is_read = 0').get().count,
      equipment,
      equipmentStats
    });
  } catch (err) {
    console.error('Error loading equipment:', err);
    res.status(500).send('Error loading equipment');
  }
});

// Add equipment
router.post('/equipment/add', requireAuth, (req, res) => {
  try {
    const { name, category, model, serial_number, status, location, notes } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO equipment (name, category, model, serial_number, status, location, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(name, category, model, serial_number, status || 'Available', location, notes);
    
    // Log activity
    db.prepare(`
      INSERT INTO activity_log (user_id, action, entity_type, details)
      VALUES (?, ?, ?, ?)
    `).run(req.session.user.id, 'create', 'equipment', `Added equipment: ${name}`);
    
    res.redirect('/admin/equipment');
  } catch (err) {
    console.error('Error adding equipment:', err);
    res.status(500).send('Error adding equipment');
  }
});

// ============ MAINTENANCE SCHEDULE ROUTES ============

// Maintenance schedule list
router.get('/maintenance', requireAuth, (req, res) => {
  try {
    const schedules = db.prepare(`
      SELECT m.*, c.name as client_name
      FROM maintenance_schedule m
      LEFT JOIN clients c ON m.client_id = c.id
      ORDER BY m.scheduled_date ASC
    `).all();
    
    const clients = db.prepare('SELECT id, name FROM clients ORDER BY name').all();
    
    // Calculate statistics
    const scheduleStats = {
      total: schedules.length,
      scheduled: schedules.filter(s => s.status === 'Scheduled').length,
      inProgress: schedules.filter(s => s.status === 'In Progress').length,
      completed: schedules.filter(s => s.status === 'Completed').length
    };
    
    // Get upcoming schedules
    const today = new Date().toISOString().split('T')[0];
    const upcomingSchedules = schedules.filter(s => 
      s.scheduled_date >= today && s.status === 'Scheduled'
    );

    res.render('admin/maintenance', {
      title: 'Maintenance Schedule',
      user: req.session.user,
      unreadCount: db.prepare('SELECT COUNT(*) as count FROM contact_submissions WHERE is_read = 0').get().count,
      schedules,
      clients,
      scheduleStats,
      upcomingSchedules
    });
  } catch (err) {
    console.error('Error loading maintenance schedule:', err);
    res.status(500).send('Error loading maintenance schedule');
  }
});

// Add maintenance schedule
router.post('/maintenance/add', requireAuth, (req, res) => {
  try {
    const { client_id, service_type, scheduled_date, assigned_team, estimated_duration, status, notes } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO maintenance_schedule (client_id, service_type, scheduled_date, assigned_team, estimated_duration, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(client_id, service_type, scheduled_date, assigned_team, estimated_duration, status || 'Scheduled', notes);
    
    // Create notification
    db.prepare(`
      INSERT INTO notifications (title, message, type, link)
      VALUES (?, ?, ?, ?)
    `).run(
      'New Maintenance Scheduled',
      `${service_type} scheduled for ${scheduled_date}`,
      'info',
      '/admin/maintenance'
    );
    
    // Log activity
    db.prepare(`
      INSERT INTO activity_log (user_id, action, entity_type, details)
      VALUES (?, ?, ?, ?)
    `).run(req.session.user.id, 'create', 'maintenance', `Scheduled ${service_type}`);
    
    res.redirect('/admin/maintenance');
  } catch (err) {
    console.error('Error adding maintenance schedule:', err);
    res.status(500).send('Error adding maintenance schedule');
  }
});

// ============ NOTIFICATIONS ROUTES ============

// Get notifications API
router.get('/api/notifications', requireAuth, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE is_read = 0
      ORDER BY created_at DESC
      LIMIT 10
    `).all();
    
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Error fetching notifications' });
  }
});

// Mark notification as read
router.post('/api/notifications/:id/read', requireAuth, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: 'Error updating notification' });
  }
});

// Redirect /admin to dashboard
router.get('/', requireAuth, (req, res) => {
  res.redirect('/admin/dashboard');
});

module.exports = router;
