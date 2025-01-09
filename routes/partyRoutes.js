const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Party = require('../model/Party'); // Assicurati che il percorso sia corretto
const Category = require('../model/Categoria');
const tokenChecker = require('../src/TokenChecker');


/**
 * @swagger
 * tags:
 *   name: Party
 *   description: Gestione dei party
 */

/**
 * @swagger
 * /api/party:
 *   get:
 *     summary: Recupera tutti i party
 *     tags: [Party]
 *     responses:
 *       200:
 *         description: Party trovati
 */
router.get('/api/party', async (req, res) => {
    try {
        const parties = await Party.find();
        res.json(parties);
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero dei party' });
    }
});

/**
 * @swagger
 * /api/party/{id}:
 *   get:
 *     summary: Recupera un party specifico
 *     tags: [Party]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del party
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Party trovato
 *       404:
 *         description: Party non trovato
 */
router.get('/api/party/:id', async (req, res) => {
    try {
        const party = await Party.findById(req.params.id);
        if (!party) {
            return res.status(404).json({ error: 'Party non trovato' });
        }
        res.json(party);
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero del party' });
    }
});

/**
 * @swagger
 * /api/party:
 *   post:
 *     summary: Crea un nuovo party
 *     tags: [Party]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               descrizione:
 *                 type: string
 *               data_inizio:
 *                 type: string
 *                 format: date-time
 *               luogo:
 *                 type: string
 *               posizione:
 *                 type: object
 *                 properties:
 *                   latitudine:
 *                     type: number
 *                   longitudine:
 *                     type: number
 *               numero_massimo_partecipanti:
 *                 type: integer
 *               foto:
 *                 type: string
 *               data_creazione:
 *                 type: string
 *                 format: date-time
 *               id_categoria:
 *                 type: string
 *     responses:
 *       201:
 *         description: Party creato con successo
 *       403:
 *         description: Non autenticato/Non autorizzato a creare un party
 *       400:
 *         description: ID non valido o errore nei dati di input
 *       500:
 *         description: Errore nella creazione del party
 */
router.post('/api/party', tokenChecker, async (req, res) => {
    const {
        nome, descrizione, data_inizio, luogo, posizione, numero_massimo_partecipanti, foto, data_creazione, id_categoria
    } = req.body;

    try {

        if(!req.user)
            return res.status(403).json({ error: 'Utente non autenticato' });

        if(req.user.ruolo.toString() != "utente_base")
            return res.status(403).json({ error: 'Non autorizzato a eliminare questo party' });

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

        // Verifica che l'ID della categoria sia valido
        if (id_categoria && !mongoose.Types.ObjectId.isValid(id_categoria)) {
            return res.status(400).json({ error: 'ID categoria non valido' });
        }

        // Verifica che la categoria esista nel database, se l'ID è valido
        if (id_categoria) {
            const categoria = await Category.findById(id_categoria);
            if (!categoria) {
                return res.status(400).json({ error: 'Categoria non trovata' });
            }
        }

        // Creare l'oggetto party
        const newParty = new Party({
            nome,
            descrizione,
            data_inizio: data_inizio ? new Date(data_inizio) : undefined,
            luogo,
            posizione: {
                latitudine: lat,
                longitudine: lng
            },
            numero_massimo_partecipanti,
            foto,
            Organizzatore: req.user._id, // Assumendo che sia un ObjectId valido
            data_creazione: data_creazione ? new Date(data_creazione) : undefined,
            Categoria: id_categoria // Assumendo che sia un ObjectId valido
        });

        const savedParty = await newParty.save();
        res.status(201).json(savedParty);
    } catch (err) {
        res.status(500).json({ error: 'Errore nella creazione del party' });
    }
});

/**
 * @swagger
 * /api/party/{id}:
 *   delete:
 *     summary: Elimina un party specifico
 *     tags: [Party]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID del party
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Party eliminato con successo
 *       403:
 *         description: Non autenticato/Non autorizzato a eliminare questo party
 *       404:
 *         description: Party non trovato
 *       500:
 *         description: Errore nell'eliminazione del party
 */
