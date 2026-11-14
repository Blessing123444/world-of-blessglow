
/* WORLD OF BLESSGLOW — ADMIN AUTH */

let authBusy = false;

function authMessage(text) {
  const area = $("loginMessage");
  if (area) area.textContent = text;
}

function showLogin() {
  $("app")?.classList.add("hidden");
  $("login")?.classList.remove("hidden");
}

function showDashboard() {
  $("login")?.classList.add("hidden");
  $("app")?.classList.remove("hidden");
}

async function verifyAdmin() {
  const { data, error } = await db.auth.getUser();
  if (error) throw error;

  const user = data.user;
  if (!user) throw new Error("No active login session.");

  const meta = user.app_metadata || {};
  const isAdmin =
    meta.role === "admin" ||
    (Array.isArray(meta.roles) && meta.roles.includes("admin"));

  if (!isAdmin) {
    throw new Error(
      "Login successful, but this account has no admin role. Check its Supabase app_metadata."
    );
  }

  return user;
}

async function enterAdmin() {
  if (authBusy) return;

  authBusy = true;
  authMessage("Checking administrator access...");

  try {
    await verifyAdmin();
    showDashboard();
    await loadBooks();
  } catch (error) {
    showLogin();
    authMessage(error.message);
  } finally {
    authBusy = false;
  }
}

/* LOGIN FORM */

$("loginForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  if (authBusy) return;

  const button = $("loginButton");
  authBusy = true;

  if (button) {
    button.disabled = true;
    button.textContent = "Signing In...";
  }

  authMessage("Connecting to Supabase...");

  try {
    const { error } = await db.auth.signInWithPassword({
      email: $("email").value.trim(),
      password: $("password").value
    });

    if (error) throw error;

    await verifyAdmin();

    showDashboard();
    authMessage("");
    await loadBooks();

  } catch (error) {
    showLogin();
    authMessage("Login failed: " + error.message);
  } finally {
    authBusy = false;

    if (button) {
      button.disabled = false;
      button.textContent = "Sign In";
    }
  }
});

/* RESTORE SESSION */

(async () => {
  try {
    const { data, error } = await db.auth.getSession();
    if (error) throw error;

    if (data.session) {
      await enterAdmin();
    } else {
      showLogin();
    }
  } catch (error) {
    showLogin();
    authMessage(error.message);
  }
})();

/* LOGOUT */

$("logout")?.addEventListener("click", async () => {
  try {
    const { error } = await db.auth.signOut();
    if (error) throw error;

    showLogin();
    $("email").value = "";
    $("password").value = "";
    authMessage("You have signed out.");
  } catch (error) {
    alert("Logout failed: " + error.message);
  }
});

