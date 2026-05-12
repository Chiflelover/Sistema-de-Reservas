const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const medicosController = require('../controllers/medicosController');

// Configuración de Multer para guardar imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../frontend/img/medicos'));
    },
    filename: function (req, file, cb) {
        // Generar un nombre único para evitar sobrescribir imágenes
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'medico-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: ¡Solo se permiten imágenes (jpeg, jpg, png, webp)!');
        }
    }
});

// Rutas
router.get('/', medicosController.getMedicos);
router.post('/', (req, res, next) => {
    // Si no es un formulario con archivos, pasar directo al controlador
    if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
        return next();
    }
    
    upload.single('imagen')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: `Error de subida: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ error: err });
        }
        next();
    });
}, medicosController.createMedico);

router.delete('/:id', medicosController.deleteMedico);

module.exports = router;
