document.addEventListener('DOMContentLoaded', () => {
    const invitationForm = document.getElementById('invitationForm');
    const referrerEmailInput = document.getElementById('referrerEmail');
    const friendEmailInput = document.getElementById('friendEmail');
    const sendInviteButton = document.getElementById('sendInviteButton');
    const formMessage = document.getElementById('formMessage');

    if (!invitationForm || !referrerEmailInput || !friendEmailInput || !sendInviteButton || !formMessage) {
        console.error("Error: No se encontraron todos los elementos del formulario de afiliados.");
        return;
    }

    invitationForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevenir envío real

        // Deshabilitar botón y limpiar mensajes anteriores
        sendInviteButton.disabled = true;
        sendInviteButton.textContent = 'Enviando...';
        formMessage.style.display = 'none';
        formMessage.classList.remove('success', 'error');

        const referrerEmail = referrerEmailInput.value.trim();
        const friendEmail = friendEmailInput.value.trim();

        // Validación simple
        if (!validateEmail(referrerEmail)) {
            showMessage('Por favor, ingresa tu correo electrónico válido.', 'error');
            resetButton();
            referrerEmailInput.focus(); // Poner foco en el campo erróneo
            return;
        }
        if (!validateEmail(friendEmail)) {
            showMessage('Por favor, ingresa un correo electrónico válido para tu amigo(a).', 'error');
            resetButton();
            friendEmailInput.focus(); // Poner foco en el campo erróneo
            return;
        }
        if (referrerEmail === friendEmail) {
            showMessage('¡No puedes invitarte a ti mismo!', 'error');
            resetButton();
            friendEmailInput.focus();
            return;
        }

        // --- SIMULACIÓN DE ENVÍO ---
        // En una aplicación real, aquí llamarías a tu API/backend
        console.log('Simulando envío de invitación...');
        console.log('Referente:', referrerEmail);
        console.log('Amigo:', friendEmail);

        // Simular espera y respuesta
        setTimeout(() => {
            // Simular éxito aleatorio (50% probabilidad para ejemplo)
            // En la vida real, el backend determinaría el éxito
            // const success = Math.random() < 0.9; // 90% de éxito simulado
            const success = true; // Forzar éxito para la demostración

            if (success) {
                showMessage(`¡Invitación enviada correctamente a ${friendEmail}! Te avisaremos cuando tu amigo(a) complete su primer servicio.`, 'success');
                friendEmailInput.value = ''; // Limpiar solo el campo del amigo
                // Dejar el botón deshabilitado para evitar spam o rehabilitar después de un tiempo
                 setTimeout(resetButton, 5000); // Rehabilitar después de 5 segundos
                 // sendInviteButton.textContent = 'Enviada'; // Dejarlo así
            } else {
                showMessage('Hubo un problema al enviar la invitación. Por favor, inténtalo de nuevo más tarde.', 'error');
                resetButton();
            }

        }, 1500); // Simular 1.5 segundos de espera
    });

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Expresión regular simple
        return re.test(String(email).toLowerCase());
    }

    function showMessage(message, type) {
        formMessage.textContent = message;
        formMessage.className = `form-feedback ${type}`; // Aplica clase 'success' o 'error'
        formMessage.style.display = 'block';
    }

    function resetButton() {
        sendInviteButton.disabled = false;
        sendInviteButton.textContent = 'Enviar Invitación';
    }
});