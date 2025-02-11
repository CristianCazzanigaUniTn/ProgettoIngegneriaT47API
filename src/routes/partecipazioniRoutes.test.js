const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../index'); 
const Evento = require('../model/Evento');
const Party = require('../model/Party');
const User = require('../model/User');
const Categoria = require('../model/Categoria');
const SECRET = process.env.SECRET;

let mongoServer;
let organizzatoreToken, idOrganizzatore, eventoId, categoriaId, utenteBaseToken, utenteBaseToken2, partyId;

describe('Partecipazione API Tests', () => {

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
         await mongoose.connect(mongoUri);
        console.log('Database connected for testing!');

        // Creazione dell'organizzatore
        const organizer = new User({
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

        // Creazione di un utente base
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
        utenteBaseToken = generateToken(utenteBase._id, 'utente_base');



        const utenteBase2 = new User({
            username: 'utentebase2',
            password: 'utentebase2password123',
            nome: 'Utente Base2',
            email: 'utentebase2@example.com',
            genere: 'M',
            preferenze_notifiche: 'email',
            ruolo: 'utente_base',
            foto_profilo: 'https://example.com/utentebase.jpg',
            verified: true
        });
        await utenteBase2.save();
        utenteBaseToken2 = generateToken(utenteBase2._id, 'utente_base');
        


        // Creazione dell'evento
        const categoria = new Categoria({
            nome: 'Conferenza'
        });
        await categoria.save();
        categoriaId = categoria._id;

        const evento = new Evento({
            nome: 'Evento del Comune',
            descrizione: 'Incontro pubblico organizzato dal Comune di Trento',
            data_inizio: new Date('2025-05-10'),
            luogo: 'Piazza del Duomo, Trento, Italy',
            posizione: { latitudine: 46.0664, longitudine: 11.1211 },
            numero_massimo_partecipanti: 200,
            foto: 'https://res.cloudinary.com/dc2ga9rlo/image/upload/v1738751764/shsov0kr4hkeak8qx5wq.jpg',
            Organizzatore: idOrganizzatore,
            Categoria: categoriaId,
            data_creazione: new Date()
        });
        
        await evento.save();
        eventoId = evento._id;





        const party = new Party({
            nome: 'Party del Comune',
            descrizione: 'Un evento esclusivo organizzato dal Comune di Trento per la comunità',
            data_inizio: new Date('2025-05-10'),
            luogo: 'Piazza del Duomo, Trento, Italy',
            posizione: { latitudine: 46.0664, longitudine: 11.1211 },
            numero_massimo_partecipanti: 200,
            foto: 'https://res.cloudinary.com/dc2ga9rlo/image/upload/v1738751764/shsov0kr4hkeak8qx5wq.jpg',
            Organizzatore: idOrganizzatore,
            Categoria: categoriaId,
            data_creazione: new Date()
        });
        await party.save();
        partyId = party._id;
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

    //----------------------------------------------------------------------------------------------------------------------------------//
    // ---------------------- Sezione test creazione partecipazione ------------------------------------------------------//

    // ---------------------- Sezione test creazione partecipazione ad eventi (casi positivi) ------------------------------------------------------//

    test('Creazione di una partecipazione ad un evento tramite un id corretto e un token valido', async () => {
        const res = await request(app)
            .post(`/api/partecipazioni/Eventi/${eventoId}`)
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .expect(201);
        expect(res.body).toHaveProperty('message', 'Partecipazione accettata');
    });

    //----------------------------------------------------------------------------------------------------------------------------------//

    // ---------------------- Sezione test creazione partecipazione ad eventi (casi negativi) ------------------------------------------------------//

    test('Creazione di una partecipazione ad un evento tramite un id mancante e un token valido', async () => {
        const res = await request(app)
            .post('/api/partecipazioni/Eventi/')  
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .expect(404);
    });

    test('Creazione di una partecipazione ad un evento tramite un id non valido e un token valido', async () => {
        const res = await request(app)
            .post('/api/partecipazioni/Eventi/600c72b1f9d5f5bcdcbf6f25')  // ID non valido
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .expect(404);
        expect(res.body).toHaveProperty('error', 'Evento non trovato');
    });

    test('Creazione di una partecipazione ad un evento tramite un id corretto di un evento che ha raggiunto il numero massimo di partecipanti e un token valido', async () => {
        const evento = await Evento.findById(eventoId);
        evento.numero_massimo_partecipanti = 1;  
        await evento.save();

        const res = await request(app)
            .post(`/api/partecipazioni/Eventi/${eventoId}`)
            .set('Authorization', `Bearer ${utenteBaseToken2}`)
            .expect(408);  
        expect(res.body).toHaveProperty('error', 'Numero massimo di partecipanti raggiunto');
    });

    test('Creazione di una partecipazione ad un evento tramite un id corretto di un evento a cui già partecipi', async () => {
        const res = await request(app)
            .post(`/api/partecipazioni/Eventi/${eventoId}`)
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .expect(409);  
        expect(res.body).toHaveProperty('error', 'Sei già iscritto a questo evento');
    });

    //----------------------------------------------------------------------------------------------------------------------------------//
    //----------------------------------------------------------------------------------------------------------------------------------//





  
    // ---------------------- Sezione test estrazione delle partecipazioni agli eventi ------------------------------------------------------//

    test('Estrazione delle partecipazioni tramite id valido dell’evento', async () => {
        const res = await request(app)
            .get(`/api/partecipazioni/Eventi/${eventoId}`)
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .expect(200); 
    });


    test('Estrazione delle partecipazioni tramite id mancante dell’evento', async () => {
        const res = await request(app)
            .get('/api/partecipazioni/Eventi/')
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .expect(404);
    });

    

    test('Estrazione delle partecipazioni tramite id non valido dell’evento', async () => {
        const res = await request(app)
            .get('/api/partecipazioni/Eventi/600c72b1f9d5f5bcdcbf6f25')  // ID non valido
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .expect(404);  // Status code 404

        expect(res.body).toHaveProperty('error', 'Evento non trovato');
    });

    //----------------------------------------------------------------------------------------------------------------------------------//
    //----------------------------------------------------------------------------------------------------------------------------------//









    // ---------------------- Sezione test eliminazione partecipazione ad eventi  ------------------------------------------------------//

    // ---------------------- Sezione test eliminazione partecipazione ad eventi (negativa) ------------------------------------------------------//
    test('Eliminazione di una partecipazione dato un id mancante e il token di un utente', async () => {
        const res = await request(app)
            .delete('/api/partecipazioni/Eventi/')  
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .expect(404);
    });

    test('Eliminazione di una partecipazione dato un id non valido e il token di un utente', async () => {
        const res = await request(app)
            .delete('/api/partecipazioni/Eventi/600c72b1f9d5f5bcdcbf6f25')  // ID non valido
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .expect(404);
    });


    test('Eliminazione di una partecipazione dato un id corretto e un token non valido', async () => {
        const res = await request(app)
            .delete(`/api/partecipazioni/Eventi/${eventoId}`)
            .expect(401);  
        expect(res.body).toHaveProperty('message', 'No token provided');
    });

    //----------------------------------------------------------------------------------------------------------------------------------//
    // ---------------------- Sezione test eliminazione partecipazione ad eventi (positiva) ------------------------------------------------------//
    test('Eliminazione di una partecipazione dato un id corretto di un evento e il token di un utente che vi partecipa', async () => {
        const res = await request(app)
            .delete(`/api/partecipazioni/Eventi/${eventoId}`)
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .expect(204);  
    });

    //----------------------------------------------------------------------------------------------------------------------------------//
    //----------------------------------------------------------------------------------------------------------------------------------//
   





























    






    //----------------------------------------------------------------------------------------------------------------------------------//
    // ---------------------- Sezione test creazione partecipazione a party (casi positivi) ------------------------------------------------------//

    test('Creazione di una partecipazione ad un party tramite un id corretto e un token valido', async () => {
        const res = await request(app)
            .post(`/api/Partecipazioni/Party/${partyId}`)
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .expect(201);
        expect(res.body).toHaveProperty('message', 'Partecipazione accettata');
    });



    //----------------------------------------------------------------------------------------------------------------------------------//
    // ---------------------- Sezione test creazione partecipazione a party (casi negativi) ------------------------------------------------------//

    test('Creazione di una partecipazione ad un party tramite un id mancante e un token valido', async () => {
        const res = await request(app)
            .post('/api/partecipazioni/Party/')  
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .expect(404);
    });

    test('Creazione di una partecipazione ad un party tramite un id non valido e un token valido', async () => {
        const res = await request(app)
            .post('/api/partecipazioni/Party/600c72b1f9d5f5bcdcbf6f25')  // ID non valido
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .expect(404);
        expect(res.body).toHaveProperty('error', 'Party non trovato');
    });

    test('Creazione di una partecipazione ad un party tramite un id corretto di un party che ha raggiunto il numero massimo di partecipanti e un token valido', async () => {
        const party = await Party.findById(partyId);
        party.numero_massimo_partecipanti = 1;  
        await party.save();

        const res = await request(app)
            .post(`/api/partecipazioni/Party/${partyId}`)
            .set('Authorization', `Bearer ${utenteBaseToken2}`)
            .expect(408);  
        expect(res.body).toHaveProperty('error', 'Numero massimo di partecipanti raggiunto');
    });

    test('Creazione di una partecipazione ad un party tramite un id corretto di un party a cui già partecipi', async () => {
        const res = await request(app)
            .post(`/api/partecipazioni/Party/${partyId}`)
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .expect(409);  
        expect(res.body).toHaveProperty('error', 'Sei già iscritto a questo party');
    });

    //----------------------------------------------------------------------------------------------------------------------------------//
    //----------------------------------------------------------------------------------------------------------------------------------//





    //----------------------------------------------------------------------------------------------------------------------------------//
    // ---------------------- Sezione test estrazione delle partecipazioni ai party ------------------------------------------------------//

    test('Estrazione delle partecipazioni tramite id valido del party', async () => {
        const res = await request(app)
            .get(`/api/partecipazioni/Party/${partyId}`)
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .expect(200);  
    });

    test('Estrazione delle partecipazioni tramite id mancante del party', async () => {
        const res = await request(app)
            .get('/api/partecipazioni/Party/')
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .expect(404); 
    });

    test('Estrazione delle partecipazioni tramite id non valido del party', async () => {
        const res = await request(app)
            .get('/api/partecipazioni/Party/600c72b1f9d5f5bcdcbf6f25') 
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .expect(404); 
    });

    //----------------------------------------------------------------------------------------------------------------------------------//




    

    // ---------------------- Sezione test eliminazione partecipazione a party  ------------------------------------------------------//
    // ---------------------- Sezione test eliminazione partecipazione a party (negativa) ------------------------------------------------------//
    test('Eliminazione di una partecipazione dato un id mancante e il token di un utente', async () => {
        const res = await request(app)
            .delete('/api/partecipazioni/Party/')  
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .expect(404);
    });

    test('Eliminazione di una partecipazione dato un id non valido e il token di un utente', async () => {
        const res = await request(app)
            .delete('/api/partecipazioni/Party/600c72b1f9d5f5bcdcbf6f25')  // ID non valido
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .expect(404);
    });

    test('Eliminazione di una partecipazione dato un id corretto e un token non valido', async () => {
        const res = await request(app)
            .delete(`/api/partecipazioni/Party/${partyId}`)
            .expect(401);  
        expect(res.body).toHaveProperty('message', 'No token provided');
    });
    
   //----------------------------------------------------------------------------------------------------------------------------------//

    // ---------------------- Sezione test eliminazione partecipazione a party (positiva) ------------------------------------------------------//
    test('Eliminazione di una partecipazione dato un id corretto di un party e il token di un utente che vi partecipa', async () => {
        const res = await request(app)
            .delete(`/api/partecipazioni/Party/${partyId}`)
            .set('Authorization', `Bearer ${utenteBaseToken}`)
            .expect(204);  
    });

    //----------------------------------------------------------------------------------------------------------------------------------//
    //----------------------------------------------------------------------------------------------------------------------------------//






});
