document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos DOM ---
    const clientTrackButton = document.getElementById('clientTrackButton');
    const clientTrackingInput = document.getElementById('clientTrackingInput');
    const clientResultsSection = document.getElementById('clientTrackingResults');
    const clientTimelineList = document.getElementById('clientTimelineList');
    const clientErrorMessage = document.getElementById('clientErrorMessage');
    const clientTrackingCodeHeader = document.getElementById('clientTrackingCodeHeader');
    const clientPackageOwnerSpan = document.getElementById('clientPackageOwner');


    // --- Clave LocalStorage (DEBE SER LA MISMA QUE EN LA PÁGINA DE DIGITACIÓN) ---
    const HELLSTAR_PACKAGES_KEY = 'expressboxrd_hellstar_packages_v2';

    // --- Mapeo de Estados (DEBE SER EL MISMO QUE EN LA PÁGINA DE DIGITACIÓN) ---
    const statusMap = {
        'received_warehouse_origin_hellstar': { text: 'Recibido por Hellstar (Almacén Origen)', class: 'icon-received_warehouse_origin', icon: 'fas fa-store-alt' },
        'in_transit_to_rd_expressbox': { text: 'En Tránsito hacia República Dominicana (Con ExpressBoxRD)', class: 'icon-in_transit_to_rd', icon: 'fas fa-plane-departure' },
        'customs_rd_expressbox': { text: 'En Proceso Aduanal en República Dominicana (Gestión ExpressBoxRD)', class: 'icon-customs_rd', icon: 'fas fa-building-shield' },
        'ready_for_dispatch_cd_expressbox': { text: 'En Centro de Distribución ExpressBoxRD (Listo para Despacho)', class: 'icon-ready_for_dispatch_cd', icon: 'fas fa-dolly-flatbed' },
        'out_for_delivery_rd_expressbox': { text: 'En Ruta de Entrega en República Dominicana (Conductor ExpressBoxRD)', class: 'icon-out_for_delivery_rd', icon: 'fas fa-truck-fast' },
        'delivered_rd_expressbox': { text: 'Entregado por ExpressBoxRD', class: 'icon-delivered_rd', icon: 'fas fa-house-chimney-user' }
    };

    // --- Funciones ---
    function getStoredPackages() {
        const packagesJson = localStorage.getItem(HELLSTAR_PACKAGES_KEY);
        try {
            return packagesJson ? JSON.parse(packagesJson) : [];
        } catch (e) {
            console.error("Error al parsear paquetes almacenados:", e);
            return [];
        }
    }

    function displayClientTrackingTimeline(originalTrackingCode, packageData) {
        if (!clientTimelineList || !clientResultsSection || !clientErrorMessage || !clientTrackingCodeHeader || !clientPackageOwnerSpan) return;

        clientTimelineList.innerHTML = '';
        clientErrorMessage.style.display = 'none';
        clientTrackingCodeHeader.textContent = `Resultados para: ${originalTrackingCode}`;
        clientPackageOwnerSpan.textContent = packageData.customerName || 'Cliente';

        // SIMULACIÓN DE HISTORIAL DE ESTADOS:
        // En un sistema real, cada cambio de estado se guardaría con su propia fecha.
        // Aquí, solo mostramos el estado actual y algunos estados ficticios anteriores.
        const history = [];
        const allPossibleStatuses = Object.keys(statusMap);
        const currentStatusIndex = allPossibleStatuses.indexOf(packageData.status);

        if (currentStatusIndex === -1) { // Estado no conocido
            history.push({
                timestamp: packageData.lastUpdated || packageData.timestamp, // Usar lastUpdated si existe
                status: "Estado Desconocido",
                location: packageData.location || "Ubicación no disponible",
                iconClass: 'fa-question-circle'
            });
        } else {
            // Añadir el estado actual y todos los anteriores en el orden del map
            for (let i = 0; i <= currentStatusIndex; i++) {
                const statusKey = allPossibleStatuses[i];
                const statusDetails = statusMap[statusKey];
                let mockTimestamp = new Date(packageData.timestamp); // Base timestamp

                // Ajustar timestamps para simular progresión (muy simplificado)
                if (i < currentStatusIndex) {
                    mockTimestamp.setDate(mockTimestamp.getDate() - (currentStatusIndex - i));
                    mockTimestamp.setHours(mockTimestamp.getHours() - (currentStatusIndex - i) * 3);
                } else {
                    // Usar la última actualización para el estado actual si está disponible
                    mockTimestamp = new Date(packageData.lastUpdated || packageData.timestamp);
                }


                history.unshift({ // Añadir al inicio para que el más reciente esté arriba
                    timestamp: mockTimestamp.toISOString(),
                    status: statusDetails.text,
                    location: (i === currentStatusIndex && packageData.location) ? packageData.location : `Punto de control ${statusDetails.text.split('(')[0].trim()}`, // Simplificar ubicación para estados previos
                    iconClass: statusDetails.icon,
                    iconContainerClass: `icon-${statusKey.replace(/_expressbox|_hellstar/g, '')}` // Para CSS
                });
            }
        }


        history.forEach(statusEntry => {
            const listItem = document.createElement('li');
            listItem.className = 'timeline-item';
            const date = new Date(statusEntry.timestamp);
            const formattedDate = date.toLocaleDateString('es-DO', { year: 'numeric', month: 'short', day: 'numeric' });
            const formattedTime = date.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: true });

            listItem.innerHTML = `
                <div class="timeline-icon ${statusEntry.iconContainerClass || 'icon-default'}">
                    <i class="fas ${statusEntry.iconClass}"></i>
                </div>
                <div class="timeline-content">
                    <h3>${statusEntry.status}</h3>
                    <p class="location">${statusEntry.location}</p>
                    <p class="timestamp">${formattedDate} - ${formattedTime}</p>
                </div>
            `;
            clientTimelineList.appendChild(listItem);
        });

        clientResultsSection.style.display = 'block';
        clientResultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function displayClientError(message) {
        if (!clientTimelineList || !clientResultsSection || !clientErrorMessage || !clientTrackingCodeHeader) return;
        clientTimelineList.innerHTML = '';
        clientTrackingCodeHeader.textContent = 'Error de Búsqueda';
        clientErrorMessage.textContent = message;
        clientErrorMessage.style.display = 'block';
        clientResultsSection.style.display = 'block';
        clientResultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function handleClientTrack() {
        const originalTrackingCode = clientTrackingInput.value.trim();
        clientResultsSection.style.display = 'none';
        clientErrorMessage.style.display = 'none';
        clientTimelineList.innerHTML = '';

        if (!originalTrackingCode) {
            displayClientError('Por favor, ingresa tu código de rastreo original.');
            return;
        }

        console.log(`Cliente buscando por Tracking Original: ${originalTrackingCode}`);
        const allPackages = getStoredPackages();
        // Buscar paquete por el campo 'originalTracking'
        const foundPackage = allPackages.find(pkg => pkg.originalTracking && pkg.originalTracking.toUpperCase() === originalTrackingCode.toUpperCase());

        if (foundPackage) {
            displayClientTrackingTimeline(originalTrackingCode, foundPackage);
        } else {
            displayClientError(`No se encontró información para el código de rastreo "${originalTrackingCode}". Verifica el código o contacta a Hellstar/ExpressBoxRD si crees que es un error.`);
        }
    }

    // --- Event Listeners ---
    if (clientTrackButton && clientTrackingInput) {
        clientTrackButton.addEventListener('click', handleClientTrack);
        clientTrackingInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleClientTrack();
            }
        });
    } else {
        console.error("Error: Botón o input de rastreo del cliente no encontrado.");
    }
});