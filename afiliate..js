document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos DOM ---
    const affiliateLinkInput = document.getElementById('affiliateLink');
    const copyLinkButton = document.getElementById('copyLinkButton');
    const whatsappShareButton = document.getElementById('whatsappShareButton');
    const shareSection = document.getElementById('shareSection');
    const rewardSection = document.getElementById('rewardSection');
    const rewardCodeDisplay = document.getElementById('rewardCode');
    const warehouseAmountSpan = document.getElementById('warehouseAmount');
    const rewardCodeRepeatDisplay = document.getElementById('rewardCodeRepeat'); // Si lo añades al HTML
    const shareAgainButton = document.getElementById('shareAgainButton');

    // --- Configuración ---
    // Simular un enlace de afiliado (en un sistema real, esto sería único por usuario)
    const baseLink = "https://expressboxrd.com/track?ref=";
    const affiliateId = generateRandomId(6); // Genera un ID corto aleatorio
    const fullAffiliateLink = baseLink + affiliateId;
    const rewardAmount = 500;
    const deductionRate = 0.02; // 2%
    const warehouseRedemptionValue = rewardAmount * (1 - deductionRate);

    // --- Funciones ---
    function generateRandomId(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    function generateRewardCode() {
        // Genera un código como BOXI-SHARE-AB12CD
        return `BOXI-SHARE-${generateRandomId(6)}`;
    }

    function showReward(code) {
        if (rewardCodeDisplay) rewardCodeDisplay.textContent = code;
        if (warehouseAmountSpan) warehouseAmountSpan.textContent = warehouseRedemptionValue.toFixed(2);
        // Si tienes el span para repetir el código:
        // if (rewardCodeRepeatDisplay) rewardCodeRepeatDisplay.textContent = code;

        // Ocultar sección de compartir, mostrar sección de recompensa
        if (shareSection) shareSection.style.display = 'none';
        if (rewardSection) {
            rewardSection.style.display = 'block';
            // Hacer scroll suave a la sección de recompensa
            rewardSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // --- Inicialización ---
    if (affiliateLinkInput) {
        affiliateLinkInput.value = fullAffiliateLink; // Mostrar enlace generado
    }
    if (warehouseAmountSpan) { // Mostrar valor calculado en la sección (incluso oculta)
        warehouseAmountSpan.textContent = warehouseRedemptionValue.toFixed(2);
    }


    // --- Event Listeners ---

    // Botón Copiar Enlace
    if (copyLinkButton && affiliateLinkInput) {
        copyLinkButton.addEventListener('click', () => {
            affiliateLinkInput.select(); // Seleccionar el texto
            affiliateLinkInput.setSelectionRange(0, 99999); // Para móviles

            try {
                const successful = document.execCommand('copy'); // Intentar copiar (método antiguo pero compatible)
                if (successful) {
                    copyLinkButton.textContent = '¡Copiado!';
                    setTimeout(() => { copyLinkButton.textContent = 'Copiar Enlace'; }, 2000);
                } else {
                    alert('No se pudo copiar el enlace automáticamente. Por favor, cópialo manualmente.');
                }
            } catch (err) {
                console.error('Error al copiar:', err);
                 alert('No se pudo copiar el enlace automáticamente. Por favor, cópialo manualmente.');
            }
             // Deseleccionar
             window.getSelection().removeAllRanges();
        });
    }

    // Botón Compartir por WhatsApp
    if (whatsappShareButton && affiliateLinkInput) {
        whatsappShareButton.addEventListener('click', () => {
            // 1. Preparar Mensaje y Enlace
            const message = encodeURIComponent(`¡Hola! Te recomiendo ExpressBoxRD para tus envíos. Usa mi enlace: ${affiliateLinkInput.value}`);
            const whatsappUrl = `https://wa.me/?text=${message}`;

            // 2. SIMULAR recompensa INMEDIATAMENTE
            const generatedCode = generateRewardCode();
            showReward(generatedCode);

             // 3. Deshabilitar botón para evitar múltiples códigos rápidos (opcional)
            whatsappShareButton.disabled = true;
            whatsappShareButton.textContent = 'Compartiendo...';
            setTimeout(() => { // Rehabilitar después de un tiempo por si falla WhatsApp
                whatsappShareButton.disabled = false;
                 whatsappShareButton.innerHTML = '<span class="icon">📱</span> Compartir por WhatsApp y Ganar'; // Restaurar icono
             }, 4000);

             // 4. Intentar abrir WhatsApp
             window.open(whatsappUrl, '_blank'); // Abrir en nueva pestaña/app

            console.log("Código generado:", generatedCode); // Para depuración
        });
    }

    // Botón Compartir de Nuevo (en la sección de recompensa)
    if (shareAgainButton && shareSection && rewardSection) {
        shareAgainButton.addEventListener('click', () => {
            // Ocultar recompensa, mostrar sección de compartir
            rewardSection.style.display = 'none';
            shareSection.style.display = 'block';
             // Rehabilitar botón principal por si acaso
             if(whatsappShareButton) {
                 whatsappShareButton.disabled = false;
                 whatsappShareButton.innerHTML = '<span class="icon">📱</span> Compartir por WhatsApp y Ganar';
             }
            // Hacer scroll suave a la sección de compartir
            shareSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

});