const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'database.db'));
db.pragma('foreign_keys = ON');

console.log('Running database migrations...');

// Add company_logo and background_image columns to contact_info if they don't exist
try {
  // Check if columns exist
  const tableInfo = db.prepare("PRAGMA table_info(contact_info)").all();
  const columnNames = tableInfo.map(col => col.name);
  
  if (!columnNames.includes('company_logo')) {
    db.prepare('ALTER TABLE contact_info ADD COLUMN company_logo TEXT').run();
    console.log('Added company_logo column to contact_info table');
  } else {
    console.log('company_logo column already exists');
  }
  
  if (!columnNames.includes('background_image')) {
    db.prepare('ALTER TABLE contact_info ADD COLUMN background_image TEXT').run();
    console.log('Added background_image column to contact_info table');
  } else {
    console.log('background_image column already exists');
  }
} catch (err) {
  console.error('Migration error:', err);
}

db.close();
console.log('Migration complete!');
