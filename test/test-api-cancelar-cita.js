// test-api-cancelar-cita.js
// Esta prueba de unidad simula la cancelación de una cita y valida las reglas de negocio en el backend.
// Reglas a probar:
// 1. Cancelar una cita con estado 'Pendiente' debe ser exitoso (HTTP 200).
// 2. Intentar modificar una cita que ya está cancelada o atendida debe ser rechazado (HTTP 400).

async function ejecutarPruebaCancelarCita() {
    console.log("====================================================================");
    console.log("Iniciando prueba de unidad: Cancelar Cita y Reglas de Negocio...");
    console.log("====================================================================");

    const credenciales = {
        correo: "recepcion@vitalsalud.com",
        password: "recepcion123"
    };

    try {
        console.log("Intentando iniciar sesión como Recepcionista...");
        let loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credenciales)
        });

        let loginDatos = await loginRes.json();

        if (!loginRes.ok) {
            console.log("No se pudo iniciar sesión con la cuenta predeterminada.");
            console.log("Intentando registrar e iniciar sesión con una cuenta de prueba alternativa...");
            
            const credencialesTest = {
                correo: "recepcion.test@vitalsalud.com",
                password: "password123"
            };

            await fetch('http://localhost:3000/api/auth/registro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credencialesTest)
            });

            loginRes = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credencialesTest)
            });
            loginDatos = await loginRes.json();
        }

        if (!loginDatos.token) {
            console.error("ERROR: Autenticación fallida. Asegúrate de que el servidor esté corriendo.");
            return;
        }

        const token = loginDatos.token;
        console.log("Token obtenido exitosamente.");

        // 1. Obtener la lista de citas para buscar una 'Pendiente'
        console.log("\nBuscando citas pendientes en el sistema...");
        const resCitas = await fetch('http://localhost:3000/api/citas', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const citas = await resCitas.json();
        let citaTarget = citas.find(c => c.estado_cita === 'Pendiente');

        // Si no hay citas pendientes, creamos una para garantizar el éxito de la prueba
        if (!citaTarget) {
            console.log("No se encontraron citas pendientes. Creando una cita de prueba...");
            
            const citaNueva = {
                id_paciente: 1,
                id_medico: 2,
                fecha_cita: "2026-06-05",
                hora_cita: "15:00:00",
                motivo: "Cita temporal para prueba de cancelacion"
            };

            const resCrear = await fetch('http://localhost:3000/api/citas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(citaNueva)
            });

            const datosCita = await resCrear.json();
            
            if (resCrear.status === 201) {
                citaTarget = datosCita.cita;
                console.log(`Cita de prueba creada exitosamente con ID: ${citaTarget.id_cita}`);
            } else {
                console.error("PRUEBA FALLIDA: No se pudo crear una cita de prueba.", datosCita);
                return;
            }
        } else {
            console.log(`Cita pendiente encontrada con ID: ${citaTarget.id_cita}`);
        }

        const idCita = citaTarget.id_cita;

        // 2. Probando la cancelación exitosa de la cita pendiente
        console.log(`\nProbando cancelacion de la cita ID: ${idCita}...`);
        const resCancelar = await fetch(`http://localhost:3000/api/citas/${idCita}/estado`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nuevo_estado: 'Cancelada' })
        });

        const datosCancelado = await resCancelar.json();

        if (resCancelar.status === 200) {
            console.log("PRUEBA EXITOSA :) La cita fue cancelada exitosamente.");
            console.log("Respuesta del servidor:", datosCancelado.message);
        } else {
            console.error(`PRUEBA FALLIDA al cancelar la cita. Status: ${resCancelar.status}`, datosCancelado);
            return;
        }

        // 3. Validando regla de negocio: No se puede modificar una cita ya cancelada
        console.log(`\nValidando regla de negocio: Intentando cambiar estado a 'Atendido' en cita cancelada ID: ${idCita}...`);
        const resRegla = await fetch(`http://localhost:3000/api/citas/${idCita}/estado`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nuevo_estado: 'Atendido' })
        });

        const datosRegla = await resRegla.json();

        if (resRegla.status === 400) {
            console.log("PRUEBA EXITOSA :) El servidor bloqueo la modificacion correctamente.");
            console.log("Respuesta esperada del servidor (HTTP 400):", datosRegla.error);
        } else {
            console.error(`PRUEBA FALLIDA: El servidor debio bloquear el cambio pero respondio con status: ${resRegla.status}`, datosRegla);
        }

        console.log("\n====================================================================");
        console.log("TODAS LAS PRUEBAS DE CANCELACION Y REGLAS DE NEGOCIO COMPLETADAS!");
        console.log("====================================================================");

    } catch (error) {
        console.error("\nERROR CRITICO de conexion o ejecucion:", error.message);
    }
}

ejecutarPruebaCancelarCita();
