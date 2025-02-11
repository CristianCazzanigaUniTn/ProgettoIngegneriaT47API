const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../index'); // Il tuo server Express
const Evento = require('../model/Evento'); // Modello Evento
const User = require('../model/User'); // Modello User
const Categoria = require('../model/Categoria');
const SECRET = process.env.SECRET;

let mongoServer;
let organizzatoreToken, idOrganizzatore, eventoId, categoriaId, UtenteBaseToken;

describe('Evento API Tests', () => {

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
        UtenteBaseToken = generateToken(utenteBase._id, 'utente_base');


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


        categoria = new Categoria({
            nome: 'Conferenza'
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

    const generateToken = (userId, role) => {
        return jwt.sign({ _id: userId, ruolo: role }, SECRET, { expiresIn: '1h' });
    };







    // ---------------------- Sezione test estrazione eventi ------------------------------------------------------//

    // ---------------------- Sezione test estrazione eventi (casi positivi) ------------------------------------------------------//

    test('Estrazione di tutti gli eventi con parametri validi', async () => {
        const res = await request(app)
            .post('/api/eventi/ricerca')
            .send({ lat: 46.0664, lng: 11.1211, rad: 50 })  // Parametri validi
            .expect(200)
            .expect('Content-Type', /json/);

        expect(res.body).toBeDefined();
    });

    test('Estrazione di un evento tramite id corretto', async () => {
        const res = await request(app)
            .get(`/api/eventi/${eventoId}`)  // Usa l'ID dell'evento creato
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body).toHaveProperty('_id', eventoId.toString());
    });

    test('Estrazione degli eventi tramite id dell’organizzatore corretto', async () => {
        const res = await request(app)
            .get(`/api/eventi/organizzatore/${idOrganizzatore}`)
            .expect(200)
            .expect('Content-Type', /json/);
        
        expect(res.body).toBeDefined();
    });

    //----------------------------------------------------------------------------------------------------------------------------------//

    // ---------------------- Sezione test estrazione eventi (casi negativi) ------------------------------------------------------//

    test('Estrazione di tutti gli eventi con parametri non validi', async () => {
        const res = await request(app)
            .post('/api/eventi/ricerca')
            .send({ lat: 200, lng: 11.1211, rad: 50 })  // Parametri non validi (latitudine fuori range)
            .expect(400)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('error', 'Latitudine, longitudine o raggio non valido');
    });

    test('Estrazione di un evento tramite id non presente nel database', async () => {
        const res = await request(app)
            .get('/api/eventi/600c72b1f9d5f5bcdcbf6f25')  // ID inesistente
            .expect(404)
            .expect('Content-Type', /json/);
        
        expect(res.body).toHaveProperty('error', 'Evento non trovato');
    });

    test('Estrazione degli eventi tramite id dell’organizzatore mancante', async () => {
        const res = await request(app)
            .get('/api/eventi/organizzatore/')  // ID mancante
            .expect(500);
    });

    test('Estrazione degli eventi tramite id dell\'organizzatore non presente nel database', async () => {
        const res = await request(app)
            .get('/api/eventi/organizzatore/600c72b1f9d5f5bcdcbf6f25')  // ID inesistente
            .expect(404)
            .expect('Content-Type', /json/);
        
        expect(res.body).toHaveProperty('error', 'Organizzatore non trovato');
    });

    //----------------------------------------------------------------------------------------------------------------------------------//
    //----------------------------------------------------------------------------------------------------------------------------------//
















    // ---------------------- Sezione test creazione eventi ------------------------------------------------------//
    
    // ---------------------- Sezione test creazione eventi (casi positivi) ------------------------------------------------------//

    test('Creazione di un evento con dati completi e token valido', async () => {
        const eventoData = {
            nome: 'Evento di Test',
            descrizione: 'Descrizione evento',
            data_inizio: '2025-05-10T00:00:00.000Z',
            luogo: 'Piazza del Duomo, Trento',
            posizione: { latitudine: 46.0664, longitudine: 11.1211 },
            numero_massimo_partecipanti: 100,
            foto: 'https://example.com/foto.jpg',
            data_creazione: '2025-05-06T00:00:00.000Z',
            id_categoria: categoriaId
        };
        
        const res = await request(app)
            .post('/api/eventi')
            .set('Authorization', `Bearer ${organizzatoreToken}`)
            .send(eventoData)
            .expect(201);
        expect(res.body.nome).toBe(eventoData.nome);
    });


    //----------------------------------------------------------------------------------------------------------------------------------//

    // ---------------------- Sezione test creazione eventi (casi negativi) ------------------------------------------------------//

    test('Creazione di un evento con dati mancanti e token valido', async () => {
        const eventoData = {
            // Nome mancante
            descrizione: 'Descrizione evento',
            data_inizio: '2025-05-10T00:00:00.000Z',
            luogo: 'Piazza del Duomo, Trento',
            posizione: { latitudine: 46.0664, longitudine: 11.1211 },
            numero_massimo_partecipanti: 100,
            foto: 'https://example.com/foto.jpg',
            data_creazione: '2025-05-06T00:00:00.000Z',
            id_categoria: categoriaId
        };
    
        const res = await request(app)
            .post('/api/eventi')
            .set('Authorization', `Bearer ${organizzatoreToken}`)  
            .send(eventoData)
            .expect(400);  
        expect(res.body).toHaveProperty('error', 'Tutti i campi sono richiesti');
    });
    

    test('Creazione di un evento con posizione non valida e token valido', async () => {
        const eventoData = {
            nome: 'Evento con posizione non valida',
            descrizione: 'Descrizione evento',
            data_inizio: '2025-05-10T00:00:00.000Z',
            luogo: 'Piazza del Duomo, Trento',
            posizione: { latitudine: 'non_valida', longitudine: 'non_valida' },  // Posizione non valida
            numero_massimo_partecipanti: 100,
            foto: 'https://example.com/foto.jpg',
            data_creazione: '2025-05-06T00:00:00.000Z',
            id_categoria: categoriaId
        };
    
        const res = await request(app)
            .post('/api/eventi')
            .set('Authorization', `Bearer ${organizzatoreToken}`) 
            .send(eventoData)
            .expect(400);  
        expect(res.body).toHaveProperty('error', 'Latitudine o longitudine non valide');
    });
    


    test('Creazione di un evento con id categoria non valida e token valido', async () => {
        const eventoData = {
            nome: 'Evento con ID categoria non valida',
            descrizione: 'Descrizione evento',
            data_inizio: '2025-05-10T00:00:00.000Z',
            luogo: 'Piazza del Duomo, Trento',
            posizione: { latitudine: 46.0664, longitudine: 11.1211 },
            numero_massimo_partecipanti: 100,
            foto: 'https://example.com/foto.jpg',
            data_creazione: '2025-05-06T00:00:00.000Z',
            id_categoria: '673603662b45400acaf456d5'
        };
        const res = await request(app)
            .post('/api/eventi')
            .set('Authorization', `Bearer ${organizzatoreToken}`)  
            .send(eventoData)
            .expect(404);  
        expect(res.body).toHaveProperty('error', 'Categoria non trovata');
    });
    

    test('Creazione di un evento con token mancante', async () => {
        const eventoData = {
            nome: 'Evento senza token',
            descrizione: 'Descrizione evento',
            data_inizio: '2025-05-10T00:00:00.000Z',
            luogo: 'Piazza del Duomo, Trento',
            posizione: { latitudine: 46.0664, longitudine: 11.1211 },
            numero_massimo_partecipanti: 100,
            foto: 'https://example.com/foto.jpg',
            data_creazione: '2025-05-06T00:00:00.000Z',
            id_categoria: categoriaId
        };
    
        const res = await request(app)
            .post('/api/eventi')
            .send(eventoData)
            .expect(401); 
        expect(res.body).toHaveProperty('message', 'No token provided');
        expect(res.body).toHaveProperty('success', false);
    });
    
    test('Creazione di un evento con token di un utente non organizzatore', async () => {
        const eventoData = {
            nome: 'Evento con utente non organizzatore',
            descrizione: 'Descrizione evento',
            data_inizio: '2025-05-10T00:00:00.000Z',
            luogo: 'Piazza del Duomo, Trento',
            posizione: { latitudine: 46.0664, longitudine: 11.1211 },
            numero_massimo_partecipanti: 100,
            foto: 'https://example.com/foto.jpg',
            data_creazione: '2025-05-06T00:00:00.000Z',
            id_categoria: categoriaId
        };
    
        const res = await request(app)
            .post('/api/eventi')
            .set('Authorization', `Bearer ${UtenteBaseToken}`) 
            .send(eventoData)
            .expect(403);  

        expect(res.body).toHaveProperty('error', 'Non autorizzato a creare questo evento');
    });
    
    //----------------------------------------------------------------------------------------------------------------------------------//
    //----------------------------------------------------------------------------------------------------------------------------------//









    // ---------------------- Sezione test delete eventi ------------------------------------------------------ //

    // ---------------------- Sezione test eliminazione eventi (casi negativi) ------------------------------------------------------//


    test('Eliminazione di un evento tramite un id mancante e il token del suo creatore valido', async () => {
        const res = await request(app)
            .delete('/api/eventi/')  // ID mancante
            .set('Authorization', `Bearer ${organizzatoreToken}`)
            .expect(404);
    });


    test('Eliminazione di un evento tramite un id non valido e il token del suo creatore valido', async () => {
        const res = await request(app)
            .delete('/api/eventi/600c72b1f9d5f5bcdcbf6f25')  // ID non valido
            .set('Authorization', `Bearer ${organizzatoreToken}`)
            .expect(404);
        
        expect(res.body).toHaveProperty('error', 'Evento non trovato');
    });


    test('Eliminazione di un evento tramite un id corretto e il token del suo creatore mancante', async () => {
        const res = await request(app)
            .delete(`/api/eventi/${eventoId}`)  
            .expect(401);  
        expect(res.body).toHaveProperty('message', 'No token provided');
        expect(res.body).toHaveProperty('success', false);
    });


    test('Eliminazione di un evento tramite un id corretto e il token non appartenente al suo creatore', async () => {
        const res = await request(app)
            .delete(`/api/eventi/${eventoId}`)  
            .set('Authorization', `Bearer ${UtenteBaseToken}`)  
            .expect(403); 
        expect(res.body).toHaveProperty('error', 'Non autorizzato a eliminare questo evento');
    });
    //----------------------------------------------------------------------------------------------------------------------------------//

    // ---------------------- Sezione test eliminazione eventi (casi positivi) ------------------------------------------------------

    test('Eliminazione di un evento tramite un id corretto e il token del suo creatore valido', async () => {
        const res = await request(app)
            .delete(`/api/eventi/${eventoId}`)  
            .set('Authorization', `Bearer ${organizzatoreToken}`)
            .expect(200);
        
        expect(res.body).toHaveProperty('message', 'Evento eliminato con successo');
    });
});

  //----------------------------------------------------------------------------------------------------------------------------------//
  //----------------------------------------------------------------------------------------------------------------------------------//


















   


