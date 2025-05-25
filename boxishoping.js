document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('productGrid');
    const modal = document.getElementById('productModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const closeModalButton = modal ? modal.querySelector('.close-button') : null;

    if (!productGrid || !modal || !modalImage || !modalTitle || !modalDescription || !closeModalButton) {
        console.error("Error: Faltan elementos esenciales para la funcionalidad de la tienda/modal. Verifique los IDs: productGrid, productModal, modalImage, modalTitle, modalDescription y que productModal contenga un elemento con la clase .close-button.");
        return;
    }

    productGrid.addEventListener('click', (event) => {
        const card = event.target.closest('.product-card');
        if (!card) return;

        const imgSrc = card.dataset.imgSrc;
        const title = card.dataset.title;
        const description = card.dataset.description;

        modalImage.src = imgSrc || '';
        modalImage.alt = title || 'Imagen del producto';
        modalTitle.textContent = title || 'Producto';
        modalDescription.textContent = description || 'Descripción no disponible.';

        modal.style.display = 'flex';
    });

    const closeModal = () => {
        if (!modal || !modalImage || !modalTitle || !modalDescription) return;
        modal.style.display = 'none';
        modalImage.src = "";
        modalTitle.textContent = "";
        modalDescription.textContent = "";
    };

    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeModal);
    }

    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal && modal.style.display === 'flex') {
            closeModal();
        }
    });
});