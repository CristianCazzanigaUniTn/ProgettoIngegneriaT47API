const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('./User'); 
const Evento = require('./Evento'); 

const PartecipazioneEventoSchema = new Schema({
    utente_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
    },
    evento_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evento', 
        required: true,
    },
    data_partecipazione: {
        type: Date,
        required: true,
    },
});

const PartecipazioneEvento = mongoose.model('PartecipazioneEvento', PartecipazioneEventoSchema, 'PartecipazioneEvento');

module.exports = PartecipazioneEvento;
