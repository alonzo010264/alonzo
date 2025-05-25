// cliente.js (Simplified for a Single Predefined Client)
document.addEventListener('DOMContentLoaded', () => {
    const PREDEFINED_CLIENT = {
        fullName: "Cliente Principal",
        expressBoxCode: "EB-CLIENT001",
        email: "cliente@example.com",
        plan: "premium",
        autopayEnabled: false,
        registeredAt: new Date().toISOString()
    };
    const headerUserName = document.getElementById('headerUserName');
    const headerUserEBCode = document.getElementById('headerUserEBCode');
    const headerUserPlanDisplay = document.getElementById('headerUserPlan');
    const welcomeName = document.getElementById('welcomeName');
    const clientPlanNameEl = document.getElementById('clientPlanName');
    const clientPlanIconEl = document.getElementById('clientPlanIcon');
    const notificationsButton = document.getElementById('notificationsButton');
    const notificationBadge = document.getElementById('notificationBadge');
    const notificationsSection = document.getElementById('notificationsSection');
    const notificationsList = document.getElementById('notificationsList');
    const closeNotifications = document.getElementById('closeNotifications');
    const markAllReadButton = document.getElementById('markAllReadButton');
    const clientPackageTableBody = document.getElementById('clientPackageTableBody');
    const noPackagesMessage = document.getElementById('noPackagesMessage');
    const preAlertForm = document.getElementById('preAlertForm');
    const originalTrackingInput = document.getElementById('originalTracking');
    const storeSenderInput = document.getElementById('storeSender');
    const estimatedValueInput = document.getElementById('estimatedValue');
    const packageDescriptionContentInput = document.getElementById('packageDescriptionContent');
    const estimatedArrivalInput = document.getElementById('estimatedArrival');
    const estimatedWeightInput = document.getElementById('estimatedWeight');
    const preAlertMessage = document.getElementById('preAlertMessage');
    const activateAutopayButton = document.getElementById('activateAutopayButton');
    const deactivateAutopayButton = document.getElementById('deactivateAutopayButton');
    const autopayStatusSpan = document.getElementById('autopayStatus');
    const autopayMessage = document.getElementById('autopayMessage');
    const notifyPickupForm = document.getElementById('notifyPickupForm');
    const pickupTrackingCodesInput = document.getElementById('pickupTrackingCodes');
    const pickupDateInput = document.getElementById('pickupDate');
    const pickupMessage = document.getElementById('pickupMessage');
    const ADMIN_DIGITIZED_PACKAGES_KEY = 'expressboxrd_admin_packages_v3';
    const ALL_PREALERTS_KEY = 'expressboxrd_all_prealerts';
    const CLIENT_NOTIFICATIONS_KEY = 'expressboxrd_notifications_user_' + PREDEFINED_CLIENT.expressBoxCode;
    const PICKUP_NOTIFICATIONS_KEY = 'expressboxrd_pickup_notifications';
    const USERS_STORAGE_KEY = 'expressboxrd_users';
    const TASA_CAMBIO_DOP = 59.50;
    const IMPORT_THRESHOLD_USD = 200;
    const ARANCEL_GENERAL_RATE = 0.20;
    const ITBIS_RATE = 0.18;
    const statusMap = {
        'received_warehouse_origin': { text: 'Recibido Origen', class: 'status-received_warehouse_origin', icon: 'fas fa-warehouse' },
        'in_transit_to_rd': { text: 'En Tránsito a RD', class: 'status-in_transit_to_rd', icon: 'fas fa-plane-departure' },
        'customs_rd': { text: 'En Aduanas RD', class: 'status-customs_rd', icon: 'fas fa-building-shield' },
        'pending_payment_customs': { text: 'Impuestos Pendientes', class: 'status-pending_payment_customs', icon: 'fas fa-file-invoice-dollar' },
        'paid_customs': { text: 'Impuestos Pagados', class: 'status-paid_customs', icon: 'fas fa-check-circle' },
        'ready_for_dispatch_cd': { text: 'Listo en CD', class: 'status-ready_for_dispatch_cd', icon: 'fas fa-dolly-flatbed' },
        'out_for_delivery_rd': { text: 'En Ruta de Entrega', class: 'status-out_for_delivery_rd', icon: 'fas fa-truck-fast' },
        'delivered_rd': { text: 'Entregado', class: 'status-delivered_rd', icon: 'fas fa-house-chimney-user' },
        'unknown_package_admin': {text: 'Paquete Desconocido', class: 'status-unknown_package_admin', icon: 'fas fa-question-circle' }
    };
    const planDetails = {
        premium: { name: 'Premium', iconClass: 'fas fa-crown', cssClass: 'plan-premium' },
        intermedio: { name: 'Intermedio', iconClass: 'fas fa-star', cssClass: 'plan-intermedio' },
        basico: { name: 'Básico', iconClass: 'fas fa-shield-alt', cssClass: 'plan-basico' },
        default: { name: 'No Especificado', iconClass: 'fas fa-question-circle', cssClass: 'plan-default'}
    };
    const getFromStorage = (key, defaultValue = []) => JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
    const saveToStorage = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(key + '_event_timestamp', Date.now());
    };
    function showFeedback(element, message, type = 'info') {
        if (!element) return;
        element.textContent = message;
        element.className = `form-feedback ${type}`;
        element.style.display = 'block';
        setTimeout(() => { element.style.display = 'none'; }, 4000);
    }
    function calculateTaxesDOP(declaredValueUSD) {
        if (isNaN(declaredValueUSD) || declaredValueUSD <= 0) return 0;
        let taxesDOP = 0;
        if (declaredValueUSD > IMPORT_THRESHOLD_USD) {
            const arancelUSD = declaredValueUSD * ARANCEL_GENERAL_RATE;
            const baseItbisUSD = declaredValueUSD + arancelUSD;
            const itbisUSD = baseItbisUSD * ITBIS_RATE;
            taxesDOP = (arancelUSD + itbisUSD) * TASA_CAMBIO_DOP;
        }
        return taxesDOP;
    }
    function initializeAccountPage() {
        loadClientDataFromStorage();
        loadUserInfo();
        renderClientPackages();
        loadAutopayStatus();
        loadClientNotifications(false);
        if (pickupDateInput) pickupDateInput.min = new Date().toISOString().split("T")[0];
        const logoutBtn = document.getElementById('logoutButton');
        if(logoutBtn) logoutBtn.style.display = 'none';
    }
    function loadClientDataFromStorage() {
        const allUsers = getFromStorage(USERS_STORAGE_KEY, []);
        const storedClientData = allUsers.find(u => u.expressBoxCode === PREDEFINED_CLIENT.expressBoxCode);
        if (storedClientData) {
            PREDEFINED_CLIENT.plan = storedClientData.plan || PREDEFINED_CLIENT.plan;
            PREDEFINED_CLIENT.autopayEnabled = typeof storedClientData.autopayEnabled === 'boolean' ? storedClientData.autopayEnabled : PREDEFINED_CLIENT.autopayEnabled;
            PREDEFINED_CLIENT.fullName = storedClientData.fullName || PREDEFINED_CLIENT.fullName;
        } else {
            const clientExists = allUsers.some(u => u.expressBoxCode === PREDEFINED_CLIENT.expressBoxCode);
            if (!clientExists) {
                allUsers.push({
                    expressBoxCode: PREDEFINED_CLIENT.expressBoxCode,
                    fullName: PREDEFINED_CLIENT.fullName,
                    email: PREDEFINED_CLIENT.email,
                    plan: PREDEFINED_CLIENT.plan,
                    autopayEnabled: PREDEFINED_CLIENT.autopayEnabled,
                    registeredAt: PREDEFINED_CLIENT.registeredAt
                });
                saveToStorage(USERS_STORAGE_KEY, allUsers);
            }
        }
    }
    function loadUserInfo() {
        if (headerUserName) headerUserName.textContent = PREDEFINED_CLIENT.fullName;
        if (headerUserEBCode) headerUserEBCode.textContent = PREDEFINED_CLIENT.expressBoxCode;
        if (welcomeName) welcomeName.textContent = PREDEFINED_CLIENT.fullName;
        const planKey = PREDEFINED_CLIENT.plan || 'default';
        const currentPlanDetails = planDetails[planKey] || planDetails.default;
        if (clientPlanNameEl) clientPlanNameEl.textContent = currentPlanDetails.name;
        if (clientPlanIconEl) {
            clientPlanIconEl.className = `${currentPlanDetails.iconClass} client-plan-icon-main`;
        }
        if (headerUserPlanDisplay) {
            headerUserPlanDisplay.innerHTML = `<i class="${currentPlanDetails.iconClass} plan-icon"></i> ${currentPlanDetails.name}`;
            headerUserPlanDisplay.className = `user-plan-display ${currentPlanDetails.cssClass}`;
        }
    }
    function renderClientPackages() {
        if (!clientPackageTableBody) return;
        const allPackages = getFromStorage(ADMIN_DIGITIZED_PACKAGES_KEY, []);
        const clientPackages = allPackages.filter(pkg => pkg.clientEBCode === PREDEFINED_CLIENT.expressBoxCode && !pkg.isUnknown);
        clientPackageTableBody.innerHTML = '';
        if (noPackagesMessage) noPackagesMessage.style.display = clientPackages.length === 0 ? 'block' : 'none';
        clientPackages.forEach(pkg => {
            const row = clientPackageTableBody.insertRow();
            const statusInfo = statusMap[pkg.status] || { text: (pkg.status || 'N/A').replace(/_/g, ' '), class: '', icon: 'fas fa-question' };
            const taxes = parseFloat(pkg.taxes || 0);
            row.innerHTML = `
                <td>${pkg.originalTracking || 'N/A'}</td>
                <td>${pkg.content ? (pkg.content.substring(0,40) + (pkg.content.length > 40 ? '...' : '')) : 'N/A'}</td>
                <td>$${parseFloat(pkg.declaredValue || 0).toFixed(2)}</td>
                <td>${parseFloat(pkg.pesoKg || 0).toFixed(2)} KG</td>
                <td><span class="status-customs ${statusInfo.class}"><i class="${statusInfo.icon}"></i> ${statusInfo.text}</span></td>
                <td>RD$ ${taxes.toFixed(2)}</td>
                <td class="table-actions">
                    ${pkg.status === 'pending_payment_customs' ?
                        `<button class="btn-icon-action action-btn-pay" data-package-id="${pkg.id}" title="Pagar Impuestos"><i class="fas fa-credit-card"></i> Pagar</button>` :
                        (pkg.status === 'ready_for_dispatch_cd' ? `<button class="btn-icon-action" data-package-id="${pkg.id}" title="Coordinar Entrega"><i class="fas fa-truck"></i> Coordinar</button>` : '')
                    }
                </td>
            `;
        });
        clientPackageTableBody.querySelectorAll('.action-btn-pay').forEach(button => {
            button.addEventListener('click', () => payPackageTaxes(button.dataset.packageId));
        });
        clientPackageTableBody.querySelectorAll('.btn-icon-action[title="Coordinar Entrega"]').forEach(button => {
            button.addEventListener('click', () => schedulePackageDelivery(button.dataset.packageId));
        });
    }
    function payPackageTaxes(packageId) {
        alert(`Simulación: Iniciando proceso de pago para paquete ID: ${packageId}.`);
        let allPackages = getFromStorage(ADMIN_DIGITIZED_PACKAGES_KEY, []);
        const pkgIndex = allPackages.findIndex(p => p.id === packageId);
        if (pkgIndex > -1) {
            allPackages[pkgIndex].status = 'paid_customs';
            saveToStorage(ADMIN_DIGITIZED_PACKAGES_KEY, allPackages);
            renderClientPackages();
            showFeedback(noPackagesMessage, 'Pago de impuestos simulado. El estado se actualizará.', 'success');
        }
    }
    function schedulePackageDelivery(packageId) {
        alert(`Simulación: Coordinando entrega para paquete ID: ${packageId}. Pronto nos comunicaremos.`);
    }
    if (preAlertForm) {
        preAlertForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const tracking = originalTrackingInput.value.trim();
            const store = storeSenderInput.value.trim();
            const value = parseFloat(estimatedValueInput.value);
            const description = packageDescriptionContentInput.value.trim();
            const arrivalDate = estimatedArrivalInput.value;
            const weight = parseFloat(estimatedWeightInput.value) || null;
            if (!tracking || !store || isNaN(value) || value <=0 || !description) {
                showFeedback(preAlertMessage, 'Campos marcados como requeridos y valor positivo son necesarios.', 'error');
                return;
            }
            const preAlerts = getFromStorage(ALL_PREALERTS_KEY, []);
            const newPreAlert = {
                id: 'pa_' + Date.now(),
                clientEBCode: PREDEFINED_CLIENT.expressBoxCode,
                clientName: PREDEFINED_CLIENT.fullName,
                originalTracking: tracking,
                storeSender: store,
                estimatedValue: value,
                packageDescriptionContent: description,
                estimatedArrival: arrivalDate || null,
                estimatedWeightKg: weight,
                timestamp: new Date().toISOString()
            };
            preAlerts.unshift(newPreAlert);
            saveToStorage(ALL_PREALERTS_KEY, preAlerts);
            showFeedback(preAlertMessage, 'Pre-alerta enviada exitosamente.', 'success');
            preAlertForm.reset();
        });
    }
    function loadAutopayStatus() {
        if (!autopayStatusSpan || !activateAutopayButton || !deactivateAutopayButton) return;
        const autopayEnabled = PREDEFINED_CLIENT.autopayEnabled;
        if (autopayEnabled) {
            autopayStatusSpan.textContent = 'Activo';
            autopayStatusSpan.className = 'status-indicator status-active';
            activateAutopayButton.style.display = 'none';
            deactivateAutopayButton.style.display = 'inline-block';
        } else {
            autopayStatusSpan.textContent = 'Inactivo';
            autopayStatusSpan.className = 'status-indicator status-inactive';
            activateAutopayButton.style.display = 'inline-block';
            deactivateAutopayButton.style.display = 'none';
        }
    }
    function toggleAutopay(activate) {
        PREDEFINED_CLIENT.autopayEnabled = activate;
        loadAutopayStatus();
        showFeedback(autopayMessage, `Autopago ${activate ? 'activado' : 'desactivado'}.`, 'success');
        let allUsers = getFromStorage(USERS_STORAGE_KEY, []);
        const userIndex = allUsers.findIndex(u => u.expressBoxCode === PREDEFINED_CLIENT.expressBoxCode);
        if (userIndex > -1) {
            allUsers[userIndex].autopayEnabled = activate;
            saveToStorage(USERS_STORAGE_KEY, allUsers);
        } else {
            allUsers.push({
                expressBoxCode: PREDEFINED_CLIENT.expressBoxCode,
                fullName: PREDEFINED_CLIENT.fullName,
                email: PREDEFINED_CLIENT.email,
                plan: PREDEFINED_CLIENT.plan,
                autopayEnabled: PREDEFINED_CLIENT.autopayEnabled,
                registeredAt: PREDEFINED_CLIENT.registeredAt
            });
            saveToStorage(USERS_STORAGE_KEY, allUsers);
        }
    }
    if (activateAutopayButton) activateAutopayButton.addEventListener('click', () => toggleAutopay(true));
    if (deactivateAutopayButton) deactivateAutopayButton.addEventListener('click', () => toggleAutopay(false));
    if (notifyPickupForm) {
        notifyPickupForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const codes = pickupTrackingCodesInput.value.trim();
            const date = pickupDateInput.value;
            if (!codes || !date) {
                showFeedback(pickupMessage, 'Ambos campos son requeridos.', 'error');
                return;
            }
            if (new Date(date) < new Date(new Date().toISOString().split('T')[0])) {
                showFeedback(pickupMessage, 'La fecha de retiro no puede ser anterior a hoy.', 'error');
                return;
            }
            const pickupNotifications = getFromStorage(PICKUP_NOTIFICATIONS_KEY, []);
            const newPickupNotification = {
                id: 'pickup_' + Date.now(),
                clientEBCode: PREDEFINED_CLIENT.expressBoxCode,
                clientName: PREDEFINED_CLIENT.fullName,
                pickupCodes: codes,
                pickupDate: date,
                timestamp: new Date().toISOString()
            };
            pickupNotifications.unshift(newPickupNotification);
            saveToStorage(PICKUP_NOTIFICATIONS_KEY, pickupNotifications);
            showFeedback(pickupMessage, 'Notificación de retiro enviada. Te contactaremos.', 'success');
            notifyPickupForm.reset();
        });
    }
    function loadClientNotifications(markNewAsRead = false) {
        if (!notificationsList) return;
        let notifications = getFromStorage(CLIENT_NOTIFICATIONS_KEY, []);
        notificationsList.innerHTML = '';
        let newNotificationsWereMarked = false;
        if (notifications.length === 0) {
            notificationsList.innerHTML = '<li class="no-notifications">No tienes notificaciones.</li>';
            if (markAllReadButton) markAllReadButton.style.display = 'none';
            allUsers[userIndex].autopayEnabled = activate;
            saveToStorage(USERS_STORAGE_KEY, allUsers); // This will notify admin if they are listening
        } else { // If client not in admin's list, add them
            allUsers.push({
                expressBoxCode: PREDEFINED_CLIENT.expressBoxCode,
                fullName: PREDEFINED_CLIENT.fullName,
                email: PREDEFINED_CLIENT.email,
                plan: PREDEFINED_CLIENT.plan,
                autopayEnabled: PREDEFINED_CLIENT.autopayEnabled,
                registeredAt: PREDEFINED_CLIENT.registeredAt
            });
            saveToStorage(USERS_STORAGE_KEY, allUsers);
        }
    }
    if (activateAutopayButton) activateAutopayButton.addEventListener('click', () => toggleAutopay(true));
    if (deactivateAutopayButton) deactivateAutopayButton.addEventListener('click', () => toggleAutopay(false));


    // --- Notify Pickup ---
    if (notifyPickupForm) {
        notifyPickupForm.addEventListener('submit', (event) => {
            event.preventDefault();
            // ... (validation code same as before)
            const codes = pickupTrackingCodesInput.value.trim();
            const date = pickupDateInput.value;

            if (!codes || !date) {
                showFeedback(pickupMessage, 'Ambos campos son requeridos.', 'error'); return;
            }
            if (new Date(date) < new Date(new Date().toISOString().split('T')[0])) {
                showFeedback(pickupMessage, 'La fecha de retiro no puede ser anterior a hoy.', 'error'); return;
            }

            const pickupNotifications = getFromStorage(PICKUP_NOTIFICATIONS_KEY, []);
            const newPickupNotification = {
                id: 'pickup_' + Date.now(),
                clientEBCode: PREDEFINED_CLIENT.expressBoxCode, // Use predefined client
                clientName: PREDEFINED_CLIENT.fullName,       // Use predefined client
                pickupCodes: codes,
                pickupDate: date,
                timestamp: new Date().toISOString()
            };
            pickupNotifications.unshift(newPickupNotification);
            saveToStorage(PICKUP_NOTIFICATIONS_KEY, pickupNotifications); // This will notify admin
            showFeedback(pickupMessage, 'Notificación de retiro enviada. Te contactaremos.', 'success');
            notifyPickupForm.reset();
        });
    }

    // --- Notifications (Bell Icon) ---
    function loadClientNotifications(markNewAsRead = false) {
        if (!notificationsList) return;
        let notifications = getFromStorage(CLIENT_NOTIFICATIONS_KEY, []); // Uses predefined client's key
        // ... (rest of notification loading logic is the same as before)
        notificationsList.innerHTML = '';
        let newNotificationsWereMarked = false;

        if (notifications.length === 0) {
            notificationsList.innerHTML = '<li class="no-notifications">No tienes notificaciones.</li>';
            if (markAllReadButton) markAllReadButton.style.display = 'none';
        } else {
            notifications.forEach(notif => {
                const li = document.createElement('li');
                li.className = notif.read ? 'read' : 'unread';
                if (markNewAsRead && !notif.read) {
                    notif.read = true;
                    newNotificationsWereMarked = true;
                }

                const date = new Date(notif.timestamp);
                const timeString = date.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
                const dateString = date.toLocaleDateString('es-DO', {day: 'numeric', month:'short'});

                li.innerHTML = `
                    <i class="${notif.icon || 'fas fa-info-circle'} notif-icon"></i>
                    <div class="notif-text">
                        ${notif.message}
                        <span class="notif-time">${dateString} - ${timeString}</span>
                    </div>
                `;
                notificationsList.appendChild(li);
            });
            const hasUnread = notifications.some(n => !n.read);
             if (markAllReadButton) markAllReadButton.style.display = hasUnread ? 'block' : 'none';
        }

        if (newNotificationsWereMarked) {
            saveToStorage(CLIENT_NOTIFICATIONS_KEY, notifications);
        }
        updateNotificationBadge();
    }

    function markAllClientNotificationsAsRead() { /* ... same as before, uses CLIENT_NOTIFICATIONS_KEY ... */
        let notifications = getFromStorage(CLIENT_NOTIFICATIONS_KEY, []);
        let changed = false;
        notifications.forEach(n => {
            if (!n.read) {
                n.read = true;
                changed = true;
            }
        });
        if (changed) {
            saveToStorage(CLIENT_NOTIFICATIONS_KEY, notifications);
            loadClientNotifications(false);
            if (markAllReadButton) markAllReadButton.style.display = 'none';
        }
    }

    function updateNotificationBadge() { /* ... same as before, uses CLIENT_NOTIFICATIONS_KEY ... */
        if (!notificationBadge) return;
        const notifications = getFromStorage(CLIENT_NOTIFICATIONS_KEY, []);
        const unreadCount = notifications.filter(n => !n.read).length;

        notificationBadge.textContent = unreadCount;
        notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
        notificationBadge.classList.toggle('visible', unreadCount > 0);
    }

    if (notificationsButton) { /* ... same as before ... */
        notificationsButton.addEventListener('click', () => {
            const isVisible = notificationsSection.style.display === 'block';
            notificationsSection.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) { loadClientNotifications(true); }
        });
    }
    if (closeNotifications) closeNotifications.addEventListener('click', () => notificationsSection.style.display = 'none');
    if (markAllReadButton) markAllReadButton.addEventListener('click', markAllClientNotificationsAsRead);


    // --- Storage Event Listener ---
    window.addEventListener('storage', (event) => {
        // Listen for changes to this client's specific notification key
        if (event.key === (CLIENT_NOTIFICATIONS_KEY + '_event_timestamp')) {
            loadClientNotifications(notificationsSection.style.display === 'block');
        }
        // Listen for changes to general packages (admin might add one for this client)
        if (event.key === (ADMIN_DIGITIZED_PACKAGES_KEY + '_event_timestamp')) {
            renderClientPackages();
        }
        // Listen for changes to USERS_STORAGE_KEY (admin might change this client's plan/autopay)
        if (event.key === (USERS_STORAGE_KEY + '_event_timestamp')) {
            loadClientDataFromStorage(); // Reload PREDEFINED_CLIENT's data
            loadUserInfo();           // Update display of plan
            loadAutopayStatus();      // Update display of autopay
        }
    });

    // --- Initial call ---
    initializeAccountPage();
});

