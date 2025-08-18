const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
require('dotenv').config();

// Email templates
const EMAIL_TEMPLATES = {
    welcome: {
        subject: 'Welcome to Amp Arena! 🏗️',
        html: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px 20px;">
                <h1 style="color: #4a7c59; text-align: center; font-size: 2.5em; margin-bottom: 30px;">AMP ARENA</h1>
                <p style="font-size: 18px; line-height: 1.6;">Welcome to the ultimate developer competition!</p>
                <p>You're now registered for updates about:</p>
                <ul style="font-size: 16px; line-height: 1.8;">
                    <li><strong>4 Qualifying Rounds</strong> - September 15th through October</li>
                    <li><strong>16 Final Seats</strong> - Only the best make it to San Francisco</li>
                    <li><strong>$1,000,000 Prize</strong> - Winner takes all on October 29th</li>
                </ul>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://build-olympics.onrender.com" style="background: linear-gradient(45deg, #2d5a3d, #4a7c59); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">View Landing Page</a>
                </div>
                <p style="color: #999; font-size: 14px;">Stay tuned for more details about the qualifying challenges!</p>
            </div>
        `
    },
    
    reminder: {
        subject: 'Amp Arena Qualifying Starts Tomorrow! 🚀',
        html: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 40px 20px;">
                <h1 style="color: #4a7c59; text-align: center; font-size: 2.5em; margin-bottom: 30px;">AMP ARENA</h1>
                <p style="font-size: 20px; text-align: center; margin-bottom: 30px;"><strong>The first qualifying challenge opens tomorrow!</strong></p>
                <p>Are you ready to compete for your chance at the $1,000,000 prize?</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://build-olympics.onrender.com" style="background: linear-gradient(45deg, #2d5a3d, #4a7c59); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">Join the Competition</a>
                </div>
            </div>
        `
    }
};

class EmailNotifier {
    constructor() {
        this.transporter = nodemailer.createTransporter({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        
        this.db = new sqlite3.Database('./signups.db');
    }

    async getSignups(onlyUnnotified = false) {
        return new Promise((resolve, reject) => {
            const query = onlyUnnotified 
                ? 'SELECT * FROM signups WHERE notified = FALSE ORDER BY created_at'
                : 'SELECT * FROM signups ORDER BY created_at';
            
            this.db.all(query, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async markAsNotified(id) {
        return new Promise((resolve, reject) => {
            this.db.run('UPDATE signups SET notified = TRUE WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async sendEmail(to, template, customData = {}) {
        const emailTemplate = EMAIL_TEMPLATES[template];
        if (!emailTemplate) {
            throw new Error(`Template ${template} not found`);
        }

        const mailOptions = {
            from: `Amp Arena <${process.env.EMAIL_USER}>`,
            to,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            console.log(`Email sent to ${to}:`, result.messageId);
            return result;
        } catch (error) {
            console.error(`Failed to send email to ${to}:`, error);
            throw error;
        }
    }

    async sendBulkNotification(template, onlyUnnotified = true) {
        try {
            const signups = await this.getSignups(onlyUnnotified);
            console.log(`Sending ${template} emails to ${signups.length} recipients`);

            let successCount = 0;
            let errorCount = 0;

            for (const signup of signups) {
                try {
                    await this.sendEmail(signup.email, template);
                    await this.markAsNotified(signup.id);
                    successCount++;
                    
                    // Add small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    console.error(`Failed to send to ${signup.email}:`, error);
                    errorCount++;
                }
            }

            console.log(`Bulk notification complete: ${successCount} sent, ${errorCount} failed`);
            return { success: successCount, failed: errorCount };
        } catch (error) {
            console.error('Bulk notification error:', error);
            throw error;
        }
    }

    close() {
        this.db.close();
    }
}

// CLI usage
if (require.main === module) {
    const notifier = new EmailNotifier();
    
    const template = process.argv[2] || 'welcome';
    
    console.log(`Starting bulk ${template} notification...`);
    
    notifier.sendBulkNotification(template)
        .then((result) => {
            console.log('Notification complete:', result);
            notifier.close();
        })
        .catch((error) => {
            console.error('Notification failed:', error);
            notifier.close();
            process.exit(1);
        });
}

module.exports = EmailNotifier;
