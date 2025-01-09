const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const SECRET = process.env.SECRET;

/**
 * @swagger
 * /api/v1/authentications:
 *   post:
 *     summary: Authenticate user and return a token
 *     description: Authenticates a user by username and password, then returns a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authentication success with token
 *       401:
 *         description: Authentication failed
 *       500:
 *         description: Server error
 */
router.post('/api/v1/authentications', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username }).exec();

        if (user) {
            const isMatch = await user.comparePassword(password);
            if (isMatch && user.verified) {
                const token = jwt.sign({ _id: user._id, ruolo: user.ruolo}, SECRET, { expiresIn: '1h' });
                res.status(200).json({
                    success: true,
                    message: 'Authentication success',
                    token: token,
                    username: user.username,
                    id: user._id,
                    foto_profilo: user.foto_profilo,
                    ruolo: user.ruolo
                });
            } else {
                res.status(401).json({ success: false, message: 'Authentication failed' });
            }
        } else {
            res.status(401).json({ success: false, message: 'Authentication failed' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err });
    }
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @swagger
 * /api/v1/authentications/google:
 *   post:
 *     summary: Authenticate user with Google token and return a JWT token
 *     description: Authenticates a user using a Google token, and returns a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               googleToken:
 *                 type: string
 *                 description: Google ID token from the frontend
 *     responses:
 *       200:
 *         description: Authentication success with JWT token
 *       401:
 *         description: Authentication failed
 *       500:
 *         description: Server error
 */
router.post('/api/v1/authentications/google', async (req, res) => {
    const { googleToken } = req.body;

    if (!googleToken) {
        return res.status(400).json({
            success: false,
            message: 'Missing Google token',
        });
    }

    try {
        // Verify the Google token
        const userData = await verifyGoogleToken(googleToken);

        if (!userData.email) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Google token',
            });
        }

        // Find or create the user in the database
        let user = await User.findOne({ email: userData.email }).exec();

        if (!user) {
            user = new User({
                username: userData.name,
                email: userData.email,
                foto_profilo: userData.picture || '',
                ruolo: 'user',
            });

            await user.save();
        }

        // Generate a JWT token
        const token = jwt.sign({ _id: user._id, ruolo: user.ruolo }, SECRET, { expiresIn: '1h' });

        // Respond with the token and user data
        return res.status(200).json({
            success: true,
            message: 'Authentication success',
            token,
            username: user.username,
            id: user._id,
            foto_profilo: user.foto_profilo,
            ruolo: user.ruolo,
        });

    } catch (error) {
        console.error('Error during Google authentication:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message || 'An unknown error occurred',
        });
    }
});

/**
 * Verifies the Google token and retrieves the user information.
 * @param {string} token - Google ID token
 * @returns {object} - Decoded user data from Google
 * @throws {Error} - If token verification fails
 */
async function verifyGoogleToken(token) {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        return payload;
    } catch (error) {
        console.error('Google token verification failed:', error);
        throw new Error('Invalid Google token');
    }
}


module.exports = router;