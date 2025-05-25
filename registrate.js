document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registrationForm');
    const passwordInput = document.getElementById('password');
    const togglePasswordButton = document.getElementById('togglePassword');
    const registerButton = document.getElementById('registerButton');
    const formMessage = document.getElementById('formMessage');
    const expressBoxCodeInput = document.getElementById('expressBoxCode'); // Para validar

    const USERS_STORAGE_KEY = 'expressboxrd_users'; // Clave para guardar usuarios

    // Verificar si todos los elementos del DOM necesarios existen
    if (!registrationForm || !passwordInput || !togglePasswordButton || !registerButton || !formMessage || !expressBoxCodeInput) {
        console.error("Error: Faltan elementos esenciales del formulario de registro.");
        return; // Detener la ejecución si falta algo
    }

    // Funcionalidad para mostrar/ocultar contraseña
    togglePasswordButton.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        const iconElement = togglePasswordButton.querySelector('i');
        if (iconElement) {
            if (type === 'password') {
                iconElement.classList.remove('fa-eye-slash'); // Quitar ojo tachado
                iconElement.classList.add('fa-eye');       // Poner ojo normal
            } else {
                iconElement.classList.remove('fa-eye');
                iconElement.classList.add('fa-eye-slash');
            }
        }
    });

    // Manejo del envío del formulario de Registro
    registrationForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevenir el envío tradicional

        // Ocultar mensajes previos y deshabilitar botón
        formMessage.style.display = 'none';
        formMessage.className = 'form-feedback'; // Resetear clases
        registerButton.disabled = true;
        registerButton.textContent = 'Registrando...';

        const formData = new FormData(registrationForm);
        const newUser = {
            id: 'user_' + Date.now(), // ID simple basado en timestamp
            fullName: formData.get('fullName'),
            email: (formData.get('email') || '').toLowerCase(), // Guardar email en minúsculas
            password: formData.get('password'), // En un sistema real, NUNCA guardar contraseña en texto plano
            expressBoxCode: (formData.get('expressBoxCode') || '').toUpperCase().trim(), // Guardar en mayúsculas y sin espacios extra
            address: formData.get('address'),
            city: formData.get('city'),
            accountPurpose: formData.get('accountPurpose'),
            registeredAt: new Date().toISOString()
        };

        // --- Validaciones ---
        if (!newUser.fullName || !newUser.email || !newUser.password || !newUser.expressBoxCode || !newUser.address || !newUser.city || !newUser.accountPurpose) {
            showFeedback(formMessage, 'Todos los campos son requeridos.', 'error');
            resetRegisterButton();
            return;
        }
        if (newUser.password.length < 8) {
             showFeedback(formMessage, 'La contraseña debe tener al menos 8 caracteres.', 'error');
             resetRegisterButton();
             passwordInput.focus();
             return;
        }
        if (!newUser.expressBoxCode.startsWith('EB-83879')) {
            showFeedback(formMessage, 'El Código Único ExpressBoxRD debe comenzar con EB-83879.', 'error');
            resetRegisterButton();
            expressBoxCodeInput.focus();
            return;
        }

        // --- SIMULACIÓN DE GUARDADO EN localStorage ---
        try {
            const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
            const users = storedUsers ? JSON.parse(storedUsers) : [];

            // Verificar si el email ya está registrado
            if (users.find(user => user.email === newUser.email)) {
                showFeedback(formMessage, 'Este correo electrónico ya ha sido registrado.', 'error');
                resetRegisterButton();
                return;
            }
            // Verificar si el Código ExpressBoxRD ya está en uso
            if (users.find(user => user.expressBoxCode === newUser.expressBoxCode)) {
                showFeedback(formMessage, 'Este Código Único ExpressBoxRD ya está en uso.', 'error');
                resetRegisterButton();
                return;
            }

            users.push(newUser); // Añadir el nuevo usuario al array
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users)); // Guardar el array actualizado

            console.log('Nuevo usuario registrado (simulado):', newUser);
            console.log('Lista de usuarios actual en localStorage:', users);

            showFeedback(formMessage, '¡Registro Exitoso! Ya puedes iniciar sesión.', 'success');
            registrationForm.reset(); // Limpiar el formulario
            registerButton.textContent = '¡Registrado!';
            // No rehabilitar inmediatamente para que el usuario vea el mensaje
            // Opcional: redirigir al login después de unos segundos
            // setTimeout(() => {
            //    window.location.href = 'inicio.html';
            // }, 2500);

        } catch (e) {
            console.error("Error guardando usuario en localStorage:", e);
            showFeedback(formMessage, 'Ocurrió un error interno al procesar tu registro. Por favor, inténtalo de nuevo.', 'error');
            resetRegisterButton();
        }
    });

    // Función para mostrar mensajes de feedback en el formulario
    function showFeedback(element, message, type) {
        element.textContent = message;
        element.className = `form-feedback ${type}`;
        element.style.display = 'block';
    }

    // Función para resetear el estado del botón de registro
    function resetRegisterButton() {
        registerButton.disabled = false;
        registerButton.textContent = 'Registrarse';
    }
});
// En registrarse.js
let nombreUsuarioRegistrado = "Alonzo";
let emailUsuarioRegistrado = "alonzo@gmail.com";
// (No hay dónde guardar esto permanentemente sin localStorage/sessionStorage o backend)