router.delete('/api/party/:id', tokenChecker, async (req, res) => {
    const partyId = req.params.id;
    try {
        const party = await Party.findById(partyId);
        if (!party) 
            return res.status(404).json({ error: 'Party non trovato' });
        if(!req.user)
            return res.status(403).json({ error: 'Utente non autenticato' });
        if(party.Organizzatore.toString() != req.user._id.toString())
            return res.status(403).json({ error: 'Non autorizzato a eliminare questo party' });
        await Party.findByIdAndDelete(partyId);
        res.status(200).json({ message: 'Party eliminato con successo' });
    } catch (err) {
        res.status(500).json({ error: 'Errore nell\'eliminazione del party' });
    }
});

/**
 * @swagger
 * /api/party/coordinate:
 *   post:
 *     summary: Recupera party in delle coordinate specifiche
 *     tags: [Party]
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
 *         description: Lista di party trovati
 *       400:
 *         description: Parametri non validi
 *       404:
 *         description: Nessun party trovato
 */
router.post('/api/party/coordinate', async (req, res) => {
    const { lat, lng } = req.body;

    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
        return res.status(400).json({ error: 'Latitudine o longitudine non valide' });
    }

    try {
        const parties = await Party.find({
            'posizione.latitudine': lat,
            'posizione.longitudine': lng,
        });

        if (parties.length === 0) {
            return res.status(404).json({ error: 'Nessun party trovato' });
        }

        res.json(parties);
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero dei party' });
    }
});

/**
 * @swagger
 * /api/party/organizzatore/{organizzatore_id}:
 *   get:
 *     summary: Recupera i party creati dallo stesso organizzatore
 *     tags: [Party]
 *     parameters:
 *       - name: organizzatore_id
 *         in: path
 *         required: true
 *         description: ID dell'organizzatore
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Party trovati
 *       404:
 *         description: Party non trovati
 */
router.get('/api/party/organizzatore/:organizzatore_id', async (req, res) => {
    try {
        const parties = await Party.find({ Organizzatore: req.params.organizzatore_id });
        if (parties.length === 0) {
            return res.status(404).json({ error: 'Nessun party trovato' });
        }
        res.json(parties);
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero dei party' });
    }
});

/**
 * @swagger
 * /api/party/categoria/{categoria}:
 *   get:
 *     summary: Recupera i party in base alla categoria
 *     tags: [Party]
 *     parameters:
 *       - name: categoria
 *         in: path
 *         required: true
 *         description: Categoria del party
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Party trovati
 *       404:
 *         description: Party non trovati
 */
router.get('/api/party/categoria/:categoria', async (req, res) => {
    try {
        const parties = await Party.find({ Categoria: req.params.categoria });
        if (parties.length === 0) {
            return res.status(404).json({ error: 'Nessun party trovato' });
        }
        res.json(parties);
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero dei party' });
    }
});

/**
 * @swagger
 * /api/party/ricerca:
 *   post:
 *     summary: Recupera party in un raggio specifico
 *     tags: [Party]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lat:
 *                 type: number
 *                 description: Latitudine del party
 *               lng:
 *                 type: number
 *                 description: Longitudine del party
 *               rad:
 *                 type: number
 *                 description: Raggio di ricerca in chilometri
 *     responses:
 *       200:
 *         description: Lista di party trovati
 *       400:
 *         description: Parametri non validi
 *       404:
 *         description: Nessun party trovato nel raggio specificato
 */
router.post('/api/party/ricerca', async (req, res) => {
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
        const party = await Party.find();

        const partyNelRaggio = party.filter(party => {
            const distanza = haversineDistance(lat, lng, party.posizione.latitudine, party.posizione.longitudine);
            return distanza <= rad; // Filtra party che sono nel raggio specificato
        });

        if (partyNelRaggio.length === 0) {
            return res.status(404).json({ error: 'Nessun party trovato nel raggio specificato' });
        }

        res.json(partyNelRaggio);
    }catch (err) {
        res.status(500).json({ error: 'Errore nel recupero dei party', dettagli: err.message });
    }
});

module.exports = router;