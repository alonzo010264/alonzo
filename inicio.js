// --- assets/js/inicio.js ---
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePasswordButton = document.getElementById('togglePassword');
    const loginMessage = document.getElementById('loginMessage');
    const loginButton = document.querySelector('.btn-login');
    const loadingOverlay = document.getElementById('loadingOverlay'); // Get the overlay

    const ALONZO_SESSION_DATA_KEY = 'expressboxrd_alonzo_active_session';
    // const LOGIN_DELAY_MS = 60000; // 1 minute (60000 ms)
    const LOGIN_DELAY_MS = 4000; // 4 seconds for easier testing - CHANGE TO 60000 FOR 1 MINUTE

    if (!loginForm || !emailInput || !passwordInput || !togglePasswordButton || !loginMessage || !loginButton || !loadingOverlay) {
        console.error("LOGIN: Faltan elementos esenciales del DOM (incluyendo loadingOverlay).");
        return;
    }

    togglePasswordButton.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        const iconElement = togglePasswordButton.querySelector('i');
        if (iconElement) {
            iconElement.classList.toggle('fa-eye');
            iconElement.classList.toggle('fa-eye-slash');
        }
    });

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        loginMessage.style.display = 'none';
        loginMessage.className = 'form-feedback';
        loginButton.disabled = true;
        // Don't change button text immediately, wait for potential loading screen

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (!email || !password) {
            showFeedback(loginMessage, 'Ingresa correo y contraseña.', 'error');
            resetLoginButton();
            return;
        }

        // --- LOGIN DIRECTO PARA ALONZO ---
        if (email === 'alonzo@gmail.com' && password === 'alonzo0102') {
            // Hide login form elements, show loading screen
            document.querySelector('.login-box').style.display = 'none'; // Hide the entire login box
            loadingOverlay.classList.add('visible'); // Show loading screen
            loadingOverlay.style.display = 'flex';   // Ensure it's flex for centering


            const alonzoData = {
                email: 'alonzo@gmail.com',
                fullName: 'Luis Alonzo Sánchez Rodríguez',
                expressBoxCode: 'EB-746589', // Código de Alonzo
                // Add other necessary data for cuenta.html if needed
                plan: "premium", // Example: so cuenta.html can display it
                branch: "Sucursal Principal",
                address: { street: "Av. Winston Churchill 123", city: "Santo Domingo", province: "Distrito Nacional", reference: "Torre Azul, Apto 5B"},
                autopayEnabled: true
            };
            localStorage.setItem(ALONZO_SESSION_DATA_KEY, JSON.stringify(alonzoData));
            console.log("LOGIN: Datos de Alonzo guardados para 'sesión'. Mostrando pantalla de carga...");

            // No immediate feedback message on login page, as it's covered by loading screen

            setTimeout(() => {
                window.location.href = 'cuenta.html'; // Redirige a la cuenta
            }, LOGIN_DELAY_MS); // Use the defined delay

        } else {
            showFeedback(loginMessage, 'Correo o contraseña incorrectos. Esta es una demo para Alonzo. Para otros usuarios, <a href="resgistrarse.html">regístrate</a>.', 'error');
            resetLoginButton();
        }
    });

    function showFeedback(element, messageHTML, type) {
        element.innerHTML = messageHTML;
        element.className = `form-feedback ${type}`;
        element.style.display = 'block';
    }

    function resetLoginButton() {
        loginButton.disabled = false;
        loginButton.textContent = 'Ingresar';
    }

    // Opcional: Si al cargar la página de login, ya existe la "sesión" de Alonzo, redirigir.
    // Esto es útil si el usuario ya se logueó y vuelve a la página de login.
    // This part will NOT show the loading screen, it's an immediate redirect for convenience.
    if (localStorage.getItem(ALONZO_SESSION_DATA_KEY)) {
       const userData = JSON.parse(localStorage.getItem(ALONZO_SESSION_DATA_KEY));
       if (userData.email === 'alonzo@gmail.com') { // Simple check
            console.log(`LOGIN: Alonzo ya en "sesión" (localStorage), redirigiendo directamente a cuenta.html`);
            // window.location.href = 'cuenta.html'; // Uncomment to enable auto-redirect if already logged in
       }
    }
});

