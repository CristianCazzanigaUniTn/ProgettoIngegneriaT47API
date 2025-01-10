const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Event = require('../model/Evento'); // Assicurati che il percorso sia corretto
const tokenChecker = require('../tokenChecker/TokenChecker');
const Faq = require('../model/Faq');

/**
 * @swagger
 * tags:
 *   name: FAQ eventi
 *   description: Gestione delle FAQ
 */


/**
 * @swagger
 * /api/faqeventi:
 *   post:
 *     summary: Crea una nuova FAQ evento
 *     tags: [FAQ eventi]
 *     security:
 *       - bearerAuth: []  # Protegge la rotta con il JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_evento:
 *                 type: string
 *               domanda:
 *                 type: string
 *     responses:
 *       201:
 *         description: Faq creata con successo
 *       403:
 *         description: Non autenticato/Non autorizzato a creare una Faq
 *       400:
 *         description: ID non valido o errore nei dati di input
 *       500:
 *         description: Errore nella creazione della faq
 */
router.post('/api/faqeventi', tokenChecker, async (req, res) => {
    const {
        id_evento, domanda
    } = req.body;

    try {

        if(!req.user)
            return res.status(403).json({ error: 'Utente non autenticato' });

        if(req.user.ruolo.toString() != "utente_base")
            return res.status(403).json({ error: 'Non autorizzato a creare una faq eventi' });

        if (id_evento && !mongoose.Types.ObjectId.isValid(id_evento)) {
            return res.status(400).json({ error: 'ID evento non valido' });
        }

        // Verifica che l'evento esista nel database
        if (id_evento) {
            const evento = await Event.findById(id_evento);
            if (!evento) {
                return res.status(400).json({ error: 'Evento non trovato' });
            }
        }

        // Creare l'oggetto evento
        const nuovaFaq = new Faq({
            evento: id_evento,
            utente: req.user._id,
            domanda: domanda,
            risposta: null,
            data_creazione: new Date()
        });

        const faqCreata = await nuovaFaq.save();
        res.status(201).json(faqCreata);
    } catch (err) {
        console.error('Errore nella creazione della faq:', err);
        res.status(500).json({ error: 'Errore nella creazione della faq', dettagli: err.message });
    }
});

/**
 * @swagger
 * /api/faqeventi/{id}:
 *   delete:
 *     summary: Elimina una faq specifica
 *     tags: [FAQ eventi]
 *     security:
 *       - bearerAuth: []  # Protegge la rotta con il JWT
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID della faq
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Faq eliminata con successo
 *       403:
 *         description: Non autenticato/Non autorizzato a eliminare questa faq
 *       404:
 *         description: Faq non trovata
 *       500:
 *         description: Errore nell'eliminazione della faq
 */
router.delete('/api/faqeventi/:id', tokenChecker, async (req, res) => {
    const faqid = req.params.id;
    try {
        const faq = await Faq.findById(faqid);
        if (!faq) 
            return res.status(404).json({ error: 'Faq non trovata' });
        if(!req.user)
            return res.status(403).json({ error: 'Utente non autenticato' });
        if(faq.utente.toString() != req.user._id.toString())
            return res.status(403).json({ error: 'Non autorizzato a eliminare questa faq' });
        await Faq.findByIdAndDelete(faqid);
        res.status(200).json({ message: 'Faq eliminata con successo' });
    } catch (err) {
        res.status(500).json({ error: 'Errore nell\'eliminazione della faq', dettagli: err.message });
    }
});

/**
 * @swagger
 * /api/faqeventi/evento/{evento_id}:
 *   get:
 *     summary: Recupera le faq relative allo stesso evento
 *     tags: [FAQ eventi]
 *     parameters:
 *       - name: evento_id
 *         in: path
 *         required: true
 *         description: ID dell'evento
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Faq trovate
 *       404:
 *         description: Faq non trovate
 */
router.get('/api/faqeventi/evento/:evento_id', async (req, res) => {

    try {
        // Converti l'ID in ObjectId usando "new" per evitare il problema
        const eventoId = new mongoose.Types.ObjectId(req.params.evento_id);

        // Cerca gli eventi associati a quell'organizzatore
        const faq = await Faq.find({ evento: eventoId });

        if (faq.length === 0) {
            return res.status(404).json({ error: 'Nessuna faq trovata' });
        }

        res.json(faq);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore nel recupero deglle faq', dettagli: err.message });
    }
});

/**
 * @swagger
 * /api/faqeventi:
 *   patch:
 *     summary: Rispondi ad un FAQ evento
 *     tags: [FAQ eventi]
 *     security:
 *       - bearerAuth: []  # Protegge la rotta con il JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               risposta:
 *                 type: string
 *     responses:
 *       200:
 *         description: FAQ evento aggiornata con successo
 *       400:
 *         description: ID non valido o errore nei dati di input
 *       403:
 *         description: Utente non autorizzato
 *       404:
 *         description: FAQ non trovata
 *       500:
 *         description: Errore nel server
 */
router.patch('/api/faqeventi', tokenChecker, async (req, res) => {
    const { id, risposta } = req.body;

    try {
        // Verifica che l'ID sia valido
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ error: 'ID non valido' });

        // Trova la FAQ per ID
        const faq = await Faq.findById(id);
        if (!faq)
            return res.status(404).json({ error: 'FAQ non trovata' });

        // Verifica se l'utente è autenticato
        if (!req.user)
            return res.status(403).json({ error: 'Utente non autenticato' });

        // Verifica l'evento associato
        const evento = await Event.findById(faq.evento);
        if (!evento)
            return res.status(404).json({ error: 'Evento non trovato' });

        // Controllo di autorizzazione
        if (evento.Organizzatore.toString() != req.user._id.toString())
            return res.status(403).json({ error: 'Non autorizzato a rispondere a questa FAQ' });

        // Aggiorna la FAQ
        const faqAggiornata = await Faq.findByIdAndUpdate(
            id,
            { risposta: risposta },
            {
                new: true, // Ritorna il documento aggiornato
                runValidators: true // Applica i validator definiti nello schema
            }
        );

        res.status(200).json(faqAggiornata);
    } catch (err) {
        console.error('Errore nella modifica della FAQ:', err);
        res.status(500).json({ error: 'Errore nella modifica della FAQ', dettagli: err.message });
    }
});



module.exports = router;