
/* WORLD OF BLESSGLOW — ADMIN REVIEW MANAGER */

let adminReviews = [];
let reviewFilter = "pending";

/* BUILD REVIEW CONTROLS */
function setupReviewManager() {
  const page = $("reviewsPage");
  const list = $("reviewsList");

  if (!page || !list || $("reviewAdminTools")) return;

  const tools = document.createElement("div");
  tools.id = "reviewAdminTools";

  const filter = document.createElement("select");
  filter.id = "reviewAdminFilter";

  [
    ["pending", "Pending"],
    ["approved", "Approved"],
    ["rejected", "Rejected"],
    ["trash", "Trash"]
  ].forEach(([value, label]) => {
    filter.add(new Option(label, value));
  });

  filter.value = reviewFilter;
  filter.addEventListener("change", () => {
    reviewFilter = filter.value;
    loadReviews();
  });

  const refresh = makeButton("Refresh", "secondary", loadReviews);

  const status = document.createElement("p");
  status.id = "reviewAdminMessage";

  tools.append(filter, refresh, status);
  list.before(tools);
}

/* LOAD REVIEWS */
async function loadReviews() {
  const list = $("reviewsList");
  if (!list) return;

  setupReviewManager();

  const messageBox = $("reviewAdminMessage");
  messageBox.textContent = "Loading reviews...";
  list.replaceChildren();

  try {
    let query = db.from("book_reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (reviewFilter === "trash") {
      query = query.not("deleted_at", "is", null);
    } else {
      query = query.is("deleted_at", null)
        .eq("status", reviewFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    adminReviews = data || [];
    renderReviews();

    messageBox.textContent =
      adminReviews.length + " review(s) found.";

  } catch (error) {
    messageBox.textContent =
      "Could not load reviews: " + error.message;
  }
}

/* DISPLAY REVIEWS */
function renderReviews() {
  const list = $("reviewsList");
  list.replaceChildren();

  if (!adminReviews.length) {
    list.textContent = "No reviews in this section.";
    return;
  }

  adminReviews.forEach(review => {
    const card = document.createElement("article");
    card.className = "review-admin-card";

    const bookNames = {
      "a-love-written-in-silence": "A Love Written in Silence",
      "behind-her-smile": "Behind Her Smile: The Girl They Framed"
    };

    const heading = document.createElement("h3");
    heading.textContent = review.display_name || "Anonymous reader";

    const book = document.createElement("p");
    book.textContent =
      bookNames[review.book_slug] || review.book_slug;

    const rating = document.createElement("p");
    rating.textContent =
      "Rating: " + "★".repeat(Number(review.rating) || 0) +
      "☆".repeat(5 - (Number(review.rating) || 0));

    const date = document.createElement("small");
    date.textContent = review.created_at
      ? new Date(review.created_at).toLocaleString()
      : "";

    const status = document.createElement("p");
    status.textContent = "Status: " +
      (review.status || "pending");

    const overallTitle = document.createElement("h4");
    overallTitle.textContent = "Overall Review";

    const overall = document.createElement("p");
    overall.textContent =
      review.review_text || "No overall review provided.";

    card.append(
      heading, book, rating, date, status,
      overallTitle, overall
    );

    if (review.finished_book === true) {
      const finished = document.createElement("p");
      finished.textContent = "✓ Finished reading this book";
      card.append(finished);
    }

    /* DISCUSSION ANSWERS */
    let answers = review.discussion_answers || {};

    if (typeof answers === "string") {
      try {
        answers = JSON.parse(answers);
      } catch {
        answers = {};
      }
    }

    if (answers && typeof answers === "object" &&
        !Array.isArray(answers)) {
      const title = document.createElement("h4");
      title.textContent = "Discussion Answers";
      card.append(title);

      Object.entries(answers).forEach(([question, answer]) => {
        const section = document.createElement("div");

        const q = document.createElement("strong");
        q.textContent = question;

        const a = document.createElement("p");
        a.textContent = String(answer || "");

        section.append(q, a);
        card.append(section);
      });
    }

    /* ACTIONS */
    const actions = document.createElement("div");
    actions.className = "actions";

    if (reviewFilter === "trash") {
      actions.append(
        makeButton("Restore", "secondary",
          () => updateReview(review.id, {
            deleted_at: null
          })
        ),
        makeButton("Delete Permanently", "danger",
          () => permanentlyDeleteReview(review.id)
        )
      );
    } else {
      if (review.status !== "approved") {
        actions.append(
          makeButton("Approve", "secondary",
            () => updateReview(review.id, {
              status: "approved"
            })
          )
        );
      }

      if (review.status !== "rejected") {
        actions.append(
          makeButton("Reject", "secondary",
            () => updateReview(review.id, {
              status: "rejected"
            })
          )
        );
      }

      actions.append(
        makeButton("Move to Trash", "danger",
          () => updateReview(review.id, {
            deleted_at: new Date().toISOString()
          })
        )
      );
    }

    card.append(actions);
    list.append(card);
  });
}

/* UPDATE REVIEW */
async function updateReview(id, changes) {
  try {
    const { error } = await db
      .from("book_reviews")
      .update(changes)
      .eq("id", id);

    if (error) throw error;

    await loadReviews();
  } catch (error) {
    alert("Could not update review: " + error.message);
  }
}

/* PERMANENT DELETE */
async function permanentlyDeleteReview(id) {
  if (!confirm("Permanently delete this review? This cannot be undone.")) {
    return;
  }

  try {
    const { error } = await db
      .from("book_reviews")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await loadReviews();
  } catch (error) {
    alert("Could not delete review: " + error.message);
  }
}

/* OPEN REVIEW PAGE */
document.querySelectorAll('nav button[data-page="reviews"]')
  .forEach(button => {
    button.addEventListener("click", loadReviews);
  });

setupReviewManager();
      