// --- assets/js/inicio.js (Updated for general login) ---
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePasswordButton = document.getElementById('togglePassword');
    const loginMessage = document.getElementById('loginMessage');
    const loginButton = document.querySelector('.btn-login');
    const loadingOverlay = document.getElementById('loadingOverlay');

    const USERS_STORAGE_KEY = 'expressboxrd_users'; // Where all registered users are stored
    const CURRENT_USER_SESSION_KEY = 'expressboxrd_current_user_session'; // Generic session key
    const LOGIN_DELAY_MS = 3000; // 3 seconds for loading screen demonstration

    if (!loginForm || !emailInput || !passwordInput || !togglePasswordButton || !loginMessage || !loginButton || !loadingOverlay) {
        console.error("LOGIN: Faltan elementos esenciales del DOM.");
        return;
    }

    togglePasswordButton.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        const iconElement = togglePasswordButton.querySelector('i');
        if (iconElement) {
            iconElement.classList.toggle('fa-eye');
            iconElement.classList.toggle('fa-eye-slash');
        }
    });

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        loginMessage.style.display = 'none';
        loginMessage.className = 'form-feedback';
        loginButton.disabled = true;
        // Don't change button text yet

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (!email || !password) {
            showFeedback(loginMessage, 'Ingresa correo y contraseña.', 'error');
            resetLoginButton();
            return;
        }

        let users = getFromStorage(USERS_STORAGE_KEY, []);
        const foundUser = users.find(user => user.email === email);

        // Simulate password check (INSECURE - FOR DEMO ONLY)
        // In a real app, compare hashed passwords securely.
        if (foundUser && foundUser.passwordHash === "hashed_" + password) {
            // Login successful
            document.querySelector('.login-box').style.display = 'none';
            loadingOverlay.classList.add('visible');
            loadingOverlay.style.display = 'flex';

            const sessionData = { // Store necessary data for cuenta.html
                email: foundUser.email,
                fullName: foundUser.fullName,
                expressBoxCode: foundUser.expressBoxCode,
                plan: foundUser.plan,
                branch: foundUser.branch,
                address: foundUser.address,
                autopayEnabled: foundUser.autopayEnabled
            };
            localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(sessionData));
            console.log("LOGIN: Usuario encontrado y sesión iniciada:", sessionData.expressBoxCode);

            setTimeout(() => {
                window.location.href = 'cuenta.html';
            }, LOGIN_DELAY_MS);

        } else {
            showFeedback(loginMessage, 'Correo o contraseña incorrectos. Si eres nuevo, <a href="resgistrarse.html">regístrate</a>.', 'error');
            resetLoginButton();
        }
    });

    function showFeedback(element, messageHTML, type) {
        element.innerHTML = messageHTML;
        element.className = `form-feedback ${type}`;
        element.style.display = 'block';
    }

    function resetLoginButton() {
        loginButton.disabled = false;
        loginButton.textContent = 'Ingresar';
    }

    const getFromStorage = (key, defaultValue = []) => {
        try {
            return JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
        } catch (e) { return defaultValue; }
    };

    // Optional: Redirect if already logged in (checks the generic session key)
    if (localStorage.getItem(CURRENT_USER_SESSION_KEY)) {
       const userData = JSON.parse(localStorage.getItem(CURRENT_USER_SESSION_KEY));
       if (userData && userData.expressBoxCode) { // Basic check for valid session data
            console.log(`LOGIN: Usuario ${userData.expressBoxCode} ya en sesión, redirigiendo a cuenta.html`);
            // window.location.href = 'cuenta.html'; // Uncomment for auto-redirect
       }
    }
});
let users = getFromStorage(USERS_STORAGE_KEY, []);
const foundUser = users.find(user => user.email === email);
// Simulate password check (INSECURE - FOR DEMO ONLY)
if (foundUser && foundUser.passwordHash === "hashed_" + password) {
    // Login successful
    // ...
}
