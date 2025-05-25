document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos DOM ---
    const trackButton = document.getElementById('trackButton');
    const trackingInput = document.getElementById('trackingNumberInput');
    const resultsSection = document.getElementById('trackingResults');
    const timelineList = document.getElementById('timelineList');
    const errorMessage = document.getElementById('errorMessage');
    const trackingCodeHeader = document.getElementById('trackingCodeHeader');

    // --- Datos Simulados Rastreo DETALLADO ---
    const trackingData = {
        'EB-476474': [ // El código específico que pediste
            // LOS DATOS MÁS RECIENTES VAN PRIMERO para mostrar en ese orden
            { timestamp: '2023-11-03 10:30:00', status: 'Entregado', location: 'Dirección Cliente, Santo Domingo, RD', iconClass: 'fa-house-chimney' },
            { timestamp: '2023-11-03 08:15:00', status: 'En Ruta de Entrega Final', location: 'Vehículo de reparto, Santo Domingo', iconClass: 'fa-truck-fast' },
            { timestamp: '2023-11-02 18:00:00', status: 'Procesado en Sucursal de Destino', location: 'Sucursal ExpressBoxRD, Santo Domingo', iconClass: 'fa-warehouse' },
            { timestamp: '2023-11-01 09:00:00', status: 'Liberado de Aduanas', location: 'Aduanas, Santo Domingo, RD', iconClass: 'fa-shield-halved' },
            { timestamp: '2023-10-31 14:20:00', status: 'En Proceso Aduanal', location: 'Aduanas, Santo Domingo, RD', iconClass: 'fa-building-shield' }, // Icono específico aduanas
            { timestamp: '2023-10-31 07:00:00', status: 'Llegada al País de Destino (RD)', location: 'Aeropuerto Intl. Las Américas (SDQ)', iconClass: 'fa-plane-arrival' },
            { timestamp: '2023-10-30 20:00:00', status: 'Salida del Vuelo desde Origen', location: 'Aeropuerto de Miami (MIA)', iconClass: 'fa-plane-departure' },
            { timestamp: '2023-10-30 11:05:00', status: 'Recibido en Almacén Origen (Miami)', location: 'Almacén ExpressBoxRD, Miami, USA', iconClass: 'fa-plane' }, // Usamos avión para Miami
            { timestamp: '2023-10-29 15:00:00', status: 'Información de Envío Recibida', location: 'Sistema de Empresa Remitente (Ej: Amazon)', iconClass: 'fa-box' }
        ],
        // Puedes añadir otros códigos de ejemplo si quieres probar el error
         'EB-INVALIDO': null
    };
    // ----------------------------------------

    // --- Funciones ---
    function displayTrackingTimeline(trackingCode, statuses) {
        if (!timelineList || !resultsSection || !errorMessage || !trackingCodeHeader) return;

        timelineList.innerHTML = ''; // Limpiar timeline anterior
        errorMessage.style.display = 'none'; // Ocultar error
        trackingCodeHeader.textContent = `Resultados para: ${trackingCode}`; // Mostrar código buscado

        statuses.forEach(status => {
            const listItem = document.createElement('li');
            listItem.className = 'timeline-item';

            // Formatear fecha y hora
            const date = new Date(status.timestamp.replace(' ', 'T')); // Formato más compatible
            const formattedDate = date.toLocaleDateString('es-DO', { year: 'numeric', month: 'short', day: 'numeric' });
            const formattedTime = date.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: true });

            // Determinar clase de icono (usar 'fa-question-circle' como default)
            const icon = status.iconClass || 'fa-question-circle';
            let iconContainerClass = 'icon-default'; // Clase CSS base
            if (icon.includes('deliver') || icon.includes('house')) iconContainerClass = 'icon-delivered';
            else if (icon.includes('plane') || icon.includes('ship') || icon.includes('truck')) iconContainerClass = 'icon-transit'; // Agrupamos tránsito
            else if (icon.includes('customs') || icon.includes('shield')) iconContainerClass = 'icon-customs';
            else if (icon.includes('warehouse')) iconContainerClass = 'icon-warehouse';
            else if (icon.includes('box')) iconContainerClass = 'icon-received';


            listItem.innerHTML = `
                <div class="timeline-icon ${iconContainerClass}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="timeline-content">
                    <h3>${status.status}</h3>
                    <p class="location">${status.location}</p>
                    <p class="timestamp">${formattedDate} - ${formattedTime}</p>
                </div>
            `;
            timelineList.appendChild(listItem);
        });

        resultsSection.style.display = 'block'; // Mostrar resultados
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); // Scroll hacia resultados
    }

    function displayError(message) {
        if (!timelineList || !resultsSection || !errorMessage || !trackingCodeHeader) return;
        timelineList.innerHTML = ''; // Limpiar timeline
        trackingCodeHeader.textContent = 'Error de Búsqueda';
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        resultsSection.style.display = 'block'; // Mostrar sección para ver el error
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function handleTrack() {
        const trackingCode = trackingInput.value.trim().toUpperCase();

        // Ocultar resultados anteriores antes de buscar
        resultsSection.style.display = 'none';
        errorMessage.style.display = 'none';
        timelineList.innerHTML = '';


        if (!trackingCode) {
            displayError('Por favor, ingresa un código de rastreo.');
            return;
        }

        // Simular búsqueda
        console.log(`Buscando: ${trackingCode}`);
        setTimeout(() => { // Simular espera de red
            const statuses = trackingData[trackingCode];

            if (statuses && statuses.length > 0) {
                displayTrackingTimeline(trackingCode, statuses);
            } else {
                displayError(`No se encontró información para el código "${trackingCode}". Verifica el código e inténtalo de nuevo.`);
            }
        }, 500); // 0.5 segundos de retraso simulado
    }

    // --- Event Listeners ---
    if (trackButton && trackingInput) {
        trackButton.addEventListener('click', handleTrack);

        trackingInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleTrack();
            }
        });
    } else {
        console.error("Error: Botón o input de rastreo no encontrado.");
    }

});