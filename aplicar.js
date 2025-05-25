document.addEventListener('DOMContentLoaded', () => {
    const applicationForm = document.getElementById('applicationForm');
    const submitButton = document.getElementById('submitApplicationButton');
    const fileInput = document.getElementById('resumeFile');
    const formMessage = document.getElementById('formMessage');

    if (!applicationForm || !submitButton || !fileInput || !formMessage) {
        console.error("Error: Faltan elementos clave del formulario de aplicación. Verifique IDs: applicationForm, submitApplicationButton, resumeFile, formMessage.");
        return;
    }

    applicationForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const file = fileInput.files[0];

        if (!file) {
            showMessage('Por favor, adjunta tu CV/Hoja de Vida.', 'error');
            fileInput.focus();
            return;
        }

        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        if (!allowedTypes.includes(file.type)) {
            showMessage('Formato de archivo no permitido. Sube PDF, DOC, DOCX o TXT.', 'error');
            fileInput.value = '';
            fileInput.focus();
            return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            showMessage('El archivo es demasiado grande (máximo 5MB).', 'error');
            fileInput.value = '';
            fileInput.focus();
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';
        formMessage.style.display = 'none';
        formMessage.className = 'form-feedback';

        console.log('Simulando envío de aplicación...');
        const formData = new FormData(applicationForm);
        console.log('Datos a enviar (simulado):');
        for (let [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log(`${key}: ${value.name} (${value.size} bytes, type: ${value.type})`);
            } else {
                console.log(`${key}: ${value}`);
            }
        }

        setTimeout(() => {
            showMessage('¡Gracias por enviar tu solicitud! Estará en revisión. Te enviaremos un correo electrónico para informarte sobre los próximos pasos y si aplicas para la vacante.', 'success');
            applicationForm.reset();
            submitButton.textContent = 'Aplicación Enviada';
        }, 2000);
    });

    function showMessage(message, type) {
        if (!formMessage) return;
        formMessage.textContent = message;
        formMessage.className = `form-feedback ${type}`;
        formMessage.style.display = 'block';
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});