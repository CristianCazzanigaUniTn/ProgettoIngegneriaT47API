const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../index'); // Il tuo server Express
const Post = require('../model/Post'); // Modello Post
const User = require('../model/User'); // Modello User
const Like = require('../model/Like')
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


        other = new User({
            username: 'organizeruser',
            password: 'organizerpassword123',
            nome: 'Organizer User',
            email: 'organizer@example.com',
            genere: 'M',
            preferenze_notifiche: 'email',
            ruolo: 'utente_base',
            foto_profilo: 'https://example.com/organizer.jpg',
            verified: true
        });
        await other.save();

        userBaseToken = generateToken(userBase._id, 'utente_base');
        otherToken = generateToken(other._id, 'organizzatore');

        post1 = new Post({
            descrizione: 'Test Post Description from User Base',
            contenuto: 'Test Post Content from User Base',
            luogo: 'Test Location from User Base',
            posizione: { latitudine: 45.0, longitudine: 10.0 },
            data_creazione: new Date(),
            utente_id: userBase._id  // Associa il post all'ID dell'utente base
        })

        await post1.save();

        post2 = new Post({
            descrizione: 'Test2 Post Description from User Base',
            contenuto: 'Test Post Content from User Base',
            luogo: 'Test Location from User Base',
            posizione: { latitudine: 45.0, longitudine: 10.0 },
            data_creazione: new Date(),
            utente_id: userBase._id  // Associa il post all'ID dell'utente base
        })

        await post2.save();
            


        like = new Like({
            data_creazione: new Date(),
            utente_id: userBase._id,
            post_id: post1._id
        })

        await like.save();

        likeId = like._id
        postId1 = post1._id;
        postId2 = post2._id;

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








    // ---------------------- Sezione test estrazione like ------------------------------------------------------//

    // ---------------------- Sezione test estrazione like positiva ------------------------------------------------------//
    test('Estrazione dei like tramite id corretto di un post', async () => {
        const res = await request(app)
            .get(`/api/like/post/${postId1}`)
            .expect(200)
            .expect('Content-Type', /json/);

        expect(res.body).toBeDefined();
    });
// ---------------------- Sezione test estrazione like negativa ------------------------------------------------------//
    test('Estrazione dei like tramite id non valido', async () => {
        const res = await request(app)
            .get(`/api/like/post/6736020b2b45400acaf456b3`)  // Usa l'ID del post creato
            .expect(404)
            .expect('Content-Type', /json/);
        
    });


    // ---------------------- Sezione test creazione post ------------------------------------------------------//

    // ---------------------- Sezione test creazione positiva ------------------------------------------------------//  
    test('Creazione di un like tramite un id valido di un post e un token di un utente base.', async () => {

        const res = await request(app)
            .post(`/api/like/${postId2}`)
            .set('Authorization', `Bearer ${userBaseToken}`)
            .expect(201)
            .expect('Content-Type', /json/);

    });
    //----------------------------------------------------------------------------------------------------------------------------------//

    // ---------------------- Sezione test creazione negativa ------------------------------------------------------//  

    test('Creazione di un like tramite un id non valido e un token di un utente base.', async () => {

        const res = await request(app)
            .post('/api/like/6736020b2b45400acaf456b3')
            .set('Authorization', `Bearer ${userBaseToken}`)
            .expect(404)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('error', 'Post non trovato');
    });

    test('Creazione di un like tramite un id valido di un post e un token di un utente base che ha già creato un like per quel post', async () => {

        const res = await request(app)
            .post(`/api/like/${postId2}`)
            .set('Authorization', `Bearer ${userBaseToken}`)
            .expect(400)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('error', 'Hai già messo un like su questo post');
    });

    test('Creazione di un like tramite un id valido di un post e un token mancante', async () => {

        const res = await request(app)
            .post(`/api/like/'${postId2}`)
            .expect(401)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('message', 'No token provided', "success", false);
    });



    // ---------------------- Sezione test delete post ------------------------------------------------------ //

    // ---------------------- Sezione test eliminazione post (casi negativi) ------------------------------------------------------

    test('Eliminazione di un like tramite un id mancante e un token', async () => {
        const res = await request(app)
            .delete(`/api/like/`)  // ID mancante
            .set('Authorization', `Bearer ${userBaseToken}`)  // Token dell'utente che ha creato il post
            .expect(404)
    });

    test('Eliminazione di un like tramite un id non valido e un token', async () => {
        const res = await request(app)
            .delete(`/api/like/67aa35194e7b2cf2b13cbf36`)  // ID mancante
            .set('Authorization', `Bearer ${userBaseToken}`)  // Token dell'utente che ha creato il post
            .expect(404)
    });

    test('Eliminazione di un like tramite il suo id valido e un token mancante', async () => {
        const res = await request(app)
            .delete(`/api/like/${likeId}`)  // ID non valido (non esiste nel DB)
            .expect(401)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('message', 'No token provided');
        expect(res.body).toHaveProperty('success', false);
    });

    test('Eliminazione di un like tramite il suo id valido e un token di un utente che non ha creato il like', async () => {
        const res = await request(app)
            .delete(`/api/like/${likeId}`)  // ID del post creato
            .set('Authorization', `Bearer ${otherToken}`)  // Token dell'utente che ha creato il post
            .expect(403)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('error', 'Non autorizzato a rimuovere questo like');
    });


    // ---------------------- Sezione test eliminazione post (casi positivi) ----------------------------------------------------------//
    test('Eliminazione di un like tramite il suo id valido e un token dell’utente che ha creato il like', async () => {
        const res = await request(app)
            .delete(`/api/like/${likeId}`)  // ID del post creato
            .set('Authorization', `Bearer ${userBaseToken}`)  // Token dell'utente che ha creato il post
            .expect(200)
            .expect('Content-Type', /json/);

        expect(res.body).toHaveProperty('message', 'Like rimosso con successo');
    });
    //----------------------------------------------------------------------------------------------------------------------------------//

});













