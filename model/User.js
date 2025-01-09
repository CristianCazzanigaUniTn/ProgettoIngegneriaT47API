var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true, 
        trim: true, 
    },
    password: {
        type: String,
        required: true, 
    },
    nome: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
    },
    genere: {
        type: String,
        required: true,
    },
    data_registrazione: {
        type: Date,
        default: Date.now, 
    },
    preferenze_notifiche: {
        type: String,
        required: true,
    },
    ruolo: {
        type: String,
        required: true,
    },
    foto_profilo: {
        type: String,
        required: true,
    },
    verified: {
        type: Boolean,
        required: true,
    },
    foto_profilo: {
        type: String,
        required: true,
    },
    verified: {
        type: Boolean,
        required: true,
    },
    verificationToken: {
        type: String,
        required: false
    }

});

UserSchema.methods.comparePassword = function(password) {
    return password==this.password;
    // return bcrypt.compare(password, this.password); 
};

const User = mongoose.model('User', UserSchema, 'User');  

module.exports = User;