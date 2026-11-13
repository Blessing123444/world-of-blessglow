
/* WORLD OF BLESSGLOW — ADMIN CORE */

const SUPABASE_URL = "https://zngagaolaiidgyxoldsh.supabase.co";
const SUPABASE_KEY = "sb_publishable_e0wd6fhM_Fr7gsKkKzT2RA_vAReV50F";

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
  $("message").textContent = text;
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
  button.onclick = fn;
  return button;
}

/* ADMIN NAVIGATION */
document.querySelectorAll("nav button").forEach(button => {
  button.onclick = async () => {
    document.querySelectorAll("nav button")
      .forEach(item => item.classList.remove("active"));

    button.classList.add("active");

    const page = button.dataset.page;
    const isBooks = page === "books";
    const isChapters = page === "chapters";
    const isFrontMatter = page === "frontmatter";

    $("booksPage").classList.toggle("hidden", !isBooks);
    $("editor").classList.add("hidden");
    $("chaptersPage").classList.toggle("hidden", !isChapters);

    $("frontMatterPage")?.classList.toggle("hidden", !isFrontMatter);

    $("placeholder").classList.toggle(
      "hidden", isBooks || isChapters || isFrontMatter
    );

    $("pageTitle").textContent = button.textContent.trim();
    $("placeholderTitle").textContent = button.textContent.trim();

    if (isBooks) await loadBooks();

    if (isChapters) {
      $("chapterBook").innerHTML =
        '<option value="">Choose a book</option>';

      books.forEach(book => {
        const option = new Option(book.title, book.id);
        $("chapterBook").add(option);
      });

      await loadChapters();
    }

    if (isFrontMatter) await loadFrontMatter();
  };
});
    
