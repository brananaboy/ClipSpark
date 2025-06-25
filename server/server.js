const express = require('express');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose')
const User = require('./user')
const app = express();
const port = 3000;
//initiating .env
require('dotenv').config({path:__dirname + '/.env'})
const mongodbConnection = process.env.MONGODB_URI
app.use(cors());
app.use(express.json());

//initiating Mongodb connection
mongoose.connect(mongodbConnection)

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});
// Define the uploads directory relative to this file
const uploadsDir = path.join(__dirname, 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Use multer with diskStorage to preserve original file extensions
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    // Use timestamp + original file extension for the filename
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });

// Serve your frontend files (assuming frontend files are one folder up from server folder)
app.use(express.static(path.join(__dirname, '..')));

// Serve uploaded videos statically under /uploads route
app.use('/uploads', express.static(uploadsDir));

// Register endpoint
app.post('/register', async (req, res) => {
  const { handle, displayName, password } = req.body;
  if (!handle || !displayName || !password) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  try {
    // Check if handle already exists
    const existing = await User.findOne({ handle: new RegExp('^' + handle + '$', 'i') });
    if (existing) {
      return res.status(400).json({ error: 'Handle already taken.' });
    }

    const user = new User({ handle, displayName, password });
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { handle, password } = req.body;
  if (!handle || !password) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const user = await User.findOne({ handle, password });
    if (!user) {
      return res.status(400).json({ error: 'Invalid handle or password.' });
    }

    const { password: _, ...userInfo } = user.toObject();
    res.json({ success: true, user: userInfo });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Upload video endpoint
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  // Send back the filename so frontend can build video URL
  res.json({ success: true, filename: req.file.filename });
});
// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
});
