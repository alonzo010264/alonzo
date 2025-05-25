document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos DOM Paquetes ---
    const addPackageForm = document.getElementById('addPackageForm');
    const trackingCodeInput = document.getElementById('trackingCode');
    const customerNameInput = document.getElementById('customerName');
    const packagePriceInput = document.getElementById('packagePrice');
    const promoCodeInput = document.getElementById('promoCode'); // Para aplicar a paquete
    const addPackageMessage = document.getElementById('addPackageMessage');
    const pendingPackagesTableBody = document.getElementById('pendingPackagesBody');
    const totalPendingAmountSpan = document.getElementById('totalPendingAmount');
    // Para mostrar cálculo de precio con ITBIS y descuento
    const displaySubtotalSpan = document.getElementById('displaySubtotal');
    const displayITBISSpan = document.getElementById('displayITBIS');
    const displayDiscountSpan = document.getElementById('displayDiscount');
    const displayDiscountPercentSpan = document.getElementById('displayDiscountPercent');
    const displayTotalWithITBISSpan = document.getElementById('displayTotalWithITBIS');


    // --- Elementos DOM Códigos Promocionales ---
    const createPromoForm = document.getElementById('createPromoForm');
    const newPromoCodeInput = document.getElementById('newPromoCode');
    const promoDiscountInput = document.getElementById('promoDiscount');
    const createPromoMessage = document.getElementById('createPromoMessage');
    const existingPromosList = document.getElementById('existingPromosList');

    // --- Elementos DOM Suscripciones ---
    const subscribeClientForm = document.getElementById('subscribeClientForm');
    const subClientNameInput = document.getElementById('subClientName');
    const subClientEmailInput = document.getElementById('subClientEmail');
    const planSelect = document.getElementById('planSelect');
    const subscribeMessage = document.getElementById('subscribeMessage');
    const clientPlansTableBody = document.getElementById('clientPlansBody');

    // --- Claves LocalStorage ---
    const PENDING_PACKAGES_KEY = 'expressboxrd_suc_los_jardines_pending_v2';
    const PROMO_CODES_KEY = 'expressboxrd_promo_codes_v2';
    const CLIENT_SUBSCRIPTIONS_KEY = 'expressboxrd_client_subscriptions_v2';

    const ITBIS_RATE = 0.18; // 18%

    // --- Funciones Auxiliares LocalStorage ---
    const getFromStorage = (key) => JSON.parse(localStorage.getItem(key) || '[]');
    const saveToStorage = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    // --- Lógica de Paquetes ---
    function calculatePackageTotals() {
        if (!packagePriceInput || !promoCodeInput || !displaySubtotalSpan || !displayITBISSpan || !displayDiscountSpan || !displayDiscountPercentSpan || !displayTotalWithITBISSpan) return;

        const originalPrice = parseFloat(packagePriceInput.value) || 0;
        const promoCode = promoCodeInput.value.trim().toUpperCase();
        const promotions = getFromStorage(PROMO_CODES_KEY);
        const promo = promotions.find(p => p.code === promoCode);

        let discountAmount = 0;
        let discountPercent = 0;

        if (promo) {
            discountAmount = originalPrice * (promo.discount / 100);
            discountPercent = promo.discount;
        }

        const priceAfterDiscount = originalPrice - discountAmount;
        const itbisAmount = priceAfterDiscount * ITBIS_RATE;
        const finalTotal = priceAfterDiscount + itbisAmount;

        displaySubtotalSpan.textContent = `RD$ ${originalPrice.toFixed(2)}`;
        displayITBISSpan.textContent = `RD$ ${itbisAmount.toFixed(2)}`;
        displayDiscountSpan.textContent = `RD$ ${discountAmount.toFixed(2)}`;
        displayDiscountPercentSpan.textContent = discountPercent;
        displayTotalWithITBISSpan.textContent = `RD$ ${finalTotal.toFixed(2)}`;
    }

    if(packagePriceInput) packagePriceInput.addEventListener('input', calculatePackageTotals);
    if(promoCodeInput) promoCodeInput.addEventListener('input', calculatePackageTotals);


    function renderPendingPackages() {
        if (!pendingPackagesTableBody || !totalPendingAmountSpan) return;
        const packages = getFromStorage(PENDING_PACKAGES_KEY);
        pendingPackagesTableBody.innerHTML = '';
        let totalPending = 0;

        if (packages.length === 0) {
            pendingPackagesTableBody.innerHTML = '<tr><td colspan="7" class="loading-placeholder">No hay paquetes pendientes.</td></tr>';
            totalPendingAmountSpan.textContent = 'RD$ 0.00';
            return;
        }

        packages.forEach((pkg, index) => {
            const row = pendingPackagesTableBody.insertRow();
            row.dataset.packageId = pkg.id;
            totalPending += pkg.totalToPay;

            row.innerHTML = `
                <td>${pkg.trackingCode}</td>
                <td>${pkg.customerName}</td>
                <td>RD$ ${pkg.originalPrice.toFixed(2)}</td>
                <td>RD$ ${pkg.itbis.toFixed(2)}</td>
                <td>RD$ ${pkg.discountAmount.toFixed(2)} (${pkg.discountPercent}%)</td>
                <td><strong>RD$ ${pkg.totalToPay.toFixed(2)}</strong></td>
                <td class="table-actions">
                    <button class="btn-paid" data-index="${index}" title="Marcar Pagado"><i class="fas fa-check-circle"></i></button>
                    <button class="btn-delete" data-index="${index}" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
        });
        totalPendingAmountSpan.textContent = `RD$ ${totalPending.toFixed(2)}`;
    }

    if (addPackageForm) {
        addPackageForm.addEventListener('submit', (event) => {
            event.preventDefault();
            // Recalcular por si acaso antes de guardar
            calculatePackageTotals();

            const originalPrice = parseFloat(packagePriceInput.value) || 0;
            const promoCode = promoCodeInput.value.trim().toUpperCase();
            const promotions = getFromStorage(PROMO_CODES_KEY);
            const promo = promotions.find(p => p.code === promoCode);

            let discountAmount = 0;
            let discountPercent = 0;
            if (promo) {
                discountAmount = originalPrice * (promo.discount / 100);
                discountPercent = promo.discount;
            }
            const priceAfterDiscount = originalPrice - discountAmount;
            const itbis = priceAfterDiscount * ITBIS_RATE;
            const totalToPay = priceAfterDiscount + itbis;

            const newPackage = {
                id: Date.now().toString(),
                trackingCode: trackingCodeInput.value.trim(),
                customerName: customerNameInput.value.trim(),
                originalPrice: originalPrice,
                itbis: itbis,
                promoApplied: promo ? promo.code : null,
                discountAmount: discountAmount,
                discountPercent: discountPercent,
                totalToPay: totalToPay,
                timestamp: new Date().toISOString()
            };

            const packages = getFromStorage(PENDING_PACKAGES_KEY);
            packages.unshift(newPackage);
            saveToStorage(PENDING_PACKAGES_KEY, packages);
            renderPendingPackages();
            showFormFeedback(addPackageMessage, `Paquete añadido. Total: RD$ ${totalToPay.toFixed(2)}`, 'success');
            addPackageForm.reset();
            calculatePackageTotals(); // Resetear visualización del formulario
            setTimeout(() => { if(addPackageMessage) addPackageMessage.style.display = 'none';}, 3000);
        });
    }

    if (pendingPackagesTableBody) {
        pendingPackagesTableBody.addEventListener('click', (event) => {
            const target = event.target.closest('button');
            if (!target) return;
            const packageIndex = parseInt(target.dataset.index, 10);
            let packages = getFromStorage(PENDING_PACKAGES_KEY);

            if (target.classList.contains('btn-paid')) {
                if (confirm(`Marcar paquete de ${packages[packageIndex].customerName} como pagado?`)) {
                    packages.splice(packageIndex, 1);
                    saveToStorage(PENDING_PACKAGES_KEY, packages);
                    renderPendingPackages();
                }
            } else if (target.classList.contains('btn-delete')) {
                if (confirm(`Eliminar paquete ${packages[packageIndex].trackingCode}?`)) {
                    packages.splice(packageIndex, 1);
                    saveToStorage(PENDING_PACKAGES_KEY, packages);
                    renderPendingPackages();
                }
            }
        });
    }

    // --- Lógica de Códigos Promocionales ---
    function renderPromoCodes() {
        if (!existingPromosList) return;
        const promotions = getFromStorage(PROMO_CODES_KEY);
        existingPromosList.innerHTML = '';
        if (promotions.length === 0) {
            existingPromosList.innerHTML = '<li>No hay códigos promocionales creados.</li>';
            return;
        }
        promotions.forEach((promo, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="promo-code-value">${promo.code}</span>
                <span class="promo-discount-value">${promo.discount}% OFF</span>
                <button class="delete-promo-btn" data-index="${index}" title="Eliminar Código">×</button>
            `;
            existingPromosList.appendChild(li);
        });
    }

    if (createPromoForm) {
        createPromoForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const code = newPromoCodeInput.value.trim().toUpperCase();
            const discount = parseInt(promoDiscountInput.value, 10);

            if (!code || isNaN(discount) || discount < 1 || discount > 100) {
                showFormFeedback(createPromoMessage, 'Ingresa un código válido y un descuento entre 1 y 100.', 'error');
                return;
            }
            const promotions = getFromStorage(PROMO_CODES_KEY);
            if (promotions.find(p => p.code === code)) {
                showFormFeedback(createPromoMessage, `El código "${code}" ya existe.`, 'error');
                return;
            }
            promotions.push({ code, discount });
            saveToStorage(PROMO_CODES_KEY, promotions);
            renderPromoCodes();
            showFormFeedback(createPromoMessage, `Código "${code}" creado con ${discount}% de descuento.`, 'success');
            createPromoForm.reset();
            setTimeout(() => { if(createPromoMessage) createPromoMessage.style.display = 'none';}, 3000);
        });
    }

    if (existingPromosList) {
        existingPromosList.addEventListener('click', (event) => {
            if (event.target.classList.contains('delete-promo-btn')) {
                const promoIndex = parseInt(event.target.dataset.index, 10);
                let promotions = getFromStorage(PROMO_CODES_KEY);
                if (confirm(`¿Eliminar el código "${promotions[promoIndex].code}"?`)) {
                    promotions.splice(promoIndex, 1);
                    saveToStorage(PROMO_CODES_KEY, promotions);
                    renderPromoCodes();
                }
            }
        });
    }

    // --- Lógica de Suscripciones a Planes ---
    function renderClientSubscriptions() {
        if (!clientPlansTableBody) return;
        const subscriptions = getFromStorage(CLIENT_SUBSCRIPTIONS_KEY);
        clientPlansTableBody.innerHTML = '';

        if (subscriptions.length === 0) {
            clientPlansTableBody.innerHTML = '<tr><td colspan="6" class="loading-placeholder">No hay clientes suscritos a planes.</td></tr>';
            return;
        }

        const now = new Date();
        subscriptions.forEach((sub, index) => {
            const row = clientPlansTableBody.insertRow();
            const endDate = new Date(sub.endDate);
            const timeLeft = endDate - now;
            let daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
            let statusClass = 'plan-active';
            let daysLeftText = `${daysLeft} días`;

            if (daysLeft <= 0) {
                daysLeft = 0;
                daysLeftText = "Expirado";
                statusClass = 'plan-expired';
            } else if (daysLeft <= 7) {
                statusClass = 'plan-expiring';
            }
            if (sub.planDurationMonths === 1 && daysLeft > 0) { // Simple para "1 Mes"
                daysLeftText = `~1 Mes (Restan ${daysLeft} d.)`;
            }


            row.innerHTML = `
                <td>${sub.clientName}</td>
                <td>${sub.clientEmail}</td>
                <td class="plan-name-display">${sub.planName}</td>
                <td>${endDate.toLocaleDateString('es-DO')}</td>
                <td class="${statusClass}">${daysLeftText}</td>
                <td class="table-actions">
                    <button class="btn-cancel-subscription" data-index="${index}" title="Cancelar Suscripción (Simulado)"><i class="fas fa-user-times"></i> Cancelar</button>
                </td>
            `;
        });
    }

    if (subscribeClientForm) {
        subscribeClientForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const clientName = subClientNameInput.value.trim();
            const clientEmail = subClientEmailInput.value.trim();
            const selectedPlanValue = planSelect.value;
            const planName = planSelect.options[planSelect.selectedIndex].text; // Texto del option

            if (!clientName || !clientEmail || !selectedPlanValue) {
                showFormFeedback(subscribeMessage, 'Completa todos los campos del cliente y selecciona un plan.', 'error');
                return;
            }

            const subscriptions = getFromStorage(CLIENT_SUBSCRIPTIONS_KEY);
            // Evitar duplicados por email (simple)
            if (subscriptions.find(s => s.clientEmail === clientEmail && s.planName === planName && new Date(s.endDate) > new Date())) {
                showFormFeedback(subscribeMessage, `El cliente ${clientEmail} ya tiene este plan activo.`, 'error');
                return;
            }

            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setMonth(startDate.getMonth() + 1); // Asumimos todos los planes son mensuales

            const newSubscription = {
                id: Date.now().toString(),
                clientName,
                clientEmail,
                planName,
                planValue: selectedPlanValue,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                planDurationMonths: 1 // Todos son de 1 mes por ahora
            };

            subscriptions.push(newSubscription);
            saveToStorage(CLIENT_SUBSCRIPTIONS_KEY, subscriptions);
            renderClientSubscriptions();
            showFormFeedback(subscribeMessage, `Cliente ${clientName} suscrito al ${planName}.`, 'success');
            subscribeClientForm.reset();
            setTimeout(() => { if(subscribeMessage) subscribeMessage.style.display = 'none';}, 3000);
        });
    }

    if (clientPlansTableBody) {
        clientPlansTableBody.addEventListener('click', (event) => {
             if (event.target.closest('.btn-cancel-subscription')) {
                const subIndex = parseInt(event.target.closest('.btn-cancel-subscription').dataset.index, 10);
                let subscriptions = getFromStorage(CLIENT_SUBSCRIPTIONS_KEY);
                if (confirm(`¿Cancelar la suscripción de ${subscriptions[subIndex].clientName} al ${subscriptions[subIndex].planName}? (Esto es simulado)`)) {
                    subscriptions.splice(subIndex, 1);
                    saveToStorage(CLIENT_SUBSCRIPTIONS_KEY, subscriptions);
                    renderClientSubscriptions();
                }
            }
        });
    }

    // Función auxiliar para mensajes del formulario
    function showFormFeedback(element, message, type) {
        if (!element) return;
        element.textContent = message;
        element.className = `form-feedback ${type}`;
        element.style.display = 'block';
         setTimeout(() => { if(element) element.style.display = 'none';}, 4000);
    }

    // --- Inicializar Todas las Secciones ---
    renderPendingPackages();
    renderPromoCodes();
    renderClientSubscriptions();
    calculatePackageTotals(); // Inicializar visualización de precios

});