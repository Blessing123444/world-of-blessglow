
/* WORLD OF BLESSGLOW — BOOK MANAGEMENT */

/* LOAD BOOKS */
async function loadBooks() {
  message("Loading books...");

  let query = db.from("books").select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  query = trashMode
    ? query.not("deleted_at", "is", null)
    : query.is("deleted_at", null);

  const { data, error } = await query;

  if (error) {
    message("Could not load books: " + error.message);
    return;
  }

  books = data || [];
  renderBooks();
  message("");
}

/* DISPLAY BOOKS */
function renderBooks() {
  const area = $("bookList");
  if (!area) return;

  const filter = $("statusFilter")?.value || "all";

  const list = books.filter(book =>
    trashMode || filter === "all" ||
    book.publication_status === filter
  );

  area.replaceChildren();

  if (!list.length) {
    area.textContent = "No books found.";
    return;
  }

  list.forEach(book => {
    const card = document.createElement("article");
    card.className = "book";

    const img = document.createElement("img");
    img.className = "cover";
    img.src = book.cover_url || "";
    img.alt = (book.title || "Book") + " cover";
    img.onerror = () => img.style.display = "none";

    const info = document.createElement("div");
    info.className = "book-info";

    const title = document.createElement("h3");
    title.textContent = book.title;

    const badge = document.createElement("span");
    badge.className = "status status-" + book.publication_status;
    badge.textContent =
      labels[book.publication_status] || book.publication_status;

    const order = document.createElement("p");
    order.className = "note";
    order.textContent = "Position: " + book.display_order;

    const actions = document.createElement("div");
    actions.className = "actions";

    if (trashMode) {
      actions.append(makeButton("Restore", "secondary",
        () => restoreBook(book)));
    } else {
      actions.append(
        makeButton("Edit", "secondary", () => openEditor(book)),
        makeButton("↑", "secondary", () => moveBook(book, -1)),
        makeButton("↓", "secondary", () => moveBook(book, 1)),
        makeButton("Trash", "danger", () => trashBook(book))
      );
    }

    info.append(title, badge, order, actions);
    card.append(img, info);
    area.append(card);
  });
}

/* BOOK EDITOR */
function openEditor(book = null) {
  if (typeof book === "string") {
    book = books.find(item => item.id === book) || null;
  }

  $("bookForm").reset();

  selectedCoverFile = null;
  currentCover = book?.cover_url || "";

  $("bookId").value = book?.id || "";
  $("editorTitle").textContent = book ? "Edit Book" : "Add Book";

  $("title").value = book?.title || "";
  $("slug").value = book?.slug || "";
  $("genre").value = book?.main_genre || "";

  updateSubgenres($("genre").value, book?.subgenre || "");

  $("description").value = book?.description || "";
  $("publicationStatus").value =
    book?.publication_status || "draft";

  $("releaseDate").value = book?.release_date || "";

  $("displayOrder").value = book?.display_order ??
    (books.length
      ? Math.max(...books.map(b =>
          Number(b.display_order) || 0
        )) + 1
      : 1);

  $("featured").checked = !!book?.is_featured;
  $("editorsPick").checked = !!book?.is_editors_pick;
  $("freeInterest").checked = !!book?.allow_free_interest;
  $("preorder").checked = !!book?.allow_pre_order;

  $("coverFile").value = "";
  $("coverFileName").textContent = currentCover
    ? "Current cover selected."
    : "No image selected.";

  $("coverPreview").src = currentCover;
  $("coverPreview").style.display = currentCover ? "block" : "none";

  $("editor").classList.remove("hidden");
  $("booksPage").classList.add("hidden");

  window.scrollTo(0, 0);
}

/* EDITOR BUTTONS */
$("addBook")?.addEventListener("click", () => openEditor());

$("cancelEdit")?.addEventListener("click", () => {
  selectedCoverFile = null;
  currentCover = "";
  $("coverFile").value = "";
  $("editor").classList.add("hidden");
  $("booksPage").classList.remove("hidden");
});

$("title")?.addEventListener("input", () => {
  if (!$("bookId").value) {
    $("slug").value = slugify($("title").value);
  }
});

/* COVER PICKER */
$("chooseCover")?.addEventListener("click", event => {
  event.preventDefault();
  $("coverFile").click();
});

