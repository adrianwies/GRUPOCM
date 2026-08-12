const menuButton = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

menuButton.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  });
});

document.querySelectorAll("[data-product]").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelector("#product-select").value = link.dataset.product;
    document.querySelector("#product-select").dispatchEvent(new Event("change", { bubbles: true }));
  });
});

const productModal = document.querySelector("#product-modal");
const modalTitle = document.querySelector("#modal-title");
const modalDescription = document.querySelector("#modal-description");
const modalImage = document.querySelector("#modal-image");
const modalUse = document.querySelector("#modal-use");
const modalBenefit = document.querySelector("#modal-benefit");
const modalSizeList = document.querySelector("#modal-size-list");
const modalQuote = document.querySelector(".modal-quote");
const modalClose = document.querySelector(".modal-close");

document.querySelectorAll(".product-details").forEach((button) => {
  button.addEventListener("click", () => {
    modalTitle.textContent = button.dataset.product;
    modalDescription.textContent = button.dataset.description;
    modalImage.src = button.dataset.image;
    modalImage.alt = "Presentación de " + button.dataset.product;
    modalUse.textContent = button.dataset.use;
    modalBenefit.textContent = button.dataset.benefit;
    modalSizeList.replaceChildren(...button.dataset.sizes.split("|").map((size) => {
      const item = document.createElement("li");
      item.textContent = size;
      return item;
    }));
    modalQuote.dataset.product = button.dataset.product;
    productModal.showModal();
    document.body.classList.add("modal-open");
  });
});

function closeProductModal() {
  productModal.close();
  document.body.classList.remove("modal-open");
}

modalClose.addEventListener("click", closeProductModal);
modalQuote.addEventListener("click", () => {
  document.querySelector("#product-select").value = modalQuote.dataset.product;
  document.querySelector("#product-select").dispatchEvent(new Event("change", { bubbles: true }));
  closeProductModal();
});
productModal.addEventListener("click", (event) => {
  if (event.target === productModal) closeProductModal();
});
productModal.addEventListener("close", () => document.body.classList.remove("modal-open"));

const nativeProductSelect = document.querySelector("#product-select");
const customProductSelect = document.querySelector("[data-custom-select]");
const customSelectTrigger = customProductSelect.querySelector(".custom-select-trigger");
const customSelectLabel = customSelectTrigger.querySelector("span");
const customSelectOptions = [...customProductSelect.querySelectorAll("[role='option']")];

function closeCustomSelect() {
  customProductSelect.classList.remove("open");
  customSelectTrigger.setAttribute("aria-expanded", "false");
}

function syncCustomProductSelect() {
  const value = nativeProductSelect.value;
  customSelectLabel.textContent = value || "Selecciona una opción";
  customSelectTrigger.classList.toggle("has-value", Boolean(value));
  customSelectOptions.forEach((option) => {
    const selected = option.dataset.value === value;
    option.classList.toggle("selected", selected);
    option.setAttribute("aria-selected", String(selected));
  });
}

customSelectTrigger.addEventListener("click", () => {
  const open = customProductSelect.classList.toggle("open");
  customSelectTrigger.setAttribute("aria-expanded", String(open));
});

customSelectOptions.forEach((option) => {
  option.addEventListener("click", () => {
    nativeProductSelect.value = option.dataset.value;
    nativeProductSelect.dispatchEvent(new Event("change", { bubbles: true }));
    closeCustomSelect();
  });
});

nativeProductSelect.addEventListener("change", syncCustomProductSelect);
document.addEventListener("click", (event) => {
  if (!customProductSelect.contains(event.target)) closeCustomSelect();
});
syncCustomProductSelect();

const quoteForm = document.querySelector("#quote-form");

quoteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const company = new FormData(quoteForm).get("name");
  quoteForm.querySelector(".form-status").textContent = `Gracias, ${company}. Tu solicitud está lista para ser atendida.`;
  quoteForm.reset();
});

document.querySelector("#year").textContent = new Date().getFullYear();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".product, .benefit-grid article, .quote-form").forEach((element) => {
  revealObserver.observe(element);
});
