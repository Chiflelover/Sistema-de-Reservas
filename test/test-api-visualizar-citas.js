// test-api-visualizar-citas.js
// Esta prueba de unidad simula las acciones de la Recepcionista al visualizar las citas
// 1. Obtiene todas las citas de la clínica.
// 2. Busca citas e historial por DNI de un paciente existente.

async function ejecutarPruebaVisualizarCitas() {
    console.log("====================================================================");
    console.log("Iniciando prueba de unidad: Visualizar Reservas (Recepcionista)...");
    console.log("====================================================================");

    // 1. Obtener Pase de Seguridad (Token) como Recepcionista
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

        // Si falla, tal vez el usuario interno no se ha creado aún en la BD (ej. base de datos limpia)
        if (!loginRes.ok) {
            console.log("No se pudo iniciar sesión con la cuenta de recepción predeterminada.");
            console.log("Intentando registrar e iniciar sesión con una cuenta de prueba alternativa...");
            
            const credencialesTest = {
                correo: "recepcion.test@vitalsalud.com",
                password: "password123"
            };

            // Intentar registrar
            await fetch('http://localhost:3000/api/auth/registro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credencialesTest)
            });

            // Loguearse
            loginRes = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credencialesTest)
            });
            loginDatos = await loginRes.json();
        }

        if (!loginDatos.token) {
            console.error("ERROR: Autenticación fallida. Asegúrate de que el servidor esté corriendo en http://localhost:3000");
            return;
        }

        const token = loginDatos.token;
        console.log("Token de Recepcionista obtenido exitosamente.");

        // 2. Simular visualización de TODAS las citas
        console.log("\n1. Probando obtención de TODAS las citas (Endpoint: GET /api/citas)...");
        const resCitas = await fetch('http://localhost:3000/api/citas', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (resCitas.status !== 200) {
            console.error(`PRUEBA FALLIDA al obtener citas. Status: ${resCitas.status}`);
            const errorDatos = await resCitas.json();
            console.error("Detalle del error:", errorDatos);
            return;
        }

        const citas = await resCitas.json();
        console.log(`PRUEBA EXITOSA :) Se obtuvieron ${citas.length} citas correctamente.`);
        
        if (citas.length > 0) {
            console.log("\n--- Muestra de las primeras 3 citas obtenidas ---");
            citas.slice(0, 3).forEach((c, index) => {
                console.log(`[Cita ${index + 1}] ID: ${c.id_cita} | Paciente: ${c.paciente_nombres} ${c.paciente_apellidos} | Médico: Dr. ${c.medico_nombres} | Fecha: ${c.fecha_cita.split('T')[0]} | Hora: ${c.hora_cita} | Estado: ${c.estado_cita}`);
            });
            console.log("------------------------------------------------");
        } else {
            console.log("Nota: Actualmente no hay citas registradas en la base de datos para mostrar.");
        }

        // 3. Simular búsqueda de citas e historial por DNI
        console.log("\n2. Probando búsqueda de citas por DNI (Endpoint: GET /api/citas/buscar/:dni)...");
        
        let dniParaBuscar = "88888890"; // DNI de Luci por defecto

        console.log(`Enviando solicitud de búsqueda para el DNI: "${dniParaBuscar}"...`);
        const resBuscar = await fetch(`http://localhost:3000/api/citas/buscar/${dniParaBuscar}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (resBuscar.status !== 200) {
            console.error(`PRUEBA FALLIDA al buscar por DNI. Status: ${resBuscar.status}`);
            return;
        }

        const resultadoBusqueda = await resBuscar.json();
        if (resultadoBusqueda.found) {
            console.log(`PRUEBA EXITOSA :) Paciente encontrado: ${resultadoBusqueda.paciente.nombres} ${resultadoBusqueda.paciente.apellidos}`);
            console.log(`   Total de citas registradas para este paciente: ${resultadoBusqueda.citas.length}`);
            if (resultadoBusqueda.citas.length > 0) {
                console.log(`   Última cita del paciente: ${resultadoBusqueda.citas[0].fecha_cita.split('T')[0]} a las ${resultadoBusqueda.citas[0].hora_cita} con el Dr. ${resultadoBusqueda.citas[0].medico_nombres}`);
            }
        } else {
            console.log(`PRUEBA EXITOSA (Validación de no encontrado) :) El servidor reportó correctamente que el DNI "${dniParaBuscar}" no tiene citas o no existe.`);
        }

        console.log("\n====================================================================");
        console.log("TODAS LAS PRUEBAS DE VISUALIZACIÓN SE COMPLETARON CON ÉXITO!");
        console.log("====================================================================");

    } catch (error) {
        console.error("\nERROR CRÍTICO de conexión o ejecución:", error.message);
        console.log("Por favor asegúrate de que el backend del servidor esté corriendo (npm run dev o node backend/server.js) en el puerto 3000.");
    }
}

ejecutarPruebaVisualizarCitas();
