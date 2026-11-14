
/* WORLD OF BLESSGLOW — ADMIN CORE */

const SUPABASE_URL = "https://zngagaolaiidgyxoldsh.supabase.co";
const SUPABASE_KEY = "sb_publishable_e0wd6fhM_Fr7gsKkKzT2RA_vAReV50F";

if (!window.supabase) {
  throw new Error("Supabase library did not load.");
}

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = id => document.getElementById(id);

let books = [];
let chapters = [];
let trashMode = false;
let currentCover = "";
let selectedCoverFile = null;
let loading = false;
let currentChapter = null;

const labels = {
  draft: "Draft",
  coming_soon: "Coming Soon",
  ongoing: "Ongoing",
  completed: "Completed",
  published: "Published",
  archived: "Archived"
};

function message(text) {
  const element = $("message");
  if (element) element.textContent = text;
}

function slugify(text) {
  return text.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function makeButton(text, cls, fn) {
  const button = document.createElement("button");
  button.textContent = text;
  button.className = cls;
  button.type = "button";
  button.onclick = fn;
  return button;
}

/* ADMIN NAVIGATION */

const adminPages = {
  books: "booksPage",
  chapters: "chaptersPage",
  frontmatter: "frontMatterPage",
  media: "mediaPage",
  reviews: "reviewsPage",
  homepage: "homepagePage",
  genres: "genresPage",
  notifications: "notificationsPage",
  settings: "settingsPage",
  security: "securityPage"
};

async function showAdminPage(page, button) {
  Object.values(adminPages).forEach(id => {
    const section = $(id);
    if (section) section.classList.add("hidden");
  });

  $("editor")?.classList.add("hidden");

  document.querySelectorAll("nav button").forEach(item => {
    item.classList.remove("active");
  });

  button?.classList.add("active");

  const pageId = adminPages[page];
  if (pageId) $(pageId)?.classList.remove("hidden");

  const title = button?.textContent.trim() || page;
  if ($("pageTitle")) $("pageTitle").textContent = title;

  if (page === "books") {
    await loadBooks();
  }

  if (page === "chapters") {
    if (!books.length) await loadBooks();

    const select = $("chapterBook");
    if (select) {
      select.innerHTML = '<option value="">Choose a book</option>';

      books.forEach(book => {
        select.add(new Option(book.title, book.id));
      });
    }

    await loadChapters();
  }

  if (page === "frontmatter") {
    await loadFrontMatter();
  }
}

document.querySelectorAll("nav button[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    showAdminPage(button.dataset.page, button);
  });
});
    
    
