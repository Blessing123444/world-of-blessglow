
/* WORLD OF BLESSGLOW — CHAPTER STUDIO */

/* LOAD CHAPTERS */
async function loadChapters() {
  const bookId = $("chapterBook")?.value;
  const area = $("chapterList");

  if (!area) return;

  area.replaceChildren();
  $("chapterEditor")?.classList.add("hidden");

  if (!bookId) {
    chapters = [];
    $("chapterMessage").textContent =
      "Select a book to view its chapters.";
    return;
  }

  $("chapterMessage").textContent = "Loading chapters...";

  const { data, error } = await db.from("chapters")
    .select("*")
    .eq("book_id", bookId)
    .is("deleted_at", null)
    .order("display_order", { ascending: true })
    .order("chapter_number", { ascending: true });

  if (error) {
    $("chapterMessage").textContent =
      "Could not load chapters: " + error.message;
    return;
  }

  chapters = data || [];
  renderChapters();
  $("chapterMessage").textContent = "";
}

/* DISPLAY CHAPTERS */
function renderChapters() {
  const area = $("chapterList");
  if (!area) return;

  area.replaceChildren();

  const filter = $("chapterFilter")?.value || "all";
  const list = chapters.filter(ch =>
    filter === "all" || ch.publication_status === filter
  );

  if (!list.length) {
    area.textContent = "No chapters found.";
    return;
  }

  list.forEach(ch => {
    const card = document.createElement("article");
    card.className = "chapter-card";

    const heading = document.createElement("h3");
    heading.textContent =
      "Chapter " + ch.chapter_number + " — " + ch.title;

    const badge = document.createElement("span");
    badge.className = "status status-" + ch.publication_status;
    badge.textContent =
      ch.publication_status === "published" ? "Published" : "Draft";

    const actions = document.createElement("div");
    actions.className = "actions";

    actions.append(
      makeButton("Edit", "secondary", () => editChapter(ch)),
      makeButton("Delete", "danger", () => deleteChapter(ch))
    );

    card.append(heading, badge, actions);
    area.append(card);
  });
}

/* NEW CHAPTER */
function newChapter() {
  if (!$("chapterBook").value) {
    alert("Select a book first.");
    return;
  }

  currentChapter = null;
  $("chapterForm").reset();
  $("chapterId").value = "";

  const nextNumber = chapters.length
    ? Math.max(...chapters.map(ch =>
        Number(ch.chapter_number) || 0
      )) + 1
    : 1;

  $("chapterEditorTitle").textContent = "New Chapter";
  $("chapterNumber").value = nextNumber;
  $("chapterOrder").value = nextNumber;
  $("chapterStatus").value = "draft";

  $("chapterEditor").classList.remove("hidden");
  $("chapterEditor").scrollIntoView({ behavior: "smooth" });
}

/* EDIT CHAPTER */
function editChapter(ch) {
  currentChapter = ch;

  $("chapterId").value = ch.id;
  $("chapterNumber").value = ch.chapter_number;
  $("chapterTitle").value = ch.title;
  $("chapterContent").value = ch.content || "";
  $("chapterStatus").value = ch.publication_status;
  $("chapterOrder").value = ch.display_order ?? ch.chapter_number;

  $("chapterEditorTitle").textContent = "Edit Chapter";
  $("chapterEditor").classList.remove("hidden");
  $("chapterEditor").scrollIntoView({ behavior: "smooth" });
}

/* SAVE CHAPTER */
$("chapterForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  const button = $("saveChapter");
  if (button.disabled) return;

  button.disabled = true;
  button.textContent = "Saving...";

  try {
    const bookId = $("chapterBook").value;
    const number = Number($("chapterNumber").value);
    const title = $("chapterTitle").value.trim();
    const content = $("chapterContent").value;
    const status = $("chapterStatus").value;

    if (!bookId) throw Error("Select a book first.");
    if (!Number.isInteger(number) || number < 1) {
      throw Error("Enter a valid chapter number.");
    }
    if (!title || !content.trim()) {
      throw Error("Enter a chapter title and content.");
    }

    const payload = {
      book_id: bookId,
      chapter_number: number,
      title,
      content,
      publication_status: status,
      published_at: status === "published"
        ? (currentChapter?.published_at || new Date().toISOString())
        : null,
      display_order: Math.max(
        1, Number($("chapterOrder").value) || number
      ),
      updated_at: new Date().toISOString()
    };

    const id = $("chapterId").value;

    const result = id
      ? await db.from("chapters").update(payload).eq("id", id)
      : await db.from("chapters").insert(payload);

    if (result.error) throw result.error;

    $("chapterEditor").classList.add("hidden");
    currentChapter = null;

    await loadChapters();
    $("chapterMessage").textContent =
      "Chapter saved successfully.";

  } catch (error) {
    alert("Could not save chapter: " + error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Save Chapter";
  }
});

/* MOVE CHAPTER TO TRASH */
async function deleteChapter(ch) {
  if (!confirm("Move this chapter to Trash?")) return;

  const { error } = await db.from("chapters")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", ch.id);

  if (error) {
    alert("Could not delete chapter: " + error.message);
    return;
  }

  await loadChapters();
  $("chapterMessage").textContent = "Chapter moved to Trash.";
}

/* CHAPTER EVENTS */
$("chapterBook")?.addEventListener("change", async () => {
  currentChapter = null;
  await loadChapters();
});

$("chapterFilter")?.addEventListener("change", renderChapters);

$("addChapter")?.addEventListener("click", newChapter);

$("cancelChapter")?.addEventListener("click", () => {
  $("chapterEditor").classList.add("hidden");
  currentChapter = null;
});
    
