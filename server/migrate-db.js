const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'database.db'));
db.pragma('foreign_keys = ON');

console.log('Running database migrations...');

// Helper function to check if column exists
function columnExists(tableName, columnName) {
  const tableInfo = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return tableInfo.some(col => col.name === columnName);
}

// Helper function to check if table exists
function tableExists(tableName) {
  const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(tableName);
  return !!result;
}

try {
  // Add company_logo and background_image columns to contact_info if they don't exist
  if (!columnExists('contact_info', 'company_logo')) {
    db.prepare('ALTER TABLE contact_info ADD COLUMN company_logo TEXT').run();
    console.log('Added company_logo column to contact_info table');
  }
  
  if (!columnExists('contact_info', 'background_image')) {
    db.prepare('ALTER TABLE contact_info ADD COLUMN background_image TEXT').run();
    console.log('Added background_image column to contact_info table');
  }

  // Add google_map_embed column to contact_info for Google Maps support
  if (!columnExists('contact_info', 'google_map_embed')) {
    db.prepare('ALTER TABLE contact_info ADD COLUMN google_map_embed TEXT').run();
    console.log('Added google_map_embed column to contact_info table');
  }

  // Add GST number column to contact_info
  if (!columnExists('contact_info', 'gst_number')) {
    db.prepare('ALTER TABLE contact_info ADD COLUMN gst_number TEXT').run();
    console.log('Added gst_number column to contact_info table');
  }

  // Add slug column to services table for dynamic URLs
  if (!columnExists('services', 'slug')) {
    db.prepare('ALTER TABLE services ADD COLUMN slug TEXT').run();
    console.log('Added slug column to services table');
    // Generate slugs for existing services
    const services = db.prepare('SELECT id, name FROM services').all();
    const updateStmt = db.prepare('UPDATE services SET slug = ? WHERE id = ?');
    services.forEach(service => {
      const slug = service.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      updateStmt.run(slug, service.id);
    });
    console.log('Generated slugs for existing services');
  }

  // Add image column to services table
  if (!columnExists('services', 'image')) {
    db.prepare('ALTER TABLE services ADD COLUMN image TEXT').run();
    console.log('Added image column to services table');
  }

  // Add detailed_description column to services table
  if (!columnExists('services', 'detailed_description')) {
    db.prepare('ALTER TABLE services ADD COLUMN detailed_description TEXT').run();
    console.log('Added detailed_description column to services table');
  }

  // Add slug column to clients table for dynamic URLs
  if (!columnExists('clients', 'slug')) {
    db.prepare('ALTER TABLE clients ADD COLUMN slug TEXT').run();
    console.log('Added slug column to clients table');
    // Generate slugs for existing clients
    const clients = db.prepare('SELECT id, name FROM clients').all();
    const updateStmt = db.prepare('UPDATE clients SET slug = ? WHERE id = ?');
    clients.forEach(client => {
      const slug = client.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      updateStmt.run(slug, client.id);
    });
    console.log('Generated slugs for existing clients');
  }

  // Add website column to clients table
  if (!columnExists('clients', 'website')) {
    db.prepare('ALTER TABLE clients ADD COLUMN website TEXT').run();
    console.log('Added website column to clients table');
  }

  // Add detailed_description column to clients table
  if (!columnExists('clients', 'detailed_description')) {
    db.prepare('ALTER TABLE clients ADD COLUMN detailed_description TEXT').run();
    console.log('Added detailed_description column to clients table');
  }

  // Add category column to projects table
  if (!columnExists('projects', 'category')) {
    db.prepare('ALTER TABLE projects ADD COLUMN category TEXT').run();
    console.log('Added category column to projects table');
  }

  // Create team_members table
  if (!tableExists('team_members')) {
    db.exec(`
      CREATE TABLE team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        position TEXT,
        bio TEXT,
        photo TEXT,
        email TEXT,
        phone TEXT,
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created team_members table');
  }

  // Create home_config table for hero settings and statistics
  if (!tableExists('home_config')) {
    db.exec(`
      CREATE TABLE home_config (
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
      )
    `);
    // Insert default row
    db.prepare(`INSERT INTO home_config (id) VALUES (1)`).run();
    console.log('Created home_config table with default values');
  }

  // Create session_log table for admin security
  if (!tableExists('session_log')) {
    db.exec(`
      CREATE TABLE session_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('Created session_log table');
  }

  // Add GPS coordinates columns to contact_info for company location
  if (!columnExists('contact_info', 'gps_latitude')) {
    db.prepare('ALTER TABLE contact_info ADD COLUMN gps_latitude REAL').run();
    console.log('Added gps_latitude column to contact_info table');
  }
  
  if (!columnExists('contact_info', 'gps_longitude')) {
    db.prepare('ALTER TABLE contact_info ADD COLUMN gps_longitude REAL').run();
    console.log('Added gps_longitude column to contact_info table');
  }

  console.log('All migrations completed successfully!');
} catch (err) {
  console.error('Migration error:', err);
}

db.close();
console.log('Migration complete!');
