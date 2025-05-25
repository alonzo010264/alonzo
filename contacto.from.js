document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contactFormEmailJS'); // <<< Asegúrate que el ID coincida con tu form
    const submitButton = document.getElementById('submitButton');
    const formStatus = document.getElementById('formStatus');

    // Clave para guardar TODOS los contactos
    const CONTACTS_STORAGE_KEY = 'expressboxrd_all_contacts';
    // Clave DIFERENTE para notificar al admin (esto ayuda a disparar el evento 'storage')
    const NEW_CONTACT_NOTIFICATION_KEY = 'expressboxrd_new_contact_event';

    if (!form || !submitButton || !formStatus) {
        console.error("Error: Elementos del formulario de contacto no encontrados.");
        return;
    }

    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevenir envío normal

        // Deshabilitar botón y limpiar mensajes previos
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';
        formStatus.style.display = 'none';
        formStatus.className = 'form-feedback';

        // --- Recolectar Datos del Formulario ---
        const formData = new FormData(form);
        const contactData = {
            id: Date.now().toString(), // ID simple único basado en tiempo
            timestamp: new Date().toISOString(),
            // *** ASEGÚRATE que estos 'name' coincidan con tu HTML ***
            name: formData.get('nombre') || 'N/A',
            email: formData.get('email_cliente') || 'N/A',
            subject: formData.get('asunto') || 'Sin Asunto',
            message: formData.get('mensaje') || '',
            status: 'nuevo' // Marcar como nuevo
        };

        // --- SIMULACIÓN DE ENVÍO (Aquí podrías añadir tu lógica de EmailJS si aún la quieres) ---
        console.log('Simulando envío y guardando en localStorage...');
        // Por ejemplo, aquí iría la llamada a emailjs.sendForm(...)
        // const sendPromise = emailjs.sendForm(serviceID, templateID, this);
        // Por ahora, simulamos éxito inmediato para guardar:
        const sendPromise = Promise.resolve(); // Simular que siempre funciona

        sendPromise.then(() => {
            // --- GUARDAR EN LOCALSTORAGE (La parte clave) ---
            try {
                // 1. Obtener lista actual, añadir nuevo, guardar lista completa
                const allContacts = JSON.parse(localStorage.getItem(CONTACTS_STORAGE_KEY) || '[]');
                allContacts.unshift(contactData); // Añadir al inicio
                localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(allContacts));

                // 2. Guardar solo el nuevo (con timestamp extra) para disparar evento 'storage'
                // Esto es lo que la página admin escuchará "al instante"
                localStorage.setItem(NEW_CONTACT_NOTIFICATION_KEY, JSON.stringify({ ...contactData, notifiedAt: Date.now() }));

                console.log("Contacto guardado en localStorage.");
                showSuccess(formStatus, '¡Mensaje enviado con éxito!'); // Mensaje para el usuario
                form.reset();
                submitButton.textContent = 'Enviado';
                // No rehabilitar botón inmediatamente

            } catch (e) {
                console.error("Error guardando en localStorage:", e);
                showError(formStatus,'Hubo un error interno al procesar tu mensaje.');
                resetButton();
            }
            // -----------------------------------------------

        }).catch((error) => { // Si la promesa de envío falla
            console.error('Error en el proceso de envío simulado:', error);
            showError(formStatus, 'Error al enviar el mensaje. Intenta de nuevo.');
            resetButton();
        });
    });

    // Funciones auxiliares para mensajes
    function showSuccess(element, message) {
        element.textContent = message;
        element.classList.remove('error');
        element.classList.add('success');
        element.style.display = 'block';
    }
    function showError(element, message) {
        element.textContent = message;
        element.classList.remove('success');
        element.classList.add('error');
        element.style.display = 'block';
    }
    function resetButton() {
        submitButton.disabled = false;
        submitButton.textContent = 'Enviar Mensaje y Recibir Confirmación'; // O el texto original
    }
});