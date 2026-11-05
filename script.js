
/* =========================================
   WORLD OF BLESSGLOW
   MAIN JAVASCRIPT
   Supabase Books + Navigation + Contact
========================================= */

/* =========================================
   1. SUPABASE CONNECTION
========================================= */

const SUPABASE_URL = "https://zngagaolaiidgyxoldsh.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_e0wd6fhM_Fr7gsKkKzT2RA_vAReV50F";

const BOOKS_API = `${SUPABASE_URL}/rest/v1/books`;

const PUBLIC_STATUSES = [
  "published",
  "ongoing",
  "completed",
  "coming_soon"
];

async function fetchBooks() {
  const query = new URLSearchParams({
    select: "id,title,slug,description,main_genre,subgenre,publication_status,cover_url,is_featured,is_editors_pick,created_at",
    publication_status: `in.(${PUBLIC_STATUSES.join(",")})`,
    order: "created_at.asc"
  });

  const response = await fetch(`${BOOKS_API}?${query}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error("Unable to load books from the database.");
  }

  return await response.json();
}


/* =========================================
   2. HELPER FUNCTIONS
========================================= */

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function getStatusLabel(status) {
  const labels = {
    published: "Published",
    ongoing: "Ongoing",
    completed: "Completed",
    coming_soon: "Coming Soon"
  };

  return labels[status] || "Available";
}

function createBookCard(book) {
  const title = escapeHTML(book.title);
  const description = escapeHTML(book.description || "");
  const genre = escapeHTML(book.main_genre || "");
  const subgenre = escapeHTML(book.subgenre || "");
  const status = escapeHTML(getStatusLabel(book.publication_status));
  const slug = encodeURIComponent(book.slug || "");
  const cover = book.cover_url
    ? escapeHTML(book.cover_url)
    : "";

  return `
    <article class="book-card"
      data-title="${title.toLowerCase()}"
      data-genre="${genre.toLowerCase()}"
      data-subgenre="${subgenre.toLowerCase()}"
      data-status="${escapeHTML(book.publication_status || "")}">

      <a class="book-card-link" href="read.html?slug=${slug}">
        <div class="book-cover">
          ${
            cover
              ? `<img src="${cover}" alt="${title} book cover" loading="lazy">`
              : `<div class="book-cover-placeholder">World of BlessGlow</div>`
          }
        </div>

        <div class="book-info">
          <h3>${title}</h3>
          <p class="book-description">${description}</p>

          <div class="book-meta">
            ${genre ? `<span>${genre}</span>` : ""}
            ${subgenre ? `<span>${subgenre}</span>` : ""}
          </div>

          <span class="book-status">${status}</span>
        </div>
      </a>
    </article>
  `;
}


/* =========================================
   3. PUBLIC BOOK CONTAINERS
========================================= */

function findContainer(selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) return element;
  }

  return null;
}

const featuredContainer = () => findContainer([
  "#featured-books",
  "#featuredBooks",
  ".featured-books",
  ".featured-books-grid",
  "[data-featured-books]"
]);

const libraryContainer = () => findContainer([
  "#books-grid",
  "#library-books",
  "#book-grid",
  ".books-grid",
  ".library-grid",
  "[data-library-books]"
]);

function showLoading(container) {
  if (container) {
    container.innerHTML = "<p class='books-loading'>Loading books...</p>";
  }
}

function showBookError(container) {
  if (container) {
    container.innerHTML =
      "<p class='books-error'>Books could not be loaded. Please try again later.</p>";
  }
}


/* =========================================
   4. LOAD HOMEPAGE FEATURED BOOKS
========================================= */

async function loadFeaturedBooks(allBooks) {
  const container = featuredContainer();
  if (!container) return;

  const featured = allBooks.filter(book => book.is_featured === true);

  container.innerHTML = featured.length
    ? featured.map(createBookCard).join("")
    : "<p class='books-empty'>Featured books will appear here soon.</p>";
}


/* =========================================
   5. LOAD PUBLIC LIBRARY
========================================= */

async function loadLibraryBooks(allBooks) {
  const container = libraryContainer();
  if (!container) return;

  container.innerHTML = allBooks.length
    ? allBooks.map(createBookCard).join("")
    : "<p class='books-empty'>No books are available yet.</p>";

  applyBookFilters();
}


/* =========================================
   6. BOOK SEARCH AND FILTERS
========================================= */

function applyBookFilters() {
  const cards = document.querySelectorAll(".book-card");

  const searchInput = document.querySelector(
    "#book-search, #search-books, [data-book-search]"
  );

  const genreFilter = document.querySelector(
    "#genre-filter, #book-genre, [data-genre-filter]"
  );

  const statusFilter = document.querySelector(
    "#status-filter, #book-status, [data-status-filter]"
  );

  const search = searchInput?.value.trim().toLowerCase() || "";
  const genre = genreFilter?.value.toLowerCase() || "";
  const status = statusFilter?.value.toLowerCase() || "";

  cards.forEach(card => {
    const matchesSearch =
      card.textContent.toLowerCase().includes(search);

    const matchesGenre =
      !genre || card.dataset.genre === genre ||
      card.dataset.subgenre === genre;

    const matchesStatus =
      !status || card.dataset.status === status;

    card.hidden = !(
      matchesSearch &&
      matchesGenre &&
      matchesStatus
    );
  });
}


/* =========================================
   7. LOAD BOOKS
========================================= */

async function initializeBooks() {
  const featured = featuredContainer();
  const library = libraryContainer();

  showLoading(featured);
  showLoading(library);

  if (!featured && !library) return;

  try {
    const books = await fetchBooks();

    await loadFeaturedBooks(books);
    await loadLibraryBooks(books);

    document.dispatchEvent(
      new CustomEvent("blessglow:books-loaded", {
        detail: { books }
      })
    );

  } catch (error) {
    console.error("World of BlessGlow:", error);

    showBookError(featured);
    showBookError(library);
  }
}


/* =========================================
   8. MOBILE NAVIGATION
========================================= */

function initializeNavigation() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");

  if (!toggle || !nav) return;

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

  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenu();
  });
}


/* =========================================
   9. CONTACT FORM
========================================= */

function handleContact(event) {
  event.preventDefault();

  const form = event.target;
  const messageDisplay = document.getElementById("form-message");

  const name = form.elements["name"]?.value.trim();
  const email = form.elements["email"]?.value.trim();
  const subject = form.elements["subject"]?.value;
  const message = form.elements["message"]?.value.trim();

  const officialEmail = "theworldofblessglow@gmail.com";

  if (!name || !email || !subject || !message) {
    if (messageDisplay) {
      messageDisplay.textContent =
        "Please complete all fields before continuing.";
    }

    return false;
  }

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

  if (messageDisplay) {
    messageDisplay.textContent =
      "Opening your email application. Please review and send your message there.";
  }

  window.location.href =
    `mailto:${officialEmail}?subject=${emailSubject}&body=${emailBody}`;

  return false;
}


/* Make contact handler available to HTML forms */
window.handleContact = handleContact;


/* =========================================
   10. START WEBSITE FEATURES
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  initializeNavigation();
  initializeBooks();

  document.addEventListener("input", event => {
    if (
      event.target.matches(
        "#book-search, #search-books, [data-book-search]"
      )
    ) {
      applyBookFilters();
    }
  });

  document.addEventListener("change", event => {
    if (
      event.target.matches(
        "#genre-filter, #book-genre, #status-filter, #book-status, [data-genre-filter], [data-status-filter]"
      )
    ) {
      applyBookFilters();
    }
  });
});
                                
