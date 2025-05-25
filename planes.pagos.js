document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos DOM ---
    const plansSection = document.getElementById('plansSelectionSection');
    const paymentSection = document.getElementById('paymentSection');
    const confirmationSection = document.getElementById('confirmationSection');
    const planButtons = document.querySelectorAll('.select-plan-btn');
    const selectedPlanText = document.getElementById('selectedPlanName');
    const selectedPlanPriceSpan = document.getElementById('selectedPlanPrice');
    const paymentTotalSpan = document.getElementById('paymentTotal');
    const selectedPlanInput = document.getElementById('selectedPlanInput'); // Si lo añades al HTML
    const paymentForm = document.getElementById('paymentForm');
    const payButton = document.getElementById('payButton');
    const cancelPaymentButton = document.getElementById('cancelPaymentButton');
    const paymentMessage = document.getElementById('paymentMessage');
    const activationCodeSpan = document.getElementById('activationCode');
    const confirmPlanNameSpan = document.getElementById('confirmPlanName');
    const contactEmailResultSpan = document.getElementById('contactEmailResult'); // Necesario para email en confirmación
    const customerEmailInput = document.getElementById('customerEmail'); // Para obtener email del form
    const newQuoteButton = document.getElementById('newQuoteButton'); // Si renombras backToPlansButton
    const backToPlansButton = document.getElementById('backToPlansButton');


    // --- Verificar Elementos Esenciales ---
    if (!plansSection || !paymentSection || !confirmationSection || !planButtons.length || !paymentForm || !payButton) {
        console.error("Error: Faltan elementos clave para la página de planes/pago.");
        return;
    }

    let selectedPlanInfo = null; // Guardar info del plan seleccionado

    // --- Event Listener para Seleccionar Plan ---
    planButtons.forEach(button => {
        button.addEventListener('click', () => {
            selectedPlanInfo = {
                name: button.dataset.planName,
                price: parseFloat(button.dataset.planPrice)
            };

            // Actualizar resumen del pago
            if (selectedPlanText) selectedPlanText.textContent = selectedPlanInfo.name;
            if (selectedPlanPriceSpan) selectedPlanPriceSpan.textContent = `$${selectedPlanInfo.price.toFixed(2)} USD`;
            if (paymentTotalSpan) paymentTotalSpan.textContent = `$${selectedPlanInfo.price.toFixed(2)} USD`;
            // Si tuvieras el input oculto:
            // if (selectedPlanInput) selectedPlanInput.value = selectedPlanInfo.name;

            // Mostrar sección de pago y ocultar planes
            plansSection.style.display = 'none';
            paymentSection.style.display = 'block';
            paymentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            paymentMessage.style.display = 'none'; // Ocultar mensajes previos
            paymentForm.reset(); // Limpiar form si se selecciona otro plan
        });
    });

    // --- Event Listener para Cancelar Pago ---
    if (cancelPaymentButton) {
        cancelPaymentButton.addEventListener('click', () => {
            paymentSection.style.display = 'none';
            plansSection.style.display = 'block'; // Mostrar planes de nuevo
            selectedPlanInfo = null; // Limpiar selección
            plansSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // --- Event Listener para Enviar Pago (Simulación) ---
    paymentForm.addEventListener('submit', (event) => {
        event.preventDefault();

        // Deshabilitar botón y limpiar mensaje
        payButton.disabled = true;
        payButton.textContent = 'Procesando...';
        paymentMessage.style.display = 'none';
        paymentMessage.className = 'form-feedback';

        // --- SIMULACIÓN DE PAGO ---
        console.log('Simulando procesamiento de pago...');
        const customerEmail = customerEmailInput ? customerEmailInput.value : '[Email no encontrado]'; // Obtener email

        // Simular espera
        setTimeout(() => {
            // Simular éxito
            const success = true; // Cambiar a false para probar error

            if (success) {
                // 1. Generar código
                const generatedCode = `EXB${selectedPlanInfo.name.substring(5, 8).toUpperCase()}-${generateRandomCodePart(7)}`;

                // 2. Poblar sección de confirmación
                if (activationCodeSpan) activationCodeSpan.textContent = generatedCode;
                if (confirmPlanNameSpan) confirmPlanNameSpan.textContent = selectedPlanInfo.name;
                // Si tuvieras el span para el email de contacto en la confirmación:
                // if (contactEmailResultSpan) contactEmailResultSpan.textContent = customerEmail;

                // 3. Mostrar confirmación, ocultar pago
                paymentSection.style.display = 'none';
                confirmationSection.style.display = 'block';
                confirmationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // Opcional: Limpiar carrito o datos relacionados si esto viene de un flujo de compra
                // localStorage.removeItem('miCarrito');

            } else {
                // Simular error
                showPaymentMessage('Error al procesar el pago. Verifica tus datos o intenta con otra tarjeta.', 'error');
                payButton.disabled = false; // Rehabilitar botón
                payButton.innerHTML = '<i class="fas fa-lock"></i> Pagar Ahora y Obtener Código';
            }

        }, 2500); // Simular 2.5 segundos
    });

     // --- Botón Volver a Planes (en la sección de confirmación) ---
     if (backToPlansButton) {
        backToPlansButton.addEventListener('click', () => {
            confirmationSection.style.display = 'none'; // Ocultar confirmación
            plansSection.style.display = 'block'; // Mostrar planes
            paymentForm.reset(); // Limpiar formulario de pago por si acaso
            payButton.disabled = false; // Rehabilitar botón de pago
            payButton.innerHTML = '<i class="fas fa-lock"></i> Pagar Ahora y Obtener Código';
            plansSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // --- Funciones Auxiliares ---
    function generateRandomCodePart(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    function showPaymentMessage(message, type) {
        if (!paymentMessage) return;
        paymentMessage.textContent = message;
        paymentMessage.className = `form-feedback ${type}`;
        paymentMessage.style.display = 'block';
    }

});