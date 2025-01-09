const express = require('express');
const Categoria = require('../model/Categoria');
const User = require('../model/User');
const tokenChecker = require('../src/TokenChecker');
const router = express.Router();


/**
 * @swagger
 * /api/categoria/{id}:
 *   get:
 *     summary: Recupera una categoria specifica
 *     tags: [Category]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID della categoria
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoria trovata
 *       404:
 *         description: Categoria non trovata
 */
router.get('/api/categoria/:id', async (req, res) => {
    try {
        const categoria = await Categoria.findById(req.params.id);
        if (!categoria) {
            return res.status(404).json({ error: 'Categoria non trovata' });
        }
        res.json(categoria);
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero della categoria' });
    }
});

/**
 * @swagger
 * /api/categoria:
 *   get:
 *     summary: Recupera tutte le categorie
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: Categorie trovate
 *       500:
 *         description: Errore nel recupero delle categorie
 */
router.get('/api/categoria', async (req, res) => {
    try {
        const categorie = await Categoria.find(); // Retrieves all categories
        res.json(categorie); // Respond with all categories
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero delle categorie' });
    }
});


/**
 * @swagger
 * /api/categoria/{id}:
 *   delete:
 *     summary: Elimina una categoria
 *     tags: [Category]
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
 *         description: Categoria eliminata con successo
 *       403:
 *         description: Non autorizzato a eliminare una categoria
 *       404:
 *         description: Categoria non trovata
 *       500:
 *         description: Errore del server
 */
router.delete('/api/categoria/:id', tokenChecker, async (req, res) => {
    const categoriaId = req.params.id;
    try {
        const categoria = await Categoria.findById(categoriaId);
        if (!categoria) {
            return res.status(404).json({ error: 'Categoria non trovata' });
        } 

        const utente = await User.findById(req.user._id);

        if (utente.ruolo != "Amministratore") {
            return res.status(403).json({ error: 'Non autorizzato a eliminare una categoria' });
        }

        await Categoria.findByIdAndDelete(categoriaId);
        res.status(200).json({ message: 'Categoria eliminata con successo' });
    } catch (err) {
        console.error('Errore durante l\'eliminazione della categoria:', err);
        res.status(500).json({ error: 'Errore del server', details: err.message });
    }
});

/**
 * @swagger
 * /api/categoria:
 *   post:
 *     summary: Crea una nuova categoria
 *     description: Crea una nuova categoria nel database. L'ID viene generato automaticamente.
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []  # Protegge la rotta con il JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Il nome dell'utente
 *     responses:
 *       201:
 *         description: Categoria creata con successo
 *       400:
 *         description: Non autorizzato a creare una categoria
 *       500:
 *         description: Errore del server
 */
router.post('/api/categoria', tokenChecker, async (req, res) => {
    try {
        const { nome } = req.body;

        if (!nome) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const utente = await User.findById(req.user._id);

        if (utente.ruolo != "Amministratore") {
            return res.status(403).json({ error: 'Non autorizzato a creare una categoria' });
        }

        const newCategory = new Categoria({
            nome
        });

        const savedCategory = await newCategory.save();
        res.status(201).json({
            success: true,
            user: {
                id: savedCategory._id,
                nome: savedCategory.nome,
            }
        });
    } catch (err) {
        console.error('Errore nella creazione della categoria:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});


module.exports = router;