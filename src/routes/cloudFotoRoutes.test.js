const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../index'); 
const User = require('../model/User'); // Modello User
const SECRET = process.env.SECRET;

let mongoServer;
let organizzatoreToken, UtenteBaseToken, idOrganizzatore, idUtenteBase;

describe('URL Caricamento Immagini API Tests', () => {

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
        console.log('Database connected for testing!');

        // Creazione utente organizzatore
        organizer = new User({
            username: 'organizeruser',
            password: 'organizerpassword123',
            nome: 'Organizer User',
            email: 'organizer@example.com',
            genere: 'M',
            preferenze_notifiche: 'email',
            ruolo: 'organizzatore',
            foto_profilo: 'https://example.com/organizer.jpg',
            verified: true
        });
        await organizer.save();
        idOrganizzatore = organizer._id;
        organizzatoreToken = generateToken(organizer._id, 'organizzatore');


        utenteBase = new User({
            username: 'utentebase',
            password: 'utentebasepassword123',
            nome: 'utentebase User',
            email: 'utentebase@example.com',
            genere: 'M',
            preferenze_notifiche: 'email',
            ruolo: 'organizzatore',
            foto_profilo: 'https://example.com/utentebase.jpg',
            verified: true
        });
        await utenteBase.save();
        idUtenteBase = utenteBase._id;
        UtenteBaseToken = generateToken(utenteBase._id, 'utente_base');
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




    // ---------------------- Sezione test estrazione URL immagini Post ------------------------------------------------------//

    test('Restituzione URL sicuro per utente base con token valido', async () => {
        const res = await request(app)
            .post('/generate-signed-url-post')
            .set('Authorization', `Bearer ${UtenteBaseToken}`)
            .expect(200)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('signature');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('upload_preset', 'Post');
    });

    test('Restituzione errore se il token è mancante', async () => {
        const res = await request(app)
            .post('/generate-signed-url-post')
            .expect(401);

        expect(res.body).toHaveProperty('message', 'No token provided');
        expect(res.body).toHaveProperty('success', false);
    });


    test('Restituzione errore se l\'utente non è un utente_base', async () => {
        const res = await request(app)
            .post('/generate-signed-url-post')
            .set('Authorization', `Bearer ${organizzatoreToken}`)
            .expect(403);

        expect(res.body).toHaveProperty('error', 'Solo utente_base può accedere a questo endpoint.');
    });

    //----------------------------------------------------------------------------------------------------------------------------------//

    // ---------------------- Sezione test estrazione URL immagini Party ------------------------------------------------------//

    describe('Generazione URL sicuro per caricamento immagine - Party', () => {

        test('Restituzione URL sicuro per utente base con token valido', async () => {
            const res = await request(app)
                .post('/generate-signed-url-party')
                .set('Authorization', `Bearer ${UtenteBaseToken}`)
                .expect(200)
                .expect('Content-Type', /json/);

            expect(res.body).toHaveProperty('signature');
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('upload_preset', 'Party');
        });

        test('Restituzione errore se il token è mancante', async () => {
            const res = await request(app)
                .post('/generate-signed-url-party')
                .expect(401);

            expect(res.body).toHaveProperty('message', 'No token provided');
            expect(res.body).toHaveProperty('success', false);
        });

        test('Restituzione errore se l\'utente non è un utente_base', async () => {
            const res = await request(app)
                .post('/generate-signed-url-party')
                .set('Authorization', `Bearer ${organizzatoreToken}`)
                .expect(403);

            expect(res.body).toHaveProperty('error', 'Solo utente_base può accedere a questo endpoint.');
        });
    });


    //----------------------------------------------------------------------------------------------------------------------------------//


    // ---------------------- Sezione test estrazione URL immagini Eventi ------------------------------------------------------//
    describe('Generazione URL sicuro per caricamento immagine - Eventi', () => {

        test('Restituzione URL sicuro per organizzatore con token valido', async () => {
            const validToken = 'Bearer <token_valid_organizzatore>';
            const res = await request(app)
                .post('/generate-signed-url-Eventi')
                .set('Authorization', `Bearer ${organizzatoreToken}`)
                .expect(200)
                .expect('Content-Type', /json/);

            expect(res.body).toHaveProperty('signature');
            expect(res.body).toHaveProperty('timestamp');
            expect(res.body).toHaveProperty('upload_preset', 'Eventi');
        });

        test('Restituzione errore se il token è mancante', async () => {
            const res = await request(app)
                .post('/generate-signed-url-Eventi')
                .expect(401);

            expect(res.body).toHaveProperty('message', 'No token provided');
            expect(res.body).toHaveProperty('success', false);
        });

        test('Restituzione errore se l\'utente non è un organizzatore', async () => {
            const res = await request(app)
                .post('/generate-signed-url-Eventi')
                .set('Authorization', `Bearer ${UtenteBaseToken}`)
                .expect(403);

            expect(res.body).toHaveProperty('error', 'Solo l\'organizzatore può accedere a questo endpoint.');
        });
    });


    //----------------------------------------------------------------------------------------------------------------------------------//


});
