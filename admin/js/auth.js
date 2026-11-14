
/* WORLD OF BLESSGLOW — ADMIN AUTHENTICATION */

async function verifyAdmin() {
  const { data, error } = await db.auth.getUser();
  if (error) throw error;

  const user = data.user;
  if (!user) throw Error("No active login session.");

  const meta = user.app_metadata || {};

  if (
    meta.role !== "admin" &&
    !(Array.isArray(meta.roles) && meta.roles.includes("admin"))
  ) {
    throw Error("Administrator access was not confirmed. Check your Supabase admin role.");
  }
}

async function enterAdmin() {
  if (loading) return;
  loading = true;

  try {
    $("loginMessage").textContent = "Verifying administrator access...";
    await verifyAdmin();

    $("login").classList.add("hidden");
    $("app").classList.remove("hidden");

    await loadBooks();
  } catch (error) {
    $("loginMessage").textContent = error.message;
  } finally {
    loading = false;
  }
}

/* LOGIN */

$("loginForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  if (loading) return;

  loading = true;

  const button = $("loginButton");
  button.disabled = true;
  button.textContent = "Signing In...";
  $("loginMessage").textContent = "Connecting...";

  try {
    const { error } = await db.auth.signInWithPassword({
      email: $("email").value.trim(),
      password: $("password").value
    });

    if (error) throw error;

    loading = false;
    await enterAdmin();

  } catch (error) {
    $("loginMessage").textContent = "Login failed: " + error.message;
  } finally {
    loading = false;
    button.disabled = false;
    button.textContent = "Sign In";
  }
});

/* RESTORE SESSION */

(async () => {
  try {
    const { data, error } = await db.auth.getSession();
    if (error) throw error;

    if (data.session) await enterAdmin();
  } catch (error) {
    $("loginMessage").textContent = error.message;
  }
})();

/* LOGOUT */

$("logout")?.addEventListener("click", async () => {
  try {
    const { error } = await db.auth.signOut();
    if (error) throw error;

    location.reload();
  } catch (error) {
    alert("Could not sign out: " + error.message);
  }
});

