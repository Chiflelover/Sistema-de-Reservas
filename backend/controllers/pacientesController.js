const pool = require('../config/db');

const registerPaciente = async (req, res) => {
    const { dni, nombres, apellidos, telefono, correo, fecha_nacimiento } = req.body;
    const id_usuario = req.user.id_usuario;

    // Validación de campos obligatorios
    if (!dni || !nombres || !apellidos || !telefono) {
        return res.status(400).json({ error: 'DNI, Nombres, Apellidos y Teléfono son obligatorios' });
    }

    // Validación DNI: 8 dígitos
    const dniRegex = /^\d{8}$/;
    if (!dniRegex.test(dni)) {
        return res.status(400).json({ error: 'El DNI debe tener exactamente 8 dígitos numéricos' });
    }

    // Validación Teléfono: Solo números
    const telefonoRegex = /^\d+$/;
    if (!telefonoRegex.test(telefono)) {
        return res.status(400).json({ error: 'El teléfono debe contener solo números' });
    }

    try {
        // Iniciar transacción
        await pool.query('BEGIN');

        // Verificar si el usuario ya tiene un paciente asociado
        const userCheck = await pool.query('SELECT id_paciente FROM usuarios WHERE id_usuario = $1', [id_usuario]);
        if (userCheck.rows[0].id_paciente) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ error: 'Este usuario ya tiene un perfil de paciente registrado' });
        }

        // Insertar paciente
        const queryInsert = `
            INSERT INTO pacientes (dni, nombres, apellidos, telefono, correo, fecha_nacimiento)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id_paciente
        `;
        const values = [dni, nombres, apellidos, telefono, correo || null, fecha_nacimiento || null];
        
        const result = await pool.query(queryInsert, values);
        const nuevoPacienteId = result.rows[0].id_paciente;

        // Actualizar el usuario con el id_paciente
        await pool.query('UPDATE usuarios SET id_paciente = $1 WHERE id_usuario = $2', [nuevoPacienteId, id_usuario]);

        // Commit transacción
        await pool.query('COMMIT');

        res.status(201).json({
            message: 'Paciente registrado exitosamente',
            id_paciente: nuevoPacienteId
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error in registerPaciente:', error);
        
        // Error código 23505 es unique_violation en PostgreSQL
        if (error.code === '23505' && error.constraint === 'pacientes_dni_key') {
            return res.status(400).json({ error: 'El DNI ingresado ya se encuentra registrado en el sistema' });
        }

        res.status(500).json({ error: 'Error del servidor al registrar paciente' });
    }
};

const getPacienteById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM pacientes WHERE id_paciente = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error in getPacienteById:', error);
        res.status(500).json({ error: 'Error del servidor al obtener datos del paciente' });
    }
};

module.exports = {
    registerPaciente,
    getPacienteById
};
