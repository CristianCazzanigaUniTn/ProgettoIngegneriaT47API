const express = require('express');
const Post = require('../model/Post');
const tokenChecker = require('../tokenChecker/TokenChecker');
const router = express.Router();

/**
 * @swagger
 * /api/Post:
 *   get:
 *     summary: Recupera tutti i post
 *     description: Ottieni un elenco di tutti i post nel database, inclusi informazioni aggiuntive come descrizione, posizione e data di creazione.
 *     tags: [Post]
 *     responses:
 *       200:
 *         description: Post recuperati con successo
 *       404:
 *         description: Nessun post trovato
 *       500:
 *         description: Errore del server
 */
router.get('/api/Post', async (req, res) => {
    try {
        // Trova tutti i post nel database
        const posts = await Post.find();

        if (posts.length > 0) {
            res.status(200).json({
                success: true,
                posts: posts.map(post => ({
                    id: post._id,
                    descrizione: post.descrizione,
                    contenuto: post.contenuto,
                    luogo: post.luogo,
                    posizione: post.posizione, // Assicurati che "posizione" sia un oggetto nel modello
                    data_creazione: post.data_creazione,
                    utente_id: post.utente_id, // ID dell'utente autore del post
                }))
            });
        } else {
            res.status(200).json([]);
        }
    } catch (err) {
        console.error('Error fetching posts:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});


/**
 * @swagger
 * /api/Post/{id}:
 *   get:
 *     summary: Recupera i post per ID utente
 *     description: Ottieni un elenco di tutti i post creati da un utente specifico.
 *     tags: [Post]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: L'ID dell'utente i cui post vuoi recuperare.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post recuperati con successo
 *       404:
 *         description: Nessun post trovato per l'utente specificato
 *       500:
 *         description: Errore del server
 */
router.get('/api/Post/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const posts = await Post.find({ utente_id: id }).exec();

        if (posts.length > 0) {
            res.status(200).json({
                success: true,
                posts: posts.map(post => ({
                    id: post._id,
                    descrizione: post.descrizione,
                    contenuto: post.contenuto,
                    luogo: post.luogo,
                    posizione: post.posizione,
                    data_creazione: post.data_creazione,
                }))
            });
        } else {
            res.status(404).json({ success: false, message: 'No posts found for the specified user' });
        }
    } catch (err) {
        console.error('Error fetching posts for user:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

/**
 * @swagger
 * /api/Post:
 *   post:
 *     summary: Crea un nuovo post
 *     description: Crea un nuovo post con i dettagli forniti.
 *     tags: [Post]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               descrizione:
 *                 type: string
 *               contenuto:
 *                 type: string
 *               luogo:
 *                 type: string
 *               posizione:
 *                 type: object
 *                 properties:
 *                   latitudine:
 *                     type: number
 *                   longitudine:
 *                     type: number
 *               data_creazione:
 *                 type: string
 *                 format: date
 *             required:
 *               - descrizione
 *               - contenuto
 *               - luogo
 *               - posizione
 *               - data_creazione
 *     responses:
 *       201:
 *         description: Post creato con successo
 *       400:
 *         description: Campi mancanti o non validi
 *       500:
 *         description: Errore del server
 */
router.post('/api/Post', tokenChecker, async (req, res) => {
    try {
        const { descrizione, contenuto, luogo, posizione, data_creazione } = req.body;

        if (!req.user)
            return res.status(403).json({ error: 'Utente non autenticato' });

        if (req.user.ruolo.toString() != "utente_base")
            return res.status(403).json({ error: 'Non autorizzato a creare questo post' });


        if (!data_creazione) {
            return res.status(400).json({ error: 'data creazione non presente'});
        }

        let lat = 0;
        let lng = 0;

        // Verifica che la posizione sia valida
        if (posizione && posizione.latitudine && posizione.longitudine) {
            lat = parseFloat(posizione.latitudine);
            lng = parseFloat(posizione.longitudine);
        }

        //Verifica che la latitudine e la longitudine siano valide
        if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
            return res.status(400).json({ error: 'Latitudine o longitudine non valide' });
        }


        // Controllo dei campi obbligatori
        if (!descrizione || !luogo || !posizione || !data_creazione) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Creazione del post
        const newPost = new Post({
            descrizione,
            contenuto,
            luogo,
            posizione,
            data_creazione,
            utente_id: req.user._id
        });

        const savedPost = await newPost.save();

        res.status(201).json({
            success: true,
            post: {
                id: savedPost._id,
                descrizione: savedPost.descrizione,
                contenuto: savedPost.contenuto,
                luogo: savedPost.luogo,
                posizione: savedPost.posizione,
                data_creazione: savedPost.data_creazione,
                utente_id: savedPost.utente_id
            }
        });
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});


/**
 * @swagger
 * /api/Post/{id}:
 *   delete:
 *     summary: Elimina un post
 *     description: Elimina un post specifico per ID. Solo il proprietario del post può eliminarlo.
 *     tags: [Post]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: L'ID del post da eliminare
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post eliminato con successo
 *       401:
 *         description: Non autorizzato, l'utente non è il proprietario del post
 *       404:
 *         description: Post non trovato
 *       500:
 *         description: Errore del server
 */
router.delete('/api/Post/:id', tokenChecker, async (req, res) => {
    try {

        if (!req.user)
            return res.status(403).json({ error: 'Utente non autenticato' });

        const postId = req.params.id;
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Verifica che l'utente sia il proprietario del post
        console.log('Post utente_id:', post.utente_id);
        console.log('Richiesta userId:', userId);

        if (post.utente_id.toString() !== userId.toString()) {
            return res.status(401).json({ success: false, message: 'You are not the owner of this post' });
        }


        await Post.findByIdAndDelete(postId);
        res.status(200).json({ success: true, message: 'Post successfully deleted' });
    } catch (err) {
        console.error('Error deleting post:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }

});


/**
 * @swagger
 * /api/Post/luogo:
 *   post:
 *     summary: Recupera i post vicino a una posizione specifica
 *     description: Ottieni post filtrati in base alla vicinanza a un insieme di coordinate specificato.
 *     tags: [Post]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *     responses:
 *       200:
 *         description: Post recuperati con successo
 *       400:
 *         description: Parametri non validi
 *       404:
 *         description: Nessun post trovato nella posizione specificata
 *       500:
 *         description: Errore del server
 */
router.post('/api/Post/luogo', async (req, res) => {
    try {
        const { lat, lng } = req.body;

        //Verifica che la latitudine e la longitudine siano valide
        if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
            return res.status(400).json({ error: 'Latitudine o longitudine non valide' });
        }

        const posts = await Post.find({
            'posizione.latitudine': lat,
            'posizione.longitudine': lng
        });

        if (posts.length > 0) {
            res.status(200).json({
                success: true,
                posts: posts.map(post => ({
                    id: post._id,
                    descrizione: post.descrizione,
                    contenuto: post.contenuto,
                    luogo: post.luogo,
                    posizione: post.posizione,
                    data_creazione: post.data_creazione,
                    utente_id: post.utente_id,
                })),
            });
        } else {
            res.status(404).json({ success: false, message: 'No posts found in the specified location' });
        }
    } catch (err) {
        console.error('Error fetching posts by location:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

/**
 * @swagger
 * /api/Post/{post_id}:
 *   get:
 *     summary: Recupera un post per ID
 *     description: Recupera un post specifico utilizzando il suo identificatore univoco.
 *     tags: [Post]
 *     parameters:
 *       - name: post_id
 *         in: path
 *         required: true
 *         description: L'ID del post da recuperare.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post recuperato con successo
 *       400:
 *         description: L'ID del post è mancante o non valido
 *       404:
 *         description: Post non trovato
 *       500:
 *         description: Errore del server
 */
router.get('/api/Post/:post_id', async (req, res) => {
    try {
        const { _id } = req.params;
        if (!_id) {
            return res.status(400).json({
                success: false,
                message: 'Post ID is required',
            });
        }

        // Recupera il post dal database
        const post = await Post.findById(_id);

        if (post) {
            res.status(200).json({
                success: true,
                post: {
                    id: post._id,
                    descrizione: post.descrizione,
                    contenuto: post.contenuto,
                    luogo: post.luogo,
                    posizione: post.posizione,
                    data_creazione: post.data_creazione,
                    utente_id: post.utente_id,
                },
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Post not found',
            });
        }
    } catch (err) {
        console.error('Error fetching post by ID:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message,
        });
    }
});

/**
 * @swagger
 * /api/Post/ricerca:
 *   post:
 *     summary: Recupera post in un raggio specifico
 *     tags: [Post]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lat:
 *                 type: number
 *                 description: Latitudine del post
 *               lng:
 *                 type: number
 *                 description: Longitudine del post
 *               rad:
 *                 type: number
 *                 description: Raggio di ricerca in chilometri
 *     responses:
 *       200:
 *         description: Lista di post trovati
 *       400:
 *         description: Parametri non validi
 *       404:
 *         description: Nessun post trovato nel raggio specificato
 */
router.post('/api/post/ricerca', async (req, res) => {
    const { lat, lng, rad } = req.body;

    // Validazione dei parametri
    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180 || isNaN(rad) || rad < 0) {
        return res.status(400).json({ error: 'Latitudine, longitudine o raggio non valido' });
    }

    try {
        // Funzione per calcolare la distanza tra due coordinate geografiche
        const haversineDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // Raggio della Terra in chilometri
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c; // Distanza in chilometri
        };

        // Recupera gli eventi e filtra in base alla distanza
        const post = await Post.find();

        const PostNelRaggio = post.filter(post => {
            const distanza = haversineDistance(lat, lng, post.posizione.latitudine, post.posizione.longitudine);
            return distanza <= rad; // Filtra post che sono nel raggio specificato
        });

        if (PostNelRaggio.length === 0) {
            return res.status(200).json([]);
        }

        res.json(PostNelRaggio);
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero dei post', dettagli: err.message });
    }
});

/**
 * @swagger
 * /api/post/organizzatore/{organizzatore_id}:
 *   get:
 *     summary: Recupera i party creati dallo stesso organizzatore
 *     tags: [Post]
 *     parameters:
 *       - name: organizzatore_id
 *         in: path
 *         required: true
 *         description: ID dell'organizzatore
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post trovati
 *       404:
 *         description: Post non trovati
 */
router.get('/api/post/organizzatore/:organizzatore_id', async (req, res) => {
    try {
        const posts = await Post.find({ Organizzatore: req.params.organizzatore_id });
        if (posts.length === 0) {
            return res.status(404).json({ error: 'Nessun post trovato' });
        }
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero dei post' });
    }
});

module.exports = router;
