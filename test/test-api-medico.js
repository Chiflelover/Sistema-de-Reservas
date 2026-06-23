// test-api-medico.js
async function ejecutarPruebaMedico() {
    console.log("Iniciando prueba de unidad para Registrar Médico...");

    // 1. Datos del médico de prueba
    const medicoPrueba = {
        dni: "77777777",
        num_colegiatura: "123456",
        nombres: "Gregory",
        apellidos: "House",
        especialidad: "Medicina Interna",
        telefono: "999888777"
    };

    try {
        console.log("Enviando datos del médico al servidor...");
        const respuesta = await fetch('http://localhost:3000/api/medicos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(medicoPrueba)
        });

        const datos = await respuesta.json();

        // 2. Evaluamos el resultado final
        if (respuesta.status === 201) {
            console.log("PRUEBA EXITOSA :) El médico se guardó correctamente en la BD.");
        } else if (respuesta.status === 400 && datos.error && datos.error.includes("ya se encuentra registrado")) {
            console.log("PRUEBA EXITOSA (Validación) :) El servidor rechazó el duplicado correctamente.");
        } else {
            console.error("PRUEBA FALLIDA al crear médico:", datos);
        }

    } catch (error) {
        console.error("ERROR CRÍTICO de conexión:", error.message);
    }
}

ejecutarPruebaMedico();
