// index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const likeRoutes = require('./src/routes/likeRoutes');
const partecipazioniRoutes = require('./src/routes/partecipazioniRoutes');
const commentiRoutes = require('./src/routes/commentiRoutes');
const eventRoutes = require('./src/routes/eventRoutes');
const partyRoutes = require('./src/routes/partyRoutes');
const faqRoutes = require('./src/routes/faqRoutes');
const postRoutes = require('./src/routes/postRoutes');
const cloudFotoRoutes = require('./src/routes/cloudFotoRoutes');
const emailRoutes = require('./src/routes/EmailRoutes');
const categoryRoutes = require('./src/routes/categoriaRoutes');
const app = express();
const cors = require('cors');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 8080;
const DB = process.env.DB;

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Documentation',
            version: '1.0.0',
            description: 'A simple Express API application for user authentication',
        },
        servers: [
            {
                url: `https://eventlyapi.onrender.com`
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        }
    },
    apis: ['./src/routes/authRoutes.js', './src/routes/userRoutes.js', './src/routes/commentiRoutes.js', './src/routes/likeRoutes.js', './src/routes/partecipazioniRoutes.js', './src/routes/eventRoutes.js', './src/routes/partyRoutes.js', './src/routes/faqRoutes.js', './src/routes/postRoutes.js', './src/routes/cloudFotoRoutes.js', './src/routes/EmailRoutes.js', './src/routes/categoriaRoutes.js'] 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(cors());

app.use((req, res, next) => {
    // Imposta la politica Cross-Origin-Opener-Policy su 'same-origin'
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    next();
});


app.use(authRoutes);
app.use(userRoutes);
app.use(commentiRoutes);
app.use(likeRoutes);
app.use(partecipazioniRoutes);
app.use(eventRoutes);
app.use(partyRoutes);
app.use(faqRoutes);
app.use(postRoutes);
app.use(cloudFotoRoutes);
app.use(emailRoutes);
app.use(categoryRoutes);

if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(DB)
        .then(() => {
            console.log('Connected to MongoDB');
            const PORT = process.env.PORT || 3000; 
    
        app.listen(PORT, () => {
            console.log(`Example app listening at http://localhost:${PORT}`);
        });
        })
        .catch((err) => {
            console.log('Failed to connect to MongoDB', err);
    });
    }

module.exports = app;