// --- cliente.js (With Support Ticket Submission) ---
document.addEventListener('DOMContentLoaded', () => {
    // --- PREDEFINED CLIENT FOR cuenta.html ---
    const PREDEFINED_CLIENT = {
        fullName: "Cliente Principal",
        expressBoxCode: "EB-CLIENT001",
        email: "cliente@example.com",
        plan: "premium",
        autopayEnabled: false,
        branch: "Sucursal Central",
        address: { street: "Calle Falsa 123", city: " столица ", province: "Distrito Nacional", reference: "Cerca del parque" },
        registeredAt: new Date().toISOString()
    };

    // --- DOM Elements ---
    // ... (All other DOM element declarations from the previous full cliente.js)
    const headerUserName = document.getElementById('headerUserName');
    const headerUserEBCode = document.getElementById('headerUserEBCode');
    const headerUserPlanDisplay = document.getElementById('headerUserPlan');
    const headerUserBranchDisplay = document.getElementById('headerUserBranch');
    const welcomeName = document.getElementById('welcomeName');
    const myPlanSection = document.getElementById('myPlanSection');
    const clientPlanNameEl = document.getElementById('clientPlanName');
    const clientPlanIconEl = document.getElementById('clientPlanIcon');
    const clientBranchNameEl = document.getElementById('clientBranchName');
    const notificationsButton = document.getElementById('notificationsButton');
    const notificationsSection = document.getElementById('notificationsSection');
    const notificationsList = document.getElementById('notificationsList');
    const closeNotifications = document.getElementById('closeNotifications');
    const markAllReadButton = document.getElementById('markAllReadButton');
    const notificationBadge = document.getElementById('notificationBadge');
    const clientPackageTableBody = document.getElementById('clientPackageTableBody');
    const noPackagesMessage = document.getElementById('noPackagesMessage');
    const preAlertForm = document.getElementById('preAlertForm');
    const originalTrackingInput = document.getElementById('originalTracking');
    const storeSenderInput = document.getElementById('storeSender');
    const estimatedValueInput = document.getElementById('estimatedValue');
    const packageDescriptionContentInput = document.getElementById('packageDescriptionContent');
    const estimatedArrivalInput = document.getElementById('estimatedArrival');
    const estimatedWeightInput = document.getElementById('estimatedWeight');
    const preAlertMessage = document.getElementById('preAlertMessage');
    const currentAddressDisplay = {
        street: document.getElementById('clientAddressStreet'),
        city: document.getElementById('clientAddressCity'),
        province: document.getElementById('clientAddressProvince'),
        reference: document.getElementById('clientAddressReference')
    };
    const editAddressButton = document.getElementById('editAddressButton');
    const addressForm = document.getElementById('addressForm');
    const addressStreetInput = document.getElementById('addressStreet');
    const addressCityInput = document.getElementById('addressCity');
    const addressProvinceInput = document.getElementById('addressProvince');
    const addressReferenceInput = document.getElementById('addressReference');
    const cancelAddressEditButton = document.getElementById('cancelAddressEditButton');
    const addressMessage = document.getElementById('addressMessage');
    const activateAutopayButton = document.getElementById('activateAutopayButton');
    const deactivateAutopayButton = document.getElementById('deactivateAutopayButton');
    const autopayStatusSpan = document.getElementById('autopayStatus');
    const autopayMessage = document.getElementById('autopayMessage');
    const notifyPickupForm = document.getElementById('notifyPickupForm');
    const pickupTrackingCodesInput = document.getElementById('pickupTrackingCodes');
    const pickupDateInput = document.getElementById('pickupDate');
    const pickupMessage = document.getElementById('pickupMessage');
    const planBenefitsModal = document.getElementById('planBenefitsModal');
    const closePlanBenefitsModal = document.getElementById('closePlanBenefitsModal');
    const modalPlanName = document.getElementById('modalPlanName');
    const modalPlanBenefitsList = document.getElementById('modalPlanBenefitsList');

    // Support Ticket Section (NEW DOM elements if not already declared)
    const supportTicketForm = document.getElementById('supportTicketForm');
    const ticketSubjectInput = document.getElementById('ticketSubject');
    const ticketMessageInput = document.getElementById('ticketMessage');
    const supportTicketMessage = document.getElementById('supportTicketMessage');


    // --- LocalStorage Keys ---
    const USERS_STORAGE_KEY = 'expressboxrd_users';
    const ADMIN_DIGITIZED_PACKAGES_KEY = 'expressboxrd_admin_packages_v3';
    const ALL_PREALERTS_KEY = 'expressboxrd_all_prealerts';
    const CLIENT_NOTIFICATIONS_KEY = 'expressboxrd_notifications_user_' + PREDEFINED_CLIENT.expressBoxCode;
    const PICKUP_NOTIFICATIONS_KEY = 'expressboxrd_pickup_notifications';
    const SUPPORT_TICKETS_KEY = 'expressboxrd_support_tickets'; // Key for tickets

    // --- Constants & Mappings ---
    // ... (TASA_CAMBIO_DOP, IMPORT_THRESHOLD_USD, statusMap, planDetails - same as before)
     const planDetails = {
        premium: { 
            name: 'Premium', iconClass: 'fas fa-crown', cssClass: 'plan-premium',
            benefits: ["15% desc. envíos.", "Almacenamiento 30 días gratis.", "Seguro hasta $500 USD.", "Soporte prioritario."]
        },
        intermedio: { 
            name: 'Intermedio', iconClass: 'fas fa-star', cssClass: 'plan-intermedio',
            benefits: ["7% desc. envíos.", "Almacenamiento 15 días gratis.", "Seguro hasta $200 USD."]
        },
        basico: { 
            name: 'Básico', iconClass: 'fas fa-shield-alt', cssClass: 'plan-basico',
            benefits: ["Tarifas estándar.", "Almacenamiento 7 días gratis.", "Seguro hasta $100 USD."]
        },
        default: { 
            name: 'No Especificado', iconClass: 'fas fa-question-circle', cssClass: 'plan-default',
            benefits: ["Contacte a soporte para seleccionar un plan."]
        }
    };
      const statusMap = { /* ... same as before ... */
        'received_warehouse_origin': { text: 'Recibido Origen', class: 'status-received_warehouse_origin', icon: 'fas fa-warehouse' },
        'in_transit_to_rd': { text: 'En Tránsito a RD', class: 'status-in_transit_to_rd', icon: 'fas fa-plane-departure' },
        'customs_rd': { text: 'En Aduanas RD', class: 'status-customs_rd', icon: 'fas fa-building-shield' },
        'pending_payment_customs': { text: 'Impuestos Pendientes', class: 'status-pending_payment_customs', icon: 'fas fa-file-invoice-dollar' },
        'paid_customs': { text: 'Impuestos Pagados', class: 'status-paid_customs', icon: 'fas fa-check-circle' },
        'ready_for_dispatch_cd': { text: 'Listo en CD', class: 'status-ready_for_dispatch_cd', icon: 'fas fa-dolly-flatbed' },
        'out_for_delivery_rd': { text: 'En Ruta de Entrega', class: 'status-out_for_delivery_rd', icon: 'fas fa-truck-fast' },
        'delivered_rd': { text: 'Entregado', class: 'status-delivered_rd', icon: 'fas fa-house-chimney-user' },
        'unknown_package_admin': {text: 'Paquete Desconocido', class: 'status-unknown_package_admin', icon: 'fas fa-question-circle' }
    };


    // --- Helper Functions ---
    const getFromStorage = (key, defaultValue = []) => JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
    const saveToStorage = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(key + '_event_timestamp', Date.now()); // Crucial for cross-tab updates
    };
    function showFeedback(element, message, type = 'info') {
        if (!element) return;
        element.textContent = message;
        element.className = `form-feedback ${type}`;
        element.style.display = 'block';
        setTimeout(() => { element.style.display = 'none'; }, 4000);
    }
    // ... (calculateTaxesDOP - same as before)

    // --- Initialization (initializeAccountPage, loadClientDataFromStorage - same as before) ---
    // ...
    function initializeAccountPage() {
        loadClientDataFromStorage();
        loadUserInfo();
        renderClientPackages();
        loadAutopayStatus();
        loadClientNotifications(false);
        loadClientAddress();
        if (pickupDateInput) pickupDateInput.min = new Date().toISOString().split("T")[0];
        const logoutBtn = document.getElementById('logoutButton');
        if(logoutBtn) logoutBtn.style.display = 'none';
    }
    
    function loadClientDataFromStorage() {
        const allUsers = getFromStorage(USERS_STORAGE_KEY, []);
        const storedClientData = allUsers.find(u => u.expressBoxCode === PREDEFINED_CLIENT.expressBoxCode);
        if (storedClientData) {
            PREDEFINED_CLIENT.plan = storedClientData.plan || PREDEFINED_CLIENT.plan;
            PREDEFINED_CLIENT.autopayEnabled = typeof storedClientData.autopayEnabled === 'boolean' ? storedClientData.autopayEnabled : PREDEFINED_CLIENT.autopayEnabled;
            PREDEFINED_CLIENT.fullName = storedClientData.fullName || PREDEFINED_CLIENT.fullName;
            PREDEFINED_CLIENT.branch = storedClientData.branch || PREDEFINED_CLIENT.branch;
            PREDEFINED_CLIENT.address = storedClientData.address || PREDEFINED_CLIENT.address;
        } else {
            const clientExists = allUsers.some(u => u.expressBoxCode === PREDEFINED_CLIENT.expressBoxCode);
            if (!clientExists) {
                allUsers.push({
                    expressBoxCode: PREDEFINED_CLIENT.expressBoxCode,
                    fullName: PREDEFINED_CLIENT.fullName,
                    email: PREDEFINED_CLIENT.email,
                    plan: PREDEFINED_CLIENT.plan,
                    autopayEnabled: PREDEFINED_CLIENT.autopayEnabled,
                    branch: PREDEFINED_CLIENT.branch,
                    address: PREDEFINED_CLIENT.address,
                    registeredAt: PREDEFINED_CLIENT.registeredAt
                });
                saveToStorage(USERS_STORAGE_KEY, allUsers);
            }
        }
    }

    // --- User Info, Plan, Branch, Address Management (loadUserInfo, loadClientAddress, addressForm submit, etc. - same as before) ---
    // ...
    function loadUserInfo() { /* ... same ... */
        if (headerUserName) headerUserName.textContent = PREDEFINED_CLIENT.fullName;
        if (headerUserEBCode) headerUserEBCode.textContent = PREDEFINED_CLIENT.expressBoxCode;
        if (welcomeName) welcomeName.textContent = PREDEFINED_CLIENT.fullName.split(' ')[0];

        const planKey = PREDEFINED_CLIENT.plan || 'default';
        const currentPlan = planDetails[planKey] || planDetails.default;

        if (clientPlanNameEl) clientPlanNameEl.textContent = currentPlan.name;
        if (clientPlanIconEl) clientPlanIconEl.className = `${currentPlan.iconClass} client-plan-icon-main`;
        if (headerUserPlanDisplay) {
            headerUserPlanDisplay.innerHTML = `<i class="${currentPlan.iconClass} plan-icon"></i> ${currentPlan.name}`;
            headerUserPlanDisplay.className = `user-plan-display ${currentPlan.cssClass}`;
        }
        const branchName = PREDEFINED_CLIENT.branch || "No asignada";
        if (clientBranchNameEl && document.getElementById('clientBranchInfo')) { // Check if element exists
            document.getElementById('clientBranchName').textContent = branchName;
        }
        if (headerUserBranchDisplay) {
             headerUserBranchDisplay.innerHTML = `<i class="fas fa-store-alt"></i> Sucursal: ${branchName}`;
        }
    }
    if (myPlanSection && planBenefitsModal && closePlanBenefitsModal && modalPlanName && modalPlanBenefitsList) { /* ... same ... */
        myPlanSection.addEventListener('click', () => {
            const planKey = PREDEFINED_CLIENT.plan || 'default';
            const currentPlan = planDetails[planKey] || planDetails.default;
            modalPlanName.textContent = `Beneficios del Plan ${currentPlan.name}`;
            modalPlanBenefitsList.innerHTML = '';
            currentPlan.benefits.forEach(benefit => {
                const li = document.createElement('li');
                li.textContent = benefit;
                modalPlanBenefitsList.appendChild(li);
            });
            planBenefitsModal.classList.add('visible');
        });
        closePlanBenefitsModal.addEventListener('click', () => planBenefitsModal.classList.remove('visible'));
        planBenefitsModal.addEventListener('click', (event) => {
            if (event.target === planBenefitsModal) planBenefitsModal.classList.remove('visible');
        });
    }
    function loadClientAddress() { /* ... same ... */
        const addr = PREDEFINED_CLIENT.address || {};
        if(currentAddressDisplay.street) currentAddressDisplay.street.textContent = addr.street || "No especificada";
        if(currentAddressDisplay.city) currentAddressDisplay.city.textContent = addr.city || "N/A";
        if(currentAddressDisplay.province) currentAddressDisplay.province.textContent = addr.province || "N/A";
        if(currentAddressDisplay.reference) currentAddressDisplay.reference.textContent = addr.reference || "N/A";
        if(addressStreetInput) addressStreetInput.value = addr.street || "";
        if(addressCityInput) addressCityInput.value = addr.city || "";
        if(addressProvinceInput) addressProvinceInput.value = addr.province || "";
        if(addressReferenceInput) addressReferenceInput.value = addr.reference || "";
    }
    if (editAddressButton && addressForm) { /* ... same ... */
        editAddressButton.addEventListener('click', () => {
            addressForm.style.display = 'block';
            editAddressButton.style.display = 'none';
            loadClientAddress();
        });
    }
    if (cancelAddressEditButton && addressForm && editAddressButton) { /* ... same ... */
        cancelAddressEditButton.addEventListener('click', () => {
            addressForm.style.display = 'none';
            editAddressButton.style.display = 'inline-flex';
            if (addressMessage) addressMessage.style.display = 'none';
        });
    }
    if (addressForm) { /* ... same ... */
        addressForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const newAddress = {
                street: addressStreetInput.value.trim(),
                city: addressCityInput.value.trim(),
                province: addressProvinceInput.value.trim(),
                reference: addressReferenceInput.value.trim()
            };
            if (!newAddress.street || !newAddress.city || !newAddress.province) {
                showFeedback(addressMessage, "Calle, ciudad y sector/provincia son requeridos.", "error");
                return;
            }
            PREDEFINED_CLIENT.address = newAddress;
            let allUsers = getFromStorage(USERS_STORAGE_KEY, []);
            const userIndex = allUsers.findIndex(u => u.expressBoxCode === PREDEFINED_CLIENT.expressBoxCode);
            if (userIndex > -1) {
                allUsers[userIndex].address = newAddress;
                saveToStorage(USERS_STORAGE_KEY, allUsers);
            }
            loadClientAddress();
            addressForm.style.display = 'none';
            if(editAddressButton) editAddressButton.style.display = 'inline-flex';
            showFeedback(addressMessage, "Dirección actualizada correctamente.", "success");
        });
    }


    // --- Client Packages, Pre-Alert, Autopay, Notify Pickup (All same as before) ---
    // ... (renderClientPackages, payPackageTaxes, schedulePackageDelivery)
    // ... (preAlertForm submit logic)
    // ... (loadAutopayStatus, toggleAutopay logic)
    // ... (notifyPickupForm submit logic)
     function renderClientPackages() { /* ... same ... */
        if (!clientPackageTableBody) return;
        const allPackages = getFromStorage(ADMIN_DIGITIZED_PACKAGES_KEY, []);
        const clientPackages = allPackages.filter(pkg => pkg.clientEBCode === PREDEFINED_CLIENT.expressBoxCode && !pkg.isUnknown);
        clientPackageTableBody.innerHTML = '';
        if (noPackagesMessage) noPackagesMessage.style.display = clientPackages.length === 0 ? 'block' : 'none';
        clientPackages.forEach(pkg => { /* ... row creation ... */
             const row = clientPackageTableBody.insertRow();
            const statusInfo = statusMap[pkg.status] || { text: (pkg.status || 'N/A').replace(/_/g, ' '), class: '', icon: 'fas fa-question' };
            const taxes = parseFloat(pkg.taxes || 0);
            row.innerHTML = `
                <td>${pkg.originalTracking || 'N/A'}</td>
                <td>${pkg.content ? (pkg.content.substring(0,40) + (pkg.content.length > 40 ? '...' : '')) : 'N/A'}</td>
                <td>$${parseFloat(pkg.declaredValue || 0).toFixed(2)}</td>
                <td>${parseFloat(pkg.pesoKg || 0).toFixed(2)} KG</td>
                <td><span class="status-customs ${statusInfo.class}"><i class="${statusInfo.icon}"></i> ${statusInfo.text}</span></td>
                <td>RD$ ${taxes.toFixed(2)}</td>
                <td class="table-actions">
                    ${pkg.status === 'pending_payment_customs' ?
                        `<button class="btn-icon-action action-btn-pay" data-package-id="${pkg.id}" title="Pagar Impuestos"><i class="fas fa-credit-card"></i> Pagar</button>` :
                        (pkg.status === 'ready_for_dispatch_cd' ? `<button class="btn-icon-action" data-package-id="${pkg.id}" title="Coordinar Entrega"><i class="fas fa-truck"></i> Coordinar</button>` : '')
                    }
                </td>`;
        });
        clientPackageTableBody.querySelectorAll('.action-btn-pay').forEach(button => button.addEventListener('click', () => payPackageTaxes(button.dataset.packageId)));
        clientPackageTableBody.querySelectorAll('.btn-icon-action[title="Coordinar Entrega"]').forEach(button => button.addEventListener('click', () => schedulePackageDelivery(button.dataset.packageId)));
    }
    function payPackageTaxes(packageId){ /* ... same ... */ 
        alert(`Simulación: Iniciando proceso de pago para paquete ID: ${packageId}.`);
        let allPackages = getFromStorage(ADMIN_DIGITIZED_PACKAGES_KEY, []);
        const pkgIndex = allPackages.findIndex(p => p.id === packageId);
        if (pkgIndex > -1) {
            allPackages[pkgIndex].status = 'paid_customs';
            saveToStorage(ADMIN_DIGITIZED_PACKAGES_KEY, allPackages);
            renderClientPackages();
            showFeedback(noPackagesMessage, 'Pago de impuestos simulado.', 'success');
        }
    }
    function schedulePackageDelivery(packageId){ alert(`Simulación: Coordinando entrega para paquete ID: ${packageId}.`); }

    if (preAlertForm) { /* ... same ... */
        preAlertForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const tracking = originalTrackingInput.value.trim();
            const store = storeSenderInput.value.trim();
            const value = parseFloat(estimatedValueInput.value);
            const description = packageDescriptionContentInput.value.trim();
            const arrivalDate = estimatedArrivalInput.value;
            const weight = parseFloat(estimatedWeightInput.value) || null;
            if (!tracking || !store || isNaN(value) || value <=0 || !description) {
                showFeedback(preAlertMessage, 'Campos requeridos y valor positivo son necesarios.', 'error'); return;
            }
            const preAlerts = getFromStorage(ALL_PREALERTS_KEY, []);
            preAlerts.unshift({
                id: 'pa_' + Date.now(), clientEBCode: PREDEFINED_CLIENT.expressBoxCode, clientName: PREDEFINED_CLIENT.fullName,
                originalTracking: tracking, storeSender: store, estimatedValue: value, packageDescriptionContent: description,
                estimatedArrival: arrivalDate || null, estimatedWeightKg: weight, timestamp: new Date().toISOString()
            });
            saveToStorage(ALL_PREALERTS_KEY, preAlerts);
            showFeedback(preAlertMessage, 'Pre-alerta enviada.', 'success');
            preAlertForm.reset();
        });
    }
    function loadAutopayStatus() { /* ... same ... */
        if (!autopayStatusSpan || !activateAutopayButton || !deactivateAutopayButton) return;
        const autopayEnabled = PREDEFINED_CLIENT.autopayEnabled;
        autopayStatusSpan.textContent = autopayEnabled ? 'Activo' : 'Inactivo';
        autopayStatusSpan.className = `status-indicator status-${autopayEnabled ? 'active' : 'inactive'}`;
        activateAutopayButton.style.display = autopayEnabled ? 'none' : 'inline-block';
        deactivateAutopayButton.style.display = autopayEnabled ? 'inline-block' : 'none';
    }
    function toggleAutopay(activate) { /* ... same ... */
        PREDEFINED_CLIENT.autopayEnabled = activate;
        loadAutopayStatus();
        showFeedback(autopayMessage, `Autopago ${activate ? 'activado' : 'desactivado'}.`, 'success');
        let allUsers = getFromStorage(USERS_STORAGE_KEY, []);
        const userIndex = allUsers.findIndex(u => u.expressBoxCode === PREDEFINED_CLIENT.expressBoxCode);
        if (userIndex > -1) {
            allUsers[userIndex].autopayEnabled = activate;
            saveToStorage(USERS_STORAGE_KEY, allUsers);
        }
    }
    if (activateAutopayButton) activateAutopayButton.addEventListener('click', () => toggleAutopay(true));
    if (deactivateAutopayButton) deactivateAutopayButton.addEventListener('click', () => toggleAutopay(false));

    if (notifyPickupForm) { /* ... same ... */
        notifyPickupForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const codes = pickupTrackingCodesInput.value.trim();
            const date = pickupDateInput.value;
            if (!codes || !date) {
                showFeedback(pickupMessage, 'Ambos campos son requeridos.', 'error'); return;
            }
            if (new Date(date) < new Date(new Date().toISOString().split('T')[0])) {
                showFeedback(pickupMessage, 'Fecha no puede ser anterior a hoy.', 'error'); return;
            }
            const pickupNotifications = getFromStorage(PICKUP_NOTIFICATIONS_KEY, []);
            pickupNotifications.unshift({
                id: 'pickup_' + Date.now(), clientEBCode: PREDEFINED_CLIENT.expressBoxCode, clientName: PREDEFINED_CLIENT.fullName,
                pickupCodes: codes, pickupDate: date, timestamp: new Date().toISOString()
            });
            saveToStorage(PICKUP_NOTIFICATIONS_KEY, pickupNotifications);
            showFeedback(pickupMessage, 'Notificación de retiro enviada.', 'success');
            notifyPickupForm.reset();
        });
    }


    // --- Support Tickets (NEW Submission Logic) ---
    if (supportTicketForm && ticketSubjectInput && ticketMessageInput && supportTicketMessage) {
        supportTicketForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const subject = ticketSubjectInput.value.trim();
            const message = ticketMessageInput.value.trim();

            if (!subject || !message) {
                showFeedback(supportTicketMessage, "Asunto y mensaje son requeridos.", "error");
                return;
            }

            let tickets = getFromStorage(SUPPORT_TICKETS_KEY, []);
            const newTicket = {
                id: 'ticket_' + Date.now() + PREDEFINED_CLIENT.expressBoxCode.slice(-3), // Make ID a bit more unique
                clientEBCode: PREDEFINED_CLIENT.expressBoxCode,
                clientName: PREDEFINED_CLIENT.fullName,
                subject: subject,
                message: message,
                timestamp: new Date().toISOString(),
                status: 'abierto' // initial status
            };
            tickets.unshift(newTicket);
            saveToStorage(SUPPORT_TICKETS_KEY, tickets); // This will notify admin via storage event
            showFeedback(supportTicketMessage, "Ticket de soporte enviado. Nos pondremos en contacto pronto.", "success");
            supportTicketForm.reset();
        });
    }

    // --- Notifications (Bell Icon - loadClientNotifications, markAll, updateBadge - same as before) ---
    // ...
    function loadClientNotifications(markNewAsRead = false) { /* ... same ... */
        if (!notificationsList) return;
        let notifications = getFromStorage(CLIENT_NOTIFICATIONS_KEY, []);
        notificationsList.innerHTML = '';
        let newNotificationsWereMarked = false;
        if (notifications.length === 0) {
            notificationsList.innerHTML = '<li class="no-notifications">No tienes notificaciones.</li>';
            if (markAllReadButton) markAllReadButton.style.display = 'none';
        } else {
            notifications.forEach(notif => {
                const li = document.createElement('li');
                li.className = notif.read ? 'read' : 'unread';
                if (markNewAsRead && !notif.read) { notif.read = true; newNotificationsWereMarked = true; }
                const date = new Date(notif.timestamp);
                const timeString = date.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
                const dateString = date.toLocaleDateString('es-DO', {day: 'numeric', month:'short'});
                li.innerHTML = `<i class="${notif.icon || 'fas fa-info-circle'} notif-icon"></i><div class="notif-text">${notif.message}<span class="notif-time">${dateString} - ${timeString}</span></div>`;
                notificationsList.appendChild(li);
            });
            const hasUnread = notifications.some(n => !n.read);
             if (markAllReadButton) markAllReadButton.style.display = hasUnread ? 'block' : 'none';
        }
        if (newNotificationsWereMarked) saveToStorage(CLIENT_NOTIFICATIONS_KEY, notifications);
        updateNotificationBadge();
    }
    function markAllClientNotificationsAsRead() { /* ... same ... */
        let notifications = getFromStorage(CLIENT_NOTIFICATIONS_KEY, []);
        let changed = false;
        notifications.forEach(n => { if (!n.read) { n.read = true; changed = true; } });
        if (changed) {
            saveToStorage(CLIENT_NOTIFICATIONS_KEY, notifications);
            loadClientNotifications(false);
            if (markAllReadButton) markAllReadButton.style.display = 'none';
        }
    }
    function updateNotificationBadge() { /* ... same ... */
        if (!notificationBadge) return;
        const notifications = getFromStorage(CLIENT_NOTIFICATIONS_KEY, []);
        const unreadCount = notifications.filter(n => !n.read).length;
        notificationBadge.textContent = unreadCount;
        notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
        notificationBadge.classList.toggle('visible', unreadCount > 0);
    }
    if (notificationsButton) { /* ... same ... */
        notificationsButton.addEventListener('click', () => {
            const isVisible = notificationsSection.style.display === 'block';
            notificationsSection.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) loadClientNotifications(true);
        });
    }
    if (closeNotifications) closeNotifications.addEventListener('click', () => notificationsSection.style.display = 'none');
    if (markAllReadButton) markAllReadButton.addEventListener('click', markAllClientNotificationsAsRead);


    // --- Storage Event Listener (Updated for USERS_STORAGE_KEY for plan/branch/address) ---
    window.addEventListener('storage', (event) => {
        if (event.key === (CLIENT_NOTIFICATIONS_KEY + '_event_timestamp')) {
            loadClientNotifications(notificationsSection.style.display === 'block');
        }
        if (event.key === (ADMIN_DIGITIZED_PACKAGES_KEY + '_event_timestamp')) {
            if(typeof renderClientPackages === 'function') renderClientPackages();
        }
        if (event.key === (USERS_STORAGE_KEY + '_event_timestamp')) {
            loadClientDataFromStorage();
            loadUserInfo();
            loadAutopayStatus();
            loadClientAddress();
        }
        // No need to listen for SUPPORT_TICKETS_KEY changes on client-side, only admin needs to see updates.
    });

    // --- Initial call ---
    initializeAccountPage();
});

