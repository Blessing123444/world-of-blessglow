
/* WORLD OF BLESSGLOW — NOTIFICATION SETTINGS */

let notificationBooks = [];

async function loadNotifications() {
  const area = $("notificationsContent");
  if (!area) return;

  area.replaceChildren();

  const message = document.createElement("p");
  message.textContent = "Loading book notification settings...";
  area.append(message);

  try {
    const { data, error } = await db
      .from("books")
      .select("id,title,slug,publication_status,allow_free_interest,allow_pre_order,deleted_at")
      .is("deleted_at", null)
      .order("display_order", { ascending: true });

    if (error) throw error;

    notificationBooks = data || [];
    renderNotifications(area, message);

  } catch (error) {
    message.textContent =
      "Could not load settings: " + error.message;
  }
}

/* DISPLAY BOOK SETTINGS */
function renderNotifications(area, message) {
  area.replaceChildren();

  message.textContent =
    notificationBooks.length + " books found.";

  area.append(message);

  if (!notificationBooks.length) {
    area.append(document.createTextNode("No books available."));
    return;
  }

  notificationBooks.forEach(book => {
    const card = document.createElement("article");
    card.className = "notification-book-card";

    const title = document.createElement("h3");
    title.textContent = book.title;

    const status = document.createElement("p");
    status.textContent =
      "Publication status: " + (book.publication_status || "Draft");

    const freeLabel = document.createElement("label");
    const free = document.createElement("input");
    free.type = "checkbox";
    free.checked = !!book.allow_free_interest;

    free.addEventListener("change", () =>
      updateNotificationSetting(book.id, "allow_free_interest", free.checked)
    );

    freeLabel.append(free, " Allow Free Interest / Notify Me");

    const preorderLabel = document.createElement("label");
    const preorder = document.createElement("input");
    preorder.type = "checkbox";
    preorder.checked = !!book.allow_pre_order;

    preorder.addEventListener("change", () =>
      updateNotificationSetting(book.id, "allow_pre_order", preorder.checked)
    );

    preorderLabel.append(preorder, " Allow Pre-order");

    card.append(title, status, freeLabel, preorderLabel);
    area.append(card);
  });
}

/* UPDATE SETTINGS */
async function updateNotificationSetting(id, column, value) {
  const allowedColumns = [
    "allow_free_interest",
    "allow_pre_order"
  ];

  if (!allowedColumns.includes(column)) return;

  try {
    const { error } = await db
      .from("books")
      .update({ [column]: value })
      .eq("id", id);

    if (error) throw error;

    await loadNotifications();

  } catch (error) {
    alert("Could not update setting: " + error.message);
    await loadNotifications();
  }
}

/* REFRESH */
function setupNotifications() {
  const area = $("notificationsContent");
  if (!area || $("refreshNotifications")) return;

  const button = makeButton(
    "Refresh Settings",
    "secondary",
    loadNotifications
  );

  button.id = "refreshNotifications";
  area.before(button);
}

/* OPEN NOTIFICATIONS PAGE */
document.querySelectorAll('nav button[data-page="notifications"]')
  .forEach(button => {
    button.addEventListener("click", loadNotifications);
  });

setupNotifications();
      
