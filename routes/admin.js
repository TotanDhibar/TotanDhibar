const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../server/database');
const { requireAuth, requireGuest } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadType = req.body.uploadType || 'images';
    const dir = path.join(__dirname, '..', 'public', 'uploads', uploadType);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
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
  [
    body('name').trim().notEmpty().withMessage('Service name is required'),
    body('description').optional().trim(),
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
      const { name, description, icon, order_index } = req.body;
      const stmt = db.prepare(`
        INSERT INTO services (name, description, icon, order_index)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(name, description || null, icon || null, order_index || 0);

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
  [
    body('name').trim().notEmpty().withMessage('Service name is required'),
    body('description').optional().trim(),
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
      const { name, description, icon, order_index } = req.body;
      const stmt = db.prepare(`
        UPDATE services 
        SET name = ?, description = ?, icon = ?, order_index = ?
        WHERE id = ?
      `);
      stmt.run(name, description || null, icon || null, order_index || 0, req.params.id);

      const service = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
      res.render('admin/edit-service', {
        title: 'Edit Service',
        service,
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
  res.render('admin/edit-client', {
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
    body('order_index').optional().isInt()
  ],
  (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.render('admin/edit-client', {
        title: 'Add Client',
        client: req.body,
        errors: errors.array(),
        success: false
      });
    }

    try {
      const { name, description, order_index } = req.body;
      const logo = req.file ? '/uploads/images/' + req.file.filename : null;
      
      const stmt = db.prepare(`
        INSERT INTO clients (name, description, logo, order_index)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(name, description || null, logo, order_index || 0);

      res.redirect('/admin/clients');
    } catch (err) {
      console.error(err);
      res.render('admin/edit-client', {
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
    res.render('admin/edit-client', {
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
    body('order_index').optional().isInt()
  ],
  (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.render('admin/edit-client', {
        title: 'Edit Client',
        client: { id: req.params.id, ...req.body },
        errors: errors.array(),
        success: false
      });
    }

    try {
      const { name, description, order_index } = req.body;
      const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
      
      let logo = client.logo;
      if (req.file) {
        logo = '/uploads/images/' + req.file.filename;
      }

      const stmt = db.prepare(`
        UPDATE clients 
        SET name = ?, description = ?, logo = ?, order_index = ?
        WHERE id = ?
      `);
      stmt.run(name, description || null, logo, order_index || 0, req.params.id);

      const updatedClient = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
      res.render('admin/edit-client', {
        title: 'Edit Client',
        client: updatedClient,
        errors: [],
        success: true
      });
    } catch (err) {
      console.error(err);
      res.render('admin/edit-client', {
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
  [
    body('company_name').trim().notEmpty().withMessage('Company name is required'),
    body('phone').optional().trim(),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('address').optional().trim(),
    body('location').optional().trim()
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
      const { company_name, phone, email, address, location } = req.body;
      const stmt = db.prepare(`
        UPDATE contact_info 
        SET company_name = ?, phone = ?, email = ?, address = ?, location = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `);
      stmt.run(company_name, phone || null, email || null, address || null, location || null);

      const contactInfo = db.prepare('SELECT * FROM contact_info WHERE id = 1').get();
      res.render('admin/contact-info', {
        title: 'Edit Contact Information',
        contactInfo,
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

// Redirect /admin to dashboard
router.get('/', requireAuth, (req, res) => {
  res.redirect('/admin/dashboard');
});

module.exports = router;
