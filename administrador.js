document.addEventListener('DOMContentLoaded', () => {

    const sidebarNav = document.querySelector('.sidebar-nav');
    const contentArea = document.getElementById('content-area');
    const allSections = contentArea.querySelectorAll('.content-section'); 
    const messageTableBody = document.querySelector('#messageTable tbody'); 
    const logoutButton = document.getElementById('logoutButton');


    const dummyMessages = [
        { date: '2023-10-28 10:15', sender: 'Ana Pérez', email: 'ana.perez@email.com', subject: 'Consulta sobre envío internacional', status: 'new' },
        { date: '2023-10-28 09:30', sender: 'Carlos Gómez', email: 'c.gomez@empresa.com', subject: 'Cotización Almacenamiento Urgente', status: 'new' },
        { date: '2023-10-27 17:05', sender: 'María Rodríguez', email: 'maria.r@correo.net', subject: 'Problema con rastreo EB-9978776', status: 'read' },
        { date: '2023-10-27 14:22', sender: 'Luis Martínez', email: 'lmartinez@mail.org', subject: 'Agradecimiento por servicio', status: 'read' },
        { date: '2023-10-26 11:50', sender: 'Sofía Jiménez', email: 'sofia.j@email.com', subject: 'Información Consultoría Logística', status: 'new' },
    ];


    if (!sidebarNav || !contentArea || allSections.length === 0) {
        console.error("Error: Faltan elementos clave del DOM para el panel de administración.");
        return;
    }


    if (messageTableBody) {
        displayMessages(); 
    } else {
        console.warn("Advertencia: No se encontró el tbody de la tabla de mensajes (#messageTable tbody).")
    }

 
    sidebarNav.addEventListener('click', (event) => {
        event.preventDefault(); 


        const link = event.target.closest('a');
        if (!link || !link.dataset.section) {

            return;
         }

        const targetSectionId = link.dataset.section + '-content'; 

        allSections.forEach(section => {
            section.style.display = 'none';
        });


        const targetSection = document.getElementById(targetSectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
        } else {
            console.error(`Error: No se encontró la sección con ID "${targetSectionId}"`);
        }

        sidebarNav.querySelectorAll('li').forEach(li => li.classList.remove('active'));
        link.closest('li').classList.add('active');
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', (event) => {
            event.preventDefault();
            alert("Simulación: Saliendo del panel...");

            window.location.href = 'index.html';
        });
    }


    function displayMessages() {
        if (!messageTableBody) return; 

        messageTableBody.innerHTML = ''; 

        if (dummyMessages.length === 0) {
            messageTableBody.innerHTML = '<tr><td colspan="6" class="loading-placeholder">No hay mensajes nuevos.</td></tr>';
            return;
        }

        dummyMessages.forEach(msg => {
            const row = messageTableBody.insertRow(); 

            const dateObj = new Date(msg.date.replace(' ', 'T') + ':00');
            const formattedDate = dateObj.toLocaleDateString('es-DO', { day:'2-digit', month:'2-digit', year:'numeric' }) + ' ' + dateObj.toLocaleTimeString('es-DO', { hour:'2-digit', minute:'2-digit', hour12:true });
            const statusClass = msg.status === 'new' ? 'status-new' : 'status-read';
            const statusText = msg.status === 'new' ? 'Nuevo' : 'Leído';

            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${msg.sender}</td>
                <td><a href="mailto:${msg.email}" title="Enviar email a ${msg.sender}">${msg.email}</a></td>
                <td>${msg.subject}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td class="action-buttons">
                    <button class="action-btn-view" title="Ver Mensaje"><span class="icon">👁️</span></button>
                    <button class="action-btn-reply" title="Responder"><span class="icon">↩️</span></button>
                    <button class="action-btn-delete" title="Eliminar"><span class="icon">🗑️</span></button>
                </td>
            `;
--
            row.querySelector('.action-btn-view').addEventListener('click', () => alert(`Simulación: Viendo mensaje de ${msg.sender}\nAsunto: ${msg.subject}`));
            row.querySelector('.action-btn-reply').addEventListener('click', () => alert(`Simulación: Respondiendo a ${msg.sender}`));
            row.querySelector('.action-btn-delete').addEventListener('click', () => {
                if (confirm(`¿Seguro que quieres eliminar el mensaje de ${msg.sender}? (Simulación)`)) {
                    row.remove();
                    alert('Simulación: Mensaje eliminado.');

                }
            });
        });

         const newMessagesCount = dummyMessages.filter(m => m.status === 'new').length;
         const statElement = document.getElementById('stat-new-messages');
         if (statElement) statElement.textContent = newMessagesCount;

    }

});