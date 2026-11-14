
/* WORLD OF BLESSGLOW — BOOK MANAGEMENT */

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

function renderBooks() {
  const filter = $("statusFilter").value;
  const list = books.filter(book =>
    trashMode || filter === "all" ||
    book.publication_status === filter
  );

  const area = $("bookList");
  area.innerHTML = "";

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
    img.alt = book.title + " cover";
    img.onerror = () => img.style.display = "none";

    const info = document.createElement("div");
    info.className = "book-info";

    const title = document.createElement("h3");
    title.textContent = book.title;

    const badge = document.createElement("span");
    badge.className = "status status-" + book.publication_status;
    badge.textContent = labels[book.publication_status] ||
      book.publication_status;

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
  $("bookForm").reset();
  selectedCoverFile = null;
  $("bookId").value = book?.id || "";
  currentCover = book?.cover_url || "";

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
      ? Math.max(...books.map(b => Number(b.display_order) || 0)) + 1
      : 1);

  $("featured").checked = !!book?.is_featured;
  $("editorsPick").checked = !!book?.is_editors_pick;
  $("freeInterest").checked = !!book?.allow_free_interest;
  $("preorder").checked = !!book?.allow_preorder;

  $("coverFile").value = "";
  $("coverFileName").textContent = "No image selected.";
  $("coverPreview").src = currentCover;
  $("coverPreview").style.display = currentCover ? "block" : "none";

  $("editor").classList.remove("hidden");
  $("booksPage").classList.add("hidden");
  window.scrollTo(0, 0);
}

$("addBook").onclick = () => openEditor();

$("cancelEdit").onclick = () => {
  selectedCoverFile = null;
  $("editor").classList.add("hidden");
  $("booksPage").classList.remove("hidden");
};

$("title").oninput = () => {
  if (!$("bookId").value) {
    $("slug").value = slugify($("title").value);
  }
};

/* COVER UPLOAD */
$("chooseCover").onclick = () => $("coverFile").click();

$("coverFile").addEventListener("change", function () {
  const file = this.files?.[0];

  if (!file) {
    selectedCoverFile = null;
    $("coverFileName").textContent = "No image selected.";
    return;
  }

  if (!file.type.startsWith("image/") ||
      file.size > 20 * 1024 * 1024) {
    alert("Choose a valid image no larger than 20 MB.");
    this.value = "";
    selectedCoverFile = null;
    $("coverFileName").textContent = "No image selected.";
    return;
  }

  selectedCoverFile = file;
  $("coverFileName").textContent = "Selected: " + file.name;

  const reader = new FileReader();

  reader.onload = event => {
    $("coverPreview").src = event.target.result;
    $("coverPreview").style.display = "block";
  };

  reader.onerror = () => alert("Could not preview this image.");
  reader.readAsDataURL(file);
});

async function uploadCover() {
  if (!selectedCoverFile) return currentCover;

  const file = selectedCoverFile;
  const path = "covers/" + Date.now() + "-" +
    file.name.replace(/[^a-zA-Z0-9._-]/g, "-");

  const { data, error } = await db.storage
    .from("book-covers")
    .upload(path, file, {
      upsert: false,
      contentType: file.type
    });

  if (error) throw error;

  return db.storage.from("book-covers")
    .getPublicUrl(data.path).data.publicUrl;
}

/* SAVE BOOK */
$("bookForm").onsubmit = async event => {
  event.preventDefault();

  const button = $("saveBook");
  button.disabled = true;
  button.textContent = "Saving...";

  try {
    const payload = {
      title: $("title").value.trim(),
      slug: slugify($("slug").value),
      description: $("description").value.trim(),
      main_genre: $("genre").value,
      subgenre: $("subgenre").value.trim(),
      publication_status: $("publicationStatus").value,
      release_date: $("releaseDate").value || null,
      cover_url: await uploadCover(),
      display_order: Math.max(1, Number($("displayOrder").value) || 1),
      is_featured: $("featured").checked,
      is_editors_pick: $("editorsPick").checked,
      allow_free_interest: $("freeInterest").checked,
      allow_preorder: $("preorder").checked
    };

    if (!payload.title || !payload.slug || !payload.main_genre) {
      throw Error("Complete title, slug and genre.");
    }

    const id = $("bookId").value;

    const result = id
      ? await db.from("books").update(payload).eq("id", id)
      : await db.from("books").insert(payload);

    if (result.error) throw result.error;

    selectedCoverFile = null;
    $("editor").classList.add("hidden");
    $("booksPage").classList.remove("hidden");

    await loadBooks();
    message("Book saved successfully.");

  } catch (error) {
    alert("Could not save: " + error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Save Book";
  }
};

/* BOOK ORDER */
async function moveBook(book, direction) {
  const index = books.findIndex(item => item.id === book.id);
  const other = books[index + direction];

  if (!other) return;

  const a = Number(book.display_order) || 0;
  const b = Number(other.display_order) || 0;

  let { error } = await db.from("books")
    .update({
      display_order:
        Math.max(...books.map(x => Number(x.display_order) || 0)) + 1000
    })
    .eq("id", book.id);

  if (error) {
    alert(error.message);
    return;
  }

  ({ error } = await db.from("books")
    .update({ display_order: a }).eq("id", other.id));

  if (error) {
    alert(error.message);
    await loadBooks();
    return;
  }

  ({ error } = await db.from("books")
    .update({ display_order: b }).eq("id", book.id));

  if (error) alert(error.message);
  await loadBooks();
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

$("statusFilter").onchange = renderBooks;

$("showTrash").onclick = async () => {
  trashMode = !trashMode;
  $("showTrash").textContent = trashMode ? "Back to Books" : "Trash";
  $("statusFilter").disabled = trashMode;
  await loadBooks();
};
      
