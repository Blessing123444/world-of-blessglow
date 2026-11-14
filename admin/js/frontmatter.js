
/* WORLD OF BLESSGLOW — FRONT & BACK MATTER */

const frontMatterTypes = [
  "Title Page",
  "Introduction",
  "Copyright Notice",
  "Disclaimer",
  "Dedication",
  "Author's Note",
  "Prologue",
  "Epilogue",
  "Acknowledgements",
  "About the Author",
  "Author Biography",
  "Afterword",
  "Other Books by the Author",
  "Reader's Note",
  "Connect with the Author",
  "Author Tips",
  "Table of Contents",
  "Glossary",
  "Appendix",
  "Reading Guide"
];

let frontMatterSections = [];
let editingFrontMatter = null;

/* PREPARE SECTION TYPES */
function prepareFrontMatterTypes() {
  const select = $("frontMatterType");
  if (!select) return;

  select.replaceChildren();
  select.add(new Option("Choose section type", ""));

  frontMatterTypes.forEach(type => {
    select.add(new Option(type, type));
  });
}

/* LOAD FRONT MATTER */
async function loadFrontMatter() {
  const select = $("frontMatterBook");
  if (!select) return;

  if (!books.length) await loadBooks();

  const previousBook = select.value;
  select.replaceChildren();
  select.add(new Option("Choose a book", ""));

  books.forEach(book => {
    select.add(new Option(book.title, book.id));
  });

  if (books.some(book => book.id === previousBook)) {
    select.value = previousBook;
  }

  prepareFrontMatterTypes();

  frontMatterSections = [];
  editingFrontMatter = null;
  $("frontMatterEditor")?.classList.add("hidden");
  $("frontMatterList").replaceChildren();

  const bookId = select.value;

  if (!bookId) {
    $("frontMatterMessage").textContent = "Select a book first.";
    return;
  }

  $("frontMatterMessage").textContent = "Loading sections...";

  const { data, error } = await db
    .from("book_front_matter")
    .select("sections")
    .eq("book_id", bookId)
    .maybeSingle();

  if (error) {
    $("frontMatterMessage").textContent =
      "Could not load sections: " + error.message;
    return;
  }

  frontMatterSections = Array.isArray(data?.sections)
    ? data.sections
    : [];

  frontMatterSections.sort((a, b) =>
    (a.display_order ?? 0) - (b.display_order ?? 0)
  );

  renderFrontMatter();
  $("frontMatterMessage").textContent = "";
}

/* DISPLAY SECTIONS */
function renderFrontMatter() {
  const area = $("frontMatterList");
  if (!area) return;

  area.replaceChildren();

  if (!frontMatterSections.length) {
    area.textContent = "No front or back matter sections added yet.";
    return;
  }

  frontMatterSections.forEach((section, index) => {
    const card = document.createElement("article");
    card.className = "chapter-card";

    const heading = document.createElement("h3");
    heading.textContent = section.type;

    const title = document.createElement("p");
    title.textContent = section.title || "Untitled";

    const status = document.createElement("span");
    status.className = "status status-" + section.status;
    status.textContent = section.status || "draft";

    const actions = document.createElement("div");
    actions.className = "actions";

    actions.append(
      makeButton("Edit", "secondary", () => editFrontMatter(index)),
      makeButton("↑", "secondary", () => moveFrontMatter(index, -1)),
      makeButton("↓", "secondary", () => moveFrontMatter(index, 1)),
      makeButton("Delete", "danger", () => deleteFrontMatter(index))
    );

    card.append(heading, title, status, actions);
    area.append(card);
  });
}

/* ADD SECTION */
function newFrontMatter() {
  if (!$("frontMatterBook").value) {
    alert("Select a book first.");
    return;
  }

  editingFrontMatter = null;
  $("frontMatterForm").reset();
  $("frontMatterType").disabled = false;

  $("frontMatterEditorTitle").textContent = "Add Book Section";
  $("frontMatterEditor").classList.remove("hidden");
  $("frontMatterEditor").scrollIntoView({ behavior: "smooth" });
}