// --- cliente.js ---
document.addEventListener('DOMContentLoaded', () => {
    const PREDEFINED_CLIENT = {
        fullName: "Cliente Principal",
        expressBoxCode: "EB-CLIENT001",
        // ... other properties
        branch: "Sucursal Central", // Default initial branch
        address: { /* ... */ }
    };
    const USERS_STORAGE_KEY = 'expressboxrd_users';

    // DOM Elements
    const headerUserBranchDisplay = document.getElementById('headerUserBranch');
    const clientBranchNameEl = document.getElementById('clientBranchName'); // In #myBranchSection

    const getFromStorage = (key, defaultValue = []) => JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
    // saveToStorage needed if client could change their preferred branch (not in this scope)

    function loadClientDataFromStorage() {
        const allUsers = getFromStorage(USERS_STORAGE_KEY, []);
        const storedClientData = allUsers.find(u => u.expressBoxCode === PREDEFINED_CLIENT.expressBoxCode);
        if (storedClientData) {
            PREDEFINED_CLIENT.plan = storedClientData.plan || PREDEFINED_CLIENT.plan;
            PREDEFINED_CLIENT.autopayEnabled = typeof storedClientData.autopayEnabled === 'boolean' ? storedClientData.autopayEnabled : PREDEFINED_CLIENT.autopayEnabled;
            PREDEFINED_CLIENT.fullName = storedClientData.fullName || PREDEFINED_CLIENT.fullName;
            PREDEFINED_CLIENT.branch = storedClientData.branch || PREDEFINED_CLIENT.branch; // Sync branch
            PREDEFINED_CLIENT.address = storedClientData.address || PREDEFINED_CLIENT.address;
        } else {
            // If TARGET_CLIENT_EB_CODE is not in USERS_STORAGE_KEY, add it so admin can edit.
            const clientExists = allUsers.some(u => u.expressBoxCode === PREDEFINED_CLIENT.expressBoxCode);
            if (!clientExists) {
                allUsers.push({
                    expressBoxCode: PREDEFINED_CLIENT.expressBoxCode,
                    fullName: PREDEFINED_CLIENT.fullName,
                    email: PREDEFINED_CLIENT.email,
                    plan: PREDEFINED_CLIENT.plan,
                    autopayEnabled: PREDEFINED_CLIENT.autopayEnabled,
                    branch: PREDEFINED_CLIENT.branch, // Save default branch
                    address: PREDEFINED_CLIENT.address, // Save default address
                    registeredAt: PREDEFINED_CLIENT.registeredAt
                });
                // Use the global saveToStorage if it's defined, or define it locally
                localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));
                localStorage.setItem(USERS_STORAGE_KEY + '_event_timestamp', Date.now());
            }
        }
    }

    function loadUserInfo() {
        // ... (loading name, EB code, plan) ...
        document.getElementById('headerUserName').textContent = PREDEFINED_CLIENT.fullName;
        document.getElementById('headerUserEBCode').textContent = PREDEFINED_CLIENT.expressBoxCode;
        // ... (plan display code)

        // Display Branch
        const branchName = PREDEFINED_CLIENT.branch || "No asignada";
        if (clientBranchNameEl && document.getElementById('clientBranchInfo')) { // Check if element exists
             document.getElementById('clientBranchName').textContent = branchName; // Assuming ID is clientBranchName
        } else if (document.getElementById('clientBranchInfo')) { // Fallback if strong tag not found
            document.getElementById('clientBranchInfo').innerHTML = `Tus paquetes llegarán a la sucursal: <strong>${branchName}</strong>.`;
        }

        if (headerUserBranchDisplay) {
             headerUserBranchDisplay.innerHTML = `<i class="fas fa-store-alt"></i> Sucursal: ${branchName}`;
        }
    }

    // Storage event listener in cliente.js
    window.addEventListener('storage', (event) => {
        // ... (other listeners) ...
        if (event.key === (USERS_STORAGE_KEY + '_event_timestamp')) {
            loadClientDataFromStorage(); // Reloads PREDEFINED_CLIENT's data
            loadUserInfo();           // Updates display of plan, branch, name
            // ... (also call loadAutopayStatus, loadClientAddress if they exist)
            if(typeof loadAutopayStatus === 'function') loadAutopayStatus();
            if(typeof loadClientAddress === 'function') loadClientAddress();
        }
    });

    function initializeAccountPage() {
        loadClientDataFromStorage();
        loadUserInfo();
        // ... (rest of initializations)
        if(typeof renderClientPackages === 'function') renderClientPackages();
        if(typeof loadAutopayStatus === 'function') loadAutopayStatus();
        if(typeof loadClientNotifications === 'function') loadClientNotifications(false);
        if(typeof loadClientAddress === 'function') loadClientAddress();
        const pickupDateInput = document.getElementById('pickupDate'); // Define if not already
        if (pickupDateInput) pickupDateInput.min = new Date().toISOString().split("T")[0];
        const logoutBtn = document.getElementById('logoutButton');
        if(logoutBtn) logoutBtn.style.display = 'none';
    }

    initializeAccountPage();
    // ... (rest of your cliente.js)
});

// cliente.js
const planDetails = {
    premium: { 
        name: 'Premium', 
        iconClass: 'fas fa-crown', // Corona icon
        cssClass: 'plan-premium',
        benefits: [
            "15% de descuento en todos los envíos.",
            "Almacenamiento gratuito por 30 días.",
            "Seguro de paquete hasta $500 USD.",
            "Atención al cliente prioritaria.",
            "Notificaciones SMS avanzadas (simulado)."
        ]
    },
    intermedio: { 
        name: 'Intermedio', 
        iconClass: 'fas fa-star', // Estrella icon
        cssClass: 'plan-intermedio',
        benefits: [
            "7% de descuento en todos los envíos.",
            "Almacenamiento gratuito por 15 días.",
            "Seguro de paquete hasta $200 USD."
        ]
    },
    basico: { 
        name: 'Básico', 
        iconClass: 'fas fa-shield-alt', // Escudo icon
        cssClass: 'plan-basico',
        benefits: [
            "Tarifas estándar de envío.",
            "Almacenamiento gratuito por 7 días.",
            "Seguro de paquete hasta $100 USD."
        ]
    },
    default: { // Fallback if plan is not set
        name: 'No Especificado', 
        iconClass: 'fas fa-question-circle', 
        cssClass: 'plan-default',
        benefits: ["Contacte a soporte para seleccionar un plan o ver sus beneficios."]
    }
};

// --- cliente.js ---

    // --- PREDEFINED CLIENT (ensure this matches the EB code admin targets) ---
    const PREDEFINED_CLIENT = {
        // ... other client properties
        expressBoxCode: "EB-CLIENT001"
    };

    // --- DOM Elements for Notifications ---
    const notificationsButton = document.getElementById('notificationsButton');    // The bell icon button
    const notificationBadge = document.getElementById('notificationBadge');      // The red number badge on the bell
    const notificationsSection = document.getElementById('notificationsSection');  // The popup/dropdown section for notifications
    const notificationsList = document.getElementById('notificationsList');      // The UL element where notifications are listed
    const closeNotifications = document.getElementById('closeNotifications');    // Button to close the popup
    const markAllReadButton = document.getElementById('markAllReadButton');    // Button to mark all as read

    // --- LocalStorage Key for this specific client's notifications ---
    const CLIENT_NOTIFICATIONS_KEY = 'expressboxrd_notifications_user_' + PREDEFINED_CLIENT.expressBoxCode;

    // --- Helper Functions (Make sure these are defined in your cliente.js) ---
    const getFromStorage = (key, defaultValue = []) => JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
    const saveToStorage = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(key + '_event_timestamp', Date.now());
    };


    // --- Notifications (Bell Icon Logic) ---
    function loadClientNotifications(markNewAsReadOnClick = false) {
        if (!notificationsList) return;

        let notifications = getFromStorage(CLIENT_NOTIFICATIONS_KEY, []);
        notificationsList.innerHTML = ''; // Clear current list
        let newNotificationsWereMarkedThisLoad = false;

        if (notifications.length === 0) {
            notificationsList.innerHTML = '<li class="no-notifications">No tienes notificaciones.</li>';
            if (markAllReadButton) markAllReadButton.style.display = 'none';
        } else {
            notifications.forEach(notif => {
                const li = document.createElement('li');
                li.className = notif.read ? 'read' : 'unread'; // Style based on read status

                // If the popup is being opened (markNewAsReadOnClick = true) and notification is unread, mark it read
                if (markNewAsReadOnClick && !notif.read) {
                    notif.read = true;
                    newNotificationsWereMarkedThisLoad = true;
                }

                const date = new Date(notif.timestamp);
                const timeString = date.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
                const dateString = date.toLocaleDateString('es-DO', {day: 'numeric', month:'short'});

                li.innerHTML = `
                    <i class="${notif.icon || 'fas fa-info-circle'} notif-icon"></i>
                    <div class="notif-text">
                        ${notif.message}
                        <span class="notif-time">${dateString} - ${timeString}</span>
                    </div>
                `;
                notificationsList.appendChild(li);
            });

            // Only show "Mark all as read" if there are still unread notifications after potential marking
            const hasUnreadNow = notifications.some(n => !n.read);
            if (markAllReadButton) markAllReadButton.style.display = hasUnreadNow ? 'block' : 'none';
        }

        // If any notifications were marked as read during this load, save the changes
        if (newNotificationsWereMarkedThisLoad) {
            saveToStorage(CLIENT_NOTIFICATIONS_KEY, notifications);
        }
        updateNotificationBadge(); // Update the count on the bell icon
    }

    function markAllClientNotificationsAsRead() {
        let notifications = getFromStorage(CLIENT_NOTIFICATIONS_KEY, []);
        let changed = false;
        notifications.forEach(n => {
            if (!n.read) {
                n.read = true;
                changed = true;
            }
        });
        if (changed) {
            saveToStorage(CLIENT_NOTIFICATIONS_KEY, notifications);
            loadClientNotifications(false); // Reload the list (don't mark again here)
            if (markAllReadButton) markAllReadButton.style.display = 'none'; // All are read now
        }
    }

    function updateNotificationBadge() {
        if (!notificationBadge) return;
        const notifications = getFromStorage(CLIENT_NOTIFICATIONS_KEY, []);
        const unreadCount = notifications.filter(n => !n.read).length;

        notificationBadge.textContent = unreadCount;
        notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none'; // Or 'block'
        notificationBadge.classList.toggle('visible', unreadCount > 0);
    }

    // Event Listeners for Notification UI
    if (notificationsButton) {
        notificationsButton.addEventListener('click', () => {
            const isVisible = notificationsSection.style.display === 'block';
            notificationsSection.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) { // If just opened
                loadClientNotifications(true); // Load notifications and mark newly displayed ones as read
            }
        });
    }

    if (closeNotifications) {
        closeNotifications.addEventListener('click', () => {
            if (notificationsSection) notificationsSection.style.display = 'none';
        });
    }

    if (markAllReadButton) {
        markAllReadButton.addEventListener('click', markAllClientNotificationsAsRead);
    }

    // --- Storage Event Listener (Crucial for real-time updates) ---
    window.addEventListener('storage', (event) => {
        // Check if the key that changed is this client's notification timestamp
        if (event.key === (CLIENT_NOTIFICATIONS_KEY + '_event_timestamp')) {
            // Reload notifications. If popup is open, mark them as read.
            // If popup is closed, just update badge, don't mark as read until opened.
            loadClientNotifications(notificationsSection.style.display === 'block');
        }
        // ... other storage listeners for packages, user data, etc.
    });

    // --- Initial call during page load ---
    // (Should be inside your main initialization function like initializeAccountPage)
    // loadClientNotifications(false); // Load initially without marking as read, just to set up badge
    // updateNotificationBadge(); // Initial badge update
    
    function initializeAccountPage() {
        // ... other initializations like loadUserInfo(), renderClientPackages(), etc.
        loadClientNotifications(false); // Initial load for badge count
        // ...
    }
    // initializeAccountPage(); // Make sure this is called

    // --- cliente.js (Focus on Bell Icon and Notification Display) ---
