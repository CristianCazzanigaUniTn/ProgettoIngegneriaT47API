const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  data_creazione: {
    type: Date,
    default: Date.now,
  },
  utente_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  
    required: true,
  },
  post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post', 
    required: true,
  },
});


const Like = mongoose.model('Like', likeSchema, 'Like');

module.exports = Like;
