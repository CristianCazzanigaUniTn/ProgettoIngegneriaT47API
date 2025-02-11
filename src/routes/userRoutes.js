const express = require('express');
const User = require('../model/User');
const Post = require('../model/Post'); // Modello post
const tokenChecker = require('../src/TokenChecker');
const router = express.Router();


/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Ottieni informazioni sull'utente
 *     description: Ottieni informazioni sull'utente utilizzando un token JWT valido.
 *     security:
 *       - bearerAuth: [] 
 *     responses:
 *       200:
 *         description: Informazioni sull'utente
 *       401:
 *         description: Non autorizzato, token mancante o non valido
 *       404:
 *         description: Utente non trovato
 *       500:
 *         description: Errore del server
 */
router.get('/api/v1/users', tokenChecker, async (req, res) => {
    try {
        console.log("Dati utente nel controller:", req.user);
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: 'Token not valid or missing' });
        }
        const user = await User.findOne({ _id: req.user._id }).exec();  
        if (user) {
            res.status(200).json({
                success: true,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    genere: user.genere,
                    data_registrazione: user.data_registrazione,
                    preferenze_notifiche: user.preferenze_notifiche,
                    ruolo: user.ruolo,
                    foto_profilo: user.foto_profilo,
                    verified: user.verified
                }
            });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message || err });
    }
});

/**
 * @swagger
 * /api/Utenti/ruolo:
 *   get:
 *     summary: Ottieni utenti per ruolo
 *     description: Recupera un elenco di utenti filtrati per ruolo.
 *     tags: [Utenti]
 *     parameters:
 *       - name: ruolo
 *         in: query
 *         required: true
 *         description: Il ruolo degli utenti da filtrare (es., 'organizzatore', 'utente_base', 'amministratore').
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Elenco di utenti con il ruolo specificato
 *       400:
 *         description: Parametro ruolo non valido
 *       404:
 *         description: Nessun utente trovato con il ruolo specificato
 *       500:
 *         description: Errore del server
 */
