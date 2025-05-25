document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos DOM ---
    const form = document.getElementById('partnerApplicationForm');
    const companySelect = document.getElementById('companyName'); // Para manejar el campo "Otra"
    const otherCompanyGroup = document.getElementById('otherCompanyGroup');
    const otherCompanyNameInput = document.getElementById('otherCompanyName');
    const submitButton = document.getElementById('submitApplicationButton');
    const formMessage = document.getElementById('formMessage');

    // --- Verificar Elementos ---
    if (!form || !companySelect || !otherCompanyGroup || !otherCompanyNameInput || !submitButton || !formMessage) {
        console.error("Error: Faltan elementos clave del formulario de aplicación para socios.");
        return;
    }

    // --- Lógica Mostrar/Ocultar "Otra Empresa" ---
    companySelect.addEventListener('change', () => {
        if (companySelect.value === 'Other') {
            otherCompanyGroup.style.display = 'block';
            otherCompanyNameInput.required = true; // Hacer requerido
        } else {
            otherCompanyGroup.style.display = 'none';
            otherCompanyNameInput.required = false;
            otherCompanyNameInput.value = ''; // Limpiar
        }
    });

    // --- Manejo Envío Formulario (Simulación) ---
    form.addEventListener('submit', (event) => {
        event.preventDefault();

        // Ocultar mensaje previo y deshabilitar botón
        formMessage.style.display = 'none';
        formMessage.className = 'form-feedback'; // Resetear clases
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando Solicitud...';

        // --- SIMULACIÓN ---
        // Recolectar datos
        const formData = new FormData(form);
        console.log('--- Solicitud de Asociación (Simulado) ---');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }
        console.log('----------------------------------------');

        // Simular espera
        setTimeout(() => {
            // Mostrar mensaje de éxito
            formMessage.textContent = '¡Gracias por tu interés! Hemos recibido tu solicitud y nuestro equipo la revisará pronto. Nos pondremos en contacto contigo al correo proporcionado.';
            formMessage.classList.add('success');
            formMessage.style.display = 'block';

            form.reset(); // Limpiar formulario
            otherCompanyGroup.style.display = 'none'; // Ocultar "Otra" si estaba visible
            submitButton.textContent = 'Solicitud Enviada';
            // Mantener deshabilitado para evitar reenvíos fáciles

        }, 2000); // Simular 2 segundos
    });

});