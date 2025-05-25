document.addEventListener('DOMContentLoaded', () => {
    const trackButton = document.getElementById('track-button');
    const trackingInput = document.getElementById('tracking-number');
    const resultsSection = document.getElementById('tracking-results');

    // --- DATOS SIMULADOS ---
    // En una aplicación real, esto vendría de una API
    const trackingData = {
        'EB-9978776': [
            { status: 'Entregado', location: 'Dirección del Cliente, Santo Domingo', timestamp: '2023-10-27 14:30:00', icon: '✅', iconClass: 'icon-entregado' },
            { status: 'En ruta de entrega', location: 'Santo Domingo', timestamp: '2023-10-27 09:15:00', icon: '🚚', iconClass: 'icon-entrega' },
            { status: 'Llegada a oficina de destino', location: 'Oficina ExpressBoxRD, Santo Domingo', timestamp: '2023-10-27 07:00:00', icon: '🏢', iconClass: 'icon-oficina' },
            { status: 'En tránsito hacia destino', location: 'Centro de Distribución Principal', timestamp: '2023-10-26 18:45:00', icon: '✈️', iconClass: 'icon-transito' },
            { status: 'Paquete recibido en origen', location: 'Oficina ExpressBoxRD, Santiago', timestamp: '2023-10-25 11:05:00', icon: '📦', iconClass: 'icon-recibido' }
        ],
        // Puedes añadir más códigos de ejemplo si quieres
        'EB-1112223': [
             { status: 'Paquete recibido en origen', location: 'Oficina ExpressBoxRD, La Romana', timestamp: '2023-10-28 10:00:00', icon: '📦', iconClass: 'icon-recibido' }
        ]
    };
    // -----------------------

    trackButton.addEventListener('click', () => {
        const trackingCode = trackingInput.value.trim().toUpperCase(); // Normaliza la entrada
        resultsSection.innerHTML = ''; // Limpia resultados anteriores
        resultsSection.classList.remove('visible'); // Oculta para re-animar

        if (!trackingCode) {
            displayMessage('Por favor, ingresa un código de rastreo.', 'error');
            return;
        }

        // Simula un pequeño retraso como si fuera una llamada API
        setTimeout(() => {
            const statuses = trackingData[trackingCode];

            if (statuses && statuses.length > 0) {
                displayTrackingTimeline(statuses);
            } else {
                displayMessage(`No se encontró información para el código "${trackingCode}". Verifica el código e intenta de nuevo.`, 'error');
            }
             // Forzar reflujo para reiniciar la animación CSS
             void resultsSection.offsetWidth;
            resultsSection.classList.add('visible'); // Muestra la sección con animación

        }, 500); // Retraso de 0.5 segundos
    });

    // Permite rastrear presionando Enter en el input
    trackingInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Evita el envío de formulario si estuviera dentro de uno
            trackButton.click(); // Simula el clic en el botón
        }
    });


    function displayTrackingTimeline(statuses) {
        const timelineList = document.createElement('ul');
        timelineList.className = 'tracking-timeline';

        statuses.forEach(status => {
            const listItem = document.createElement('li');
            listItem.className = 'timeline-item';

            // Formatear fecha y hora
            const date = new Date(status.timestamp);
            const formattedDate = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
            const formattedTime = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });

            listItem.innerHTML = `
                <div class="timeline-icon ${status.iconClass}">
                    ${status.icon}
                    <!-- Si usaras Font Awesome: <i class="fas fa-truck"></i> -->
                </div>
                <div class="timeline-content">
                    <h3>${status.status}</h3>
                    <p>${status.location}</p>
                    <p><small>${formattedDate} - ${formattedTime}</small></p>
                </div>
            `;
            timelineList.appendChild(listItem);
        });

        resultsSection.appendChild(timelineList);
    }

    function displayMessage(message, type = 'info') {
         // Forzar reflujo antes de añadir mensaje
        void resultsSection.offsetWidth;

        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        if (type === 'error') {
            messageElement.className = 'error-message';
        } else {
            messageElement.className = 'results-placeholder';
        }
        resultsSection.appendChild(messageElement);
        resultsSection.classList.add('visible');
    }

});