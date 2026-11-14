
/* WORLD OF BLESSGLOW — ADMIN SETTINGS & OVERVIEW */

async function getCount(table, filters = []) {
  let query = db.from(table).select("*", {
    count: "exact",
    head: true
  });

  filters.forEach(([column, operator, value]) => {
    query = operator === "is"
      ? query.is(column, value)
      : query.eq(column, value);
  });

  const { count, error } = await query;
  if (error) throw error;

  return count || 0;
}

/* STAT CARD */
function settingsCard(label, value) {
  const card = document.createElement("article");
  card.className = "settings-stat-card";

  const heading = document.createElement("h3");
  heading.textContent = label;

  const number = document.createElement("p");
  number.textContent = String(value);

  card.append(heading, number);
  return card;
}

/* LOAD OVERVIEW */
async function loadSettings() {
  const area = $("settingsContent");
  if (!area) return;

  area.textContent = "Loading admin overview...";

  try {
    const [
      totalBooks,
      publishedBooks,
      comingSoon,
      totalChapters,
      pendingReviews,
      approvedReviews,
      frontMatter
    ] = await Promise.all([
      getCount("books", [["deleted_at", "is", null]]),
      getCount("books", [
        ["deleted_at", "is", null],
        ["publication_status", "eq", "published"]
      ]),
      getCount("books", [
        ["deleted_at", "is", null],
        ["publication_status", "eq", "coming_soon"]
      ]),
      getCount("chapters", [["deleted_at", "is", null]]),
      getCount("book_reviews", [
        ["deleted_at", "is", null],
        ["status", "eq", "pending"]
      ]),
      getCount("book_reviews", [
        ["deleted_at", "is", null],
        ["status", "eq", "approved"]
      ]),
      getCount("book_front_matter")
    ]);

    const { data, error } = await db.auth.getUser();
    if (error) throw error;

    area.replaceChildren();

    const heading = document.createElement("h2");
    heading.textContent = "World of BlessGlow Overview";

    const grid = document.createElement("div");
    grid.className = "settings-stats-grid";

    [
      ["Total Books", totalBooks],
      ["Published Books", publishedBooks],
      ["Coming Soon", comingSoon],
      ["Total Chapters", totalChapters],
      ["Pending Reviews", pendingReviews],
      ["Approved Reviews", approvedReviews],
      ["Front Matter Records", frontMatter]
    ].forEach(([label, value]) => {
      grid.append(settingsCard(label, value));
    });

    const account = document.createElement("p");
    account.textContent =
      "Signed in as: " + (data.user?.email || "Administrator");

    const note = document.createElement("p");
    note.textContent =
      "Overview uses your existing Supabase database. No additional settings table is required.";

    area.append(heading, grid, account, note);

    const status = $("settingsMessage");
    if (status) status.textContent = "Overview updated successfully.";

  } catch (error) {
    area.textContent = "Could not load overview: " + error.message;
  }
}

/* SETUP */
function setupSettings() {
  const area = $("settingsContent");
  if (!area || $("refreshSettings")) return;

  const button = makeButton("Refresh Overview", "secondary", loadSettings);
  button.id = "refreshSettings";

  const message = document.createElement("p");
  message.id = "settingsMessage";

  area.before(button);
  button.after(message);
}

/* PAGE NAVIGATION */
document.querySelectorAll('nav button[data-page="settings"]')
  .forEach(button => button.addEventListener("click", loadSettings));

setupSettings();
