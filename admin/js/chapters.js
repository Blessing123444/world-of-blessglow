
/* WORLD OF BLESSGLOW — CHAPTER STUDIO */

async function loadChapters() {
  const bookId = $("chapterBook").value;

  $("chapterList").innerHTML = "";
  $("chapterEditor").classList.add("hidden");

  if (!bookId) {
    $("chapterMessage").textContent = "Select a book to view its chapters.";
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
}

function renderChapters() {
  const area = $("chapterList");
  area.innerHTML = "";

  const filter = $("chapterFilter").value;
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

  $("chapterEditorTitle").textContent = "New Chapter";
  $("chapterNumber").value = chapters.length + 1;
  $("chapterOrder").value = chapters.length + 1;
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
  $("chapterOrder").value = ch.display_order;

  $("chapterEditorTitle").textContent = "Edit Chapter";
  $("chapterEditor").classList.remove("hidden");
  $("chapterEditor").scrollIntoView({ behavior: "smooth" });
}

/* SAVE CHAPTER */
$("chapterForm").onsubmit = async event => {
  event.preventDefault();

  const button = $("saveChapter");
  button.disabled = true;
  button.textContent = "Saving...";

  try {
    const status = $("chapterStatus").value;

    const payload = {
      book_id: $("chapterBook").value,
      chapter_number: Number($("chapterNumber").value),
      title: $("chapterTitle").value.trim(),
      content: $("chapterContent").value,
      publication_status: status,
      published_at: status === "published"
        ? (currentChapter?.published_at || new Date().toISOString())
        : null,
      display_order: Math.max(0, Number($("chapterOrder").value) || 0),
      updated_at: new Date().toISOString()
    };

    if (!payload.title || !payload.content.trim()) {
      throw Error("Enter a chapter title and content.");
    }

    const id = $("chapterId").value;

    const result = id
      ? await db.from("chapters").update(payload).eq("id", id)
      : await db.from("chapters").insert(payload);

    if (result.error) throw result.error;

    $("chapterEditor").classList.add("hidden");
    currentChapter = null;

    await loadChapters();
    $("chapterMessage").textContent = "Chapter saved successfully.";

  } catch (error) {
    alert("Could not save chapter: " + error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Save Chapter";
  }
};

/* DELETE CHAPTER */
async function deleteChapter(ch) {
  if (!confirm("Move this chapter to Trash?")) return;

  const { error } = await db.from("chapters")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", ch.id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadChapters();
  $("chapterMessage").textContent = "Chapter moved to Trash.";
}

/* CHAPTER EVENTS */
$("chapterBook").onchange = loadChapters;
$("chapterFilter").onchange = renderChapters;
$("addChapter").onclick = newChapter;

$("cancelChapter").onclick = () => {
  $("chapterEditor").classList.add("hidden");
  currentChapter = null;
};
      
