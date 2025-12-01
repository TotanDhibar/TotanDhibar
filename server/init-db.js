const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'database.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('Initializing database...');

// Create tables
db.exec(`
  -- Users table for admin authentication
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Pages table for dynamic content
  CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_name TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    meta_description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Services table with slug for dynamic URLs
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    description TEXT,
    detailed_description TEXT,
    icon TEXT,
    image TEXT,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Clients table with slug for dynamic URLs
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    logo TEXT,
    description TEXT,
    detailed_description TEXT,
    website TEXT,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Projects table with category for gallery filtering
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    client_id INTEGER,
    image TEXT,
    category TEXT,
    completion_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
  );

  -- Certificates table
  CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    description TEXT,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Contact info table with Google Maps embed support
  CREATE TABLE IF NOT EXISTS contact_info (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    company_name TEXT NOT NULL,
    company_logo TEXT,
    background_image TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    location TEXT,
    gst_number TEXT,
    google_map_embed TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Downloads table
  CREATE TABLE IF NOT EXISTS downloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    description TEXT,
    category TEXT,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Contact form submissions
  CREATE TABLE IF NOT EXISTS contact_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT 0
  );

  -- Team members table
  CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    position TEXT,
    bio TEXT,
    photo TEXT,
    email TEXT,
    phone TEXT,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Home page configuration table
  CREATE TABLE IF NOT EXISTS home_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    hero_title TEXT DEFAULT 'UCC Engineering Contractors',
    hero_subtitle TEXT DEFAULT 'Excellence in Power Plant Maintenance & Engineering',
    hero_background TEXT,
    animated_text TEXT DEFAULT 'Power Plant Maintenance|Industrial Engineering|Quality Services',
    stat1_label TEXT DEFAULT 'Projects Completed',
    stat1_value INTEGER DEFAULT 500,
    stat2_label TEXT DEFAULT 'Happy Clients',
    stat2_value INTEGER DEFAULT 50,
    stat3_label TEXT DEFAULT 'Years Experience',
    stat3_value INTEGER DEFAULT 15,
    stat4_label TEXT DEFAULT 'Team Members',
    stat4_value INTEGER DEFAULT 100,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Session log table for security tracking
  CREATE TABLE IF NOT EXISTS session_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );
`);

console.log('Tables created successfully.');

// Insert default admin user (username: admin, password: admin123)
const hashedPassword = bcrypt.hashSync('admin123', 10);
try {
  const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
  stmt.run('admin', hashedPassword);
  console.log('Default admin user created (username: admin, password: admin123)');
} catch (err) {
  if (err.message.includes('UNIQUE constraint failed')) {
    console.log('Admin user already exists.');
  } else {
    throw err;
  }
}

// Insert default contact info
try {
  const contactStmt = db.prepare(`
    INSERT INTO contact_info (id, company_name, phone, email, address, location) 
    VALUES (1, ?, ?, ?, ?, ?)
  `);
  contactStmt.run(
    'UCC Engineering Contractors',
    '+91-XXXXXXXXXX',
    'contact@uccengineering.com',
    'Industrial Area, Asansol',
    'Asansol, West Bengal, India'
  );
  console.log('Default contact info created.');
} catch (err) {
  if (err.message.includes('UNIQUE constraint failed')) {
    console.log('Contact info already exists.');
  } else {
    throw err;
  }
}

// Insert default pages
const defaultPages = [
  {
    page_name: 'home',
    title: 'Welcome to UCC Engineering Contractors',
    content: `<h2>Leading Power Plant Maintenance & Engineering Solutions</h2>
<p>UCC Engineering Contractors is a trusted name in power plant maintenance, boiler services, and industrial engineering solutions. With years of experience serving major power plants across Eastern India, we deliver excellence in every project.</p>
<p>Our expertise spans AMC, Boiler Maintenance, ESP, APH, AHP, Hoist operations, Shutdown services, and comprehensive Overhauling solutions.</p>`,
    meta_description: 'UCC Engineering Contractors - Expert power plant maintenance and engineering services in Asansol, West Bengal'
  },
  {
    page_name: 'about',
    title: 'About UCC Engineering Contractors',
    content: `<h2>Our Story</h2>
<p>UCC Engineering Contractors has been at the forefront of industrial engineering and power plant maintenance services. Based in Asansol, West Bengal, we have built a reputation for reliability, technical excellence, and commitment to safety.</p>
<h3>Our Mission</h3>
<p>To provide world-class engineering solutions and maintenance services that ensure optimal performance, safety, and efficiency of power generation facilities.</p>
<h3>Our Vision</h3>
<p>To be the most trusted partner for power plant maintenance and engineering services across India.</p>`,
    meta_description: 'Learn about UCC Engineering Contractors - our history, mission, and commitment to excellence'
  }
];

