const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../index'); 
const Post = require('../model/Post'); // Modello Post
const User = require('../model/User'); // Modello User
const SECRET = process.env.SECRET;

let mongoServer;
let userBaseToken, organizerToken, userBase, organizer;

describe('POST API Tests', () => {

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Database connected for testing!');

        userBase = new User({
            username: 'testuser',
            password: 'password123',
            nome: 'Test User Base',
            email: 'userbase@example.com',
            genere: 'M',
            preferenze_notifiche: 'email',
            ruolo: 'utente_base',
            foto_profilo: 'https://example.com/dummy.jpg',
            verified: true
        });
        await userBase.save();





        userBaseToken = generateToken(userBase._id, 'utente_base');

        userId = userBase._id;

    });


    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
        console.log('Database connection closed after tests');
    });

    const generateToken = (userId, role) => {
        return jwt.sign({ _id: userId, ruolo: role }, SECRET, { expiresIn: '1h' });
    };












    // ---------------------- Sezione test estrazione post ------------------------------------------------------//

    // ---------------------- Sezione test estrazione post positiva ------------------------------------------------------//
    test('Estrazione dell’utente tramite id corretto', async () => {
        const res = await request(app)
            .get(`/api/Utenti/${userId}`)
            .expect(200)
            .expect('Content-Type', /json/);

        expect(res.body).toBeDefined();
    });

    //----------------------------------------------------------------------------------------------------------------------------------//
    

    // ---------------------- Sezione test estrazione post negativa ------------------------------------------------------//
    test('Estrazione dell’utente tramite id mancante', async () => {
        const res = await request(app)
            .get('/api/Utenti/')  // ID non valido
            .expect(404)
        expect(res.body).toBeDefined();
    });

    test('Estrazione dell’utente tramite id non valido', async () => {
        const res = await request(app)
            .get('/api/Utenti/6735e4672b45400acaf45601')  // ID che non esiste nel database
            .expect(404)
            .expect('Content-Type', /json/);
        expect(res.body).toHaveProperty('message', 'Utente non trovato');
        expect(res.body).toHaveProperty('success', false);
    });

    //----------------------------------------------------------------------------------------------------------------------------------//










    // ---------------------- Sezione test creazione post ------------------------------------------------------//

    // ---------------------- Sezione test creazione positiva ------------------------------------------------------//  
    test('Creazione di un account in modo corretto con tutti i campi richiesti.', async () => {
        const userData = {
            nome: 'test name',
            username: 'TestUsername',
            email: 'test@mail.it',
            password: 'testpassword',
            genere: 'male',
            data_registrazione: new Date(),
            preferenze_notifiche: 'email',
            ruolo: 'organizzatore',
            foto_profilo: 'testfoto',
            verificationToken: 'testtoken'
        };

        const res = await request(app)
            .post('/api/Utenti')
            .send(userData)
            .expect(201)
            .expect('Content-Type', /json/);

    });
    //----------------------------------------------------------------------------------------------------------------------------------//

    // ---------------------- Sezione test creazione negativa ------------------------------------------------------//  
    test('Creazione di un account specificando uno username già esistente.', async () => {
        const userData = {
            nome: 'test name',
            username: 'testuser',       //username già usato
            email: 'test@mail.it',
            password: 'testpassword',
            genere: 'male',
            data_registrazione: new Date(),
            preferenze_notifiche: 'email',
            ruolo: 'organizzatore',
            foto_profilo: 'testfoto',
            verificationToken: 'testtoken'
        };

        const res = await request(app)
            .post('/api/Utenti')
            .send(userData)
            .expect(400)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('message', 'Registrazione fallita, mail già esistente');
    });

    test('Creazione di un account specificando una mail già esistente.', async () => {
        const userData = {
            nome: 'test name',
            username: 'TestUsername',
            email: 'userbase@example.com',      //email già esistente
            password: 'testpassword',
            genere: 'male',
            data_registrazione: new Date(),
            preferenze_notifiche: 'email',
            ruolo: 'organizzatore',
            foto_profilo: 'testfoto',
            verificationToken: 'testtoken'
        };

        const res = await request(app)
            .post('/api/Utenti')
            .send(userData)
            .expect(400)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('message', 'Registrazione fallita, mail già esistente');
    });

    test('Creazione di un account con tutti i campi ma con la mail che non rispetta il formato corretto.', async () => {
        const userData = {
            nome: 'test name',
            username: 'user test',
            email: 'testemail',      //email non supporta il formato
            password: 'testpassword',
            genere: 'male',
            data_registrazione: new Date(),
            preferenze_notifiche: 'email',
            ruolo: 'organizzatore',
            foto_profilo: 'testfoto',
            verificationToken: 'testtoken'
        };

        const res = await request(app)
            .post('/api/Utenti')
            .send(userData)
            .expect(500)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('message', 'Server error');
    });

    test('Creazione di un account non specificando almeno un campo', async () => {
        const userData = {
            nome: 'test name',
            username: 'TestUsername',
            email: 'test@mail.it',
            password: 'testpassword',
            genere: 'male',
            data_registrazione: new Date(),     //mancano preferene_notifiche
            ruolo: 'organizzatore',
            foto_profilo: 'testfoto',
            verificationToken: 'testtoken'
        };

        const res = await request(app)
            .post('/api/Utenti')
            .send(userData)
            .expect(400)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('message', 'Campi mancanti');
    });


});













