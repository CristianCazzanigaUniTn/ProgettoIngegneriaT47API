const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../index'); 
const Faq = require('../model/Faq'); // Modello Faq
const User = require('../model/User'); // Modello User
const Evento = require('../model/Evento'); // Modello User
const SECRET = process.env.SECRET;

let mongoServer;

let utenteBaseId, idOrganizzatore, eventoId, Faqid, utenteBaseToken, organizzatoreToken, FaqidSenzaEvento;

describe('FAQ API Tests', () => {
    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
        console.log('Database connected for testing!');



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
        organizzatoreToken = jwt.sign({ _id: idOrganizzatore, ruolo: 'organizzatore' }, SECRET, { expiresIn: '1h' });


        const utenteBase = new User({
            username: 'utentebase',
            password: 'utentebasepassword123',
            nome: 'utentebase User',
            email: 'utentebase@example.com',
            genere: 'M',
            preferenze_notifiche: 'email',
            ruolo: 'utente_base',
            foto_profilo: 'https://example.com/utentebase.jpg',
            verified: true
        });
        await utenteBase.save();
        utenteBaseId = utenteBase._id;
        utenteBaseToken = jwt.sign({ _id: utenteBaseId, ruolo: 'utente_base' }, SECRET, { expiresIn: '1h' });


        evento = new Evento({
            nome: 'Evento del Comune',
            descrizione: 'Incontro pubblico organizzato dal Comune di Trento',
            data_inizio: new Date('2025-05-10'),
            luogo: 'Piazza del Duomo, Trento, Italy',
            posizione: { latitudine: 46.0664, longitudine: 11.1211 },
            numero_massimo_partecipanti: 200,
            foto: 'https://res.cloudinary.com/dc2ga9rlo/image/upload/v1738751764/shsov0kr4hkeak8qx5wq.jpg',
            Organizzatore: organizer._id,
            Categoria: new mongoose.Types.ObjectId(),
            data_creazione: new Date()
        });
        await evento.save();
        eventoId = evento._id;

        const faq = new Faq({
            utente: utenteBaseId,
            evento: eventoId,
            domanda: 'Come posso iscrivermi?',
            data_creazione: new Date('2025-05-10')
        });
        await faq.save();
        Faqid = faq._id;



        const faq2 = new Faq({
            utente: utenteBaseId,
            evento: '673607672b45400acaf456e0', //id non valido
            domanda: 'Come posso iscrivermi?',
            data_creazione: new Date('2025-05-10')
        });
        await faq2.save();
        FaqidSenzaEvento = faq2._id;
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
        console.log('Database connection closed after tests');
    });
















    // ---------------------- Sezione test estrazione Faq eventi ------------------------------------------------------//
    // ---------------------- Sezione test estrazione Faq eventi (casi positivi) ------------------------------------------------------//
    test('Estrazione delle FAQ tramite ID valido', async () => {
        const res = await request(app)
            .get(`/api/faqeventi/evento/${eventoId}`)
            .expect(200)
            .expect('Content-Type', /json/);

        expect(res.body).toBeDefined();
        expect(res.body.length).toBeGreaterThan(0);
    });
    //----------------------------------------------------------------------------------------------------------------------------------//
    // ---------------------- Sezione test estrazione eventi (casi negativi) ------------------------------------------------------//
    test('Estrazione delle FAQ tramite ID mancante', async () => {
        const res = await request(app)
            .get('/api/faqeventi/evento/')
            .expect(404);
    });

    test('Estrazione delle FAQ tramite ID non valido', async () => {
        const res = await request(app)
            .get('/api/faqeventi/evento/673607672b45400acaf456de')
            .expect(404);

        expect(res.body).toHaveProperty('error', 'Evento non trovato');
    });
    //----------------------------------------------------------------------------------------------------------------------------------//
    //----------------------------------------------------------------------------------------------------------------------------------//









    // ---------------------- Sezione test creazione Faq eventi ------------------------------------------------------//
    // ---------------------- Sezione test creazione Faq eventi (casi positivi) ------------------------------------------------------//
    test('Creazione di una FAQ con ID evento valido e token utente base', async () => {
        const res = await request(app)
            .post('/api/faqeventi')
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .send({ id_evento: eventoId, domanda: 'Qual è l’orario dell’evento?' });
        
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('domanda', 'Qual è l’orario dell’evento?');
    });

    //----------------------------------------------------------------------------------------------------------------------------------//
    // ---------------------- Sezione test creazione Faq eventi (casi negativi) ------------------------------------------------------//
    test('Creazione di una FAQ con ID evento mancante e token valido', async () => {
        const res = await request(app)
            .post('/api/faqeventi')
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .send({ domanda: 'Qual è l’orario dell’evento?' });
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error', 'ID evento non valido');
    });

    test('Creazione di una FAQ con ID evento non valido e token valido', async () => {
        const res = await request(app)
            .post('/api/faqeventi')
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .send({ id_evento: '673607672b45400acaf456de', domanda: 'Qual è l’orario dell’evento?' });
        
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Evento non trovato');
    });


    test('Creazione di una FAQ con ID valido e token di utente non base', async () => {
        const res = await request(app)
            .post('/api/faqeventi')
            .set('Authorization', `Bearer ${organizzatoreToken}`)
            .send({ evento: eventoId, domanda: 'Qual è l’orario dell’evento?' });
        
        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('error', 'Non autorizzato a creare una faq eventi');
    });
    //----------------------------------------------------------------------------------------------------------------------------------//
    //----------------------------------------------------------------------------------------------------------------------------------//










    // ---------------------- Sezione test risposta Faq eventi ------------------------------------------------------//
    // ---------------------- Sezione test risposta Faq eventi (casi positivi) ------------------------------------------------------//
    test('Modifica della risposta ad una FAQ tramite il suo id valido, il token dell’utente organizzatore e il contenuto della risposta', async () => {
        const nuovaRisposta = 'L\'evento inizia alle 9:00 AM';
    
        const res = await request(app)
            .patch('/api/faqeventi')
            .set('Authorization', `Bearer ${organizzatoreToken}`)
            .send({ id: Faqid, risposta: nuovaRisposta });
    
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('risposta', nuovaRisposta);
    });
    //----------------------------------------------------------------------------------------------------------------------------------//
    // ---------------------- Sezione test risposta Faq eventi (casi negativi) ------------------------------------------------------//
    test('Modifica della risposta ad una FAQ tramite il suo id valido, il token mancante dell’utente organizzatore e il contenuto della risposta', async () => {
        const nuovaRisposta = 'L\'evento inizia alle 9:00 AM';
    
        const res = await request(app)
            .patch('/api/faqeventi')
            .send({ id: Faqid, risposta: nuovaRisposta });
    
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message', 'No token provided');
        expect(res.body).toHaveProperty('success', false);
    });
    
    test('Modifica della risposta ad una FAQ tramite un id valido, il token non valido dell’utente organizzatore e il contenuto della risposta', async () => {
        const nuovaRisposta = 'L\'evento inizia alle 9:00 AM';
    
        const invalidToken = 'invalidtoken';
    
        const res = await request(app)
            .patch('/api/faqeventi')
            .set('Authorization', `Bearer non valido`)
            .send({ id: Faqid, risposta: nuovaRisposta });
    
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message', 'Failed to authenticate token');
        expect(res.body).toHaveProperty('success', false);
    });
    
    test('Modifica della risposta ad una FAQ tramite un id mancante, il token valido dell’utente organizzatore e il contenuto della risposta', async () => {
        const nuovaRisposta = 'L\'evento inizia alle 9:00 AM';
    
        const res = await request(app)
            .patch('/api/faqeventi')
            .set('Authorization', `Bearer ${organizzatoreToken}`)
            .send({ id: '', risposta: nuovaRisposta });
    
        expect(res.status).toBe(400); // Dovrebbe restituire un errore per ID non valido
        expect(res.body).toHaveProperty('error', 'ID non valido');
    });
    
    test('Modifica della risposta ad una FAQ tramite un id non valido, il token valido dell’utente organizzatore e il contenuto della risposta', async () => {
        const nuovaRisposta = 'L\'evento inizia alle 9:00 AM';
    
        const res = await request(app)
            .patch('/api/faqeventi')
            .set('Authorization', `Bearer ${organizzatoreToken}`)
            .send({ id: '673607672b45400acaf456de', risposta: nuovaRisposta });
    
        expect(res.status).toBe(404); // Dovrebbe restituire errore "FAQ non trovata"
        expect(res.body).toHaveProperty('error', 'FAQ non trovata');
    });
    
    test('Modifica della risposta ad una FAQ tramite un id valido, a cui non corrisponde nessun evento, il token valido dell’utente organizzatore e il contenuto della risposta', async () => {
        const nuovaRisposta = 'L\'evento inizia alle 9:00 AM';
        const res = await request(app)
            .patch('/api/faqeventi')
            .set('Authorization', `Bearer ${organizzatoreToken}`)
            .send({ id: FaqidSenzaEvento, risposta: nuovaRisposta });
    
        expect(res.status).toBe(404); // Evento non trovato
        expect(res.body).toHaveProperty('error', 'Evento non trovato');
    });
    
    test('Modifica della risposta ad una FAQ tramite un id valido, il token valido di un utente che non ha organizzato quell’evento e il contenuto della risposta', async () => {
        const nuovaRisposta = 'L\'evento inizia alle 9:00 AM';
    

        const res = await request(app)
            .patch('/api/faqeventi')
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .send({ id: Faqid, risposta: nuovaRisposta });
    
        expect(res.status).toBe(403); // Non autorizzato a rispondere a questa FAQ
        expect(res.body).toHaveProperty('error', 'Non autorizzato a rispondere a questa FAQ');
    });
    

    //----------------------------------------------------------------------------------------------------------------------------------//
    //----------------------------------------------------------------------------------------------------------------------------------//












});
