document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos DOM ---
    const companySelect = document.getElementById('companyName');
    const otherCompanyGroup = document.getElementById('otherCompanyGroup');
    const otherCompanyNameInput = document.getElementById('otherCompanyName');
    const quoteForm = document.getElementById('b2bQuoteForm');
    const submitButton = document.getElementById('submitQuoteButton');
    const formMessage = document.getElementById('formMessage');
    const resultSection = document.getElementById('quoteResultSection');
    const trackingCodeResultSpan = document.getElementById('trackingCodeResult');
    const deliveryEstimateResultSpan = document.getElementById('deliveryEstimateResult');
    const contactEmailResultSpan = document.getElementById('contactEmailResult');
    const newQuoteButton = document.getElementById('newQuoteButton');

    // --- Verificar Elementos Esenciales ---
    if (!companySelect || !otherCompanyGroup || !quoteForm || !submitButton || !formMessage || !resultSection || !trackingCodeResultSpan || !deliveryEstimateResultSpan || !contactEmailResultSpan || !newQuoteButton) {
        console.error("Error: Faltan elementos clave del DOM para la página de cotización B2B.");
        return;
    }

    // --- Lógica para mostrar/ocultar "Otra Empresa" ---
    companySelect.addEventListener('change', () => {
        if (companySelect.value === 'Other') {
            otherCompanyGroup.style.display = 'block';
            otherCompanyNameInput.required = true; // Hacer requerido si se selecciona "Otra"
        } else {
            otherCompanyGroup.style.display = 'none';
            otherCompanyNameInput.required = false;
            otherCompanyNameInput.value = ''; // Limpiar por si acaso
        }
    });

    // --- Manejo del Envío del Formulario (Simulación) ---
    quoteForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevenir envío real

        // Ocultar sección de resultados y mensajes previos
        resultSection.style.display = 'none';
        formMessage.style.display = 'none';
        formMessage.className = 'form-feedback'; // Resetear clases

        // Deshabilitar botón
        submitButton.disabled = true;
        submitButton.textContent = 'Procesando Solicitud...';

        // --- SIMULACIÓN ---
        // 1. Recolectar datos (para la simulación y posible envío real futuro)
        const formData = new FormData(quoteForm);
        const companyEmail = formData.get('companyEmail');
        console.log('Datos de cotización (simulado):');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        // 2. Generar Código de Rastreo (Simulado)
        const trackingPrefix = 'EB-8786456'; // Prefijo fijo
        const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase(); // Parte aleatoria
        const generatedTrackingCode = trackingPrefix + randomSuffix;

        // 3. Generar Fecha Estimada (Simulada)
        const today = new Date();
        const minDays = 5; // Mínimo días hábiles
        const maxDays = 10; // Máximo días hábiles
        const estimatedDays = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
        // Simple suma de días (no considera fines de semana en esta simulación)
        const estimatedDate = new Date(today.setDate(today.getDate() + estimatedDays));
        const formattedEstimate = estimatedDate.toLocaleDateString('es-DO', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // 4. Simular espera y mostrar resultados
        setTimeout(() => {
            trackingCodeResultSpan.textContent = generatedTrackingCode;
            deliveryEstimateResultSpan.textContent = `Aprox. ${formattedEstimate}`;
            contactEmailResultSpan.textContent = companyEmail || 'tu correo'; // Mostrar email ingresado

            resultSection.style.display = 'block'; // Mostrar resultados
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); // Scroll a resultados

            // No mostrar mensaje de éxito en el formulario si mostramos la sección de resultado
            // showFeedback(formMessage, 'Solicitud enviada con éxito.', 'success');

            quoteForm.reset(); // Limpiar formulario
            otherCompanyGroup.style.display = 'none'; // Ocultar campo "Otra" si estaba visible
            // Mantener botón deshabilitado o cambiar texto
            submitButton.textContent = 'Solicitud Enviada';
            // No rehabilitar para evitar envíos duplicados fáciles en simulación

        }, 1500); // Simular 1.5 segundos de procesamiento
    });

    // --- Botón Nueva Cotización ---
    newQuoteButton.addEventListener('click', () => {
        resultSection.style.display = 'none'; // Ocultar resultados
        submitButton.disabled = false; // Rehabilitar botón de envío
        submitButton.textContent = 'Enviar Solicitud de Cotización';
        // Scroll suave de vuelta al formulario (opcional)
         const formSection = document.getElementById('quoteFormSection');
         if(formSection) {
             formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
         }
    });

    // Función auxiliar para mostrar mensajes en el formulario
    function showFeedback(element, message, type) {
        if (!element) return;
        element.textContent = message;
        element.className = `form-feedback ${type === 'error' ? 'error' : 'success'}`;
        element.style.display = 'block';
    }

});