document.addEventListener('DOMContentLoaded', () => {
    // --- PREDEFINED CLIENT (Essential for identifying which notifications to load) ---
    const PREDEFINED_CLIENT = {
        expressBoxCode: "EB-CLIENT001" // Notifications for this client will be loaded
        // Other client details like fullName, plan, etc., would be here for other functionalities
    };

    // --- DOM Elements for Notifications ---
    const notificationsButton = document.getElementById('notificationsButton');    // The bell icon <button>
    const notificationBadge = document.getElementById('notificationBadge');      // The <span> for the number badge
    const notificationsSection = document.getElementById('notificationsSection');  // The <section> acting as the popup
    const notificationsList = document.getElementById('notificationsList');      // The <ul> inside the popup
    const closeNotifications = document.getElementById('closeNotifications');    // The <button> to close the popup
    const markAllReadButton = document.getElementById('markAllReadButton');    // Optional: Button to mark all as read

    // --- LocalStorage Key specific to THIS client's notifications ---
    // Admin must save notifications to a key matching this pattern for them to appear.
    const CLIENT_NOTIFICATIONS_KEY = 'expressboxrd_notifications_user_' + PREDEFINED_CLIENT.expressBoxCode;

    // --- Minimal Helper Functions Needed for This Snippet ---
    const getFromStorage = (key, defaultValue = []) => {
        // Basic error handling for JSON.parse
        try {
            return JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
        } catch (e) {
            console.error("Error parsing from localStorage for key:", key, e);
            return defaultValue;
        }
    };

    const saveToStorage = (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            // This timestamp update is usually done by the sender (admin)
            // but if client marks as read, they also become a "sender" of new state.
            localStorage.setItem(key + '_event_timestamp', Date.now());
        } catch (e) {
            console.error("Error saving to localStorage for key:", key, e);
        }
    };

    // --- Core Notification Logic ---

    /**
     * Loads notifications from localStorage, displays them, and updates the badge.
     * @param {boolean} markDisplayedAsRead - If true, unread notifications loaded will be marked as read.
     */
    function loadAndDisplayNotifications(markDisplayedAsRead = false) {
        if (!notificationsList || !notificationsSection) {
            console.error("Notification UI elements not found in the DOM.");
            return;
        }

        let notifications = getFromStorage(CLIENT_NOTIFICATIONS_KEY, []);
        notificationsList.innerHTML = ''; // Clear previous list items
        let wereAnyNotificationsMarkedRead = false;

        if (notifications.length === 0) {
            notificationsList.innerHTML = '<li class="no-notifications">No tienes notificaciones.</li>';
            if (markAllReadButton) markAllReadButton.style.display = 'none';
        } else {
            notifications.forEach(notif => {
                const li = document.createElement('li');
                li.className = notif.read ? 'read' : 'unread';

                // If we are opening the popup AND this notification is unread, mark it as read
                if (markDisplayedAsRead && !notif.read) {
                    notif.read = true;
                    wereAnyNotificationsMarkedRead = true;
                }

                const date = new Date(notif.timestamp);
                const timeString = date.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
                const dateString = date.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });

                // Use the icon provided in the notification object, or a default
                const iconClass = notif.icon || 'fas fa-info-circle';

                li.innerHTML = `
                    <i class="${iconClass} notif-icon"></i>
                    <div class="notif-text">
                        ${notif.message}
                        <span class="notif-time">${dateString} - ${timeString}</span>
                    </div>
                `;
                notificationsList.appendChild(li);
            });

            // After potentially marking some as read, check again if any unread remain for the button
            const stillHasUnread = notifications.some(n => !n.read);
            if (markAllReadButton) {
                markAllReadButton.style.display = stillHasUnread ? 'block' : 'none';
            }
        }

        // If we marked any notifications as read during this process, save the updated array
        if (wereAnyNotificationsMarkedRead) {
            saveToStorage(CLIENT_NOTIFICATIONS_KEY, notifications);
        }

        updateNotificationBadgeCount(); // Update the red number on the bell
    }

    /**
     * Updates the count of unread notifications displayed on the bell icon.
     */
    function updateNotificationBadgeCount() {
        if (!notificationBadge) return;

        const notifications = getFromStorage(CLIENT_NOTIFICATIONS_KEY, []);
        const unreadCount = notifications.filter(n => !n.read).length;

        notificationBadge.textContent = unreadCount;
        if (unreadCount > 0) {
            notificationBadge.style.display = 'flex'; // Or 'block', depending on your CSS
            notificationBadge.classList.add('visible');
        } else {
            notificationBadge.style.display = 'none';
            notificationBadge.classList.remove('visible');
        }
    }

    /**
     * Marks all notifications for the current client as read.
     */
    function markAllCurrentNotificationsAsRead() {
        let notifications = getFromStorage(CLIENT_NOTIFICATIONS_KEY, []);
        let madeChanges = false;
        notifications.forEach(notif => {
            if (!notif.read) {
                notif.read = true;
                madeChanges = true;
            }
        });

        if (madeChanges) {
            saveToStorage(CLIENT_NOTIFICATIONS_KEY, notifications);
            loadAndDisplayNotifications(false); // Reload list (items are now read, so no further marking needed here)
            if (markAllReadButton) markAllReadButton.style.display = 'none'; // Hide button as all are read
        }
    }

    // --- Event Listeners for Notification UI Elements ---

    // When the Bell Icon is clicked:
    if (notificationsButton) {
        notificationsButton.addEventListener('click', () => {
            if (!notificationsSection) return;
            const isPopupVisible = notificationsSection.style.display === 'block';
            if (isPopupVisible) {
                notificationsSection.style.display = 'none'; // Close it
            } else {
                notificationsSection.style.display = 'block'; // Open it
                loadAndDisplayNotifications(true); // Load and mark displayed notifications as read
            }
        });
    }

    // When the "Close" button inside the popup is clicked:
    if (closeNotifications) {
        closeNotifications.addEventListener('click', () => {
            if (notificationsSection) notificationsSection.style.display = 'none';
        });
    }

    // When the "Mark all as read" button is clicked:
    if (markAllReadButton) {
        markAllReadButton.addEventListener('click', markAllCurrentNotificationsAsRead);
    }

    // --- Listen for Storage Changes (e.g., new notification from Admin) ---
    window.addEventListener('storage', (event) => {
        // Check if the key that changed is the timestamp for this client's notifications
        if (event.key === (CLIENT_NOTIFICATIONS_KEY + '_event_timestamp')) {
            // A new notification might have arrived or an existing one's state changed.
            // Reload notifications.
            // If the popup is currently open, new items will be marked as read.
            // If closed, only the badge count will update.
            loadAndDisplayNotifications(notificationsSection && notificationsSection.style.display === 'block');
        }
    });

    // --- Initial Setup on Page Load ---
    // (This should be part of your main page initialization logic if you have one)
    function initializeClientAccountFeatures() {
        // ... any other initializations for the client account page ...
        loadAndDisplayNotifications(false); // Load notifications initially to set up the badge, but don't mark as read yet.
    }

    initializeClientAccountFeatures(); // Call the main initializer

});
// --- cliente.js (Enfoque: Campana de Notificaciones Funcional) ---
document.addEventListener('DOMContentLoaded', () => {
    // --- CLIENTE PREDEFINIDO (Esencial para saber qué notificaciones cargar) ---
    const PREDEFINED_CLIENT = {
        expressBoxCode: "EB-CLIENT001" // Las notificaciones para este cliente se cargarán
        // Otros detalles del cliente (nombre, plan) estarían aquí para otras funcionalidades
    };

    // --- ELEMENTOS DEL DOM PARA NOTIFICACIONES ---
    const notificationsButton = document.getElementById('notificationsButton');    // El botón de la campana <button>
    const notificationBadge = document.getElementById('notificationBadge');      // El <span> para el número en la campana
    const notificationsSection = document.getElementById('notificationsSection');  // La <section> que actúa como popup
    const notificationsList = document.getElementById('notificationsList');      // El <ul> dentro del popup donde van las notificaciones
    const closeNotificationsButton = document.getElementById('closeNotifications'); // El <button> para cerrar el popup
    // Opcional: Botón para marcar todas como leídas (si lo tienes en tu HTML)
    // const markAllReadButton = document.getElementById('markAllReadButton');

    // --- CLAVE DE LOCALSTORAGE para las notificaciones de ESTE cliente específico ---
    // El admin debe guardar las notificaciones en una clave que coincida con este patrón.
    const CLIENT_NOTIFICATIONS_KEY = 'expressboxrd_notifications_user_' + PREDEFINED_CLIENT.expressBoxCode;

    // --- FUNCIONES AUXILIARES MÍNIMAS ---
    const getFromStorage = (key, defaultValue = []) => {
        try {
            return JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
        } catch (e) {
            console.error("Error al parsear desde localStorage para la clave:", key, e);
            return defaultValue;
        }
    };

    const saveToStorage = (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            // Esta actualización del timestamp la hace normalmente el remitente (admin),
            // pero si el cliente marca como leídas, también "envía" un nuevo estado.
            localStorage.setItem(key + '_event_timestamp', Date.now());
        } catch (e) {
            console.error("Error al guardar en localStorage para la clave:", key, e);
        }
    };

    // --- LÓGICA CENTRAL DE NOTIFICACIONES ---

    /**
     * Carga las notificaciones desde localStorage, las muestra y actualiza el contador.
     * @param {boolean} marcarComoLeidasAlMostrar - Si es true, las notificaciones no leídas que se carguen se marcarán como leídas.
     */
    function cargarYMostrarNotificaciones(marcarComoLeidasAlMostrar = false) {
        if (!notificationsList || !notificationsSection) {
            console.error("Elementos UI de notificación no encontrados en el DOM.");
            return;
        }

        let notifications = getFromStorage(CLIENT_NOTIFICATIONS_KEY, []);
        notificationsList.innerHTML = ''; // Limpiar lista previa
        let algunaNotificacionMarcadaLeida = false;

        if (notifications.length === 0) {
            notificationsList.innerHTML = '<li class="no-notifications">No tienes notificaciones.</li>';
            // if (markAllReadButton) markAllReadButton.style.display = 'none'; // Si tienes este botón
        } else {
            notifications.forEach(notif => {
                const li = document.createElement('li');
                li.className = notif.read ? 'read' : 'unread'; // Estilo según estado de lectura

                // Si estamos abriendo el popup Y esta notificación no está leída, la marcamos como leída
                if (marcarComoLeidasAlMostrar && !notif.read) {
                    notif.read = true;
                    algunaNotificacionMarcadaLeida = true;
                }

                const fechaNotif = new Date(notif.timestamp);
                // Formato de hora: HH:MM AM/PM
                const horaFormateada = fechaNotif.toLocaleTimeString('es-DO', { hour: 'numeric', minute: '2-digit', hour12: true });
                // Formato de fecha: DD de Mes
                const fechaFormateada = fechaNotif.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' }); // 'short' para mes abreviado

                const iconoClase = notif.icon || 'fas fa-info-circle'; // Icono por defecto

                li.innerHTML = `
                    <i class="${iconoClase} notif-icon"></i>
                    <div class="notif-text">
                        ${notif.message}
                        <span class="notif-time">${fechaFormateada} - ${horaFormateada}</span>
                    </div>
                `;
                notificationsList.appendChild(li);
            });

            // const aunHayNoLeidas = notifications.some(n => !n.read);
            // if (markAllReadButton) markAllReadButton.style.display = aunHayNoLeidas ? 'block' : 'none';
        }

        if (algunaNotificacionMarcadaLeida) {
            saveToStorage(CLIENT_NOTIFICATIONS_KEY, notifications); // Guardar cambios si se marcaron como leídas
        }

        actualizarContadorNotificacionesBadge(); // Actualizar el número rojo en la campana
    }

    /**
     * Actualiza el contador de notificaciones no leídas que se muestra en la campana.
     */
    function actualizarContadorNotificacionesBadge() {
        if (!notificationBadge) return;

        const notifications = getFromStorage(CLIENT_NOTIFICATIONS_KEY, []);
        const contadorNoLeidas = notifications.filter(n => !n.read).length;

        notificationBadge.textContent = contadorNoLeidas;
        if (contadorNoLeidas > 0) {
            notificationBadge.style.display = 'flex'; // O 'block', según tu CSS
            notificationBadge.classList.add('visible');
        } else {
            notificationBadge.style.display = 'none';
            notificationBadge.classList.remove('visible');
        }
    }

    // --- EVENT LISTENERS PARA LOS ELEMENTOS UI DE NOTIFICACIÓN ---

    // Cuando se hace clic en el Icono de la Campana:
    if (notificationsButton) {
        notificationsButton.addEventListener('click', () => {
            if (!notificationsSection) return;
            const estaPopupVisible = notificationsSection.style.display === 'block';
            if (estaPopupVisible) {
                notificationsSection.style.display = 'none'; // Cerrarlo
            } else {
                notificationsSection.style.display = 'block'; // Abrirlo
                cargarYMostrarNotificaciones(true); // Cargar y marcar las notificaciones mostradas como leídas
            }
        });
    }

    // Cuando se hace clic en el botón "Cerrar" dentro del popup:
    if (closeNotificationsButton) {
        closeNotificationsButton.addEventListener('click', () => {
            if (notificationsSection) notificationsSection.style.display = 'none';
        });
    }

    // Opcional: Si tienes un botón "Marcar todas como leídas"
    /*
    const markAllReadButton = document.getElementById('markAllReadButton');
    if (markAllReadButton) {
        markAllReadButton.addEventListener('click', () => {
            let notifications = getFromStorage(CLIENT_NOTIFICATIONS_KEY, []);
            let madeChanges = false;
            notifications.forEach(notif => {
                if (!notif.read) {
                    notif.read = true;
                    madeChanges = true;
                }
            });
            if (madeChanges) {
                saveToStorage(CLIENT_NOTIFICATIONS_KEY, notifications);
                cargarYMostrarNotificaciones(false); // Recargar lista
                if (markAllReadButton) markAllReadButton.style.display = 'none';
            }
        });
    }
    */


    // --- ESCUCHAR CAMBIOS EN LOCALSTORAGE (ej. nueva notificación del Admin) ---
    window.addEventListener('storage', (event) => {
        // Revisar si la clave que cambió es la del timestamp de notificaciones de este cliente
        if (event.key === (CLIENT_NOTIFICATIONS_KEY + '_event_timestamp')) {
            // Podría haber llegado una nueva notificación o el estado de una existente cambió.
            // Recargar notificaciones.
            // Si el popup está abierto, los nuevos ítems se marcarán como leídos.
            // Si está cerrado, solo se actualizará el contador de la campana.
            cargarYMostrarNotificaciones(notificationsSection && notificationsSection.style.display === 'block');
        }
    });

    // --- CONFIGURACIÓN INICIAL AL CARGAR LA PÁGINA ---
    function inicializarFuncionalidadesCuentaCliente() {
        // ... cualquier otra inicialización para la página de cuenta ...
        
        // Cargar notificaciones inicialmente para configurar el contador de la campana,
        // pero no marcarlas como leídas aún (eso sucede cuando el usuario abre el popup).
        cargarYMostrarNotificaciones(false); 
    }

    inicializarFuncionalidadesCuentaCliente(); // Llamar al inicializador principal

});

// --- cliente.js (Reads from generic session key) ---
document.addEventListener('DOMContentLoaded', () => {
    const CURRENT_USER_SESSION_KEY = 'expressboxrd_current_user_session';
    let currentUserData = JSON.parse(localStorage.getItem(CURRENT_USER_SESSION_KEY));

    if (!currentUserData || !currentUserData.expressBoxCode) {
        // If no user data in session, redirect to login
        alert("No has iniciado sesión. Serás redirigido.");
        window.location.href = 'inicio.html'; // Or your login page
        return; // Stop script execution
    }

    // Now, currentUserData holds the logged-in user's info.
    // All references to PREDEFINED_CLIENT should be replaced with currentUserData.
    // For example, CLIENT_NOTIFICATIONS_KEY will be dynamic.

    const CLIENT_NOTIFICATIONS_KEY = 'expressboxrd_notifications_user_' + currentUserData.expressBoxCode;
    const USERS_STORAGE_KEY = 'expressboxrd_users'; // Still needed to sync admin changes

    // --- DOM Elements (same as before) ---
    // ... (all your getElementById calls)
    const headerUserName = document.getElementById('headerUserName');
    // ... (and so on for all elements previously referenced)

    // --- Constants & Mappings (planDetails, statusMap - same as before) ---
    // ...
     const planDetails = { /* ... same as before ... */
        premium: { name: 'Premium', iconClass: 'fas fa-crown', cssClass: 'plan-premium', benefits: ["15% desc. envíos.", "Almacenamiento 30 días gratis.", "Seguro hasta $500 USD.", "Soporte prioritario."] },
        intermedio: { name: 'Intermedio', iconClass: 'fas fa-star', cssClass: 'plan-intermedio', benefits: ["7% desc. envíos.", "Almacenamiento 15 días gratis.", "Seguro hasta $200 USD."] },
        basico: { name: 'Básico', iconClass: 'fas fa-shield-alt', cssClass: 'plan-basico', benefits: ["Tarifas estándar.", "Almacenamiento 7 días gratis.", "Seguro hasta $100 USD."] },
        default: { name: 'No Especificado', iconClass: 'fas fa-question-circle', cssClass: 'plan-default', benefits: ["Contacte a soporte para plan."] }
    };
    const statusMap = { /* ... same as before ... */
        'received_warehouse_origin': { text: 'Recibido Origen', class: 'status-received_warehouse_origin', icon: 'fas fa-warehouse' },
        'in_transit_to_rd': { text: 'En Tránsito a RD', class: 'status-in_transit_to_rd', icon: 'fas fa-plane-departure' },
        'customs_rd': { text: 'En Aduanas RD', class: 'status-customs_rd', icon: 'fas fa-building-shield' },
        'pending_payment_customs': { text: 'Impuestos Pendientes', class: 'status-pending_payment_customs', icon: 'fas fa-file-invoice-dollar' },
        'paid_customs': { text: 'Impuestos Pagados', class: 'status-paid_customs', icon: 'fas fa-check-circle' },
        'ready_for_dispatch_cd': { text: 'Listo en CD', class: 'status-ready_for_dispatch_cd', icon: 'fas fa-dolly-flatbed' },
        'out_for_delivery_rd': { text: 'En Ruta de Entrega', class: 'status-out_for_delivery_rd', icon: 'fas fa-truck-fast' },
        'delivered_rd': { text: 'Entregado', class: 'status-delivered_rd', icon: 'fas fa-house-chimney-user' },
        'unknown_package_admin': {text: 'Paquete Desconocido', class: 'status-unknown_package_admin', icon: 'fas fa-question-circle' }
    };


    // --- Helper Functions (getFromStorage, saveToStorage, showFeedback - same as before) ---
    // ...
    const getFromStorage = (key, defaultValue = []) => JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
    const saveToStorage = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(key + '_event_timestamp', Date.now());
    };
     function showFeedback(element, message, type = 'info') { /* ... same as before ... */
        if (!element) return;
        element.textContent = message;
        element.className = `form-feedback ${type}`;
        element.style.display = 'block';
        setTimeout(() => { element.style.display = 'none'; }, 4000);
    }


    // --- Initialization ---
    function initializeAccountPage() {
        // loadClientDataFromStorage(); // This function's role changes slightly
        syncCurrentUserSessionWithMasterList(); // NEW: Ensure session data is up-to-date
        loadUserInfo();
        renderClientPackages();
        loadAutopayStatus();
        loadClientNotifications(false);
        loadClientAddress();
        // Add logout button functionality
        const logoutButton = document.getElementById('logoutButton'); // Assuming you have one
        if(logoutButton) {
            logoutButton.style.display = 'inline-block'; // Show it now
            logoutButton.addEventListener('click', () => {
                localStorage.removeItem(CURRENT_USER_SESSION_KEY);
                alert('Sesión cerrada.');
                window.location.href = 'inicio.html';
            });
        }
        // ...
        const pickupDateInput = document.getElementById('pickupDate');
        if (pickupDateInput) pickupDateInput.min = new Date().toISOString().split("T")[0];
    }
    
    // NEW/MODIFIED: Syncs the session data (currentUserData) with potential updates from admin via USERS_STORAGE_KEY
    function syncCurrentUserSessionWithMasterList() {
        const allUsers = getFromStorage(USERS_STORAGE_KEY, []);
        const storedClientData = allUsers.find(u => u.expressBoxCode === currentUserData.expressBoxCode);
        if (storedClientData) {
            // Update our in-memory currentUserData with potentially changed fields by admin
            currentUserData.plan = storedClientData.plan || currentUserData.plan;
            currentUserData.autopayEnabled = typeof storedClientData.autopayEnabled === 'boolean' ? storedClientData.autopayEnabled : currentUserData.autopayEnabled;
            currentUserData.fullName = storedClientData.fullName || currentUserData.fullName;
            currentUserData.branch = storedClientData.branch || currentUserData.branch;
            currentUserData.address = storedClientData.address || currentUserData.address;
            // Re-save the potentially updated session data
            localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(currentUserData));
        }
        // If not found in master list (e.g., admin deleted), session might be stale.
        // For now, we proceed with session data. A more robust app might invalidate session.
    }

    // --- All other functions (loadUserInfo, renderClientPackages, form submits, etc.) ---
    // MUST now use `currentUserData` instead of `PREDEFINED_CLIENT`.
    // Example changes:

    function loadUserInfo() {
        const headerUserName = document.getElementById('headerUserName'); // Define all DOM elements
        const headerUserEBCode = document.getElementById('headerUserEBCode');
        const welcomeName = document.getElementById('welcomeName');
        const headerUserPlanDisplay = document.getElementById('headerUserPlan');
        const clientPlanNameEl = document.getElementById('clientPlanName');
        const clientPlanIconEl = document.getElementById('clientPlanIcon');
        const headerUserBranchDisplay = document.getElementById('headerUserBranch');
        const clientBranchNameEl = document.getElementById('clientBranchName');


        if (headerUserName) headerUserName.textContent = currentUserData.fullName;
        if (headerUserEBCode) headerUserEBCode.textContent = currentUserData.expressBoxCode;
        if (welcomeName) welcomeName.textContent = currentUserData.fullName.split(' ')[0];

        const planKey = currentUserData.plan || 'default';
        const currentPlan = planDetails[planKey] || planDetails.default;

        if (clientPlanNameEl) clientPlanNameEl.textContent = currentPlan.name;
        if (clientPlanIconEl) clientPlanIconEl.className = `${currentPlan.iconClass} client-plan-icon-main`;
        if (headerUserPlanDisplay) {
            headerUserPlanDisplay.innerHTML = `<i class="${currentPlan.iconClass} plan-icon"></i> ${currentPlan.name}`;
            headerUserPlanDisplay.className = `user-plan-display ${currentPlan.cssClass}`;
        }

        const branchName = currentUserData.branch || "No asignada";
        if (clientBranchNameEl && document.getElementById('clientBranchInfo')) {
            document.getElementById('clientBranchName').textContent = branchName;
        }
        if (headerUserBranchDisplay) {
             headerUserBranchDisplay.innerHTML = `<i class="fas fa-store-alt"></i> Sucursal: ${branchName}`;
        }
    }
    
    // In Pre-Alert form submit:
    // const newPreAlert = { ... clientEBCode: currentUserData.expressBoxCode, clientName: currentUserData.fullName, ... };

    // In Address form submit:
    // Update allUsers[userIndex].address & saveToStorage(USERS_STORAGE_KEY, allUsers);
    // Also update currentUserData.address and saveToStorage(CURRENT_USER_SESSION_KEY, currentUserData);

    // In Autopay toggle:
    // currentUserData.autopayEnabled = activate;
    // saveToStorage(CURRENT_USER_SESSION_KEY, currentUserData);
    // Also update the record in USERS_STORAGE_KEY.
    
    // In Support Ticket submit:
    // const newTicket = { ... clientEBCode: currentUserData.expressBoxCode, clientName: currentUserData.fullName, ... };

    // Storage Listener:
    window.addEventListener('storage', (event) => {
        if (event.key === (CLIENT_NOTIFICATIONS_KEY + '_event_timestamp')) { // CLIENT_NOTIFICATIONS_KEY is now dynamic
            if(typeof loadClientNotifications === 'function') loadClientNotifications(document.getElementById('notificationsSection') && document.getElementById('notificationsSection').style.display === 'block');
        }
        if (event.key === (ADMIN_DIGITIZED_PACKAGES_KEY + '_event_timestamp')) {
            if(typeof renderClientPackages === 'function') renderClientPackages();
        }
        if (event.key === (USERS_STORAGE_KEY + '_event_timestamp')) {
            syncCurrentUserSessionWithMasterList(); // Sync with changes from admin
            loadUserInfo();
            if(typeof loadAutopayStatus === 'function') loadAutopayStatus();
            if(typeof loadClientAddress === 'function') loadClientAddress();
        }
    });
    
    // Ensure all DOM getters and functions from the previous comprehensive `cliente.js` are included here,
    // just replace PREDEFINED_CLIENT with currentUserData.
    // For brevity, I am not repeating all of them, but the structure is the same.
    // Example of adapting a function:
    function renderClientPackages() {
        const clientPackageTableBody = document.getElementById('clientPackageTableBody'); // Ensure defined
        const noPackagesMessage = document.getElementById('noPackagesMessage'); // Ensure defined
        if (!clientPackageTableBody) return;
        const allPackages = getFromStorage(ADMIN_DIGITIZED_PACKAGES_KEY, []);
        const clientPackages = allPackages.filter(pkg => pkg.clientEBCode === currentUserData.expressBoxCode && !pkg.isUnknown);
        // ... rest of the rendering logic using currentUserData ...
        clientPackageTableBody.innerHTML = '';
        if (noPackagesMessage) noPackagesMessage.style.display = clientPackages.length === 0 ? 'block' : 'none';
        clientPackages.forEach(pkg => {
            const row = clientPackageTableBody.insertRow();
            const statusInfo = statusMap[pkg.status] || { text: (pkg.status || 'N/A').replace(/_/g, ' '), class: '', icon: 'fas fa-question' };
            const taxes = parseFloat(pkg.taxes || 0);
            row.innerHTML = `<td>${pkg.originalTracking || 'N/A'}</td><td>${pkg.content ? (pkg.content.substring(0,40) + (pkg.content.length > 40 ? '...' : '')) : 'N/A'}</td><td>$${parseFloat(pkg.declaredValue || 0).toFixed(2)}</td><td>${parseFloat(pkg.pesoKg || 0).toFixed(2)} KG</td><td><span class="status-customs ${statusInfo.class}"><i class="${statusInfo.icon}"></i> ${statusInfo.text}</span></td><td>RD$ ${taxes.toFixed(2)}</td><td class="table-actions">${pkg.status === 'pending_payment_customs' ? `<button class="btn-icon-action action-btn-pay" data-package-id="${pkg.id}" title="Pagar Impuestos"><i class="fas fa-credit-card"></i> Pagar</button>` : (pkg.status === 'ready_for_dispatch_cd' ? `<button class="btn-icon-action" data-package-id="${pkg.id}" title="Coordinar Entrega"><i class="fas fa-truck"></i> Coordinar</button>` : '')}</td>`;
        });
        // Add event listeners for buttons
        clientPackageTableBody.querySelectorAll('.action-btn-pay').forEach(button => button.addEventListener('click', () => payPackageTaxes(button.dataset.packageId)));
        clientPackageTableBody.querySelectorAll('.btn-icon-action[title="Coordinar Entrega"]').forEach(button => button.addEventListener('click', () => schedulePackageDelivery(button.dataset.packageId)));
    }
    function payPackageTaxes(packageId){ /* ... same ... */ }
    function schedulePackageDelivery(packageId){ /* ... same ... */ }
    // ... and so on for all other functions. Load notifications, autopay, address using currentUserData.

    initializeAccountPage();
});

