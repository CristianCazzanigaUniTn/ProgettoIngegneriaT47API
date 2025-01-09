const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategoriaSchema = new Schema({
  nome: {
    type: String,
    required: true, 
  },
});

const Categoria = mongoose.model('Categoria', CategoriaSchema, 'Categoria');

module.exports = Categoria;