const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../../index'); 
const Post = require('../model/Post'); // Modello Post
const User = require('../model/User'); // Modello User
const Commento = require('../model/Commento')
const SECRET = process.env.SECRET;

let mongoServer;
let userBaseToken, organizerToken, userBase, organizer;

describe('LIKE API Tests', () => {

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

        post = new Post({
            descrizione: 'Test Post Description from User Base',
            contenuto: 'Test Post Content from User Base',
            luogo: 'Test Location from User Base',
            posizione: { latitudine: 45.0, longitudine: 10.0 },
            data_creazione: new Date(),
            utente_id: userBase._id  // Associa il post all'ID dell'utente base
        })

        await post.save();


        commento = new Commento({
            data_creazione: new Date(),
            commento: "Commento test",
            utente_id: userBase._id,
            post_id: post._id,
            like: []
        })

        await commento.save();

        commentoId = commento._id
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








    // ---------------------- Sezione test estrazione commenti ------------------------------------------------------//

    // ---------------------- Sezione test estrazione commenti positiva ------------------------------------------------------//
    test('Estrazione dei commenti tramite id corretto di un post', async () => {
        const res = await request(app)
            .get(`/api/commenti/post/${postId}`)
            .expect(200)
            .expect('Content-Type', /json/);

        expect(res.body).toBeDefined();
    });
// ---------------------- Sezione test estrazione commenti negativa ------------------------------------------------------//
    
    test('Estrazione dei commenti tramite id mancante', async () => {
        const res = await request(app)
            .get(`/api/commenti/post/`)  
            .expect(404)
        expect(res.body).toBeDefined();
    });
    
    test('Estrazione dei commenti tramite id non valido', async () => {
        const res = await request(app)
            .get(`/api/commenti/post/6736020b2b45400acaf456b3`)  
            .expect(404)
            .expect('Content-Type', /json/);
        expect(res.body).toBeDefined();
    });


    // ---------------------- Sezione test creazione post ------------------------------------------------------//

    // ---------------------- Sezione test creazione positiva ------------------------------------------------------//  
   
    test('Creazione di un commento tramite l’id corretto di un post, un token valido e con un contenuto mancante.', async () => {

        const commentoData = {
            post_id: postId,
            contenuto: "test"
        }                              

        const res = await request(app)
            .post(`/api/Commenti/`)
            .send(commentoData)
            .set('Authorization', `Bearer ${userBaseToken}`)
            .expect(201)
            .expect('Content-Type', /json/);
        expect(res.body).toBeDefined();

    });
    
    //----------------------------------------------------------------------------------------------------------------------------------//

    // ---------------------- Sezione test creazione negativa ------------------------------------------------------//  

    test('Creazione di un commento tramite l’id corretto di un post, un token valido e con un contenuto mancante.', async () => {

        const commentoData = {
            post_id: postId
        }                                   //Contenuto mancante

        const res = await request(app)
            .post(`/api/Commenti/`)
            .send(commentoData)
            .set('Authorization', `Bearer ${userBaseToken}`)
            .expect(400)
            .expect('Content-Type', /json/);
        expect(res.body).toBeDefined();

    });
    
    test('Creazione di un commento tramite un id mancante di un post, un token valido e un contenuto.', async () => {

        const commentoData = {
            contenuto: "test"
        }      

        const res = await request(app)
            .post(`/api/Commenti/`)
            .send(commentoData)
            .set('Authorization', `Bearer ${userBaseToken}`)
            .expect(400)
            .expect('Content-Type', /json/);
        expect(res.body).toBeDefined();
    });
    
    
    test('Creazione di un commento tramite l’id corretto di un post, un token mancante e un contenuto.', async () => {

        const commentoData = {
            post_id: postId,
            contenuto: "test"
        }  

        const res = await request(app)
            .post('/api/Commenti/')
            .send(commentoData)
            .expect(401)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('message', 'No token provided');
    });

    test('Creazione di un commento tramite un id non valido di un post, un token valido e un contenuto.', async () => {

        const commentoData = {
            post_id: "67aa35534e7b2cf2b13cbf5c",
            contenuto: "test"
        }  

        const res = await request(app)
            .post(`/api/Commenti/`)
            .send(commentoData)
            .set('Authorization', `Bearer ${userBaseToken}`)
            .expect(404)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('error', 'Post non trovato');
    });


});













