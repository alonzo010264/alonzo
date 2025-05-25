// --- admin-panel-maestro-script.js (Refined based on original structure) ---
document.addEventListener('DOMContentLoaded', () => {
    // --- PREDEFINED CLIENT EB Code for easy targeting by admin ---
    const TARGET_CLIENT_EB_CODE = "EB-CLIENT001"; // Matches cliente.js

    // --- Elementos DOM Generales ---
    const sidebarNav = document.querySelector('.sidebar-nav');
    const contentAreaAdmin = document.querySelector('.content-area-admin'); // Ensure this is correct
    const allAdminSections = contentAreaAdmin ? contentAreaAdmin.querySelectorAll('.admin-section') : []; // Graceful check
    const sectionTitleHeader = document.getElementById('sectionTitle');

    // --- Elementos DOM Usuarios ---
    const userListTableBody = document.getElementById('adminUserListTableBody');
    const noUsersMessage = document.getElementById('noUsersMessage');
    const searchUsersInput = document.getElementById('searchUsersInput');

    // --- Elementos DOM Digitar Paquete ---
    const digitizePackageForm = document.getElementById('adminDigitizePackageForm');
    const clientEBCodeInput = document.getElementById('adminClientEBCode');
    const adminOriginalTrackingInput = document.getElementById('adminOriginalTracking');
    const adminPackageContentInput = document.getElementById('adminPackageContent');
    const adminDeclaredValueInput = document.getElementById('adminDeclaredValue');
    const adminPackageWeightInput = document.getElementById('adminPackageWeight');
    const adminPackageStatusSelect = document.getElementById('adminPackageStatus');
    const adminIsUnknownCheckbox = document.getElementById('adminIsUnknown');
    const adminPackageMessage = document.getElementById('adminPackageMessage');
    const estimatedTaxesDisplay = document.getElementById('estimatedTaxesDisplay');

    // --- Elementos DOM Ver Paquetes ---
    const adminPackageListTableBody = document.getElementById('adminPackageListTableBody');
    const noAdminPackagesMessage = document.getElementById('noAdminPackagesMessage');
    const searchAdminPackagesInput = document.getElementById('searchAdminPackagesInput');

    // --- Elementos DOM Pre-Alertas ---
    const adminPreAlertsTableBody = document.getElementById('adminPreAlertsTableBody');
    const noPreAlertsMessage = document.getElementById('noPreAlertsMessage');
    const searchPreAlertsInput = document.getElementById('searchPreAlertsInput');

    // --- Elementos DOM Notificaciones (Admin to Client) ---
    const sendNotificationForm = document.getElementById('adminSendNotificationForm');
    const notificationUserEBCodeInput = document.getElementById('notificationUserEBCode');
    const notificationMessageInput = document.getElementById('notificationMessage');
    const notificationFormMessage = document.getElementById('notificationFormMessage');

    // --- Elementos DOM Códigos Promo ---
    const createPromoForm = document.getElementById('adminCreatePromoForm');
    const newPromoCodeInput = document.getElementById('adminNewPromoCode');
    const promoDiscountInput = document.getElementById('adminPromoDiscount');
    const createPromoMessage = document.getElementById('adminCreatePromoMessage');
    const existingPromosList = document.getElementById('adminExistingPromosList');

    // --- Elementos DOM Notificaciones de Retiro (Client to Admin) ---
    const adminPickupNotificationsTableBody = document.getElementById('adminPickupNotificationsTableBody');
    const noPickupNotificationsMessage = document.getElementById('noPickupNotificationsMessage');
    const searchPickupNotificationsInput = document.getElementById('searchPickupNotificationsInput');

    // --- Elementos DOM Dashboard Stat Cards ---
    const statCards = document.querySelectorAll('#dashboard-content .stat-card');


    // --- Claves LocalStorage (Same as your original) ---
    const USERS_STORAGE_KEY = 'expressboxrd_users';
    const ADMIN_DIGITIZED_PACKAGES_KEY = 'expressboxrd_admin_packages_v3';
    const ALL_PREALERTS_KEY = 'expressboxrd_all_prealerts';
    const CLIENT_NOTIFICATIONS_KEY_PREFIX = 'expressboxrd_notifications_user_';
    const PROMO_CODES_KEY_ADMIN = 'expressboxrd_admin_promo_codes_v1';
    const PICKUP_NOTIFICATIONS_KEY = 'expressboxrd_pickup_notifications';


    // --- Constantes & Mappings (Same as your original, ensure they are complete) ---
    const ITBIS_RATE = 0.18;
    const IMPORT_THRESHOLD_USD = 200; // USD
    const ARANCEL_GENERAL_RATE = 0.20; // Example %
    const TASA_CAMBIO_DOP = 59.50; // Example

    const statusMap = { /* ... Your complete statusMap ... */
        'received_warehouse_origin': { text: 'Recibido Origen', class: 'status-received_warehouse_origin', icon: 'fas fa-warehouse' },
        'in_transit_to_rd': { text: 'En Tránsito a RD', class: 'status-in_transit_to_rd', icon: 'fas fa-plane-departure' },
        'customs_rd': { text: 'En Aduanas RD', class: 'status-customs_rd', icon: 'fas fa-building-shield' },
        'ready_for_dispatch_cd': { text: 'Listo en CD', class: 'status-ready_for_dispatch_cd', icon: 'fas fa-dolly-flatbed' },
        'out_for_delivery_rd': { text: 'En Ruta de Entrega', class: 'status-out_for_delivery_rd', icon: 'fas fa-truck-fast' },
        'delivered_rd': { text: 'Entregado', class: 'status-delivered_rd', icon: 'fas fa-house-chimney-user' },
        'pending_payment_customs': { text: 'Impuestos Pendientes', class: 'status-pending_payment_customs', icon: 'fas fa-file-invoice-dollar' },
        'paid_customs': { text: 'Impuestos Pagados', class: 'status-paid_customs', icon: 'fas fa-check-circle' },
        'unknown_package_admin': {text: 'Paquete Desconocido', class: 'status-unknown_package_admin', icon: 'fas fa-question-circle' }
    };
    const planDisplayNames = { /* ... Your planDisplayNames ... */
        premium: 'Premium',
        intermedio: 'Intermedio',
        basico: 'Básico',
        default: 'No Especificado'
    };

    // --- Funciones Auxiliares ---
    const getFromStorage = (key, defaultValue = []) => JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
    const saveToStorage = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
        // Disparar un evento personalizado para notificar a otras pestañas
        localStorage.setItem(key + '_event_timestamp', Date.now()); // Crucial for cross-tab updates
    };
    function showFeedbackAdmin(element, message, type) { // Matches your original signature
        if (!element) return;
        element.textContent = message;
        element.className = `form-feedback-admin ${type}`; // Ensure these classes exist in admin.css
        element.style.display = 'block';
        setTimeout(() => { element.style.display = 'none'; }, 3500);
    }
    function calculateEstimatedTaxes(declaredValueUSD) { // Matches your original signature
        if (isNaN(declaredValueUSD) || declaredValueUSD <= 0) { // Use <= 0
            return 0;
        }
        // Using the constants defined above
        if (declaredValueUSD > IMPORT_THRESHOLD_USD) {
            const importTax = declaredValueUSD * ARANCEL_GENERAL_RATE; // Example: 30% was in original
            const totalBeforeITBIS = declaredValueUSD + importTax;
            const itbis = totalBeforeITBIS * ITBIS_RATE;
            return (importTax + itbis) * TASA_CAMBIO_DOP; // Simpler: Arancel + ITBIS on (Value+Arancel)
        }
        return 0; // No taxes below threshold for this simplified model
    }

    // --- REFINED Navegación del Panel ---
    function navigateToSection(sectionName) {
        if (!allAdminSections.length) {
            console.error("Admin sections not found. Check '.content-area-admin .admin-section' selectors.");
            return;
        }
        const targetSectionId = sectionName + '-content';
        const sidebarLink = sidebarNav ? sidebarNav.querySelector(`a[data-section="${sectionName}"]`) : null;
        
        // Determine section title: from link text or capitalize sectionName
        let title = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
        if (sidebarLink) {
            const iconNode = sidebarLink.querySelector('.icon');
            if (iconNode && iconNode.nextSibling && iconNode.nextSibling.nodeType === Node.TEXT_NODE) {
                title = iconNode.nextSibling.textContent.trim();
            }
        }

        allAdminSections.forEach(section => section.style.display = 'none');
        const targetSection = document.getElementById(targetSectionId);

        if (targetSection) {
            targetSection.style.display = 'block';
            const searchInput = targetSection.querySelector('.search-input-admin');
            if (searchInput) searchInput.focus();
        } else {
            console.warn(`Target section with ID "${targetSectionId}" not found.`);
        }

        if (sectionTitleHeader) sectionTitleHeader.textContent = title;

        if (sidebarNav && sidebarLink) {
            sidebarNav.querySelectorAll('li').forEach(li => li.classList.remove('active'));
            sidebarLink.closest('li').classList.add('active');
        }

        // REFRESH DATA FOR THE DISPLAYED SECTION
        // This is crucial for ensuring data is current when navigating
        switch (sectionName) {
            case 'users': if (typeof renderUserList === "function") renderUserList(searchUsersInput ? searchUsersInput.value : ''); break;
            case 'viewPackages': if (typeof renderAdminPackages === "function") renderAdminPackages(searchAdminPackagesInput ? searchAdminPackagesInput.value : ''); break;
            case 'preAlerts': if (typeof renderAdminPreAlerts === "function") renderAdminPreAlerts(searchPreAlertsInput ? searchPreAlertsInput.value : ''); break;
            case 'pickupNotifications': if (typeof renderAdminPickupNotifications === "function") renderAdminPickupNotifications(searchPickupNotificationsInput ? searchPickupNotificationsInput.value : ''); break;
            case 'promoCodes': if (typeof renderAdminPromoCodes === "function") renderAdminPromoCodes(); break;
            // Add cases for other sections if they need data refresh on view
        }
    }

    if (sidebarNav) {
        sidebarNav.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (link && link.dataset.section) { // Make sure link and data-section exist
                event.preventDefault();
                navigateToSection(link.dataset.section);
            } else if (link && link.getAttribute('href') === 'index.html') {
                // Allow normal navigation for the "Salir" link
                return;
            } else if (link) {
                event.preventDefault(); // Prevent default for other links not handled
                console.warn("Sidebar link clicked without data-section or unhandled href:", link);
            }
        });
    } else {
        console.error("Sidebar navigation element '.sidebar-nav' not found.");
    }

    // --- Dashboard Stat Card Click Functionality ---
    if (statCards.length > 0) {
        statCards.forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                const targetSectionName = card.dataset.sectionTarget; // From admin.html
                if (targetSectionName) {
                    navigateToSection(targetSectionName);
                }
            });
        });
    }


    // --- Lógica Usuarios (From your original structure, adapted) ---
    function renderUserList(filter = '') {
        if (!userListTableBody) return;
        let users = getFromStorage(USERS_STORAGE_KEY, []);

        // Ensure TARGET_CLIENT_EB_CODE (cuenta.html client) is represented
        const predefinedClientIndex = users.findIndex(u => u.expressBoxCode === TARGET_CLIENT_EB_CODE);
        if (predefinedClientIndex === -1) {
            users.unshift({ // Add to the beginning for consistent display if it's the "main" simulated user
                expressBoxCode: TARGET_CLIENT_EB_CODE,
                fullName: "Cliente Principal (Cuenta)",
                email: "cliente@example.com", // Email to display for "cuenta.html"
                plan: "basico",
                autopayEnabled: false,
                registeredAt: new Date(0).toISOString(), // A very old date or specific date
                city: "N/A",
                isPlaceholder: true // Flag for internal use if needed
            });
        } else {
            // Ensure the existing TARGET_CLIENT_EB_CODE user has all necessary fields for display
            const client = users[predefinedClientIndex];
            client.fullName = client.fullName || "Cliente Principal (Cuenta)";
            client.email = client.email || "cliente@example.com";
            client.plan = client.plan || "basico";
            client.autopayEnabled = typeof client.autopayEnabled === 'boolean' ? client.autopayEnabled : false;
            client.registeredAt = client.registeredAt || new Date(0).toISOString();
            client.city = client.city || "N/A";
        }

        userListTableBody.innerHTML = '';
        const filterLower = filter.toLowerCase();
        const filteredUsers = users.filter(u => {
            const searchString = `${u.fullName || ''} ${u.email || ''} ${u.expressBoxCode || ''}`.toLowerCase();
            return filter === '' || searchString.includes(filterLower);
        });

        if (noUsersMessage) noUsersMessage.style.display = filteredUsers.length === 0 ? 'block' : 'none';

        filteredUsers.forEach(user => {
            const row = userListTableBody.insertRow();
            const registeredDate = user.registeredAt && user.registeredAt !== new Date(0).toISOString() 
                                 ? new Date(user.registeredAt).toLocaleDateString('es-DO') 
                                 : (user.isPlaceholder || user.expressBoxCode === TARGET_CLIENT_EB_CODE ? 'N/A (Cuenta Activa)' : 'N/A');
            const planName = planDisplayNames[user.plan || 'default'] || planDisplayNames.default;
            const autopayStatus = user.autopayEnabled ? 'Activo' : 'Inactivo';
            const emailDisplay = user.email || (user.isPlaceholder ? 'cliente@example.com' : 'N/A');

            row.innerHTML = `
                <td>${user.fullName}</td>
                <td>${emailDisplay}</td>
                <td>${user.expressBoxCode}</td>
                <td>${user.city || 'N/A'}</td>
                <td>${planName}</td>
                <td>${autopayStatus}</td>
                <td>${registeredDate}</td>
                <td>
                    <button class="btn-icon-action small-btn" onclick="editUser('${user.expressBoxCode}')" title="Editar Usuario"><i class="fas fa-user-edit"></i></button>
                </td>
            `;
        });
    }
    if (searchUsersInput) searchUsersInput.addEventListener('input', (e) => renderUserList(e.target.value));

    window.editUser = function(userEBCode) { // Global scope for onclick
        let users = getFromStorage(USERS_STORAGE_KEY, []); // Get fresh copy
        let userIndex = users.findIndex(u => u.expressBoxCode === userEBCode);

        // If user doesn't exist (e.g. placeholder wasn't edited yet), create them before editing
        if (userIndex === -1 && userEBCode === TARGET_CLIENT_EB_CODE) {
            users.push({
                expressBoxCode: TARGET_CLIENT_EB_CODE,
                fullName: "Cliente Principal (Cuenta)",
                email: "cliente@example.com",
                plan: "basico",
                autopayEnabled: false,
                registeredAt: new Date().toISOString(), // Give a proper registration date now
                city: "N/A"
            });
            userIndex = users.length - 1; // New index
        } else if (userIndex === -1) {
            alert('Usuario no encontrado.');
            return;
        }

        const user = users[userIndex];

        const newPlan = prompt(`Plan actual para ${user.fullName} (${userEBCode}): ${planDisplayNames[user.plan || 'default']}.\nNuevo plan (basico, intermedio, premium):`, user.plan || 'basico');
        if (newPlan !== null && ['basico', 'intermedio', 'premium'].includes(newPlan.toLowerCase())) {
            users[userIndex].plan = newPlan.toLowerCase();
        }

        const currentAutopayState = users[userIndex].autopayEnabled ? 'Activo' : 'Inactivo';
        if (confirm(`Autopago para ${user.fullName}: ${currentAutopayState}.\n¿Desea cambiar el estado del Autopago?`)) {
            users[userIndex].autopayEnabled = !users[userIndex].autopayEnabled;
        }
        
        users[userIndex].isPlaceholder = false; // Mark as no longer a placeholder if it was
        if (users[userIndex].registeredAt === new Date(0).toISOString()) { // If it had the placeholder date
            users[userIndex].registeredAt = new Date().toISOString(); // Give it a real "edit" date as registered
        }


        saveToStorage(USERS_STORAGE_KEY, users);
        renderUserList(searchUsersInput ? searchUsersInput.value : '');
        showFeedbackAdmin(noUsersMessage, `Usuario ${userEBCode} actualizado.`, 'success');
    };

    // --- Lógica Digitar Paquetes (From your original, ensure all DOM elements are accessed correctly) ---
    if (adminDeclaredValueInput && estimatedTaxesDisplay) { // Check if elements exist
        adminDeclaredValueInput.addEventListener('input', () => {
            const value = parseFloat(adminDeclaredValueInput.value) || 0;
            const taxes = calculateEstimatedTaxes(value);
            estimatedTaxesDisplay.textContent = `RD$ ${taxes.toFixed(2)}`;
        });
    }
    if (adminIsUnknownCheckbox && clientEBCodeInput) { // Check if elements exist
        adminIsUnknownCheckbox.addEventListener('change', () => {
            const isUnknown = adminIsUnknownCheckbox.checked;
            clientEBCodeInput.disabled = isUnknown;
            if (isUnknown) {
                clientEBCodeInput.value = 'DESCONOCIDO-' + Date.now().toString().slice(-6);
                if(adminPackageStatusSelect) adminPackageStatusSelect.value = 'unknown_package_admin';
            } else {
                clientEBCodeInput.value = ''; // Or TARGET_CLIENT_EB_CODE if default desired
                if(adminPackageStatusSelect) adminPackageStatusSelect.value = 'received_warehouse_origin';
            }
        });
    }
    if (digitizePackageForm) {
        digitizePackageForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const clientEBCodeVal = clientEBCodeInput.value.trim().toUpperCase();
            const originalTracking = adminOriginalTrackingInput.value.trim();
            const content = adminPackageContentInput.value.trim();
            const declaredValue = parseFloat(adminDeclaredValueInput.value);
            const weightKg = adminPackageWeightInput ? parseFloat(adminPackageWeightInput.value) : 0; // Handle if input doesn't exist
            const status = adminPackageStatusSelect.value;
            const isUnknown = adminIsUnknownCheckbox.checked;

            if (((!clientEBCodeVal || clientEBCodeVal.startsWith('DESCONOCIDO-')) && !isUnknown) || !content || isNaN(declaredValue) || declaredValue < 0 || isNaN(weightKg) || weightKg <= 0) {
                 showFeedbackAdmin(adminPackageMessage, 'Código EB (o desconocido), contenido, valor y peso válidos son requeridos.', 'error');
                 return;
            }
            
            const users = getFromStorage(USERS_STORAGE_KEY, []);
            const clientUser = users.find(u => u.expressBoxCode === clientEBCodeVal);
            const customerName = clientUser ? clientUser.fullName : (isUnknown ? 'Desconocido' : (clientEBCodeVal === TARGET_CLIENT_EB_CODE ? "Cliente Principal (Cuenta)" : 'Cliente no encontrado'));


            let packages = getFromStorage(ADMIN_DIGITIZED_PACKAGES_KEY, []);
            let existingPackageId = digitizePackageForm.dataset.editingPackageId;
            let existingPackageIndex = existingPackageId ? packages.findIndex(p => p.id === existingPackageId) : -1;

            if (existingPackageIndex === -1 && !isUnknown && clientEBCodeVal && originalTracking) {
                existingPackageIndex = packages.findIndex(p => p.clientEBCode === clientEBCodeVal && p.originalTracking === originalTracking && !p.isUnknown);
            }
            
            const taxes = calculateEstimatedTaxes(declaredValue); // Use the consistent function
            let message = "";

            const packageData = {
                clientEBCode: isUnknown ? clientEBCodeInput.value : clientEBCodeVal,
                customerName, originalTracking, content, declaredValue, pesoKg: weightKg,
                status, isUnknown, taxes,
            };

            if (existingPackageIndex > -1) {
                packages[existingPackageIndex] = { ...packages[existingPackageIndex], ...packageData, lastUpdated: new Date().toISOString() };
                message = `Paquete ID ${packages[existingPackageIndex].id} actualizado.`;
            } else {
                packageData.id = 'pkg_adm_' + Date.now();
                packageData.timestamp = new Date().toISOString();
                packages.unshift(packageData);
                message = `Paquete ${isUnknown ? 'desconocido' : 'para ' + clientEBCodeVal} digitado.`;
            }

            saveToStorage(ADMIN_DIGITIZED_PACKAGES_KEY, packages);
            if(typeof renderAdminPackages === "function") renderAdminPackages();
            showFeedbackAdmin(adminPackageMessage, message, 'success');
            digitizePackageForm.reset();
            delete digitizePackageForm.dataset.editingPackageId;
            if(adminIsUnknownCheckbox) adminIsUnknownCheckbox.checked = false;
            if(clientEBCodeInput) clientEBCodeInput.disabled = false;
            if(estimatedTaxesDisplay) estimatedTaxesDisplay.textContent = 'RD$ 0.00';
        });
    }
    // `renderAdminPackages` function (from your original structure)
    function renderAdminPackages(filter = '') {
        if (!adminPackageListTableBody) return;
        // ... (rest of renderAdminPackages logic from previous correct version, ensuring pesoKg is included)
        const packages = getFromStorage(ADMIN_DIGITIZED_PACKAGES_KEY, []);
        adminPackageListTableBody.innerHTML = '';
        const filterLower = filter.toLowerCase();
        const filtered = packages.filter(p =>
            (p.clientEBCode && p.clientEBCode.toLowerCase().includes(filterLower)) ||
            (p.originalTracking && p.originalTracking.toLowerCase().includes(filterLower)) ||
            (p.customerName && p.customerName.toLowerCase().includes(filterLower)) ||
            (p.content && p.content.toLowerCase().includes(filterLower))
        );
        if(noAdminPackagesMessage) noAdminPackagesMessage.style.display = filtered.length === 0 ? 'block' : 'none';

        filtered.forEach(pkg => {
            const row = adminPackageListTableBody.insertRow();
            const statusInfo = statusMap[pkg.status] || { text: (pkg.status || 'N/A').replace(/_/g, ' '), class: '', icon: 'fas fa-question' };
            const dateObj = new Date(pkg.timestamp);
            const formattedDate = dateObj.toLocaleDateString('es-DO', {day:'2-digit',month:'short', year:'2-digit'});

            row.innerHTML = `
                <td>${pkg.clientEBCode}</td>
                <td>${pkg.originalTracking || 'N/A'}</td>
                <td>${pkg.customerName || (pkg.isUnknown ? '<em>Desconocido</em>' : (pkg.clientEBCode === TARGET_CLIENT_EB_CODE ? "Cliente Principal (Cuenta)" : 'N/A'))}</td>
                <td>${pkg.content ? (pkg.content.substring(0,25) + (pkg.content.length > 25 ? '...' : '')) : 'N/A'}</td>
                <td>$${parseFloat(pkg.declaredValue || 0).toFixed(2)}</td>
                <td>${parseFloat(pkg.pesoKg || 0).toFixed(2)} KG</td>
                <td><span class="status-customs ${statusInfo.class}"><i class="${statusInfo.icon}"></i> ${statusInfo.text}</span></td>
                <td>RD$ ${parseFloat(pkg.taxes || 0).toFixed(2)}</td>
                <td>${formattedDate}</td>
                <td><button class="btn-icon-action small-btn" onclick="editAdminPackage('${pkg.id}')" title="Editar"><i class="fas fa-edit"></i></button></td>
            `;
        });
    }
    if (searchAdminPackagesInput) searchAdminPackagesInput.addEventListener('input', (e) => renderAdminPackages(e.target.value));
    
    // `editAdminPackage` function (from your original structure) - ensure it pre-fills weight
    window.editAdminPackage = function(packageId) { // Global scope
        const packages = getFromStorage(ADMIN_DIGITIZED_PACKAGES_KEY, []);
        const pkgToEdit = packages.find(p => p.id === packageId);
        if (pkgToEdit && digitizePackageForm) {
            clientEBCodeInput.value = (pkgToEdit.isUnknown || !pkgToEdit.clientEBCode) ? '' : pkgToEdit.clientEBCode;
            adminOriginalTrackingInput.value = pkgToEdit.originalTracking || '';
            adminPackageContentInput.value = pkgToEdit.content || '';
            adminDeclaredValueInput.value = pkgToEdit.declaredValue || 0;
            if (adminPackageWeightInput) adminPackageWeightInput.value = pkgToEdit.pesoKg || 0;
            adminPackageStatusSelect.value = pkgToEdit.status || 'received_warehouse_origin';
            if (adminIsUnknownCheckbox) adminIsUnknownCheckbox.checked = pkgToEdit.isUnknown || false;
            if (clientEBCodeInput) clientEBCodeInput.disabled = pkgToEdit.isUnknown || false;

            digitizePackageForm.dataset.editingPackageId = packageId;

            if(adminDeclaredValueInput) adminDeclaredValueInput.dispatchEvent(new Event('input'));
            navigateToSection('digitizePackage'); // Use helper to navigate
            if(clientEBCodeInput) clientEBCodeInput.focus();
            showFeedbackAdmin(adminPackageMessage, `Editando paquete ID: ${packageId}. Realice cambios y guarde.`, 'info');
        } else {
            alert("Paquete no encontrado para editar.");
        }
    };


    // --- Lógica Pre-Alertas (From your original structure) ---
    function renderAdminPreAlerts(filter = '') {
        if (!adminPreAlertsTableBody) return;
        // ... (rest of renderAdminPreAlerts logic from previous correct version, ensuring estimatedWeightKg is displayed)
        const preAlerts = getFromStorage(ALL_PREALERTS_KEY, []);
        adminPreAlertsTableBody.innerHTML = '';
        const filterLower = filter.toLowerCase();
        const filtered = preAlerts.filter(a =>
            (a.originalTracking && a.originalTracking.toLowerCase().includes(filterLower)) ||
            (a.clientEBCode && a.clientEBCode.toLowerCase().includes(filterLower)) ||
            (a.clientName && a.clientName.toLowerCase().includes(filterLower)) ||
            (a.packageDescriptionContent && a.packageDescriptionContent.toLowerCase().includes(filterLower))
        );
        if(noPreAlertsMessage) noPreAlertsMessage.style.display = filtered.length === 0 ? 'block' : 'none';

        filtered.forEach(alert => {
            const row = adminPreAlertsTableBody.insertRow();
            const dateObj = new Date(alert.timestamp);
            const formattedRecDate = dateObj.toLocaleDateString('es-DO', {day:'2-digit',month:'short'});
            const estArrival = alert.estimatedArrival ? new Date(alert.estimatedArrival).toLocaleDateString('es-DO', {day:'2-digit',month:'short'}) : 'N/A';
            const estWeight = alert.estimatedWeightKg ? `${parseFloat(alert.estimatedWeightKg).toFixed(2)} KG` : 'N/A';

            row.innerHTML = `
                <td>${alert.clientName || 'N/A'} (${alert.clientEBCode})</td>
                <td>${alert.originalTracking}</td>
                <td>${alert.storeSender}</td>
                <td>$${parseFloat(alert.estimatedValue || 0).toFixed(2)}</td>
                <td>${estWeight}</td>
                <td>${alert.packageDescriptionContent ? (alert.packageDescriptionContent.substring(0,25) + (alert.packageDescriptionContent.length > 25 ? '...' : '')) : 'N/A'}</td>
                <td>${estArrival}</td>
                <td>${formattedRecDate}</td>
                <td><button class="btn-icon-action small-btn" onclick="processPreAlert('${alert.id}')" title="Procesar/Vincular"><i class="fas fa-link"></i></button></td>
            `;
        });
    }
    if (searchPreAlertsInput) searchPreAlertsInput.addEventListener('input', (e) => renderAdminPreAlerts(e.target.value));
    
    window.processPreAlert = function(alertId) { // Global scope
        const preAlerts = getFromStorage(ALL_PREALERTS_KEY, []);
        const alertData = preAlerts.find(a => a.id === alertId);
        if (alertData && digitizePackageForm) {
            if(clientEBCodeInput) clientEBCodeInput.value = alertData.clientEBCode || '';
            if(adminOriginalTrackingInput) adminOriginalTrackingInput.value = alertData.originalTracking || '';
            if(adminPackageContentInput) adminPackageContentInput.value = alertData.packageDescriptionContent || '';
            if(adminDeclaredValueInput) adminDeclaredValueInput.value = alertData.estimatedValue || 0;
            if(adminPackageWeightInput) adminPackageWeightInput.value = alertData.estimatedWeightKg || '';
            if(adminPackageStatusSelect) adminPackageStatusSelect.value = 'received_warehouse_origin';
            if(adminIsUnknownCheckbox) adminIsUnknownCheckbox.checked = false;
            if(clientEBCodeInput) clientEBCodeInput.disabled = false;
            delete digitizePackageForm.dataset.editingPackageId;

            if(adminDeclaredValueInput) adminDeclaredValueInput.dispatchEvent(new Event('input'));
            navigateToSection('digitizePackage'); // Use helper
            showFeedbackAdmin(adminPackageMessage, `Datos de pre-alerta ${alertData.originalTracking} cargados.`, 'info');
        }
    };


    // --- Lógica Enviar Notificaciones (Admin to Client - From your original structure) ---
    if (sendNotificationForm) {
        sendNotificationForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const userEBCode = notificationUserEBCodeInput.value.trim().toUpperCase();
            const message = notificationMessageInput.value.trim();

            if (!userEBCode || !message) {
                showFeedbackAdmin(notificationFormMessage, 'Código EB y mensaje son requeridos.', 'error');
                return;
            }
            // For this simplified setup, we don't strictly need to check if userEBCode exists in USERS_STORAGE_KEY,
            // as cliente.js will only listen for its own TARGET_CLIENT_EB_CODE.
            // However, for a more robust system, you would validate.
            // const users = getFromStorage(USERS_STORAGE_KEY, []);
            // if (!users.find(u => u.expressBoxCode === userEBCode) && userEBCode !== TARGET_CLIENT_EB_CODE) {
            //      showFeedbackAdmin(notificationFormMessage, `Usuario con código EB ${userEBCode} no encontrado.`, 'error');
            //     return;
            // }

            const userNotificationsKey = CLIENT_NOTIFICATIONS_KEY_PREFIX + userEBCode;
            const notifications = getFromStorage(userNotificationsKey, []);
            notifications.unshift({
                id: 'notif_admin_' + Date.now(),
                message: message,
                timestamp: new Date().toISOString(),
                icon: 'fas fa-bullhorn',
                read: false
            });
            saveToStorage(userNotificationsKey, notifications); // This notifies cliente.js if userEBCode matches
            showFeedbackAdmin(notificationFormMessage, `Notificación enviada a ${userEBCode}.`, 'success');
            sendNotificationForm.reset();
        });
    }

    // --- Lógica Códigos Promo (From your original structure) ---
    function renderAdminPromoCodes() {
        if (!existingPromosList) return;
        // ... (rest of renderAdminPromoCodes logic from previous correct version)
        const promotions = getFromStorage(PROMO_CODES_KEY_ADMIN, []);
        existingPromosList.innerHTML = '';
        if (promotions.length === 0) {
            existingPromosList.innerHTML = '<li>No hay códigos promocionales creados.</li>';
            return;
        }
        promotions.forEach((promo, index) => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="promo-code-value">${promo.code}</span> <span class="promo-discount-value">${promo.discount}% OFF</span> <button class="delete-promo-btn-admin" data-index="${index}" title="Eliminar">×</button>`;
            existingPromosList.appendChild(li);
        });
    }
    if (createPromoForm) {
        createPromoForm.addEventListener('submit', (event) => {
            event.preventDefault();
            // ... (rest of createPromoForm submit logic)
            const code = newPromoCodeInput.value.trim().toUpperCase();
            const discount = parseInt(promoDiscountInput.value, 10);
            if (!code || isNaN(discount) || discount < 1 || discount > 100) {
                showFeedbackAdmin(createPromoMessage, 'Ingresa código válido y descuento (1-100).', 'error'); return;
            }
            const promotions = getFromStorage(PROMO_CODES_KEY_ADMIN, []);
            if (promotions.find(p => p.code === code)) {
                showFeedbackAdmin(createPromoMessage, `El código "${code}" ya existe.`, 'error'); return;
            }
            promotions.push({ code, discount, id: 'promo_' + Date.now(), createdAt: new Date().toISOString() });
            saveToStorage(PROMO_CODES_KEY_ADMIN, promotions);
            renderAdminPromoCodes();
            showFeedbackAdmin(createPromoMessage, `Código "${code}" creado.`, 'success');
            createPromoForm.reset();
        });
    }
    if (existingPromosList) {
        existingPromosList.addEventListener('click', (event) => {
            if (event.target.classList.contains('delete-promo-btn-admin')) {
                // ... (rest of delete promo logic)
                const promoIndex = parseInt(event.target.dataset.index, 10);
                let promotions = getFromStorage(PROMO_CODES_KEY_ADMIN, []);
                if (confirm(`¿Eliminar el código "${promotions[promoIndex].code}"?`)) {
                    promotions.splice(promoIndex, 1);
                    saveToStorage(PROMO_CODES_KEY_ADMIN, promotions);
                    renderAdminPromoCodes();
                }
            }
        });
    }

    // --- Lógica Notificaciones de Retiro (Client to Admin - From your original structure) ---
    function renderAdminPickupNotifications(filter = '') {
        if (!adminPickupNotificationsTableBody) return;
        // ... (rest of renderAdminPickupNotifications logic from previous correct version)
        const pickupNotifs = getFromStorage(PICKUP_NOTIFICATIONS_KEY, []);
        adminPickupNotificationsTableBody.innerHTML = '';
        const filterLower = filter.toLowerCase();

        const filteredNotifs = pickupNotifs.filter(n =>
            (n.clientEBCode && n.clientEBCode.toLowerCase().includes(filterLower)) ||
            (n.clientName && n.clientName.toLowerCase().includes(filterLower)) ||
            (n.pickupCodes && n.pickupCodes.toLowerCase().includes(filterLower))
        );

        if (noPickupNotificationsMessage) noPickupNotificationsMessage.style.display = filteredNotifs.length === 0 ? 'block' : 'none';

        filteredNotifs.forEach(notif => {
            const row = adminPickupNotificationsTableBody.insertRow();
            const notifiedDate = new Date(notif.timestamp).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
            const pickupDate = new Date(notif.pickupDate).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });

            row.innerHTML = `
                <td>${notif.clientEBCode}</td>
                <td>${notif.clientName || 'N/A'}</td>
                <td>${notif.pickupCodes}</td>
                <td>${pickupDate}</td>
                <td>${notifiedDate}</td>
                <td>
                    <button class="btn-icon-action small-btn" onclick="markPickupProcessed('${notif.id}')" title="Marcar Procesado"><i class="fas fa-check-circle"></i></button>
                </td>
            `;
        });
    }
    if (searchPickupNotificationsInput) searchPickupNotificationsInput.addEventListener('input', (e) => renderAdminPickupNotifications(e.target.value));
    
    window.markPickupProcessed = function(notificationId) { // Global scope
        if (confirm('¿Marcar esta notificación de retiro como procesada y archivarla?')) {
            let pickupNotifs = getFromStorage(PICKUP_NOTIFICATIONS_KEY, []);
            pickupNotifs = pickupNotifs.filter(n => n.id !== notificationId);
            saveToStorage(PICKUP_NOTIFICATIONS_KEY, pickupNotifs);
            renderAdminPickupNotifications(searchPickupNotificationsInput ? searchPickupNotificationsInput.value : '');
            showFeedbackAdmin(noPickupNotificationsMessage, 'Notificación de retiro procesada.', 'success');
        }
    };


    // --- Inicializar Admin Panel (Matches your original structure) ---
    function initializeAdminPanel(){
        // Actualizar stats del dashboard
        if(document.getElementById('totalUsersStat')) document.getElementById('totalUsersStat').textContent = getFromStorage(USERS_STORAGE_KEY).length;
        if(document.getElementById('totalPackagesStat')) document.getElementById('totalPackagesStat').textContent = getFromStorage(ADMIN_DIGITIZED_PACKAGES_KEY).length;
        if(document.getElementById('todayPreAlertsStat')) document.getElementById('todayPreAlertsStat').textContent = getFromStorage(ALL_PREALERTS_KEY).filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString()).length;
        if(document.getElementById('packagesWithTaxesStat')) document.getElementById('packagesWithTaxesStat').textContent = getFromStorage(ADMIN_DIGITIZED_PACKAGES_KEY).filter(p => (p.taxes || 0) > 0).length; // Check for p.taxes existence

        // Mostrar Dashboard por defecto
        if (allAdminSections.length > 0) { // Ensure sections were found
            allAdminSections.forEach(section => section.style.display = 'none');
            const dashboard = document.getElementById('dashboard-content');
            if (dashboard) dashboard.style.display = 'block';
            else if (allAdminSections[0]) allAdminSections[0].style.display = 'block'; // Fallback to first section

            if (sectionTitleHeader) sectionTitleHeader.textContent = 'Dashboard'; // Default title
            
            if (sidebarNav) { // Ensure sidebarNav exists
                 sidebarNav.querySelectorAll('li').forEach(li => li.classList.remove('active')); // Clear active
                const dashboardLink = sidebarNav.querySelector('a[data-section="dashboard"]');
                if (dashboardLink && dashboardLink.closest('li')) {
                     dashboardLink.closest('li').classList.add('active');
                } else if (sidebarNav.firstElementChild && sidebarNav.firstElementChild.firstElementChild) {
                    // Fallback if dashboard link is not specifically found, activate the first link
                    sidebarNav.firstElementChild.classList.add('active');
                    // And try to set the title from this first link
                    if(sectionTitleHeader && sidebarNav.firstElementChild.firstElementChild.dataset.section) {
                        const iconNode = sidebarNav.firstElementChild.firstElementChild.querySelector('.icon');
                        if(iconNode && iconNode.nextSibling && iconNode.nextSibling.nodeType === Node.TEXT_NODE) {
                           sectionTitleHeader.textContent = iconNode.nextSibling.textContent.trim();
                        } else {
                           sectionTitleHeader.textContent = sidebarNav.firstElementChild.firstElementChild.dataset.section.charAt(0).toUpperCase() + sidebarNav.firstElementChild.firstElementChild.dataset.section.slice(1);
                        }
                    }
                }
            }
        } else {
            console.error("No admin sections found. Check HTML structure for '.content-area-admin .admin-section'.");
        }
    }

    initializeAdminPanel();

    // --- Storage Event Listener (From your original structure) ---
    window.addEventListener('storage', (event) => {
        // This needs to be robust, checking if the currently visible section's data has changed.
        const currentVisibleSectionElement = document.querySelector('.admin-section[style*="display: block"]');
        const currentVisibleSectionId = currentVisibleSectionElement ? currentVisibleSectionElement.id : null;

        if (event.key === (USERS_STORAGE_KEY + '_event_timestamp')) {
            if(document.getElementById('totalUsersStat')) document.getElementById('totalUsersStat').textContent = getFromStorage(USERS_STORAGE_KEY).length;
            if (currentVisibleSectionId === 'users-content' && typeof renderUserList === "function") {
                renderUserList(searchUsersInput ? searchUsersInput.value : '');
            }
        }
        if (event.key === (ADMIN_DIGITIZED_PACKAGES_KEY + '_event_timestamp')) {
            if(document.getElementById('totalPackagesStat')) document.getElementById('totalPackagesStat').textContent = getFromStorage(ADMIN_DIGITIZED_PACKAGES_KEY).length;
            if(document.getElementById('packagesWithTaxesStat')) document.getElementById('packagesWithTaxesStat').textContent = getFromStorage(ADMIN_DIGITIZED_PACKAGES_KEY).filter(p => (p.taxes || 0) > 0).length;
            if (currentVisibleSectionId === 'viewPackages-content' && typeof renderAdminPackages === "function") {
                renderAdminPackages(searchAdminPackagesInput ? searchAdminPackagesInput.value : '');
            }
        }
        if (event.key === (ALL_PREALERTS_KEY + '_event_timestamp')) {
            if(document.getElementById('todayPreAlertsStat')) document.getElementById('todayPreAlertsStat').textContent = getFromStorage(ALL_PREALERTS_KEY).filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString()).length;
            if (currentVisibleSectionId === 'preAlerts-content' && typeof renderAdminPreAlerts === "function") {
                renderAdminPreAlerts(searchPreAlertsInput ? searchPreAlertsInput.value : '');
            }
        }
        if (event.key === (PICKUP_NOTIFICATIONS_KEY + '_event_timestamp')) {
             if (currentVisibleSectionId === 'pickupNotifications-content' && typeof renderAdminPickupNotifications === "function") {
                renderAdminPickupNotifications(searchPickupNotificationsInput ? searchPickupNotificationsInput.value : '');
            }
        }
        if (event.key === (PROMO_CODES_KEY_ADMIN + '_event_timestamp')) {
             if (currentVisibleSectionId === 'promoCodes-content' && typeof renderAdminPromoCodes === "function") {
                renderAdminPromoCodes();
            }
        }
    });
});

// --- admin-panel-maestro-script.js (With New Admin Features) ---
document.addEventListener('DOMContentLoaded', () => {
    const TARGET_CLIENT_EB_CODE = "EB-CLIENT001";

    // --- DOM Elements ---
    // ... (Existing general, user, package, pre-alert, notification, promo, pickup DOMs)
    const sidebarNav = document.querySelector('.sidebar-nav');
    const contentAreaAdmin = document.querySelector('.content-area-admin');
    const allAdminSections = contentAreaAdmin ? contentAreaAdmin.querySelectorAll('.admin-section') : [];
    const sectionTitleHeader = document.getElementById('sectionTitle');

    // Users
    const userListTableBody = document.getElementById('adminUserListTableBody');
    const noUsersMessage = document.getElementById('noUsersMessage');
    const searchUsersInput = document.getElementById('searchUsersInput');
    const editUserModal = document.getElementById('editUserModal');
    const closeEditUserModal = document.getElementById('closeEditUserModal');
    const editUserForm = document.getElementById('editUserForm');
    const editUserModalTitleEB = document.getElementById('editUserModalTitleEB');
    const editingUserEBCodeInput = document.getElementById('editingUserEBCode'); // Hidden input
    const editUserFullNameInput = document.getElementById('editUserFullName');
    const editUserEmailInput = document.getElementById('editUserEmail');
    const editUserPlanSelect = document.getElementById('editUserPlan');
    const editUserAutopaySelect = document.getElementById('editUserAutopay');
    const editUserBranchInput = document.getElementById('editUserBranch');
    const editUserAddressStreetInput = document.getElementById('editUserAddressStreet');
    const editUserAddressCityInput = document.getElementById('editUserAddressCity');
    const editUserAddressProvinceInput = document.getElementById('editUserAddressProvince');
    const editUserAddressReferenceInput = document.getElementById('editUserAddressReference');
    const editUserFormMessage = document.getElementById('editUserFormMessage');


    // Packages
    const digitizePackageForm = document.getElementById('adminDigitizePackageForm');
    const clientEBCodeInput = document.getElementById('adminClientEBCode');
    const adminOriginalTrackingInput = document.getElementById('adminOriginalTracking');
    const adminPackageContentInput = document.getElementById('adminPackageContent');
    const adminDeclaredValueInput = document.getElementById('adminDeclaredValue');
    const adminPackageWeightInput = document.getElementById('adminPackageWeight');
    const adminPackageStatusSelect = document.getElementById('adminPackageStatus');
    const adminIsUnknownCheckbox = document.getElementById('adminIsUnknown');
    const adminPackageMessage = document.getElementById('adminPackageMessage');
    const estimatedTaxesDisplay = document.getElementById('estimatedTaxesDisplay');
    const adminPackageListTableBody = document.getElementById('adminPackageListTableBody');
    const noAdminPackagesMessage = document.getElementById('noAdminPackagesMessage');
    const searchAdminPackagesInput = document.getElementById('searchAdminPackagesInput');

    // Pre-Alerts
    const adminPreAlertsTableBody = document.getElementById('adminPreAlertsTableBody');
    // ... (other pre-alert DOMs) ...
    const noPreAlertsMessage = document.getElementById('noPreAlertsMessage');
    const searchPreAlertsInput = document.getElementById('searchPreAlertsInput');


    // Support Tickets (NEW)
    const adminSupportTicketsTableBody = document.getElementById('adminSupportTicketsTableBody');
    const noSupportTicketsMessage = document.getElementById('noSupportTicketsMessage');
    const searchSupportTicketsInput = document.getElementById('searchSupportTicketsInput');
    const openTicketsBadge = document.getElementById('openTicketsBadge'); // Sidebar badge
    const openTicketsStat = document.getElementById('openTicketsStat'); // Dashboard stat


    // ... (Existing promo, pickup DOMs)
    const sendNotificationForm = document.getElementById('adminSendNotificationForm');
    const notificationUserEBCodeInput = document.getElementById('notificationUserEBCode');
    const notificationMessageInput = document.getElementById('notificationMessage');
    const notificationFormMessage = document.getElementById('notificationFormMessage');

    const createPromoForm = document.getElementById('adminCreatePromoForm');
    const newPromoCodeInput = document.getElementById('adminNewPromoCode');
    const promoDiscountInput = document.getElementById('adminPromoDiscount');
    const createPromoMessage = document.getElementById('adminCreatePromoMessage');
    const existingPromosList = document.getElementById('adminExistingPromosList');

    const adminPickupNotificationsTableBody = document.getElementById('adminPickupNotificationsTableBody');
    const noPickupNotificationsMessage = document.getElementById('noPickupNotificationsMessage');
    const searchPickupNotificationsInput = document.getElementById('searchPickupNotificationsInput');


    // --- LocalStorage Keys ---
    const USERS_STORAGE_KEY = 'expressboxrd_users';
    // ... (other keys: ADMIN_DIGITIZED_PACKAGES_KEY, ALL_PREALERTS_KEY, etc.)
    const CLIENT_NOTIFICATIONS_KEY_PREFIX = 'expressboxrd_notifications_user_';
    const SUPPORT_TICKETS_KEY = 'expressboxrd_support_tickets'; // NEW
    const ADMIN_DIGITIZED_PACKAGES_KEY = 'expressboxrd_admin_packages_v3';
    const ALL_PREALERTS_KEY = 'expressboxrd_all_prealerts';
    const PROMO_CODES_KEY_ADMIN = 'expressboxrd_admin_promo_codes_v1';
    const PICKUP_NOTIFICATIONS_KEY = 'expressboxrd_pickup_notifications';


    // --- Constants & Mappings ---
    // ... (ITBIS_RATE, IMPORT_THRESHOLD_USD, ARANCEL_GENERAL_RATE, TASA_CAMBIO_DOP, statusMap same)
    const planDisplayNames = { premium: 'Premium', intermedio: 'Intermedio', basico: 'Básico', default: 'No Especificado' };
    const planIcons = { premium: 'fas fa-crown', intermedio: 'fas fa-star', basico: 'fas fa-shield-alt', default: 'fas fa-question-circle'};
    const statusMap = { /* ... same as before ... */
        'received_warehouse_origin': { text: 'Recibido Origen', class: 'status-received_warehouse_origin', icon: 'fas fa-warehouse' },
        'in_transit_to_rd': { text: 'En Tránsito a RD', class: 'status-in_transit_to_rd', icon: 'fas fa-plane-departure' },
        'customs_rd': { text: 'En Aduanas RD', class: 'status-customs_rd', icon: 'fas fa-building-shield' },
        'ready_for_dispatch_cd': { text: 'Listo en CD', class: 'status-ready_for_dispatch_cd', icon: 'fas fa-dolly-flatbed' },
        'out_for_delivery_rd': { text: 'En Ruta de Entrega', class: 'status-out_for_delivery_rd', icon: 'fas fa-truck-fast' },
        'delivered_rd': { text: 'Entregado', class: 'status-delivered_rd', icon: 'fas fa-house-chimney-user' },
        'pending_payment_customs': { text: 'Impuestos Pendientes', class: 'status-pending_payment_customs', icon: 'fas fa-file-invoice-dollar' },
        'paid_customs': { text: 'Impuestos Pagados', class: 'status-paid_customs', icon: 'fas fa-check-circle' },
        'unknown_package_admin': {text: 'Paquete Desconocido', class: 'status-unknown_package_admin', icon: 'fas fa-question-circle' }
    };

    // --- Helper Functions (getFromStorage, saveToStorage, showFeedbackAdmin, calculateEstimatedTaxes same) ---
    // ...

    // --- Navigation (navigateToSection and sidebar click listener same as previous refined version) ---
    // ... (Ensure navigateToSection calls render functions for each section)
    function navigateToSection(sectionName) {
        if (!allAdminSections.length) return;
        const targetSectionId = sectionName + '-content';
        // ... (rest of navigation logic from previous 'Refined admin.js')
         const sidebarLink = sidebarNav ? sidebarNav.querySelector(`a[data-section="${sectionName}"]`) : null;
        let title = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
        if (sidebarLink) {
            const iconNode = sidebarLink.querySelector('.icon');
            if (iconNode && iconNode.nextSibling && iconNode.nextSibling.nodeType === Node.TEXT_NODE) {
                title = iconNode.nextSibling.textContent.trim();
            }
        }

        allAdminSections.forEach(section => section.style.display = 'none');
        const targetSection = document.getElementById(targetSectionId);

        if (targetSection) {
            targetSection.style.display = 'block';
            const searchInput = targetSection.querySelector('.search-input-admin');
            if (searchInput) searchInput.focus();
        }

        if (sectionTitleHeader) sectionTitleHeader.textContent = title;

        if (sidebarNav && sidebarLink) {
            sidebarNav.querySelectorAll('li').forEach(li => li.classList.remove('active'));
            sidebarLink.closest('li').classList.add('active');
        }

        switch (sectionName) {
            case 'users': if (typeof renderUserList === "function") renderUserList(searchUsersInput ? searchUsersInput.value : ''); break;
            case 'viewPackages': if (typeof renderAdminPackages === "function") renderAdminPackages(searchAdminPackagesInput ? searchAdminPackagesInput.value : ''); break;
            case 'preAlerts': if (typeof renderAdminPreAlerts === "function") renderAdminPreAlerts(searchPreAlertsInput ? searchPreAlertsInput.value : ''); break;
            case 'supportTickets': if (typeof renderAdminSupportTickets === "function") renderAdminSupportTickets(searchSupportTicketsInput ? searchSupportTicketsInput.value : ''); break; // NEW
            case 'pickupNotifications': if (typeof renderAdminPickupNotifications === "function") renderAdminPickupNotifications(searchPickupNotificationsInput ? searchPickupNotificationsInput.value : ''); break;
            case 'promoCodes': if (typeof renderAdminPromoCodes === "function") renderAdminPromoCodes(); break;
        }
    }
     if (sidebarNav) { /* ... same sidebar click listener calling navigateToSection ... */
        sidebarNav.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (link && link.dataset.section) {
                event.preventDefault();
                navigateToSection(link.dataset.section);
            } else if (link && link.getAttribute('href') === 'index.html') {
                return;
            } else if (link) {
                event.preventDefault();
            }
        });
    }
    const statCards = document.querySelectorAll('#dashboard-content .stat-card'); // ensure this is here
    if (statCards.length > 0) { /* ... same stat card click listener calling navigateToSection ... */
        statCards.forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                const targetSectionName = card.dataset.sectionTarget;
                if (targetSectionName) {
                    navigateToSection(targetSectionName);
                }
            });
        });
    }


    // --- User Management (Enhanced with Modal) ---
    function renderUserList(filter = '') {
        if (!userListTableBody) return;
        let users = getFromStorage(USERS_STORAGE_KEY, []);
        
        // Ensure TARGET_CLIENT_EB_CODE is present
        const predefinedClientIndex = users.findIndex(u => u.expressBoxCode === TARGET_CLIENT_EB_CODE);
        if (predefinedClientIndex === -1) {
            users.unshift({
                expressBoxCode: TARGET_CLIENT_EB_CODE,
                fullName: "Cliente Principal (Cuenta)",
                email: "cliente@example.com",
                plan: "basico",
                autopayEnabled: false,
                branch: "Sucursal Principal",
                address: { street: "Calle Falsa 123", city: " столица ", province: "Distrito Nacional", reference: "Cerca del parque" },
                registeredAt: new Date(0).toISOString(),
                isPlaceholder: true 
            });
        } else { // Ensure existing target client has all fields
             users[predefinedClientIndex] = {
                ...{plan: "basico", autopayEnabled: false, branch: "N/A", address: {}}, // Defaults
                ...users[predefinedClientIndex], // Existing data
                 fullName: users[predefinedClientIndex].fullName || "Cliente Principal (Cuenta)",
                 email: users[predefinedClientIndex].email || "cliente@example.com",

            };
        }
        
        userListTableBody.innerHTML = '';
        const filterLower = filter.toLowerCase();
        const filteredUsers = users.filter(u => {
            const searchString = `${u.fullName || ''} ${u.email || ''} ${u.expressBoxCode || ''}`.toLowerCase();
            return filter === '' || searchString.includes(filterLower);
        });

        if (noUsersMessage) noUsersMessage.style.display = filteredUsers.length === 0 ? 'block' : 'none';

        filteredUsers.forEach(user => {
            const row = userListTableBody.insertRow();
            const planName = planDisplayNames[user.plan || 'default'] || planDisplayNames.default;
            const planIcon = planIcons[user.plan || 'default'] || planIcons.default;
            const autopayStatus = user.autopayEnabled ? 'Activo' : 'Inactivo';
            const shortAddress = user.address && user.address.street ? `${user.address.street.substring(0,20)}...` : 'N/A';

            row.innerHTML = `
                <td>${user.fullName}</td>
                <td>${user.email}</td>
                <td>${user.expressBoxCode}</td>
                <td><i class="${planIcon}"></i> ${planName}</td>
                <td>${autopayStatus}</td>
                <td>${user.branch || 'N/A'}</td>
                <td>${shortAddress}</td>
                <td>
                    <button class="btn-icon-action small-btn" onclick="openEditUserModal('${user.expressBoxCode}')" title="Editar Usuario"><i class="fas fa-user-edit"></i></button>
                </td>
            `;
        });
    }
    if (searchUsersInput) searchUsersInput.addEventListener('input', (e) => renderUserList(e.target.value));

    window.openEditUserModal = function(userEBCode) {
        const users = getFromStorage(USERS_STORAGE_KEY, []);
        const user = users.find(u => u.expressBoxCode === userEBCode);
        if (!user) {
            alert("Usuario no encontrado.");
            return;
        }
        if (!editUserModal || !editUserForm) {
            console.error("Edit user modal elements not found");
            // Fallback to prompt if modal not fully available (should not happen if HTML is correct)
            legacyEditUserWithPrompts(userEBCode); 
            return;
        }

        editingUserEBCodeInput.value = user.expressBoxCode;
        if(editUserModalTitleEB) editUserModalTitleEB.textContent = user.expressBoxCode;
        editUserFullNameInput.value = user.fullName || "";
        editUserEmailInput.value = user.email || "";
        editUserPlanSelect.value = user.plan || "basico";
        editUserAutopaySelect.value = user.autopayEnabled ? "true" : "false";
        editUserBranchInput.value = user.branch || "";
        const addr = user.address || {};
        editUserAddressStreetInput.value = addr.street || "";
        editUserAddressCityInput.value = addr.city || "";
        editUserAddressProvinceInput.value = addr.province || "";
        editUserAddressReferenceInput.value = addr.reference || "";
        
        editUserModal.classList.add('visible');
    }
    
    function legacyEditUserWithPrompts(userEBCode) { // Fallback if modal fails
        let users = getFromStorage(USERS_STORAGE_KEY, []);
        let userIndex = users.findIndex(u => u.expressBoxCode === userEBCode);
         if (userIndex === -1) { alert('Usuario no encontrado.'); return; }
        const user = users[userIndex];
        const newPlan = prompt(`Plan actual: ${planDisplayNames[user.plan || 'default']}.\nNuevo plan (basico, intermedio, premium):`, user.plan || 'basico');
        // ... rest of prompt logic
        alert("Usando edición básica. La modal no se cargó correctamente.");
    }


    if (closeEditUserModal) {
        closeEditUserModal.addEventListener('click', () => editUserModal.classList.remove('visible'));
    }
    if (editUserModal) { // Close on overlay click
        editUserModal.addEventListener('click', (event) => {
            if (event.target === editUserModal) editUserModal.classList.remove('visible');
        });
    }

    if (editUserForm) {
        editUserForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const userEBCode = editingUserEBCodeInput.value;
            let users = getFromStorage(USERS_STORAGE_KEY, []);
            const userIndex = users.findIndex(u => u.expressBoxCode === userEBCode);
            if (userIndex === -1) {
                showFeedbackAdmin(editUserFormMessage, "Error: Usuario no encontrado para actualizar.", "error");
                return;
            }
            users[userIndex].fullName = editUserFullNameInput.value.trim();
            users[userIndex].email = editUserEmailInput.value.trim();
            users[userIndex].plan = editUserPlanSelect.value;
            users[userIndex].autopayEnabled = editUserAutopaySelect.value === "true";
            users[userIndex].branch = editUserBranchInput.value.trim();
            users[userIndex].address = {
                street: editUserAddressStreetInput.value.trim(),
                city: editUserAddressCityInput.value.trim(),
                province: editUserAddressProvinceInput.value.trim(),
                reference: editUserAddressReferenceInput.value.trim()
            };
            users[userIndex].isPlaceholder = false; // No longer a placeholder
             if (users[userIndex].registeredAt === new Date(0).toISOString()) {
                users[userIndex].registeredAt = new Date().toISOString();
            }


            saveToStorage(USERS_STORAGE_KEY, users);
            renderUserList(searchUsersInput ? searchUsersInput.value : '');
            editUserModal.classList.remove('visible');
            showFeedbackAdmin(noUsersMessage, `Usuario ${userEBCode} actualizado correctamente.`, "success"); // Use a general feedback area
        });
    }


    // --- Package Digitization, Viewing, Pre-Alerts (Logic mostly same, ensure DOM elements are correct) ---
    // ... (All package, pre-alert code from previous 'Refined admin.js')

    // --- Support Tickets (NEW) ---
    function renderAdminSupportTickets(filter = '') {
        if (!adminSupportTicketsTableBody) return;
        const tickets = getFromStorage(SUPPORT_TICKETS_KEY, []);
        adminSupportTicketsTableBody.innerHTML = '';
        const filterLower = filter.toLowerCase();

        const filteredTickets = tickets.filter(t => 
            (t.clientEBCode && t.clientEBCode.toLowerCase().includes(filterLower)) ||
            (t.clientName && t.clientName.toLowerCase().includes(filterLower)) ||
            (t.subject && t.subject.toLowerCase().includes(filterLower)) ||
            (t.id && t.id.toLowerCase().includes(filterLower))
        );

        if (noSupportTicketsMessage) noSupportTicketsMessage.style.display = filteredTickets.length === 0 ? 'block' : 'none';
        
        const openCount = tickets.filter(t => t.status === 'abierto').length;
        if (openTicketsBadge) openTicketsBadge.textContent = openCount;
        if (openTicketsStat) openTicketsStat.textContent = openCount;
        if (openTicketsBadge) openTicketsBadge.style.display = openCount > 0 ? 'inline-block' : 'none';


        filteredTickets.forEach(ticket => {
            const row = adminSupportTicketsTableBody.insertRow();
            const dateObj = new Date(ticket.timestamp);
            const formattedDate = dateObj.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
            row.innerHTML = `
                <td>${ticket.id.slice(-6)}</td>
                <td>${ticket.clientName} (${ticket.clientEBCode})</td>
                <td>${ticket.subject.substring(0,30)}${ticket.subject.length > 30 ? '...' : ''}</td>
                <td>${formattedDate}</td>
                <td><span class="ticket-status ticket-status-${ticket.status}">${ticket.status.replace('_',' ')}</span></td>
                <td>
                    <button class="btn-icon-action small-btn action-view-ticket" onclick="viewSupportTicket('${ticket.id}')" title="Ver Detalles"><i class="fas fa-eye"></i></button>
                    ${ticket.status === 'abierto' ? `<button class="btn-icon-action small-btn action-resolve-ticket" onclick="resolveSupportTicket('${ticket.id}')" title="Marcar Resuelto"><i class="fas fa-check-circle"></i></button>` : ''}
                </td>
            `;
        });
    }
    if (searchSupportTicketsInput) searchSupportTicketsInput.addEventListener('input', (e) => renderAdminSupportTickets(e.target.value));

    window.viewSupportTicket = function(ticketId) {
        const tickets = getFromStorage(SUPPORT_TICKETS_KEY, []);
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) {
            // Simple alert for now, ideally a modal
            alert(`Ticket ID: ${ticket.id}\nCliente: ${ticket.clientName} (${ticket.clientEBCode})\nAsunto: ${ticket.subject}\nMensaje: ${ticket.message}\nEstado: ${ticket.status}\nEnviado: ${new Date(ticket.timestamp).toLocaleString('es-DO')}`);
        }
    };
    window.resolveSupportTicket = function(ticketId) {
        if (confirm("¿Marcar este ticket como resuelto?")) {
            let tickets = getFromStorage(SUPPORT_TICKETS_KEY, []);
            const ticketIndex = tickets.findIndex(t => t.id === ticketId);
            if (ticketIndex > -1) {
                tickets[ticketIndex].status = 'resuelto';
                saveToStorage(SUPPORT_TICKETS_KEY, tickets);
                renderAdminSupportTickets(searchSupportTicketsInput ? searchSupportTicketsInput.value : '');
                // Send notification to client?
                const clientUserEB = tickets[ticketIndex].clientEBCode;
                const clientNotifKey = CLIENT_NOTIFICATIONS_KEY_PREFIX + clientUserEB;
                let clientNotifs = getFromStorage(clientNotifKey, []);
                clientNotifs.unshift({
                    id: 'notif_ticket_' + Date.now(),
                    message: `Su ticket de soporte "${tickets[ticketIndex].subject.substring(0,20)}..." ha sido marcado como resuelto.`,
                    timestamp: new Date().toISOString(),
                    icon: 'fas fa-check-circle',
                    read: false
                });
                saveToStorage(clientNotifKey, clientNotifs);
            }
        }
    };


    // --- Send Notifications, Promo Codes, Pickup Notifications (Logic same as previous refined version) ---
    // ...

    // --- Initialize Admin Panel ---
    function initializeAdminPanel(){
        // Update dashboard stats
        if(document.getElementById('totalUsersStat')) document.getElementById('totalUsersStat').textContent = getFromStorage(USERS_STORAGE_KEY).length;
        // ... (other stats: totalPackagesStat, todayPreAlertsStat, packagesWithTaxesStat)
        const openTicketCount = getFromStorage(SUPPORT_TICKETS_KEY, []).filter(t => t.status === 'abierto').length;
        if (openTicketsStat) openTicketsStat.textContent = openTicketCount;
        if (openTicketsBadge) {
            openTicketsBadge.textContent = openTicketCount;
            openTicketsBadge.style.display = openTicketCount > 0 ? 'inline-block' : 'none';
        }
        // ... (rest of initializeAdminPanel from previous 'Refined admin.js')
        if (allAdminSections.length > 0) {
            allAdminSections.forEach(section => section.style.display = 'none');
            const dashboard = document.getElementById('dashboard-content');
            if (dashboard) dashboard.style.display = 'block';
            else if (allAdminSections[0]) allAdminSections[0].style.display = 'block';

            if (sectionTitleHeader) sectionTitleHeader.textContent = 'Dashboard';
            
            if (sidebarNav) {
                 sidebarNav.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                const dashboardLink = sidebarNav.querySelector('a[data-section="dashboard"]');
                if (dashboardLink && dashboardLink.closest('li')) {
                     dashboardLink.closest('li').classList.add('active');
                } else if (sidebarNav.firstElementChild && sidebarNav.firstElementChild.firstElementChild) {
                    sidebarNav.firstElementChild.classList.add('active');
                     if(sectionTitleHeader && sidebarNav.firstElementChild.firstElementChild.dataset.section) {
                        const iconNode = sidebarNav.firstElementChild.firstElementChild.querySelector('.icon');
                        if(iconNode && iconNode.nextSibling && iconNode.nextSibling.nodeType === Node.TEXT_NODE) {
                           sectionTitleHeader.textContent = iconNode.nextSibling.textContent.trim();
                        } else {
                           sectionTitleHeader.textContent = sidebarNav.firstElementChild.firstElementChild.dataset.section.charAt(0).toUpperCase() + sidebarNav.firstElementChild.firstElementChild.dataset.section.slice(1);
                        }
                    }
                }
            }
        }
    }
    initializeAdminPanel();

    // --- Storage Event Listener (Modified to include SUPPORT_TICKETS_KEY) ---
    window.addEventListener('storage', (event) => {
        const currentVisibleSectionElement = document.querySelector('.admin-section[style*="display: block"]');
        const currentVisibleSectionId = currentVisibleSectionElement ? currentVisibleSectionElement.id : null;
        
        // ... (listeners for USERS_STORAGE_KEY, ADMIN_DIGITIZED_PACKAGES_KEY, ALL_PREALERTS_KEY, PICKUP_NOTIFICATIONS_KEY, PROMO_CODES_KEY_ADMIN)
        if (event.key === (SUPPORT_TICKETS_KEY + '_event_timestamp')) {
            const openTicketCount = getFromStorage(SUPPORT_TICKETS_KEY, []).filter(t => t.status === 'abierto').length;
            if (openTicketsStat) openTicketsStat.textContent = openTicketCount;
            if (openTicketsBadge) {
                openTicketsBadge.textContent = openTicketCount;
                openTicketsBadge.style.display = openTicketCount > 0 ? 'inline-block' : 'none';
            }
            if (currentVisibleSectionId === 'supportTickets-content' && typeof renderAdminSupportTickets === "function") {
                renderAdminSupportTickets(searchSupportTicketsInput ? searchSupportTicketsInput.value : '');
            }
        }
    });
});

// --- admin.js ---
document.addEventListener('DOMContentLoaded', () => {
    // ... (all your existing const declarations, DOM elements, helper functions, etc.) ...

    const ADMIN_DIGITIZED_PACKAGES_KEY = 'expressboxrd_admin_packages_v3';
    const digitizePackageForm = document.getElementById('adminDigitizePackageForm');
    // ... (other elements for digitizePackageForm: clientEBCodeInput, adminOriginalTrackingInput, etc.)
    const adminPackageMessage = document.getElementById('adminPackageMessage'); // Feedback for package form

    // ... (statusMap should be defined)

    // --- Helper Functions (getFromStorage, saveToStorage, showFeedbackAdmin, calculateEstimatedTaxes) ---
    // ... (These should be the same as previously provided)

    // --- Navigation (navigateToSection and sidebar click listener) ---
    // ... (This function is crucial for refreshing section content)

    // --- Package Digitization / Editing Logic ---

    // Function to populate the digitize form when editing a package
    window.editAdminPackage = function(packageId) { // Make it global for onclick
        const packages = getFromStorage(ADMIN_DIGITIZED_PACKAGES_KEY, []);
        const pkgToEdit = packages.find(p => p.id === packageId);

        if (pkgToEdit && digitizePackageForm) {
            // Populate the form with the package's current data
            document.getElementById('adminClientEBCode').value = pkgToEdit.clientEBCode || '';
            document.getElementById('adminOriginalTracking').value = pkgToEdit.originalTracking || '';
            document.getElementById('adminPackageContent').value = pkgToEdit.content || '';
            document.getElementById('adminDeclaredValue').value = pkgToEdit.declaredValue || 0;
            document.getElementById('adminPackageWeight').value = pkgToEdit.pesoKg || 0;
            document.getElementById('adminPackageStatus').value = pkgToEdit.status || 'received_warehouse_origin';
            document.getElementById('adminIsUnknown').checked = pkgToEdit.isUnknown || false;
            document.getElementById('adminClientEBCode').disabled = pkgToEdit.isUnknown || false;


            // Store the ID of the package being edited on the form itself
            digitizePackageForm.dataset.editingPackageId = packageId;
            // Change submit button text to indicate update (optional)
            // const submitButton = digitizePackageForm.querySelector('button[type="submit"]');
            // if (submitButton) submitButton.innerHTML = '<i class="fas fa-save"></i> Actualizar Paquete';


            // Trigger input event on declared value to recalculate taxes if displayed
            const declaredValueInput = document.getElementById('adminDeclaredValue');
            if (declaredValueInput) declaredValueInput.dispatchEvent(new Event('input'));

            navigateToSection('digitizePackage'); // Switch to the digitize package tab
            document.getElementById('adminClientEBCode').focus();
            showFeedbackAdmin(adminPackageMessage, `Editando Paquete ID: ${packageId.slice(-6).toUpperCase()}. Realice cambios y guarde para actualizar.`, 'info');
        } else {
            alert("Error: Paquete no encontrado para editar.");
            digitizePackageForm.reset();
            delete digitizePackageForm.dataset.editingPackageId; // Clear editing state
        }
    };

    if (digitizePackageForm) {
        digitizePackageForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const clientEBCodeVal = document.getElementById('adminClientEBCode').value.trim().toUpperCase();
            const originalTracking = document.getElementById('adminOriginalTracking').value.trim();
            const content = document.getElementById('adminPackageContent').value.trim();
            const declaredValue = parseFloat(document.getElementById('adminDeclaredValue').value);
            const weightKg = parseFloat(document.getElementById('adminPackageWeight').value);
            const status = document.getElementById('adminPackageStatus').value;
            const isUnknown = document.getElementById('adminIsUnknown').checked;

            // Validation (same as before)
            if (((!clientEBCodeVal || clientEBCodeVal.startsWith('DESCONOCIDO-')) && !isUnknown) || !content || isNaN(declaredValue) || declaredValue < 0 || isNaN(weightKg) || weightKg <= 0) {
                 showFeedbackAdmin(adminPackageMessage, 'Código EB, contenido, valor y peso válidos son requeridos.', 'error');
                 return;
            }

            const users = getFromStorage('expressboxrd_users', []); // USERS_STORAGE_KEY
            const clientUser = users.find(u => u.expressBoxCode === clientEBCodeVal);
            const customerName = clientUser ? clientUser.fullName : (isUnknown ? 'Desconocido' : 'Cliente no registrado');
            
            const taxes = calculateEstimatedTaxes(declaredValue); // Recalculate taxes

            const packageData = { // Data from the form
                clientEBCode: isUnknown ? document.getElementById('adminClientEBCode').value : clientEBCodeVal,
                customerName,
                originalTracking,
                content,
                declaredValue,
                pesoKg: weightKg,
                status,
                isUnknown,
                taxes
                // timestamp and id are handled below
            };

            let packages = getFromStorage(ADMIN_DIGITIZED_PACKAGES_KEY, []);
            const editingPackageId = digitizePackageForm.dataset.editingPackageId; // Get ID if we are editing

            if (editingPackageId) {
                // --- EDIT MODE: Find and update the existing package ---
                const packageIndex = packages.findIndex(pkg => pkg.id === editingPackageId);
                if (packageIndex > -1) {
                    // Preserve original ID and timestamp, update the rest
                    packages[packageIndex] = {
                        ...packages[packageIndex], // Keeps original id, timestamp
                        ...packageData,           // Overwrites with new form data
                        lastUpdated: new Date().toISOString()
                    };
                    showFeedbackAdmin(adminPackageMessage, `Paquete ID ${editingPackageId.slice(-6).toUpperCase()} actualizado.`, 'success');
                } else {
                    showFeedbackAdmin(adminPackageMessage, `Error: No se encontró el paquete original (ID: ${editingPackageId}) para actualizar. Se guardará como nuevo.`, 'error');
                    // Fallback: treat as new if original vanishes (shouldn't happen)
                    packageData.id = 'pkg_adm_' + Date.now();
                    packageData.timestamp = new Date().toISOString();
                    packages.unshift(packageData);
                }
            } else {
                // --- NEW PACKAGE MODE ---
                // If an identical package (same client EB and original tracking, not unknown) already exists,
                // you might want to prevent duplicates or ask to update.
                // For now, this simpler logic allows multiple packages with same tracking if not editing.
                const existingIdenticalIndex = (!isUnknown && clientEBCodeVal && originalTracking) ?
                    packages.findIndex(p => p.clientEBCode === clientEBCodeVal && p.originalTracking === originalTracking && !p.isUnknown) : -1;

                if (existingIdenticalIndex > -1 && confirm(`Ya existe un paquete para ${clientEBCodeVal} con tracking ${originalTracking}. ¿Desea actualizarlo en lugar de crear uno nuevo?`)) {
                    packages[existingIdenticalIndex] = {
                         ...packages[existingIdenticalIndex],
                         ...packageData,
                         lastUpdated: new Date().toISOString()
                    };
                    showFeedbackAdmin(adminPackageMessage, `Paquete existente para ${clientEBCodeVal} (Tracking: ${originalTracking}) actualizado.`, 'success');
                } else {
                    packageData.id = 'pkg_adm_' + Date.now();
                    packageData.timestamp = new Date().toISOString();
                    packages.unshift(packageData); // Add new package to the beginning
                    showFeedbackAdmin(adminPackageMessage, `Paquete nuevo para ${clientEBCodeVal} digitado.`, 'success');
                }
            }

            saveToStorage(ADMIN_DIGITIZED_PACKAGES_KEY, packages);
            if (typeof renderAdminPackages === "function") { // Ensure renderAdminPackages is defined
                renderAdminPackages(document.getElementById('searchAdminPackagesInput') ? document.getElementById('searchAdminPackagesInput').value : '');
            }

            // Reset form and editing state
            digitizePackageForm.reset();
            delete digitizePackageForm.dataset.editingPackageId; // Clear the editing flag
            const submitButton = digitizePackageForm.querySelector('button[type="submit"]');
            if (submitButton) submitButton.innerHTML = '<i class="fas fa-save"></i> Guardar Paquete'; // Reset button text
            document.getElementById('adminIsUnknown').checked = false;
            document.getElementById('adminClientEBCode').disabled = false;
            if(document.getElementById('estimatedTaxesDisplay')) document.getElementById('estimatedTaxesDisplay').textContent = 'RD$ 0.00';

        });
    }
    
    // `renderAdminPackages` function should already include the edit (pencil) and delete (trash) buttons
    // function renderAdminPackages(filter = '') { ... }
    // Ensure it calls `editAdminPackage(pkg.id)` for the pencil icon.

    // --- User Management (Modal for Editing Plan, etc.) ---
    // The `openEditUserModal` and the `editUserForm` submit handler from the previous
    // comprehensive admin.js (that uses a modal instead of prompts) is what you need here.
    // It allows selecting the plan via a dropdown.
    // window.openEditUserModal = function(userEBCode) { ... }
    // if (editUserForm) { editUserForm.addEventListener('submit', (event) => { ... }); }


    // ... (Rest of your admin.js: navigation, other render functions, initializations, storage listener)
});

// --- admin.js ---
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements for Support Tickets ---
    const adminSupportTicketsTableBody = document.getElementById('adminSupportTicketsTableBody');
    const noSupportTicketsMessage = document.getElementById('noSupportTicketsMessage');
    const searchSupportTicketsInput = document.getElementById('searchSupportTicketsInput');
    const openTicketsBadge = document.getElementById('openTicketsBadge'); // Sidebar badge (optional)
    const openTicketsStat = document.getElementById('openTicketsStat');   // Dashboard stat (optional)
    // ... (other DOM elements)

    // --- THE CRUCIAL LocalStorage Key ---
    const SUPPORT_TICKETS_KEY = 'expressboxrd_support_tickets'; // MUST BE THE SAME IN cliente.js

    // --- Helper Functions (Essential) ---
    const getFromStorage = (key, defaultValue = []) => {
        try {
            return JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
        } catch (e) {
            console.error("ADMIN: Error parsing from localStorage for key:", key, e);
            return defaultValue;
        }
    };
    const saveToStorage = (key, data) => { // Needed for when admin resolves a ticket
        try {
            localStorage.setItem(key, JSON.stringify(data));
            localStorage.setItem(key + '_event_timestamp', Date.now());
            console.log(`ADMIN: Saved to ${key} and updated ${key}_event_timestamp`);
        } catch (e) {
            console.error("ADMIN: Error saving to localStorage for key:", key, e);
        }
    };
    function showFeedbackAdmin(element, message, type = 'info') { /* ... your showFeedbackAdmin ... */ }
    // ... (other helper functions if needed)


    // --- Support Tickets Logic ---
    function renderAdminSupportTickets(filter = '') {
        if (!adminSupportTicketsTableBody) {
            console.error("ADMIN: Support tickets table body not found.");
            return;
        }

        const tickets = getFromStorage(SUPPORT_TICKETS_KEY, []);
        console.log("ADMIN: Rendering support tickets. Found:", tickets.length, "tickets.", tickets); // DEBUG: See what's loaded

        adminSupportTicketsTableBody.innerHTML = '';
        const filterLower = filter.toLowerCase();

        const filteredTickets = tickets.filter(t => 
            (t.clientEBCode && t.clientEBCode.toLowerCase().includes(filterLower)) ||
            (t.clientName && t.clientName.toLowerCase().includes(filterLower)) ||
            (t.subject && t.subject.toLowerCase().includes(filterLower)) ||
            (t.id && t.id.toLowerCase().includes(filterLower)) ||
            (t.status && t.status.includes(filterLower))
        ).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by newest first

        if (noSupportTicketsMessage) {
            noSupportTicketsMessage.style.display = filteredTickets.length === 0 ? 'block' : 'none';
        }
        
        const openCount = tickets.filter(t => t.status === 'abierto').length;
        if (openTicketsBadge) {
            openTicketsBadge.textContent = openCount;
            openTicketsBadge.style.display = openCount > 0 ? 'inline-block' : 'none';
        }
        if (openTicketsStat) {
            openTicketsStat.textContent = openCount;
        }

        if (filteredTickets.length > 0) {
            filteredTickets.forEach(ticket => {
                const row = adminSupportTicketsTableBody.insertRow();
                const dateObj = new Date(ticket.timestamp);
                const formattedDate = dateObj.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric', hour:'2-digit', minute:'2-digit' });
                row.innerHTML = `
                    <td>${ticket.id.slice(-6).toUpperCase()}</td>
                    <td>${ticket.clientName || 'N/A'} (${ticket.clientEBCode || 'N/A'})</td>
                    <td>${ticket.subject ? (ticket.subject.substring(0,35) + (ticket.subject.length > 35 ? '...' : '')) : 'N/A'}</td>
                    <td>${formattedDate}</td>
                    <td><span class="ticket-status ticket-status-${ticket.status || 'desconocido'}">${(ticket.status || 'desconocido').replace('_',' ')}</span></td>
                    <td>
                        <button class="btn-icon-action small-btn action-view-ticket" onclick="viewSupportTicket('${ticket.id}')" title="Ver Detalles"><i class="fas fa-eye"></i></button>
                        ${ticket.status === 'abierto' ? `<button class="btn-icon-action small-btn action-resolve-ticket" onclick="resolveSupportTicket('${ticket.id}')" title="Marcar Resuelto"><i class="fas fa-check-circle"></i></button>` : ''}
                    </td>
                `;
            });
        }
    }

    if (searchSupportTicketsInput) {
        searchSupportTicketsInput.addEventListener('input', (e) => renderAdminSupportTickets(e.target.value));
    }

    window.viewSupportTicket = function(ticketId) { // Make it global for onclick
        const tickets = getFromStorage(SUPPORT_TICKETS_KEY, []);
        const ticket = tickets.find(t => t.id === ticketId);
        if (ticket) {
            alert(
`Ticket ID: ${ticket.id.slice(-6).toUpperCase()}
Cliente: ${ticket.clientName} (${ticket.clientEBCode})
Asunto: ${ticket.subject}
Enviado: ${new Date(ticket.timestamp).toLocaleString('es-DO')}
Estado: ${ticket.status.replace('_',' ')}
------------------------------------
Mensaje:
${ticket.message}`
            );
        }
    };

    window.resolveSupportTicket = function(ticketId) { // Make it global for onclick
        // ... (same resolveSupportTicket function from before, which also sends a notification back to client)
        if (confirm("¿Marcar este ticket como resuelto? Esto enviará una notificación al cliente.")) {
            let tickets = getFromStorage(SUPPORT_TICKETS_KEY, []);
            const ticketIndex = tickets.findIndex(t => t.id === ticketId);
            if (ticketIndex > -1) {
                tickets[ticketIndex].status = 'resuelto';
                saveToStorage(SUPPORT_TICKETS_KEY, tickets);
                renderAdminSupportTickets(searchSupportTicketsInput ? searchSupportTicketsInput.value : '');

                const clientUserEB = tickets[ticketIndex].clientEBCode;
                const clientNotifKey = 'expressboxrd_notifications_user_' + clientUserEB; // CLIENT_NOTIFICATIONS_KEY_PREFIX
                let clientNotifs = getFromStorage(clientNotifKey, []);
                clientNotifs.unshift({ /* ... notification object ... */ });
                saveToStorage(clientNotifKey, clientNotifs);
                showFeedbackAdmin(noSupportTicketsMessage, `Ticket ${ticketId.slice(-6).toUpperCase()} resuelto.`, "success");
            }
        }
    };

    // --- Navigation (ensure navigateToSection calls renderAdminSupportTickets) ---
    // function navigateToSection(sectionName) {
    //     ...
    //     if (sectionName === 'supportTickets') renderAdminSupportTickets();
    //     ...
    // }

    // --- Storage Event Listener (Crucial for detecting new tickets) ---
    window.addEventListener('storage', (event) => {
        // Check if the key that changed is the timestamp for support tickets
        if (event.key === (SUPPORT_TICKETS_KEY + '_event_timestamp')) {
            console.log("ADMIN: Se detectó actualización en los tickets de soporte. Recargando...");
            // Update dashboard/sidebar badge counts
            const openTicketCount = getFromStorage(SUPPORT_TICKETS_KEY, []).filter(t => t.status === 'abierto').length;
            if (openTicketsStat) openTicketsStat.textContent = openTicketCount;
            if (openTicketsBadge) {
                openTicketsBadge.textContent = openTicketCount;
                openTicketsBadge.style.display = openTicketCount > 0 ? 'inline-block' : 'none';
            }
            // If the support tickets section is currently visible, refresh its list
            const currentVisibleSectionElement = document.querySelector('.admin-section[style*="display: block"]');
            if (currentVisibleSectionElement && currentVisibleSectionElement.id === 'supportTickets-content') {
                renderAdminSupportTickets(searchSupportTicketsInput ? searchSupportTicketsInput.value : '');
            }
        }
        // ... (other storage event listeners for users, packages, etc.)
    });

    // --- Initial Call ---
    // (Should be part of your main initializeAdminPanel function)
    function initializeAdminPanel(){
        // ... other initializations ...
        // Initial load of ticket counts for dashboard/sidebar
        const initialOpenTickets = getFromStorage(SUPPORT_TICKETS_KEY, []).filter(t => t.status === 'abierto').length;
        if (openTicketsStat) openTicketsStat.textContent = initialOpenTickets;
        if (openTicketsBadge) {
            openTicketsBadge.textContent = initialOpenTickets;
            openTicketsBadge.style.display = initialOpenTickets > 0 ? 'inline-block' : 'none';
        }
        // When navigating to the support tickets section for the first time, renderAdminSupportTickets will be called
        // by navigateToSection.
    }
    // initializeAdminPanel(); // Make sure this is called
});

// --- admin.js ---

// ... (ensure all these DOM elements are correctly selected at the top)
const adminSupportTicketsTableBody = document.getElementById('adminSupportTicketsTableBody');
const noSupportTicketsMessage = document.getElementById('noSupportTicketsMessage');
const searchSupportTicketsInput = document.getElementById('searchSupportTicketsInput'); // If you have search
const openTicketsBadge = document.getElementById('openTicketsBadge');
const openTicketsStat = document.getElementById('openTicketsStat');

const SUPPORT_TICKETS_KEY = 'expressboxrd_support_tickets'; // Must match cliente.js
const getFromStorage = (key, defaultValue = []) => { /* ... your getFromStorage ... */ };
// ... (statusMap, planDisplayNames, etc. if needed by other parts of admin.js)

function renderAdminSupportTickets(filter = '') {
    if (!adminSupportTicketsTableBody) {
        console.error("ADMIN RENDER ERROR: 'adminSupportTicketsTableBody' (tbody) not found in DOM!");
        if (noSupportTicketsMessage) noSupportTicketsMessage.textContent = "Error: Tabla de tickets no encontrada.";
        return;
    }

    const tickets = getFromStorage(SUPPORT_TICKETS_KEY, []);
    console.log(`ADMIN: renderAdminSupportTickets called. Total tickets from storage: ${tickets.length}`, tickets);

    const filterLower = filter.toLowerCase();
    const filteredTickets = tickets.filter(t => {
        // Ensure properties exist before trying to access them
        const clientEBCode = t.clientEBCode ? t.clientEBCode.toLowerCase() : '';
        const clientName = t.clientName ? t.clientName.toLowerCase() : '';
        const subject = t.subject ? t.subject.toLowerCase() : '';
        const ticketId = t.id ? t.id.toLowerCase() : '';
        const status = t.status ? t.status.toLowerCase() : '';

        return (filter === '' || // Show all if no filter
            clientEBCode.includes(filterLower) ||
            clientName.includes(filterLower) ||
            subject.includes(filterLower) ||
            ticketId.includes(filterLower) ||
            status.includes(filterLower)
        );
    }).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by newest first

    console.log(`ADMIN: Filtered tickets to display: ${filteredTickets.length}`, filteredTickets);

    adminSupportTicketsTableBody.innerHTML = ''; // Clear previous rows

    if (noSupportTicketsMessage) {
        noSupportTicketsMessage.style.display = filteredTickets.length === 0 ? 'block' : 'none';
        if (filteredTickets.length === 0 && tickets.length > 0 && filter !== '') {
            noSupportTicketsMessage.textContent = "No hay tickets que coincidan con tu búsqueda.";
        } else if (filteredTickets.length === 0) {
            noSupportTicketsMessage.textContent = "No hay tickets de soporte.";
        }
    }
    
    // Update counts for badges/stats
    const openCount = tickets.filter(t => t.status === 'abierto').length;
    if (openTicketsBadge) {
        openTicketsBadge.textContent = openCount;
        openTicketsBadge.style.display = openCount > 0 ? 'inline-block' : 'none';
    }
    if (openTicketsStat) {
        openTicketsStat.textContent = openCount;
    }

    if (filteredTickets.length > 0) {
        filteredTickets.forEach((ticket, index) => {
            try {
                const row = adminSupportTicketsTableBody.insertRow();
                const dateObj = new Date(ticket.timestamp); // ticket.timestamp should be a valid date string
                const formattedDate = dateObj.toLocaleDateString('es-DO', { 
                    day: '2-digit', month: 'short', year: 'numeric', 
                    hour:'2-digit', minute:'2-digit', hour12: true 
                });

                // Default values for potentially missing properties
                const ticketIdDisplay = ticket.id ? ticket.id.slice(-6).toUpperCase() : 'N/A';
                const clientNameDisplay = ticket.clientName || 'N/A';
                const clientEBCodeDisplay = ticket.clientEBCode || 'N/A';
                const subjectDisplay = ticket.subject 
                                       ? (ticket.subject.substring(0,35) + (ticket.subject.length > 35 ? '...' : '')) 
                                       : 'N/A';
                const statusDisplay = (ticket.status || 'desconocido').replace('_',' ');
                const statusClass = `ticket-status-${ticket.status || 'desconocido'}`;

                // Carefully construct innerHTML
                row.innerHTML = `
                    <td>${ticketIdDisplay}</td>
                    <td>${clientNameDisplay} (${clientEBCodeDisplay})</td>
                    <td>${subjectDisplay}</td>
                    <td>${formattedDate}</td>
                    <td><span class="ticket-status ${statusClass}">${statusDisplay}</span></td>
                    <td>
                        <button class="btn-icon-action small-btn action-view-ticket" onclick="viewSupportTicket('${ticket.id}')" title="Ver Detalles"><i class="fas fa-eye"></i></button>
                        ${ticket.status === 'abierto' ? `<button class="btn-icon-action small-btn action-resolve-ticket" onclick="resolveSupportTicket('${ticket.id}')" title="Marcar Resuelto"><i class="fas fa-check-circle"></i></button>` : ''}
                    </td>
                `;
                // console.log(`ADMIN: Row ${index + 1} created for ticket ${ticket.id}`);
            } catch (error) {
                console.error(`ADMIN RENDER ERROR: Failed to create row for ticket:`, ticket, error);
                // Optionally, add a placeholder row indicating an error for this ticket
                const errorRow = adminSupportTicketsTableBody.insertRow();
                const cell = errorRow.insertCell();
                cell.colSpan = 6; // Number of columns in your table
                cell.textContent = `Error al mostrar el ticket ID: ${ticket.id ? ticket.id.slice(-6) : 'Desconocido'}. Ver consola.`;
                cell.style.color = "red";
            }
        });
    } else {
        console.log("ADMIN: No filtered tickets to display in the table.");
    }
}
// Make sure viewSupportTicket and resolveSupportTicket are globally accessible if called by onclick
// window.viewSupportTicket = function(ticketId) { /* ... */ }
// window.resolveSupportTicket = function(ticketId) { /* ... */ }

// Ensure this function is called when navigating to the support tickets section:
// function navigateToSection(sectionName) {
//     ...
//     if (sectionName === 'supportTickets') {
//         renderAdminSupportTickets(searchSupportTicketsInput ? searchSupportTicketsInput.value : '');
//     }
//     ...
// }
// And also in the storage event listener for SUPPORT_TICKETS_KEY + '_event_timestamp'
// And in initializeAdminPanel() if it's the default view or for badge counts.

// --- admin.js ---
// ... (declaraciones de CLIENT_NOTIFICATIONS_KEY_PREFIX, getFromStorage, saveToStorage, showFeedbackAdmin)

    if (sendNotificationForm) { // sendNotificationForm es el ID de tu formulario en admin.html
        sendNotificationForm.addEventListener('submit', (event) => {
            event.preventDefault();
            
            const targetUserEBCode = notificationUserEBCodeInput.value.trim().toUpperCase(); // ID del input del EB Code
            const message = notificationMessageInput.value.trim(); // ID del textarea del mensaje

            if (!targetUserEBCode || !message) {
                showFeedbackAdmin(notificationFormMessage, 'Código EB y mensaje son requeridos.', 'error');
                return;
            }

            const userSpecificNotificationsKey = CLIENT_NOTIFICATIONS_KEY_PREFIX + targetUserEBCode;
            
            // --- DEBUG LOG 1 ---
            console.log(`ADMIN: Preparando para enviar notificación.`);
            console.log(`ADMIN: Target EB Code: ${targetUserEBCode}`);
            console.log(`ADMIN: Clave de Notificación Específica del Usuario: ${userSpecificNotificationsKey}`);
            console.log(`ADMIN: Mensaje: ${message}`);

            const notificationsForThisUser = getFromStorage(userSpecificNotificationsKey, []);
            const newNotification = {
                id: 'notif_admin_' + Date.now(),
                message: message,
                timestamp: new Date().toISOString(),
                icon: 'fas fa-bullhorn',
                read: false
            };
            notificationsForThisUser.unshift(newNotification);

            // --- DEBUG LOG 2 ---
            console.log(`ADMIN: Notificaciones para este usuario ANTES de guardar:`, JSON.parse(JSON.stringify(notificationsForThisUser)));

            saveToStorage(userSpecificNotificationsKey, notificationsForThisUser); // Esta función DEBE actualizar el _event_timestamp

            // --- DEBUG LOG 3 ---
            // Verifica directamente en localStorage después de saveToStorage
            setTimeout(() => { // Pequeño delay para asegurar que el saveToStorage ha completado
                const savedNotifs = localStorage.getItem(userSpecificNotificationsKey);
                const savedTimestamp = localStorage.getItem(userSpecificNotificationsKey + '_event_timestamp');
                console.log(`ADMIN: VERIFICACIÓN localStorage para ${userSpecificNotificationsKey}:`, savedNotifs);
                console.log(`ADMIN: VERIFICACIÓN localStorage para ${userSpecificNotificationsKey}_event_timestamp:`, savedTimestamp, new Date(parseInt(savedTimestamp)).toLocaleString());
            }, 100);


            showFeedbackAdmin(notificationFormMessage, `Notificación enviada a ${targetUserEBCode}.`, 'success');
            sendNotificationForm.reset();
            if (notificationUserEBCodeInput) notificationUserEBCodeInput.focus();
        });
    }
    // admin.js
const saveToStorage = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        const timestampKey = key + '_event_timestamp';
        localStorage.setItem(timestampKey, Date.now().toString()); // Asegúrate que se guarda como string si es necesario
        console.log(`ADMIN: saveToStorage - Clave: ${key} guardada. Timestamp para ${timestampKey} actualizado a: ${Date.now()}`);
    } catch (e) {
        console.error("ADMIN: Error en saveToStorage para la clave:", key, e);
    }
};
// admin.js
const CLIENT_NOTIFICATIONS_KEY_PREFIX = 'expressboxrd_notifications_user_';
const targetUserEBCode = "EB-JUANA05"; // Tomado del input
const userSpecificNotificationsKey = CLIENT_NOTIFICATIONS_KEY_PREFIX + targetUserEBCode;
// userSpecificNotificationsKey será: "expressboxrd_notifications_user_EB-JUANA05"
// --- admin.js ---
// ... (declaraciones de CLIENT_NOTIFICATIONS_KEY_PREFIX, getFromStorage, saveToStorage, showFeedbackAdmin)

    if (sendNotificationForm) { // sendNotificationForm es el ID de tu formulario en admin.html
        sendNotificationForm.addEventListener('submit', (event) => {
            event.preventDefault();
            
            const targetUserEBCode = notificationUserEBCodeInput.value.trim().toUpperCase(); // ID del input del EB Code
            const message = notificationMessageInput.value.trim(); // ID del textarea del mensaje

            if (!targetUserEBCode || !message) {
                showFeedbackAdmin(notificationFormMessage, 'Código EB y mensaje son requeridos.', 'error');
                return;
            }

            const userSpecificNotificationsKey = CLIENT_NOTIFICATIONS_KEY_PREFIX + targetUserEBCode;
            
            // --- DEBUG LOG 1 ---
            console.log(`ADMIN: Preparando para enviar notificación.`);
            console.log(`ADMIN: Target EB Code: ${targetUserEBCode}`);
            console.log(`ADMIN: Clave de Notificación Específica del Usuario: ${userSpecificNotificationsKey}`);
            console.log(`ADMIN: Mensaje: ${message}`);

            const notificationsForThisUser = getFromStorage(userSpecificNotificationsKey, []);
            const newNotification = {
                id: 'notif_admin_' + Date.now(),
                message: message,
                timestamp: new Date().toISOString(),
                icon: 'fas fa-bullhorn',
                read: false
            };
            notificationsForThisUser.unshift(newNotification);

            // --- DEBUG LOG 2 ---
            console.log(`ADMIN: Notificaciones para este usuario ANTES de guardar:`, JSON.parse(JSON.stringify(notificationsForThisUser)));

            saveToStorage(userSpecificNotificationsKey, notificationsForThisUser); // Esta función DEBE actualizar el _event_timestamp

            // --- DEBUG LOG 3 ---
            // Verifica directamente en localStorage después de saveToStorage
            setTimeout(() => { // Pequeño delay para asegurar que el saveToStorage ha completado
                const savedNotifs = localStorage.getItem(userSpecificNotificationsKey);
                const savedTimestamp = localStorage.getItem(userSpecificNotificationsKey + '_event_timestamp');
                console.log(`ADMIN: VERIFICACIÓN localStorage para ${userSpecificNotificationsKey}:`, savedNotifs);
                console.log(`ADMIN: VERIFICACIÓN localStorage para ${userSpecificNotificationsKey}_event_timestamp:`, savedTimestamp, new Date(parseInt(savedTimestamp)).toLocaleString());
            }, 100);


            showFeedbackAdmin(notificationFormMessage, `Notificación enviada a ${targetUserEBCode}.`, 'success');
            sendNotificationForm.reset();
            if (notificationUserEBCodeInput) notificationUserEBCodeInput.focus();
        });
    }
    // --- admin.js ---
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements for Sending Notifications ---
    const sendNotificationForm = document.getElementById('adminSendNotificationForm');
    const notificationUserEBCodeInput = document.getElementById('notificationUserEBCode'); // Admin types target EB Code here
    const notificationMessageInput = document.getElementById('notificationMessage');    // The message content
    const notificationFormMessage = document.getElementById('notificationFormMessage');  // For feedback

    // --- LocalStorage Key PREFIX ---
    // This prefix is combined with the user's EB Code to create a unique key for each user's notifications
    const CLIENT_NOTIFICATIONS_KEY_PREFIX = 'expressboxrd_notifications_user_';

    // --- Helper Functions (getFromStorage, saveToStorage, showFeedbackAdmin) ---
    const getFromStorage = (key, defaultValue = []) => { /* ...your getFromStorage... */ };
    const saveToStorage = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(key + '_event_timestamp', Date.now()); // Notifies other tabs/pages
        console.log(`ADMIN: Saved to ${key} and updated ${key}_event_timestamp`);
    };
    function showFeedbackAdmin(element, message, type = 'info') { /* ...your showFeedbackAdmin... */ }

    // --- Logic for Sending Notification to a Specific Client ---
    if (sendNotificationForm) {
        sendNotificationForm.addEventListener('submit', (event) => {
            event.preventDefault();
            
            const targetUserEBCode = notificationUserEBCodeInput.value.trim().toUpperCase(); // Get target EB Code
            const message = notificationMessageInput.value.trim();

            if (!targetUserEBCode || !message) {
                showFeedbackAdmin(notificationFormMessage, 'Código EB del destinatario y mensaje son requeridos.', 'error');
                return;
            }

            // **CRUCIAL STEP: Construct the user-specific notification key**
            const userSpecificNotificationsKey = CLIENT_NOTIFICATIONS_KEY_PREFIX + targetUserEBCode;
            // Example: if targetUserEBCode is "EB-9030", key will be "expressboxrd_notifications_user_EB-9030"

            console.log(`ADMIN: Attempting to send notification to user key: ${userSpecificNotificationsKey}`);

            const notificationsForThisUser = getFromStorage(userSpecificNotificationsKey, []);

            notificationsForThisUser.unshift({ // Add to the beginning
                id: 'notif_admin_' + Date.now(),
                message: message,
                timestamp: new Date().toISOString(),
                icon: 'fas fa-bullhorn', // Icon for admin-sent notifications
                read: false              // New notifications are unread
            });

            saveToStorage(userSpecificNotificationsKey, notificationsForThisUser);
            // This saveToStorage call will update the localStorage for the specific user
            // and also update the corresponding _event_timestamp key 
            // (e.g., "expressboxrd_notifications_user_EB-9030_event_timestamp").

            showFeedbackAdmin(notificationFormMessage, `Notificación enviada a ${targetUserEBCode}.`, 'success');
            sendNotificationForm.reset();
            if (notificationUserEBCodeInput) notificationUserEBCodeInput.focus();
        });
    }

    // ... (rest of your admin.js)
});

// --- admin.js ---
document.addEventListener('DOMContentLoaded', () => {
    // ... (otras declaraciones: DOM elements, LocalStorage Keys, helper functions, statusMap, etc.)
    const ADMIN_DIGITIZED_PACKAGES_KEY = 'expressboxrd_admin_packages_v3';
    const digitizePackageForm = document.getElementById('adminDigitizePackageForm');
    const adminPackageMessage = document.getElementById('adminPackageMessage'); // Para feedback del form
    const adminPackageListTableBody = document.getElementById('adminPackageListTableBody'); // Para re-renderizar
    const searchAdminPackagesInput = document.getElementById('searchAdminPackagesInput'); // Para filtro al re-renderizar

    // Elementos del formulario de digitar paquete (asegúrate que todos estén declarados)
    const adminClientEBCodeInput = document.getElementById('adminClientEBCode');
    const adminOriginalTrackingInput = document.getElementById('adminOriginalTracking');
    const adminPackageContentInput = document.getElementById('adminPackageContent');
    const adminDeclaredValueInput = document.getElementById('adminDeclaredValue');
    const adminPackageWeightInput = document.getElementById('adminPackageWeight');
    const adminPackageStatusSelect = document.getElementById('adminPackageStatus'); // El select del estado
    const adminIsUnknownCheckbox = document.getElementById('adminIsUnknown');
    const estimatedTaxesDisplay = document.getElementById('estimatedTaxesDisplay');


    // --- Helper Functions (getFromStorage, saveToStorage, showFeedbackAdmin, calculateEstimatedTaxes) ---
    const getFromStorage = (key, defaultValue = []) => JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
    const saveToStorage = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(key + '_event_timestamp', Date.now());
        console.log(`ADMIN: saveToStorage - Clave: ${key} guardada. Timestamp actualizado.`);
    };
    function showFeedbackAdmin(element, message, type = 'info') { /* ...tu función... */ }
    function calculateEstimatedTaxes(declaredValueUSD) { /* ...tu función... */ }
    // ... (statusMap debe estar definido)

    // --- Función para poblar el formulario al editar (DEBE estar en el scope global o llamada correctamente) ---
    window.editAdminPackage = function(packageId) {
        console.log("ADMIN: editAdminPackage llamado con ID:", packageId);
        const packages = getFromStorage(ADMIN_DIGITIZED_PACKAGES_KEY, []);
        const pkgToEdit = packages.find(p => p.id === packageId);

        if (pkgToEdit && digitizePackageForm) {
            console.log("ADMIN: Paquete encontrado para editar:", pkgToEdit);
            adminClientEBCodeInput.value = pkgToEdit.clientEBCode || '';
            adminOriginalTrackingInput.value = pkgToEdit.originalTracking || '';
            adminPackageContentInput.value = pkgToEdit.content || '';
            adminDeclaredValueInput.value = pkgToEdit.declaredValue || 0;
            adminPackageWeightInput.value = pkgToEdit.pesoKg || 0;
            adminPackageStatusSelect.value = pkgToEdit.status || 'received_warehouse_origin'; // **CARGA EL ESTADO ACTUAL**
            adminIsUnknownCheckbox.checked = pkgToEdit.isUnknown || false;
            adminClientEBCodeInput.disabled = pkgToEdit.isUnknown || false;

            digitizePackageForm.dataset.editingPackageId = packageId; // **MARCA EL FORMULARIO COMO EDICIÓN**
            console.log("ADMIN: Formulario en modo edición para packageId:", packageId);

            const submitButton = digitizePackageForm.querySelector('button[type="submit"]');
            if (submitButton) submitButton.innerHTML = '<i class="fas fa-save"></i> Actualizar Paquete';

            if (adminDeclaredValueInput) adminDeclaredValueInput.dispatchEvent(new Event('input'));
            
            navigateToSection('digitizePackage'); // Asumiendo que tienes esta función de navegación
            adminClientEBCodeInput.focus();
            showFeedbackAdmin(adminPackageMessage, `Editando Paquete ID: ${packageId.slice(-6).toUpperCase()}. Cambie el estado y guarde.`, 'info');
        } else {
            console.error("ADMIN: Paquete no encontrado para editar con ID:", packageId);
            alert("Error: Paquete no encontrado para editar.");
            if(digitizePackageForm) {
                digitizePackageForm.reset();
                delete digitizePackageForm.dataset.editingPackageId;
            }
        }
    };

    // --- Lógica del Formulario de Digitar/Actualizar Paquete ---
    if (digitizePackageForm) {
        digitizePackageForm.addEventListener('submit', (event) => {
            event.preventDefault();
            console.log("ADMIN: Formulario de paquete enviado.");

            // Recolectar todos los datos del formulario
            const clientEBCodeVal = adminClientEBCodeInput.value.trim().toUpperCase();
            const originalTracking = adminOriginalTrackingInput.value.trim();
            const content = adminPackageContentInput.value.trim();
            const declaredValue = parseFloat(adminDeclaredValueInput.value);
            const weightKg = parseFloat(adminPackageWeightInput.value);
            const status = adminPackageStatusSelect.value; // **OBTIENE EL NUEVO ESTADO SELECCIONADO**
            const isUnknown = adminIsUnknownCheckbox.checked;

            // ... (tu validación de campos)
            if (((!clientEBCodeVal || clientEBCodeVal.startsWith('DESCONOCIDO-')) && !isUnknown) || !content || isNaN(declaredValue) || declaredValue < 0 || isNaN(weightKg) || weightKg <= 0) {
                 showFeedbackAdmin(adminPackageMessage, 'Datos inválidos.', 'error'); return;
            }


            const users = getFromStorage('expressboxrd_users', []);
            const clientUser = users.find(u => u.expressBoxCode === clientEBCodeVal);
            const customerName = clientUser ? clientUser.fullName : (isUnknown ? 'Desconocido' : 'Cliente no registrado');
            const taxes = calculateEstimatedTaxes(declaredValue);

            const packageDataFromForm = { // Datos actualizados o nuevos del formulario
                clientEBCode: isUnknown ? adminClientEBCodeInput.value : clientEBCodeVal, // Si es desconocido, usa el código auto-generado
                customerName,
                originalTracking,
                content,
                declaredValue,
                pesoKg: weightKg,
                status: status, // **USA EL NUEVO ESTADO DEL SELECT**
                isUnknown,
                taxes
            };
            console.log("ADMIN: Datos del paquete del formulario:", packageDataFromForm);

            let packages = getFromStorage(ADMIN_DIGITIZED_PACKAGES_KEY, []);
            const editingPackageId = digitizePackageForm.dataset.editingPackageId;

            if (editingPackageId) {
                // --- MODO EDICIÓN ---
                console.log("ADMIN: Modo EDICIÓN para packageId:", editingPackageId);
                const packageIndex = packages.findIndex(pkg => pkg.id === editingPackageId);

                if (packageIndex > -1) {
                    // Actualizar el paquete existente
                    // Conservar ID y timestamp original, sobrescribir el resto con datos del formulario
                    packages[packageIndex] = {
                        ...packages[packageIndex],      // Mantiene id, timestamp original
                        ...packageDataFromForm,         // Sobrescribe con todos los campos del formulario (incluyendo el nuevo ESTADO)
                        lastUpdated: new Date().toISOString()
                    };
                    console.log("ADMIN: Paquete actualizado:", packages[packageIndex]);
                    showFeedbackAdmin(adminPackageMessage, `Paquete ID ${editingPackageId.slice(-6).toUpperCase()} actualizado con estado: ${status}.`, 'success');
                } else {
                    console.error("ADMIN ERROR: Se intentó editar, pero el packageId no se encontró en la lista:", editingPackageId);
                    showFeedbackAdmin(adminPackageMessage, `Error al actualizar: Paquete original no encontrado. Guardado como nuevo.`, 'error');
                    // Fallback: si no se encuentra el original (no debería pasar), se guarda como nuevo
                    packageDataFromForm.id = 'pkg_adm_' + Date.now();
                    packageDataFromForm.timestamp = new Date().toISOString();
                    packages.unshift(packageDataFromForm);
                }
            } else {
                // --- MODO NUEVO PAQUETE ---
                console.log("ADMIN: Modo NUEVO PAQUETE.");
                // ... (tu lógica para prevenir duplicados o simplemente añadir si es nuevo)
                packageDataFromForm.id = 'pkg_adm_' + Date.now();
                packageDataFromForm.timestamp = new Date().toISOString();
                packages.unshift(packageDataFromForm);
                showFeedbackAdmin(adminPackageMessage, `Paquete nuevo para ${clientEBCodeVal} digitado con estado: ${status}.`, 'success');
            }

            saveToStorage(ADMIN_DIGITIZED_PACKAGES_KEY, packages); // Guardar la lista de paquetes actualizada
            
            if (typeof renderAdminPackages === "function") {
                renderAdminPackages(searchAdminPackagesInput ? searchAdminPackagesInput.value : ''); // Actualizar la tabla de "Ver Paquetes"
            }

            // Resetear formulario y estado de edición
            digitizePackageForm.reset();
            delete digitizePackageForm.dataset.editingPackageId;
            const submitButton = digitizePackageForm.querySelector('button[type="submit"]');
            if (submitButton) submitButton.innerHTML = '<i class="fas fa-save"></i> Guardar Paquete';
            if(adminIsUnknownCheckbox) adminIsUnknownCheckbox.checked = false;
            if(adminClientEBCodeInput) adminClientEBCodeInput.disabled = false;
            if(estimatedTaxesDisplay) estimatedTaxesDisplay.textContent = 'RD$ 0.00';
            
            // Opcional: Navegar de vuelta a la lista de paquetes después de guardar
            // navigateToSection('viewPackages'); 
        });
    }

    // La función renderAdminPackages debe estar definida y crear las filas de la tabla
    // incluyendo el botón de editar que llama a window.editAdminPackage(pkg.id)
    // function renderAdminPackages(filter = '') { ... }


    // Asegúrate que tu función de navegación y la inicialización del panel estén definidas y se llamen
    // function navigateToSection(sectionName) { ... }
    // function initializeAdminPanel() { ... }
    // initializeAdminPanel();
});
// --- admin.js (Completo con Gestión de Solicitudes de Plan y Expiración Manual) ---
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements (General & Existing) ---
    const sidebarNav = document.querySelector('.sidebar-nav');
    const contentAreaAdmin = document.querySelector('.content-area-admin');
    const allAdminSections = contentAreaAdmin ? contentAreaAdmin.querySelectorAll('.admin-section') : [];
    const sectionTitleHeader = document.getElementById('sectionTitle');

    // Users & Edit User Modal
    const userListTableBody = document.getElementById('adminUserListTableBody');
    const noUsersMessage = document.getElementById('noUsersMessage');
    const searchUsersInput = document.getElementById('searchUsersInput');
    const editUserModal = document.getElementById('editUserModal');
    const closeEditUserModal = document.getElementById('closeEditUserModal');
    const editUserForm = document.getElementById('editUserForm');
    const editUserModalTitleEB = document.getElementById('editUserModalTitleEB');
    const editingUserEBCodeInput = document.getElementById('editingUserEBCode');
    const editUserFullNameInput = document.getElementById('editUserFullName');
    const editUserEmailInput = document.getElementById('editUserEmail');
    const editUserPlanSelect = document.getElementById('editUserPlan');
    const editUserAutopaySelect = document.getElementById('editUserAutopay');
    const editUserBranchInput = document.getElementById('editUserBranch');
    const editUserAddressStreetInput = document.getElementById('editUserAddressStreet');
    const editUserAddressCityInput = document.getElementById('editUserAddressCity');
    const editUserAddressProvinceInput = document.getElementById('editUserAddressProvince');
    const editUserAddressReferenceInput = document.getElementById('editUserAddressReference');
    const editUserFormMessage = document.getElementById('editUserFormMessage');
    // NUEVOS CAMPOS EN EDIT USER MODAL
    const editUserPlanDurationDaysInput = document.getElementById('editUserPlanDurationDays');
    const editUserPlanExpiryDisplay = document.getElementById('editUserPlanExpiryDisplay');


    // Package Digitization & Listing
    const digitizePackageForm = document.getElementById('adminDigitizePackageForm');
    const adminClientEBCodeInput = document.getElementById('adminClientEBCode');
    const adminOriginalTrackingInput = document.getElementById('adminOriginalTracking');
    const adminPackageContentInput = document.getElementById('adminPackageContent');
    const adminDeclaredValueInput = document.getElementById('adminDeclaredValue');
    const adminPackageWeightInput = document.getElementById('adminPackageWeight');
    const adminPackageStatusSelect = document.getElementById('adminPackageStatus');
    const adminIsUnknownCheckbox = document.getElementById('adminIsUnknown');
    const adminPackageMessage = document.getElementById('adminPackageMessage');
    const estimatedTaxesDisplay = document.getElementById('estimatedTaxesDisplay');
    const adminPackageListTableBody = document.getElementById('adminPackageListTableBody');
    const noAdminPackagesMessage = document.getElementById('noAdminPackagesMessage');
    const searchAdminPackagesInput = document.getElementById('searchAdminPackagesInput');

    // Pre-Alerts
    const adminPreAlertsTableBody = document.getElementById('adminPreAlertsTableBody');
    const noPreAlertsMessage = document.getElementById('noPreAlertsMessage');
    const searchPreAlertsInput = document.getElementById('searchPreAlertsInput');

    // Support Tickets
    const adminSupportTicketsTableBody = document.getElementById('adminSupportTicketsTableBody');
    const noSupportTicketsMessage = document.getElementById('noSupportTicketsMessage');
    const searchSupportTicketsInput = document.getElementById('searchSupportTicketsInput');
    const openTicketsBadge = document.getElementById('openTicketsBadge');
    const openTicketsStat = document.getElementById('openTicketsStat');

    // Notifications (Admin to Client)
    const sendNotificationForm = document.getElementById('adminSendNotificationForm');
    const notificationUserEBCodeInput = document.getElementById('notificationUserEBCode');
    const notificationMessageInput = document.getElementById('notificationMessage');
    const notificationFormMessage = document.getElementById('notificationFormMessage');

    // Promo Codes
    const createPromoForm = document.getElementById('adminCreatePromoForm');
    const newPromoCodeInput = document.getElementById('adminNewPromoCode');
    const promoDiscountInput = document.getElementById('adminPromoDiscount');
    const createPromoMessage = document.getElementById('adminCreatePromoMessage');
    const existingPromosList = document.getElementById('adminExistingPromosList');

    // Pickup Notifications (Client to Admin)
    const adminPickupNotificationsTableBody = document.getElementById('adminPickupNotificationsTableBody');
    const noPickupNotificationsMessage = document.getElementById('noPickupNotificationsMessage');
    const searchPickupNotificationsInput = document.getElementById('searchPickupNotificationsInput');
    
    // Dashboard Stat Cards
    const statCards = document.querySelectorAll('#dashboard-content .stat-card');


    // --- NUEVOS DOM Elements para Solicitudes de Plan ---
    const pendingPlanRequestsBadge = document.getElementById('pendingPlanRequestsBadge');
    const pendingPlanRequestsStat = document.getElementById('pendingPlanRequestsStat');
    const adminPlanRequestsTableBody = document.getElementById('adminPlanRequestsTableBody');
    const noPlanRequestsMessage = document.getElementById('noPlanRequestsMessage');
    const searchPlanRequestsInput = document.getElementById('searchPlanRequestsInput');
    const reviewPlanRequestModal = document.getElementById('reviewPlanRequestModal');
    const closeReviewPlanRequestModal = document.getElementById('closeReviewPlanRequestModal');
    const modalReqId = document.getElementById('modalReqId');
    const modalReqClientName = document.getElementById('modalReqClientName');
    const modalReqClientEB = document.getElementById('modalReqClientEB');
    const modalReqClientEmail = document.getElementById('modalReqClientEmail');
    const modalReqPlan = document.getElementById('modalReqPlan');
    const modalReqProofInfo = document.getElementById('modalReqProofInfo'); // Contenedor para info de prueba
    const modalReqProofName = document.getElementById('modalReqProofName');
    const modalReqProofType = document.getElementById('modalReqProofType');
    const modalReqComment = document.getElementById('modalReqComment');
    const processPlanRequestForm = document.getElementById('processPlanRequestForm');
    const processingRequestIdInput = document.getElementById('processingRequestId');
    const processingRequestClientEBInput = document.getElementById('processingRequestClientEB');
    const processingRequestTargetPlanInput = document.getElementById('processingRequestTargetPlan');
    const processPlanRequestStatusSelect = document.getElementById('processPlanRequestStatus');
    const planDurationAdminGroup = document.getElementById('planDurationAdminGroup');
    const planDurationDaysAdminInput = document.getElementById('planDurationDaysAdmin');
    const adminNotesOnRequestInput = document.getElementById('adminNotesOnRequest');
    const processPlanRequestMessage = document.getElementById('processPlanRequestMessage');


    // --- LocalStorage Keys ---
    const USERS_STORAGE_KEY = 'expressboxrd_users';
    const ADMIN_DIGITIZED_PACKAGES_KEY = 'expressboxrd_admin_packages_v3';
    const ALL_PREALERTS_KEY = 'expressboxrd_all_prealerts';
    const CLIENT_NOTIFICATIONS_KEY_PREFIX = 'expressboxrd_notifications_user_';
    const PROMO_CODES_KEY_ADMIN = 'expressboxrd_admin_promo_codes_v1';
    const PICKUP_NOTIFICATIONS_KEY = 'expressboxrd_pickup_notifications';
    const SUPPORT_TICKETS_KEY = 'expressboxrd_support_tickets';
    const PLAN_CHANGE_REQUESTS_KEY = 'expressboxrd_plan_change_requests'; // NUEVA

    // --- Constants & Mappings ---
    const planDisplayNames = { premium: 'Premium', intermedio: 'Intermedio', basico: 'Básico', default: 'No Especificado' };
    const planIcons = { premium: 'fas fa-crown', intermedio: 'fas fa-star', basico: 'fas fa-shield-alt', default: 'fas fa-question-circle'};
    const statusMap = { /* ... tu statusMap completo ... */ };
    // ... (ITBIS_RATE, IMPORT_THRESHOLD_USD, etc.)

    // --- Helper Functions ---
    const getFromStorage = (key, defaultValue = []) => {
        try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue)); }
        catch (e) { console.error(`Error parsing LS for key ${key}:`, e); return defaultValue; }
    };
    const saveToStorage = (key, data) => {
        try { localStorage.setItem(key, JSON.stringify(data)); localStorage.setItem(key + '_event_timestamp', Date.now()); }
        catch (e) { console.error(`Error saving LS for key ${key}:`, e); }
    };
    function showFeedbackAdmin(element, message, type = 'info') {
        if (!element) { /* ... fallback ... */ return; }
        element.textContent = message; element.className = `form-feedback-admin ${type}`;
        element.style.display = 'block'; setTimeout(() => { element.style.display = 'none'; }, 4000);
    }
    function calculateEstimatedTaxes(declaredValueUSD) { /* ... tu función ... */ }


    // --- Navegación del Panel ---
    function navigateToSection(sectionName) {
        if (!allAdminSections || allAdminSections.length === 0) { console.error("Admin sections not found."); return; }
        const targetSectionId = sectionName + '-content';
        let title = sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
        const sidebarLink = sidebarNav ? sidebarNav.querySelector(`a[data-section="${sectionName}"]`) : null;
        if (sidebarLink) {
            const iconNode = sidebarLink.querySelector('.icon');
            if (iconNode && iconNode.nextSibling && iconNode.nextSibling.nodeType === Node.TEXT_NODE) {
                title = iconNode.nextSibling.textContent.trim();
            }
        } else { // Fallback titles for sections not in sidebar (if any) or if sidebar link fails
            if (sectionName === "digitizePackage") title = "Digitar Paquete";
            else if (sectionName === "viewPackages") title = "Ver Paquetes";
            else if (sectionName === "planRequests") title = "Solicitudes de Plan";
        }

        allAdminSections.forEach(section => section.style.display = 'none');
        const targetSection = document.getElementById(targetSectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            const searchInput = targetSection.querySelector('.search-input-admin');
            if (searchInput) searchInput.focus();
        } else { console.warn(`Target section "${targetSectionId}" not found.`); }
        if (sectionTitleHeader) sectionTitleHeader.textContent = title;
        if (sidebarNav && sidebarLink && sidebarLink.closest('li')) {
            sidebarNav.querySelectorAll('li').forEach(li => li.classList.remove('active'));
            sidebarLink.closest('li').classList.add('active');
        }

        // Refrescar datos de la sección
        switch (sectionName) {
            case 'users': if (typeof renderUserList === "function") renderUserList(searchUsersInput ? searchUsersInput.value : ''); break;
            case 'viewPackages': if (typeof renderAdminPackages === "function") renderAdminPackages(searchAdminPackagesInput ? searchAdminPackagesInput.value : ''); break;
            case 'preAlerts': if (typeof renderAdminPreAlerts === "function") renderAdminPreAlerts(searchPreAlertsInput ? searchPreAlertsInput.value : ''); break;
            case 'supportTickets': if (typeof renderAdminSupportTickets === "function") renderAdminSupportTickets(searchSupportTicketsInput ? searchSupportTicketsInput.value : ''); break;
            case 'planRequests': if (typeof renderPlanChangeRequests === "function") renderPlanChangeRequests(searchPlanRequestsInput ? searchPlanRequestsInput.value : ''); break; // NUEVO
            case 'pickupNotifications': if (typeof renderAdminPickupNotifications === "function") renderAdminPickupNotifications(searchPickupNotificationsInput ? searchPickupNotificationsInput.value : ''); break;
            case 'promoCodes': if (typeof renderAdminPromoCodes === "function") renderAdminPromoCodes(); break;
        }
    }
    if (sidebarNav) {
        sidebarNav.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (link && link.dataset.section) { event.preventDefault(); navigateToSection(link.dataset.section); }
            else if (link && link.getAttribute('href') === 'index.html') { return; }
            else if (link) { event.preventDefault(); }
        });
    }
    if (statCards.length > 0) {
        statCards.forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                const targetSectionName = card.dataset.sectionTarget;
                if (targetSectionName) navigateToSection(targetSectionName);
            });
        });
    }

    // --- Lógica para Actualizar Contadores del Dashboard y Sidebar ---
    function updateDashboardAndSidebarCounts() {
        // Usuarios
        if(document.getElementById('totalUsersStat')) document.getElementById('totalUsersStat').textContent = getFromStorage(USERS_STORAGE_KEY, []).length;
        // Paquetes
        if(document.getElementById('totalPackagesStat')) document.getElementById('totalPackagesStat').textContent = getFromStorage(ADMIN_DIGITIZED_PACKAGES_KEY, []).length;
        if(document.getElementById('packagesWithTaxesStat')) document.getElementById('packagesWithTaxesStat').textContent = getFromStorage(ADMIN_DIGITIZED_PACKAGES_KEY, []).filter(p => (p.taxes || 0) > 0).length;
        // Pre-Alertas
        if(document.getElementById('todayPreAlertsStat')) document.getElementById('todayPreAlertsStat').textContent = getFromStorage(ALL_PREALERTS_KEY, []).filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString()).length;
        // Tickets de Soporte
        const openTicketCount = getFromStorage(SUPPORT_TICKETS_KEY, []).filter(t => t.status === 'abierto').length;
        if (openTicketsStat) openTicketsStat.textContent = openTicketCount;
        if (openTicketsBadge) {
            openTicketsBadge.textContent = openTicketCount;
            openTicketsBadge.style.display = openTicketCount > 0 ? 'inline-block' : 'none';
        }
        // Solicitudes de Cambio de Plan
        const pendingPlanReqCount = getFromStorage(PLAN_CHANGE_REQUESTS_KEY, []).filter(req => req.status === 'pendiente').length;
        if (pendingPlanRequestsStat) pendingPlanRequestsStat.textContent = pendingPlanReqCount;
        if (pendingPlanRequestsBadge) {
            pendingPlanRequestsBadge.textContent = pendingPlanReqCount;
            pendingPlanRequestsBadge.style.display = pendingPlanReqCount > 0 ? 'inline-block' : 'none';
        }
    }


    // --- User Management (Render, Open Edit Modal, Submit Edit Form) ---
    function renderUserList(filter = '') {
        if (!userListTableBody) return;
        let users = getFromStorage(USERS_STORAGE_KEY, []);
        // ... (lógica de placeholder para TARGET_CLIENT_EB_CODE si aún la usas para demo)
        userListTableBody.innerHTML = '';
        const filterLower = filter.toLowerCase();
        const filteredUsers = users.filter(u => `${u.fullName || ''} ${u.email || ''} ${u.expressBoxCode || ''}`.toLowerCase().includes(filterLower));

        if (noUsersMessage) noUsersMessage.style.display = filteredUsers.length === 0 ? 'block' : 'none';

        filteredUsers.forEach(user => {
            const row = userListTableBody.insertRow();
            const planName = planDisplayNames[user.plan || 'default'] || planDisplayNames.default;
            const planIcon = planIcons[user.plan || 'default'] || planIcons.default;
            const autopayStatus = user.autopayEnabled ? 'Activo' : 'Inactivo';
            
            let expiryDisplay = "N/A";
            if (user.planExpiryTimestamp) {
                const expiryDate = new Date(user.planExpiryTimestamp);
                expiryDisplay = expiryDate < new Date() ? `Expiró ${expiryDate.toLocaleDateString('es-DO')}` : expiryDate.toLocaleDateString('es-DO', {day:'2-digit',month:'short'});
            } else if (user.plan !== 'basico' && user.plan !== 'default') {
                expiryDisplay = "Permanente";
            }
            
            row.innerHTML = `
                <td>${user.fullName || 'N/A'}</td> <td>${user.email || 'N/A'}</td> <td>${user.expressBoxCode || 'N/A'}</td>
                <td><i class="${planIcon}"></i> ${planName}</td> <td class="${expiryDisplay.startsWith('Expiró') ? 'plan-expired' : (expiryDisplay !== 'N/A' && expiryDisplay !== 'Permanente' ? 'plan-expires-soon' : '')}">${expiryDisplay}</td>
                <td>${autopayStatus}</td> <td>${user.branch || 'N/A'}</td>
                <td><button class="btn-icon-action small-btn" onclick="openEditUserModal('${user.expressBoxCode}')"><i class="fas fa-user-edit"></i></button></td>`;
        });
    }
    if (searchUsersInput) searchUsersInput.addEventListener('input', (e) => renderUserList(e.target.value));

    window.openEditUserModal = function(userEBCode) {
        const users = getFromStorage(USERS_STORAGE_KEY, []);
        const user = users.find(u => u.expressBoxCode === userEBCode);
        if (!user || !editUserModal || !editUserForm) { console.error("Usuario o modal no encontrado"); return; }

        editingUserEBCodeInput.value = user.expressBoxCode;
        if(editUserModalTitleEB) editUserModalTitleEB.textContent = user.expressBoxCode;
        editUserFullNameInput.value = user.fullName || ""; editUserEmailInput.value = user.email || "";
        editUserPlanSelect.value = user.plan || "basico";
        editUserAutopaySelect.value = user.autopayEnabled ? "true" : "false";
        editUserBranchInput.value = user.branch || "";
        const addr = user.address || {};
        editUserAddressStreetInput.value = addr.street || ""; editUserAddressCityInput.value = addr.city || "";
        editUserAddressProvinceInput.value = addr.province || ""; editUserAddressReferenceInput.value = addr.reference || "";
        
        // Cargar duración y mostrar fecha de expiración si existe
        if (user.planExpiryTimestamp) {
            const now = Date.now();
            const diffMillis = user.planExpiryTimestamp - now;
            if (diffMillis > 0) {
                const daysLeft = Math.ceil(diffMillis / (1000 * 60 * 60 * 24));
                editUserPlanDurationDaysInput.value = daysLeft;
                editUserPlanExpiryDisplay.value = new Date(user.planExpiryTimestamp).toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' });
            } else {
                editUserPlanDurationDaysInput.value = 0;
                editUserPlanExpiryDisplay.value = "Expirado";
            }
        } else {
            editUserPlanDurationDaysInput.value = ""; // Vacío si no hay expiración (o es básico)
            editUserPlanExpiryDisplay.value = (user.plan === 'basico' || user.plan === 'default') ? "No aplica (Básico)" : "Permanente";
        }
        editUserModal.classList.add('visible');
    }

    if (editUserPlanDurationDaysInput && editUserPlanExpiryDisplay) { // Listener para actualizar display de expiración
        editUserPlanDurationDaysInput.addEventListener('input', () => {
            const duration = parseInt(editUserPlanDurationDaysInput.value);
            if (!isNaN(duration) && duration > 0) {
                const expiryDate = new Date(Date.now() + (duration * 24 * 60 * 60 * 1000));
                editUserPlanExpiryDisplay.value = expiryDate.toLocaleString('es-DO', { dateStyle: 'long', timeStyle: 'short' });
            } else {
                const currentPlan = document.getElementById('editUserPlan').value;
                editUserPlanExpiryDisplay.value = (currentPlan === 'basico' || currentPlan === 'default') ? "No aplica (Básico)" : "Permanente / Sin expiración";
            }
        });
    }
     if (document.getElementById('editUserPlan')) { // También actualizar al cambiar el plan
        document.getElementById('editUserPlan').addEventListener('change', () => {
            if (editUserPlanDurationDaysInput) editUserPlanDurationDaysInput.dispatchEvent(new Event('input'));
        });
    }


    if (editUserForm) {
        editUserForm.onsubmit = (event) => { // Usar onsubmit para asegurar este manejador
            event.preventDefault();
            const userEBCodeToEdit = editingUserEBCodeInput.value;
            let users = getFromStorage(USERS_STORAGE_KEY, []);
            const userIndex = users.findIndex(u => u.expressBoxCode === userEBCodeToEdit);
            if (userIndex === -1) { showFeedbackAdmin(editUserFormMessage, "Error: Usuario no encontrado.", "error"); return; }
            
            users[userIndex].fullName = editUserFullNameInput.value.trim();
            users[userIndex].email = editUserEmailInput.value.trim();
            users[userIndex].autopayEnabled = editUserAutopaySelect.value === "true";
            users[userIndex].branch = editUserBranchInput.value.trim();
            users[userIndex].address = {
                street: editUserAddressStreetInput.value.trim(), city: editUserAddressCityInput.value.trim(),
                province: editUserAddressProvinceInput.value.trim(), reference: editUserAddressReferenceInput.value.trim()
            };
            
            const selectedPlan = editUserPlanSelect.value;
            const durationDays = parseInt(editUserPlanDurationDaysInput.value);
            users[userIndex].plan = selectedPlan;

            if (selectedPlan !== 'basico' && selectedPlan !== 'default' && !isNaN(durationDays) && durationDays > 0) {
                users[userIndex].planExpiryTimestamp = Date.now() + (durationDays * 24 * 60 * 60 * 1000);
            } else {
                delete users[userIndex].planExpiryTimestamp;
            }
            
            saveToStorage(USERS_STORAGE_KEY, users);
            renderUserList(searchUsersInput ? searchUsersInput.value : '');
            editUserModal.classList.remove('visible');
            showFeedbackAdmin(noUsersMessage, `Usuario ${userEBCodeToEdit} actualizado.`, "success");
        };
    }
    if (closeEditUserModal) closeEditUserModal.addEventListener('click', () => editUserModal.classList.remove('visible'));
    if (editUserModal) editUserModal.addEventListener('click', (e) => { if(e.target === editUserModal) editUserModal.classList.remove('visible'); });


    // --- NUEVA LÓGICA: Solicitudes de Cambio de Plan ---
    function renderPlanChangeRequests(filter = '') {
        if (!adminPlanRequestsTableBody) return;
        const requests = getFromStorage(PLAN_CHANGE_REQUESTS_KEY, []);
        adminPlanRequestsTableBody.innerHTML = '';
        const filterLower = filter.toLowerCase();
        const filteredRequests = requests.filter(req =>
            (req.clientFullName && req.clientFullName.toLowerCase().includes(filterLower)) ||
            (req.clientEBCode && req.clientEBCode.toLowerCase().includes(filterLower)) ||
            (req.clientEmail && req.clientEmail.toLowerCase().includes(filterLower)) ||
            (req.requestedPlan && req.requestedPlan.toLowerCase().includes(filterLower)) ||
            (req.status && req.status.toLowerCase().includes(filterLower))
        ).sort((a,b) => new Date(b.requestTimestamp) - new Date(a.requestTimestamp));

        if (noPlanRequestsMessage) noPlanRequestsMessage.style.display = filteredRequests.length === 0 ? 'block' : 'none';
        updateDashboardAndSidebarCounts(); // Actualizar contadores

        filteredRequests.forEach(req => {
            const row = adminPlanRequestsTableBody.insertRow();
            const reqDate = new Date(req.requestTimestamp).toLocaleDateString('es-DO', {day:'2-digit', month:'short', year:'numeric'});
            const planName = planDisplayNames[req.requestedPlan] || req.requestedPlan;
            const planIcon = planIcons[req.requestedPlan] || 'fas fa-question-circle';
            row.innerHTML = `
                <td>${reqDate}</td> <td>${req.clientFullName || 'N/A'}</td> <td>${req.clientEBCode}</td> <td>${req.clientEmail || 'N/A'}</td>
                <td><i class="${planIcon}"></i> ${planName}</td>
                <td>${req.paymentProofInfo ? `${req.paymentProofInfo.name.substring(0,15)}... (${(req.paymentProofInfo.size / 1024).toFixed(1)}KB)` : 'No'}</td>
                <td title="${req.comment || ''}">${req.comment ? req.comment.substring(0, 20) + '...' : '-'}</td>
                <td><span class="request-status request-status-${req.status}">${req.status}</span></td>
                <td><button class="btn-icon-action small-btn" onclick="openReviewPlanRequestModal('${req.id}')"><i class="fas fa-search-plus"></i></button></td>`;
        });
    }
    if (searchPlanRequestsInput) searchPlanRequestsInput.addEventListener('input', (e) => renderPlanChangeRequests(e.target.value));

    window.openReviewPlanRequestModal = function(requestId) {
        const requests = getFromStorage(PLAN_CHANGE_REQUESTS_KEY, []);
        const request = requests.find(r => r.id === requestId);
        if (!request || !reviewPlanRequestModal) return;

        processingRequestIdInput.value = request.id;
        processingRequestClientEBInput.value = request.clientEBCode;
        processingRequestTargetPlanInput.value = request.requestedPlan;

        modalReqId.textContent = request.id.slice(-6).toUpperCase();
        modalReqClientName.textContent = request.clientFullName;
        modalReqClientEB.textContent = request.clientEBCode;
        modalReqClientEmail.textContent = request.clientEmail;
        modalReqPlan.textContent = planDisplayNames[request.requestedPlan] || request.requestedPlan;
        if (request.paymentProofInfo) {
            modalReqProofInfo.style.display = 'inline'; // o block
            modalReqProofName.textContent = request.paymentProofInfo.name;
            modalReqProofType.textContent = request.paymentProofInfo.type;
        } else {
            modalReqProofName.textContent = 'No adjuntado';
            modalReqProofType.textContent = '';
        }
        modalReqComment.textContent = request.comment || 'Sin comentario.';
        processPlanRequestStatusSelect.value = request.status;
        adminNotesOnRequestInput.value = request.adminNotes || '';
        planDurationAdminGroup.style.display = request.status === 'aprobado' || processPlanRequestStatusSelect.value === 'aprobado' ? 'block' : 'none';
        planDurationDaysAdminInput.value = request.currentPlanDurationDays || 30; // Si ya estaba aprobado con una duración
        reviewPlanRequestModal.classList.add('visible');
    }

    if (processPlanRequestStatusSelect) {
        processPlanRequestStatusSelect.addEventListener('change', function() {
            planDurationAdminGroup.style.display = this.value === 'aprobado' ? 'block' : 'none';
        });
    }
    if (closeReviewPlanRequestModal) closeReviewPlanRequestModal.addEventListener('click', () => reviewPlanRequestModal.classList.remove('visible'));
    if (reviewPlanRequestModal) reviewPlanRequestModal.addEventListener('click', (e) => { if(e.target === reviewPlanRequestModal) reviewPlanRequestModal.classList.remove('visible'); });

    if (processPlanRequestForm) {
        processPlanRequestForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const requestId = processingRequestIdInput.value;
            const clientEBCode = processingRequestClientEBInput.value;
            const targetPlan = processingRequestTargetPlanInput.value;
            const newStatus = processPlanRequestStatusSelect.value;
            const durationDays = parseInt(planDurationDaysAdminInput.value);
            const adminNotes = adminNotesOnRequestInput.value.trim();

            let requests = getFromStorage(PLAN_CHANGE_REQUESTS_KEY, []);
            const requestIndex = requests.findIndex(r => r.id === requestId);
            if (requestIndex === -1) { /* ... error ... */ return; }

            requests[requestIndex].status = newStatus;
            requests[requestIndex].adminNotes = adminNotes;
            requests[requestIndex].processedTimestamp = new Date().toISOString();

            let userProfileUpdatedMessage = "";
            if (newStatus === 'aprobado') {
                if (isNaN(durationDays) || durationDays <= 0) { showFeedbackAdmin(processPlanRequestMessage, "Duración en días es requerida para aprobar.", "error"); return; }
                requests[requestIndex].currentPlanDurationDays = durationDays;
                
                let users = getFromStorage(USERS_STORAGE_KEY, []);
                const userIndexInUsers = users.findIndex(u => u.expressBoxCode === clientEBCode);
                if (userIndexInUsers > -1) {
                    users[userIndexInUsers].plan = targetPlan;
                    users[userIndexInUsers].planExpiryTimestamp = Date.now() + (durationDays * 24 * 60 * 60 * 1000);
                    saveToStorage(USERS_STORAGE_KEY, users);
                    userProfileUpdatedMessage = ` Plan del usuario ${clientEBCode} actualizado a ${planDisplayNames[targetPlan]}.`;
                }
            } else if (newStatus === 'rechazado' || newStatus === 'pendiente') {
                // Si se cambia de aprobado a pendiente/rechazado, se podría quitar la expiración
                let users = getFromStorage(USERS_STORAGE_KEY, []);
                const userIndexInUsers = users.findIndex(u => u.expressBoxCode === clientEBCode);
                if (userIndexInUsers > -1 && users[userIndexInUsers].plan === targetPlan && users[userIndexInUsers].planExpiryTimestamp) {
                    // Si el plan actual del usuario es el que se solicitó y tenía expiración,
                    // y ahora la solicitud se rechaza o vuelve a pendiente, ¿qué hacer?
                    // Opción 1: Revertir a básico. Opción 2: Dejar como está y admin ajusta manualmente.
                    // Por ahora, Opción 2: Admin ajusta manualmente si es necesario desde la ficha del usuario.
                    // delete users[userIndexInUsers].planExpiryTimestamp; // Opcional: quitar expiración
                    // users[userIndexInUsers].plan = 'basico'; // Opcional: revertir a básico
                    // saveToStorage(USERS_STORAGE_KEY, users);
                }
            }
            saveToStorage(PLAN_CHANGE_REQUESTS_KEY, requests);
            renderPlanChangeRequests(searchPlanRequestsInput ? searchPlanRequestsInput.value : '');
            reviewPlanRequestModal.classList.remove('visible');
            showFeedbackAdmin(noPlanRequestsMessage, `Solicitud ${requestId.slice(-6).toUpperCase()} actualizada a ${newStatus}.${userProfileUpdatedMessage}`, "success");

            // Notificar al cliente
            const clientNotifKey = CLIENT_NOTIFICATIONS_KEY_PREFIX + clientEBCode;
            let clientNotifs = getFromStorage(clientNotifKey, []);
            let notifMsg = `Tu solicitud de cambio al Plan ${planDisplayNames[targetPlan]} ha sido ${newStatus}.`;
            if(newStatus === 'aprobado') notifMsg += ` Válido por ${durationDays} días.`;
            if(adminNotes) notifMsg += ` Nota: "${adminNotes}"`;
            clientNotifs.unshift({ id: 'notif_plan_' + Date.now(), message: notifMsg, timestamp: new Date().toISOString(), icon: 'fas fa-info-circle', read: false });
            saveToStorage(clientNotifKey, clientNotifs);
        });
    }
    

    // ... (Package, Pre-Alert, Support Ticket, Notification, Promo, Pickup logic - largely same as before) ...
    // ... (Make sure their respective render functions are called by navigateToSection)

    // --- Inicialización y Storage Listener ---
    function initializeAdminPanel(){
        updateDashboardAndSidebarCounts(); // Cargar todos los contadores
        navigateToSection('dashboard'); // O la sección por defecto que prefieras
    }
    initializeAdminPanel();

    window.addEventListener('storage', (event) => {
        updateDashboardAndSidebarCounts(); // Actualizar contadores en cualquier cambio relevante
        const currentVisibleSectionElement = document.querySelector('.admin-section[style*="display: block"]');
        const currentVisibleSectionId = currentVisibleSectionElement ? currentVisibleSectionElement.id : null;
        if (!currentVisibleSectionId) return;

        const sectionName = currentVisibleSectionId.replace('-content', '');
        // Refrescar la vista actual si sus datos cambiaron
        if (event.key === (PLAN_CHANGE_REQUESTS_KEY + '_event_timestamp') && sectionName === 'planRequests') {
            if (typeof renderPlanChangeRequests === "function") renderPlanChangeRequests(searchPlanRequestsInput ? searchPlanRequestsInput.value : '');
        }
        // ... (otros if para USERS_STORAGE_KEY, ADMIN_DIGITIZED_PACKAGES_KEY, etc. llamando a sus render functions)
    });
});