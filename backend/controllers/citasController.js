const pool = require('../config/db');

// Obtener todas las citas (para el recepcionista)
const getCitas = async (req, res) => {
    try {
        const query = `
            SELECT c.*, p.nombres as paciente_nombres, p.apellidos as paciente_apellidos, p.dni as paciente_dni, p.telefono as paciente_telefono, p.correo as paciente_correo,
                   m.nombres as medico_nombres, m.apellidos as medico_apellidos, m.especialidad
            FROM citas c
            JOIN pacientes p ON c.id_paciente = p.id_paciente
            JOIN medicos m ON c.id_medico = m.id_medico
            ORDER BY c.fecha_cita DESC, c.hora_cita DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error in getCitas:', error);
        res.status(500).json({ error: 'Error al obtener las citas' });
    }
};

// Obtener horarios ocupados para un médico en una fecha
const getHorariosOcupados = async (req, res) => {
    const { id_medico, fecha } = req.query;
    if (!id_medico || !fecha) return res.status(400).json({ error: 'Faltan parámetros' });

    try {
        const query = 'SELECT hora_cita FROM citas WHERE id_medico = $1 AND fecha_cita = $2 AND estado_cita NOT IN ($3, $4)';
        const result = await pool.query(query, [id_medico, fecha, 'Cancelada', 'No Asistió']);
        // Extraer solo HH:mm
        const ocupados = result.rows.map(r => r.hora_cita.substring(0, 5));
        res.json(ocupados);
    } catch (error) {
        console.error('Error in getHorariosOcupados:', error);
        res.status(500).json({ error: 'Error al obtener disponibilidad' });
    }
};

// Crear una nueva cita
const createCita = async (req, res) => {
    const { id_paciente, id_medico, fecha_cita, hora_cita, motivo } = req.body;

    if (!id_paciente || !id_medico || !fecha_cita || !hora_cita) {
        return res.status(400).json({ error: 'Faltan datos obligatorios para la cita' });
    }

    try {
        // VALIDACIÓN: Verificar si el turno ya está ocupado
        const checkQuery = `
            SELECT id_cita FROM citas 
            WHERE id_medico = $1 AND fecha_cita = $2 AND hora_cita = $3 
            AND estado_cita NOT IN ('Cancelada', 'No Asistió')
        `;
        const checkResult = await pool.query(checkQuery, [id_medico, fecha_cita, hora_cita]);
        
        if (checkResult.rows.length > 0) {
            return res.status(400).json({ error: 'Lo sentimos, este horario ya ha sido reservado por otro paciente. Por favor, elige otro.' });
        }

        const query = `
            INSERT INTO citas (id_paciente, id_medico, fecha_cita, hora_cita, motivo, estado_cita)
            VALUES ($1, $2, $3, $4, $5, 'Pendiente de Pago')
            RETURNING *
        `;
        const values = [id_paciente, id_medico, fecha_cita, hora_cita, motivo];
        const result = await pool.query(query, values);
        
        res.status(201).json({
            message: 'Cita programada exitosamente, pendiente de pago',
            cita: result.rows[0]
        });
    } catch (error) {
        console.error('Error in createCita:', error);
        res.status(500).json({ error: 'Error al programar la cita' });
    }
};

// Obtener citas de un paciente específico
const getCitasPaciente = async (req, res) => {
    const { id_paciente } = req.params;
    const { id_usuario, rol } = req.user;

    try {
        let targetPacienteId = id_paciente;

        // Si el rol es paciente, forzamos a que solo pueda ver sus propias citas basándonos en el token de sesión
        if (rol === 'paciente') {
            const userCheck = await pool.query('SELECT id_paciente FROM usuarios WHERE id_usuario = $1', [id_usuario]);
            if (userCheck.rows.length === 0 || !userCheck.rows[0].id_paciente) {
                return res.status(403).json({ error: 'No tienes un perfil de paciente asociado' });
            }
            targetPacienteId = userCheck.rows[0].id_paciente;
        }

        const query = `
            SELECT c.*, m.nombres as medico_nombres, m.apellidos as medico_apellidos, m.especialidad
            FROM citas c
            JOIN medicos m ON c.id_medico = m.id_medico
            WHERE c.id_paciente = $1
            ORDER BY 
                CASE WHEN c.fecha_cita >= CURRENT_DATE THEN 0 ELSE 1 END ASC,
                CASE WHEN c.fecha_cita >= CURRENT_DATE THEN c.fecha_cita END ASC,
                CASE WHEN c.fecha_cita < CURRENT_DATE THEN c.fecha_cita END DESC,
                c.hora_cita ASC
        `;
        const result = await pool.query(query, [targetPacienteId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error in getCitasPaciente:', error);
        res.status(500).json({ error: 'Error al obtener tus citas' });
    }
};

// Obtener citas del paciente autenticado según el token
const getCitasPacienteMe = async (req, res) => {
    const { id_usuario, rol } = req.user;

    try {
        const userCheck = await pool.query('SELECT id_paciente, correo FROM usuarios WHERE id_usuario = $1', [id_usuario]);
        if (userCheck.rows.length === 0) {
            return res.status(403).json({ error: 'No tienes un perfil de paciente asociado' });
        }

        let targetPacienteId = userCheck.rows[0].id_paciente;
        const userCorreo = userCheck.rows[0].correo;

        if (targetPacienteId) {
            const pacienteResult = await pool.query('SELECT correo FROM pacientes WHERE id_paciente = $1', [targetPacienteId]);
            if (pacienteResult.rows.length === 0 || (userCorreo && pacienteResult.rows[0].correo !== userCorreo)) {
                targetPacienteId = null;
            }
        }

        if (!targetPacienteId) {
            const pacienteByCorreo = await pool.query('SELECT id_paciente FROM pacientes WHERE correo = $1', [userCorreo]);
            if (pacienteByCorreo.rows.length === 0) {
                return res.status(403).json({ error: 'No tienes un perfil de paciente asociado' });
            }

            targetPacienteId = pacienteByCorreo.rows[0].id_paciente;
            await pool.query('UPDATE usuarios SET id_paciente = $1 WHERE id_usuario = $2', [targetPacienteId, id_usuario]);
        }

        const query = `
            SELECT c.*, m.nombres as medico_nombres, m.apellidos as medico_apellidos, m.especialidad
            FROM citas c
            JOIN medicos m ON c.id_medico = m.id_medico
            WHERE c.id_paciente = $1
            ORDER BY 
                CASE WHEN c.fecha_cita >= CURRENT_DATE THEN 0 ELSE 1 END ASC,
                CASE WHEN c.fecha_cita >= CURRENT_DATE THEN c.fecha_cita END ASC,
                CASE WHEN c.fecha_cita < CURRENT_DATE THEN c.fecha_cita END DESC,
                c.hora_cita ASC
        `;
        const result = await pool.query(query, [targetPacienteId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error in getCitasPacienteMe:', error);
        res.status(500).json({ error: 'Error al obtener tus citas autenticadas' });
    }
};

// Actualizar el estado de una cita
const updateEstadoCita = async (req, res) => {
    const { id } = req.params;
    const { nuevo_estado } = req.body;

    const estadosValidos = ['Pendiente', 'Pendiente de Pago', 'Confirmada', 'Atendido', 'No Asistió', 'Cancelada'];
    if (!estadosValidos.includes(nuevo_estado)) {
        return res.status(400).json({ error: 'Estado no válido' });
    }

    try {
        // Verificar estado actual
        const checkQuery = 'SELECT estado_cita FROM citas WHERE id_cita = $1';
        const checkResult = await pool.query(checkQuery, [id]);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }

        const estadoActual = checkResult.rows[0].estado_cita;

        // Si ya está atendida o cancelada, no se puede cambiar nada (política de cierre)
        if (estadoActual === 'Atendido' || estadoActual === 'Cancelada') {
            return res.status(400).json({ error: `Esta cita ya está ${estadoActual.toLowerCase()} y no puede ser modificada.` });
        }

        const updateQuery = 'UPDATE citas SET estado_cita = $1 WHERE id_cita = $2 RETURNING *';
        const result = await pool.query(updateQuery, [nuevo_estado, id]);
        
        res.json({ message: 'Estado actualizado correctamente', cita: result.rows[0] });
    } catch (error) {
        console.error('Error in updateEstadoCita:', error);
        res.status(500).json({ error: 'Error del servidor al actualizar el estado' });
    }
};

// Obtener citas y perfil por DNI del paciente
const getCitasByDNI = async (req, res) => {
    const { dni } = req.params;
    try {
        // 1. Buscar primero al paciente para tener sus datos completos
        const pacResult = await pool.query('SELECT * FROM pacientes WHERE dni = $1', [dni]);
        
        if (pacResult.rows.length === 0) {
            return res.json({ found: false });
        }

        const paciente = pacResult.rows[0];

        // 2. Buscar sus citas
        const queryCitas = `
            SELECT c.*, m.nombres as medico_nombres, m.apellidos as medico_apellidos, m.especialidad
            FROM citas c
            JOIN medicos m ON c.id_medico = m.id_medico
            WHERE c.id_paciente = $1
            ORDER BY c.fecha_cita DESC, c.hora_cita DESC
        `;
        const resultCitas = await pool.query(queryCitas, [paciente.id_paciente]);
        
        res.json({
            found: true,
            paciente,
            citas: resultCitas.rows
        });
    } catch (error) {
        console.error('Error in getCitasByDNI:', error);
        res.status(500).json({ error: 'Error al buscar registros por DNI' });
    }
};

// Procesar el pago simulado de una cita
const pagarCita = async (req, res) => {
    const { id } = req.params;
    const { nombre_titular, numero_tarjeta, expiracion, cvv } = req.body;

    if (!nombre_titular || !numero_tarjeta || !expiracion || !cvv) {
        return res.status(400).json({ error: 'Faltan datos de pago obligatorios' });
    }

    try {
        // Generar código de boleta: 3 letras mayúsculas aleatorias y 4 números aleatorios
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        let codigo_boleta = '';
        for (let i = 0; i < 3; i++) {
            codigo_boleta += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        for (let i = 0; i < 4; i++) {
            codigo_boleta += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }

        // Actualizar la cita a Confirmada y guardar el código de la boleta
        const query = `
            UPDATE citas 
            SET estado_cita = 'Confirmada', codigo_boleta = $1 
            WHERE id_cita = $2 
            RETURNING *
        `;
        const result = await pool.query(query, [codigo_boleta, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }

        res.json({
            message: 'Pago Exitoso',
            codigo_boleta,
            cita: result.rows[0]
        });
    } catch (error) {
        console.error('Error in pagarCita:', error);
        res.status(500).json({ error: 'Error del servidor al procesar el pago' });
    }
};

module.exports = {
    getCitas,
    createCita,
    getCitasPaciente,
    getCitasPacienteMe,
    updateEstadoCita,
    getCitasByDNI,
    getHorariosOcupados,
    pagarCita
};
