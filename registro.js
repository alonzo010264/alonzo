document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registrationForm');
    const passwordInput = document.getElementById('password');
    const togglePasswordButton = document.getElementById('togglePassword');
    const registerButton = document.getElementById('registerButton');
    const formMessage = document.getElementById('formMessage');

    const USERS_STORAGE_KEY = 'expressboxrd_users'; // <<< CLAVE IMPORTANTE

    if (!registrationForm || !passwordInput || !togglePasswordButton || !registerButton || !formMessage) {
        console.error("REGISTRO: Faltan elementos del DOM.");
        return;
    }

    // Mostrar/Ocultar Contraseña
    togglePasswordButton.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        const icon = togglePasswordButton.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        }
    });

    registrationForm.addEventListener('submit', (event) => {
        event.preventDefault();
        console.log("REGISTRO: Formulario enviado."); // Log

        formMessage.style.display = 'none';
        formMessage.className = 'form-feedback';
        registerButton.disabled = true;
        registerButton.textContent = 'Registrando...';

        const formData = new FormData(registrationForm);
        const newUser = {
            id: 'user_' + Date.now(),
            fullName: formData.get('fullName'),
            email: (formData.get('email') || '').toLowerCase(), // Asegurar que hay valor y es minúscula
            password: formData.get('password'),
            expressBoxCode: (formData.get('expressBoxCode') || '').toUpperCase(), // Asegurar que hay valor y es mayúscula
            address: formData.get('address'),
            city: formData.get('city'),
            accountPurpose: formData.get('accountPurpose'),
            registeredAt: new Date().toISOString()
        };

        console.log("REGISTRO: Datos del nuevo usuario:", newUser); // Log

        if (!newUser.email || !newUser.password || !newUser.fullName || !newUser.expressBoxCode) {
            showFeedback(formMessage, 'REGISTRO: Todos los campos principales son requeridos.', 'error');
            resetRegisterButton();
            return;
        }

        if (!newUser.expressBoxCode.startsWith('EB-83879')) {
            showFeedback(formMessage, 'REGISTRO: El Código ExpressBoxRD debe comenzar con EB-83879.', 'error');
            resetRegisterButton();
            return;
        }

        try {
            const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
            const users = storedUsers ? JSON.parse(storedUsers) : [];
            console.log("REGISTRO: Usuarios existentes en localStorage:", users); // Log

            if (users.find(user => user.email === newUser.email)) {
                showFeedback(formMessage, 'REGISTRO: Este correo electrónico ya está registrado.', 'error');
                resetRegisterButton();
                return;
            }
            if (users.find(user => user.expressBoxCode === newUser.expressBoxCode)) {
                showFeedback(formMessage, 'REGISTRO: Este Código ExpressBoxRD ya está en uso.', 'error');
                resetRegisterButton();
                return;
            }

            users.push(newUser);
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
            console.log("REGISTRO: Usuario guardado. Lista actualizada de usuarios:", users); // Log

            showFeedback(formMessage, '¡Registro Exitoso! Ahora puedes iniciar sesión.', 'success');
            registrationForm.reset();
            registerButton.textContent = '¡Registrado!';
            // No rehabilitar inmediatamente

        } catch (e) {
            console.error("REGISTRO: Error guardando usuario:", e);
            showFeedback(formMessage, 'REGISTRO: Error interno al registrar. Intenta de nuevo.', 'error');
            resetRegisterButton();
        }
    });

    function showFeedback(element, message, type) {
        element.textContent = message;
        element.className = `form-feedback ${type}`;
        element.style.display = 'block';
    }

    function resetRegisterButton() {
        registerButton.disabled = false;
        registerButton.textContent = 'Registrarse';
    }
});