
/* WORLD OF BLESSGLOW — LOGIN */

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function(event) {
  event.preventDefault();

  const button = document.getElementById("loginButton");
  const output = document.getElementById("loginMessage");

  if (button.disabled) return;

  button.disabled = true;
  button.textContent = "Signing In...";
  output.textContent = "Connecting to Supabase...";

  try {
    const { data, error } = await db.auth.signInWithPassword({
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value
    });

    if (error) throw error;
    if (!data.user) throw new Error("Login was not confirmed.");

    const meta = data.user.app_metadata || {};

    if (
      meta.role !== "admin" &&
      !(meta.roles || []).includes("admin")
    ) {
      throw new Error("Administrator role is missing.");
    }

    document.getElementById("login").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");

    output.textContent = "";
    
    try {
      await loadBooks();
    } catch (loadError) {
      message("Logged in, but books could not load: " + loadError.message);
    }

  } catch (error) {
    output.textContent = "Login error: " + error.message;
  } finally {
    button.disabled = false;
    button.textContent = "Sign In";
  }
});

document.getElementById("logout").addEventListener("click", async () => {
  const { error } = await db.auth.signOut();

  if (error) {
    alert(error.message);
    return;
  }

  location.reload();
});

