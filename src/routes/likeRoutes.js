// Import delle dipendenze necessarie
const express = require('express');
const Post = require('../model/Post');
const Like = require('../model/Like');
const Commento = require('../model/Commento'); 
const tokenChecker = require('../tokenChecker/TokenChecker');
const router = express.Router();
/**
 * @swagger
 * /api/like/{post_id}:
 *   post:
 *     summary: Aggiungi un like a un post
 *     tags: [Like]
 *     security:
 *       - bearerAuth: []  # Protegge la rotta con il JWT
 *     parameters:
 *       - name: post_id
 *         in: path
 *         required: true
 *         description: ID del post a cui aggiungere il like
 *         schema:
 *           type: string
 *     responses:
 *       '201':
 *         description: Like aggiunto con successo
 *       '400':
 *         description: Like già presente per questo post
 *       '401':
 *         description: Token mancante o non valido
 *       '404':
 *         description: Post non trovato
 *       '500':
 *         description: Errore durante l'aggiunta del like
 */
router.post('/api/like/:post_id', tokenChecker, async (req, res) => {
    const { post_id } = req.params;
    const user_id = req.user._id;

    try {
        const post = await Post.findById(post_id);
        if (!post) {
            return res.status(404).json({ error: 'Post non trovato' });
        }

        if(!req.user || !req.user._id){
            return res.status(401).json({ error: 'Token non valido o mancante'});
        }

        const existingLike = await Like.findOne({ post_id, utente_id: user_id });
        if (existingLike) {
            return res.status(400).json({ error: 'Hai già messo un like su questo post' });
        }

        const nuovoLike = new Like({
            data_creazione: new Date(),
            post_id,
            utente_id: user_id,
        });

        await nuovoLike.save();

        // Includi l'ID del like creato nella risposta
        res.status(201).json({
            message: 'Like aggiunto con successo',
            like: {
                id: nuovoLike._id,       // ID del like appena creato
                post_id: nuovoLike.post_id,
                utente_id: nuovoLike.utente_id,
                data_creazione: nuovoLike.data_creazione
            }
        });
    } catch (err) {
        console.error('Errore nell\'aggiunta del like:', err);
        res.status(500).json({ error: 'Errore nell\'aggiunta del like' });
    }
});

/**
 * @swagger
 * /api/like/{like_id}:
 *   delete:
 *     summary: Rimuovi un like da un post
 *     tags: [Like]
 *     security:
 *       - bearerAuth: []  # Protegge la rotta con il JWT
 *     parameters:
 *       - name: like_id
 *         in: path
 *         required: true
 *         description: ID del like da rimuovere
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Like rimosso con successo
 *       '403':
 *         description: Non autorizzato a rimuovere questo like
 *       '404':
 *         description: Like non trovato
 *       '500':
 *         description: Errore durante la rimozione del like
 */
router.delete('/api/like/:like_id', tokenChecker, async (req, res) => {
    const { like_id } = req.params;
    const user_id = req.user._id;
    try {
        const like = await Like.findById(like_id);
        if (!like) {
            return res.status(404).json({ error: 'Like non trovato' });
        }
        if (like.utente_id.toString() !== user_id.toString()) {
            return res.status(403).json({ error: 'Non autorizzato a rimuovere questo like' });
        }
        await Like.deleteOne({ _id: like_id });
        res.status(200).json({ message: 'Like rimosso con successo' });
    } catch (err) {
        console.error('Errore nella rimozione del like:', err);
        res.status(500).json({ error: 'Errore nella rimozione del like' });
    }
});


/**
 * @swagger
 * /api/like/post/{post_id}:
 *   get:
 *     summary: Recupera tutti i like di un post
 *     security:
 *       - bearerAuth: []  # Protegge la rotta con il JWT
 *     tags: [Like]
 *     parameters:
 *       - name: post_id
 *         in: path
 *         required: true
 *         description: ID del post per cui recuperare i like
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Like trovati
 *       '404':
 *         description: Post non trovato
 *       '500':
 *         description: Errore nel recupero dei like
 */
