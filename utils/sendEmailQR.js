import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import fs from 'fs/promises'; // Use fs/promises for async operations

// Function to generate QR code and save it as a file
const generateQRCodeFile = async (data) => {
    const filePath = './qrcode.png';
    await QRCode.toFile(filePath, data);
    return filePath;
};

// Function to send email with QR code as an attachment
const sendEmailWithQRCodeFile = async (userEmail, data) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const filePath = await generateQRCodeFile(data);

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: userEmail,
        subject: 'bookmydoctor QR Code',
        text: 'Download the attached QR code.',
        attachments: [{ filename: 'qrcode.png', path: filePath }]
    });

    await fs.unlink(filePath); // Delete local file after sending
};

export { sendEmailWithQRCodeFile };
