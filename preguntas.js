document.addEventListener('DOMContentLoaded', function () {
    const faqList = document.getElementById('faqList');

    if (!faqList) {
        console.error("Error: Elemento con id 'faqList' no encontrado.");
        return;
    }

    // Usar delegación de eventos para eficiencia
    faqList.addEventListener('click', function (event) {
        // Verificar si el clic fue en un botón de pregunta
        const questionButton = event.target.closest('.faq-question');
        if (!questionButton) {
            return; // No fue un clic en un botón de pregunta
        }

        const currentItem = questionButton.closest('.faq-item');
        if (!currentItem) {
            return; // No se encontró el contenedor .faq-item
        }

        const isActive = currentItem.classList.contains('active');
        const currentlyActiveItem = faqList.querySelector('.faq-item.active');

        // 1. Cerrar el item activo si existe y no es el mismo que se clickeó
        if (currentlyActiveItem && currentlyActiveItem !== currentItem) {
            currentlyActiveItem.classList.remove('active');
            currentlyActiveItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        }

        // 2. Alternar (toggle) el estado activo del item clickeado
        currentItem.classList.toggle('active');
        questionButton.setAttribute('aria-expanded', !isActive); // Poner el estado contrario al que tenía

    });
});