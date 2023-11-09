const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer');
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

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/sendEmail', upload.array('imageUpload', 5), (req, res) => {
  const dataFromForm = req.body; // Contains form data
  const images = req.files; // Contains uploaded images
  const selectedTimes = dataFromForm.selectedTimes||[]; // Contains selected time slots

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  // Create an HTML email template with the JSON data in a table format
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Data from Local Server</title>
      <style>
        /* Styles for the email template */
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Data from Local Server</h1>
        <table>
          <tr>
            <th>Key</th>
            <th>Value</th>
          </tr>
          ${Object.entries(dataFromForm)
            .map(([key, value]) => `
              <tr>
                <td>${key}</td>
                <td>${value}</td>
              </tr>
            `)
            .join('')}
        </table>
        <h2>Selected Times</h2>
        <ul>
          ${selectedTimes
            .map(time => `
              <li>${time.day} - ${time.time}</li>
            `)
            .join('')}
        </ul>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: emailFrom,
    to: emailTo,
    subject: 'Data from Local Server - ' + Date.now(),
    html: htmlTemplate,
    attachments: [],
  };

  images.forEach((image, index) => {
    const fileName = `image_${index + 1}.png`;
    mailOptions.attachments.push({
      filename: fileName,
      content: image.buffer,
    });
  });

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email: ' + error);
      res.status(500).json({ message: 'Email sending failed' });
    } else {
      console.log('Email sent: ' + info.response);
      res.json({ message: 'Email sent successfully' });
    }
  });
});

app.listen(port, () => {
  console.log(`Local server is running on http://localhost:${port}`);
});
