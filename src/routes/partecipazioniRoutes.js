// Import delle dipendenze necessarie
const express = require('express');
const jwt = require('jsonwebtoken');
const tokenChecker = require('../tokenChecker/TokenChecker');
const PartecipazioneEvento = require('../model/PartecipazioneEvento');
const PartecipazioneParty = require('../model/PartecipazioneParty');
const Evento = require('../model/Evento');
const Party = require('../model/Party');
const User = require('../model/User');
const router = express.Router();

// Middleware per verificare il ruolo utente_base
const verificaRuolo = (req, res, next) => {
    const userRole = req.user.ruolo;
    if (userRole !== 'utente_base') {
        return res.status(403).json({ error: 'Solo utente_base può iscriversi.' });
    }
    next();
};

/**
 * @swagger
 * /api/Partecipazioni/Eventi/{id}:
 *   get:
 *     summary: Recupera utenti partecipanti ad un evento
 *     tags: [Partecipazioni]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID dell'evento
 *         type: string
 *     responses:
 *       '200':
 *         description: Evento trovato
 *       '404':
 *         description: Evento non trovato
 */
router.get('/api/Partecipazioni/Eventi/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const evento = await Evento.findById(id);
        if (!evento) {
            return res.status(404).json({ error: 'Evento non trovato' });
        }
        const partecipazioni = await PartecipazioneEvento.find({ evento_id: id }).populate('utente_id');
        const partecipanti = partecipazioni.map(partecipazione => partecipazione.utente_id);
        res.status(200).json(partecipanti);
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero dei partecipanti dell\'evento', details: err });
    }
});


/**
 * @swagger
 * /api/Partecipazioni/Party/{id}:
 *   get:
 *     summary: Recupera utenti partecipanti ad un party
 *     tags: [Partecipazioni]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del party
 *         type: string
 *     responses:
 *       '200':
 *         description: Party trovato
 *       '404':
 *         description: Party non trovato
 */
router.get('/api/Partecipazioni/Party/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const party = await Party.findById(id);
        if (!party) {
            return res.status(404).json({ error: 'Party non trovato' });
        }
        const partecipazioni = await PartecipazioneParty.find({ party_id: id }).populate('utente_id');
        const partecipanti = partecipazioni.map(partecipazione => partecipazione.utente_id);
        res.status(200).json(partecipanti);
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero dei partecipanti del party' });
    }
});

/**
 * @swagger
 * /api/Partecipazioni/Eventi/{evento_id}:
 *   post:
 *     summary: Crea una partecipazione a un evento
 *     tags: [Partecipazioni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: evento_id
 *         in: path
 *         required: true
 *         description: ID dell'evento
 *         schema:
 *           type: string
 *     responses:
 *       '201':
 *         description: Partecipazione accettata
 *       '404':
 *         description: Utente/Evento non trovato
 *       '409':
 *         description: La partecipazione esiste già
 *       '408':
 *         description: Numero massimo di partecipanti raggiunto
 *       '500':
 *         description: Errore nel recupero di un id
 */
router.post('/api/Partecipazioni/Eventi/:evento_id', tokenChecker, verificaRuolo, async (req, res) => {
    const { evento_id } = req.params; 
    const userId = req.user._id; 
    
    try {
        const evento = await Evento.findById(evento_id);
        if (!evento) {
            return res.status(404).json({ error: 'Evento non trovato' });
        }

        const esistente = await PartecipazioneEvento.findOne({ utente_id: userId, evento_id });
        if (esistente) {
            return res.status(409).json({ error: 'Sei già iscritto a questo evento' });
        }

        const partecipazioni = await PartecipazioneEvento.find({ evento_id });
        if (partecipazioni.length >= evento.numero_massimo_partecipanti) {
            return res.status(408).json({ error: 'Numero massimo di partecipanti raggiunto' });
        }

        const nuovaPartecipazione = new PartecipazioneEvento({ utente_id: userId, evento_id,   data_partecipazione: new Date()  });
        await nuovaPartecipazione.save();
        res.status(201).json({ message: 'Partecipazione accettata' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore nella partecipazione all\'evento' });
    }
});

