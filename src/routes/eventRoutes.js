const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Event = require('../model/Evento'); // Assicurati che il percorso sia corretto
const tokenChecker = require('../tokenChecker/TokenChecker');
const Category = require('../model/Categoria');
const User = require('../model/User');

/**
 * @swagger
 * tags:
 *   name: Eventi
 *   description: Gestione degli eventi
 */

/**
 * @swagger
 * /api/eventi:
 *   get:
 *     summary: Recupera tutti gli eventi
 *     tags: [Eventi]
 *     responses:
 *       200:
 *         description: Eventi trovati
 *       500:
 *         description: Errore interno nel recupero degli eventi
 */
router.get('/api/eventi', async (req, res) => {
    try {
        const eventi = await Event.find();
        res.json(eventi);
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero degli eventi' });
    }
});

/**
 * @swagger
 * /api/eventi/{id}:
 *   get:
 *     summary: Recupera un evento specifico
 *     tags: [Eventi]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID dell'evento
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Evento trovato
 *       400:
 *         description: Evento ID richiesto
 *       404:
 *         description: Evento non trovato
 *       500:
 *         description: Errore nel recupero dell'evento
 */
router.get('/api/eventi/:id', async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({
                success: false,
                message: 'Evento ID richiesto',
            });
        }

        const evento = await Event.findById(req.params.id);
        if (!evento) return res.status(404).json({ error: 'Evento non trovato' });
        res.json(evento);
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero dell\'evento' });
    }
});

/**
 * @swagger
 * /api/eventi:
 *   post:
 *     summary: Crea un nuovo evento
 *     tags: [Eventi]
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
 *         description: Evento creato con successo
 *       403:
 *         description: Non autenticato/Non autorizzato a creare un evento
 *       400:
 *         description: ID non valido o errore nei dati di input
 *       404:
 *         description: Categoria non trovata
 *       500:
 *         description: Errore nella creazione dell'evento
 */
router.post('/api/eventi', tokenChecker, async (req, res) => {
    const {
        nome, descrizione, data_inizio, luogo, posizione, numero_massimo_partecipanti, foto, data_creazione, id_categoria
    } = req.body;

    try {


        if(!nome || !descrizione || !data_inizio || !luogo || !posizione || !numero_massimo_partecipanti || !foto || !data_creazione || !id_categoria){
            return res.status(400).json({ error: 'Tutti i campi sono richiesti' });
        }

        if(!req.user)
            return res.status(403).json({ error: 'Utente non autenticato' });

        if(req.user.ruolo.toString() != "organizzatore")
            return res.status(403).json({ error: 'Non autorizzato a creare questo evento' });

        
        if (data_inizio && data_creazione && data_inizio < data_creazione) {
            if(!data_inizio || !data_creazione)
            {
                return res.status(400).json({ error: 'date errate' });
            }
            return res.status(400).json({ error: 'data inizio errata' });
        }   

        let lat = 0;
        let lng = 0;

        // Verifica che la posizione sia valida
        if (posizione && posizione.latitudine && posizione.longitudine) {
            lat = parseFloat(posizione.latitudine);
            lng = parseFloat(posizione.longitudine);
        }

        // Verifica che la latitudine e la longitudine siano valide
        if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
            return res.status(400).json({ error: 'Latitudine o longitudine non valide' });
        }

        // Verifica che la categoria esista nel database
        if (id_categoria) {
            const categoria = await Category.findOne({_id:id_categoria});
            if (!categoria) {

                return res.status(404).json({ error: 'Categoria non trovata' });
            }
        }


        // Creare l'oggetto evento
        const nuovoEvento = new Event({
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
            Organizzatore: req.user._id, 
            data_creazione: data_creazione ? new Date(data_creazione) : undefined,
            Categoria: id_categoria 
        });

        const eventoCreato = await nuovoEvento.save();
        res.status(201).json(eventoCreato);
    } catch (err) {
        console.error('Errore nella creazione dell\'evento:', err);
        res.status(500).json({ error: 'Errore nella creazione dell\'evento', dettagli: err.message });
    }
});

/**
 * @swagger
 * /api/eventi/{id}:
 *   delete:
 *     summary: Elimina un evento specifico
 *     tags: [Eventi]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID dell'evento
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Evento eliminato con successo
 *       403:
 *         description: Non autenticato/Non autorizzato a eliminare questo evento
 *       404:
 *         description: Evento non trovato
 *       500:
 *         description: Errore nell'eliminazione dell'evento
 */
