/* =====================================
   WORLD OF BLESSGLOW
   MAIN JAVASCRIPT
===================================== */


/* MOBILE NAVIGATION */

const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");

if (toggle && nav) {

  function closeMenu() {
    nav.classList.remove("open");

    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");

    toggle.textContent = "☰";
  }

  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Open navigation menu");

  toggle.addEventListener("click", () => {

    const isOpen = nav.classList.toggle("open");

    toggle.setAttribute("aria-expanded", String(isOpen));

    toggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu"
    );

    toggle.textContent = isOpen ? "×" : "☰";

  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

}


/* =====================================
   CONTACT FORM
===================================== */

function handleContact(event) {

  event.preventDefault();

  const form = event.target;
  const messageDisplay = document.getElementById("form-message");

  const name = form.elements["name"].value.trim();
  const email = form.elements["email"].value.trim();
  const subject = form.elements["subject"].value;
  const message = form.elements["message"].value.trim();

  const officialEmail = "theworldofblessglow@gmail.com";

  /* CHECK REQUIRED FIELDS */

  if (!name || !email || !subject || !message) {

    if (messageDisplay) {
      messageDisplay.textContent =
        "Please complete all fields before continuing.";
    }

    return false;
  }


  /* PREPARE EMAIL */

  const emailSubject = encodeURIComponent(
    `${subject} - World of BlessGlow`
  );

  const emailBody = encodeURIComponent(
`Hello World of BlessGlow,

My name is ${name}.

My email address: ${email}

Subject: ${subject}

Message:

${message}

Best regards,
${name}`
  );


  /* OPEN VISITOR'S EMAIL APPLICATION */

  const mailtoLink =
    `mailto:${officialEmail}?subject=${emailSubject}&body=${emailBody}`;

  if (messageDisplay) {
    messageDisplay.textContent =
      "Opening your email application. Please review and send your message there.";
  }

  window.location.href = mailtoLink;

  return false;

}


/* =====================================
   END OF MAIN JAVASCRIPT
===================================== */