const pageStmt = db.prepare(`
  INSERT OR IGNORE INTO pages (page_name, title, content, meta_description) 
  VALUES (?, ?, ?, ?)
`);

defaultPages.forEach(page => {
  pageStmt.run(page.page_name, page.title, page.content, page.meta_description);
});
console.log('Default pages created.');

// Insert default services
const defaultServices = [
  { name: 'AMC (Annual Maintenance Contract)', slug: 'amc-annual-maintenance-contract', description: 'Comprehensive annual maintenance contracts for power plant equipment ensuring optimal performance year-round.', icon: 'wrench', order_index: 1 },
  { name: 'Boiler Maintenance', slug: 'boiler-maintenance', description: 'Expert boiler maintenance, repair, and optimization services to ensure maximum efficiency and safety.', icon: 'fire', order_index: 2 },
  { name: 'ESP (Electrostatic Precipitator)', slug: 'esp-electrostatic-precipitator', description: 'Maintenance and repair of ESP systems for effective emission control and environmental compliance.', icon: 'wind', order_index: 3 },
  { name: 'APH (Air Preheater)', slug: 'aph-air-preheater', description: 'Air preheater maintenance and servicing to improve thermal efficiency and reduce fuel consumption.', icon: 'thermometer', order_index: 4 },
  { name: 'AHP (Auxiliary Heating Plant)', slug: 'ahp-auxiliary-heating-plant', description: 'Complete AHP maintenance and repair services for reliable auxiliary heating operations.', icon: 'bolt', order_index: 5 },
  { name: 'Hoist Operations', slug: 'hoist-operations', description: 'Professional hoist installation, maintenance, and repair services for safe material handling.', icon: 'anchor', order_index: 6 },
  { name: 'Shutdown Services', slug: 'shutdown-services', description: 'Planned shutdown coordination and execution with minimal downtime and maximum efficiency.', icon: 'pause', order_index: 7 },
  { name: 'Overhauling', slug: 'overhauling', description: 'Complete equipment overhauling services to extend equipment life and restore performance.', icon: 'gear', order_index: 8 }
];

const serviceStmt = db.prepare(`
  INSERT OR IGNORE INTO services (name, slug, description, icon, order_index) 
  VALUES (?, ?, ?, ?, ?)
`);

defaultServices.forEach(service => {
  serviceStmt.run(service.name, service.slug, service.description, service.icon, service.order_index);
});
console.log('Default services created.');

// Insert default clients
const defaultClients = [
  { name: 'WBPDCL (West Bengal Power Development Corporation Limited)', slug: 'wbpdcl', description: 'Major power generation company in West Bengal', order_index: 1 },
  { name: 'NTPC (National Thermal Power Corporation)', slug: 'ntpc', description: 'India\'s largest power generation company', order_index: 2 },
  { name: 'NSPCL (NTPC Sail Power Company Limited)', slug: 'nspcl', description: 'Joint venture power company', order_index: 3 },
  { name: 'DPL (Damodar Valley Corporation)', slug: 'dpl', description: 'Premier power generation organization', order_index: 4 },
  { name: 'DSTPS (Durgapur Steel Thermal Power Station)', slug: 'dstps', description: 'Thermal power station in Durgapur', order_index: 5 }
];

const clientStmt = db.prepare(`
  INSERT OR IGNORE INTO clients (name, slug, description, order_index) 
  VALUES (?, ?, ?, ?)
`);

defaultClients.forEach(client => {
  clientStmt.run(client.name, client.slug, client.description, client.order_index);
});
console.log('Default clients created.');

// Insert default home configuration
try {
  const homeConfigStmt = db.prepare(`INSERT INTO home_config (id) VALUES (1)`);
  homeConfigStmt.run();
  console.log('Default home configuration created.');
} catch (err) {
  if (err.message.includes('UNIQUE constraint failed')) {
    console.log('Home configuration already exists.');
  } else {
    throw err;
  }
}

db.close();
console.log('Database initialization complete!');
console.log('\nIMPORTANT: Default admin credentials:');
console.log('Username: admin');
console.log('Password: admin123');
console.log('\nPlease change the password after first login!');
