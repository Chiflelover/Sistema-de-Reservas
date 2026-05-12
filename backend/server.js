require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const pacientesRoutes = require('./routes/pacientesRoutes');
const medicosRoutes = require('./routes/medicosRoutes');
const citasRoutes = require('./routes/citasRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); 

// 1. Rutas de la API (Prioridad Máxima)
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/medicos', medicosRoutes);
app.use('/api/citas', citasRoutes);

// 2. Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Fallback para SPA o rutas no encontradas
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Iniciar servidor
const server = app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// Manejador de errores global
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ 
        error: 'Error interno del servidor', 
        details: err.message 
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
