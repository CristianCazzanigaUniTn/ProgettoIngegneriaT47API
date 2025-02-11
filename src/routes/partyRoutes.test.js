const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../index'); // Il tuo server Express
const Party = require('../model/Party'); // Modello Post
const User = require('../model/User'); // Modello User
const Categoria = require('../model/Categoria.js')
const SECRET = process.env.SECRET;

let mongoServer;
let userBaseToken, organizerToken, userBase, organizer, category;

describe('PARTY API Tests', () => {

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

        category = new Categoria({
            nome: 'Musica'
        })

        await category.save();

        userBaseToken = generateToken(userBase._id, 'utente_base');
        organizerToken = generateToken(organizer._id, 'organizzatore');



        party = new Party({
            nome: 'Party test',
            descrizione: 'Test Post Description from User Base',
            data_inizio: new Date(),
            luogo: 'Test Location from User Base',
            posizione: { latitudine: 45.0, longitudine: 10.0 },
            foto: 'foto di prova',
            numero_massimo_partecipanti: 1,
            data_creazione: new Date(),
            Categoria: category._id,
            Organizzatore: userBase._id  // Associa il post all'ID dell'utente base
        })

        await party.save();

        partyid = party._id;

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



 // ---------------------- Sezione test estrazione party ------------------------------------------------------//
// ---------------------- Sezione test estrazione party positiva ------------------------------------------------------//
    test('Estrazione di tutti i party con parametri validi', async () => {
        const res = await request(app)
            .post('/api/party/ricerca')
            .send({ lat: 45.0, lng: 10.0, rad: 50 })  // Parametri validi
            .expect(200)
            .expect('Content-Type', /json/);

        expect(res.body).toBeDefined();
    });
   // ---------------------- Sezione test estrazione party negativa ------------------------------------------------------//
    test('Estrazione di tutti i party con parametri non validi', async () => {
        const res = await request(app)
            .post('/api/party/ricerca')
            .send({ lat: 200, lng: 10.0, rad: 50 })  // Parametri non validi (latitudine fuori range)
            .expect(400)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('error', 'Latitudine, longitudine o raggio non valido');
    });

    test('Estrazione di un party tramite id corretto', async () => {
        const res = await request(app)
            .get(`/api/party/${partyid}`)  // Usa l'ID del post creato
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body).toHaveProperty('_id', partyid.toString()); // Usa 'id' invece di '_id'
    });

    test('Estrazione di un party tramite id non presente nel database', async () => {
        const res = await request(app)
            .get('/api/party/600c72b1f9d5f5bcdcbf6f25')  // ID che non esiste nel database
            .expect(404)
            .expect('Content-Type', /json/);
        expect(res.body).toHaveProperty('error', 'Party non trovato');
        expect(res.body).toEqual({error: 'Party non trovato'});
    });

    test('Estrazione dei party tramite id dell’utente corretto', async () => {
        const res = await request(app)
            .get(`/api/party/organizzatore/${userBase._id}`)
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body).toBeDefined();
    });      

    test('Estrazione dei party tramite id dell\'utente mancante', async () => {
        const res = await request(app)
            .get('/api/party/organizzatore/')
            .expect(500)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('error', 'Errore nel recupero del party');
        expect(res.body).toEqual({error: "Errore nel recupero del party"});
    });

    test('Estrazione dei party tramite id dell’utente non presente nel database', async () => {
        const res = await request(app)
            .get('/api/party/organizzatore/600c72b1f9d5f5bcdcbf6f50')
            .expect(404)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('error', 'Utente non trovato');
        expect(res.body).toEqual({error: "Utente non trovato"});
    });

    //----------------------------------------------------------------------------------------------------------------------------------//
   // ---------------------- Sezione test creazione party positiva ------------------------------------------------------//
    test('Creazione di un party tramite i dati completi e il token dell’utente con ruolo corretto', async () => {
        const partyData = {
            nome: 'Party test2',
            descrizione: 'Test Post Description from User Base',
            data_inizio: new Date(Date.now() + 86400000),
            luogo: 'Test Location from User Base',
            posizione: { latitudine: 45.0, longitudine: 10.0 },
            foto: 'foto di prova',
            numero_massimo_partecipanti: 1,
            data_creazione: new Date(),
            id_categoria: category._id,
            Organizzatore: userBase._id  // Associa il post all'ID dell'utente base
        };


        const res = await request(app)
            .post('/api/party')
            .set('Authorization', `Bearer ${userBaseToken}`)
            .send(partyData)
            .expect(201)
            .expect('Content-Type', /json/);


        expect(res.body).toHaveProperty('descrizione', 'Test Post Description from User Base');
    });

   // ---------------------- Sezione test estrazione party negativa ------------------------------------------------------//

    test('Creazione di un party tramite dati mancanti e il token dell’utente con ruolo corretto', async () => {
        const partyData = {                                     //Manca luogo
            nome: 'Party test2',
            descrizione: 'Test Post Description from User Base',
            data_inizio: new Date(Date.now() + 86400000),
            posizione: { latitudine: 45.0, longitudine: 10.0 },
            foto: 'foto di prova',
            numero_massimo_partecipanti: 1,
            data_creazione: new Date(),
            id_categoria: category._id,
            Organizzatore: userBase._id  // Associa il post all'ID dell'utente base
        };

        const res = await request(app)
            .post('/api/party')
            .set('Authorization', `Bearer ${userBaseToken}`)
            .send(partyData)
            .expect(400)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('error', 'Tutti i campi sono richiesti');
        expect(res.body).toEqual({error: "Tutti i campi sono richiesti"});
    });

    test('Creazione di un party tramite dati non validi e il token dell’utente con ruolo corretto', async () => {
        const partyData = {
            nome: 'Party test2',
            descrizione: 'Test Post Description from User Base',
            data_inizio: new Date(Date.now() + 86400000),
            luogo: 'Test Location from User Base',
            posizione: { latitudine: 500, longitudine: -7000 },                 //Dati non validi
            foto: 'foto di prova',
            numero_massimo_partecipanti: 1,
            data_creazione: new Date(),
            id_categoria: category._id,
            Organizzatore: userBase._id  // Associa il post all'ID dell'utente base
        };

        const res = await request(app)
            .post('/api/Post')
            .set('Authorization', `Bearer ${userBaseToken}`)  // Token dell'utente con ruolo corretto
            .send(partyData)
            .expect(400)  // Aspettiamo un errore 400 per dati non validi
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('error', 'Latitudine o longitudine non valide');
    });

    test('Creazione di un party tramite categoria non valida e il token dell’utente con ruolo corretto', async () => {
        const partyData = {
            nome: 'Party test2',
            descrizione: 'Test Post Description from User Base',
            data_inizio: new Date(Date.now() + 86400000),
            luogo: 'Test Location from User Base',
            posizione: { latitudine: 45.0, longitudine: 10.0 },
            foto: 'foto di prova',
            numero_massimo_partecipanti: 1,
            data_creazione: new Date(),
            id_categoria: '67aa8f9c66bb2fc3f268ade8',                                       //categoria non valida
            Organizzatore: userBase._id  // Associa il post all'ID dell'utente base
        };

        const res = await request(app)
            .post('/api/party')
            .set('Authorization', `Bearer ${userBaseToken}`)  // Token dell'utente con ruolo corretto
            .send(partyData)
            .expect(404)  // Aspettiamo un errore 400 per dati non validi
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('error', 'Categoria non trovata');
    });

    test('Creazione di un party con token mancante', async () => {
        const partyData = {
            nome: 'Party test2',
            descrizione: 'Test Post Description from User Base',
            data_inizio: new Date(Date.now() + 86400000),
            luogo: 'Test Location from User Base',
            posizione: { latitudine: 45.0, longitudine: 10.0 },
            foto: 'foto di prova',
            numero_massimo_partecipanti: 1,
            data_creazione: new Date(),
            id_categoria: category._id,
            Organizzatore: userBase._id  // Associa il post all'ID dell'utente base
        };

        const res = await request(app)
            .post('/api/party')
            .send(partyData)
            .expect(401)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('message', 'No token provided');
        expect(res.body).toHaveProperty('success', false);
    });

    test('Creazione di un party tramite dati completi e il token di un utente non base', async () => {
        const partyData = {
            nome: 'Party test2',
            descrizione: 'Test Post Description from User Base',
            data_inizio: new Date(Date.now() + 86400000),
            luogo: 'Test Location from User Base',
            posizione: { latitudine: 45.0, longitudine: 10.0 },
            foto: 'foto di prova',
            numero_massimo_partecipanti: 1,
            data_creazione: new Date(),
            id_categoria: category._id,
            Organizzatore: userBase._id  // Associa il post all'ID dell'utente base
        };

        const res = await request(app)
            .post('/api/party')
            .set('Authorization', `Bearer ${organizerToken}`)
            .send(partyData)
            .expect(403)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('error', 'Non autorizzato a creare questo party');
    });


    // ---------------------- Sezione test delete party ------------------------------------------------------ //

    // ---------------------- Sezione test eliminazione party (casi negativi) ------------------------------------------------------

    test('Eliminazione di un party tramite un id mancante e il token del suo creatore valido', async () => {
        const res = await request(app)
            .delete('/api/party/')  // ID mancante
            .set('Authorization', `Bearer ${userBaseToken}`)  // Token dell'utente che ha creato il post
            .expect(404)
    });

    test('Eliminazione di un party tramite un id non valido e il token del suo creatore valido', async () => {
        const res = await request(app)
            .delete('/api/party/600c72b1f9d5f5bcdcbf6f25')  // ID non valido (non esiste nel DB)
            .set('Authorization', `Bearer ${userBaseToken}`)  // Token dell'utente che ha creato il post
            .expect(404)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('error', 'Party non trovato');
        expect(res.body).toEqual({error: 'Party non trovato' });
    });

    test('Eliminazione di un party tramite un id corretto e il token del suo creatore mancante', async () => {
        const res = await request(app)
            .delete(`/api/party/${partyid}`)  // ID del post creato
            .expect(401)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('message', 'No token provided');
        expect(res.body).toHaveProperty('success', false);
    });

    test('Eliminazione di un party tramite un id corretto e il token non appartenente al suo creatore', async () => {
        const res = await request(app)
            .delete(`/api/party/${partyid}`)  // ID del post creato
            .set('Authorization', `Bearer ${organizerToken}`)  // Token di un altro utente (non il creatore)
            .expect(403)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('error', 'Non autorizzato a eliminare questo party');
        expect(res.body).toEqual({ error: 'Non autorizzato a eliminare questo party' });
    });


    // ---------------------- Sezione test eliminazione party (casi positivi) ----------------------------------------------------------//
    test('Eliminazione di un party tramite un id corretto e il token del suo creatore valido', async () => {
        const res = await request(app)
            .delete(`/api/party/${partyid}`)  // ID del post creato
            .set('Authorization', `Bearer ${userBaseToken}`)  // Token dell'utente che ha creato il post
            .expect(200)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('message', 'Party eliminato con successo');
        expect(res.body).toEqual({ message: 'Party eliminato con successo' });

    });
    //----------------------------------------------------------------------------------------------------------------------------------//

});