// --- cliente.js (Reads dynamic user data from session) ---
document.addEventListener('DOMContentLoaded', () => {
    const CURRENT_USER_SESSION_KEY = 'expressboxrd_current_user_session';
    let currentUserData = JSON.parse(localStorage.getItem(CURRENT_USER_SESSION_KEY));

    if (!currentUserData || !currentUserData.expressBoxCode) {
        alert("No has iniciado sesión. Por favor, inicia sesión para continuar.");
        window.location.href = 'inicio.html'; // Redirect to login page
        return; // Important to stop further execution
    }

    // All subsequent operations use `currentUserData`
    const CLIENT_NOTIFICATIONS_KEY = 'expressboxrd_notifications_user_' + currentUserData.expressBoxCode;
    const USERS_STORAGE_KEY = 'expressboxrd_users'; // Still needed to sync with admin changes to this user

    // --- DOM Elements that need to be populated with user data ---
    const headerUserName = document.getElementById('headerUserName');
    const headerUserEBCode = document.getElementById('headerUserEBCode');
    const welcomeName = document.getElementById('welcomeName'); // Element for "Bienvenido/a ..., [Nombre]"
    const headerUserPlanDisplay = document.getElementById('headerUserPlan');
    const clientPlanNameEl = document.getElementById('clientPlanName');
    const clientPlanIconEl = document.getElementById('clientPlanIcon');
    const headerUserBranchDisplay = document.getElementById('headerUserBranch');
    const clientBranchNameEl = document.getElementById('clientBranchName');
    // ... Add ALL other getElementById calls for elements you interact with ...
    const notificationsButton = document.getElementById('notificationsButton');
    const notificationBadge = document.getElementById('notificationBadge');
    const notificationsSection = document.getElementById('notificationsSection');
    const notificationsList = document.getElementById('notificationsList');
    const closeNotificationsButton = document.getElementById('closeNotifications'); // Corrected ID
    const markAllReadButton = document.getElementById('markAllReadButton');
    const clientPackageTableBody = document.getElementById('clientPackageTableBody');
    const noPackagesMessage = document.getElementById('noPackagesMessage');
    const preAlertForm = document.getElementById('preAlertForm');
    const myPlanSection = document.getElementById('myPlanSection');
    const planBenefitsModal = document.getElementById('planBenefitsModal');
    const closePlanBenefitsModal = document.getElementById('closePlanBenefitsModal');
    const modalPlanName = document.getElementById('modalPlanName');
    const modalPlanBenefitsList = document.getElementById('modalPlanBenefitsList');
    // ... (and all other elements from the comprehensive cliente.js)


    // --- Constants & Mappings (planDetails, statusMap - ensure they are defined here) ---
    const planDetails = { /* ... from previous cliente.js ... */
        premium: { name: 'Premium', iconClass: 'fas fa-crown', cssClass: 'plan-premium', benefits: ["15% desc. envíos.", "Almacenamiento 30 días gratis.", "Seguro hasta $500 USD.", "Soporte prioritario."] },
        intermedio: { name: 'Intermedio', iconClass: 'fas fa-star', cssClass: 'plan-intermedio', benefits: ["7% desc. envíos.", "Almacenamiento 15 días gratis.", "Seguro hasta $200 USD."] },
        basico: { name: 'Básico', iconClass: 'fas fa-shield-alt', cssClass: 'plan-basico', benefits: ["Tarifas estándar.", "Almacenamiento 7 días gratis.", "Seguro hasta $100 USD."] },
        default: { name: 'No Especificado', iconClass: 'fas fa-question-circle', cssClass: 'plan-default', benefits: ["Contacte a soporte para plan."] }
    };
     const statusMap = { /* ... from previous cliente.js ... */
        'received_warehouse_origin': { text: 'Recibido Origen', class: 'status-received_warehouse_origin', icon: 'fas fa-warehouse' },
        'in_transit_to_rd': { text: 'En Tránsito a RD', class: 'status-in_transit_to_rd', icon: 'fas fa-plane-departure' },
        'customs_rd': { text: 'En Aduanas RD', class: 'status-customs_rd', icon: 'fas fa-building-shield' },
        'pending_payment_customs': { text: 'Impuestos Pendientes', class: 'status-pending_payment_customs', icon: 'fas fa-file-invoice-dollar' },
        'paid_customs': { text: 'Impuestos Pagados', class: 'status-paid_customs', icon: 'fas fa-check-circle' },
        'ready_for_dispatch_cd': { text: 'Listo en CD', class: 'status-ready_for_dispatch_cd', icon: 'fas fa-dolly-flatbed' },
        'out_for_delivery_rd': { text: 'En Ruta de Entrega', class: 'status-out_for_delivery_rd', icon: 'fas fa-truck-fast' },
        'delivered_rd': { text: 'Entregado', class: 'status-delivered_rd', icon: 'fas fa-house-chimney-user' },
        'unknown_package_admin': {text: 'Paquete Desconocido', class: 'status-unknown_package_admin', icon: 'fas fa-question-circle' }
    };


    // --- Helper Functions ---
    const getFromStorage = (key, defaultValue = []) => JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
    const saveToStorage = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(key + '_event_timestamp', Date.now());
    };
    // ... (showFeedback, calculateTaxesDOP - same as before)

    /**
     * Updates the displayed user information based on `currentUserData`.
     * This is where the registered name will be displayed.
     */
    function loadUserInfo() {
        if (!currentUserData) return;

        if (headerUserName) headerUserName.textContent = currentUserData.fullName;
        if (headerUserEBCode) headerUserEBCode.textContent = currentUserData.expressBoxCode;
        
        // Display the registered full name in the welcome message
        if (welcomeName) {
            // welcomeName.textContent = currentUserData.fullName.split(' ')[0]; // Just first name
            welcomeName.textContent = currentUserData.fullName; // Display full registered name
        }

        const planKey = currentUserData.plan || 'default';
        const currentPlan = planDetails[planKey] || planDetails.default;

        if (clientPlanNameEl) clientPlanNameEl.textContent = currentPlan.name;
        if (clientPlanIconEl) clientPlanIconEl.className = `${currentPlan.iconClass} client-plan-icon-main`;
        if (headerUserPlanDisplay) {
            headerUserPlanDisplay.innerHTML = `<i class="${currentPlan.iconClass} plan-icon"></i> ${currentPlan.name}`;
            headerUserPlanDisplay.className = `user-plan-display ${currentPlan.cssClass}`;
        }

        const branchName = currentUserData.branch || "No asignada";
        if (clientBranchNameEl && document.getElementById('clientBranchInfo')) {
            document.getElementById('clientBranchName').textContent = branchName;
        }
        if (headerUserBranchDisplay) {
             headerUserBranchDisplay.innerHTML = `<i class="fas fa-store-alt"></i> Sucursal: ${branchName}`;
        }
    }
    
    // --- SYNC FUNCTION (Essential for reflecting admin changes) ---
    function syncCurrentUserSessionWithMasterList() {
        const allUsers = getFromStorage(USERS_STORAGE_KEY, []);
        const storedUserDataFromMasterList = allUsers.find(u => u.expressBoxCode === currentUserData.expressBoxCode);
        
        if (storedUserDataFromMasterList) {
            // Update current session data with any changes made by admin
            currentUserData.plan = storedUserDataFromMasterList.plan || currentUserData.plan;
            currentUserData.autopayEnabled = typeof storedUserDataFromMasterList.autopayEnabled === 'boolean' ? storedUserDataFromMasterList.autopayEnabled : currentUserData.autopayEnabled;
            currentUserData.fullName = storedUserDataFromMasterList.fullName || currentUserData.fullName; // Admin might correct a name
            currentUserData.branch = storedUserDataFromMasterList.branch || currentUserData.branch;
            currentUserData.address = storedUserDataFromMasterList.address || currentUserData.address;
            
            // Re-save the updated session data to localStorage
            localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(currentUserData));
        }
    }


    // --- All other functions from your comprehensive cliente.js ---
    // (renderClientPackages, loadClientAddress, preAlertForm submit, supportTicketForm submit,
    //  notification handling, autopay, etc.)
    // **IMPORTANT**: Ensure every place that used `PREDEFINED_CLIENT.expressBoxCode` or
    // `PREDEFINED_CLIENT.fullName` now uses `currentUserData.expressBoxCode` and
    // `currentUserData.fullName` respectively.
    // For example:
    // function renderClientPackages() {
    //     ...
    //     const clientPackages = allPackages.filter(pkg => pkg.clientEBCode === currentUserData.expressBoxCode && !pkg.isUnknown);
    //     ...
    // }
    // if (preAlertForm) {
    //     preAlertForm.addEventListener('submit', (event) => {
    //         ...
    //         const newPreAlert = { ... clientEBCode: currentUserData.expressBoxCode, clientName: currentUserData.fullName, ... };
    //         ...
    //     });
    // }

    // --- Storage Event Listener (Crucial) ---
    window.addEventListener('storage', (event) => {
        if (event.key === (CLIENT_NOTIFICATIONS_KEY + '_event_timestamp')) {
            if(typeof loadClientNotifications === 'function') loadClientNotifications(notificationsSection && notificationsSection.style.display === 'block');
        }
        if (event.key === (ADMIN_DIGITIZED_PACKAGES_KEY + '_event_timestamp')) {
            if(typeof renderClientPackages === 'function') renderClientPackages();
        }
        // This is key for reflecting admin's changes to THIS user's profile (plan, branch, etc.)
        if (event.key === (USERS_STORAGE_KEY + '_event_timestamp')) {
            syncCurrentUserSessionWithMasterList(); // Get latest from admin changes
            loadUserInfo();                         // Re-render user-specific info
            if(typeof loadAutopayStatus === 'function') loadAutopayStatus();     // Re-render autopay
            if(typeof loadClientAddress === 'function') loadClientAddress();     // Re-render address
        }
    });
    
    // --- Initialize the Account Page ---
    function initializeAccountPage() {
        syncCurrentUserSessionWithMasterList(); // Make sure session reflects any admin changes first
        loadUserInfo(); // Display user's name, plan, etc.
        
        // Call all your other rendering and setup functions
        if(typeof renderClientPackages === 'function') renderClientPackages();
        if(typeof loadAutopayStatus === 'function') loadAutopayStatus();
        if(typeof loadClientNotifications === 'function') loadClientNotifications(false); // Initial badge update
        if(typeof loadClientAddress === 'function') loadClientAddress();
        
        // Add logout button functionality
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) { // Check if logout button exists in your cuenta.html
            logoutButton.style.display = 'inline-block'; // Or 'block'
            logoutButton.addEventListener('click', () => {
                localStorage.removeItem(CURRENT_USER_SESSION_KEY);
                // Optional: Clear other user-specific localStorage items if any
                alert('Has cerrado sesión.');
                window.location.href = 'inicio.html';
            });
        } else {
            // If no logout button, user is effectively "stuck" in session until cleared manually
            // or session key expires (not implemented here)
        }
        const pickupDateInput = document.getElementById('pickupDate');
        if (pickupDateInput) pickupDateInput.min = new Date().toISOString().split("T")[0];
    }

    initializeAccountPage(); // Load everything for the logged-in user
});

// --- cliente.js ---
document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ESTABLISH THE CURRENT LOGGED-IN USER ---
    const CURRENT_USER_SESSION_KEY = 'expressboxrd_current_user_session';
    let currentUserData = JSON.parse(localStorage.getItem(CURRENT_USER_SESSION_KEY));

    if (!currentUserData || !currentUserData.expressBoxCode) {
        // If no valid session data, the user is not logged in.
        alert("No has iniciado sesión. Por favor, inicia sesión para continuar.");
        window.location.href = 'inicio.html'; // Redirect to login page
        return; // Stop further script execution for cuenta.html
    }
    // Now, 'currentUserData' holds the specific details of the logged-in user,
    // including currentUserData.fullName and currentUserData.expressBoxCode.

    // --- LocalStorage Keys ---
    const ADMIN_DIGITIZED_PACKAGES_KEY = 'expressboxrd_admin_packages_v3'; // Admin saves ALL packages here
    const USERS_STORAGE_KEY = 'expressboxrd_users'; // Used to sync user details if admin changes them
    const CLIENT_NOTIFICATIONS_KEY = 'expressboxrd_notifications_user_' + currentUserData.expressBoxCode; // Dynamic key

    // --- DOM Elements (ensure these are defined in your HTML) ---
    const headerUserName = document.getElementById('headerUserName');
    const headerUserEBCode = document.getElementById('headerUserEBCode');
    const welcomeName = document.getElementById('welcomeName');
    const clientPackageTableBody = document.getElementById('clientPackageTableBody');
    const noPackagesMessage = document.getElementById('noPackagesMessage');
    // ... (other DOM elements: plan, branch, notifications, forms, etc.)

    // --- Constants & Mappings ---
    const statusMap = { /* ... Your complete statusMap ... */
        'received_warehouse_origin': { text: 'Recibido Origen', class: 'status-received_warehouse_origin', icon: 'fas fa-warehouse' },
        'in_transit_to_rd': { text: 'En Tránsito a RD', class: 'status-in_transit_to_rd', icon: 'fas fa-plane-departure' },
        'customs_rd': { text: 'En Aduanas RD', class: 'status-customs_rd', icon: 'fas fa-building-shield' },
        'pending_payment_customs': { text: 'Impuestos Pendientes', class: 'status-pending_payment_customs', icon: 'fas fa-file-invoice-dollar' },
        'paid_customs': { text: 'Impuestos Pagados', class: 'status-paid_customs', icon: 'fas fa-check-circle' },
        'ready_for_dispatch_cd': { text: 'Listo en CD', class: 'status-ready_for_dispatch_cd', icon: 'fas fa-dolly-flatbed' },
        'out_for_delivery_rd': { text: 'En Ruta de Entrega', class: 'status-out_for_delivery_rd', icon: 'fas fa-truck-fast' },
        'delivered_rd': { text: 'Entregado', class: 'status-delivered_rd', icon: 'fas fa-house-chimney-user' },
        'unknown_package_admin': {text: 'Paquete Desconocido', class: 'status-unknown_package_admin', icon: 'fas fa-question-circle' }
    };
    // ... (planDetails if you use them)

    // --- Helper Functions ---
    const getFromStorage = (key, defaultValue = []) => JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
    // ... (saveToStorage, showFeedback if needed by other parts not shown here)

    // --- 2. DISPLAY LOGGED-IN USER'S INFO (INCLUDING NAME) ---
    function loadUserInfo() {
        if (!currentUserData) return;

        if (headerUserName) headerUserName.textContent = currentUserData.fullName;
        if (headerUserEBCode) headerUserEBCode.textContent = currentUserData.expressBoxCode;
        
        // Display the registered full name in the welcome message
        if (welcomeName) {
            welcomeName.textContent = currentUserData.fullName; // Shows full name like "Luis Alonzo Sánchez Rodríguez"
        }
        // ... (load plan, branch, etc., using currentUserData)
    }

    // --- 3. RENDER PACKAGES FOR THE LOGGED-IN USER ---
    function renderClientPackages() {
        if (!clientPackageTableBody || !currentUserData || !currentUserData.expressBoxCode) {
            console.error("Cannot render packages: missing table body or current user data.");
            if (noPackagesMessage) noPackagesMessage.style.display = 'block'; // Show "no packages"
            return;
        }

        const allPackages = getFromStorage(ADMIN_DIGITIZED_PACKAGES_KEY, []);
        
        // **CRUCIAL FILTERING STEP:**
        // Only select packages where 'clientEBCode' matches the currently logged-in user's 'expressBoxCode'.
        const clientPackages = allPackages.filter(pkg => 
            pkg.clientEBCode === currentUserData.expressBoxCode && !pkg.isUnknown
        );

        clientPackageTableBody.innerHTML = ''; // Clear previous packages

        if (noPackagesMessage) {
            noPackagesMessage.style.display = clientPackages.length === 0 ? 'block' : 'none';
        }

        if (clientPackages.length > 0) {
            clientPackages.forEach(pkg => {
                const row = clientPackageTableBody.insertRow();
                const statusInfo = statusMap[pkg.status] || { text: (pkg.status || 'N/A').replace(/_/g, ' '), class: '', icon: 'fas fa-question' };
                const taxes = parseFloat(pkg.taxes || 0);

                // Ensure your package object (pkg) has 'originalTracking', 'content', 'declaredValue', 'pesoKg', 'status', 'taxes'
                row.innerHTML = `
                    <td>${pkg.originalTracking || 'N/A'}</td>
                    <td>${pkg.content ? (pkg.content.substring(0,40) + (pkg.content.length > 40 ? '...' : '')) : 'N/A'}</td>
                    <td>$${parseFloat(pkg.declaredValue || 0).toFixed(2)}</td>
                    <td>${parseFloat(pkg.pesoKg || 0).toFixed(2)} KG</td>
                    <td><span class="status-customs ${statusInfo.class}"><i class="${statusInfo.icon}"></i> ${statusInfo.text}</span></td>
                    <td>RD$ ${taxes.toFixed(2)}</td>
                    <td class="table-actions">
                        ${pkg.status === 'pending_payment_customs' ?
                            `<button class="btn-icon-action action-btn-pay" data-package-id="${pkg.id}" title="Pagar Impuestos"><i class="fas fa-credit-card"></i> Pagar</button>` :
                            (pkg.status === 'ready_for_dispatch_cd' ? `<button class="btn-icon-action" data-package-id="${pkg.id}" title="Coordinar Entrega"><i class="fas fa-truck"></i> Coordinar</button>` : '')
                        }
                    </td>
                `;
            });
            // Add event listeners for action buttons AFTER rows are added
            clientPackageTableBody.querySelectorAll('.action-btn-pay').forEach(button => {
                button.addEventListener('click', () => payPackageTaxes(button.dataset.packageId));
            });
            clientPackageTableBody.querySelectorAll('.btn-icon-action[title="Coordinar Entrega"]').forEach(button => {
                button.addEventListener('click', () => schedulePackageDelivery(button.dataset.packageId));
            });
        }
    }

    // Dummy functions for package actions (replace with your actual logic)
    function payPackageTaxes(packageId) { alert(`Simulación: Pagar impuestos para paquete ${packageId}`); }
    function schedulePackageDelivery(packageId) { alert(`Simulación: Coordinar entrega para paquete ${packageId}`); }


    // --- 4. Storage Event Listener to React to Admin's Package Digitization ---
    window.addEventListener('storage', (event) => {
        // If the admin saved/updated the general package list
        if (event.key === (ADMIN_DIGITIZED_PACKAGES_KEY + '_event_timestamp')) {
            console.log("CLIENTE: Se detectó actualización en la lista de paquetes (admin). Recargando mis paquetes...");
            renderClientPackages(); // Re-render to show new/updated packages for this client
        }

        // If admin updated THIS user's details (plan, branch, etc.)
        if (event.key === (USERS_STORAGE_KEY + '_event_timestamp')) {
            console.log("CLIENTE: Se detectó actualización en los datos de usuario (admin). Sincronizando...");
            syncCurrentUserSessionWithMasterList(); // Sync session with master list
            loadUserInfo();                         // Re-render user info
            // ... also call other relevant display updaters like loadAutopayStatus(), loadClientAddress()
        }
        
        // For notifications for THIS user
        if (event.key === (CLIENT_NOTIFICATIONS_KEY + '_event_timestamp')) { // CLIENT_NOTIFICATIONS_KEY is dynamic
            if(typeof loadClientNotifications === 'function') { // Check if function exists
                 const notificationsSection = document.getElementById('notificationsSection'); // Check DOM element
                 loadClientNotifications(notificationsSection && notificationsSection.style.display === 'block');
            }
        }
    });
    
    // --- Function to sync session with master user list (if admin updates user details) ---
    function syncCurrentUserSessionWithMasterList() {
        if (!currentUserData) return; // Should not happen if initial check passes
        const allUsers = getFromStorage(USERS_STORAGE_KEY, []);
        const storedUserDataFromMasterList = allUsers.find(u => u.expressBoxCode === currentUserData.expressBoxCode);
        
        if (storedUserDataFromMasterList) {
            let sessionChanged = false;
            // Compare and update fields if different
            if (currentUserData.fullName !== storedUserDataFromMasterList.fullName) {
                currentUserData.fullName = storedUserDataFromMasterList.fullName; sessionChanged = true;
            }
            if (currentUserData.plan !== storedUserDataFromMasterList.plan) {
                currentUserData.plan = storedUserDataFromMasterList.plan; sessionChanged = true;
            }
            if (currentUserData.branch !== storedUserDataFromMasterList.branch) {
                currentUserData.branch = storedUserDataFromMasterList.branch; sessionChanged = true;
            }
            if (currentUserData.autopayEnabled !== storedUserDataFromMasterList.autopayEnabled) {
                currentUserData.autopayEnabled = storedUserDataFromMasterList.autopayEnabled; sessionChanged = true;
            }
            // Deep compare for address might be needed if it's complex
            if (JSON.stringify(currentUserData.address) !== JSON.stringify(storedUserDataFromMasterList.address)) {
                 currentUserData.address = storedUserDataFromMasterList.address; sessionChanged = true;
            }
            
            if (sessionChanged) {
                localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(currentUserData));
                console.log("CLIENTE: Datos de sesión actualizados desde la lista maestra.");
            }
        }
    }


    // --- Initialize the Account Page ---
    function initializeAccountPage() {
        syncCurrentUserSessionWithMasterList(); // Sync first, in case admin made changes while user was logged out
        loadUserInfo();                         // Display user's name and other details
        renderClientPackages();                 // Display packages for this user
        
        // Call other initialization functions for notifications, autopay, address, forms, etc.
        // e.g., if(typeof loadClientNotifications === 'function') loadClientNotifications(false);
        // e.g., if(typeof loadAutopayStatus === 'function') loadAutopayStatus();

        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.style.display = 'inline-block';
            logoutButton.addEventListener('click', () => {
                localStorage.removeItem(CURRENT_USER_SESSION_KEY);
                alert('Has cerrado sesión.');
                window.location.href = 'inicio.html';
            });
        }
    }

    initializeAccountPage(); // Start the page setup
});

const clientPackages = allPackages.filter(pkg => 
    pkg.clientEBCode === currentUserData.expressBoxCode && !pkg.isUnknown
);

// cliente.js
window.addEventListener('storage', (event) => {
    if (event.key === (ADMIN_DIGITIZED_PACKAGES_KEY + '_event_timestamp')) {
        console.log("CLIENTE: Se detectó actualización en la lista de paquetes (admin). Recargando mis paquetes...");
        if (typeof renderClientPackages === 'function') { // Check if function exists
            renderClientPackages(); // Re-render to show new/updated packages for this client
        }
    }
    // ... other listeners ...
});

