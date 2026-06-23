require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const pacientesRoutes = require('./routes/pacientesRoutes');
const medicosRoutes = require('./routes/medicosRoutes');
const citasRoutes = require('./routes/citasRoutes');
const medicosController = require('./controllers/medicosController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); 

// 1. Rutas de la API (Prioridad Máxima)
app.get('/api/especialidades', medicosController.getEspecialidades); // Ruta pública, sin autenticación
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/medicos', medicosRoutes);
app.use('/api/citas', citasRoutes);

// 2. Servir archivos estáticos del frontend (con charset UTF-8 para evitar caracteres rotos)
app.use(express.static(path.join(__dirname, '../frontend'), {
    setHeaders: function (res, filePath) {
        if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        }
    }
}));

// Fallback para SPA o rutas no encontradas
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Verificar/Actualizar base de datos con la columna codigo_boleta
const pool = require('./config/db');
pool.query('ALTER TABLE citas ADD COLUMN IF NOT EXISTS codigo_boleta VARCHAR(10);')
    .then(() => console.log('Base de datos verificada/actualizada (columna codigo_boleta)'))
    .catch(err => console.error('Error al verificar/actualizar base de datos:', err));

pool.query('ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS direccion VARCHAR(255);')
    .then(() => console.log('Base de datos verificada/actualizada (columna direccion en pacientes)'))
    .catch(err => console.error('Error al actualizar tabla pacientes:', err));

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
