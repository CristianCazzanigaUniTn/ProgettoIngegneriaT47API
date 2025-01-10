const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const CommentoSchema = new Schema({
    commento: { 
        type: String,
        required: true,
        trim: true,
    },
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
    like: [{ 
        utente_id: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', 
            required: true,
        },
        data_creazione: { 
            type: Date,
            default: Date.now,
        }
    }]
});


const Commento = mongoose.model('Commento', CommentoSchema, 'Commento');

module.exports = Commento;
