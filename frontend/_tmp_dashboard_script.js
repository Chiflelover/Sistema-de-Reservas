


        const token = localStorage.getItem('token');


        const userStr = localStorage.getItem('user');





        if (!token || !userStr) {


            window.location.href = './login.html';


        }





        const user = JSON.parse(userStr);


        document.getElementById('welcome-msg').textContent = `Hola, ${user.correo.split('@')[0]}`;


        document.getElementById('display-correo').textContent = user.correo;





        async function loadDashboardData() {


            // if user.id_paciente is missing, fallback to token-based lookup






            const container = document.getElementById('citas-paciente');


            try {


                // 1. Cargar datos del paciente


                if (user.id_paciente) {
                    const resPac = await fetch(`/api/pacientes/${user.id_paciente}`, {


                    headers: { 'Authorization': `Bearer ${token}` }


                });


                const paciente = await resPac.json();


                if (resPac.ok) {


                    pacienteData = paciente; // Guardar datos globalmente para edición


                    document.getElementById('welcome-msg').textContent = `Hola, ${paciente.nombres}`;


                    document.getElementById('display-dni').textContent = paciente.dni;


                    document.getElementById('display-tel').textContent = paciente.telefono;


                    document.getElementById('display-dir').textContent = paciente.direccion || '-';


                }
                }





                // 2. Cargar citas: probar la ruta por id de paciente y fallback a /me si hace falta


                const primaryPath = user.id_paciente ? `/api/citas/paciente/${user.id_paciente}` : '/api/citas/paciente/me';
                const fallbackPath = user.id_paciente ? '/api/citas/paciente/me' : null;

                let resCitas = await fetch(primaryPath, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!resCitas.ok && fallbackPath) {
                    resCitas = await fetch(fallbackPath, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                }

                if (!resCitas.ok) {
                    const errorData = await resCitas.json().catch(() => ({}));
                    console.error('Error cargando citas del paciente:', resCitas.status, errorData);
                    container.innerHTML = `
                        <div class="text-center py-20 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
                            No fue posible cargar tus citas. Intenta recargar la página.
                        </div>
                    `;
                    return;
                }

                const citas = await resCitas.json();





                document.getElementById('total-citas').textContent = citas.length;





                if (citas.length > 0) {


                    container.innerHTML = '';


                    citas.forEach(cita => {


                        // Evitar desfase de zona horaria al parsear la fecha


                        const datePart = cita.fecha_cita.split('T')[0];


                        const [year, month, day] = datePart.split('-').map(Number);


                        const dateObj = new Date(year, month - 1, day);


                        


                        const mesShort = dateObj.toLocaleString('es-ES', { month: 'short' }).replace('.', '');


                        const dia = dateObj.getDate();





                        const estadoRaw = cita.estado_cita || 'Pendiente';


                        let estadoMostrado = estadoRaw;


                        let statusClass = 'bg-yellow-50 text-yellow-600 border border-yellow-100';





                        if (estadoRaw === 'Atendido') {


                            estadoMostrado = 'Completada';


                            statusClass = 'bg-green-50 text-green-600 border border-green-100';


                        } else if (estadoRaw === 'Confirmada') {


                            estadoMostrado = 'Confirmada';


                            statusClass = 'bg-blue-50 text-blue-600 border border-blue-100';


                        } else if (estadoRaw === 'Pendiente de Pago') {


                            estadoMostrado = 'Pendiente de Pago';


                            statusClass = 'bg-orange-50 text-orange-600 border border-orange-100';


                        } else if (estadoRaw === 'Cancelada') {


                            estadoMostrado = 'Cancelada';


                            statusClass = 'bg-gray-100 text-gray-500 border border-gray-200';


                        } else if (estadoRaw === 'No Asistió' || estadoRaw === 'No Asistió') {


                            estadoMostrado = 'No Asistió';


                            statusClass = 'bg-red-50 text-red-600 border border-red-100';


                        }





                        container.innerHTML += `


                                        <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">


                                            <div class="flex items-center gap-4">


                                                <div class="w-14 h-14 bg-gray-50 rounded-xl flex flex-col items-center justify-center text-secondary border border-gray-100">


                                                    <span class="text-[10px] uppercase font-bold text-gray-400">${mesShort}</span>


                                                    <span class="text-xl font-bold">${dia}</span>


                                                </div>


                                                <div>


                                                    <h3 class="font-bold text-secondary">Dr. ${cita.medico_nombres} ${cita.medico_apellidos}</h3>


                                                    <p class="text-sm text-primary-600 font-medium">${cita.especialidad}</p>


                                                    <p class="text-xs text-gray-400 mt-1">Hora: ${cita.hora_cita.substring(0, 5)}${cita.codigo_boleta ? ` | Boleta: ${cita.codigo_boleta}` : ''}</p>


                                                </div>


                                            </div>


                                            <div class="flex items-center gap-3 w-full md:w-auto">


                                                <span class="px-3 py-1 rounded-full text-xs font-bold ${statusClass}">${estadoMostrado}</span>


                                            </div>


                                        </div>


                                    `;


                    });


                }


            } catch (error) {


                console.error(error);


            }


        }





        function logout() {


            localStorage.removeItem('token');


            localStorage.removeItem('user');


            window.location.href = './login.html';


        }





        // Lógica de edición de perfil


        let pacienteData = null;





        window.abrirEditarPerfil = () => {


            if (!pacienteData) return;


            document.getElementById('edit-dni').value = pacienteData.dni;


            document.getElementById('edit-nombre').value = `${pacienteData.nombres} ${pacienteData.apellidos}`;


            document.getElementById('edit-telefono').value = pacienteData.telefono;


            document.getElementById('edit-direccion').value = pacienteData.direccion || '';


            document.getElementById('modal-editar-perfil').classList.remove('hidden');


        };





        window.cerrarEditarPerfil = () => {


            document.getElementById('modal-editar-perfil').classList.add('hidden');


        };





        document.getElementById('form-editar-perfil').addEventListener('submit', async (e) => {


            e.preventDefault();


            const btn = document.getElementById('btn-guardar-perfil');


            btn.disabled = true;


            btn.textContent = 'Guardando...';





            const body = {


                telefono: document.getElementById('edit-telefono').value,


                direccion: document.getElementById('edit-direccion').value


            };





            try {


                const res = await fetch(`/api/pacientes/${user.id_paciente}`, {


                    method: 'PUT',


                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },


                    body: JSON.stringify(body)


                });





                const data = await res.json();


                if (res.ok) {


                    UI.showToast('¡Perfil actualizado con éxito!', 'success');


                    // Actualizar UI


                    document.getElementById('display-tel').textContent = data.paciente.telefono;


                    document.getElementById('display-dir').textContent = data.paciente.direccion || '-';


                    // Actualizar datos locales


                    pacienteData = data.paciente;


                    cerrarEditarPerfil();


                } else {


                    UI.showToast(data.error || 'Error al actualizar', 'error');


                }


            } catch (err) {


                UI.showToast('Error de conexión', 'error');


            } finally {


                btn.disabled = false;


                btn.textContent = 'Guardar Cambios';


            }


        });





        document.addEventListener('DOMContentLoaded', loadDashboardData);


    