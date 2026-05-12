const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

const register = async (req, res) => {
    const { correo, password } = req.body;
    
    if (!correo || !password) {
        return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
    }

    try {
        // Check if user exists
        const userCheck = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'El correo ya está registrado' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert new user
        const newUser = await pool.query(
            'INSERT INTO usuarios (correo, password_hash, rol) VALUES ($1, $2, $3) RETURNING id_usuario, correo, rol',
            [correo, passwordHash, 'paciente']
        );

        const token = jwt.sign(
            { id_usuario: newUser.rows[0].id_usuario, rol: newUser.rows[0].rol }, 
            JWT_SECRET, 
            { expiresIn: '1d' }
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: newUser.rows[0]
        });
    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

const login = async (req, res) => {
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
    }

    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ error: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id_usuario: user.id_usuario, rol: user.rol }, 
            JWT_SECRET, 
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login exitoso',
            token,
            user: { id_usuario: user.id_usuario, correo: user.correo, rol: user.rol, id_paciente: user.id_paciente }
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = {
    register,
    login
};
