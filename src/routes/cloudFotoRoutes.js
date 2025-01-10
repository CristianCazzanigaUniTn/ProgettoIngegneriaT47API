const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const tokenChecker = require('../tokenChecker/TokenChecker'); // Verifica il token JWT

// Configurazione di Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

/**
 * @swagger
 * /generate-signed-url-post:
 *   post:
 *     summary: Genera un URL sicuro per il caricamento di immagini su Cloudinary
 *     tags: [CloudFoto]
 *     description: Questo endpoint fornisce un URL sicuro (con firma) che può essere utilizzato per caricare immagini su Cloudinary.
 *     responses:
 *       200:
 *         description: URL sicuro generato con successo
 *     security:
 *       - bearerAuth: []
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 signature:
 *                   type: string
 *                   description: La signature da usare per l'upload
 *                 timestamp:
 *                   type: integer
 *                   description: Il timestamp in secondi
 *                 upload_preset:
 *                   type: string
 *                   description: Il preset di upload configurato su Cloudinary
 */
router.post('/generate-signed-url-post', tokenChecker, (req, res) => {
    // Verifica che l'utente sia autenticato e abbia il ruolo di "utente_base"
    const userRole = req.user ? req.user.ruolo : null; // assuming req.user comes from a JWT decode
    if (userRole !== 'utente_base') {
        return res.status(403).json({ error: 'Solo utente_base può accedere a questo endpoint.' });
    }

    const timestamp = Math.floor(Date.now() / 1000); 
    const upload_preset = 'Post';
    const signature = cloudinary.utils.api_sign_request({
        timestamp,
        upload_preset
    }, process.env.API_SECRET);

    res.json({
        signature,
        timestamp,
        upload_preset,
        api_key: process.env.API_KEY 
    });
});

/**
 * @swagger
 * /generate-signed-url-party:
 *   post:
 *     summary: Genera un URL sicuro per il caricamento di immagini su Cloudinary
 *     tags: [CloudFoto]
 *     description: Questo endpoint fornisce un URL sicuro (con firma) che può essere utilizzato per caricare immagini su Cloudinary.
 *     responses:
 *       200:
 *         description: URL sicuro generato con successo
 *     security:
 *       - bearerAuth: []
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 signature:
 *                   type: string
 *                   description: La signature da usare per l'upload
 *                 timestamp:
 *                   type: integer
 *                   description: Il timestamp in secondi
 *                 upload_preset:
 *                   type: string
 *                   description: Il preset di upload configurato su Cloudinary
 */
router.post('/generate-signed-url-party', tokenChecker, (req, res) => {
    // Verifica che l'utente sia autenticato e abbia il ruolo di "utente_base"
    const userRole = req.user ? req.user.ruolo : null;
    if (userRole !== 'utente_base') {
        return res.status(403).json({ error: 'Solo utente_base può accedere a questo endpoint.' });
    }

    const timestamp = Math.floor(Date.now() / 1000); 
    const upload_preset = 'Party';
    const signature = cloudinary.utils.api_sign_request({
        timestamp,
        upload_preset
    }, process.env.API_SECRET);

    res.json({
        signature,
        timestamp,
        upload_preset,
        api_key: process.env.API_KEY 
    });
});

/**
 * @swagger
 * /generate-signed-url-Eventi:
 *   post:
 *     summary: Genera un URL sicuro per il caricamento di immagini su Cloudinary
 *     tags: [CloudFoto]
 *     description: Questo endpoint fornisce un URL sicuro (con firma) che può essere utilizzato per caricare immagini su Cloudinary.
 *     responses:
 *       200:
 *         description: URL sicuro generato con successo
 *     security:
 *       - bearerAuth: []
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 signature:
 *                   type: string
 *                   description: La signature da usare per l'upload
 *                 timestamp:
 *                   type: integer
 *                   description: Il timestamp in secondi
 *                 upload_preset:
 *                   type: string
 *                   description: Il preset di upload configurato su Cloudinary
 */
router.post('/generate-signed-url-Eventi', tokenChecker, (req, res) => {
    // Verifica che l'utente sia autenticato e abbia il ruolo di "organizzatore"
    const userRole = req.user ? req.user.ruolo : null;
    if (userRole !== 'organizzatore') {
        return res.status(403).json({ error: 'Solo l\'organizzatore può accedere a questo endpoint.' });
    }

    const timestamp = Math.floor(Date.now() / 1000); 
    const upload_preset = 'Eventi';
    const signature = cloudinary.utils.api_sign_request({
        timestamp,
        upload_preset
    }, process.env.API_SECRET);

    res.json({
        signature,
        timestamp,
        upload_preset,
        api_key: process.env.API_KEY 
    });
});


/**
 * @swagger
 * /generate-signed-url-foto-profilo:
 *   post:
 *     summary: Genera un URL sicuro per il caricamento di foto profilo su Cloudinary
 *     tags: [CloudFoto]
 *     description: Questo endpoint fornisce un URL sicuro (con firma) che può essere utilizzato per caricare una foto profilo su Cloudinary.
 *     responses:
 *       200:
 *         description: URL sicuro generato con successo
 *     security: []
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             signature:
 *               type: string
 *               description: La signature da usare per l'upload
 *             timestamp:
 *               type: integer
 *               description: Il timestamp in secondi
 *             upload_preset:
 *               type: string
 *               description: Il preset di upload configurato su Cloudinary
 */
router.post('/generate-signed-url-foto-profilo', (req, res) => {
    const timestamp = Math.floor(Date.now() / 1000); 
    const upload_preset = 'FotoProfilo';  // Preset di Cloudinary per la foto profilo
    const signature = cloudinary.utils.api_sign_request({
        timestamp,
        upload_preset
    }, process.env.API_SECRET);

    res.json({
        signature,
        timestamp,
        upload_preset,
        api_key: process.env.API_KEY 
    });
});


module.exports = router;
