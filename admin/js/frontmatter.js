
/* WORLD OF BLESSGLOW — FRONT MATTER */

const frontMatterTypes = [
  "Title Page",
  "Copyright Notice",
  "Disclaimer",
  "Dedication",
  "Acknowledgements",
  "Author's Note",
  "Introduction",
  "Prologue",
  "Author Tips",
  "Table of Contents"
];

let frontMatterSections = [];
let editingFrontMatter = null;

async function loadFrontMatter() {
  const select = $("frontMatterBook");
  if (!select) return;

  if (!select.options.length || select.options.length === 1) {
    select.innerHTML = '<option value="">Choose a book</option>';

    books.forEach(book => {
      select.add(new Option(book.title, book.id));
    });
  }

  const bookId = select.value;
  $("frontMatterList").innerHTML = "";

  if (!bookId) {
    $("frontMatterMessage").textContent = "Select a book first.";
    return;
  }

  $("frontMatterMessage").textContent = "Loading front matter...";

  const { data, error } = await db
    .from("book_front_matter")
    .select("sections")
    .eq("book_id", bookId)
    .maybeSingle();

  if (error) {
    $("frontMatterMessage").textContent = error.message;
    return;
  }

  frontMatterSections = data?.sections || [];
  renderFrontMatter();

  $("frontMatterMessage").textContent = "";
}

function renderFrontMatter() {
  const area = $("frontMatterList");
  area.innerHTML = "";

  if (!frontMatterSections.length) {
    area.textContent = "No front matter sections added yet.";
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
    status.textContent = section.status;

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

function newFrontMatter() {
  editingFrontMatter = null;
  $("frontMatterForm").reset();
  $("frontMatterEditorTitle").textContent = "Add Front Matter";
  $("frontMatterEditor").classList.remove("hidden");
}

function editFrontMatter(index) {
  const section = frontMatterSections[index];
  editingFrontMatter = index;

  $("frontMatterType").value = section.type;
  $("frontMatterTitle").value = section.title || "";
  $("frontMatterContent").value = section.content || "";
  $("frontMatterStatus").value = section.status || "draft";

  $("frontMatterEditorTitle").textContent = "Edit " + section.type;
  $("frontMatterEditor").classList.remove("hidden");
}

$("frontMatterForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  const button = $("saveFrontMatter");
  button.disabled = true;
  button.textContent = "Saving...";

  try {
    const section = {
      id: editingFrontMatter === null
        ? (crypto.randomUUID?.() || Date.now().toString())
        : frontMatterSections[editingFrontMatter].id,
      type: $("frontMatterType").value,
      title: $("frontMatterTitle").value.trim(),
      content: $("frontMatterContent").value.trim(),
      status: $("frontMatterStatus").value,
      display_order: editingFrontMatter === null
        ? frontMatterSections.length
        : frontMatterSections[editingFrontMatter].display_order
    };

    if (!section.type || !section.content) {
      throw Error("Choose a section and enter its content.");
    }

    if (editingFrontMatter === null) {
      frontMatterSections.push(section);
    } else {
      frontMatterSections[editingFrontMatter] = section;
    }

    frontMatterSections = frontMatterSections.map((item, index) => ({
      ...item,
      display_order: index
    }));

    const { error } = await db
      .from("book_front_matter")
      .upsert({
        book_id: $("frontMatterBook").value,
        sections: frontMatterSections,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    $("frontMatterEditor").classList.add("hidden");
    editingFrontMatter = null;

    renderFrontMatter();
    $("frontMatterMessage").textContent = "Front matter saved successfully.";

  } catch (error) {
    alert("Could not save front matter: " + error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Save Section";
  }
});

async function moveFrontMatter(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= frontMatterSections.length) return;

  [frontMatterSections[index], frontMatterSections[target]] =
    [frontMatterSections[target], frontMatterSections[index]];

  await saveFrontMatterOrder();
}

async function saveFrontMatterOrder() {
  frontMatterSections = frontMatterSections.map((section, index) => ({
    ...section,
    display_order: index
  }));

  const { error } = await db
    .from("book_front_matter")
    .upsert({
      book_id: $("frontMatterBook").value,
      sections: frontMatterSections,
      updated_at: new Date().toISOString()
    });

  if (error) {
    alert("Could not update order: " + error.message);
    return;
  }

  renderFrontMatter();
}

async function deleteFrontMatter(index) {
  if (!confirm("Delete this front matter section?")) return;

  frontMatterSections.splice(index, 1);
  await saveFrontMatterOrder();
}

$("frontMatterBook")?.addEventListener("change", loadFrontMatter);

$("addFrontMatter")?.addEventListener("click", newFrontMatter);

$("cancelFrontMatter")?.addEventListener("click", () => {
  $("frontMatterEditor").classList.add("hidden");
  editingFrontMatter = null;
});
      
