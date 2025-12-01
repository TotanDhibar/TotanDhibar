const express = require('express');
const router = express.Router();
const db = require('../server/database');
const { body, validationResult } = require('express-validator');

// Home page
router.get('/', (req, res) => {
  try {
    const page = db.prepare('SELECT * FROM pages WHERE page_name = ?').get('home');
    const services = db.prepare('SELECT * FROM services ORDER BY order_index ASC LIMIT 6').all();
    const clients = db.prepare('SELECT * FROM clients ORDER BY order_index ASC LIMIT 5').all();
    const contactInfo = db.prepare('SELECT * FROM contact_info WHERE id = 1').get();
    const homeConfig = db.prepare('SELECT * FROM home_config WHERE id = 1').get();
    const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC LIMIT 6').all();

    res.render('public/home', {
      title: page ? page.title : 'Home',
      page,
      services,
      clients,
      contactInfo,
      homeConfig,
      projects
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading home page');
  }
});

// About page
router.get('/about', (req, res) => {
  try {
    const page = db.prepare('SELECT * FROM pages WHERE page_name = ?').get('about');
    const contactInfo = db.prepare('SELECT * FROM contact_info WHERE id = 1').get();
    const teamMembers = db.prepare('SELECT * FROM team_members ORDER BY order_index ASC').all();

    res.render('public/about', {
      title: page ? page.title : 'About Us',
      page,
      contactInfo,
      teamMembers
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading about page');
  }
});

// Services page
router.get('/services', (req, res) => {
  try {
    const services = db.prepare('SELECT * FROM services ORDER BY order_index ASC').all();
    const contactInfo = db.prepare('SELECT * FROM contact_info WHERE id = 1').get();

    res.render('public/services', {
      title: 'Our Services',
      services,
      contactInfo
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading services page');
  }
});

// Service detail page - Dynamic route with slug
router.get('/services/:slug', (req, res) => {
  try {
    const service = db.prepare('SELECT * FROM services WHERE slug = ?').get(req.params.slug);
    
    if (!service) {
      return res.status(404).render('public/404', { title: '404 - Service Not Found' });
    }
    
    const contactInfo = db.prepare('SELECT * FROM contact_info WHERE id = 1').get();
    const relatedServices = db.prepare('SELECT * FROM services WHERE id != ? ORDER BY order_index ASC LIMIT 3').all(service.id);

    res.render('public/service-detail', {
      title: service.name,
      service,
      contactInfo,
      relatedServices
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading service page');
  }
});

// Clients page
router.get('/clients', (req, res) => {
  try {
    const clients = db.prepare('SELECT * FROM clients ORDER BY order_index ASC').all();
    const contactInfo = db.prepare('SELECT * FROM contact_info WHERE id = 1').get();

    res.render('public/clients', {
      title: 'Our Clients',
      clients,
      contactInfo
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading clients page');
  }
});

// Client detail page - Dynamic route with slug
router.get('/clients/:slug', (req, res) => {
  try {
    const client = db.prepare('SELECT * FROM clients WHERE slug = ?').get(req.params.slug);
    
    if (!client) {
      return res.status(404).render('public/404', { title: '404 - Client Not Found' });
    }
    
    const contactInfo = db.prepare('SELECT * FROM contact_info WHERE id = 1').get();
    const clientProjects = db.prepare('SELECT * FROM projects WHERE client_id = ? ORDER BY completion_date DESC').all(client.id);

    res.render('public/client-detail', {
      title: client.name,
      client,
      contactInfo,
      clientProjects
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading client page');
  }
});

// Projects/Gallery page with categories and filtering
router.get('/projects', (req, res) => {
  try {
    const category = req.query.category;
    let projects;
    
    if (category && category !== 'all') {
      projects = db.prepare(`
        SELECT p.*, c.name as client_name 
        FROM projects p 
        LEFT JOIN clients c ON p.client_id = c.id 
        WHERE p.category = ?
        ORDER BY p.completion_date DESC
      `).all(category);
    } else {
      projects = db.prepare(`
        SELECT p.*, c.name as client_name 
        FROM projects p 
        LEFT JOIN clients c ON p.client_id = c.id 
        ORDER BY p.completion_date DESC
      `).all();
    }
    
    // Get all unique categories for filtering
    const categories = db.prepare('SELECT DISTINCT category FROM projects WHERE category IS NOT NULL AND category != ""').all();
    const clients = db.prepare('SELECT * FROM clients ORDER BY order_index ASC').all();
    const contactInfo = db.prepare('SELECT * FROM contact_info WHERE id = 1').get();

    res.render('public/projects', {
      title: 'Projects & Gallery',
      projects,
      clients,
      contactInfo,
      categories: categories.map(c => c.category),
      activeCategory: category || 'all'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading projects page');
  }
});

// Certificates & Downloads page
router.get('/certificates', (req, res) => {
  try {
    const certificates = db.prepare('SELECT * FROM certificates ORDER BY upload_date DESC').all();
    const downloads = db.prepare('SELECT * FROM downloads ORDER BY upload_date DESC').all();
    const contactInfo = db.prepare('SELECT * FROM contact_info WHERE id = 1').get();

    res.render('public/certificates', {
      title: 'Certificates & Downloads',
      certificates,
      downloads,
      contactInfo
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading certificates page');
  }
});

// Contact page
router.get('/contact', (req, res) => {
  try {
    const contactInfo = db.prepare('SELECT * FROM contact_info WHERE id = 1').get();

    res.render('public/contact', {
      title: 'Contact Us',
      contactInfo,
      success: req.query.success,
      errors: []
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading contact page');
  }
});

// Contact form submission
router.post('/contact',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('phone').optional().trim(),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('message').trim().notEmpty().withMessage('Message is required')
  ],
  (req, res) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const contactInfo = db.prepare('SELECT * FROM contact_info WHERE id = 1').get();
      return res.render('public/contact', {
        title: 'Contact Us',
        contactInfo,
        errors: errors.array(),
        success: false
      });
    }

    try {
      const { name, email, phone, subject, message } = req.body;
      const stmt = db.prepare(`
        INSERT INTO contact_submissions (name, email, phone, subject, message)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(name, email, phone || null, subject, message);

      res.redirect('/contact?success=1');
    } catch (err) {
      console.error(err);
      const contactInfo = db.prepare('SELECT * FROM contact_info WHERE id = 1').get();
      res.render('public/contact', {
        title: 'Contact Us',
        contactInfo,
        errors: [{ msg: 'Error submitting form. Please try again.' }],
        success: false
      });
    }
  }
);

module.exports = router;
