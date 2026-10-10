const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
if (toggle && nav) toggle.addEventListener("click", () => nav.classList.toggle("open"));

function handleContact(event) {
  event.preventDefault();
  const message = document.getElementById("form-message");
  if (message) message.textContent = "Your form is ready to connect to your email service.";
  return false;
}
