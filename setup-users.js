const bcrypt = require('bcryptjs');
const pool = require('./src/config/db');

async function createInternalUsers() {
    const users = [
        { correo: 'admin@vitalsalud.com', password: 'admin123', rol: 'administrador' },
        { correo: 'recepcion@vitalsalud.com', password: 'recepcion123', rol: 'recepcionista' }
    ];

    console.log('--- Iniciando creación de usuarios internos ---');

    for (const u of users) {
        try {
            // Verificar si existe
            const check = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [u.correo]);
            if (check.rows.length > 0) {
                console.log(`[!] El usuario ${u.correo} ya existe.`);
                continue;
            }

            // Hash
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(u.password, salt);

            // Insertar
            await pool.query(
                'INSERT INTO usuarios (correo, password_hash, rol) VALUES ($1, $2, $3)',
                [u.correo, hash, u.rol]
            );
            console.log(`[✓] Usuario creado: ${u.correo} (Password: ${u.password})`);
        } catch (error) {
            console.error(`[X] Error creando ${u.correo}:`, error.message);
        }
    }

    console.log('--- Proceso finalizado ---');
    process.exit();
}

createInternalUsers();
