const pool = require('../config/db');

// Obtener especialidades únicas (endpoint público)
const getEspecialidades = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                especialidad AS nombre,
                COUNT(*) AS total_medicos,
                ARRAY_AGG(nombres || ' ' || apellidos) AS medicos
            FROM medicos
            GROUP BY especialidad
            ORDER BY especialidad ASC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error in getEspecialidades:', error);
        res.status(500).json({ error: 'Error del servidor al obtener especialidades' });
    }
};

// Obtener todos los médicos
const getMedicos = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM medicos ORDER BY id_medico DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error in getMedicos:', error);
        res.status(500).json({ error: 'Error del servidor al obtener médicos' });
    }
};

// Crear un nuevo médico
const createMedico = async (req, res) => {
    const { dni, num_colegiatura, nombres, apellidos, especialidad, telefono } = req.body;

    // Obtener la URL de la imagen 
    let imagen_url = null;
    if (req.file) {

        imagen_url = `/img/medicos/${req.file.filename}`;
    }

    // Validaciones
    if (!dni || !num_colegiatura || !nombres || !apellidos || !especialidad || !telefono) {
        return res.status(400).json({ error: 'Todos los campos excepto la foto son obligatorios' });
    }

    const dniRegex = /^\d{8}$/;
    if (!dniRegex.test(dni)) {
        return res.status(400).json({ error: 'El DNI debe tener exactamente 8 digitos numericos' });
    }

    const cmpRegex = /^\d{4,6}$/;
    if (!cmpRegex.test(num_colegiatura)) {
        return res.status(400).json({ error: 'El CMP debe contener entre 4 y 6 cifras numéricas' });
    }

    const telefonoRegex = /^\d{9}$/;
    if (!telefonoRegex.test(telefono)) {
        return res.status(400).json({ error: 'El teléfono debe tener exactamente 9 dígitos numéricos' });
    }

    try {
        const queryInsert = `
            INSERT INTO medicos (dni, num_colegiatura, nombres, apellidos, especialidad, telefono, imagen_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [dni, num_colegiatura, nombres, apellidos, especialidad, telefono, imagen_url];

        const result = await pool.query(queryInsert, values);

        res.status(201).json({
            message: 'Medico registrado exitosamente',
            medico: result.rows[0]
        });
    } catch (error) {
        console.error('CRITICAL ERROR in createMedico:', error);

        if (error.code === '23505') {
            return res.status(400).json({ error: 'El DNI, CMP o Telefono ya se encuentra registrado' });
        }

        res.status(500).json({
            error: 'Error interno del servidor',
            details: error.message
        });
    }
};

// Eliminar un médico
const deleteMedico = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM medicos WHERE id_medico = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Médico no encontrado' });
        }

        res.json({ message: 'Médico eliminado exitosamente' });
    } catch (error) {
        console.error('Error in deleteMedico:', error);
        res.status(500).json({ error: 'Error del servidor al eliminar médico' });
    }
};

module.exports = {
    getMedicos,
    createMedico,
    deleteMedico,
    getEspecialidades
};