router.delete('/api/eventi/:id', tokenChecker, async (req, res) => {
    const eventoId = req.params.id;
    try {
        const evento = await Event.findById(eventoId);
        if (!evento) 
            return res.status(404).json({ error: 'Evento non trovato' });
        if(!req.user)
            return res.status(403).json({ error: 'Utente non autenticato' });
        if(evento.Organizzatore.toString() != req.user._id.toString())
            return res.status(403).json({ error: 'Non autorizzato a eliminare questo evento' });
        await Event.findByIdAndDelete(eventoId);
        res.status(200).json({ message: 'Evento eliminato con successo' });
    } catch (err) {
        res.status(500).json({ error: 'Errore nell\'eliminazione dell\'evento', dettagli: err.message });
    }
});

/**
 * @swagger
 * /api/eventi/coordinate:
 *   post:
 *     summary: Recupera eventi nelle coordinate specificate
 *     tags: [Eventi]
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
 *         description: Eventi trovati
 *       400:
 *         description: Latitudine o longitudine non valide
 *       404:
 *         description: Nessun evento trovato
 *       500:
 *         description: Errore interno nel recupero degli eventi
 */
router.post('/api/eventi/coordinate', async (req, res) => {
    const { lat, lng } = req.body;

    if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
        return res.status(400).json({ error: 'Latitudine o longitudine non valide' });
    }

    try {
        const eventi = await Event.find({
            'posizione.latitudine': lat,
            'posizione.longitudine': lng
        });
        if (eventi.length === 0) return res.status(404).json({ error: 'Evento non trovato' });
        res.json(eventi);
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero degli eventi' });
    }
});

/**
 * @swagger
 * /api/eventi/organizzatore/{organizzatore_id}:
 *   get:
 *     summary: Recupera gli eventi creati dallo stesso organizzatore
 *     tags: [Eventi]
 *     parameters:
 *       - name: organizzatore_id
 *         in: path
 *         required: true
 *         description: ID dell'organizzatore
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Eventi trovati
 *       404:
 *         description: Organizzatore non trovato
 */
router.get('/api/eventi/organizzatore/:organizzatore_id', async (req, res) => {

    try {
        // Converti l'ID in ObjectId usando "new" per evitare il problema
        const organizzatoreId = new mongoose.Types.ObjectId(req.params.organizzatore_id);
        const organizzatore = await User.findOne({_id: organizzatoreId});
        if (!organizzatore) {
            return res.status(404).json({ error: 'Organizzatore non trovato' });
        }else{
            // Cerca gli eventi associati a quell'organizzatore
            const events = await Event.find({ Organizzatore: organizzatoreId });
            return res.status(200).json(events);       
        }

    } catch (err) {

        res.status(500).json({ error: 'Errore nel recupero degli eventi', dettagli: err.message });
    }
});

/**
 * @swagger
 * /api/eventi/categoria/{categoria}:
 *   get:
 *     summary: Recupera gli eventi in base alla categoria
 *     tags: [Eventi]
 *     parameters:
 *       - name: categoria
 *         in: path
 *         required: true
 *         description: Categoria dell'evento
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Eventi trovati
 *       404:
 *         description: Eventi non trovati
 */
router.get('/api/eventi/categoria/:categoria', async (req, res) => {
    try {
        const events = await Event.find({ Categoria: req.params.categoria });
        if (events.length === 0) {
            return res.status(404).json({ error: 'Nessun evento trovato' });
        }
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero degli eventi' });
    }
});

/**
 * @swagger
 * /api/eventi/ricerca:
 *   post:
 *     summary: Recupera eventi entro un raggio specificato
 *     tags: [Eventi]
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
 *               rad:
 *                 type: number
 *     responses:
 *       200:
 *         description: Eventi trovati nel raggio specificato
 *       400:
 *         description: Parametri non validi
 *       404:
 *         description: Nessun evento trovato nel raggio specificato
 *       500:
 *         description: Errore interno nel recupero degli eventi
 */
router.post('/api/eventi/ricerca', async (req, res) => {
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
        const eventi = await Event.find();

        const eventiNelRaggio = eventi.filter(evento => {
            const distanza = haversineDistance(lat, lng, evento.posizione.latitudine, evento.posizione.longitudine);
            return distanza <= rad; // Filtra eventi che sono nel raggio specificato
        });

        if (eventiNelRaggio.length === 0) {
            return res.status(200).json([]);
        }

        res.json(eventiNelRaggio);
    } catch (err) {
        res.status(500).json({ error: 'Errore nel recupero degli eventi', dettagli: err.message });
    }
});

module.exports = router;