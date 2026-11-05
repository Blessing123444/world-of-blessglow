
/* =========================================
   WORLD OF BLESSGLOW
   MAIN JAVASCRIPT
   Books + Supabase + Navigation + Contact
========================================= */


/* =========================================
   1. SUPABASE CONNECTION
========================================= */

const SUPABASE_URL =
  "https://zngagaolaiidgyxoldsh.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_e0wd6fhM_Fr7gsKkKzT2RA_vAReV50F";

const BOOKS_API = `${SUPABASE_URL}/rest/v1/books`;

const PUBLIC_STATUSES = [
  "published",
  "ongoing",
  "completed",
  "coming_soon"
];

let allBooks = [];
let activeStatus = "all";


/* =========================================
   2. FETCH BOOKS
========================================= */

async function fetchBooks() {
  const query = new URLSearchParams({
    select: "id,title,slug,description,main_genre,subgenre,publication_status,cover_url,is_featured,is_editors_pick,created_at",
    publication_status: `in.(${PUBLIC_STATUSES.join(",")})`,
    order: "created_at.asc"
  });

  const response = await fetch(
    `${BOOKS_API}?${query}`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      `Books request failed: ${response.status}`
    );
  }

  return await response.json();
}


/* =========================================
   3. HELPER FUNCTIONS
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

function getBookLink(book) {
  return `read.html?book=${encodeURIComponent(book.slug || "")}`;
}


/* =========================================
   4. FIND WEBSITE CONTAINERS
========================================= */

function featuredContainer() {
  return document.querySelector(
    "#featured-books, #featuredBooks, .featured-books, .featured-books-grid, [data-featured-books]"
  );
}

function libraryContainer() {
  return document.querySelector(
    "#bookGrid, #books-grid, #library-books, #book-grid, .books-grid, .library-grid, [data-library-books]"
  );
}


/* =========================================
   5. LIBRARY BOOK CARDS
========================================= */

function createLibraryCard(book) {
  const title = escapeHTML(book.title);
  const description = escapeHTML(
    book.description || "Discover this story from World of BlessGlow."
  );

  const genre = escapeHTML(book.main_genre || "STORY");
  const subgenre = escapeHTML(book.subgenre || "");
  const status = escapeHTML(
    getStatusLabel(book.publication_status)
  );

  const cover = book.cover_url
    ? escapeHTML(book.cover_url)
    : "";

  const link = getBookLink(book);

  const comingSoon =
    book.publication_status === "coming_soon";

  return `
    <article class="book-card"
      data-title="${title.toLowerCase()}"
      data-genre="${genre.toLowerCase()}"
      data-subgenre="${subgenre.toLowerCase()}"
      data-status="${escapeHTML(book.publication_status || "")}">

      <div class="book-cover-image">

        ${
          cover
            ? `<img
                 src="${cover}"
                 alt="${title} book cover"
                 loading="lazy"
               >`
            : `<div class="book-cover-placeholder">
                 Cover coming soon
               </div>`
        }

      </div>

      <div class="book-info">

        <p class="tag">
          ${genre}${subgenre ? " • " + subgenre : ""}
        </p>

        <h2>${title}</h2>

        <p>${description}</p>

        <span class="status">${status}</span>

        ${
          comingSoon
            ? `<span class="text-link">Coming Soon</span>`
            : `<a class="text-link" href="${link}">Read Now →</a>`
        }

      </div>
    </article>
  `;
}


/* =========================================
   6. HOMEPAGE FEATURED BOOK CARDS
========================================= */

function createFeaturedCard(book) {
  const title = escapeHTML(book.title);

  const description = escapeHTML(
    book.description || "Discover this story from World of BlessGlow."
  );

  const genre = escapeHTML(book.main_genre || "STORY");

  const status = escapeHTML(
    getStatusLabel(book.publication_status)
  );

  const cover = book.cover_url
    ? escapeHTML(book.cover_url)
    : "";

  const comingSoon =
    book.publication_status === "coming_soon";

  const link = getBookLink(book);

  return `
    <article class="featured-book">

      <a
        class="featured-cover"
        href="${comingSoon ? "books.html" : link}"
        aria-label="${comingSoon ? "View" : "Read"} ${title}"
      >

        ${
          cover
            ? `<img
                 src="${cover}"
                 alt="${title} book cover"
                 loading="lazy"
                 style="width:100%;height:100%;object-fit:cover;display:block;"
               >`
            : `<div class="book-cover-placeholder">
                 Cover coming soon
               </div>`
        }

      </a>

      <div class="featured-book-info">

        <p class="book-category">${genre}</p>

        <h3>${title}</h3>

        <p>${description}</p>

        <span class="status">${status}</span>

        ${
          comingSoon
            ? `<a class="text-link" href="books.html">Coming Soon</a>`
            : `<a class="text-link" href="${link}">Read the story →</a>`
        }

      </div>

    </article>
  `;
}


/* =========================================
   7. LOAD HOMEPAGE FEATURED BOOKS
========================================= */

function loadFeaturedBooks() {
  const container = featuredContainer();

  if (!container) return;

  const featured = allBooks.filter(
    book => book.is_featured === true
  );

  container.innerHTML = featured.length
    ? featured.map(createFeaturedCard).join("")
    : `<p class="books-empty">
         Featured stories will appear here soon.
       </p>`;
}


/* =========================================
   8. LOAD LIBRARY BOOKS
========================================= */