$("coverFile")?.addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please choose an image file.");
    event.target.value = "";
    return;
  }

  if (file.size > 20 * 1024 * 1024) {
    alert("Image must not exceed 20 MB.");
    event.target.value = "";
    return;
  }

  selectedCoverFile = file;
  $("coverFileName").textContent = "Selected: " + file.name;

  const reader = new FileReader();

  reader.onload = () => {
    $("coverPreview").src = reader.result;
    $("coverPreview").style.display = "block";
  };

  reader.onerror = () => alert("Could not preview this image.");

  reader.readAsDataURL(file);
});

/* UPLOAD COVER */
async function uploadCover() {
  if (!selectedCoverFile) return currentCover;

  const file = selectedCoverFile;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = "covers/" + Date.now() + "-" + safeName;

  const { data, error } = await db.storage
    .from("book-covers")
    .upload(path, file, {
      upsert: false,
      contentType: file.type
    });

  if (error) throw error;

  const { data: urlData } = db.storage
    .from("book-covers")
    .getPublicUrl(data.path);

  if (!urlData?.publicUrl) {
    throw Error("Could not get the uploaded cover URL.");
  }

  return urlData.publicUrl;
}

/* SAVE BOOK */
$("bookForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  const button = $("saveBook");
  if (button.disabled) return;

  button.disabled = true;
  button.textContent = "Saving...";

  try {
    const title = $("title").value.trim();
    const slug = slugify($("slug").value);
    const genre = $("genre").value;
    const subgenre = $("subgenre").value;

    if (!title || !slug || !genre || !subgenre) {
      throw Error("Complete the title, slug, main genre and subgenre.");
    }

    const coverUrl = await uploadCover();

    const payload = {
      title,
      slug,
      description: $("description").value.trim(),
      main_genre: genre,
      subgenre,
      publication_status: $("publicationStatus").value,
      release_date: $("releaseDate").value || null,
      cover_url: coverUrl,
      display_order: Math.max(1, Number($("displayOrder").value) || 1),
      is_featured: $("featured").checked,
      is_editors_pick: $("editorsPick").checked,
      allow_free_interest: $("freeInterest").checked,
      allow_pre_order: $("preorder").checked,
      updated_at: new Date().toISOString()
    };

    const id = $("bookId").value;

    const result = id
      ? await db.from("books").update(payload).eq("id", id)
      : await db.from("books").insert(payload);

    if (result.error) throw result.error;

    selectedCoverFile = null;
    currentCover = coverUrl;

    $("editor").classList.add("hidden");
    $("booksPage").classList.remove("hidden");

    await loadBooks();
    message("Book saved successfully.");

  } catch (error) {
    alert("Could not save book: " + error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Save Book";
  }
});

/* CHANGE BOOK ORDER */
async function moveBook(book, direction) {
  const index = books.findIndex(item => item.id === book.id);
  const other = books[index + direction];

  if (!other) return;

  const oldBookOrder = Number(book.display_order) || 0;
  const oldOtherOrder = Number(other.display_order) || 0;

  const temporaryOrder =
    Math.max(0, ...books.map(item =>
      Number(item.display_order) || 0
    )) + 1;

  try {
    let result = await db.from("books")
      .update({ display_order: temporaryOrder })
      .eq("id", book.id);

    if (result.error) throw result.error;

    result = await db.from("books")
      .update({
        display_order: oldBookOrder,
        updated_at: new Date().toISOString()
      })
      .eq("id", other.id);

    if (result.error) throw result.error;

    result = await db.from("books")
      .update({
        display_order: oldOtherOrder,
        updated_at: new Date().toISOString()
      })
      .eq("id", book.id);

    if (result.error) throw result.error;

    await loadBooks();

  } catch (error) {
    alert("Could not change book order: " + error.message);
    await loadBooks();
  }
}

/* TRASH AND RESTORE */
async function trashBook(book) {
  if (!confirm("Move this book to Trash?")) return;

  const { error } = await db.from("books")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", book.id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadBooks();
}

async function restoreBook(book) {
  const { error } = await db.from("books")
    .update({ deleted_at: null })
    .eq("id", book.id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadBooks();
}

/* FILTER AND TRASH */
$("statusFilter")?.addEventListener("change", renderBooks);

$("showTrash")?.addEventListener("click", async () => {
  trashMode = !trashMode;

  $("showTrash").textContent = trashMode
    ? "Back to Books"
    : "Trash";

  if ($("statusFilter")) {
    $("statusFilter").disabled = trashMode;
  }

  await loadBooks();
});
      
