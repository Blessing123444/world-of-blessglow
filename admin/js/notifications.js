
/* WORLD OF BLESSGLOW — NOTIFICATION SETTINGS */

let notificationBooks = [];

/* LOAD SETTINGS */
async function loadNotifications() {
  const area = $("notificationsContent");
  if (!area) return;

  area.textContent = "Loading book notification settings...";

  try {
    const { data, error } = await db.from("books")
      .select("id,title,slug,publication_status,allow_free_interest,allow_pre_order,deleted_at")
      .is("deleted_at", null)
      .order("display_order", { ascending: true });

    if (error) throw error;

    notificationBooks = data || [];
    renderNotifications(area);

  } catch (error) {
    area.textContent = "Could not load settings: " + error.message;
  }
}

/* DISPLAY SETTINGS */
function renderNotifications(area) {
  area.replaceChildren();

  const message = document.createElement("p");
  message.textContent = notificationBooks.length + " books found.";
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
    status.textContent = "Publication status: " +
      (book.publication_status || "Draft");

    const freeLabel = document.createElement("label");
    const free = document.createElement("input");
    free.type = "checkbox";
    free.checked = !!book.allow_free_interest;

    free.addEventListener("change", () =>
      updateNotificationSetting(book.id, "allow_free_interest", free.checked, free)
    );

    freeLabel.append(free, " Allow Free Interest / Notify Me");

    const preorderLabel = document.createElement("label");
    const preorder = document.createElement("input");
    preorder.type = "checkbox";
    preorder.checked = !!book.allow_pre_order;

    preorder.addEventListener("change", () =>
      updateNotificationSetting(book.id, "allow_pre_order", preorder.checked, preorder)
    );

    preorderLabel.append(preorder, " Allow Pre-order");

    card.append(title, status, freeLabel, preorderLabel);
    area.append(card);
  });
}

/* UPDATE SETTINGS */
async function updateNotificationSetting(id, column, value, checkbox) {
  const allowed = ["allow_free_interest", "allow_pre_order"];
  if (!allowed.includes(column) || checkbox.disabled) return;

  checkbox.disabled = true;

  try {
    const { error } = await db.from("books")
      .update({ [column]: value })
      .eq("id", id);

    if (error) throw error;

    const book = notificationBooks.find(item => item.id === id);
    if (book) book[column] = value;

    const message = $("notificationsMessage");
    if (message) message.textContent = "Setting saved successfully.";

  } catch (error) {
    checkbox.checked = !value;
    alert("Could not update setting: " + error.message);
  } finally {
    checkbox.disabled = false;
  }
}

/* SETUP */
function setupNotifications() {
  const area = $("notificationsContent");
  if (!area || $("refreshNotifications")) return;

  const button = makeButton("Refresh Settings", "secondary", loadNotifications);
  button.id = "refreshNotifications";

  const message = document.createElement("p");
  message.id = "notificationsMessage";

  area.before(button);
  button.after(message);
}

/* PAGE NAVIGATION */
document.querySelectorAll('nav button[data-page="notifications"]')
  .forEach(button => button.addEventListener("click", loadNotifications));

setupNotifications();
