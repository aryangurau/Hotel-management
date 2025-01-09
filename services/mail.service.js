const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendEmail = async ({ to, subject, text, html }) => {
    try {
        // For development, just log the email
        if (process.env.NODE_ENV !== 'production') {
            console.log('Email would be sent in production:');
            console.log('To:', to);
            console.log('Subject:', subject);
            console.log('Text:', text);
            return;
        }

        // Send mail with defined transport object
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Hotel Management" <noreply@hotel.com>',
            to,
            subject,
            text,
            html
        });

        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        // Don't throw error as email sending should not break the main flow
    }
};

module.exports = {
    sendEmail
};
