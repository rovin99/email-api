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
  const dataToSend = req.body;
  const images = req.files;
  const latestValues = JSON.parse(dataToSend.latestValues);
  const selectedTimes=JSON.parse(dataToSend.selectedTimes) || [];
  const transporter = nodemailer.createTransport({
    service: 'websmtp.simply.com',
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
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
      }
  
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
  
      h1 {
        background-color: #007BFF;
        color: #fff;
        padding: 10px;
        text-align: center;
      }
  
      table {
        width: 100%;
        border-collapse: collapse;
        background-color: #fff;
      }
  
      th, td {
        padding: 8px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }
  
      th {
        background-color: #007BFF;
        color: #fff;
      }
  
      tr:nth-child(even) {
        background-color: #f2f2f2;
      }
  
      @media screen and (max-width: 600px) {
        table {
          width: 100%;
        }
      }
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
        ${Object.entries(latestValues)
          .map(([key, value]) => `
            <tr>
              <td>${key}</td>
              <td>${value}</td>
            </tr>
          `)
          .join('')}
      </table>
      <table>
      <tr>
        <th>Day</th>
        <th>Time</th>
      </tr>
      ${selectedTimes
        .map(item => `
          <tr>
            <td>${item.day}</td>
            <td>${item.time}</td>
          </tr>
        `)
        .join('')}
    </table>
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
    const fileName = `image_${index + 1}.png`; // You can choose the file name as per your preference
    mailOptions.attachments.push({
      filename: fileName,
      content: image.buffer, // Buffer containing the image data
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
