const sqlite3 = require('sqlite3').verbose();

// Test creating a ticket directly in the database
async function testTicketCreation() {
    console.log('Testing direct ticket creation...');
    
    const db = new sqlite3.Database('./signups.db', (err) => {
        if (err) {
            console.error('Error opening database:', err);
            return;
        }
        console.log('✓ Connected to SQLite database');
    });
    
    // Generate unique ticket code
    const generateTicketCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };
    
    const testEmail = 'adrienne@sourcegraph.com';
    const testTicketCode = generateTicketCode();
    const testPaymentIntentId = 'pi_test_' + Date.now();
    
    // Insert test ticket
    db.run(
        `INSERT INTO tickets (email, ticket_type, price, stripe_payment_intent_id, status, ticket_code) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [testEmail, 'general_admission', 2000, testPaymentIntentId, 'confirmed', testTicketCode],
        function(err) {
            if (err) {
                console.error('✗ Database insert error:', err);
            } else {
                console.log(`✓ Test ticket created successfully!`);
                console.log(`  Email: ${testEmail}`);
                console.log(`  Ticket Code: ${testTicketCode}`);
                console.log(`  Database ID: ${this.lastID}`);
                
                // Verify it was created
                db.get(
                    'SELECT * FROM tickets WHERE id = ?',
                    [this.lastID],
                    (err, row) => {
                        if (err) {
                            console.error('✗ Database query error:', err);
                        } else if (row) {
                            console.log('✓ Ticket verified in database:', row);
                        } else {
                            console.error('✗ Ticket not found in database');
                        }
                        
                        db.close();
                    }
                );
            }
        }
    );
}

testTicketCreation().catch(console.error);
