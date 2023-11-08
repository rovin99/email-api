const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();
const fs = require('fs'); 
require('dotenv').config();

const port = process.env.PORT;
const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_PASS;
const emailFrom = process.env.EMAIL_FROM;
const emailTo = process.env.EMAIL_TO;
const corsOrigin = process.env.CORS_ORIGIN;

app.use(bodyParser.json());

app.use(cors({
  origin: corsOrigin,
}));
const uploadDirectory = './uploads';

// Create the uploads directory if it doesn't exist
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory);
}

// Middleware for serving uploaded files
app.use('/uploads', express.static('uploads'));


app.post('/sendEmail', (req, res) => {
  const dataToSend = req.body;

  // Check if there are files uploaded
  if (req.files && req.files.length > 0) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    // Create an array to store file paths
    const filePaths = [];

    // Move uploaded files to the 'uploads' directory
    req.files.forEach((file, index) => {
      const filePath = `${uploadDirectory}/${file.originalname}`;
      fs.writeFileSync(filePath, file.buffer);
      filePaths.push(filePath);
    });

    // Create download links for the uploaded files
    const downloadLinks = filePaths.map((filePath) => {
      return `${req.protocol}://${req.get('host')}/${filePath}`;
    });

    // Create an HTML email template with download links
    const htmlTemplate = `
      <!-- ... Your email template ... -->
      <p>Uploaded Files:</p>
      <ul>
        ${downloadLinks.map((link) => `<li><a href="${link}" target="_blank" download>Download</a></li>`).join('')}
      </ul>
      <!-- ... Your email template ... -->
    `;

    const mailOptions = {
      from: emailFrom,
      to: emailTo,
      subject: 'Data from Local Server - ' + Date.now(),
      html: htmlTemplate,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email: ' + error);
        res.status(500).json({ message: 'Email sending failed' });
      } else {
        console.log('Email sent: ' + info.response);
        res.json({ message: 'Email sent successfully' });
      }
    });
  } else {
    // No files were uploaded, so you can send the email without download links
    sendEmailWithoutAttachments(dataToSend)
      .then(() => {
        res.json({ message: 'Email sent successfully' });
      })
      .catch((error) => {
        console.error('Error sending email: ' + error);
        res.status(500).json({ message: 'Email sending failed' });
      });
  }
});

function sendEmailWithoutAttachments(dataToSend) {
  return new Promise((resolve, reject) => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    // Create an HTML email template without download links
    const htmlTemplate = `
      <!-- ... Your email template ... -->
      <p>No files were uploaded.</p>
      <!-- ... Your email template ... -->
    `;

    const mailOptions = {
      from: emailFrom,
      to: emailTo,
      subject: 'Data from Local Server - ' + Date.now(),
      html: htmlTemplate,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

app.listen(port, () => {
  console.log(`Local server is running on http://localhost:${port}`);
});