/**
 * @swagger
 * /api/Partecipazioni/Party/{party_id}:
 *   post:
 *     summary: Crea una partecipazione a un party
 *     tags: [Partecipazioni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: party_id
 *         in: path
 *         required: true
 *         description: ID del party
 *         schema:
 *           type: string
 *     responses:
 *       '201':
 *         description: Partecipazione accettata
 *       '404':
 *         description: Utente/Party non trovato
 *       '409':
 *         description: La partecipazione esiste già
 *       '408':
 *         description: Numero massimo di partecipanti raggiunto
 *       '500':
 *         description: Errore nel recupero di un id
 */
router.post('/api/Partecipazioni/Party/:party_id', tokenChecker, verificaRuolo, async (req, res) => {
    const { party_id } = req.params; 
    const userId = req.user._id; 

    try {
        const party = await Party.findById(party_id);
        if (!party) {
            return res.status(404).json({ error: 'Party non trovato' });
        }

        const esistente = await PartecipazioneParty.findOne({ utente_id: userId, party_id });
        if (esistente) {
            return res.status(409).json({ error: 'Sei già iscritto a questo party' });
        }

        const partecipazioni = await PartecipazioneParty.find({ party_id });
        if (partecipazioni.length >= party.numero_massimo_partecipanti) {
            return res.status(408).json({ error: 'Numero massimo di partecipanti raggiunto' });
        }

        const nuovaPartecipazione = new PartecipazioneParty({ utente_id: userId, party_id,  data_partecipazione: new Date()  });
        await nuovaPartecipazione.save();
        res.status(201).json({ message: 'Partecipazione accettata' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore nella partecipazione al party' });
    }
});

/**
 * @swagger
 * /api/Partecipazioni/Eventi/{evento_id}:
 *   delete:
 *     summary: Elimina una partecipazione ad un evento
 *     tags: [Partecipazioni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: evento_id
 *         in: path
 *         required: true
 *         description: ID dell'evento
 *         schema:
 *           type: string
 *     responses:
 *       '204':
 *         description: Partecipazione eliminata con successo
 *       '404':
 *         description: Nessuna partecipazione trovata
 *       '500':
 *         description: Errore nell'eliminazione
 */
router.delete('/api/Partecipazioni/Eventi/:evento_id', tokenChecker, async (req, res) => {
    const { evento_id } = req.params; 
    const userId = req.user._id; 
    try {
        const partecipazione = await PartecipazioneEvento.findOne({ utente_id: userId, evento_id: evento_id });
        if (!partecipazione) {
            return res.status(404).json({ error: 'Partecipazione non trovata' });
        }
        await PartecipazioneEvento.deleteOne({ utente_id: userId, evento_id: evento_id });
        res.status(204).json({ message: 'Partecipazione eliminata con successo' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore nell\'eliminazione della partecipazione' });
    }
});


/**
 * @swagger
 * /api/Partecipazioni/Party/{party_id}:
 *   delete:
 *     summary: Elimina una partecipazione ad un party
 *     tags: [Partecipazioni]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: party_id
 *         in: path
 *         required: true
 *         description: ID del party
 *         schema:
 *           type: string
 *     responses:
 *       '204':
 *         description: Partecipazione eliminata con successo
 *       '404':
 *         description: Nessuna partecipazione trovata
 *       '500':
 *         description: Errore nell'eliminazione
 */
router.delete('/api/Partecipazioni/Party/:party_id', tokenChecker, async (req, res) => {
    const { party_id } = req.params; 
    const userId = req.user._id; 
    try {
        const partecipazione = await PartecipazioneParty.findOne({ utente_id: userId, party_id: party_id });
        if (!partecipazione) {
            return res.status(404).json({ error: 'Partecipazione non trovata' });
        }
        await PartecipazioneParty.deleteOne({ utente_id: userId, party_id });
        res.status(204).json({ message: 'Partecipazione eliminata con successo' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore nell\'eliminazione della partecipazione' });
    }
});


module.exports = router;
