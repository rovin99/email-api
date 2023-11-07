const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();
 // Choose a port for your local server
require('dotenv').config();

const port = process.env.PORT;
const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_PASS;
const emailFrom = process.env.EMAIL_FROM;
const emailTo = process.env.EMAIL_TO;
const corsOrigin = process.env.CORS_ORIGIN;

// Middleware to parse JSON data in POST requests
app.use(bodyParser.json());

app.use(cors({
  origin: corsOrigin,
}));

// Handle POST requests
app.post('/sendEmail', (req, res) => {
  const dataToSend = req.body; // Received data from the client
  
  // Create a Nodemailer transporter and send an email with the received data
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  const mailOptions = {
    from: emailFrom,
    to: emailTo,
    subject: 'Data from local server',
    text: JSON.stringify(dataToSend), // Convert the data to a string
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
});

// Start the local server
app.listen(port, () => {
  console.log(`Local server is running on http://localhost:${port}`);
});
