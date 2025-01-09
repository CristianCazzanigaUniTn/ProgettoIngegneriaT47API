// index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const likeRoutes = require('./routes/likeRoutes');
const partecipazioniRoutes = require('./routes/partecipazioniRoutes');
const commentiRoutes = require('./routes/commentiRoutes');
const eventRoutes = require('./routes/eventRoutes');
const partyRoutes = require('./routes/partyRoutes');
const faqRoutes = require('./routes/faqRoutes');
const postRoutes = require('./routes/postRoutes');
const cloudFotoRoutes = require('./routes/cloudFotoRoutes');
const emailRoutes = require('./routes/EmailRoutes');
const categoryRoutes = require('./routes/categoriaRoutes');
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
                url: 'http://localhost:3000',
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
    apis: ['./routes/authRoutes.js', './routes/userRoutes.js', './routes/commentiRoutes.js', './routes/likeRoutes.js', './routes/partecipazioniRoutes.js', './routes/eventRoutes.js', './routes/partyRoutes.js', './routes/faqRoutes.js', './routes/postRoutes.js', './routes/cloudFotoRoutes.js', './routes/EmailRoutes.js', './routes/categoriaRoutes.js'] 
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

mongoose.connect(DB)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Example app listening at http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.log('Failed to connect to MongoDB', err);
    });