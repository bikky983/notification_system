/**
 * Email Utility
 * 
 * Handles sending notification emails
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const config = require('../config/config');

// Register custom Handlebars helpers
handlebars.registerHelper('toLowerCase', function(str) {
    return str.toLowerCase();
});

/**
 * Create email transporter
 * @returns {object} Nodemailer transporter
 */
function createTransporter() {
    // Get email configuration
    const emailConfig = config.email;
    
    // Create a transporter based on the configuration
    return nodemailer.createTransport({
        service: emailConfig.service,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
}

/**
 * Load and compile an email template
 * @param {string} templateName - Name of the template file without extension
 * @returns {Function} Compiled Handlebars template
 */
function loadTemplate(templateName) {
    const templatePath = path.join(__dirname, '../templates', `${templateName}.html`);
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    return handlebars.compile(templateSource);
}

/**
 * Send a notification email
 * @param {string} subject - Email subject
 * @param {object} data - Data to be passed to the template
 * @returns {Promise} Promise that resolves when email is sent
 */
async function sendNotificationEmail(subject, data) {
    try {
        // Create mail transporter
        const transporter = createTransporter();
        
        // Load and compile the template
        const template = loadTemplate('stockAlert');
        
        // Generate HTML content
        const htmlContent = template(data);
        
        // Get recipients from config
        const recipients = config.email.recipients;
        
        if (!recipients || recipients.length === 0) {
            console.log('No recipients configured, skipping email send');
            return;
        }
        
        // Build email options
        const mailOptions = {
            from: config.email.from,
            to: recipients.join(', '),
            subject: config.email.subjectPrefix + subject,
            html: htmlContent
        };
        
        console.log(`Sending notification email to ${recipients.length} recipients`);
        
        // Send email
        const result = await transporter.sendMail(mailOptions);
        console.log(`Email sent: ${result.messageId}`);
        return result;
    } catch (error) {
        console.error('Error sending notification email:', error);
        throw error;
    }
}

module.exports = {
    sendNotificationEmail
};