function loadLibraryBooks() {
  const container = libraryContainer();

  if (!container) return;

  container.innerHTML = allBooks.length
    ? allBooks.map(createLibraryCard).join("")
    : `<p class="books-empty">No books are available yet.</p>`;

  renderLibrary();
}


/* =========================================
   9. LIBRARY SEARCH AND FILTERS
========================================= */

function renderLibrary() {
  const container = libraryContainer();

  if (!container) return;

  const search = document.getElementById("bookSearch");
  const genre = document.getElementById("genreFilter");
  const count = document.getElementById("bookCount");
  const empty = document.getElementById("noResults");

  const query = search?.value.trim().toLowerCase() || "";

  const selectedGenre =
    genre?.value.toLowerCase() || "all";

  const filtered = allBooks.filter(book => {

    const status = book.publication_status;

    const statusMatch =
      activeStatus === "all" ||
      (
        activeStatus === "completed" &&
        (status === "completed" || status === "published")
      ) ||
      status === activeStatus;

    const genreMatch =
      selectedGenre === "all" ||
      (book.main_genre || "").toLowerCase() === selectedGenre ||
      (book.subgenre || "").toLowerCase() === selectedGenre;

    const searchable = [
      book.title,
      book.description,
      book.main_genre,
      book.subgenre,
      "Blessing Effiong"
    ].join(" ").toLowerCase();

    return (
      statusMatch &&
      genreMatch &&
      searchable.includes(query)
    );
  });

  container.innerHTML = filtered.length
    ? filtered.map(createLibraryCard).join("")
    : "";

  if (count) {
    count.textContent =
      `${filtered.length} ${filtered.length === 1 ? "story" : "stories"} found`;
  }

  if (empty) {
    empty.classList.toggle(
      "show",
      filtered.length === 0
    );
  }
}


/* =========================================
   10. LIBRARY FILTER CONTROLS
========================================= */

function initializeLibraryFilters() {
  const search = document.getElementById("bookSearch");
  const genre = document.getElementById("genreFilter");
  const clear = document.getElementById("clearSearch");

  const tabs = [
    ...document.querySelectorAll(".library-tabs button")
  ];

  if (search) {
    search.addEventListener("input", renderLibrary);
  }

  if (genre) {
    genre.addEventListener("change", renderLibrary);
  }

  if (clear) {
    clear.addEventListener("click", () => {

      if (search) search.value = "";
      if (genre) genre.value = "all";

      activeStatus = "all";

      tabs.forEach(button => {
        button.classList.toggle(
          "active",
          button.dataset.status === "all"
        );
      });

      renderLibrary();
    });
  }

  tabs.forEach(button => {
    button.addEventListener("click", () => {

      activeStatus = button.dataset.status;

      tabs.forEach(tab => {
        tab.classList.toggle(
          "active",
          tab === button
        );
      });

      renderLibrary();
    });
  });
}


/* =========================================
   11. LOAD ALL WEBSITE BOOK DATA
========================================= */

async function initializeBooks() {
  const featured = featuredContainer();
  const library = libraryContainer();

  if (!featured && !library) return;

  if (featured) {
    featured.innerHTML =
      `<p class="loading">Loading featured stories...</p>`;
  }

  if (library) {
    library.innerHTML =
      `<p class="loading">Loading the library...</p>`;
  }

  try {

    allBooks = await fetchBooks();

    loadFeaturedBooks();
    loadLibraryBooks();

    document.dispatchEvent(
      new CustomEvent("blessglow:books-loaded", {
        detail: { books: allBooks }
      })
    );

  } catch (error) {

    console.error(
      "World of BlessGlow book loading error:",
      error
    );

    if (featured) {
      featured.innerHTML =
        `<p class="books-error">Featured books could not be loaded. Please try again later.</p>`;
    }

    if (library) {
      library.innerHTML =
        `<p class="books-error">Unable to load books. Please try again later.</p>`;
    }
  }
}


/* =========================================
   12. MOBILE NAVIGATION
========================================= */

function initializeNavigation() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav");

  if (!toggle || !nav) return;

  function closeMenu() {
    nav.classList.remove("open");

    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute(
      "aria-label",
      "Open navigation menu"
    );

    toggle.textContent = "☰";
  }

  toggle.setAttribute("aria-expanded", "false");

  toggle.addEventListener("click", () => {

    const isOpen = nav.classList.toggle("open");

    toggle.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

    toggle.setAttribute(
      "aria-label",
      isOpen
        ? "Close navigation menu"
        : "Open navigation menu"
    );

    toggle.textContent = isOpen ? "×" : "☰";
  });

  nav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}


/* =========================================
   13. CONTACT FORM
========================================= */

function handleContact(event) {
  event.preventDefault();

  const form = event.target;

  const display =
    document.getElementById("form-message");

  const name =
    form.elements["name"]?.value.trim();

  const email =
    form.elements["email"]?.value.trim();

  const subject =
    form.elements["subject"]?.value;

  const message =
    form.elements["message"]?.value.trim();

  const officialEmail =
    "theworldofblessglow@gmail.com";

  if (!name || !email || !subject || !message) {

    if (display) {
      display.textContent =
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

  if (display) {
    display.textContent =
      "Opening your email application. Please review and send your message there.";
  }

  window.location.href =
    `mailto:${officialEmail}?subject=${emailSubject}&body=${emailBody}`;

  return false;
}

window.handleContact = handleContact;


/* =========================================
   14. START WEBSITE
========================================= */

document.addEventListener("DOMContentLoaded", () => {

  initializeNavigation();

  initializeLibraryFilters();

  initializeBooks();

});
     
                                
