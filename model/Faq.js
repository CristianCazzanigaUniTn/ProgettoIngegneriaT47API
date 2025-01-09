var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FaqSchema = new Schema({
    
    evento: {
        type: Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    utente: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    domanda: {
        type: String,
        required: true,
        trim: true,
    },
    risposta: {
        type: String,
        trim: true,
    },
    data_creazione: {
        type: Date,
        default: Date.now,
    },

});

const Faq = mongoose.model('Faq', FaqSchema, 'Faq');
module.exports = Faq;
