const mongoose = require('mongoose');

const Schema = mongoose.Schema;


const EventoSchema = new Schema({
    nome: {
        type: String,
        required: true
    },
    descrizione: {
        type: String,
        required: true
    },
    data_inizio: {
        type: Date,
        required: true
    },
    luogo: {
        type: String,
        required: true
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
    numero_massimo_partecipanti: {
        type: Number,
        required: true
    },
    foto: {
        type: String,
        required: true
    },
    Organizzatore: {
        type: Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    data_creazione: {
        type: Date,
        default: Date.now
    },
    Categoria: {
        type: Schema.Types.ObjectId,
        ref: 'Categoria', 
        required: true
    }
});


const Party = mongoose.model('Party', EventoSchema, 'Party');

module.exports = Party;
