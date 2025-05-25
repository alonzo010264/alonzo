document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos DOM ---
    const planButtons = document.querySelectorAll('.select-plan-btn');
    const paymentModal = document.getElementById('paymentModal');
    const closeModalButton = paymentModal.querySelector('.close-button');
    const modalPlanName = document.getElementById('modalPlanName');
    const modalPlanPrice = document.getElementById('modalPlanPrice');
    const paymentForm = document.getElementById('paymentForm');
    const confirmPaymentButton = document.getElementById('confirmPaymentButton');
    const paymentMessage = document.getElementById('paymentMessage');

    // Verificar elementos esenciales
    if (!paymentModal || !closeModalButton || !modalPlanName || !modalPlanPrice || !paymentForm || !confirmPaymentButton || !paymentMessage) {
        console.error("Error: Faltan elementos clave del modal de pago.");
        return;
    }

    // --- Abrir Modal ---
    planButtons.forEach(button => {
        button.addEventListener('click', () => {
            const planName = button.dataset.plan;
            const planPrice = button.dataset.price;

            // Poblar el modal con la info del plan
            modalPlanName.textContent = planName;
            modalPlanPrice.textContent = `RD$ ${parseFloat(planPrice).toFixed(2)}`; // Formatear precio

            // Limpiar formulario y mensajes previos
            paymentForm.reset();
            paymentMessage.style.display = 'none';
            confirmPaymentButton.disabled = false;
            confirmPaymentButton.textContent = 'Pagar Ahora';


            // Mostrar el modal
            paymentModal.style.display = 'flex';
        });
    });

    // --- Cerrar Modal ---
    const closeModal = () => {
        paymentModal.style.display = 'none';
    };

    closeModalButton.addEventListener('click', closeModal);
    // Cerrar si se hace clic fuera del contenido
    paymentModal.addEventListener('click', (event) => {
        if (event.target === paymentModal) {
            closeModal();
        }
    });
    // Cerrar con tecla Escape
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && paymentModal.style.display === 'flex') {
            closeModal();
        }
    });

    // --- Simulación de Envío de Pago ---
    paymentForm.addEventListener('submit', (event) => {
        event.preventDefault();

        // Deshabilitar botón
        confirmPaymentButton.disabled = true;
        confirmPaymentButton.textContent = 'Procesando...';
        paymentMessage.style.display = 'none';
        paymentMessage.className = 'form-feedback small-feedback'; // Resetear

        // --- SIMULACIÓN ---
        console.log('Simulando proceso de pago...');
        // En la vida real, aquí enviarías los datos de forma segura a tu pasarela de pagos
        const cardName = document.getElementById('modalCardName').value;
        console.log("Pago iniciado por:", cardName); // NO loguear números de tarjeta reales

        // Simular espera y respuesta
        setTimeout(() => {
            // Simular éxito
            paymentMessage.textContent = '¡Pago procesado exitosamente! Hemos registrado tu solicitud de servicio.';
            paymentMessage.classList.add('success');
            paymentMessage.style.display = 'block';
            confirmPaymentButton.textContent = 'Pagado'; // Mantener deshabilitado

            // Opcional: Cerrar modal después de un tiempo
            // setTimeout(closeModal, 3000);

        }, 2000); // Simular 2 segundos
    });

});