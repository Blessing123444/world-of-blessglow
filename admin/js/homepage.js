
/* WORLD OF BLESSGLOW — HOMEPAGE MANAGER */

function homepageBookCard(book) {
  const card = document.createElement("article");
  card.className = "homepage-book-card";

  const title = document.createElement("h3");
  title.textContent = book.title;

  const genre = document.createElement("p");
  genre.textContent = `${book.genre || ""} / ${book.subgenre || ""}`;

  const status = document.createElement("p");
  status.textContent = "Status: " + (book.publication_status || "draft");

  const featuredLabel = document.createElement("label");
  const featured = document.createElement("input");
  featured.type = "checkbox";
  featured.checked = !!book.featured;
  featured.addEventListener("change", () =>
    updateHomepageBook(book.id, { featured: featured.checked })
  );
  featuredLabel.append(featured, " Featured");

  const editorLabel = document.createElement("label");
  const editor = document.createElement("input");
  editor.type = "checkbox";
  editor.checked = !!book.editors_pick;
  editor.addEventListener("change", () =>
    updateHomepageBook(book.id, { editors_pick: editor.checked })
  );
  editorLabel.append(editor, " Editor's Pick");

  const edit = makeButton("Edit Book", "secondary", () => {
    openEditor(book.id);
  });

  const controls = document.createElement("div");
  controls.className = "actions";
  controls.append(featuredLabel, editorLabel, edit);

  card.append(title, genre, status, controls);
  return card;
}

/* UPDATE HOMEPAGE FLAGS */
async function updateHomepageBook(id, changes) {
  try {
    const { error } = await db
      .from("books")
      .update(changes)
      .eq("id", id);

    if (error) throw error;

    await loadBooks();
    renderHomepage();
    homepageMessage("Homepage settings updated.");

  } catch (error) {
    alert("Could not update book: " + error.message);
    await loadHomepage();
  }
}

function homepageMessage(text) {
  const messageBox = $("homepageMessage");
  if (messageBox) messageBox.textContent = text;
}

/* SECTION BUILDER */
function addHomepageSection(container, heading, items) {
  const section = document.createElement("section");
  section.className = "homepage-section";

  const title = document.createElement("h3");
  title.textContent = heading;

  const content = document.createElement("div");
  content.className = "homepage-book-grid";

  if (!items.length) {
    content.textContent = "No books in this section yet.";
  } else {
    items.forEach(book => {
      content.append(homepageBookCard(book));
    });
  }

  section.append(title, content);
  container.append(section);
}

/* RENDER HOMEPAGE SECTIONS */
function renderHomepage() {
  const area = $("homepageContent");
  if (!area) return;

  area.replaceChildren();

  const activeBooks = books.filter(book => !book.deleted_at);

  const sorted = [...activeBooks].sort((a, b) =>
    (a.display_order ?? 0) - (b.display_order ?? 0)
  );

  const featured = sorted.filter(book => book.featured);
  const editors = sorted.filter(book => book.editors_pick);

  const comingSoon = sorted.filter(book =>
    book.publication_status === "coming_soon"
  );

  const newReleases = [...sorted]
    .filter(book =>
      ["published", "completed"].includes(book.publication_status)
    )
    .sort((a, b) =>
      new Date(b.release_date || b.created_at || 0) -
      new Date(a.release_date || a.created_at || 0)
    )
    .slice(0, 6);

  const recentlyUpdated = [...sorted]
    .filter(book => book.updated_at)
    .sort((a, b) =>
      new Date(b.updated_at) - new Date(a.updated_at)
    )
    .slice(0, 6);

  addHomepageSection(area, "Featured Books", featured);
  addHomepageSection(area, "New Releases", newReleases);
  addHomepageSection(area, "Coming Soon", comingSoon);
  addHomepageSection(area, "Editor's Picks", editors);
  addHomepageSection(area, "Recently Updated", recentlyUpdated);

  homepageMessage(activeBooks.length + " books available.");
}

/* LOAD HOMEPAGE MANAGER */
async function loadHomepage() {
  homepageMessage("Loading homepage...");

  try {
    await loadBooks();
    renderHomepage();
  } catch (error) {
    homepageMessage("Could not load homepage: " + error.message);
  }
}

/* REFRESH */
function setupHomepageManager() {
  const area = $("homepageContent");
  if (!area || $("refreshHomepage")) return;

  const refresh = makeButton(
    "Refresh Homepage",
    "secondary",
    loadHomepage
  );

  refresh.id = "refreshHomepage";
  area.before(refresh);

  const message = document.createElement("p");
  message.id = "homepageMessage";
  refresh.after(message);
}

/* OPEN HOMEPAGE TAB */
document.querySelectorAll('nav button[data-page="homepage"]')
  .forEach(button => {
    button.addEventListener("click", loadHomepage);
  });

setupHomepageManager();