router.get('/api/Utenti/ruolo', async (req, res) => {
    try {
        const { ruolo } = req.query;  // Get the 'ruolo' query parameter

        if (!ruolo) {
            return res.status(400).json({ success: false, message: 'Role parameter is required' });
        }

        // Query users by role
        const users = await User.find({ ruolo }).exec(); 

        if (users.length > 0) {
            res.status(200).json({
                success: true,
                users: users.map(user => ({
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    genere: user.genere,
                    data_registrazione: user.data_registrazione,
                    preferenze_notifiche: user.preferenze_notifiche,
                    ruolo: user.ruolo,
                    foto_profilo: user.foto_profilo,
                    verified: user.verified
                }))
            });
        } else {
            res.status(404).json({ success: false, message: 'No users found with the specified role' });
        }
    } catch (err) {
        console.error('Error fetching users by role:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});


/**
 * @swagger
 * /api/Utenti/{id}:
 *   get:
 *     summary: Ottieni utente per ID
 *     description: Recupera le informazioni di un utente tramite ID.
 *     tags: [Utenti]
 *     security:
 *       - bearerAuth: []  # Protegge la rotta con il JWT
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: L'ID dell'utente da recuperare.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Informazioni sull'utente
 *       404:
 *         description: Utente non trovato
 *       500:
 *         description: Errore del server
 */
router.get('/api/Utenti/:id', async (req, res) => {
    try {
        const userId = req.params.id; // Ottieni l'ID dall'URL
        const user = await User.findById(userId).exec(); // Cerca l'utente nel database
        
        if (user) {
            // Utente trovato
            res.status(200).json({
                success: true,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    genere: user.genere,
                    data_registrazione: user.data_registrazione,
                    preferenze_notifiche: user.preferenze_notifiche,
                    ruolo: user.ruolo,
                    foto_profilo: user.foto_profilo,
                    verified: user.verified
                }
            });
        } else {
            // Utente non trovato
            res.status(404).json({ success: false, message: 'Utente non trovato' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Errore del server', error: err.message || err });
    }
});


/**
 * @swagger
 * /api/Utenti:
 *   post:
 *     summary: Registra un nuovo utente
 *     description: Crea un nuovo utente nel database. L'ID viene generato automaticamente.
 *     tags: [Utenti]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - username
 *               - email
 *               - password
 *               - genere
 *               - data_registrazione
 *               - preferenze_notifiche
 *               - ruolo
 *               - verificationToken
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Il nome dell'utente
 *               username:
 *                 type: string
 *                 description: Il nome utente dell'utente
 *               email:
 *                 type: string
 *                 format: email
 *                 description: L'email dell'utente
 *               password:
 *                 type: string
 *                 description: La password dell'utente
 *               genere:
 *                 type: string
 *                 description: Il genere dell'utente
 *               data_registrazione:
 *                 type: string
 *                 format: date-time
 *                 description: La data di registrazione
 *               preferenze_notifiche:
 *                 type: string
 *                 description: Preferenze di notifica dell'utente
 *               ruolo:
 *                 type: string
 *                 description: Il ruolo dell'utente
 *               foto_profilo:
 *                 type: string
 *                 description: Foto profilo dell'utente
 *               verificationToken:
 *                 type: string
 *                 description: Token per verifica dell'utente
 *     responses:
 *       201:
 *         description: Utente creato con successo
 *       400:
 *         description: Dati di input non validi o email già esistente
 *       500:
 *         description: Errore del server
 */
router.post('/api/Utenti', async (req, res) => {
    try {
        const { nome, username, email, password, genere, data_registrazione, preferenze_notifiche, ruolo, foto_profilo, verificationToken} = req.body;

        if (!nome || !username || !email || !password || !genere || !data_registrazione || !preferenze_notifiche || !ruolo || !verificationToken) {
            return res.status(400).json({ success: false, message: 'Campi mancanti' });
        }

        const existingUser = await User.findOne({ email }).exec();
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Registrazione fallita, mail già esistente' });
        }
        const existingUser2 = await User.findOne({ username }).exec();
        
        if (existingUser2) {
            return res.status(400).json({ success: false, message: 'Registrazione fallita, username già esistente' });
        }
        const verified = false;

        const newUser = new User({
            nome,
            username,
            email,
            password,
            genere,
            data_registrazione,
            preferenze_notifiche,
            ruolo,
            foto_profilo,
            verified,
            verificationToken
        });

        const savedUser = await newUser.save();
        res.status(201).json({
            success: true,
            user: {
                id: savedUser._id,
                nome: savedUser.nome,
                username: savedUser.username,
                email: savedUser.email,
                genere: savedUser.genere,
                data_registrazione: savedUser.data_registrazione,
                preferenze_notifiche: savedUser.preferenze_notifiche,
                ruolo: savedUser.ruolo,
                foto_profilo: foto_profilo,
                verified: false,
                verificationToken: savedUser.verificationToken
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});


/**
 * @swagger
 * /api/Utenti:
 *   patch:
 *     summary: Aggiorna il nome utente dell'utente autenticato
 *     description: Modifica il nome utente dell'utente attualmente autenticato. Richiede un token JWT valido.
 *     tags: [Utenti]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 description: Il nuovo nome utente per l'utente.
 *     responses:
 *       200:
 *         description: Nome utente aggiornato con successo
 *       400:
 *         description: ID o nome utente non valido
 *       404:
 *         description: Utente non trovato
 *       500:
 *         description: Errore del server
 */
router.patch('/api/Utenti',tokenChecker,async (req, res) => {
    try {
        const userId = req.user._id; // Extract the user's ID from the token
        const { username } = req.body; // New username from request body

        // Validate input
        if (!username) {
            return res.status(400).json({ success: false, message: 'Username is required' });
        }

        // Find user by ID and update username
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { username },
            { new: true, runValidators: true }
        );

        if (updatedUser) {
            res.status(200).json({
                success: true,
                user: {
                    id: updatedUser._id,
                    username: updatedUser.username,
                    email: updatedUser.email,
                    genere: updatedUser.genere,
                    data_registrazione: updatedUser.data_registrazione,
                    preferenze_notifiche: updatedUser.preferenze_notifiche,
                    ruolo: updatedUser.ruolo,
                    foto_profilo: updatedUser.foto_profilo,
                    verified: updatedUser.verified
                }
            });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (err) {
        console.error('Error updating username:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});


/**
 * @swagger
 * /api/Utenti:
 *   delete:
 *     summary: Elimina l'account dell'utente autenticato
 *     description: Permette all'utente autenticato di eliminare il proprio account utilizzando un token JWT valido.
 *     tags: [Utenti]
 *     security:
 *       - bearerAuth: []  # Richiede un token JWT valido
 *     responses:
 *       200:
 *         description: Utente eliminato con successo
 *       401:
 *         description: Non autorizzato, token mancante o non valido
 *       403:
 *         description: Vietato, l'utente non è autorizzato a eliminare questo account
 *       404:
 *         description: Utente non trovato
 *       500:
 *         description: Errore del server
 */
router.delete('/api/Utenti', tokenChecker, async (req, res) => {
    try {
        const userId = req.user._id; // Extract user ID from the token

        // Find and delete the user
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});


/**
 * @swagger
 * /api/Utenti/profilo/{id}:
 *   get:
 *     summary: Ottieni il profilo utente con i post giornalieri
 *     description: Recupera i dettagli di un utente insieme ai suoi post giornalieri in base all'ID utente.
 *     tags: [Utenti]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: L'ID dell'utente
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profilo utente con post
 *       404:
 *         description: Utente o post non trovati
 *       500:
 *         description: Errore del server
 */
router.get('/api/Utenti/profilo/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Cerca l'utente
        const user = await User.findById(id).exec();
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Cerca i post giornalieri dell'utente
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const dailyPosts = await Post.find({
            author: id,
            createdAt: { $gte: today, $lt: tomorrow }
        }).exec();

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                genere: user.genere,
                data_registrazione: user.data_registrazione,
                preferenze_notifiche: user.preferenze_notifiche,
                ruolo: user.ruolo,
                foto_profilo: user.foto_profilo,
                verified: user.verified
            },
            posts: dailyPosts.map(post => ({
                id: post._id,
                title: post.title,
                content: post.content,
                createdAt: post.createdAt
            }))
        });
    } catch (err) {
        console.error('Error fetching profile and posts:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});


module.exports = router;