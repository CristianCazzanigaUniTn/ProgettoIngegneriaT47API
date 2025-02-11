const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../index'); 
const User = require('../model/User'); // Modello User

let mongoServer;
let utenteBaseId;
const SECRET = process.env.SECRET;

describe('User Authentication API Tests', () => {

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
        console.log('Database connected for testing!');

        // Creazione utente base non verificato
        const utenteBase = new User({
            username: 'utentebase',
            password: 'utentebasepassword123',
            nome: 'Utente Base',
            email: 'utentebase@example.com',
            genere: 'M',
            preferenze_notifiche: 'email',
            ruolo: 'utente_base',
            foto_profilo: 'https://example.com/utentebase.jpg',
            verified: true
        });
        await utenteBase.save();
        utenteBaseId = utenteBase._id;

        // Generazione del token per l'utente base
        utenteBaseToken = generateToken(utenteBase._id, 'utente_base');
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

    // 1. Accesso ad un account verificato con credenziali corrette
    test('Accesso ad un account verificato con credenziali corrette', async () => {
        const res = await request(app)
            .post('/api/v1/authentications')
            .send({
                username: 'utentebase',
                password: 'utentebasepassword123'
            })
            .expect(200);
        
        expect(res.body).toHaveProperty('message', 'Autenticazione avvenuta con successo');
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('username', 'utentebase');
    });

    // 2. Accesso ad un account non verificato con credenziali corrette
    test('Accesso ad un account non verificato con credenziali corrette', async () => {
        await User.updateOne({ _id: utenteBaseId }, { verified: false });
        const res = await request(app)
            .post('/api/v1/authentications')
            .send({
                username: 'utentebase',
                password: 'utentebasepassword123'
            })
            .expect(401);
        
        expect(res.body).toHaveProperty('message', 'Autenticazione fallita, account non verificato');

        await User.updateOne({ _id: utenteBaseId }, { verified: true });
    });

    // 3. Accesso ad un account con credenziali sbagliate
    test('Accesso ad un account con credenziali sbagliate', async () => {
        const res = await request(app)
            .post('/api/v1/authentications')
            .send({
                username: 'utentebase',
                password: 'wrongpassword123'
            })
            .expect(401);
        
        expect(res.body).toHaveProperty('message', 'Autenticazione fallita');
    });

    // 4. Accesso ad un account non specificando lo username
    test('Accesso ad un account non specificando lo username', async () => {
        const res = await request(app)
            .post('/api/v1/authentications')
            .send({
                password: 'utentebasepassword123'
            })
            .expect(401);
        
        expect(res.body).toHaveProperty('message', 'Autenticazione fallita');
    });

    // 5. Accesso ad un account non specificando la password
    test('Accesso ad un account non specificando la password', async () => {
        const res = await request(app)
            .post('/api/v1/authentications')
            .send({
                username: 'utentebase'
            })
            .expect(401);
        
        expect(res.body).toHaveProperty('message', 'Autenticazione fallita');
    });

    
});
