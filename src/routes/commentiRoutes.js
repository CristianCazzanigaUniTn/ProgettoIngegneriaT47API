// Import delle dipendenze necessarie
const express = require('express');
const Commento = require('../model/Commento');
const Post = require('../model/Post'); // Modello per la collezione "Post" (presumendo che esista)
const tokenChecker = require('../src/TokenChecker');
const router = express.Router();

/**
 * @swagger
 * /api/Commenti:
 *   post:
 *     summary: Crea un nuovo commento
 *     description: Crea un commento protetto da token JWT.
 *     tags: [Commenti]
 *     security:
 *       - bearerAuth: []  # Protegge la rotta con il JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               post_id:
 *                 type: string
 *                 description: ID del post su cui si commenta
 *               contenuto:
 *                 type: string
 *                 description: Contenuto del commento
 *           example:
 *             post_id: "6736020b2b45400acaf456b3"
 *             contenuto: "Questo è un commento."
 *     responses:
 *       '201':
 *         description: Commento creato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Commento creato con successo'
 *                 commento:
 *                   type: object
 *                   properties:
 *                     utente_id:
 *                       type: string
 *                       example: '6736020b2b45400acaf456b4'
 *                     post_id:
 *                       type: string
 *                       example: '6736020b2b45400acaf456b3'
 *                     commento:
 *                       type: string
 *                       example: 'Questo è un commento.'
 *       '400':
 *         description: Dati mancanti o non validi
 *       '401':
 *         description: Token mancante o non valido
 *       '404':
 *         description: Post non trovato
 *       '500':
 *         description: Errore durante la creazione del commento
 */
router.post('/api/Commenti', tokenChecker, async (req, res) => {
    const { post_id, contenuto } = req.body;

    if (!post_id || !contenuto) {
        return res.status(400).json({ error: 'Post_id e contenuto sono obbligatori' });
    }

    console.log("Dati utente decodificati dal token:", req.user);

    if (!req.user || !req.user._id) {
        console.log("Token non valido o mancante");
        return res.status(401).json({ error: 'Token non valido o mancante' });
    }

    try {
        const post = await Post.findOne({_id: post_id});
        if (!post) {
            return res.status(404).json({ error: 'Post non trovato' });
        }

        const nuovoCommento = new Commento({
            utente_id: req.user._id,
            post_id: post_id,
            commento: contenuto,
        });

        const commento = await nuovoCommento.save();
        res.status(201).json({ message: 'Commento creato con successo', commento });
    } catch (err) {
        console.error('Errore nella creazione del commento:', err);
        res.status(500).json({ error: 'Errore nella creazione del commento', details: err });
    }
});



/**
 * @swagger
 * /api/commenti/post/{id}:
 *   get:
 *     summary: Recupera commenti di un post
 *     tags: [Commenti]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del post
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Commenti trovati
 *       404:
 *         description: Post non trovato
 *       500:
 *         description: Errore nel recupero dei commenti
 */
router.get('/api/commenti/post/:id', async (req, res) => {
    try {
        const post = await Post.findOne({_id: req.params.id});
        if (!post) {
            return res.status(404).json({ error: 'Post non trovato' });
        }
        const commenti = await Commento.find({ post_id: req.params.id });
        if (commenti.length === 0) {
            return res.status(200).json({ message: 'Post trovato, ma non ha commenti' });
        }
        res.status(200).json(commenti);
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero dei commenti', message: err.message });
    }
});



/**
 * @swagger
 * /api/Commenti/{id}:
 *   delete:
 *     summary: Elimina un commento
 *     tags: [Commenti]
 *     security:
 *       - bearerAuth: []  # Protegge la rotta con il JWT
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del commento da eliminare
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Commento eliminato con successo
 *       403:
 *         description: Non autorizzato a eliminare questo commento
 *       404:
 *         description: Commento non trovato
 *       500:
 *         description: Errore del server
 */
router.delete('/api/Commenti/:id', tokenChecker, async (req, res) => {
    const commentoId = req.params.id;
    try {
        const commento = await Commento.findById(commentoId);
        if (!commento) {
            return res.status(404).json({ error: 'Commento non trovato' });
        }
        if (commento.utente_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Non autorizzato a eliminare questo commento' });
        }
        await Commento.findByIdAndDelete(commentoId);
        res.status(200).json({ message: 'Commento eliminato con successo' });
    } catch (err) {
        console.error('Errore durante l\'eliminazione del commento:', err);
        res.status(500).json({ error: 'Errore del server', details: err.message });
    }
});


module.exports = router;



