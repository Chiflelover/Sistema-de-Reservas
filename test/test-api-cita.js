// test-api-cita.js
async function ejecutarPruebaCita() {
    console.log("Iniciando prueba de unidad para Registrar Cita...");

    // 1. Obtener Pase de Seguridad (Token)
    const credenciales = {
        correo: "luci@clinica.com",
        password: "password123"
    };

    try {
        console.log(" Solicitando token de seguridad...");
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credenciales)
        });

        const loginDatos = await loginRes.json();

        if (!loginDatos.token) {
            console.error(" Error de autenticación. Asegúrate de que el usuario exista.", loginDatos);
            return;
        }

        const token = loginDatos.token;
        console.log(" Token obtenido exitosamente");

        // 2. Datos de la cita de prueba (Cambié la hora a las 11:00:00 para que sea nueva)
        const citaPrueba = {
            id_paciente: 1,
            id_medico: 2,
            fecha_cita: "2026-07-01",
            hora_cita: "11:00:00",
            motivo: "Consulta general automatizada (Depuración)"
        };

        console.log("Enviando datos de la cita al servidor...");
        const respuesta = await fetch('http://localhost:3000/api/citas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Aquí inyectamos el Token
            },
            body: JSON.stringify(citaPrueba)
        });

        const datos = await respuesta.json();

        // 3. Evaluamos el resultado final
        if (respuesta.status === 201) {
            console.log("PRUEBA EXITOSA :) La cita se agendó correctamente en la BD.");
        } else if (respuesta.status === 400 && datos.error && datos.error.includes("ya ha sido reservado")) {
            console.log("PRUEBA EXITOSA (Validación de Concurrencia) :) El servidor bloqueó la doble reserva correctamente.");
        } else {
            console.error("PRUEBA FALLIDA al crear la cita:", datos);
        }

    } catch (error) {
        console.error("ERROR CRÍTICO de conexión:", error.message);
    }
}

ejecutarPruebaCita();
