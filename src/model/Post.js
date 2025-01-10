const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const posizioneSchema = new mongoose.Schema({
    latitudine: {
        type: Number,
        required: true,
    },
    longitudine: {
        type: Number,
        required: true,
    },
});

const postSchema = new Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        auto: true,
    },


    descrizione: {
        type: String,
        required: true,
    },


    contenuto: {
        type: String,
        required: true,
    },


    luogo: {
        type: String,
        required: true,
    },
    posizione: {
        latitudine: {
            type: Number,
            required: true,
        },
        longitudine: {
            type: Number,
            required: true,
        }
    },
    data_creazione: {
        type: Date,
        default: Date.now,
        required: true,
    },


    utente_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
});


const Post = mongoose.model('Post', postSchema, 'Post');

module.exports = Post;