// --- cliente.js ---
document.addEventListener('DOMContentLoaded', () => {
    // --- CURRENT_USER_SESSION_KEY and currentUserData setup (as before) ---
    const CURRENT_USER_SESSION_KEY = 'expressboxrd_current_user_session';
    let currentUserData = JSON.parse(localStorage.getItem(CURRENT_USER_SESSION_KEY));
    if (!currentUserData || !currentUserData.expressBoxCode) { /* ... redirect to login ... */ return; }

    // --- DOM Elements ---
    // ... (all existing DOM elements)
    const headerUserBranchDisplay = document.getElementById('headerUserBranch');
    const clientBranchNameEl = document.getElementById('clientBranchName'); // In #myBranchSection

    // NEW: Autorizar Retiro a Tercero Form
    const authorizePickupForm = document.getElementById('authorizePickupForm');
    const authPackageTrackingsInput = document.getElementById('authPackageTrackings');
    const authorizedPersonFullNameInput = document.getElementById('authorizedPersonFullName');
    const authorizedPersonIDInput = document.getElementById('authorizedPersonID');
    const authPickupNotesInput = document.getElementById('authPickupNotes');
    const authorizePickupMessage = document.getElementById('authorizePickupMessage');

    // --- LocalStorage Keys ---
    // ... (existing keys)
    const USERS_STORAGE_KEY = 'expressboxrd_users';
    const PICKUP_AUTHORIZATIONS_KEY = 'expressboxrd_pickup_authorizations'; // NEW

    // --- Constants & Mappings (planDetails, statusMap - same as before) ---
    // ...

    // --- Helper Functions (getFromStorage, saveToStorage, showFeedback - same as before) ---
    // ...

    // --- loadUserInfo (ensure it displays currentUserData.branch) ---
    function loadUserInfo() {
        // ... (load name, EB code, plan)
        const headerUserName = document.getElementById('headerUserName');
        const headerUserEBCode = document.getElementById('headerUserEBCode');
        const welcomeName = document.getElementById('welcomeName');
        if (headerUserName) headerUserName.textContent = currentUserData.fullName;
        if (headerUserEBCode) headerUserEBCode.textContent = currentUserData.expressBoxCode;
        if (welcomeName) welcomeName.textContent = currentUserData.fullName;


        const branchName = currentUserData.branch || "No asignada";
        if (clientBranchNameEl && document.getElementById('clientBranchInfo')) {
             document.getElementById('clientBranchName').textContent = branchName;
        }
        if (headerUserBranchDisplay) {
             headerUserBranchDisplay.innerHTML = `<i class="fas fa-store-alt"></i> Sucursal: ${branchName}`;
        }
        // ... (load plan display)
    }

    // --- NEW: Handle "Autorizar Retiro a Tercero" Form Submission ---
    if (authorizePickupForm) {
        authorizePickupForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const packageTrackings = authPackageTrackingsInput.value.trim();
            const personFullName = authorizedPersonFullNameInput.value.trim();
            const personID = authorizedPersonIDInput.value.trim();
            const notes = authPickupNotesInput.value.trim();

            if (!packageTrackings || !personFullName || !personID) {
                showFeedback(authorizePickupMessage, "Trackings, nombre completo y ID del autorizado son requeridos.", "error");
                return;
            }

            let authorizations = getFromStorage(PICKUP_AUTHORIZATIONS_KEY, []);
            const newAuth = {
                id: 'auth_' + Date.now() + currentUserData.expressBoxCode.slice(-3),
                clientEBCode: currentUserData.expressBoxCode,
                clientName: currentUserData.fullName,
                packageTrackings: packageTrackings,
                authorizedPersonFullName: personFullName,
                authorizedPersonID: personID,
                notes: notes,
                timestamp: new Date().toISOString(),
                status: 'pendiente' // 'pendiente', 'utilizada', 'vencida'
            };
            authorizations.unshift(newAuth);
            saveToStorage(PICKUP_AUTHORIZATIONS_KEY, authorizations); // Notifies admin

            showFeedback(authorizePickupMessage, "Autorización enviada correctamente. El personal de sucursal será notificado.", "success");
            authorizePickupForm.reset();
        });
    }


    // --- Storage Event Listener (syncCurrentUserSessionWithMasterList is key here) ---
    window.addEventListener('storage', (event) => {
        // ... (existing listeners for notifications, packages) ...
        if (event.key === (USERS_STORAGE_KEY + '_event_timestamp')) {
            syncCurrentUserSessionWithMasterList(); // Gets latest plan, branch, address etc. from admin changes
            loadUserInfo();
            // ... (also call loadAutopayStatus, loadClientAddress if they exist)
        }
    });
    
    // --- syncCurrentUserSessionWithMasterList (as before, ensures branch updates) ---
    function syncCurrentUserSessionWithMasterList() { /* ... same as before ... */ }

    // --- initializeAccountPage (calls loadUserInfo) ---
    function initializeAccountPage() { /* ... syncCurrentUserSessionWithMasterList(); loadUserInfo(); ... other initializations ... */ }
    // initializeAccountPage(); // Make sure this is called
});

// --- cliente.js (Snippet for Submitting Pickup Authorization) ---
document.addEventListener('DOMContentLoaded', () => {
    // --- CURRENT_USER_SESSION_KEY and currentUserData setup ---
    // This part ensures we know who is submitting the authorization
    const CURRENT_USER_SESSION_KEY = 'expressboxrd_current_user_session';
    let currentUserData = JSON.parse(localStorage.getItem(CURRENT_USER_SESSION_KEY));

    if (!currentUserData || !currentUserData.expressBoxCode) {
        // If no user data in session, redirect to login or disable form
        // For this snippet, we'll assume the form might be disabled if no user.
        // A full page would redirect.
        console.warn("CLIENTE: No hay usuario en sesión. Funcionalidad de autorización de retiro deshabilitada.");
        const authForm = document.getElementById('authorizePickupForm');
        if (authForm) authForm.style.display = 'none'; // Hide form if no user
        return;
    }

    // --- DOM Elements for "Autorizar Retiro a Tercero" Form ---
    const authorizePickupForm = document.getElementById('authorizePickupForm');
    const authPackageTrackingsInput = document.getElementById('authPackageTrackings');
    const authorizedPersonFullNameInput = document.getElementById('authorizedPersonFullName');
    const authorizedPersonIDInput = document.getElementById('authorizedPersonID');
    const authPickupNotesInput = document.getElementById('authPickupNotes'); // Optional notes
    const authorizePickupMessage = document.getElementById('authorizePickupMessage'); // For feedback

    // --- LocalStorage Key for all pickup authorizations ---
    const PICKUP_AUTHORIZATIONS_KEY = 'expressboxrd_pickup_authorizations';

    // --- Helper Functions ---
    const getFromStorage = (key, defaultValue = []) => {
        try {
            return JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
        } catch (e) {
            console.error("Error parsing from localStorage for key:", key, e);
            return defaultValue;
        }
    };

    const saveToStorage = (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            localStorage.setItem(key + '_event_timestamp', Date.now()); // CRUCIAL: Notifies admin.js
        } catch (e) {
            console.error("Error saving to localStorage for key:", key, e);
        }
    };

    function showFeedback(element, message, type = 'info') { // General feedback function
        if (!element) return;
        element.textContent = message;
        element.className = `form-feedback ${type}`; // Assumes .success, .error, .info classes in cuenta.css
        element.style.display = 'block';
        setTimeout(() => { element.style.display = 'none'; }, 4000);
    }

    // --- Handle "Autorizar Retiro a Tercero" Form Submission ---
    if (authorizePickupForm) {
        authorizePickupForm.addEventListener('submit', (event) => {
            event.preventDefault();

            // Get values from the form
            const packageTrackings = authPackageTrackingsInput.value.trim();
            const personFullName = authorizedPersonFullNameInput.value.trim();
            const personID = authorizedPersonIDInput.value.trim();
            const notes = authPickupNotesInput.value.trim();

            // Basic validation
            if (!packageTrackings || !personFullName || !personID) {
                showFeedback(authorizePickupMessage, "Trackings, nombre completo y ID del autorizado son requeridos.", "error");
                return;
            }

            let authorizations = getFromStorage(PICKUP_AUTHORIZATIONS_KEY, []); // Get existing authorizations

            // Create the new authorization object
            const newAuth = {
                id: 'auth_' + Date.now() + currentUserData.expressBoxCode.slice(-3), // Unique ID
                clientEBCode: currentUserData.expressBoxCode,    // EB Code of the client submitting
                clientName: currentUserData.fullName,          // Name of the client submitting
                packageTrackings: packageTrackings,            // Trackings of packages involved
                authorizedPersonFullName: personFullName,      // Name of the person authorized
                authorizedPersonID: personID,                  // ID of the person authorized
                notes: notes,                                  // Optional notes
                timestamp: new Date().toISOString(),           // When the authorization was submitted
                status: 'pendiente' // Initial status: 'pendiente', 'utilizada', 'vencida' (admin manages this)
            };

            authorizations.unshift(newAuth); // Add new authorization to the beginning of the array
            saveToStorage(PICKUP_AUTHORIZATIONS_KEY, authorizations); // Save and trigger storage event for admin

            showFeedback(authorizePickupMessage, "Autorización de retiro enviada correctamente.", "success");
            authorizePickupForm.reset(); // Clear the form
        });
    }

    // ... (Rest of your cliente.js for other functionalities: user info, packages, notifications, etc.)
    // Make sure your main initialize function (e.g., initializeAccountPage) is called.
});

// --- cliente.js (Maneja notificaciones COMPARTIDAS) ---
document.addEventListener('DOMContentLoaded', () => {
    // --- IDENTIFICACIÓN DEL USUARIO LOGUEADO (necesaria para otras funciones, no tanto para notificaciones compartidas) ---
    const CURRENT_USER_SESSION_KEY = 'expressboxrd_current_user_session';
    let currentUserData = JSON.parse(localStorage.getItem(CURRENT_USER_SESSION_KEY));

    if (!currentUserData || !currentUserData.expressBoxCode) {
        // alert("No has iniciado sesión."); window.location.href = 'inicio.html'; return;
        // Para esta demo de notificaciones, podemos permitir que funcione incluso sin un usuario específico logueado,
        // ya que las notificaciones son compartidas. Pero en un sistema real, esto sería un requisito.
        console.warn("CLIENTE: No hay usuario logueado, las notificaciones mostradas serán compartidas globalmente.");
    }

    // --- DOM Elements for Notifications ---
    const notificationsButton = document.getElementById('notificationsButton');
    const notificationBadge = document.getElementById('notificationBadge');
    const notificationsSection = document.getElementById('notificationsSection');
    const notificationsList = document.getElementById('notificationsList');
    const closeNotificationsButton = document.getElementById('closeNotifications');
    const markAllReadButton = document.getElementById('markAllReadButton');

    // --- LocalStorage Key for SHARED Notifications ---
    const SHARED_NOTIFICATIONS_KEY = 'expressboxrd_shared_notifications'; // Todos leen y escriben (estado 'read') aquí

    // --- Helper Functions ---
    const getFromStorage = (key, defaultValue = []) => { /* ...tu función getFromStorage... */ };
    const saveToStorage = (key, data) => { /* ...tu función saveToStorage que actualiza _event_timestamp... */ };


    // --- Lógica de Notificaciones Compartidas ---
    function loadClientNotifications(markDisplayedAsRead = false) {
        if (!notificationsList || !notificationsSection) return;

        // Todos los clientes leen de la misma lista compartida
        let sharedNotifications = getFromStorage(SHARED_NOTIFICATIONS_KEY, []);
        
        console.log(`CLIENTE: Cargando notificaciones COMPARTIDAS. Total: ${sharedNotifications.length}`);
        
        notificationsList.innerHTML = '';
        let anyNotificationMarkedReadThisLoad = false;

        if (sharedNotifications.length === 0) {
            notificationsList.innerHTML = '<li class="no-notifications">No tienes notificaciones.</li>';
            if (markAllReadButton) markAllReadButton.style.display = 'none';
        } else {
            // Ordenar por más nuevas primero, si no vienen ya así
            sharedNotifications.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

            sharedNotifications.forEach(notif => {
                const li = document.createElement('li');
                li.className = notif.read ? 'read' : 'unread'; // El estado 'read' es de la notificación global

                // Si el popup se está abriendo Y esta notificación compartida está como no leída
                if (markDisplayedAsRead && !notif.read) {
                    notif.read = true; // **Marcarla como leída EN LA LISTA COMPARTIDA**
                    anyNotificationMarkedReadThisLoad = true;
                    li.className = 'read'; // Actualizar UI inmediatamente
                }

                const fechaNotif = new Date(notif.timestamp);
                const horaFormateada = fechaNotif.toLocaleTimeString('es-DO', { hour: 'numeric', minute: '2-digit', hour12: true });
                const fechaFormateada = fechaNotif.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });
                const iconoClase = notif.icon || 'fas fa-bullhorn';

                li.innerHTML = `
                    <i class="${iconoClase} notif-icon"></i>
                    <div class="notif-text">
                        ${notif.message}
                        <span class="notif-time">${fechaFormateada} - ${horaFormateada}</span>
                    </div>
                `;
                notificationsList.appendChild(li);
            });

            const unreadCountInSharedList = sharedNotifications.filter(n => !n.read).length;
            if (markAllReadButton) markAllReadButton.style.display = unreadCountInSharedList > 0 ? 'block' : 'none';
        }

        // Si alguna notificación en la lista compartida se marcó como leída, guardar TODA la lista actualizada
        if (anyNotificationMarkedReadThisLoad) {
            saveToStorage(SHARED_NOTIFICATIONS_KEY, sharedNotifications);
        }
        updateNotificationBadgeCount();
    }

    function updateNotificationBadgeCount() {
        if (!notificationBadge) return;
        // El contador se basa en el estado 'read' de la lista compartida
        const sharedNotifications = getFromStorage(SHARED_NOTIFICATIONS_KEY, []);
        const unreadCount = sharedNotifications.filter(n => !n.read).length;
        
        notificationBadge.textContent = unreadCount;
        notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
        notificationBadge.classList.toggle('visible', unreadCount > 0);
    }

    function markAllSharedNotificationsAsRead() {
        let sharedNotifications = getFromStorage(SHARED_NOTIFICATIONS_KEY, []);
        let madeChanges = false;
        sharedNotifications.forEach(notif => {
            if (!notif.read) {
                notif.read = true;
                madeChanges = true;
            }
        });

        if (madeChanges) {
            saveToStorage(SHARED_NOTIFICATIONS_KEY, sharedNotifications); // Guardar la lista compartida actualizada
            loadClientNotifications(false); // Recargar
            if (markAllReadButton) markAllReadButton.style.display = 'none';
        }
    }

    // --- Event Listeners para UI de Notificaciones ---
    if (notificationsButton) {
        notificationsButton.addEventListener('click', () => {
            if (!notificationsSection) return;
            const isVisible = notificationsSection.style.display === 'block';
            notificationsSection.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) {
                loadClientNotifications(true); // Al abrir, marcar las mostradas como leídas (en la lista global)
            }
        });
    }
    if (closeNotificationsButton) {
        closeNotificationsButton.addEventListener('click', () => {
            if (notificationsSection) notificationsSection.style.display = 'none';
        });
    }
    if (markAllReadButton) {
        markAllReadButton.addEventListener('click', markAllSharedNotificationsAsRead);
    }

    // --- Listener de Storage ---
    window.addEventListener('storage', (event) => {
        // Si la lista COMPARTIDA de notificaciones cambió (admin envió una nueva o otro cliente marcó como leída)
        if (event.key === (SHARED_NOTIFICATIONS_KEY + '_event_timestamp')) {
            console.log(`CLIENTE: Evento de storage para SHARED_NOTIFICATIONS. Recargando...`);
            loadClientNotifications(notificationsSection && notificationsSection.style.display === 'block');
        }
        // ... otros listeners (USERS_STORAGE_KEY, ADMIN_DIGITIZED_PACKAGES_KEY)
    });

    // --- Inicialización ---
    function initializeAccountPage() {
        // ... (loadUserInfo, renderClientPackages, etc. usando currentUserData si existe)
        loadClientNotifications(false); // Carga inicial para el contador
    }
    
    // Ejemplo de loadUserInfo para mostrar el nombre del usuario logueado
    function loadUserInfo() {
        if(currentUserData && document.getElementById('headerUserName') && document.getElementById('welcomeName')) {
            document.getElementById('headerUserName').textContent = currentUserData.fullName;
            document.getElementById('welcomeName').textContent = currentUserData.fullName;
        }
        // ... resto de loadUserInfo
    }

    initializeAccountPage();
});

// --- cliente.js (Recibiendo notificación DIRIGIDA) ---
document.addEventListener('DOMContentLoaded', () => {
    const CURRENT_USER_SESSION_KEY = 'expressboxrd_current_user_session';
    let currentUserData = JSON.parse(localStorage.getItem(CURRENT_USER_SESSION_KEY));

    if (!currentUserData || !currentUserData.expressBoxCode) {
        // --- CLIENTE LOG X ---
        console.error("CLIENTE: No hay datos de sesión de usuario (currentUserData) o falta expressBoxCode. Redirigiendo a login.");
        alert("Sesión no válida o expirada. Por favor, inicia sesión.");
        window.location.href = 'inicio.html';
        return; 
    }

    // --- CLIENTE LOG A ---
    console.log(`CLIENTE: Usuario logueado: ${currentUserData.fullName}, EB Code: ${currentUserData.expressBoxCode}`);

    const notificationsButton = document.getElementById('notificationsButton');
    const notificationBadge = document.getElementById('notificationBadge');
    const notificationsSection = document.getElementById('notificationsSection');
    const notificationsList = document.getElementById('notificationsList');
    const closeNotificationsButton = document.getElementById('closeNotifications'); // Asegúrate que el ID es éste en tu HTML

    const CLIENT_NOTIFICATIONS_KEY_PREFIX = 'expressboxrd_notifications_user_'; // Igual que en admin.js
    const THIS_USER_NOTIFICATIONS_KEY = CLIENT_NOTIFICATIONS_KEY_PREFIX + currentUserData.expressBoxCode;
    const THIS_USER_NOTIFICATIONS_TIMESTAMP_KEY = THIS_USER_NOTIFICATIONS_KEY + '_event_timestamp';

    // --- CLIENTE LOG B ---
    console.log(`CLIENTE: Clave de notificaciones para este usuario: ${THIS_USER_NOTIFICATIONS_KEY}`);
    console.log(`CLIENTE: Clave de timestamp para este usuario: ${THIS_USER_NOTIFICATIONS_TIMESTAMP_KEY}`);

    const getFromStorage = (key, defaultValue = []) => { /* ...tu función... */ };
    const saveToStorage = (key, data) => { /* ...tu función que también actualiza _event_timestamp... */ };

    function loadClientNotifications(markDisplayedAsRead = false) {
        if (!notificationsList) { console.error("CLIENTE: notificationsList no encontrado."); return; }

        let notifications = getFromStorage(THIS_USER_NOTIFICATIONS_KEY, []);
        // --- CLIENTE LOG C ---
        console.log(`CLIENTE: loadClientNotifications - Obtenidas ${notifications.length} notificaciones de ${THIS_USER_NOTIFICATIONS_KEY}:`, JSON.parse(JSON.stringify(notifications)));
        
        notificationsList.innerHTML = '';
        let anyMarkedRead = false;

        if (notifications.length === 0) {
            notificationsList.innerHTML = '<li class="no-notifications">No tienes notificaciones.</li>';
        } else {
            notifications.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)); // Mostrar más nuevas primero
            notifications.forEach(notif => {
                const li = document.createElement('li');
                li.className = notif.read ? 'read' : 'unread';
                if (markDisplayedAsRead && !notif.read) {
                    notif.read = true;
                    anyMarkedRead = true;
                    li.className = 'read';
                }
                // ... (código para construir el innerHTML del li con mensaje, fecha, hora, icono)
                const fechaNotif = new Date(notif.timestamp);
                const horaFormateada = fechaNotif.toLocaleTimeString('es-DO', { hour: 'numeric', minute: '2-digit', hour12: true });
                const fechaFormateada = fechaNotif.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });
                const iconoClase = notif.icon || 'fas fa-info-circle';
                li.innerHTML = `<i class="${iconoClase} notif-icon"></i><div class="notif-text">${notif.message}<span class="notif-time">${fechaFormateada} - ${horaFormateada}</span></div>`;
                notificationsList.appendChild(li);
            });
        }

        if (anyMarkedRead) {
            saveToStorage(THIS_USER_NOTIFICATIONS_KEY, notifications); // Guardar cambios de estado 'read'
        }
        updateNotificationBadgeCount();
    }

    function updateNotificationBadgeCount() {
        if (!notificationBadge) return;
        const notifications = getFromStorage(THIS_USER_NOTIFICATIONS_KEY, []);
        const unreadCount = notifications.filter(n => !n.read).length;
        // --- CLIENTE LOG D ---
        console.log(`CLIENTE: updateNotificationBadgeCount - No leídas: ${unreadCount}`);
        notificationBadge.textContent = unreadCount;
        notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
        notificationBadge.classList.toggle('visible', unreadCount > 0);
    }

    if (notificationsButton) {
        notificationsButton.addEventListener('click', () => {
            if (!notificationsSection) return;
            const isVisible = notificationsSection.style.display === 'block';
            notificationsSection.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) {
                // --- CLIENTE LOG E ---
                console.log("CLIENTE: Abriendo campana, llamando a loadClientNotifications(true)");
                loadClientNotifications(true);
            }
        });
    }
    if (closeNotificationsButton) {  }

    window.addEventListener('storage', (event) => {

        if (event.key === THIS_USER_NOTIFICATIONS_TIMESTAMP_KEY) {

            console.log(`CLIENTE: ¡Evento de storage COINCIDE para MIS notificaciones (${currentUserData.expressBoxCode})! Clave: ${event.key}. Recargando.`);
            loadClientNotifications(notificationsSection && notificationsSection.style.display === 'block');
        }
    });

    function initializeAccountPage() {

        console.log(`CLIENTE: initializeAccountPage - Llamando a loadClientNotifications(false) para el badge inicial.`);
        loadClientNotifications(false);
    }
    initializeAccountPage();
});

document.addEventListener('DOMContentLoaded', () => {

    const CURRENT_USER_SESSION_KEY = 'expressboxrd_current_user_session';
    let currentUserData = JSON.parse(localStorage.getItem(CURRENT_USER_SESSION_KEY));

    if (!currentUserData || !currentUserData.expressBoxCode) {
        alert("No has iniciado sesión. Por favor, inicia sesión para continuar.");
        window.location.href = 'inicio.html';
        return; 
    }

    const notificationsButton = document.getElementById('notificationsButton');
    const notificationBadge = document.getElementById('notificationBadge');
    const notificationsSection = document.getElementById('notificationsSection');
    const notificationsList = document.getElementById('notificationsList');
    const closeNotificationsButton = document.getElementById('closeNotifications'); 

    const CLIENT_NOTIFICATIONS_KEY_PREFIX = 'expressboxrd_notifications_user_';

    const THIS_USER_NOTIFICATIONS_KEY = CLIENT_NOTIFICATIONS_KEY_PREFIX + currentUserData.expressBoxCode;


    const getFromStorage = (key, defaultValue = []) => { /* ... */ };
    const saveToStorage = (key, data) => { /* ... */ };

    function loadClientNotifications(markDisplayedAsRead = false) {
        if (!notificationsList || !notificationsSection) return;

        let notifications = getFromStorage(THIS_USER_NOTIFICATIONS_KEY, []); 
        console.log(`CLIENT (${currentUserData.expressBoxCode}): Loading notifications from key: ${THIS_USER_NOTIFICATIONS_KEY}. Found: ${notifications.length}`);

        notificationsList.innerHTML = ''; 
        let wereAnyNotificationsMarkedRead = false;

        if (notifications.length === 0) {
            notificationsList.innerHTML = '<li class="no-notifications">No tienes notificaciones.</li>';
        } else {
            notifications.forEach(notif => {
            
                const li = document.createElement('li');
                li.className = notif.read ? 'read' : 'unread';
                if (markDisplayedAsRead && !notif.read) {
                    notif.read = true;
                    wereAnyNotificationsMarkedRead = true;
                }
                const date = new Date(notif.timestamp);
                const timeString = date.toLocaleTimeString('es-DO', { hour: 'numeric', minute: '2-digit', hour12: true });
                const fechaFormateada = date.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });
                const iconoClase = notif.icon || 'fas fa-info-circle';
                li.innerHTML = `<i class="${iconoClase} notif-icon"></i><div class="notif-text">${notif.message}<span class="notif-time">${fechaFormateada} - ${horaFormateada}</span></div>`;
                notificationsList.appendChild(li);
            });
            
        }

        if (wereAnyNotificationsMarkedRead) {
            saveToStorage(THIS_USER_NOTIFICATIONS_KEY, notifications); 
        }
        updateNotificationBadgeCount();
    }

    function updateNotificationBadgeCount() {
        if (!notificationBadge) return;
        const notifications = getFromStorage(THIS_USER_NOTIFICATIONS_KEY, []); 
        const unreadCount = notifications.filter(n => !n.read).length;
        notificationBadge.textContent = unreadCount;
        notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
        notificationBadge.classList.toggle('visible', unreadCount > 0);
    }

    window.addEventListener('storage', (event) => {
        if (event.key === (THIS_USER_NOTIFICATIONS_KEY + '_event_timestamp')) {
            console.log(`CLIENT (${currentUserData.expressBoxCode}): Detected change in my notifications. Reloading...`);
            loadClientNotifications(notificationsSection && notificationsSection.style.display === 'block');
        }
    });

    function initializeAccountPage() {
        loadClientNotifications(false); 
    }

});

