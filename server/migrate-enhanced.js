/**
 * Database Migration Script
 * Adds new tables for enhanced business features
 */

const db = require('./database');

console.log('Running database migration for new features...');

try {
    // Create equipment/inventory table
    db.exec(`
        CREATE TABLE IF NOT EXISTS equipment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            model TEXT,
            serial_number TEXT,
            status TEXT DEFAULT 'Available',
            location TEXT,
            purchase_date TEXT,
            last_maintenance TEXT,
            next_maintenance TEXT,
            notes TEXT,
            image TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('✓ Equipment table created');

    // Create project status tracking table
    db.exec(`
        CREATE TABLE IF NOT EXISTS project_status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER,
            status TEXT DEFAULT 'Planning',
            progress INTEGER DEFAULT 0,
            start_date TEXT,
            target_date TEXT,
            actual_completion_date TEXT,
            assigned_to TEXT,
            priority TEXT DEFAULT 'Medium',
            notes TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
    `);
    console.log('✓ Project status table created');

    // Create maintenance schedule table
    db.exec(`
        CREATE TABLE IF NOT EXISTS maintenance_schedule (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER,
            service_type TEXT NOT NULL,
            scheduled_date TEXT NOT NULL,
            status TEXT DEFAULT 'Scheduled',
            assigned_team TEXT,
            estimated_duration TEXT,
            actual_duration TEXT,
            notes TEXT,
            completion_notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        )
    `);
    console.log('✓ Maintenance schedule table created');

    // Create notifications table
    db.exec(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            is_read INTEGER DEFAULT 0,
            link TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('✓ Notifications table created');

    // Create activity log table
    db.exec(`
        CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            entity_type TEXT,
            entity_id INTEGER,
            details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )
    `);
    console.log('✓ Activity log table created');

    // Insert sample equipment data
    const equipmentStmt = db.prepare(`
        INSERT INTO equipment (name, category, model, serial_number, status, location, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleEquipment = [
        ['Boiler Inspection Tools', 'Inspection', 'BI-2000', 'SN-001-2023', 'Available', 'Warehouse A', 'Complete inspection kit'],
        ['ESP Maintenance Kit', 'Maintenance', 'ESP-MK-500', 'SN-002-2023', 'In Use', 'Site - NTPC', 'Currently deployed'],
        ['APH Cleaning Equipment', 'Cleaning', 'APH-CL-300', 'SN-003-2023', 'Available', 'Warehouse B', 'Specialized cleaning tools'],
        ['Safety Harness Set', 'Safety', 'SH-PRO-100', 'SN-004-2023', 'Available', 'Warehouse A', 'Set of 10 harnesses'],
        ['Welding Equipment', 'Repair', 'WE-5000', 'SN-005-2023', 'Under Maintenance', 'Workshop', 'Scheduled for service']
    ];

    for (const equipment of sampleEquipment) {
        equipmentStmt.run(...equipment);
    }
    console.log('✓ Sample equipment data inserted');

    // Insert sample maintenance schedules
    const maintenanceStmt = db.prepare(`
        INSERT INTO maintenance_schedule (client_id, service_type, scheduled_date, status, assigned_team, estimated_duration)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const sampleMaintenance = [
        [1, 'Boiler Maintenance', today.toISOString().split('T')[0], 'In Progress', 'Team A', '8 hours'],
        [2, 'ESP Inspection', nextWeek.toISOString().split('T')[0], 'Scheduled', 'Team B', '6 hours'],
        [3, 'APH Overhauling', nextMonth.toISOString().split('T')[0], 'Scheduled', 'Team C', '12 hours']
    ];

    for (const schedule of sampleMaintenance) {
        maintenanceStmt.run(...schedule);
    }
    console.log('✓ Sample maintenance schedules inserted');

    // Insert sample notifications
    const notificationStmt = db.prepare(`
        INSERT INTO notifications (title, message, type, link)
        VALUES (?, ?, ?, ?)
    `);

    const sampleNotifications = [
        ['New Contact Submission', 'You have a new contact form submission', 'info', '/admin/submissions'],
        ['Equipment Maintenance Due', 'Welding Equipment requires maintenance', 'warning', '/admin/equipment'],
        ['Upcoming Maintenance', 'Scheduled maintenance for NTPC next week', 'info', '/admin/maintenance']
    ];

    for (const notification of sampleNotifications) {
        notificationStmt.run(...notification);
    }
    console.log('✓ Sample notifications inserted');

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNew features added:');
    console.log('- Equipment/Inventory Management');
    console.log('- Project Status Tracking');
    console.log('- Maintenance Scheduling');
    console.log('- Notifications System');
    console.log('- Activity Logging');

} catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
}

process.exit(0);
