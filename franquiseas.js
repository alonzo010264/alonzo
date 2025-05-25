document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos DOM ---
    const form = document.getElementById('franchiseApplicationForm');
    const submitButton = document.getElementById('submitApplicationButton');
    const policyCheckbox = document.getElementById('acceptPolicies');
    const formMessage = document.getElementById('formMessage');
    const companySelect = document.getElementById('companyName'); // Para el otro formulario
    const otherCompanyGroup = document.getElementById('otherCompanyGroup');

    // --- Verificar si el formulario existe (puede estar comentado) ---
    if (form && submitButton && policyCheckbox && formMessage) {

        // Habilitar/Deshabilitar botón según checkbox
        policyCheckbox.addEventListener('change', () => {
            submitButton.disabled = !policyCheckbox.checked;
        });
        // Deshabilitar botón inicialmente si el checkbox no está marcado
        submitButton.disabled = !policyCheckbox.checked;


        // --- Manejo Envío Formulario (Simulación) ---
        form.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevenir envío real

            // Doble verificación del checkbox (por si acaso)
            if (!policyCheckbox.checked) {
                showMessage('Debes aceptar las políticas de franquicia para continuar.', 'error');
                return;
            }

            // Ocultar mensaje previo y deshabilitar botón
            formMessage.style.display = 'none';
            formMessage.className = 'form-feedback'; // Resetear
            submitButton.disabled = true;
            submitButton.textContent = 'Enviando Solicitud...';

            // --- SIMULACIÓN ---
            const formData = new FormData(form);
            console.log('--- Solicitud de Franquicia (Simulado) ---');
             for (let [key, value] of formData.entries()) {
                 // Mostrar también los checkboxes de sistemas
                 if (key === 'systems[]') {
                     console.log(`systemsNeeded: ${value}`);
                 } else {
                     console.log(`${key}: ${value}`);
                 }
            }
            console.log(`Policies Accepted: ${formData.get('acceptPolicies')}`); // Verificar checkbox
            console.log('----------------------------------------');

            // Simular espera
            setTimeout(() => {
                // Mostrar mensaje de éxito específico
                showMessage('¡Solicitud enviada con éxito! Gracias por tu interés. Uno de nuestros agentes revisará tu información y te contactará pronto para discutir los próximos pasos, incluyendo una posible visita para evaluar el local propuesto. ¡Buena suerte!', 'success');
                form.reset(); // Limpiar formulario
                 policyCheckbox.checked = false; // Desmarcar checkbox
                submitButton.textContent = 'Solicitud Recibida'; // Cambiar texto final
                 // Mantener deshabilitado

            }, 2000); // Simular 2 segundos
        });

    } else if (document.querySelector('.form-disabled-message')) {
        console.log("Formulario de franquicia deshabilitado (mensaje visible).");
        // No hacer nada más si el formulario está comentado/deshabilitado
    } else {
         console.error("Error: Faltan elementos clave del formulario de franquicia.");
    }

    // --- Lógica extra si tienes el campo "Otra Empresa" de otro formulario ---
    if(companySelect && otherCompanyGroup) {
        companySelect.addEventListener('change', () => {
            if (companySelect.value === 'Other') {
                otherCompanyGroup.style.display = 'block';
                otherCompanyGroup.querySelector('input').required = true;
            } else {
                otherCompanyGroup.style.display = 'none';
                 otherCompanyGroup.querySelector('input').required = false;
                 otherCompanyGroup.querySelector('input').value = '';
            }
        });
    }

     // Función auxiliar para mostrar mensajes
    function showMessage(message, type) {
        if (!formMessage) return;
        formMessage.textContent = message;
        formMessage.className = `form-feedback ${type}`;
        formMessage.style.display = 'block';
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

});