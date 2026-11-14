
/* WORLD OF BLESSGLOW — AUTH */

window.handleAdminLogin = async function(event) {
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
    if (!data.user) throw new Error("Login not confirmed.");

    const meta = data.user.app_metadata || {};

    if (
      meta.role !== "admin" &&
      !(Array.isArray(meta.roles) && meta.roles.includes("admin"))
    ) {
      throw new Error("Administrator role is missing in Supabase.");
    }

    document.getElementById("login").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");

    output.textContent = "";

    try {
      await loadBooks();
    } catch (err) {
      message("Logged in, but books failed to load: " + err.message);
    }

  } catch (err) {
    output.textContent = "Login error: " + err.message;
    console.error(err);
  } finally {
    button.disabled = false;
    button.textContent = "Sign In";
  }
};

document.getElementById("logout")?.addEventListener("click", async () => {
  try {
    const { error } = await db.auth.signOut();
    if (error) throw error;
    location.reload();
  } catch (err) {
    alert(err.message);
  }
});

console.log("BlessGlow auth.js loaded.");
