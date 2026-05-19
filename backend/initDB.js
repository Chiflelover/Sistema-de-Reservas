require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function implementarBaseDeDatos() {
    try {
        await client.connect();
        console.log("Conectando a la base de datos en la nube...");

        // Script SQL 
        const sql = `
            -- 1. Tabla de Pacientes
            CREATE TABLE IF NOT EXISTS pacientes (
                id_paciente SERIAL PRIMARY KEY,
                dni VARCHAR(8) UNIQUE NOT NULL,
                nombres VARCHAR(100) NOT NULL,
                apellidos VARCHAR(100) NOT NULL,
                telefono VARCHAR(15) UNIQUE NOT NULL,
                correo VARCHAR(150),
                fecha_nacimiento DATE,
                estado VARCHAR(20) DEFAULT 'Activo',
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- 2. Tabla de Usuarios (Para Login)
            CREATE TABLE IF NOT EXISTS usuarios (
                id_usuario SERIAL PRIMARY KEY,
                correo VARCHAR(150) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                rol VARCHAR(50) DEFAULT 'paciente',
                id_paciente INT REFERENCES pacientes(id_paciente) ON DELETE SET NULL,
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- 3. Tabla de Medicos
            CREATE TABLE IF NOT EXISTS medicos (
                id_medico SERIAL PRIMARY KEY,
                dni VARCHAR(8) UNIQUE,
                num_colegiatura VARCHAR(15) UNIQUE NOT NULL,
                nombres VARCHAR(100) NOT NULL,
                apellidos VARCHAR(100) NOT NULL,
                especialidad VARCHAR(100) NOT NULL,
                telefono VARCHAR(15) UNIQUE NOT NULL,
                imagen_url VARCHAR(255)
            );

            -- 4. Tabla de Citas (Relaciona pacientes y medicos)
            CREATE TABLE IF NOT EXISTS citas (
                id_cita SERIAL PRIMARY KEY,
                id_paciente INT REFERENCES pacientes(id_paciente) ON DELETE CASCADE,
                id_medico INT REFERENCES medicos(id_medico) ON DELETE CASCADE,
                fecha_cita DATE NOT NULL,
                hora_cita TIME NOT NULL,
                estado_cita VARCHAR(20) DEFAULT 'Pendiente',
                motivo TEXT
            );
        `;

        await client.query(sql);
        console.log("✅ ¡Éxito! Tablas creadas correctamente.");
    } catch (error) {
        console.error("❌ Error al implementar la base de datos:", error);
    } finally {
        await client.end();
    }
}

implementarBaseDeDatos();