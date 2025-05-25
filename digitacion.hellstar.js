document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos DOM (Contador y Forms Paquetes/Promos) ---
    // ... (igual que antes: daysEl, hoursEl, etc.)
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const promoEndedMessageEl = document.getElementById('promoEndedMessage');
    const countdownTimerEl = document.getElementById('countdownTimer');

    const addPackageForm = document.getElementById('addHellstarPackageForm');
    const hsTrackingCodeEBInput = document.getElementById('hsTrackingCodeEB'); // <<< CAMBIADO ID
    const hsOriginalTrackingInput = document.getElementById('hsOriginalTracking'); // <<< NUEVO
    const hsCustomerNameInput = document.getElementById('hsCustomerName');
    const hsPackageContentInput = document.getElementById('hsPackageContent');
    const hsPromoCodeInput = document.getElementById('hsPromoCode');
    const hsPackageStatusSelect = document.getElementById('hsPackageStatus');
    const addPackageMessage = document.getElementById('addPackageMessage');

    const digitizedPackagesTableBody = document.getElementById('hellstarPackagesBody');
    const searchPackagesInput = document.getElementById('searchPackagesInput');

    const createPromoForm = document.getElementById('createPromoForm');
    const newPromoCodeInput = document.getElementById('newPromoCode');
    const promoDiscountInput = document.getElementById('promoDiscount');
    const createPromoMessage = document.getElementById('createPromoMessage');
    const existingPromosList = document.getElementById('existingPromosList');

    // --- Claves LocalStorage ---
    const HELLSTAR_PACKAGES_KEY = 'expressboxrd_hellstar_packages_v2'; // Versionar por si acaso
    const HELLSTAR_PROMO_CODES_KEY = 'expressboxrd_hellstar_promos_v1';

    // --- Configuración Cuenta Regresiva ---
    const promoEndDate = new Date('2024-12-31T23:59:59');

    // --- Mapeo de Estados (Actualizado para reflejar el proveedor) ---
    const statusMap = {
        'received_warehouse_origin_hellstar': { text: 'Recibido Origen (Hellstar)', class: 'status-received_warehouse_origin', icon: 'fas fa-store-alt' },
        'in_transit_to_rd_expressbox': { text: 'En Tránsito a RD (ExpressBoxRD)', class: 'status-in_transit_to_rd', icon: 'fas fa-plane-departure' },
        'customs_rd_expressbox': { text: 'En Aduanas RD (ExpressBoxRD)', class: 'status-customs_rd', icon: 'fas fa-building-shield' },
        'ready_for_dispatch_cd_expressbox': { text: 'Listo CD ExpressBoxRD', class: 'status-ready_for_dispatch_cd', icon: 'fas fa-dolly-flatbed' },
        'out_for_delivery_rd_expressbox': { text: 'En Ruta Entrega (ExpressBoxRD)', class: 'status-out_for_delivery_rd', icon: 'fas fa-truck-fast' },
        'delivered_rd_expressbox': { text: 'Entregado (ExpressBoxRD)', class: 'status-delivered_rd', icon: 'fas fa-house-chimney-user' }
    };

    const getFromStorage = (key) => JSON.parse(localStorage.getItem(key) || '[]');
    const saveToStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    // --- Lógica Cuenta Regresiva (sin cambios) ---
    function updateCountdown() { /* ... (código igual que antes) ... */
        if (!daysEl || !hoursEl || !minutesEl || !secondsEl || !countdownTimerEl || !promoEndedMessageEl) return;
        const now = new Date();
        const timeLeft = promoEndDate - now;
        if (timeLeft < 0) {
            countdownTimerEl.style.display = 'none';
            promoEndedMessageEl.style.display = 'block';
            clearInterval(countdownInterval);
            document.querySelectorAll('.disabled-plan .disabled-overlay').forEach(overlay => overlay.style.display = 'none');
            document.querySelectorAll('.disabled-plan').forEach(plan => plan.classList.remove('disabled-plan'));
            if(document.querySelector('.note-future-plans')) document.querySelector('.note-future-plans').textContent = "¡Nuestros planes especiales para Hellstar ya están disponibles!";
            return;
        }
        const d = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const h = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((timeLeft % (1000 * 60)) / 1000);
        daysEl.textContent = d < 10 ? '0' + d : d;
        hoursEl.textContent = h < 10 ? '0' + h : h;
        minutesEl.textContent = m < 10 ? '0' + m : m;
        secondsEl.textContent = s < 10 ? '0' + s : s;
    }
    const countdownInterval = setInterval(updateCountdown, 1000);
    updateCountdown();

    // --- Lógica Paquetes Hellstar ---
    function renderHellstarPackages(filterText = '') {
        if (!digitizedPackagesTableBody) return;
        const packages = getFromStorage(HELLSTAR_PACKAGES_KEY);
        digitizedPackagesTableBody.innerHTML = '';
        const filteredPackages = packages.filter(pkg =>
            (pkg.trackingCodeEB && pkg.trackingCodeEB.toLowerCase().includes(filterText.toLowerCase())) ||
            (pkg.originalTracking && pkg.originalTracking.toLowerCase().includes(filterText.toLowerCase())) || // <<< BUSCAR POR TRACKING ORIGINAL
            (pkg.customerName && pkg.customerName.toLowerCase().includes(filterText.toLowerCase()))
        );

        if (filteredPackages.length === 0) {
            digitizedPackagesTableBody.innerHTML = `<tr><td colspan="7" class="loading-placeholder">${filterText ? 'No hay paquetes que coincidan.' : 'No hay paquetes Hellstar digitados.'}</td></tr>`;
            return;
        }
        filteredPackages.forEach((pkg) => { // Quitar index si no se usa para eliminar directamente aquí
            const row = digitizedPackagesTableBody.insertRow();
            row.dataset.packageId = pkg.id;
            const statusInfo = statusMap[pkg.status] || { text: pkg.status, class: '', icon: 'fas fa-question' };
            const dateObj = new Date(pkg.timestamp);
            const formattedDate = dateObj.toLocaleDateString('es-DO', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'});

            row.innerHTML = `
                <td>${pkg.trackingCodeEB}</td>
                <td>${pkg.originalTracking || 'N/A'}</td> <!-- <<< MOSTRAR TRACKING ORIGINAL -->
                <td>${pkg.customerName}</td>
                <td>${pkg.content}</td>
                <td><span class="status-badge ${statusInfo.class}"><i class="${statusInfo.icon}"></i> ${statusInfo.text}</span></td>
                <td>${formattedDate}</td>
                <td class="table-actions">
                    <button class="btn-edit-hs" data-id="${pkg.id}" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete-hs" data-id="${pkg.id}" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
        });
    }

    if (addPackageForm) {
        addPackageForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const trackingCodeEB = hsTrackingCodeEBInput.value.trim().toUpperCase();
            const originalTracking = hsOriginalTrackingInput.value.trim(); // <<< OBTENER TRACKING ORIGINAL
            const customerName = hsCustomerNameInput.value.trim();
            const content = hsPackageContentInput.value.trim();
            const promoCode = hsPromoCodeInput.value.trim().toUpperCase();
            const status = hsPackageStatusSelect.value;

            if (!trackingCodeEB || !originalTracking || !customerName || !content || !status) { // <<< VALIDAR TRACKING ORIGINAL
                showFormFeedback(addPackageMessage, 'Todos los campos son requeridos (excepto promo ExpressBoxRD).', 'error');
                return;
            }

            const promotions = getFromStorage(HELLSTAR_PROMO_CODES_KEY);
            const promo = promotions.find(p => p.code === promoCode);
            let promoAppliedMessage = 'Paquete registrado. Envío GRATIS (Promoción Activa).';
            let promoAppliedCode = "PROMO_GRATIS_HELLSTAR";

            if (promo) {
                promoAppliedMessage = `Paquete registrado con promo ExpressBoxRD "${promo.code}" (${promo.discount}% OFF). Envío GRATIS aún activo.`;
                promoAppliedCode = promo.code;
            } else if (promoCode) {
                promoAppliedMessage = `Código ExpressBoxRD "${promoCode}" no válido. Paquete registrado con envío GRATIS (Promoción Activa).`;
            }

            const packages = getFromStorage(HELLSTAR_PACKAGES_KEY);
            // Permitir actualizar si el trackingCodeEB ya existe
            const existingPackageIndex = packages.findIndex(p => p.trackingCodeEB === trackingCodeEB);
            let successMessage = '';

            if(existingPackageIndex > -1) {
                packages[existingPackageIndex] = {
                    ...packages[existingPackageIndex], // Mantener ID original si existe
                    originalTracking, // <<< GUARDAR TRACKING ORIGINAL
                    customerName,
                    content,
                    status,
                    promoApplied: promoAppliedCode, // Actualizar promo si cambia
                    lastUpdated: new Date().toISOString()
                };
                successMessage = `Paquete ${trackingCodeEB} actualizado. ${promoAppliedMessage}`;
            } else {
                const newPackage = {
                    id: Date.now().toString(), trackingCodeEB, originalTracking, customerName, content, status,
                    promoApplied: promoAppliedCode,
                    timestamp: new Date().toISOString()
                };
                packages.unshift(newPackage);
                successMessage = `Paquete ${trackingCodeEB} registrado. ${promoAppliedMessage}`;
            }

            saveToStorage(HELLSTAR_PACKAGES_KEY, packages);
            renderHellstarPackages(searchPackagesInput ? searchPackagesInput.value : '');
            showFormFeedback(addPackageMessage, successMessage, 'success');
            addPackageForm.reset();
            setTimeout(() => { if(addPackageMessage) addPackageMessage.style.display = 'none';}, 4000);
        });
    }

    // Editar y Eliminar Paquetes Hellstar
    if (digitizedPackagesTableBody) {
        digitizedPackagesTableBody.addEventListener('click', (event) => {
            const target = event.target.closest('button');
            if (!target) return;
            const packageId = target.dataset.id;
            let packages = getFromStorage(HELLSTAR_PACKAGES_KEY);

            if (target.classList.contains('btn-edit-hs')) {
                const pkgToEdit = packages.find(p => p.id === packageId);
                if (pkgToEdit) {
                    hsTrackingCodeEBInput.value = pkgToEdit.trackingCodeEB;
                    hsOriginalTrackingInput.value = pkgToEdit.originalTracking || ''; // <<< CARGAR TRACKING ORIGINAL
                    hsCustomerNameInput.value = pkgToEdit.customerName;
                    hsPackageContentInput.value = pkgToEdit.content;
                    hsPackageStatusSelect.value = pkgToEdit.status;
                    hsPromoCodeInput.value = (pkgToEdit.promoApplied !== "PROMO_GRATIS_HELLSTAR" ? pkgToEdit.promoApplied : "") || '';
                    // Simple "edit": remove and re-add on save
                    packages = packages.filter(p => p.id !== packageId);
                    saveToStorage(HELLSTAR_PACKAGES_KEY, packages);
                    renderHellstarPackages(searchPackagesInput ? searchPackagesInput.value : '');
                    showFormFeedback(addPackageMessage, `Editando paquete ${pkgToEdit.trackingCodeEB}. Guarda para confirmar.`, 'info');
                    hsTrackingCodeEBInput.focus();
                }
            } else if (target.classList.contains('btn-delete-hs')) {
                 if (confirm(`¿Eliminar paquete ${packages.find(p=>p.id === packageId)?.trackingCodeEB}?`)) {
                    packages = packages.filter(p => p.id !== packageId);
                    saveToStorage(HELLSTAR_PACKAGES_KEY, packages);
                    renderHellstarPackages(searchPackagesInput ? searchPackagesInput.value : '');
                 }
            }
        });
    }

    if (searchPackagesInput) {
        searchPackagesInput.addEventListener('input', () => renderHellstarPackages(searchPackagesInput.value));
    }

    // --- Lógica Códigos Promocionales (sin cambios) ---
    function renderPromoCodes() { /* ... (código igual que antes) ... */
        if (!existingPromosList) return;
        const promotions = getFromStorage(HELLSTAR_PROMO_CODES_KEY);
        existingPromosList.innerHTML = '';
        if (promotions.length === 0) {
            existingPromosList.innerHTML = '<li>No hay códigos creados.</li>';
            return;
        }
        promotions.forEach((promo, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="promo-code-value">${promo.code}</span> <span class="promo-discount-value">${promo.discount}% OFF</span> <button class="delete-promo-btn" data-index="${index}" title="Eliminar">×</button>`;
            existingPromosList.appendChild(li);
        });
    }
    if (createPromoForm) { /* ... (código igual que antes) ... */
        createPromoForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const code = newPromoCodeInput.value.trim().toUpperCase();
            const discount = parseInt(promoDiscountInput.value, 10);
            if (!code || isNaN(discount) || discount < 1 || discount > 100) {
                showFormFeedback(createPromoMessage, 'Ingresa código y descuento (1-100).', 'error'); return;
            }
            const promotions = getFromStorage(HELLSTAR_PROMO_CODES_KEY);
            if (promotions.find(p => p.code === code)) {
                showFormFeedback(createPromoMessage, `Código "${code}" ya existe.`, 'error'); return;
            }
            promotions.push({ code, discount });
            saveToStorage(HELLSTAR_PROMO_CODES_KEY, promotions);
            renderPromoCodes();
            showFormFeedback(createPromoMessage, `Código "${code}" creado (${discount}% OFF).`, 'success');
            createPromoForm.reset();
            setTimeout(() => { if(createPromoMessage) createPromoMessage.style.display = 'none';}, 3000);
        });
    }
    if (existingPromosList) { /* ... (código igual que antes) ... */
        existingPromosList.addEventListener('click', (event) => {
            if (event.target.classList.contains('delete-promo-btn')) {
                const promoIndex = parseInt(event.target.dataset.index, 10);
                let promotions = getFromStorage(HELLSTAR_PROMO_CODES_KEY);
                if (confirm(`¿Eliminar código "${promotions[promoIndex].code}"?`)) {
                    promotions.splice(promoIndex, 1);
                    saveToStorage(HELLSTAR_PROMO_CODES_KEY, promotions);
                    renderPromoCodes();
                }
            }
        });
    }

    function showFormFeedback(element, message, type) {
        if (!element) return;
        element.textContent = message;
        element.className = `form-feedback ${type}`;
        element.style.display = 'block';
        setTimeout(() => { if(element) element.style.display = 'none';}, 4000);
    }

    // --- Inicializar ---
    renderHellstarPackages();
    renderPromoCodes();
});