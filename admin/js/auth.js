
/* WORLD OF BLESSGLOW — AUTHENTICATION */

let authBusy = false;

const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");

function authMessage(text) {
  const area = document.getElementById("loginMessage");
  if (area) area.textContent = text;
}

function showLogin() {
  $("app").classList.add("hidden");
  $("login").classList.remove("hidden");
}

function showDashboard() {
  $("login").classList.add("hidden");
  $("app").classList.remove("hidden");
}

async function checkAdmin() {
  const { data, error } = await db.auth.getUser();
  if (error) throw error;

  const user = data.user;
  if (!user) throw new Error("No active session.");

  const meta = user.app_metadata || {};

  if (
    meta.role !== "admin" &&
    !(meta.roles || []).includes("admin")
  ) {
    throw new Error("Your account does not have the admin role.");
  }
}

async function openDashboard() {
  showDashboard();

  try {
    await loadBooks();
  } catch (error) {
    message("Dashboard opened, but books failed to load: " + error.message);
  }
}

/* LOGIN */

loginForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (authBusy) return;

  authBusy = true;
  loginButton.disabled = true;
  loginButton.textContent = "Signing In...";
  authMessage("Connecting...");

  try {
    const { error } = await db.auth.signInWithPassword({
      email: $("email").value.trim(),
      password: $("password").value
    });

    if (error) throw error;

    await checkAdmin();
    await openDashboard();
    authMessage("");

  } catch (error) {
    showLogin();
    authMessage(error.message);
  } finally {
    authBusy = false;
    loginButton.disabled = false;
    loginButton.textContent = "Sign In";
  }
});

/* RESTORE EXISTING SESSION */

(async () => {
  try {
    const { data, error } = await db.auth.getSession();
    if (error) throw error;

    if (data.session) {
      await checkAdmin();
      await openDashboard();
    } else {
      showLogin();
    }
  } catch (error) {
    showLogin();
    authMessage(error.message);
  }
})();

/* SIGN OUT */

$("logout").addEventListener("click", async () => {
  try {
    const { error } = await db.auth.signOut();
    if (error) throw error;

    showLogin();
    $("password").value = "";
    authMessage("Signed out successfully.");
  } catch (error) {
    authMessage("Sign out failed: " + error.message);
  }
});
                             
