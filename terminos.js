document.addEventListener('DOMContentLoaded', () => {
    // Obtener los elementos necesarios
    const acceptButton = document.getElementById('acceptButton');
    const declineButton = document.getElementById('declineButton');
    const acceptancePrompt = document.getElementById('acceptance-prompt');
    const feedbackSection = document.getElementById('acceptance-feedback');
    const acceptMessage = document.getElementById('acceptMessage');
    const declineMessage = document.getElementById('declineMessage');

    // Verificar si todos los elementos existen para evitar errores
    if (!acceptButton || !declineButton || !acceptancePrompt || !feedbackSection || !acceptMessage || !declineMessage) {
        console.error("Error: No se encontraron todos los elementos necesarios para la funcionalidad de aceptación.");
        return; // Detener si falta algo
    }

    // --- Event Listener para el botón Aceptar ---
    acceptButton.addEventListener('click', () => {
        // Ocultar la sección de la pregunta
        acceptancePrompt.style.display = 'none';

        // Mostrar el mensaje de agradecimiento
        acceptMessage.style.display = 'block';
        // Asegurarse de que el otro mensaje esté oculto
        declineMessage.style.display = 'none';

        // Opcional: Desplazarse hacia el mensaje de feedback
        feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // --- Event Listener para el botón Rechazar ---
    declineButton.addEventListener('click', () => {
        // Ocultar la sección de la pregunta
        acceptancePrompt.style.display = 'none';

        // Mostrar el mensaje de entendimiento/advertencia
        declineMessage.style.display = 'block';
        // Asegurarse de que el otro mensaje esté oculto
        acceptMessage.style.display = 'none';

        // Opcional: Desplazarse hacia el mensaje de feedback
        feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
});