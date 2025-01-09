const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PartecipazionePartySchema = new Schema({
    utente_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
    },
    party_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Party',
        required: true,
    },
    data_partecipazione: {
        type: Date,
        required: true,
    },
});

const PartecipazioneParty = mongoose.model('PartecipazioneParty', PartecipazionePartySchema, 'PartecipazioneParty');

module.exports = PartecipazioneParty;
