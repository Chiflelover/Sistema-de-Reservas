const pool = require('./backend/config/db');
(async () => {
  try {
    const res = await pool.query(`select u.id_usuario, u.correo, u.id_paciente, p.id_paciente as paciente_id, p.dni, p.nombres, p.apellidos from usuarios u left join pacientes p on u.id_paciente = p.id_paciente limit 20`);
    console.log('usuarios=' + res.rows.length);
    res.rows.forEach(r => console.log(JSON.stringify(r)));
    const citas = await pool.query('select * from citas limit 20');
    console.log('citas=' + citas.rows.length);
    citas.rows.forEach(r => console.log(JSON.stringify(r)));
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
})();