/* EDIT SECTION */
function editFrontMatter(index) {
  const section = frontMatterSections[index];
  if (!section) return;

  editingFrontMatter = index;

  $("frontMatterType").value = section.type;
  $("frontMatterType").disabled = false;
  $("frontMatterTitle").value = section.title || "";
  $("frontMatterContent").value = section.content || "";
  $("frontMatterStatus").value = section.status || "draft";

  $("frontMatterEditorTitle").textContent =
    "Edit " + section.type;

  $("frontMatterEditor").classList.remove("hidden");
  $("frontMatterEditor").scrollIntoView({ behavior: "smooth" });
}

/* SAVE SECTIONS TO SUPABASE */
async function persistFrontMatter(sections) {
  const bookId = $("frontMatterBook").value;
  if (!bookId) throw Error("Select a book first.");

  const { error } = await db
    .from("book_front_matter")
    .upsert({
      book_id: bookId,
      sections,
      updated_at: new Date().toISOString()
    });

  if (error) throw error;
}

/* SAVE SECTION */
$("frontMatterForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  const button = $("saveFrontMatter");
  if (button.disabled) return;

  button.disabled = true;
  button.textContent = "Saving...";

  try {
    const type = $("frontMatterType").value;
    const content = $("frontMatterContent").value;

    if (!type || !content.trim()) {
      throw Error("Choose a section and enter its content.");
    }

    const oldSection = editingFrontMatter === null
      ? null
      : frontMatterSections[editingFrontMatter];

    const section = {
      id: oldSection?.id ||
        (crypto.randomUUID
          ? crypto.randomUUID()
          : Date.now() + "-" + Math.random().toString(36).slice(2)),
      type,
      title: $("frontMatterTitle").value.trim(),
      content,
      status: $("frontMatterStatus").value,
      display_order: editingFrontMatter === null
        ? frontMatterSections.length
        : oldSection.display_order
    };

    const updated = [...frontMatterSections];

    if (editingFrontMatter === null) {
      updated.push(section);
    } else {
      updated[editingFrontMatter] = section;
    }

    const ordered = updated.map((item, index) => ({
      ...item,
      display_order: index
    }));

    await persistFrontMatter(ordered);

    frontMatterSections = ordered;
    editingFrontMatter = null;

    $("frontMatterEditor").classList.add("hidden");
    renderFrontMatter();

    $("frontMatterMessage").textContent =
      "Section saved successfully.";

  } catch (error) {
    alert("Could not save section: " + error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Save Section";
  }
});

/* REORDER SECTIONS */
async function moveFrontMatter(index, direction) {
  const target = index + direction;

  if (target < 0 || target >= frontMatterSections.length) return;

  const updated = [...frontMatterSections];

  [updated[index], updated[target]] =
    [updated[target], updated[index]];

  const ordered = updated.map((section, i) => ({
    ...section,
    display_order: i
  }));

  try {
    await persistFrontMatter(ordered);
    frontMatterSections = ordered;
    renderFrontMatter();
  } catch (error) {
    alert("Could not update order: " + error.message);
  }
}

/* DELETE SECTION */
async function deleteFrontMatter(index) {
  if (!confirm("Delete this section?")) return;

  const updated = frontMatterSections.filter((_, i) => i !== index);

  const ordered = updated.map((section, i) => ({
    ...section,
    display_order: i
  }));

  try {
    await persistFrontMatter(ordered);
    frontMatterSections = ordered;
    renderFrontMatter();

    $("frontMatterMessage").textContent =
      "Section deleted successfully.";
  } catch (error) {
    alert("Could not delete section: " + error.message);
  }
}

/* EVENTS */
$("frontMatterBook")?.addEventListener("change", loadFrontMatter);

$("addFrontMatter")?.addEventListener("click", newFrontMatter);

$("cancelFrontMatter")?.addEventListener("click", () => {
  $("frontMatterEditor").classList.add("hidden");
  editingFrontMatter = null;
  $("frontMatterType").disabled = false;
});
    
