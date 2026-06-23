require('dotenv').config();
const pool = require('./backend/config/db');

async function limpiarBaseDeDatos() {
    try {
        console.log('Iniciando limpieza segura de la base de datos...');

        await pool.query('BEGIN');

        // Eliminar citas primero para evitar conflictos de llave foránea
        await pool.query('DELETE FROM citas');

        // Eliminar pacientes y médicos, dejando los usuarios internos intactos
        await pool.query('DELETE FROM pacientes');
        await pool.query('DELETE FROM medicos');

        // Eliminar usuarios de pacientes registrados, pero conservar administrador y recepcionista
        await pool.query("DELETE FROM usuarios WHERE rol NOT IN ('administrador', 'recepcionista')");

        await pool.query('COMMIT');

        console.log('✅ Base de datos limpiada correctamente. Se conservaron admin y recepcionista.');
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('❌ Error al limpiar la base de datos:', error.message || error);
    } finally {
        await pool.end();
    }
}

limpiarBaseDeDatos();