router.get('/api/like/post/:post_id', async (req, res) => {
    const { post_id } = req.params;
    try {
        const post = await Post.findById(post_id);
        if (!post) {
            return res.status(404).json({ error: 'Post non trovato' });
        }
        const likes = await Like.find({ post_id });
        res.status(200).json(likes);
    } catch (err) {
        console.error('Errore nel recupero dei like:', err);
        res.status(500).json({ error: 'Errore nel recupero dei like' });
    }
});

/**
 * @swagger
 * /api/commenti/{commento_id}/like:
 *   post:
 *     summary: Aggiungi un like a un commento
 *     tags: [Like]
 *     security:
 *       - bearerAuth: []  # Protegge la rotta con il JWT
 *     parameters:
 *       - name: commento_id
 *         in: path
 *         required: true
 *         description: ID del commento a cui aggiungere il like
 *         schema:
 *           type: string
 *     responses:
 *       '201':
 *         description: Like aggiunto con successo
 *       '400':
 *         description: Like già presente per questo commento
 *       '401':
 *         description: Token mancante o non valido
 *       '404':
 *         description: Commento non trovato
 *       '500':
 *         description: Errore durante l'aggiunta del like
 */
router.post('/api/commenti/:commento_id/like', tokenChecker, async (req, res) => {
    const { commento_id } = req.params;
    const user_id = req.user._id;

    try {
        const commento = await Commento.findById(commento_id);
        if (!commento) {
            return res.status(404).json({ error: 'Commento non trovato' });
        }
        const existingLike = commento.like.find((like) => like.utente_id.toString() === user_id.toString());
        if (existingLike) {
            return res.status(400).json({ error: 'Hai già messo un like a questo commento' });
        }
        commento.like.push({
            utente_id: user_id,
        });
        await commento.save();

        res.status(201).json({ message: 'Like aggiunto con successo', like: commento.like });
    } catch (err) {
        console.error('Errore nell\'aggiunta del like:', err);
        res.status(500).json({ error: 'Errore nell\'aggiunta del like' });
    }
});

/**
 * @swagger
 * /api/commenti/{commento_id}/like:
 *   delete:
 *     summary: Rimuovi un like da un commento
 *     tags: [Like]
 *     security:
 *       - bearerAuth: []  # Protegge la rotta con il JWT
 *     parameters:
 *       - name: commento_id
 *         in: path
 *         required: true
 *         description: ID del commento da cui rimuovere il like
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Like rimosso con successo
 *       '403':
 *         description: Non autorizzato a rimuovere questo like
 *       '404':
 *         description: Commento o like non trovato
 *       '500':
 *         description: Errore durante la rimozione del like
 */
router.delete('/api/commenti/:commento_id/like', tokenChecker, async (req, res) => {
    const { commento_id } = req.params;
    const user_id = req.user._id;
    try {
        const commento = await Commento.findById(commento_id);
        if (!commento) {
            return res.status(404).json({ error: 'Commento non trovato' });
        }
        const likeIndex = commento.like.findIndex((like) => like.utente_id.toString() === user_id.toString());
        if (likeIndex === -1) {
            return res.status(404).json({ error: 'Non hai messo un like a questo commento' });
        }
        commento.like.splice(likeIndex, 1);
        await commento.save();
        res.status(200).json({ message: 'Like rimosso con successo' });
    } catch (err) {
        console.error('Errore nella rimozione del like:', err);
        res.status(500).json({ error: 'Errore nella rimozione del like' });
    }
});

/**
 * @swagger
 * /api/commenti/{commento_id}/like:
 *   get:
 *     summary: Recupera tutti i like di un commento
 *     tags: [Like]
 *     parameters:
 *       - name: commento_id
 *         in: path
 *         required: true
 *         description: ID del commento per cui recuperare i like
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Like trovati
 *       '404':
 *         description: Commento non trovato
 *       '500':
 *         description: Errore nel recupero dei like
 */
router.get('/api/commenti/:commento_id/like', async (req, res) => {
    const { commento_id } = req.params;

    try {
        const commento = await Commento.findById(commento_id).populate('like.utente_id', 'username');
        if (!commento) {
            return res.status(404).json({ error: 'Commento non trovato' });
        }

        res.json(commento.like);
    } catch (err) {
        console.error('Errore nel recupero dei like:', err);
        res.status(500).json({ error: 'Errore nel recupero dei like' });
    }
});


module.exports = router;
