const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citasController');
const authMiddleware = require('../middleware/authMiddleware');

// Rutas de citas
router.get('/', authMiddleware, citasController.getCitas);
router.get('/disponibilidad', authMiddleware, citasController.getHorariosOcupados);
router.post('/', authMiddleware, citasController.createCita);
router.get('/paciente/me', authMiddleware, citasController.getCitasPacienteMe);
router.get('/paciente/:id_paciente', authMiddleware, citasController.getCitasPaciente);
router.post('/:id/pagar', authMiddleware, citasController.pagarCita);
router.patch('/:id/estado', authMiddleware, citasController.updateEstadoCita);
router.get('/buscar/:dni', authMiddleware, citasController.getCitasByDNI);

module.exports = router;
