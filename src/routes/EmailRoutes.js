const express = require('express');
const router = express.Router();
const User = require('../model/User');
const sgMail = require('@sendgrid/mail');

// Configura SendGrid
sgMail.setApiKey(process.env.EMAIL_API_KEY);

/**
 * @swagger
 * /send-email:
 *   post:
 *     summary: Invia un'email ad un utente base
 *     tags: [EmailService]
 *     description: Questo endpoint consente di inviare un'email agli utenti.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *                 description: Indirizzo email del destinatario
 *               subject:
 *                 type: string
 *                 description: Oggetto dell'email
 *               text:
 *                 type: string
 *                 description: Contenuto testuale dell'email
 *               html:
 *                 type: string
 *                 description: Contenuto HTML dell'email
 *     responses:
 *       200:
 *         description: Email inviata con successo
 *     security:
 *       - bearerAuth: []
 */
router.post('/send-email', async (req, res) => {
    const { to, subject, text, html } = req.body;

    // Validazione dei dati
    if (!to || !subject || !text || !html) {
        return res.status(400).json({ error: 'Tutti i campi sono obbligatori (to, subject, text, html).' });
    }

    const msg = {
        to,
        from: process.env.EMAIL_SENDER, // Variabile d'ambiente
        subject,
        text,
        html,
    };

    try {
        const response = await sgMail.send(msg);
        res.status(200).json({ 
            message: 'Email inviata con successo!', 
            id: response[0]?.headers['x-message-id'] 
        });
    } catch (error) {
        console.error('Errore durante l\'invio dell\'email:', error.response ? error.response.body : error);
        res.status(500).json({ error: 'Errore durante l\'invio dell\'email.' });
    }
});

/**
 * @swagger
 * /verify:
 *   get:
 *     summary: Verifica un account utente
 *     tags: [EmailService]
 *     description: Questo endpoint verifica un account utente utilizzando un token univoco.
 *     parameters:
 *       - name: token
 *         in: query
 *         required: true
 *         description: Il token di verifica univoco
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Verifica completata con successo
 *       400:
 *         description: Token non valido o utente già verificato
 *       404:
 *         description: Utente non trovato
 */
router.get('/verify', async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ error: 'Token mancante nella richiesta.' });
    }

    try {
        // Cerca l'utente con il token
        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            return res.status(404).json({ error: 'Utente non trovato o token non valido.' });
        }

        if (user.verified) {
            return res.status(400).json({ error: 'Utente già verificato.' });
        }

        // Verifica l'utente
        user.verified = true;
        user.verificationToken = null; // Rimuovi il token
        await user.save();

        res.status(200).json({ message: 'Account verificato con successo!' });
    } catch (error) {
        console.error('Errore durante la verifica dell\'utente:', error);
        res.status(500).json({ error: 'Errore interno del server.' });
    }
});

module.exports = router;