document.addEventListener('DOMContentLoaded', () => {
    const CURRENT_USER_SESSION_KEY = 'expressboxrd_current_user_session';
    let currentUserData = JSON.parse(localStorage.getItem(CURRENT_USER_SESSION_KEY));

    if (!currentUserData || !currentUserData.expressBoxCode) {
        alert("No has iniciado sesión."); window.location.href = 'inicio.html'; return;
    }

    const planChangeRequestForm = document.getElementById('planChangeRequestForm');
    const requestFullNameInput = document.getElementById('requestFullName');
    const requestEmailInput = document.getElementById('requestEmail');
    const requestedPlanSelect = document.getElementById('requestedPlan');
    const paymentProofInput = document.getElementById('paymentProof');
    const requestCommentInput = document.getElementById('requestComment');
    const planChangeRequestMessage = document.getElementById('planChangeRequestMessage');
    const USERS_STORAGE_KEY = 'expressboxrd_users';
    const PLAN_CHANGE_REQUESTS_KEY = 'expressboxrd_plan_change_requests'; 
    if (planChangeRequestForm) {

        if (requestFullNameInput) requestFullNameInput.value = currentUserData.fullName;
        if (requestEmailInput) requestEmailInput.value = currentUserData.email;

        planChangeRequestForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const requestedPlan = requestedPlanSelect.value;
            const paymentProofFile = paymentProofInput.files[0]; 
            const comment = requestCommentInput.value.trim();

            if (!requestedPlan) {
                showFeedback(planChangeRequestMessage, "Por favor, selecciona el plan deseado.", "error");
                return;
            }
            if (!paymentProofFile) {
                showFeedback(planChangeRequestMessage, "Por favor, adjunta un comprobante de pago.", "error");
                return;
            }


            const paymentProofData = {
                name: paymentProofFile.name,
                type: paymentProofFile.type,
                size: paymentProofFile.size
            };
            if (paymentProofFile.size > 2 * 1024 * 1024) {
                showFeedback(planChangeRequestMessage, "El archivo es demasiado grande (máx 2MB).", "error");
                return;
            }


            let requests = getFromStorage(PLAN_CHANGE_REQUESTS_KEY, []);
            const newRequest = {
                id: 'pcr_' + Date.now() + currentUserData.expressBoxCode.slice(-3),
                clientEBCode: currentUserData.expressBoxCode,
                clientFullName: currentUserData.fullName,
                clientEmail: currentUserData.email,
                requestedPlan: requestedPlan,
                paymentProofInfo: paymentProofData, 
                comment: comment,
                requestTimestamp: new Date().toISOString(),
                status: 'pendiente', 
                adminNotes: '',
                planExpiryTimestamp: null 
            };

            requests.unshift(newRequest);
            saveToStorage(PLAN_CHANGE_REQUESTS_KEY, requests); 

            showFeedback(planChangeRequestMessage, "Solicitud de cambio de plan enviada. Será revisada en aproximadamente 1 hora.", "success");
            planChangeRequestForm.reset();
            if (requestFullNameInput) requestFullNameInput.value = currentUserData.fullName;
            if (requestEmailInput) requestEmailInput.value = currentUserData.email;
        });
    }
    function checkAndHandlePlanExpiration() {
        if (!currentUserData) return;

        const now = Date.now();
        let userProfileModified = false;
        if ((currentUserData.plan === 'premium' || currentUserData.plan === 'intermedio') && currentUserData.planExpiryTimestamp) {
            if (now >= currentUserData.planExpiryTimestamp) {
                console.log(`CLIENTE (${currentUserData.expressBoxCode}): Plan ${currentUserData.plan} ha expirado. Volviendo a básico.`);
                currentUserData.plan = 'basico';
                delete currentUserData.planExpiryTimestamp; 
                userProfileModified = true;

                const userNotifKey = `expressboxrd_notifications_user_${currentUserData.expressBoxCode}`;
                let userNotifs = getFromStorage(userNotifKey, []);
                userNotifs.unshift({
                    id: 'notif_plan_expired_' + Date.now(),
                    message: "Tu suscripción al plan de pago ha expirado y tu cuenta ha vuelto al plan Básico.",
                    timestamp: new Date().toISOString(),
                    icon: 'fas fa-info-circle',
                    read: false
                });
                saveToStorage(userNotifKey, userNotifs);
                if(typeof loadClientNotifications === 'function') loadClientNotifications(); // Actualizar campana
            }
        }

        if (userProfileModified) {
            localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(currentUserData));
            
            let allUsers = getFromStorage(USERS_STORAGE_KEY, []);
            const userIndex = allUsers.findIndex(u => u.expressBoxCode === currentUserData.expressBoxCode);
            if (userIndex > -1) {
                allUsers[userIndex].plan = 'basico';
                delete allUsers[userIndex].planExpiryTimestamp;
                saveToStorage(USERS_STORAGE_KEY, allUsers); 
            }
            if(typeof loadUserInfo === 'function') loadUserInfo();
        }
    }
    function syncCurrentUserSessionWithMasterList() {
        const allUsers = getFromStorage(USERS_STORAGE_KEY, []);
        const storedUserDataFromMasterList = allUsers.find(u => u.expressBoxCode === currentUserData.expressBoxCode);
        if (storedUserDataFromMasterList) {
            let sessionChanged = false;
            if (currentUserData.plan !== storedUserDataFromMasterList.plan) {
                currentUserData.plan = storedUserDataFromMasterList.plan; sessionChanged = true;
            }
            if (currentUserData.planExpiryTimestamp !== storedUserDataFromMasterList.planExpiryTimestamp) {
                currentUserData.planExpiryTimestamp = storedUserDataFromMasterList.planExpiryTimestamp;
                sessionChanged = true;
            }
            
            if (sessionChanged) {
                localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(currentUserData));
                console.log("CLIENTE: Datos de sesión actualizados desde la lista maestra (admin).");
            }
        }
        checkAndHandlePlanExpiration();
    }
    function initializeAccountPage() {
        syncCurrentUserSessionWithMasterList(); 
        if(typeof loadUserInfo === 'function') loadUserInfo();
    }

    initializeAccountPage(); 
    window.addEventListener('storage', (event) => {
        if (event.key === (USERS_STORAGE_KEY + '_event_timestamp')) {
            console.log(`CLIENTE (${currentUserData.expressBoxCode}): Evento de storage para USERS_STORAGE_KEY. Sincronizando y revisando expiración.`);
            syncCurrentUserSessionWithMasterList(); 
            if(typeof loadUserInfo === 'function') loadUserInfo();
        }
    });
});
// --- cliente.js (Con Restricciones de Plan y Rastreo de Uso) ---
document.addEventListener('DOMContentLoaded', () => {
    const CURRENT_USER_SESSION_KEY = 'expressboxrd_current_user_session';
    let currentUserData = JSON.parse(localStorage.getItem(CURRENT_USER_SESSION_KEY));

    if (!currentUserData || !currentUserData.expressBoxCode) {
        alert("No has iniciado sesión."); window.location.href = 'inicio.html'; return;
    }

    // --- CLAVES DE LOCALSTORAGE ADICIONALES PARA RASTREO DE USO ---
    const USER_USAGE_KEY_PREFIX = `expressboxrd_usage_${currentUserData.expressBoxCode}_`; // Ej: expressboxrd_usage_EB-JUAN01_

    // --- DEFINICIÓN DE LÍMITES DEL PLAN ---
    const PLAN_LIMITS = {
        basico: {
            packagesPerMonth: 3,       // Paquetes (activos/nuevos) que puede ver o gestionar al mes
            preAlertsPerMonth: 5,
            canAccessAdvancedFeatures: false,
            canReceivePromoCodes: false
        },
        intermedio: {
            packagesPerMonth: 100,     // O "paquetes enviados/recibidos" si esa es la métrica
            preAlertsPerMonth: 100,
            canAccessAdvancedFeatures: false, // Podría tener acceso a algunas, pero no todas las premium
            canReceivePromoCodes: true // Podría recibir algunos códigos básicos
        },
        premium: {
            packagesPerMonth: Infinity,
            preAlertsPerMonth: Infinity,
            canAccessAdvancedFeatures: true,
            canReceivePromoCodes: true // Recibe los mejores códigos, acceso a eventos
        },
        default: { // Si el plan no está definido
            packagesPerMonth: 0,
            preAlertsPerMonth: 0,
            canAccessAdvancedFeatures: false,
            canReceivePromoCodes: false
        }
    };

    // --- DOM Elements (Asegúrate de tenerlos todos) ---
    // ... (headerUserName, welcomeName, clientPackageTableBody, noPackagesMessage, etc.)
    // ... (preAlertForm, y sus inputs)
    // ... (Elementos para mostrar mensajes de error de límite)
    const preAlertForm = document.getElementById('preAlertForm');
    const preAlertMessage = document.getElementById('preAlertMessage');
    const clientPackageTableBody = document.getElementById('clientPackageTableBody');
    const noPackagesMessage = document.getElementById('noPackagesMessage');
    // ... (otros elementos que podrían deshabilitarse)


    // --- Helper Functions (getFromStorage, saveToStorage, showFeedback) ---
    // ... (tus funciones existentes)

    // --- FUNCIONES DE RASTREO DE USO ---
    function getCurrentMonthYearString() {
        const now = new Date();
        return `${now.getFullYear()}-${now.getMonth() + 1}`; // Formato "YYYY-M"
    }

    function getUserUsageData() {
        const monthYear = getCurrentMonthYearString();
        const usageData = getFromStorage(USER_USAGE_KEY_PREFIX + monthYear, {
            monthIdentifier: monthYear,
            packagesViewedOrManaged: 0, // O la métrica que decidas para "paquetes"
            preAlertsCreated: 0
        });
        // Si la data leída es de un mes anterior, resetearla
        if (usageData.monthIdentifier !== monthYear) {
            usageData.monthIdentifier = monthYear;
            usageData.packagesViewedOrManaged = 0;
            usageData.preAlertsCreated = 0;
            saveUserUsageData(usageData); // Guardar los contadores reseteados
        }
        return usageData;
    }

    function saveUserUsageData(usageData) {
        const monthYear = usageData.monthIdentifier || getCurrentMonthYearString();
        saveToStorage(USER_USAGE_KEY_PREFIX + monthYear, usageData);
    }

    function incrementUsage(itemType) { // itemType puede ser 'packages', 'preAlerts'
        let usage = getUserUsageData();
        if (itemType === 'packages') {
            usage.packagesViewedOrManaged = (usage.packagesViewedOrManaged || 0) + 1;
        } else if (itemType === 'preAlerts') {
            usage.preAlertsCreated = (usage.preAlertsCreated || 0) + 1;
        }
        saveUserUsageData(usage);
        console.log(`CLIENTE (${currentUserData.expressBoxCode}): Uso de ${itemType} incrementado. Data actual:`, usage);
        return usage; // Devuelve el uso actualizado
    }

    function hasReachedLimit(itemType) {
        const userPlanKey = currentUserData.plan || 'default';
        const limits = PLAN_LIMITS[userPlanKey];
        const usage = getUserUsageData();

        if (itemType === 'packages') {
            return usage.packagesViewedOrManaged >= limits.packagesPerMonth;
        } else if (itemType === 'preAlerts') {
            return usage.preAlertsCreated >= limits.preAlertsPerMonth;
        }
        return false; // Límite no definido para este tipo
    }
    
    function getRemainingUsage(itemType) {
        const userPlanKey = currentUserData.plan || 'default';
        const limits = PLAN_LIMITS[userPlanKey];
        const usage = getUserUsageData();
        let currentUsage = 0;
        let limit = Infinity;

        if (itemType === 'packages') {
            currentUsage = usage.packagesViewedOrManaged || 0;
            limit = limits.packagesPerMonth;
        } else if (itemType === 'preAlerts') {
            currentUsage = usage.preAlertsCreated || 0;
            limit = limits.preAlertsPerMonth;
        }
        
        if (limit === Infinity) return Infinity;
        return Math.max(0, limit - currentUsage);
    }


    // --- MODIFICAR `renderClientPackages` para Plan Básico ---
    function renderClientPackages() {
        if (!clientPackageTableBody) return;
        // ... (obtener allPackages de ADMIN_DIGITIZED_PACKAGES_KEY) ...
        const allPackages = getFromStorage('expressboxrd_admin_packages_v3', []);


        const userPlanKey = currentUserData.plan || 'default';
        let displayablePackages = [];

        if (userPlanKey === 'basico') {
            const limit = PLAN_LIMITS.basico.packagesPerMonth;
            const usage = getUserUsageData();
            const canViewCount = limit - (usage.packagesViewedOrManaged || 0);
            
            // Para el plan básico, podríamos mostrar solo los N paquetes más recientes (activos)
            // O, si la restricción es sobre "ver" N paquetes *nuevos* al mes, la lógica es más compleja.
            // Simplificación: Mostramos hasta `limit` paquetes activos.
            // O mostramos todos pero deshabilitamos acciones si se excede.
            // Por ahora, vamos a filtrar la lista de paquetes a mostrar para el básico.
            // Esta lógica de "qué paquetes cuentan" puede ser compleja.
            // Asumamos que son los N paquetes más recientes que no están 'entregado_rd'.
            const activeClientPackages = allPackages.filter(pkg => 
                pkg.clientEBCode === currentUserData.expressBoxCode && 
                !pkg.isUnknown &&
                pkg.status !== 'delivered_rd' // Considerar solo paquetes no entregados para el límite
            ).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)); // Más recientes primero

            displayablePackages = activeClientPackages.slice(0, limit);
            
            if (activeClientPackages.length > limit) {
                 if (noPackagesMessage) { // Usar este elemento para mostrar el aviso
                    noPackagesMessage.innerHTML = `Has alcanzado el límite de visualización de ${limit} paquetes activos para el plan Básico este mes. <a href="#" id="upgradePlanLinkFromPackages">Actualiza tu plan</a> para ver más.`;
                    noPackagesMessage.className = 'info-message warning'; // Añadir una clase para estilizar como advertencia
                    noPackagesMessage.style.display = 'block';
                    const upgradeLink = document.getElementById('upgradePlanLinkFromPackages');
                    if(upgradeLink) upgradeLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        // Lógica para llevar a la sección de cambio de plan, ej:
                        // document.getElementById('requestPlanChangeSection').scrollIntoView({ behavior: 'smooth' });
                        alert("Por favor, dirígete a la sección 'Solicitar Cambio de Plan' para mejorar tu cuenta.");
                    });
                 }
            } else if (noPackagesMessage) {
                 noPackagesMessage.style.display = displayablePackages.length === 0 ? 'block' : 'none';
                 if (displayablePackages.length === 0) noPackagesMessage.textContent = "Aún no tienes paquetes registrados.";
            }

        } else { // Plan Intermedio o Premium
            displayablePackages = allPackages.filter(pkg => 
                pkg.clientEBCode === currentUserData.expressBoxCode && !pkg.isUnknown
            ).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
            if (noPackagesMessage) {
                noPackagesMessage.style.display = displayablePackages.length === 0 ? 'block' : 'none';
                if (displayablePackages.length === 0) noPackagesMessage.textContent = "Aún no tienes paquetes registrados.";
            }
        }
        
        clientPackageTableBody.innerHTML = '';
        if (displayablePackages.length > 0) {
            displayablePackages.forEach(pkg => {
                // ... (tu lógica para crear la fila de la tabla, como antes) ...
                const row = clientPackageTableBody.insertRow();
                // ... (innerHTML para la fila)
            });
            // ... (listeners para botones de acción en la tabla)
        }
        // No se incrementa 'packagesViewedOrManaged' aquí, eso debería ser por una acción más específica
        // como "registrar llegada" o si la restricción es sobre la *cantidad de paquetes activos* que pueden tener.
        // Si la restricción de "3 paquetes por mes" para el básico se refiere a la cantidad
        // de paquetes que pueden *procesar* o *recibir* ese mes, el incremento debe hacerse
        // cuando un paquete se asocia a su cuenta y cambia a un estado relevante.
        // Por ahora, el límite se aplica a la *visualización* de paquetes activos.
    }


    // --- MODIFICAR Formulario de Pre-Alerta ---
    if (preAlertForm) {
        const userPlanKey = currentUserData.plan || 'default';
        const preAlertLimit = PLAN_LIMITS[userPlanKey].preAlertsPerMonth;
        const remainingPreAlerts = getRemainingUsage('preAlerts');

        if (preAlertLimit !== Infinity) {
            const usageInfoEl = document.createElement('p');
            usageInfoEl.className = 'form-usage-info';
            usageInfoEl.innerHTML = `Pre-alertas este mes: ${PLAN_LIMITS[userPlanKey].preAlertsPerMonth - remainingPreAlerts} / ${preAlertLimit}. Te quedan: <strong>${remainingPreAlerts}</strong>.`;
            preAlertForm.insertBefore(usageInfoEl, preAlertForm.firstChild); // Mostrar antes del form
        }


        preAlertForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const submitButton = preAlertForm.querySelector('button[type="submit"]');

            if (hasReachedLimit('preAlerts')) {
                showFeedback(preAlertMessage, `Has alcanzado el límite de ${PLAN_LIMITS[currentUserData.plan || 'default'].preAlertsPerMonth} pre-alertas para tu plan este mes.`, "error");
                return;
            }
            
            submitButton.disabled = true; // Deshabilitar mientras se procesa

            // ... (tu lógica de validación y creación del objeto newPreAlert)
            const tracking = document.getElementById('originalTracking').value.trim(); // Asegúrate que estos IDs existen
            // ... obtener otros valores ...
            if (!tracking /* || otras validaciones */) {
                showFeedback(preAlertMessage, "Datos de pre-alerta incompletos.", "error");
                submitButton.disabled = false; return;
            }

            const newPreAlert = { /* ... datos de la pre-alerta ... */ };
            let preAlerts = getFromStorage('expressboxrd_all_prealerts', []); // ALL_PREALERTS_KEY
            preAlerts.unshift(newPreAlert);
            saveToStorage('expressboxrd_all_prealerts', preAlerts);
            
            incrementUsage('preAlerts'); // Incrementar después de guardar exitosamente
            showFeedback(preAlertMessage, 'Pre-alerta enviada exitosamente.', 'success');
            preAlertForm.reset();
            
            // Actualizar el display de uso restante
            const updatedRemaining = getRemainingUsage('preAlerts');
            const usageInfoEl = preAlertForm.querySelector('.form-usage-info');
            if (usageInfoEl && preAlertLimit !== Infinity) {
                 usageInfoEl.innerHTML = `Pre-alertas este mes: ${preAlertLimit - updatedRemaining} / ${preAlertLimit}. Te quedan: <strong>${updatedRemaining}</strong>.`;
            }
            submitButton.disabled = false;
        });
    }

    // --- DESHABILITAR/OCULTAR FUNCIONALIDADES BASADO EN EL PLAN ---
    function applyPlanRestrictionsToUI() {
        const userPlanKey = currentUserData.plan || 'default';
        const limits = PLAN_LIMITS[userPlanKey];

        // Ejemplo: Si el plan básico no puede acceder a "Autorizar Retiro a Tercero"
        const authorizeSection = document.getElementById('authorizePickupSection'); // Asume que tienes esta sección
        if (authorizeSection && userPlanKey === 'basico') {
            authorizeSection.style.display = 'none'; // Ocultar la sección
            // O podrías mostrar un mensaje "Actualiza tu plan para usar esta función"
        }

        // Ejemplo: Mensaje sobre acceso anticipado para Premium
        const advancedFeaturesPlaceholder = document.getElementById('advancedFeaturesInfo'); // Un div que podrías añadir
        if (advancedFeaturesPlaceholder) {
            if (limits.canAccessAdvancedFeatures) {
                advancedFeaturesPlaceholder.innerHTML = '<p class="info-message success"><i class="fas fa-star"></i> ¡Como miembro Premium, tienes acceso a funcionalidades anticipadas!</p>';
                advancedFeaturesPlaceholder.style.display = 'block';
            } else {
                advancedFeaturesPlaceholder.style.display = 'none';
            }
        }
        
        // Ejemplo: Mensaje sobre códigos promocionales para Premium
        const promoCodeInfo = document.getElementById('promoCodeInfo'); // Otro div placeholder
        if (promoCodeInfo) {
            if (limits.canReceivePromoCodes && userPlanKey === 'premium') {
                 promoCodeInfo.innerHTML = '<p class="info-message success"><i class="fas fa-tags"></i> Revisa tu correo para códigos promocionales exclusivos y acceso a eventos Premium.</p>';
                 promoCodeInfo.style.display = 'block';
            } else {
                promoCodeInfo.style.display = 'none';
            }
        }
    }

    // --- Modificar `loadUserInfo` para mostrar beneficios que reflejen restricciones ---
    // En el modal de beneficios del plan, podrías añadir dinámicamente los límites:
    // if (myPlanSection && planBenefitsModal ...) {
    //     myPlanSection.addEventListener('click', () => {
    //         ...
    //         const userPlanKey = currentUserData.plan || 'default';
    //         const limits = PLAN_LIMITS[userPlanKey];
    //         currentPlan.benefits.push(`Límite de pre-alertas: ${limits.preAlertsPerMonth === Infinity ? 'Ilimitadas' : limits.preAlertsPerMonth}/mes.`);
    //         currentPlan.benefits.push(`Límite de paquetes (Básico): ${limits.packagesPerMonth === Infinity ? 'Ilimitados' : limits.packagesPerMonth}/mes activos.`);
    //         ... (renderizar beneficios) ...
    //     });
    // }


    // --- Inicialización de la Página y Sincronización ---
    function initializeAccountPage() {
        // ... (syncCurrentUserSessionWithMasterList() que llama a checkAndHandlePlanExpiration())
        // ... (loadUserInfo())
        renderClientPackages(); // Renderizar paquetes aplicando límites si es plan básico
        // ... (loadClientNotifications, loadAutopayStatus, loadClientAddress)
        applyPlanRestrictionsToUI(); // Ocultar/mostrar funcionalidades según el plan
    }

    // ... (El resto de tu cliente.js, incluyendo checkAndHandlePlanExpiration, y la llamada a initializeAccountPage)
    // ... (Storage listener también debe llamar a applyPlanRestrictionsToUI después de syncCurrentUserSessionWithMasterList y loadUserInfo)

    // Ejemplo de cómo podría verse el listener de storage modificado:
    // window.addEventListener('storage', (event) => {
    //     if (event.key === (USERS_STORAGE_KEY + '_event_timestamp')) {
    //         syncCurrentUserSessionWithMasterList(); // Esto ya llama a checkAndHandlePlanExpiration
    //         loadUserInfo();
    //         applyPlanRestrictionsToUI(); // Re-aplicar restricciones por si el plan cambió
    //         if(typeof loadAutopayStatus === 'function') loadAutopayStatus();
    //         if(typeof loadClientAddress === 'function') loadClientAddress();
    //     }
    //     // ... otros listeners ...
    // });

    initializeAccountPage();
});
// --- cliente.js (Con Restricciones de UI Más Estrictas) ---
document.addEventListener('DOMContentLoaded', () => {
    const CURRENT_USER_SESSION_KEY = 'expressboxrd_current_user_session';
    let currentUserData = JSON.parse(localStorage.getItem(CURRENT_USER_SESSION_KEY));

    if (!currentUserData || !currentUserData.expressBoxCode) {
        alert("No has iniciado sesión."); window.location.href = 'inicio.html'; return;
    }

    const USER_USAGE_KEY_PREFIX = `expressboxrd_usage_${currentUserData.expressBoxCode}_`;

    const PLAN_LIMITS = {
        basico: {
            packagesPerMonth: 3, preAlertsPerMonth: 5,
            canRequestPlanChange: true, // Todos pueden solicitar cambio
            canAuthorizeThirdPartyPickup: false, // NUEVA RESTRICCIÓN
            canAccessSupportTickets: true, // Asumimos que todos pueden pedir soporte
            canNotifyPickup: true // Asumimos que todos pueden notificar retiro
        },
        intermedio: {
            packagesPerMonth: 100, preAlertsPerMonth: 100,
            canRequestPlanChange: true,
            canAuthorizeThirdPartyPickup: true, // Intermedio sí puede
            canAccessSupportTickets: true,
            canNotifyPickup: true
        },
        premium: {
            packagesPerMonth: Infinity, preAlertsPerMonth: Infinity,
            canRequestPlanChange: true, // Aunque ya sea premium, podría querer renovar o cambiar en el futuro
            canAuthorizeThirdPartyPickup: true,
            canAccessSupportTickets: true,
            canNotifyPickup: true,
            // canAccessExclusiveEvents: true, // Para futura referencia
        },
        default: { packagesPerMonth: 0, preAlertsPerMonth: 0, canRequestPlanChange: false, canAuthorizeThirdPartyPickup: false, canAccessSupportTickets: false, canNotifyPickup: false }
    };

    // --- DOM Elements ---
    // ... (todos tus elementos DOM existentes)
    const preAlertForm = document.getElementById('preAlertForm');
    const preAlertSubmitButton = preAlertForm ? preAlertForm.querySelector('button[type="submit"]') : null;
    const preAlertMessage = document.getElementById('preAlertMessage'); // Para mensajes de límite

    const myPackagesSection = document.getElementById('myPackagesSection'); // Para mostrar mensaje de límite
    const noPackagesMessage = document.getElementById('noPackagesMessage');

    // Ejemplo de secciones/formularios a restringir
    const authorizePickupSection = document.getElementById('authorizePickupSection'); // Asume que tienes este ID para la sección "Autorizar Retiro a Tercero"
    const planChangeRequestSection = document.getElementById('requestPlanChangeSection'); // Para la solicitud de cambio de plan
    const supportSection = document.getElementById('supportSection');
    const notifyPickupSection = document.getElementById('notifyPickupSection');


    // --- Helper Functions y Rastreo de Uso (getUserUsageData, saveUserUsageData, etc. como antes) ---
    // ...

    // --- APLICAR RESTRICCIONES A LA UI ---
    function applyPlanRestrictionsToUI() {
        if (!currentUserData) return;
        const userPlanKey = currentUserData.plan || 'default';
        const limits = PLAN_LIMITS[userPlanKey];
        const usage = getUserUsageData(); // Para verificar cuotas

        console.log(`CLIENTE (${currentUserData.expressBoxCode}): Aplicando restricciones para plan: ${userPlanKey}`, limits);

        // 1. Formulario de Pre-Alerta
        if (preAlertForm && preAlertSubmitButton) {
            const remainingPreAlerts = Math.max(0, limits.preAlertsPerMonth - (usage.preAlertsCreated || 0));
            if (limits.preAlertsPerMonth !== Infinity && remainingPreAlerts <= 0) {
                preAlertSubmitButton.disabled = true;
                preAlertSubmitButton.title = "Límite de pre-alertas alcanzado para tu plan.";
                if (preAlertMessage) showFeedback(preAlertMessage, `Has alcanzado el límite de ${limits.preAlertsPerMonth} pre-alertas. Actualiza tu plan para más.`, "info");
                // Ocultar el formulario por completo: preAlertForm.style.display = 'none';
            } else {
                preAlertSubmitButton.disabled = false;
                preAlertSubmitButton.title = "";
                if (preAlertMessage && preAlertMessage.textContent.includes("Has alcanzado el límite")) {
                    preAlertMessage.style.display = 'none'; // Ocultar mensaje de límite si ya no aplica
                }
            }
             // Mostrar información de uso si hay límite
            const usageInfoElPreAlert = preAlertForm.querySelector('.form-usage-info');
            if (usageInfoElPreAlert && limits.preAlertsPerMonth !== Infinity) {
                usageInfoElPreAlert.innerHTML = `Pre-alertas este mes: ${usage.preAlertsCreated || 0} / ${limits.preAlertsPerMonth}. Te quedan: <strong>${remainingPreAlerts}</strong>.`;
            } else if (usageInfoElPreAlert) {
                usageInfoElPreAlert.innerHTML = `Pre-alertas: <strong>Ilimitadas</strong>.`;
            }
        }

        // 2. Visualización de Paquetes (para Plan Básico)
        // La lógica de renderClientPackages ya limita la visualización. Aquí podríamos añadir un mensaje más general.
        if (myPackagesSection && userPlanKey === 'basico') {
            const activePackagesLimit = limits.packagesPerMonth;
            // (La lógica de contar paquetes activos vs el límite ya está en renderClientPackages)
            // Aquí podríamos mostrar un mensaje general en la sección si se quiere.
            // Por ejemplo, añadir un <p id="packageLimitInfoBasic" class="info-message warning" style="display:none;"></p>
            // y luego:
            // const packageLimitInfoEl = document.getElementById('packageLimitInfoBasic');
            // if (packageLimitInfoEl && usage.packagesViewedOrManaged >= activePackagesLimit) {
            //    packageLimitInfoEl.textContent = `Plan Básico: Límite de ${activePackagesLimit} paquetes activos/mes alcanzado.`;
            //    packageLimitInfoEl.style.display = 'block';
            // } else if (packageLimitInfoEl) {
            //    packageLimitInfoEl.style.display = 'none';
            // }
        }


        // 3. Sección "Autorizar Retiro a Tercero"
        if (authorizePickupSection) {
            if (!limits.canAuthorizeThirdPartyPickup) {
                authorizePickupSection.innerHTML = `<div class="info-message error">Esta funcionalidad no está disponible para tu plan actual. <a href="#" class="upgrade-plan-link">Actualiza tu plan</a>.</div>`;
                // O: authorizePickupSection.style.display = 'none';
            } else {
                authorizePickupSection.style.display = 'block'; // Asegurarse que esté visible si tiene permiso
                // (Si se ocultó antes y el plan cambió, hay que volver a mostrarlo)
            }
        }
        
        // 4. Solicitud de Cambio de Plan
        if (planChangeRequestSection) {
            if (!limits.canRequestPlanChange) { // Aunque ahora todos pueden, esto es un ejemplo
                planChangeRequestSection.innerHTML = `<div class="info-message error">No puedes solicitar cambios de plan en este momento.</div>`;
            } else {
                planChangeRequestSection.style.display = 'block';
            }
        }
        
        // 5. Acceso a Soporte y Notificar Retiro (Generalmente habilitado para todos)
        if(supportSection && !limits.canAccessSupportTickets){
            supportSection.innerHTML = `<div class="info-message error">El envío de tickets de soporte no está disponible para tu plan.</div>`;
        }
        if(notifyPickupSection && !limits.canNotifyPickup){
            notifyPickupSection.innerHTML = `<div class="info-message error">La notificación de retiro no está disponible para tu plan.</div>`;
        }


        // Añadir listeners a los enlaces "Actualiza tu plan"
        document.querySelectorAll('.upgrade-plan-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // document.getElementById('requestPlanChangeSection').scrollIntoView({ behavior: 'smooth' });
                alert("Por favor, dirígete a la sección 'Solicitar Cambio de Plan' para mejorar tu cuenta.");
            });
        });
    }

    // --- MODIFICAR Formulario de Pre-Alerta (El listener de submit ya tiene el chequeo) ---
    // (El código del listener de 'submit' para preAlertForm que te di antes ya incluye:)
    // if (hasReachedLimit('preAlerts')) {
    //     showFeedback(preAlertMessage, `Has alcanzado el límite...`, "error");
    //     return;
    // }
    // ... y luego incrementUsage('preAlerts');

    // --- INICIALIZACIÓN y OTROS LISTENERS ---
    function initializeAccountPage() {
        if (!currentUserData) return;
        // syncCurrentUserSessionWithMasterList(); // Asegúrate que esta función existe y se llama
        // loadUserInfo(); // Asegúrate que esta función existe y se llama
        // renderClientPackages();
        
        // LLAMAR A applyPlanRestrictionsToUI DESPUÉS de que currentUserData (y su plan) esté establecido y la UI base cargada
        applyPlanRestrictionsToUI();
        
        // ... (resto de tus inicializaciones: notificaciones, autopay, etc.)
    }

    // El listener de 'storage' para USERS_STORAGE_KEY también debe llamar a applyPlanRestrictionsToUI
    // window.addEventListener('storage', (event) => {
    //     if (event.key === (USERS_STORAGE_KEY + '_event_timestamp')) {
    //         syncCurrentUserSessionWithMasterList(); 
    //         loadUserInfo();
    //         applyPlanRestrictionsToUI(); // MUY IMPORTANTE: Re-aplicar restricciones si el plan cambió
    //         // ... (otros actualizadores de UI)
    //     }
    //     // ...
    // });

    // Para que este ejemplo sea autocontenido, simulo la inicialización
    if (currentUserData) { // Solo si hay un usuario
        // Primero, crear el elemento para info de uso de pre-alertas si no existe
        if (preAlertForm && !preAlertForm.querySelector('.form-usage-info')) {
            const usageInfoEl = document.createElement('p');
            usageInfoEl.className = 'form-usage-info info-message'; // Estilo para que se vea bien
            usageInfoEl.style.marginBottom = "1rem";
            usageInfoEl.style.fontSize = "0.85rem";
            preAlertForm.insertBefore(usageInfoEl, preAlertForm.firstChild);
        }
        initializeAccountPage(); // Llama a tu función de inicialización principal
    }
});
// --- cliente.js (Con Bloqueo Proactivo de Formularios) ---
document.addEventListener('DOMContentLoaded', () => {
    const CURRENT_USER_SESSION_KEY = 'expressboxrd_current_user_session';
    let currentUserData = JSON.parse(localStorage.getItem(CURRENT_USER_SESSION_KEY));

    if (!currentUserData || !currentUserData.expressBoxCode) {
        alert("No has iniciado sesión. Serás redirigido.");
        window.location.href = 'inicio.html';
        return;
    }

    // --- CONSTANTES Y DEFINICIONES DE PLAN (como en respuestas anteriores) ---
    const PLAN_LIMITS = {
        basico: {
            packagesPerMonth: 3, preAlertsPerMonth: 5,
            canRequestPlanChange: true,
            canAuthorizeThirdPartyPickup: false, // Básico NO PUEDE autorizar a terceros
            canUseSomeOtherFeature: false       // Ejemplo de otra característica restringida
        },
        intermedio: {
            packagesPerMonth: 100, preAlertsPerMonth: 100,
            canRequestPlanChange: true,
            canAuthorizeThirdPartyPickup: true,  // Intermedio SÍ PUEDE
            canUseSomeOtherFeature: true
        },
        premium: {
            packagesPerMonth: Infinity, preAlertsPerMonth: Infinity,
            canRequestPlanChange: true,
            canAuthorizeThirdPartyPickup: true,
            canUseSomeOtherFeature: true
        },
        default: { /* ... valores restrictivos por defecto ... */ }
    };
    const USER_USAGE_KEY_PREFIX = `expressboxrd_usage_${currentUserData.expressBoxCode}_`;

    // --- DOM Elements (Asegúrate que estos IDs existen en tu cuenta.html) ---
    // Formularios y sus contenedores/secciones
    const preAlertForm = document.getElementById('preAlertForm');
    const preAlertSubmitButton = preAlertForm ? preAlertForm.querySelector('button[type="submit"]') : null;
    const preAlertFormRestrictionMessage = document.getElementById('preAlertFormRestrictionMessage'); // Un <p> o <div> para el mensaje

    const authorizePickupSection = document.getElementById('authorizePickupSection'); // La <section> completa
    const authorizePickupForm = document.getElementById('authorizePickupForm');     // El <form> dentro de la sección

    // ... (otros elementos DOM necesarios para otras funcionalidades)

    // --- Helper Functions (getFromStorage, saveToStorage, showFeedback, getUserUsageData, hasReachedLimit) ---
    // ... (Estas funciones deben estar definidas como en respuestas anteriores) ...
    const getFromStorage = (key, defaultValue = []) => { /* ... */ };
    const saveToStorage = (key, data) => { /* ... */ };
    function showFeedback(element, message, type = 'info') { /* ... */ }
    function getUserUsageData() { /* ... */ }
    function incrementUsage(itemType) { /* ... */ }
    function hasReachedLimit(itemType) { /* ... */ }


    // --- FUNCIÓN CENTRAL PARA APLICAR RESTRICCIONES A LA UI ---
    function applyPlanRestrictionsToUI() {
        if (!currentUserData) return;
        const userPlanKey = currentUserData.plan || 'default';
        const limits = PLAN_LIMITS[userPlanKey];
        const usage = getUserUsageData(); // Para verificar cuotas si la restricción es por uso

        console.log(`CLIENTE (${currentUserData.expressBoxCode}): Aplicando restricciones UI para plan: ${userPlanKey}`);

        // 1. Formulario de Pre-Alerta (Restricción por CUOTA)
        if (preAlertForm) {
            if (preAlertSubmitButton) { // Solo si el botón existe
                if (hasReachedLimit('preAlerts')) {
                    preAlertSubmitButton.disabled = true;
                    preAlertSubmitButton.title = "Límite de pre-alertas alcanzado para tu plan.";
                    if (preAlertFormRestrictionMessage) { // Mostrar mensaje de restricción
                        preAlertFormRestrictionMessage.innerHTML = `Has alcanzado el límite de ${limits.preAlertsPerMonth} pre-alertas para tu plan. <a href="#" class="upgrade-plan-link-inline">Actualiza tu plan</a> para enviar más.`;
                        preAlertFormRestrictionMessage.className = 'form-restriction-message visible error'; // Clase para estilizar
                        preAlertFormRestrictionMessage.style.display = 'block';
                    }
                    // Opcional: Deshabilitar todos los campos del formulario de pre-alerta
                    preAlertForm.querySelectorAll('input, textarea, select').forEach(el => el.disabled = true);
                } else {
                    preAlertSubmitButton.disabled = false;
                    preAlertSubmitButton.title = "";
                    if (preAlertFormRestrictionMessage) preAlertFormRestrictionMessage.style.display = 'none';
                     preAlertForm.querySelectorAll('input, textarea, select').forEach(el => el.disabled = false);
                }
            }
            // Actualizar contador de uso de pre-alertas (si lo tienes visible)
            const preAlertUsageInfo = preAlertForm.querySelector('.form-usage-info'); // Asume que tienes este elemento
            if (preAlertUsageInfo && limits.preAlertsPerMonth !== Infinity) {
                const remainingPreAlerts = Math.max(0, limits.preAlertsPerMonth - (usage.preAlertsCreated || 0));
                preAlertUsageInfo.innerHTML = `Pre-alertas este mes: ${usage.preAlertsCreated || 0} / ${limits.preAlertsPerMonth}. Restantes: <strong>${remainingPreAlerts}</strong>.`;
            } else if (preAlertUsageInfo) {
                preAlertUsageInfo.innerHTML = `Pre-alertas: <strong>Ilimitadas</strong>.`;
            }
        }

        // 2. Sección "Autorizar Retiro a Tercero" (Restricción por PLAN)
        if (authorizePickupSection) { // El contenedor de toda la sección
            if (!limits.canAuthorizeThirdPartyPickup) {
                // Opción: Reemplazar contenido de la sección con un mensaje de bloqueo
                authorizePickupSection.innerHTML = `
                    <div class="section-restriction-message">
                        <i class="fas fa-lock"></i>
                        <h3>Función no disponible</h3>
                        <p>La autorización de retiro a terceros no está incluida en tu plan ${planDisplayNames[userPlanKey] || userPlanKey}.</p>
                        <a href="#" class="btn btn-naranja btn-small upgrade-plan-link-inline">Mejorar mi Plan</a>
                    </div>`;
                authorizePickupSection.style.padding = "2rem"; // Ajustar padding si el contenido cambia mucho
            } else {
                // Asegurarse de que el contenido original esté visible si el usuario SÍ tiene permiso
                // Esto es importante si el plan cambia y antes estaba oculto.
                // Necesitarías una forma de restaurar el contenido original del formulario si lo borraste con innerHTML.
                // Una mejor manera es tener el formulario siempre en el HTML y solo mostrar/ocultar un overlay de bloqueo.
                // O, si usaste style.display = 'none' para el form, aquí lo vuelves a mostrar:
                if (authorizePickupForm) authorizePickupForm.style.display = 'block'; // O 'grid', 'flex' según su layout original
            }
        }
        
        // 3. Ejemplo: Otra funcionalidad que solo es para Premium
        const somePremiumFeatureSection = document.getElementById('somePremiumFeatureSection');
        if (somePremiumFeatureSection) {
            if (userPlanKey !== 'premium') {
                somePremiumFeatureSection.innerHTML = `
                    <div class="section-restriction-message">
                        <i class="fas fa-crown"></i>
                        <h3>Exclusivo para Premium</h3>
                        <p>Esta funcionalidad avanzada está disponible solo para nuestros miembros Premium.</p>
                        <a href="#" class="btn btn-naranja btn-small upgrade-plan-link-inline">Ver Planes Premium</a>
                    </div>`;
            } else {
                 // Mostrar contenido original de la sección premium
            }
        }


        // Re-adjuntar listeners a los enlaces "Actualiza tu plan" si se regeneran dinámicamente
        document.querySelectorAll('.upgrade-plan-link-inline').forEach(link => {
            link.onclick = function(e) { 
                e.preventDefault();
                const planChangeSection = document.getElementById('requestPlanChangeSection');
                if (planChangeSection) {
                    planChangeSection.scrollIntoView({ behavior: 'smooth' });
                    // Opcional: abrir directamente el select o enfocar un campo
                    const requestedPlanSelect = document.getElementById('requestedPlan');
                    if(requestedPlanSelect) requestedPlanSelect.focus();

                } else {
                    alert("Dirígete a la sección 'Solicitar Cambio de Plan' para mejorar tu cuenta.");
                }
            };
        });
    }


    // --- MODIFICAR MANEJADOR DE SUBMIT DE PRE-ALERTA ---
    // El chequeo principal de si puede o no enviar se hace ahora en applyPlanRestrictionsToUI
    // que deshabilita el botón o bloquea el form. El listener de submit aún se ejecuta si el botón no está deshabilitado.
    if (preAlertForm) {
        preAlertForm.addEventListener('submit', function(event) { // Usar 'function' para que 'this' sea el formulario
            event.preventDefault(); 
            const submitButton = this.querySelector('button[type="submit"]');

            // Doble chequeo, aunque la UI ya debería estar restringida
            if (hasReachedLimit('preAlerts')) {
                showFeedback(preAlertMessage, `Has alcanzado el límite de pre-alertas para tu plan este mes.`, "error");
                // Botón ya debería estar deshabilitado por applyPlanRestrictionsToUI si se llamó correctamente
                return; 
            }
            
            if(submitButton) { submitButton.disabled = true; /* ... Enviando ... */ }

            // ... (tu lógica existente para recolectar datos del formulario de pre-alerta)
            // ... (crear el objeto newPreAlert)
            // ... (guardar en LocalStorage: saveToStorage(ALL_PREALERTS_KEY, preAlerts);)
            
            incrementUsage('preAlerts'); // Incrementar uso DESPUÉS de un envío exitoso
            showFeedback(preAlertMessage, 'Pre-alerta enviada exitosamente.', 'success');
            this.reset(); // 'this' es el formulario
            
            applyPlanRestrictionsToUI(); // Actualizar UI y contadores de uso inmediatamente
            
            if(submitButton) { submitButton.disabled = false; /* ... Texto original del botón ... */ }
        });
    }


    // --- INICIALIZACIÓN Y LISTENER DE STORAGE ---
    function initializeAccountPage() {
        if (!currentUserData) return;
        // syncCurrentUserSessionWithMasterList(); // Asegúrate que esta función actualiza currentUserData.plan
        // loadUserInfo();
        
        applyPlanRestrictionsToUI(); // Aplicar restricciones al cargar la página
        
        // ... (otras inicializaciones: renderClientPackages, notificaciones, etc.)
    }

    window.addEventListener('storage', (event) => {
        if (event.key === ('expressboxrd_users' + '_event_timestamp')) { // USERS_STORAGE_KEY
            // syncCurrentUserSessionWithMasterList(); // Sincroniza y actualiza currentUserData
            // loadUserInfo();
            applyPlanRestrictionsToUI(); // RE-APLICAR restricciones si el plan cambió
            // ... (otros actualizadores de UI)
        }
        // ... otros listeners de storage
    });
    
    // Asegúrate de que tu función de sincronización de sesión y carga de info de usuario existan
    function syncCurrentUserSessionWithMasterList() { /* ... tu lógica ... */ }
    function loadUserInfo() { /* ... tu lógica ... */ }

    // Llamada inicial
    if (currentUserData) {
        initializeAccountPage();
    }
});