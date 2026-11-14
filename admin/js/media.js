
/* WORLD OF BLESSGLOW — MEDIA LIBRARY */

const MEDIA_BUCKET = "book-covers";
let mediaFiles = [];

/* LOAD MEDIA */
async function loadMedia() {
  const list = $("mediaList");
  if (!list) return;

  $("mediaMessage").textContent = "Loading media...";
  list.replaceChildren();

  try {
    const { data, error } = await db.storage
      .from(MEDIA_BUCKET)
      .list("covers", {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" }
      });

    if (error) throw error;

    mediaFiles = (data || []).filter(file => file.name);

    renderMedia();
    $("mediaMessage").textContent =
      mediaFiles.length + " image(s) found.";

  } catch (error) {
    $("mediaMessage").textContent =
      "Could not load media: " + error.message;
  }
}

/* DISPLAY MEDIA */
function renderMedia() {
  const list = $("mediaList");
  if (!list) return;

  list.replaceChildren();

  const filter = ($("mediaFilter")?.value || "").toLowerCase();

  const files = mediaFiles.filter(file =>
    file.name.toLowerCase().includes(filter)
  );

  if (!files.length) {
    list.textContent = "No images found.";
    return;
  }

  files.forEach(file => {
    const path = "covers/" + file.name;
    const { data } = db.storage
      .from(MEDIA_BUCKET)
      .getPublicUrl(path);

    const card = document.createElement("article");
    card.className = "media-card";

    const image = document.createElement("img");
    image.src = data.publicUrl;
    image.alt = file.name;
    image.loading = "lazy";

    const name = document.createElement("p");
    name.textContent = file.name;

    const copy = makeButton("Copy URL", "secondary", () => {
      navigator.clipboard.writeText(data.publicUrl)
        .then(() => {
          $("mediaMessage").textContent = "Image URL copied.";
        })
        .catch(() => {
          $("mediaMessage").textContent =
            "Could not copy URL. Open the image and copy its address.";
        });
    });

    const remove = makeButton("Delete", "danger", async () => {
      if (!confirm("Delete this image permanently?")) return;

      const { error } = await db.storage
        .from(MEDIA_BUCKET)
        .remove([path]);

      if (error) {
        alert("Could not delete image: " + error.message);
        return;
      }

      await loadMedia();
    });

    const actions = document.createElement("div");
    actions.className = "actions";
    actions.append(copy, remove);

    card.append(image, name, actions);
    list.append(card);
  });
}

/* UPLOAD MEDIA */
$("uploadMedia")?.addEventListener("click", async () => {
  const input = $("mediaFile");
  const file = input?.files?.[0];

  if (!file) {
    $("mediaMessage").textContent = "Choose an image first.";
    return;
  }

  if (!file.type.startsWith("image/")) {
    $("mediaMessage").textContent = "Please choose an image file.";
    return;
  }

  if (file.size > 20 * 1024 * 1024) {
    $("mediaMessage").textContent = "Image must be 20 MB or smaller.";
    return;
  }

  const button = $("uploadMedia");
  button.disabled = true;
  button.textContent = "Uploading...";

  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = "covers/" + Date.now() + "-" + safeName;

    const { error } = await db.storage
      .from(MEDIA_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      });

    if (error) throw error;

    input.value = "";
    $("mediaMessage").textContent = "Image uploaded successfully.";
    await loadMedia();

  } catch (error) {
    $("mediaMessage").textContent =
      "Upload failed: " + error.message;
  } finally {
    button.disabled = false;
    button.textContent = "Upload Image";
  }
});

/* FILTER AND REFRESH */
$("mediaFilter")?.addEventListener("input", renderMedia);
$("refreshMedia")?.addEventListener("click", loadMedia);
      
