document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos DOM ---
    const packageEntryForm = document.getElementById('packageEntryForm');
    const trackingCodeInput = document.getElementById('trackingCode');
    const customerNameInput = document.getElementById('customerName');
    const packageContentInput = document.getElementById('packageContent');
    const packageStatusSelect = document.getElementById('packageStatus');
    const currentLocationInput = document.getElementById('currentLocation');
    const isUnknownCheckbox = document.getElementById('isUnknown');
    const entryFormMessage = document.getElementById('entryFormMessage');

    const digitizedPackagesTableBody = document.getElementById('digitizedPackagesBody');
    const searchInput = document.getElementById('searchInput');
    const clearAllPackagesButton = document.getElementById('clearAllPackagesButton');

    // --- Clave para LocalStorage ---
    const DIGITIZED_PACKAGES_KEY = 'expressboxrd_digitized_packages_v2';

    // --- Mapeo de Estados (Incluye Iconos Font Awesome) ---
    const statusMap = {
        'received_warehouse_miami': { text: 'Recibido Almacén Miami', class: 'status-received_warehouse_miami', icon: 'fas fa-warehouse' },
        'received_warehouse_spain': { text: 'Recibido Almacén España', class: 'status-received_warehouse_spain', icon: 'fas fa-warehouse' },
        'received_warehouse_brazil': { text: 'Recibido Almacén Brasil', class: 'status-received_warehouse_brazil', icon: 'fas fa-warehouse' },
        'in_transit_to_rd': { text: 'En Tránsito a RD', class: 'status-in_transit_to_rd', icon: 'fas fa-plane-departure' },
        'customs_rd': { text: 'En Aduanas RD', class: 'status-customs_rd', icon: 'fas fa-building-shield' },
        'received_branch_rd': { text: 'En Sucursal RD', class: 'status-received_branch_rd', icon: 'fas fa-store' },
        'out_for_delivery_rd': { text: 'En Ruta de Entrega', class: 'status-out_for_delivery_rd', icon: 'fas fa-truck-fast' },
        'delivered_rd': { text: 'Entregado', class: 'status-delivered_rd', icon: 'fas fa-house-chimney-user' },
        'unknown_package': { text: 'Paquete Desconocido', class: 'status-unknown_package', icon: 'fas fa-question-circle' }
    };

    // --- Cargar y Renderizar Paquetes ---
    function getDigitizedPackages() {
        const packagesJson = localStorage.getItem(DIGITIZED_PACKAGES_KEY);
        try {
            return packagesJson ? JSON.parse(packagesJson) : [];
        } catch (e) {
            console.error("Error al parsear paquetes digitados:", e);
            return [];
        }
    }

    function saveDigitizedPackages(packages) {
        localStorage.setItem(DIGITIZED_PACKAGES_KEY, JSON.stringify(packages));
    }

    function renderPackages(filterText = '') {
        if (!digitizedPackagesTableBody) return;
        const packages = getDigitizedPackages();
        digitizedPackagesTableBody.innerHTML = ''; // Limpiar tabla

        const filteredPackages = packages.filter(pkg =>
            (pkg.trackingCode && pkg.trackingCode.toLowerCase().includes(filterText.toLowerCase())) ||
            (pkg.customerName && pkg.customerName.toLowerCase().includes(filterText.toLowerCase()))
        );

        if (filteredPackages.length === 0) {
            digitizedPackagesTableBody.innerHTML = `<tr><td colspan="7" class="loading-placeholder">${filterText ? 'No hay paquetes que coincidan con tu búsqueda.' : 'No hay paquetes digitados.'}</td></tr>`;
            return;
        }

        filteredPackages.forEach((pkg, index) => {
            const row = digitizedPackagesTableBody.insertRow();
            row.dataset.packageId = pkg.id;

            const statusInfo = statusMap[pkg.status] || { text: pkg.status, class: 'status-pending', icon: 'fas fa-circle-question' };
            const dateObj = new Date(pkg.timestamp);
            const formattedDate = dateObj.toLocaleDateString('es-DO', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'});

            row.innerHTML = `
                <td>${pkg.trackingCode || 'N/A'}</td>
                <td>${pkg.customerName || (pkg.isUnknown ? '<em>Desconocido</em>' : 'N/A')}</td>
                <td>${pkg.content || 'N/A'}</td>
                <td><span class="status-badge ${statusInfo.class}"><i class="${statusInfo.icon}"></i> ${statusInfo.text}</span></td>
                <td>${pkg.location || 'N/A'}</td>
                <td>${formattedDate}</td>
                <td class="table-actions">
                    <button class="btn-edit" data-id="${pkg.id}" title="Editar Paquete"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete-entry" data-id="${pkg.id}" title="Eliminar Paquete"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
        });
    }

    // --- Manejo del Formulario ---
    if (packageEntryForm) {
        packageEntryForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!trackingCodeInput || !packageContentInput || !packageStatusSelect || !entryFormMessage) return;

            const trackingCode = trackingCodeInput.value.trim().toUpperCase();
            const customerName = customerNameInput.value.trim();
            const packageContent = packageContentInput.value.trim();
            const packageStatus = packageStatusSelect.value;
            const currentLocation = currentLocationInput.value.trim();
            const isUnknown = isUnknownCheckbox.checked;

            if (!trackingCode && !isUnknown) { // Requiere código si no es desconocido
                showFormMessage(entryFormMessage, 'El Código de Seguimiento es requerido si el paquete no es desconocido.', 'error');
                trackingCodeInput.focus();
                return;
            }
            if (!packageContent) {
                 showFormMessage(entryFormMessage, 'La descripción del contenido es requerida.', 'error');
                 packageContentInput.focus();
                 return;
            }

            let packages = getDigitizedPackages();
            const existingPackageIndex = trackingCode ? packages.findIndex(p => p.trackingCode === trackingCode) : -1;
            let message = '';

            if (existingPackageIndex > -1) { // Actualizar paquete existente (si tiene código)
                packages[existingPackageIndex] = {
                    ...packages[existingPackageIndex], // Mantener ID y timestamp original
                    customerName: customerName || packages[existingPackageIndex].customerName, // No borrar nombre si estaba
                    content: packageContent,
                    status: packageStatus,
                    location: currentLocation,
                    isUnknown: isUnknown,
                    lastUpdated: new Date().toISOString()
                };
                message = `Paquete ${trackingCode} actualizado con éxito.`;
            } else { // Añadir nuevo paquete
                const newPackage = {
                    id: Date.now().toString(),
                    trackingCode: trackingCode,
                    customerName: customerName,
                    content: packageContent,
                    status: packageStatus,
                    location: currentLocation,
                    isUnknown: isUnknown,
                    timestamp: new Date().toISOString()
                };
                packages.unshift(newPackage);
                message = `Paquete ${trackingCode || '(Nuevo Desconocido)'} añadido con éxito.`;
            }

            saveDigitizedPackages(packages);
            renderPackages(searchInput ? searchInput.value : ''); // Re-renderizar con filtro actual
            showFormMessage(entryFormMessage, message, 'success');
            packageEntryForm.reset(); // Limpiar formulario
            isUnknownCheckbox.checked = false; // Asegurar que no quede marcado
            trackingCodeInput.focus(); // Foco en el primer campo

            setTimeout(() => { if(entryFormMessage) entryFormMessage.style.display = 'none'; }, 3000);
        });
    }

    // --- Lógica para "Paquete Desconocido" ---
    if(isUnknownCheckbox && trackingCodeInput && customerNameInput) {
        isUnknownCheckbox.addEventListener('change', () => {
            if (isUnknownCheckbox.checked) {
                trackingCodeInput.value = `DESC-${Date.now().toString().slice(-6)}`; // Generar ID temporal
                trackingCodeInput.disabled = true; // Deshabilitar para que no lo cambien
                customerNameInput.value = 'Paquete Desconocido';
                customerNameInput.disabled = true;
                packageStatusSelect.value = 'unknown_package'; // Seleccionar estado
            } else {
                trackingCodeInput.disabled = false;
                trackingCodeInput.value = ''; // Limpiar si se desmarca
                customerNameInput.disabled = false;
                customerNameInput.value = '';
                packageStatusSelect.value = 'received_warehouse_miami'; // Volver a un estado por defecto
            }
        });
    }


    // --- Editar y Eliminar (Delegación de Eventos) ---
    if (digitizedPackagesTableBody) {
        digitizedPackagesTableBody.addEventListener('click', (event) => {
            const target = event.target.closest('button');
            if (!target) return;

            const packageId = target.dataset.id;
            let packages = getDigitizedPackages();

            if (target.classList.contains('btn-edit')) {
                const pkgToEdit = packages.find(p => p.id === packageId);
                if (pkgToEdit) {
                    // Llenar el formulario con los datos del paquete
                    trackingCodeInput.value = pkgToEdit.trackingCode || '';
                    customerNameInput.value = pkgToEdit.customerName || '';
                    packageContentInput.value = pkgToEdit.content || '';
                    packageStatusSelect.value = pkgToEdit.status || 'received_warehouse_miami';
                    currentLocationInput.value = pkgToEdit.location || '';
                    isUnknownCheckbox.checked = pkgToEdit.isUnknown || false;
                    // Habilitar/deshabilitar campos si es desconocido
                    trackingCodeInput.disabled = pkgToEdit.isUnknown || false;
                    customerNameInput.disabled = pkgToEdit.isUnknown || false;

                    trackingCodeInput.focus(); // Poner foco para editar
                    // Opcional: Cambiar texto del botón a "Actualizar"
                    // if(submitButton) submitButton.textContent = "Actualizar Paquete";
                    // Eliminar el paquete de la lista para que el submit lo vuelva a añadir (o lo actualice)
                    // Esto es una forma simple de "editar". Una mejor UI tendría un modo edición.
                    packages = packages.filter(p => p.id !== packageId);
                    saveDigitizedPackages(packages);
                    renderPackages(searchInput ? searchInput.value : '');
                     showFormMessage(entryFormMessage, `Editando paquete ${pkgToEdit.trackingCode || 'Desconocido'}. Guarda para confirmar cambios.`, 'info');

                }
            } else if (target.classList.contains('btn-delete-entry')) {
                const pkgToDelete = packages.find(p => p.id === packageId);
                if (confirm(`¿Seguro que quieres eliminar el paquete ${pkgToDelete.trackingCode || '(Desconocido)'}? Esta acción no se puede deshacer.`)) {
                    packages = packages.filter(p => p.id !== packageId);
                    saveDigitizedPackages(packages);
                    renderPackages(searchInput ? searchInput.value : '');
                    showFormMessage(entryFormMessage, 'Paquete eliminado.', 'success');
                     setTimeout(() => { if(entryFormMessage) entryFormMessage.style.display = 'none'; }, 3000);
                }
            }
        });
    }

    // --- Búsqueda ---
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderPackages(searchInput.value);
        });
    }

    // --- Limpiar Todo (Demo) ---
    if (clearAllPackagesButton) {
        clearAllPackagesButton.addEventListener('click', () => {
            if (confirm("¿Seguro que quieres borrar TODOS los paquetes digitados localmente (Solo para demostración)?")) {
                localStorage.removeItem(DIGITIZED_PACKAGES_KEY);
                renderPackages();
                alert("Paquetes locales borrados.");
            }
        });
    }

    // Función auxiliar para mensajes del formulario
    function showFormMessage(element, message, type) {
        if (!element) return;
        element.textContent = message;
        element.className = `form-feedback ${type}`;
        element.style.display = 'block';
        if (type === 'success' || type === 'info') {
            setTimeout(() => { element.style.display = 'none'; }, 3000);
        }
    }

    // --- Inicializar ---
    renderPackages();

});