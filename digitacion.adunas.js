document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos DOM Formulario Principal ---
    const customsPackageForm = document.getElementById('customsPackageForm');
    const trackingNumberInput = document.getElementById('trackingNumber');
    const courierCompanyInput = document.getElementById('courierCompany');
    const declaredValueInput = document.getElementById('declaredValue');
    const invoiceNotesInput = document.getElementById('invoiceNotes');
    const packageContentInput = document.getElementById('packageContentDescription');
    const recipientNameInput = document.getElementById('recipientNameDGA');
    const isSuspiciousCheckbox = document.getElementById('isSuspicious');
    const customsFormMessage = document.getElementById('customsFormMessage');

    // --- Elementos DOM Tabla Paquetes Aduanas ---
    const customsPackagesTableBody = document.getElementById('customsPackagesBody');
    const searchCustomsInput = document.getElementById('searchCustomsPackagesInput');

    // --- Elementos DOM Tabla Paquetes Amazon ---
    const amazonPackagesTableBody = document.getElementById('amazonPackagesBody');
    const searchAmazonInput = document.getElementById('searchAmazonPackagesInput');

    // --- Claves LocalStorage ---
    const CUSTOMS_PACKAGES_KEY = 'expressboxrd_customs_packages_v1';
    const AMAZON_LIN_PACKAGES_KEY = 'expressboxrd_amazon_lin_packages_v1';

    const ITBIS_RATE = 0.18; // 18% ITBIS (actual)
    const IMPORT_THRESHOLD = 200; // USD
    const IMPORT_TAX_RATE = 0.30; // 30% de impuesto de importación general (ejemplo)

    // --- Mapeo de Estados Aduanales ---
    const customsStatusMap = {
        'pending_payment': { text: 'Pendiente de Pago Impuestos', class: 'status-pending_payment', icon: 'fas fa-file-invoice-dollar' },
        'paid_customs': { text: 'Impuestos Pagados', class: 'status-paid_customs', icon: 'fas fa-check-circle' },
        'retained': { text: 'Retenido por Aduanas', class: 'status-retained', icon: 'fas fa-hand-paper' },
        'cleared_amazon_lin': { text: 'Liberado (Amazon LIN)', class: 'status-cleared_amazon_lin', icon: 'fab fa-amazon' },
        'courier_review': { text: 'En Revisión (Otro Courier)', class: 'status-courier_review', icon: 'fas fa-search' }
    };

    // --- Funciones LocalStorage ---
    const getFromStorage = (key) => JSON.parse(localStorage.getItem(key) || '[]');
    const saveToStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    // --- Renderizar Tablas ---
    function renderCustomsPackages(filterText = '') {
        if (!customsPackagesTableBody) return;
        const packages = getFromStorage(CUSTOMS_PACKAGES_KEY);
        customsPackagesTableBody.innerHTML = '';
        const filtered = packages.filter(pkg =>
            (pkg.trackingNumber && pkg.trackingNumber.toLowerCase().includes(filterText.toLowerCase())) ||
            (pkg.recipientName && pkg.recipientName.toLowerCase().includes(filterText.toLowerCase()))
        );

        if (filtered.length === 0) {
            customsPackagesTableBody.innerHTML = `<tr><td colspan="7" class="loading-placeholder">${filterText ? 'No hay coincidencias.' : 'No hay paquetes comerciales/courier procesados.'}</td></tr>`;
            return;
        }
        filtered.forEach(pkg => {
            const row = customsPackagesTableBody.insertRow();
            const statusInfo = customsStatusMap[pkg.status] || { text: 'Desconocido', class: '', icon: 'fas fa-question' };
            row.innerHTML = `
                <td>${pkg.trackingNumber}</td>
                <td>${pkg.recipientName}</td>
                <td>$${pkg.declaredValue.toFixed(2)}</td>
                <td>RD$ ${pkg.taxesToPay.toFixed(2)}</td>
                <td><span class="status-customs ${statusInfo.class}"><i class="${statusInfo.icon}"></i> ${statusInfo.text}</span></td>
                <td>${pkg.notes || 'N/A'}</td>
                <td class="table-actions">
                    <button class="btn-mark-paid" data-id="${pkg.id}" title="Marcar Impuestos Pagados" ${pkg.status === 'paid_customs' || pkg.status === 'cleared_amazon_lin' ? 'disabled' : ''}><i class="fas fa-money-check-alt"></i></button>
                    <button class="btn-retain" data-id="${pkg.id}" title="Marcar como Retenido" ${pkg.status === 'retained' ? 'disabled' : ''}><i class="fas fa-ban"></i></button>
                    <button class="btn-delete-customs" data-id="${pkg.id}" title="Eliminar Registro"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
        });
    }

    function renderAmazonLINPackages(filterText = '') {
        if (!amazonPackagesTableBody) return;
        const packages = getFromStorage(AMAZON_LIN_PACKAGES_KEY);
        amazonPackagesTableBody.innerHTML = '';
        const filtered = packages.filter(pkg =>
             (pkg.trackingNumber && pkg.trackingNumber.toLowerCase().includes(filterText.toLowerCase())) ||
             (pkg.recipientName && pkg.recipientName.toLowerCase().includes(filterText.toLowerCase()))
        );

        if (filtered.length === 0) {
            amazonPackagesTableBody.innerHTML = `<tr><td colspan="5" class="loading-placeholder">${filterText ? 'No hay coincidencias.' : 'No hay paquetes Amazon LIN registrados.'}</td></tr>`;
            return;
        }
        filtered.forEach(pkg => {
            const row = amazonPackagesTableBody.insertRow();
            const dateObj = new Date(pkg.timestamp);
            const formattedDate = dateObj.toLocaleDateString('es-DO', { day:'2-digit', month:'short', year:'numeric' });
            const statusInfo = customsStatusMap[pkg.status] || { text: 'Procesado', class: 'status-cleared_amazon_lin', icon: 'fab fa-amazon' };

            row.innerHTML = `
                <td>${pkg.trackingNumber}</td>
                <td>${pkg.recipientName}</td>
                <td>$${pkg.declaredValue.toFixed(2)}</td>
                <td><span class="status-customs ${statusInfo.class}"><i class="${statusInfo.icon}"></i> ${statusInfo.text}</span></td>
                <td>${formattedDate}</td>
            `;
        });
    }


    // --- Manejo del Formulario Principal ---
    if (customsPackageForm) {
        customsPackageForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const trackingNumber = trackingNumberInput.value.trim();
            const courierCompany = courierCompanyInput.value.trim();
            const declaredValue = parseFloat(declaredValueInput.value);
            const invoiceNotes = invoiceNotesInput.value.trim().toUpperCase();
            const content = packageContentInput.value.trim();
            const recipientName = recipientNameInput.value.trim();
            const isSuspicious = isSuspiciousCheckbox.checked;

            if (!trackingNumber || !courierCompany || isNaN(declaredValue) || !content || !recipientName) {
                showFormFeedback(customsFormMessage, 'Todos los campos marcados con * son requeridos.', 'error');
                return;
            }

            let taxesToPay = 0;
            let packageStatus = 'courier_review'; // Default para otros couriers o comercial sin LIN
            let notes = courierCompany;

            if (isSuspicious) {
                packageStatus = 'retained';
                notes += ' - MARCADO SOSPECHOSO';
                taxesToPay = 0; // No calcular impuestos si se retiene por sospecha inicialmente
            } else if (courierCompany.toLowerCase().includes('amazon') && invoiceNotes === 'LIN') {
                packageStatus = 'cleared_amazon_lin';
                notes = 'Amazon LIN - Exento de Impuestos Nacionales';
                taxesToPay = 0; // Amazon gestiona sus impuestos
                // Guardar en la lista de Amazon
                const amazonPackages = getFromStorage(AMAZON_LIN_PACKAGES_KEY);
                const newAmazonPackage = {
                    id: Date.now().toString(), trackingNumber, recipientName, declaredValue,
                    status: packageStatus, notes, timestamp: new Date().toISOString()
                };
                amazonPackages.unshift(newAmazonPackage);
                saveToStorage(AMAZON_LIN_PACKAGES_KEY, amazonPackages);
                renderAmazonLINPackages(searchAmazonInput ? searchAmazonInput.value : '');
                showFormFeedback(customsFormMessage, `Paquete Amazon LIN ${trackingNumber} registrado.`, 'success');
                customsPackageForm.reset();
                isSuspiciousCheckbox.checked = false;
                return; // Terminar aquí para paquetes Amazon LIN
            } else if (declaredValue >= IMPORT_THRESHOLD) {
                taxesToPay = declaredValue * IMPORT_TAX_RATE; // Impuesto general
                taxesToPay += taxesToPay * ITBIS_RATE; // ITBIS sobre el impuesto de importación
                packageStatus = 'pending_payment';
                notes = `${courierCompany} - Requiere pago de impuestos.`;
            } else {
                 // Paquetes comerciales < $200 o de otros couriers sin LIN (para revisión de seguridad)
                 // En la vida real, el estado inicial podría ser "en revisión de seguridad"
                 // y si todo está bien, pasa a liberado sin impuestos.
                 // Para esta simulación, si es < 200 y no es Amazon LIN, lo marcaremos como revisión de courier.
                packageStatus = 'courier_review';
                notes = `${courierCompany} - Valor < $200 USD, para revisión.`;
                taxesToPay = 0; // No hay impuestos si es < $200 y no comercial directo
            }


            const newCustomsPackage = {
                id: Date.now().toString(), trackingNumber, courierCompany, declaredValue,
                invoiceNotes, content, recipientName, isSuspicious,
                taxesToPay, status: packageStatus, notes,
                timestamp: new Date().toISOString()
            };

            const customsPackages = getFromStorage(CUSTOMS_PACKAGES_KEY);
            customsPackages.unshift(newCustomsPackage);
            saveToStorage(CUSTOMS_PACKAGES_KEY, customsPackages);
            renderCustomsPackages(searchCustomsInput ? searchCustomsInput.value : '');
            showFormFeedback(customsFormMessage, `Paquete ${trackingNumber} procesado. Estado: ${customsStatusMap[packageStatus].text}.`, 'success');
            customsPackageForm.reset();
            isSuspiciousCheckbox.checked = false;
        });
    }

    // --- Acciones en Tabla Aduanas ---
    if (customsPackagesTableBody) {
        customsPackagesTableBody.addEventListener('click', (event) => {
            const target = event.target.closest('button');
            if (!target) return;

            const packageId = target.dataset.id;
            let packages = getFromStorage(CUSTOMS_PACKAGES_KEY);
            const packageIndex = packages.findIndex(p => p.id === packageId);
            if (packageIndex === -1) return;

            if (target.classList.contains('btn-mark-paid')) {
                if (packages[packageIndex].status !== 'cleared_amazon_lin') { // No se puede marcar pagado si es LIN
                    packages[packageIndex].status = 'paid_customs';
                    packages[packageIndex].notes += ' - Impuestos Pagados en Aduanas.';
                }
            } else if (target.classList.contains('btn-retain')) {
                packages[packageIndex].status = 'retained';
                packages[packageIndex].notes += ' - Retenido por Agente Aduanal.';
                packages[packageIndex].taxesToPay = 0; // Si se retiene, el impuesto queda pendiente de resolución
            } else if (target.classList.contains('btn-delete-customs')) {
                if (confirm(`¿Eliminar registro aduanal para ${packages[packageIndex].trackingNumber}?`)) {
                    packages.splice(packageIndex, 1);
                } else { return; /* No guardar si no se confirma */}
            }
            saveToStorage(CUSTOMS_PACKAGES_KEY, packages);
            renderCustomsPackages(searchCustomsInput ? searchCustomsInput.value : '');
        });
    }

    // --- Búsquedas ---
    if (searchCustomsInput) {
        searchCustomsInput.addEventListener('input', () => renderCustomsPackages(searchCustomsInput.value));
    }
    if (searchAmazonInput) {
        searchAmazonInput.addEventListener('input', () => renderAmazonLINPackages(searchAmazonInput.value));
    }

    // Función auxiliar para mensajes
    function showFormFeedback(element, message, type) {
        if (!element) return;
        element.textContent = message;
        element.className = `form-feedback ${type}`;
        element.style.display = 'block';
        setTimeout(() => { if(element) element.style.display = 'none';}, 4000);
    }

    // --- Inicializar ---
    renderCustomsPackages();
    renderAmazonLINPackages();
});