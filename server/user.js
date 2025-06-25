const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
    handle: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    password: { type: String, required: true },
    profilePic: { type: String, default: '' },
    videos: { type: [String], default: [] }
  });
  
  const User = mongoose.model('User', userSchema);
