const express = require('express');
const router = express.Router();
const pacientesController = require('../controllers/pacientesController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect route with authMiddleware
router.post('/', authMiddleware, pacientesController.registerPaciente);
router.get('/:id', authMiddleware, pacientesController.getPacienteById);

module.exports = router;
