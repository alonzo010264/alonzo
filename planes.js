document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del Modal ---
    const paymentModal = document.getElementById('paymentModal');
    const closeModalButton = paymentModal.querySelector('.close-modal');
    const modalPlanNameSpan = document.getElementById('modalPlanName');
    const paymentForm = document.getElementById('paymentForm');

    // --- Botones "Obtener Plan" ---
    const getPlanButtons = document.querySelectorAll('.btn-plan');

    // --- Abrir Modal ---
    getPlanButtons.forEach(button => {
        button.addEventListener('click', () => {
            const planName = button.dataset.plan; // Obtener el nombre del plan desde data-plan
            if (modalPlanNameSpan) {
                modalPlanNameSpan.textContent = planName; // Actualizar título del modal
            }
            paymentModal.style.display = 'block'; // Mostrar el modal
        });
    });

    // --- Cerrar Modal ---
    // Al hacer clic en la 'X'
    if (closeModalButton) {
        closeModalButton.addEventListener('click', () => {
            paymentModal.style.display = 'none';
        });
    }

    // Al hacer clic fuera del contenido del modal
    window.addEventListener('click', (event) => {
        if (event.target == paymentModal) { // Si el clic fue sobre el fondo del modal
            paymentModal.style.display = 'none';
        }
    });

    // --- Simulación de envío del formulario de pago ---
    if (paymentForm) {
        paymentForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevenir envío real
            // Aquí podrías añadir validación de los campos si quieres

            // Simular proceso
            const payButton = paymentForm.querySelector('.btn-pay');
            payButton.textContent = 'Procesando...';
            payButton.disabled = true;

            setTimeout(() => {
                // Cerrar modal
                paymentModal.style.display = 'none';
                payButton.textContent = 'Activar Plan (Simulación)';
                payButton.disabled = false;

                // Mostrar una alerta de éxito (simulación)
                alert(`¡Suscripción al Plan ${modalPlanNameSpan.textContent} simulada con éxito!`);
                // En una aplicación real, aquí redirigirías o actualizarías la interfaz de usuario.

            }, 1500); // Simular espera de 1.5 segundos
        });
    }
});