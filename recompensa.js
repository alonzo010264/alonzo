document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    const emailForm = document.getElementById('emailForm');
    const emailInput = document.getElementById('email');
    const claimButton = document.getElementById('claimButton');
    const emailError = document.getElementById('emailError');
    const benefitsSection = document.getElementById('benefits-section');
    const emailSection = document.getElementById('email-section');
    const wheelSection = document.getElementById('wheel-section');
    const resultSection = document.getElementById('result-section');
    const wheel = document.getElementById('wheel');
    const prizeResultDisplay = document.getElementById('prizeResult');
    const rewardCodeDisplay = document.getElementById('rewardCode');
    const rewardCodeRepeatDisplay = document.getElementById('rewardCodeRepeat');
    const confettiCanvas = document.getElementById('confetti-canvas');

    // --- Configuración de Premios ---
    // !!! Asegúrate que el orden coincida con los segmentos visuales del CSS (conic-gradient) !!!
    const prizes = [
        "Envío Nacional GRATIS",         // Segmento 1 (0-60deg)
        "30 Días Almacenamiento GRATIS", // Segmento 2 (60-120deg)
        "Envío Mercancía Preferida GRATIS",// Segmento 3 (120-180deg)
        "1 Mes Recibir Paquetes GRATIS", // Segmento 4 (180-240deg)
        "Descuento 10% Próximo Envío",   // Segmento 5 (240-300deg)
        "¡Doble Oportunidad!"            // Segmento 6 (300-360deg) - Ejemplo
    ];
    const numPrizes = prizes.length;
    const degreesPerPrize = 360 / numPrizes;
    let isSpinning = false;
    let hasClaimed = false; // Para evitar múltiples reclamos

    // --- Funcionalidad del Formulario ---
    emailForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Evita que la página se recargue
        if (isSpinning || hasClaimed) return; // No hacer nada si ya está girando o reclamado

        const email = emailInput.value.trim();

        // Validación simple de email
        if (!email || !validateEmail(email)) {
            emailError.textContent = 'Por favor, ingresa un correo electrónico válido.';
            emailError.style.display = 'block';
            return;
        }

        // --- Aquí iría la lógica para VERIFICAR si el email ya reclamó (necesita backend) ---
        // Por ahora, simularemos que es la primera vez.
        console.log(`Email registrado: ${email}`);
        hasClaimed = true; // Marcar como reclamado (para simulación frontend)
        emailError.style.display = 'none';
        claimButton.disabled = true;
        claimButton.textContent = 'Procesando...';

        // Ocultar secciones y mostrar la ruleta
        benefitsSection.style.display = 'none';
        emailSection.style.display = 'none';
        wheelSection.style.display = 'block';

        // Iniciar el giro después de una pequeña pausa
        setTimeout(spinWheel, 500);
    });

    // --- Función para Validar Email (Simple) ---
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    // --- Función para Girar la Ruleta ---
    function spinWheel() {
        if (isSpinning) return;
        isSpinning = true;

        // Calcular premio aleatorio
        const randomIndex = Math.floor(Math.random() * numPrizes);
        const winningPrize = prizes[randomIndex];

        // Calcular ángulo de parada
        // Rotaciones completas (ej. 5-10) + ángulo del premio + ajuste fino aleatorio
        const fullRotations = 5 + Math.floor(Math.random() * 5);
        // Ángulo para que el *medio* del segmento ganador quede debajo del puntero (que está arriba a 270 grados o -90)
        const targetAngle = (degreesPerPrize * randomIndex) + (degreesPerPrize / 2);
        // Ajuste aleatorio dentro del segmento ganador (ej. +/- 20% del tamaño del segmento)
        const randomOffset = (Math.random() - 0.5) * degreesPerPrize * 0.4;
        // Ángulo final (rotación total + ángulo objetivo ajustado + offset para puntero)
        // El puntero está arriba (270deg). Para que el medio del segmento quede ahí:
        const finalAngle = (fullRotations * 360) + targetAngle + randomOffset - (degreesPerPrize / 2); // Ajustamos para alinear el *inicio* del segmento
        // Aplicar rotación
        wheel.style.transition = 'transform 6s cubic-bezier(0.25, 0.1, 0.25, 1)'; // Transición más larga y suave
        wheel.style.transform = `rotate(${finalAngle}deg)`;

        console.log(`Girando a: ${finalAngle}deg. Premio: ${winningPrize}`);

        // Esperar a que termine la animación para mostrar resultado
        setTimeout(() => {
            showResult(winningPrize);
            isSpinning = false;
        }, 6100); // Un poco más que la duración de la transición CSS
    }

    // --- Función para Generar Código Aleatorio ---
    function generateCode(length = 8) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'BOXI-';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // --- Función para Mostrar Resultado ---
    function showResult(prize) {
        const uniqueCode = generateCode();

        prizeResultDisplay.textContent = prize;
        rewardCodeDisplay.textContent = uniqueCode;
        rewardCodeRepeatDisplay.textContent = uniqueCode; // Repetir en instrucciones

        // Ocultar ruleta y mostrar resultados
        wheelSection.style.display = 'none';
        resultSection.style.display = 'block';

        // ¡Lanzar Confeti!
        launchConfetti();
    }

    // --- Función para Lanzar Confeti ---
    function launchConfetti() {
        if (typeof confetti === 'function') {
            const duration = 5 * 1000; // 5 segundos
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10 };

            function randomInRange(min, max) {
                return Math.random() * (max - min) + min;
            }

            const interval = setInterval(function() {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                // Lanzar desde ambos lados
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
                confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
            }, 250);
        } else {
            console.warn("Librería 'canvas-confetti' no encontrada.");
        }
    }

});