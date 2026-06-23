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

    // Validación Teléfono: Exactamente 9 dígitos
    const telefonoRegex = /^\d{9}$/;
    if (!telefonoRegex.test(telefono)) {
        return res.status(400).json({ error: 'El teléfono debe tener exactamente 9 dígitos numéricos' });
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

const getPacienteMe = async (req, res) => {
    const { id_usuario } = req.user;

    try {
        const userResult = await pool.query('SELECT id_paciente, correo FROM usuarios WHERE id_usuario = $1', [id_usuario]);
        if (userResult.rows.length === 0) {
            return res.status(403).json({ error: 'Usuario no válido' });
        }

        let targetPacienteId = userResult.rows[0].id_paciente;
        const correo = userResult.rows[0].correo;

        let paciente = null;
        if (targetPacienteId) {
            const pacienteResult = await pool.query('SELECT * FROM pacientes WHERE id_paciente = $1', [targetPacienteId]);
            if (pacienteResult.rows.length > 0) {
                paciente = pacienteResult.rows[0];
                if (correo && paciente.correo !== correo) {
                    paciente = null;
                }
            }
        }

        if (!paciente) {
            const pacienteResult = await pool.query('SELECT * FROM pacientes WHERE correo = $1', [correo]);
            if (pacienteResult.rows.length === 0) {
                return res.status(404).json({ error: 'Paciente no encontrado' });
            }
            paciente = pacienteResult.rows[0];
            targetPacienteId = paciente.id_paciente;
            await pool.query('UPDATE usuarios SET id_paciente = $1 WHERE id_usuario = $2', [targetPacienteId, id_usuario]);
        }

        res.json(paciente);
    } catch (error) {
        console.error('Error in getPacienteMe:', error);
        res.status(500).json({ error: 'Error del servidor al obtener datos del paciente autenticado' });
    }
};

const updatePaciente = async (req, res) => {
    const { id } = req.params;
    const { telefono, direccion } = req.body;
    const { id_usuario, rol } = req.user;

    try {
        // Validación de propiedad si es paciente: solo puede actualizar su propio perfil
        if (rol === 'paciente') {
            const userCheck = await pool.query('SELECT id_paciente FROM usuarios WHERE id_usuario = $1', [id_usuario]);
            if (userCheck.rows.length === 0 || !userCheck.rows[0].id_paciente || userCheck.rows[0].id_paciente !== parseInt(id)) {
                return res.status(403).json({ error: 'Acceso denegado. No puedes editar el perfil de otro paciente.' });
            }
        }

        if (!telefono) {
            return res.status(400).json({ error: 'El teléfono es obligatorio' });
        }

        // Validación Teléfono: Exactamente 9 dígitos
        const telefonoRegex = /^\d{9}$/;
        if (!telefonoRegex.test(telefono)) {
            return res.status(400).json({ error: 'El teléfono debe tener exactamente 9 dígitos numéricos' });
        }

        const query = `
            UPDATE pacientes 
            SET telefono = $1, direccion = $2 
            WHERE id_paciente = $3 
            RETURNING *
        `;
        const result = await pool.query(query, [telefono, direccion || null, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }

        res.json({
            message: 'Perfil actualizado exitosamente',
            paciente: result.rows[0]
        });
    } catch (error) {
        console.error('Error in updatePaciente:', error);
        // Error código 23505 es unique_violation en PostgreSQL (si el teléfono ya existe)
        if (error.code === '23505' && error.constraint === 'pacientes_telefono_key') {
            return res.status(400).json({ error: 'El teléfono ingresado ya se encuentra registrado' });
        }
        res.status(500).json({ error: 'Error del servidor al actualizar perfil' });
    }
};

module.exports = {
    registerPaciente,
    getPacienteById,
    getPacienteMe,
    updatePaciente
};
