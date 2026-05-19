/**
 * UI Utilities for VitalSalud
 * Provee un sistema de notificaciones (Toasts) y confirmaciones elegantes.
 */

const UI = {
    /**
     * Muestra una notificaciÃ³n temporal tipo Toast
     * @param {string} message - El mensaje a mostrar
     * @param {'success' | 'error' | 'info'} type - El tipo de notificaciÃ³n
     */
    showToast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast bg-white rounded-2xl shadow-2xl border-l-4 p-5 flex items-start gap-4 transition-all`;
        
        let icon = 'ðŸ””';
        let borderColor = 'border-blue-500';
        let iconBg = 'bg-blue-50';
        let iconColor = 'text-blue-500';

        if (type === 'success') {
            icon = 'âœ…';
            borderColor = 'border-primary-500';
            iconBg = 'bg-primary-50';
            iconColor = 'text-primary-500';
        } else if (type === 'error') {
            icon = 'âŒ';
            borderColor = 'border-red-500';
            iconBg = 'bg-red-50';
            iconColor = 'text-red-500';
        }

        toast.classList.add(borderColor);

        toast.innerHTML = `
            <div class="w-10 h-10 ${iconBg} ${iconColor} rounded-xl flex items-center justify-center shrink-0 text-xl shadow-sm">
                ${icon}
            </div>
            <div class="flex-grow pt-1">
                <p class="text-sm font-bold text-secondary uppercase tracking-tight mb-0.5">${type === 'success' ? 'Ã‰xito' : type === 'error' ? 'AtenciÃ³n' : 'NotificaciÃ³n'}</p>
                <p class="text-gray-500 text-sm leading-relaxed">${message}</p>
            </div>
        `;

        container.appendChild(toast);

        // Auto eliminar despuÃ©s de 4 segundos
        setTimeout(() => {
            toast.classList.add('toast-fade-out');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 4000);
    },

    /**
     * Muestra un modal de confirmaciÃ³n elegante
     * @param {string} title - TÃ­tulo del modal
     * @param {string} message - Mensaje descriptivo
     * @returns {Promise<boolean>} - Resuelve a true si el usuario confirma
     */
    showConfirm(title, message) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay fixed inset-0 bg-secondary/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4';
            
            overlay.innerHTML = `
                <div class="modal-content bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 md:p-10 border border-gray-100 text-center">
                    <div class="w-20 h-20 bg-yellow-50 text-yellow-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm transform -rotate-3">
                        <span class="text-4xl">âš ï¸</span>
                    </div>
                    <h3 class="text-2xl font-bold text-secondary font-heading mb-3">${title}</h3>
                    <p class="text-gray-500 mb-8 leading-relaxed">${message}</p>
                    <div class="flex flex-col sm:flex-row gap-3">
                        <button id="confirm-cancel" class="flex-1 px-6 py-4 rounded-2xl text-gray-400 font-bold hover:bg-gray-50 transition-colors">
                            Cancelar
                        </button>
                        <button id="confirm-ok" class="flex-1 px-6 py-4 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-bold shadow-lg shadow-primary-500/30 transition-all transform hover:-translate-y-0.5">
                            SÃ­, continuar
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const cleanup = (val) => {
                overlay.classList.add('opacity-0');
                overlay.querySelector('.modal-content').classList.add('scale-95', 'opacity-0');
                setTimeout(() => {
                    if (overlay.parentNode) document.body.removeChild(overlay);
                    resolve(val);
                }, 200);
            };

            overlay.querySelector('#confirm-ok').addEventListener('click', () => cleanup(true));
            overlay.querySelector('#confirm-cancel').addEventListener('click', () => cleanup(false));
            
            // Cerrar al hacer clic fuera del modal
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) cleanup(false);
            });
        });
    }
};

// Hacerlo global para que sea fÃ¡cil de llamar
window.UI = UI;
