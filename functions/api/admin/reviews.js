const corsHeaders = {
  "Access-Control-Allow-Origin": "https://world-of-blessglow.pages.dev",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

function reply(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!["GET", "PATCH"].includes(request.method)) {
    return reply({ error: "Method not allowed." }, 405);
  }

  const authorization = request.headers.get("Authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!token) {
    return reply({ error: "Please sign in." }, 401);
  }

  if (
    !env.SUPABASE_URL ||
    !env.SUPABASE_PUBLISHABLE_KEY ||
    !env.SUPABASE_SERVICE_ROLE_KEY ||
    !env.ADMIN_USER_ID
  ) {
    return reply({ error: "Server configuration is incomplete." }, 500);
  }

  // Validate the session with Supabase Auth.
  let userResponse;

  try {
    userResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: env.SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    return reply({ error: "Could not verify your session." }, 502);
  }

  if (!userResponse.ok) {
    return reply({ error: "Your session is invalid or expired." }, 401);
  }

  const user = await userResponse.json();

  if (user.id !== env.ADMIN_USER_ID) {
    return reply({ error: "You are not authorized to manage reviews." }, 403);
  }

  const base = `${env.SUPABASE_URL}/rest/v1/book_reviews`;

  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };

  if (request.method === "GET") {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "pending";
    const book = url.searchParams.get("book");

    if (!["pending", "approved", "rejected", "all"].includes(status)) {
      return reply({ error: "Invalid status filter." }, 400);
    }

    const params = new URLSearchParams({
      select: "id,book_slug,display_name,rating,review_text,discussion_answers,status,created_at",
      order: "created_at.desc",
    });

    if (status !== "all") params.set("status", `eq.${status}`);

    if (book) {
      if (!["a-love-written-in-silence", "behind-her-smile"].includes(book)) {
        return reply({ error: "Invalid book filter." }, 400);
      }
      params.set("book_slug", `eq.${book}`);
    }

    try {
      const response = await fetch(`${base}?${params}`, { headers });
      const data = await response.json();

      if (!response.ok) {
        return reply({ error: "Could not load reviews." }, 502);
      }

      return reply({ reviews: data });
    } catch {
      return reply({ error: "Could not load reviews." }, 502);
    }
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return reply({ error: "Invalid request body." }, 400);
  }

  const { id, status } = body || {};

  if (
    typeof id !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(id) ||
    !["approved", "rejected"].includes(status)
  ) {
    return reply({ error: "A valid review ID and status are required." }, 400);
  }

  try {
    const response = await fetch(
      `${base}?id=eq.${encodeURIComponent(id)}&select=id,status`,
      {
        method: "PATCH",
        headers: {
          ...headers,
          Prefer: "return=representation",
        },
        body: JSON.stringify({ status }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return reply({ error: "Could not update the review." }, 502);
    }

    if (!Array.isArray(data) || data.length !== 1) {
      return reply({ error: "Review not found." }, 404);
    }

    return reply({ success: true, review: data[0] });
  } catch {
    return reply({ error: "Could not update the review." }, 502);
  }
}