// --- assets/js/registrate.js ---
document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registrationForm');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePasswordButton = document.getElementById('togglePassword');
    const expressBoxCodeInput = document.getElementById('expressBoxCode');
    const addressInput = document.getElementById('address');
    const cityInput = document.getElementById('city');
    // const accountPurposeInputs = document.querySelectorAll('input[name="accountPurpose"]'); // Get all radio buttons
    const formMessage = document.getElementById('formMessage');
    const registerButton = document.getElementById('registerButton');

    const USERS_STORAGE_KEY = 'expressboxrd_users'; // Where all registered users are stored
    const CURRENT_USER_SESSION_KEY = 'expressboxrd_current_user_session'; // For auto-login after registration

    if (!registrationForm || !fullNameInput || !emailInput || !passwordInput || !togglePasswordButton || !expressBoxCodeInput || !addressInput || !cityInput || !formMessage || !registerButton) {
        console.error("REGISTRATION: Faltan elementos esenciales del formulario.");
        if(formMessage) showFeedback(formMessage, "Error al cargar el formulario. Intente de nuevo.", "error");
        return;
    }

    togglePasswordButton.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        const iconElement = togglePasswordButton.querySelector('i');
        if (iconElement) {
            iconElement.classList.toggle('fa-eye');
            iconElement.classList.toggle('fa-eye-slash'); // Make sure you have both eye and eye-slash icons
        }
    });

    registrationForm.addEventListener('submit', (event) => {
        event.preventDefault();
        formMessage.style.display = 'none';
        formMessage.className = 'form-feedback';
        registerButton.disabled = true;
        registerButton.textContent = 'Registrando...';

        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;
        const expressBoxCode = expressBoxCodeInput.value.trim().toUpperCase();
        const address = addressInput.value.trim();
        const city = cityInput.value.trim();
        
        let accountPurpose = '';
        const purposeChecked = document.querySelector('input[name="accountPurpose"]:checked');
        if (purposeChecked) {
            accountPurpose = purposeChecked.value;
        }

        // Basic Validations
        if (!fullName || !email || !password || !expressBoxCode || !address || !city || !accountPurpose) {
            showFeedback(formMessage, 'Todos los campos son requeridos.', 'error');
            resetRegisterButton();
            return;
        }
        if (password.length < 8) {
            showFeedback(formMessage, 'La contraseña debe tener al menos 8 caracteres.', 'error');
            resetRegisterButton();
            return;
        }
        if (!expressBoxCode.startsWith('EB-')) {
            showFeedback(formMessage, 'El Código ExpressBoxRD debe comenzar con "EB-".', 'error');
            resetRegisterButton();
            return;
        }

        let users = getFromStorage(USERS_STORAGE_KEY, []);

        // Check if email or EB code already exists
        if (users.some(user => user.email === email)) {
            showFeedback(formMessage, 'Este correo electrónico ya está registrado.', 'error');
            resetRegisterButton();
            return;
        }
        if (users.some(user => user.expressBoxCode === expressBoxCode)) {
            showFeedback(formMessage, 'Este Código ExpressBoxRD ya está en uso.', 'error');
            resetRegisterButton();
            return;
        }

        // Simulate password hashing (in a real app, use a strong hashing library like bcrypt.js)
        // For this demo, we'll just store it as is, or a very simple "hash"
        const hashedPassword = "hashed_" + password; // VERY INSECURE - FOR DEMO ONLY

        const newUser = {
            fullName: fullName,
            email: email,
            passwordHash: hashedPassword, // Store the "hashed" password
            expressBoxCode: expressBoxCode,
            address: { // Store address as an object for better structure
                street: address, // Assuming the 'address' input captures the full street part
                city: city,
                province: "", // Could add a province field to form if needed
                reference: ""
            },
            // city: city, // Storing city inside address object now
            accountPurpose: accountPurpose,
            plan: 'basico', // Default plan for new users
            autopayEnabled: false, // Default autopay
            branch: 'Sucursal Principal', // Default branch or assign based on city later
            registeredAt: new Date().toISOString(),
            // Add an empty array for notifications for this new user
            notifications: [] // Not strictly needed here, but good for consistency if client loads from this obj
        };

        users.push(newUser);
        saveToStorage(USERS_STORAGE_KEY, users);

        // Simulate auto-login by storing data for cuenta.html
        const sessionData = {
            email: newUser.email,
            fullName: newUser.fullName,
            expressBoxCode: newUser.expressBoxCode,
            plan: newUser.plan,
            branch: newUser.branch,
            address: newUser.address,
            autopayEnabled: newUser.autopayEnabled
        };
        localStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(sessionData));

        showFeedback(formMessage, '¡Registro exitoso! Redirigiendo a tu cuenta...', 'success');
        setTimeout(() => {
            window.location.href = 'cuenta.html'; // Redirect to account page
        }, 2000);
    });

    function showFeedback(element, messageHTML, type) {
        element.innerHTML = messageHTML; // Use innerHTML if message can contain HTML (like links)
        element.className = `form-feedback ${type}`;
        element.style.display = 'block';
    }

    function resetRegisterButton() {
        registerButton.disabled = false;
        registerButton.textContent = 'Registrarse';
    }

    const getFromStorage = (key, defaultValue = []) => {
        try {
            return JSON.parse(localStorage.getItem(key) || JSON.stringify(defaultValue));
        } catch (e) {
            console.error("Error al parsear localStorage para la clave:", key, e);
            return defaultValue;
        }
    };
    const saveToStorage = (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            localStorage.setItem(key + '_event_timestamp', Date.now()); // For admin/other tabs
        } catch (e) {
            console.error("Error al guardar en localStorage para la clave:", key, e);
        }
    };
});