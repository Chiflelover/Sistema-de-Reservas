// test-api.js
async function ejecutarPrueba() {
    console.log("Iniciando prueba de unidad con Autenticación...");

    // 1. Credenciales falsas para obtener el pase VIP (Token)
    const credenciales = {
        correo: "luci@clinica.com",
        password: "password123"
    };

    try {
        // Intentamos registrar al usuario de prueba por si no existe en la base de datos
        await fetch('http://localhost:3000/api/auth/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credenciales)
        });

        // 2. Iniciamos sesión para que el servidor nos entregue el Token
        console.log("🔑 Solicitando token de seguridad...");
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credenciales)
        });

        const loginDatos = await loginRes.json();

        // Si el login falla detiene la prueba
        if (!loginDatos.token) {
            console.error("Error de autenticación", loginDatos);
            return;
        }

        const token = loginDatos.token;
        console.log("Token obtenido exitosamente");

        // 3.guardar al paciente 
        const pacientePrueba = {
            dni: "88888890",
            nombres: "Luci",
            apellidos: "Seguro2",
            telefono: "966666667",
            correo: "luci2@vitalsalud.com",
            fecha_nacimiento: "2005-01-01"
        };

        console.log("Enviando datos del paciente al servidor...");
        const respuesta = await fetch('http://localhost:3000/api/pacientes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(pacientePrueba)
        });

        const datos = await respuesta.json();

        // 4.resultado final
        if (respuesta.status === 201) {
            console.log("PRUEBA EXITOSA :) El paciente se guardó superando la seguridad.");
        } else if (respuesta.status === 400 && datos.error && datos.error.includes("DNI")) {
            console.log("PRUEBA EXITOSA (Validación) :) El servidor rechazó el duplicado correctamente.");
        } else {
            console.error("PRUEBA FALLIDA al crear paciente:", datos);
        }

    } catch (error) {
        console.error("ERROR CRÍTICO de conexión:", error.message);
    }
}

ejecutarPrueba();