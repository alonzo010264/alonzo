'use strict';

/**
 * add event on element (Función de utilidad que puede ser útil)
 */
const addEventOnElem = function (elem, type, callback) {
  if (elem) { // Primero verifica si el elemento (o lista de elementos) existe
    if (elem.length > 1) {
      for (let i = 0; i < elem.length; i++) {
        elem[i].addEventListener(type, callback);
      }
    } else {
      elem.addEventListener(type, callback);
    }
  } else {
    // Opcional: puedes registrar un error si el elemento no se encuentra
    // console.warn(`Elemento no encontrado para añadir evento:`, elem);
  }
};


/**
 * navbar toggle
 */
const navbar = document.querySelector("[data-navbar]");
const navTogglers = document.querySelectorAll("[data-nav-toggler]"); // Corregido: era navToggler
const navLinks = document.querySelectorAll("[data-nav-link]");
const overlay = document.querySelector("[data-overlay]");

const toggleNavbar = function () {
  if (navbar && overlay && document.body) { // Verificar que los elementos existen
    navbar.classList.toggle("active");
    overlay.classList.toggle("active");
    document.body.classList.toggle("nav-active"); // Para prevenir scroll cuando el menú está abierto
  }
};

const closeNavbar = function () {
  if (navbar && overlay && document.body) { // Verificar
    navbar.classList.remove("active");
    overlay.classList.remove("active");
    document.body.classList.remove("nav-active");
  }
};

// Usando addEventOnElem para más seguridad
addEventOnElem(navTogglers, "click", toggleNavbar);
addEventOnElem(navLinks, "click", closeNavbar);


/**
 * header & backTopBtn active on scroll
 */
const header = document.querySelector("[data-header]");
const backTopBtn = document.querySelector("[data-back-top-btn]");

const handleScroll = function () {
  const scrollY = window.scrollY;
  if (header) {
    if (scrollY >= 100) {
      header.classList.add("active");
    } else {
      header.classList.remove("active");
    }
  }
  if (backTopBtn) {
    if (scrollY >= 100) {
      backTopBtn.classList.add("active");
    } else {
      backTopBtn.classList.remove("active");
    }
  }
};

window.addEventListener("scroll", handleScroll);


/**
 * FAQ Accordion
 * (Integrado aquí)
 */
document.addEventListener('DOMContentLoaded', () => {
  // Mensaje para verificar que el script de FAQ se carga después del DOM
  console.log("Script de FAQ (integrado) cargado y DOM listo.");

  const faqItems = document.querySelectorAll('.faq-item');
  // Mensaje para verificar si encuentra los items de FAQ
  console.log("Items de FAQ encontrados:", faqItems.length);

  if (faqItems.length > 0) { // Solo proceder si se encontraron items de FAQ
    faqItems.forEach(item => {
      const questionButton = item.querySelector('.faq-question');
      const answerPanel = item.querySelector('.faq-answer');

      // Verifica si se encontraron los elementos necesarios dentro de cada item
      if (!questionButton) {
        console.error("ERROR: No se encontró '.faq-question' en el item:", item);
        return; // Salta este item si falta el botón
      }
      if (!answerPanel) {
        console.error("ERROR: No se encontró '.faq-answer' en el item:", item);
        return; // Salta este item si falta el panel de respuesta
      }

      questionButton.addEventListener('click', () => {
        // Mensaje para verificar que el evento de clic funciona
        let questionText = questionButton.querySelector('span') ? questionButton.querySelector('span').textContent.trim() : "Pregunta sin span";
        console.log("Clic detectado en la pregunta:", questionText);

        const isExpanded = questionButton.getAttribute('aria-expanded') === 'true' || false;

        questionButton.setAttribute('aria-expanded', !isExpanded);
        answerPanel.setAttribute('aria-hidden', isExpanded);

        if (!isExpanded) { // Si no estaba expandido, expandir ahora
          answerPanel.style.maxHeight = answerPanel.scrollHeight + "px";
          console.log("Expandiendo respuesta. Nueva maxHeight:", answerPanel.style.maxHeight);
        } else { // Si estaba expandido, colapsar ahora
          answerPanel.style.maxHeight = null;
          console.log("Colapsando respuesta.");
        }
      });
    });
  } else {
    console.warn("No se encontraron elementos '.faq-item' en la página.");
  }
});

// --- FIN DEL SCRIPT.JS ---