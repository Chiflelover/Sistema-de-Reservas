document.addEventListener('DOMContentLoaded', () => {


    const token = localStorage.getItem('token');


    const userStr = localStorage.getItem('user');





    const isLogged = !!(token && userStr);


    let user = null;





    if (isLogged) {


        try {


            user = JSON.parse(userStr);


        } catch (e) { }


    }





    // Función para mostrar una alerta premium usando el sistema global


    const showPremiumAlert = (message, onConfirm) => {


        if (window.UI) {


            UI.showConfirm('Acceso Requerido', message).then(confirmed => {


                if (confirmed && onConfirm) onConfirm();


            });


        } else {


            // Fallback si por alguna razón no cargó UI


            if (confirm(message) && onConfirm) onConfirm();


        }


    };





    // 1. Proteger la página de "agendar.html" (Agendar Cita) si no están logueados


    if (!isLogged && window.location.pathname.includes('agendar.html')) {


        document.body.style.display = 'none'; // Ocultar temporalmente


        setTimeout(() => {


            document.body.style.display = 'block';


            showPremiumAlert('Debes iniciar sesión para poder agendar una cita médica.', () => {


                window.location.href = './login.html';


            });


        }, 100);


        return; // Detener ejecución aquí en esta página


    }





    // 2. Interceptar clicks en los botones que dicen "Agendar Cita" u otras rutas a contacto en otras páginas


    if (!isLogged) {


        const agendarLinks = document.querySelectorAll('a[href*="agendar.html"]');


        agendarLinks.forEach(link => {


            link.addEventListener('click', (e) => {


                e.preventDefault();


                showPremiumAlert('Debes iniciar sesión para poder agendar una cita médica.', () => {


                    window.location.href = './login.html';


                });


            });


        });


    }





    // 3. Reemplazar el enlace de "Iniciar Sesión" con el ícono de perfil si está logueado


    if (isLogged && user) {


        // Buscar el enlace de Iniciar Sesión en la barra de navegación


        const navLinks = document.querySelectorAll('nav a');


        let loginLink = Array.from(navLinks).find(a => a.href.includes('login.html') && !a.href.includes('registro-cuenta.html'));





        if (loginLink) {


            const initial = user.correo ? user.correo.charAt(0).toUpperCase() : 'U';





            let profileLink = './dashboard-paciente.html';


            if (user.rol === 'administrador') profileLink = './admin-dashboard.html';


            if (user.rol === 'recepcionista') profileLink = './recepcionista.html';





            const profileDiv = document.createElement('div');


            profileDiv.className = 'relative group cursor-pointer ml-2 flex items-center';


            profileDiv.innerHTML = `


                <div class="w-10 h-10 rounded-full bg-primary-100 border-2 border-primary-500 flex items-center justify-center text-primary-700 font-bold shadow-sm transition-transform group-hover:scale-105">


                    ${initial}


                </div>


                <div class="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden transform origin-top-right group-hover:scale-100 scale-95">


                    <div class="px-4 py-3 border-b border-gray-50 bg-gray-50/50">


                        <p class="text-xs text-gray-500 mb-1">Sesión iniciada como</p>


                        <p class="text-sm font-semibold text-gray-900 truncate" title="${user.correo}">${user.correo}</p>


                    </div>


                    <div class="py-1">


                        <a href="${profileLink}" id="link-mi-perfil" class="block px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors font-medium">Mi Perfil</a>


                        <a href="#" id="btn-logout-nav" class="block px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium">Cerrar Sesión</a>


                    </div>


                </div>


            `;





            // Reemplazar el link por el contenedor del perfil


            loginLink.replaceWith(profileDiv);





            // Manejar el cierre de sesión


            document.getElementById('btn-logout-nav').addEventListener('click', (e) => {


                e.preventDefault();


                localStorage.removeItem('token');


                localStorage.removeItem('user');


                window.location.reload();


            });


        }


    }


});


