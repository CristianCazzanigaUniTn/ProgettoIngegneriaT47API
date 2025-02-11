const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../index'); // Il tuo server Express
const Post = require('../model/Post'); // Modello Post
const User = require('../model/User'); // Modello User
const SECRET = process.env.SECRET;

let mongoServer;
let userBaseToken, organizerToken, userBase, organizer, post, postId;

describe('POST API Tests', () => {

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
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




        userBaseToken = generateToken(userBase._id, 'utente_base');
        organizerToken = generateToken(organizer._id, 'organizzatore');



        post = new Post({
            descrizione: 'Test Post Description from User Base',
            contenuto: 'Test Post Content from User Base',
            luogo: 'Test Location from User Base',
            posizione: { latitudine: 45.0, longitudine: 10.0 },
            data_creazione: new Date(),
            utente_id: userBase._id  // Associa il post all'ID dell'utente base
        })

        await post.save();

        postId = post._id;

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
    test('Estrazione di tutti i post con parametri validi', async () => {
        const res = await request(app)
            .post('/api/Post/ricerca')
            .send({ lat: 45.0, lng: 10.0, rad: 50 })  // Parametri validi
            .expect(200)
            .expect('Content-Type', /json/);

        expect(res.body).toBeDefined();
    });

    test('Estrazione di tutti i post con parametri non validi', async () => {
        const res = await request(app)
            .post('/api/Post/ricerca')
            .send({ lat: 200, lng: 10.0, rad: 50 })  // Parametri non validi (latitudine fuori range)
            .expect(400)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('error', 'Latitudine, longitudine o raggio non valido');
    });

    test('Estrazione di un post tramite id del post corretto', async () => {
        const res = await request(app)
            .get(`/api/OttieniPost/${postId}`)  // Usa l'ID del post creato
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body).toHaveProperty('post');
        expect(res.body.post).toHaveProperty('id', expect.any(String)); // Usa 'id' invece di '_id'
    });

    test('Estrazione dei post tramite id dell\'utente corretto', async () => {
        const res = await request(app)
            .get(`/api/Post/${userBase._id}`)
            .expect(200)
            .expect('Content-Type', /json/);
        expect(res.body).toBeDefined();
    });      
    //----------------------------------------------------------------------------------------------------------------------------------//
    

    // ---------------------- Sezione test estrazione post negativa ------------------------------------------------------//
    test('Estrazione di un post tramite id mancante', async () => {
        const res = await request(app)
            .get('/api/OttieniPost/')  // ID non valido
            .expect(404)
    });

    test('Estrazione di un post tramite id non presente nel database', async () => {
        const res = await request(app)
            .get('/api/OttieniPost/600c72b1f9d5f5bcdcbf6f25')  // ID che non esiste nel database
            .expect(404)
            .expect('Content-Type', /json/);
        expect(res.body).toHaveProperty('message', 'Post not found');
        expect(res.body).toHaveProperty('success', false);
    });


    test('Estrazione dei post tramite id dell\'utente mancante', async () => {
        const res = await request(app)
            .get('/api/Post/600c72b1f9d5f5bcdcbf6f25')
            .expect(404)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('message', 'No posts found for the specified user');
        expect(res.body).toHaveProperty('success', false);
    });

    //----------------------------------------------------------------------------------------------------------------------------------//













    




    // ---------------------- Sezione test creazione post ------------------------------------------------------//

    // ---------------------- Sezione test creazione positiva ------------------------------------------------------//  
    test('Creazione di un post con dati validi e ruolo utente_base', async () => {
        const postData = {
            descrizione: 'Test Description',
            contenuto: 'Test Content',
            luogo: 'Test Location',
            posizione: { latitudine: 45.0, longitudine: 10.0 },
            data_creazione: new Date(),
        };

        const res = await request(app)
            .post('/api/Post')
            .set('Authorization', `Bearer ${userBaseToken}`)
            .send(postData)
            .expect(201)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('post');
        expect(res.body.post).toHaveProperty('descrizione', 'Test Description');
        expect(res.body.post).toHaveProperty('contenuto', 'Test Content');
    });
    //----------------------------------------------------------------------------------------------------------------------------------//

    // ---------------------- Sezione test creazione negativa ------------------------------------------------------//  
    test('Creazione di un post con ruolo organizzatore', async () => {
        const postData = {
            descrizione: 'Test Description from Organizer',
            contenuto: 'Test Content from Organizer',
            luogo: 'Test Location from Organizer',
            posizione: { latitudine: 45.0, longitudine: 10.0 },
            data_creazione: new Date(),
        };

        const res = await request(app)
            .post('/api/Post')
            .set('Authorization', `Bearer ${organizerToken}`)
            .send(postData)
            .expect(403)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('error', 'Non autorizzato a creare questo post');
    });

    test('Creazione di un post con token mancante', async () => {
        const postData = {
            descrizione: 'Test Description',
            contenuto: 'Test Content',
            luogo: 'Test Location',
            posizione: { latitudine: 45.0, longitudine: 10.0 },
            data_creazione: new Date(),
        };

        const res = await request(app)
            .post('/api/Post')
            .send(postData)
            .expect(401)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('message', 'No token provided');
        expect(res.body).toHaveProperty('success', false);
    });

    test('Creazione di un post con token valido e dati incompleti', async () => {
        const postData = {
            descrizione: 'Test Description',
            contenuto: 'Test Content',
            luogo: 'Test Location',
            data_creazione: new Date(),
        };

        const res = await request(app)
            .post('/api/Post')
            .set('Authorization', `Bearer ${userBaseToken}`)
            .send(postData)
            .expect(400)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('message', 'All fields are required');
        expect(res.body).toHaveProperty('success', false);
    });

    test('Creazione di un post tramite dati non validi e il token dell\'utente con ruolo corretto', async () => {
        const postData = {
            descrizione: '',  // Dato non valido (descrizione vuota)
            contenuto: 'Test Content with Invalid Data',
            luogo: 'Test Location',
            posizione: { latitudine: 200.0, longitudine: 10.0 },  // Dato non valido (latitudine fuori dal range valido)
            data_creazione: new Date(),
        };

        const res = await request(app)
            .post('/api/Post')
            .set('Authorization', `Bearer ${userBaseToken}`)  // Token dell'utente con ruolo corretto
            .send(postData)
            .expect(400)  // Aspettiamo un errore 400 per dati non validi
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('error', 'Latitudine o longitudine non valide');
    });

    
    //----------------------------------------------------------------------------------------------------------------------------------//






















    // ---------------------- Sezione test delete post ------------------------------------------------------ //

    // ---------------------- Sezione test eliminazione post (casi negativi) ------------------------------------------------------

    test('Eliminazione di un post tramite un id mancante e il token del suo creatore valido', async () => {
        const res = await request(app)
            .delete('/api/Post/')  // ID mancante
            .set('Authorization', `Bearer ${userBaseToken}`)  // Token dell'utente che ha creato il post
            .expect(404)
    });

    test('Eliminazione di un post tramite un id non valido e il token del suo creatore valido', async () => {
        const res = await request(app)
            .delete('/api/Post/600c72b1f9d5f5bcdcbf6f25')  // ID non valido (non esiste nel DB)
            .set('Authorization', `Bearer ${userBaseToken}`)  // Token dell'utente che ha creato il post
            .expect(404)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('message', 'Post not found');
        expect(res.body).toHaveProperty('success', false);
    });

    test('Eliminazione di un post tramite un id corretto e il token del suo creatore mancante', async () => {
        const res = await request(app)
            .delete(`/api/Post/${postId}`)  // ID del post creato
            .expect(401)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('message', 'No token provided');
        expect(res.body).toHaveProperty('success', false);
    });

    test('Eliminazione di un post tramite un id valido e il token non del suo creatore', async () => {
        const res = await request(app)
            .delete(`/api/Post/${postId}`)  // ID del post creato
            .set('Authorization', `Bearer ${organizerToken}`)  // Token di un altro utente (non il creatore)
            .expect(401)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('message', 'You are not the owner of this post');
        expect(res.body).toHaveProperty('success', false);
    });


    // ---------------------- Sezione test eliminazione post (casi positivi) ----------------------------------------------------------//
    test('Eliminazione di un post tramite un id corretto e il token del suo creatore valido', async () => {
        const res = await request(app)
            .delete(`/api/Post/${postId}`)  // ID del post creato
            .set('Authorization', `Bearer ${userBaseToken}`)  // Token dell'utente che ha creato il post
            .expect(200)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('message', 'Post successfully deleted');
        expect(res.body).toHaveProperty('success', true);
    });
    //----------------------------------------------------------------------------------------------------------------------------------//

});













