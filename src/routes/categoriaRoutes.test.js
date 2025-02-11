const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../index'); // Il tuo server Express
const Categoria = require('../model/Categoria');

let mongoServer;
let categoriaId;

describe('Categoria API Tests', () => {

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
        console.log('Database connected for testing!');

        const categoria = new Categoria({
            nome: 'Musica'
        });
        await categoria.save();
        categoriaId = categoria._id;
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
        console.log('Database connection closed after tests');
    });


    test('Recupera una categoria con id valido', async () => {
        const res = await request(app)
            .get(`/api/categoria/${categoriaId}`)
            .expect(200)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('_id', categoriaId.toString());
        expect(res.body).toHaveProperty('nome', 'Musica');
    });


    test('Recupera una categoria con id non valido', async () => {
        const res = await request(app)
            .get('/api/categoria/600c72b1f9d5f5bcdcbf6f25') // ID inesistente
            .expect(404)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('error', 'Categoria non trovata');
    });


    test('Recupera tutte le categorie', async () => {
        const res = await request(app)
            .get('/api/categoria')
            .expect(200)
            .expect('Content-Type', /json/);

        expect(res.body).toBeInstanceOf(Array);
        expect(res.body.length).toBeGreaterThan(0);
    });
});
