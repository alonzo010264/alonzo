document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos DOM ---
    const cartItemsContainer = document.getElementById('cartItems');
    const subtotalAmountSpan = document.getElementById('subtotalAmount');
    const shippingAmountSpan = document.getElementById('shippingAmount');
    const donateCheckbox = document.getElementById('donateCheckbox');
    const donationLine = document.getElementById('donationLine');
    // const donationAmountSpan = document.getElementById('donationAmount'); // Podríamos mostrarlo si quisiéramos
    const totalAmountSpan = document.getElementById('totalAmount');
    const checkoutForm = document.getElementById('checkoutForm');
    const placeOrderButton = document.getElementById('placeOrderButton');
    const formMessage = document.getElementById('formMessage');

    // --- Datos Simulados ---
    // En una app real, esto vendría del carrito de compras
    const cart = [
        { name: "Camiseta Boxi Clásica (M)", price: 1200.00 },
        { name: "Gorra Oficial ExpressBoxRD", price: 850.00 },
    ];
    const shippingCost = 250.00; // Costo de envío fijo (simulado)
    const donationUSD = 2.99;
    // ¡IMPORTANTE! Necesitarías una tasa de cambio real o fija aquí
    const usdToDopRate = 59.50; // TASA DE EJEMPLO - ¡USA UNA REAL!
    const donationDOP = donationUSD * usdToDopRate;

    let subtotal = 0;
    let includeDonation = false;

    // --- Funciones ---
    function renderCartItems() {
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = ''; // Limpiar antes de renderizar

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Tu carrito está vacío.</p>';
            return;
        }

        cart.forEach(item => {
            subtotal += item.price;
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            itemElement.innerHTML = `
                <span class="item-name">${item.name}</span>
                <span class="item-price">RD$ ${item.price.toFixed(2)}</span>
            `;
            cartItemsContainer.appendChild(itemElement);
        });
    }

    function updateTotal() {
        if (!subtotalAmountSpan || !shippingAmountSpan || !totalAmountSpan) return;

        subtotalAmountSpan.textContent = `RD$ ${subtotal.toFixed(2)}`;
        shippingAmountSpan.textContent = `RD$ ${shippingCost.toFixed(2)}`;

        let currentTotal = subtotal + shippingCost;

        if (includeDonation) {
            currentTotal += donationDOP;
            donationLine.style.display = 'flex'; // Mostrar línea de donación
            // donationAmountSpan.textContent = `$${donationUSD.toFixed(2)} USD (Aprox. RD$ ${donationDOP.toFixed(2)})`;
        } else {
            donationLine.style.display = 'none'; // Ocultar línea de donación
        }

        totalAmountSpan.textContent = `RD$ ${currentTotal.toFixed(2)}`;
    }

    function showFormMessage(message, type) {
        if (!formMessage) return;
        formMessage.textContent = message;
        formMessage.className = `form-feedback ${type}`;
        formMessage.style.display = 'block';
    }

    // --- Inicialización ---
    renderCartItems();
    updateTotal(); // Calcular total inicial

    // --- Event Listeners ---
    if (donateCheckbox) {
        donateCheckbox.addEventListener('change', () => {
            includeDonation = donateCheckbox.checked;
            updateTotal(); // Recalcular total cuando cambia la donación
        });
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!placeOrderButton) return;

            // Deshabilitar botón
            placeOrderButton.disabled = true;
            placeOrderButton.textContent = 'Procesando Pedido...';
            formMessage.style.display = 'none'; // Ocultar mensajes anteriores

            // --- SIMULACIÓN DE PROCESO DE PAGO ---
            console.log('Simulando proceso de pago...');
            // Recolectar datos (en una app real se envían al backend/gateway)
            const formData = new FormData(checkoutForm);
            const shippingAddress = {
                fullName: formData.get('fullName'),
                phone: formData.get('phone'),
                address1: formData.get('address1'),
                // ... recolectar otros campos ...
            };
            console.log("Dirección:", shippingAddress);
            console.log("Donación Incluida:", includeDonation);

            setTimeout(() => {
                // Simular éxito
                showFormMessage('¡Pedido realizado con éxito! Gracias por tu compra' + (includeDonation ? ' y tu generosa donación.' : '.'), 'success');
                // Podrías limpiar el carrito y redirigir aquí
                // cart.length = 0; // Vaciar carrito simulado
                // renderCartItems();
                // updateTotal();
                // window.location.href = 'gracias.html'; // Redirigir a página de gracias

                // Mantener botón deshabilitado o rehabilitar
                // placeOrderButton.disabled = false;
                placeOrderButton.textContent = 'Pedido Realizado';


            }, 2500); // Simular espera de 2.5 segundos
        });
    }

});