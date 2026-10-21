const corsHeaders = {
  "Access-Control-Allow-Origin": "https://world-of-blessglow.pages.dev",
  "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

function reply(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}

const VALID_BOOKS = [
  "a-love-written-in-silence",
  "behind-her-smile",
];

const VALID_STATUSES = [
  "pending",
  "approved",
  "rejected",
];

function validId(id) {
  return (
    typeof id === "string" &&
    /^[0-9a-f-]{36}$/i.test(id)
  );
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (!["GET", "PATCH", "DELETE"].includes(request.method)) {
    return reply({ error: "Method not allowed." }, 405);
  }

  // -----------------------------------------
  // CHECK AUTHENTICATION
  // -----------------------------------------

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
    return reply({
      error: "Server configuration is incomplete.",
    }, 500);
  }

  let userResponse;

  try {
    userResponse = await fetch(
      `${env.SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          apikey: env.SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch {
    return reply({
      error: "Could not verify your session.",
    }, 502);
  }

  if (!userResponse.ok) {
    return reply({
      error: "Your session is invalid or expired.",
    }, 401);
  }

  let user;

  try {
    user = await userResponse.json();
  } catch {
    return reply({
      error: "Could not verify your account.",
    }, 502);
  }

  if (user.id !== env.ADMIN_USER_ID) {
    return reply({
      error: "You are not authorized to manage reviews.",
    }, 403);
  }

  // -----------------------------------------
  // DATABASE CONFIGURATION
  // -----------------------------------------

  const base =
    `${env.SUPABASE_URL}/rest/v1/book_reviews`;

  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };

  // -----------------------------------------
  // GET: LOAD REVIEWS
  // -----------------------------------------

  if (request.method === "GET") {
    const url = new URL(request.url);

    const status = url.searchParams.get("status") || "all";
    const book = url.searchParams.get("book");
    const trash = url.searchParams.get("trash") || "false";

    if (
      ![...VALID_STATUSES, "all"].includes(status)
    ) {
      return reply({
        error: "Invalid status filter.",
      }, 400);
    }

    if (!["true", "false"].includes(trash)) {
      return reply({
        error: "Invalid trash filter.",
      }, 400);
    }

    if (book && !VALID_BOOKS.includes(book)) {
      return reply({
        error: "Invalid book filter.",
      }, 400);
    }

    const params = new URLSearchParams({
      select:
        "id,book_slug,display_name,rating,review_text,discussion_answers,status,created_at,deleted_at",
      order: "created_at.desc",
      limit: "500",
    });

    if (status !== "all") {
      params.set("status", `eq.${status}`);
    }

    if (book) {
      params.set("book_slug", `eq.${book}`);
    }

    // Trash view shows only deleted reviews.
    // Normal view excludes deleted reviews.
    params.set(
      "deleted_at",
      trash === "true" ? "not.is.null" : "is.null"
    );

    try {
      const response = await fetch(
        `${base}?${params.toString()}`,
        { headers }
      );

      const data = await response.json();

      if (!response.ok) {
        return reply({
          error: "Could not load reviews.",
        }, 502);
      }

      return reply({
        success: true,
        reviews: data,
      });
    } catch {
      return reply({
        error: "Could not load reviews.",
      }, 502);
    }
  }

  // -----------------------------------------
  // READ AND VALIDATE ACTION BODY
  // -----------------------------------------

  let body;

  try {
    body = await request.json();
  } catch {
    return reply({
      error: "Invalid request body.",
    }, 400);
  }

  const { id, action, status } = body || {};

  if (!validId(id)) {
    return reply({
      error: "A valid review ID is required.",
    }, 400);
  }

  // -----------------------------------------
  // PATCH: UPDATE REVIEW OR TRASH STATE
  // -----------------------------------------

  if (request.method === "PATCH") {
    let update = {};

    if (action === "trash") {
      update.deleted_at = new Date().toISOString();
    } else if (action === "restore") {
      update.deleted_at = null;
    } else if (
      action === "status" &&
      ["approved", "rejected"].includes(status)
    ) {
      update.status = status;
    } else {
      return reply({
        error: "Invalid review action.",
      }, 400);
    }

    try {
      const response = await fetch(
        `${base}?id=eq.${encodeURIComponent(id)}&select=id,status,deleted_at`,
        {
          method: "PATCH",
          headers: {
            ...headers,
            Prefer: "return=representation",
          },
          body: JSON.stringify(update),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return reply({
          error: "Could not update the review.",
        }, 502);
      }

      if (!Array.isArray(data) || data.length !== 1) {
        return reply({
          error: "Review not found.",
        }, 404);
      }

      return reply({
        success: true,
        review: data[0],
      });
    } catch {
      return reply({
        error: "Could not update the review.",
      }, 502);
    }
  }

  // -----------------------------------------
  // DELETE: PERMANENTLY DELETE A REVIEW
  // -----------------------------------------

  if (request.method === "DELETE") {
    const url = new URL(request.url);

    // Require an explicit permanent-delete action.
    if (body.action !== "permanent-delete") {
      return reply({
        error: "A permanent-delete action is required.",
      }, 400);
    }

    try {
      const response = await fetch(
        `${base}?id=eq.${encodeURIComponent(id)}&deleted_at=not.is.null&select=id`,
        {
          method: "DELETE",
          headers: {
            ...headers,
            Prefer: "return=representation",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return reply({
          error: "Could not permanently delete the review.",
        }, 502);
      }

      if (!Array.isArray(data) || data.length !== 1) {
        return reply({
          error: "Review not found in Trash.",
        }, 404);
      }

      return reply({
        success: true,
        message: "Review permanently deleted.",
        id: data[0].id,
      });
    } catch {
      return reply({
        error: "Could not permanently delete the review.",
      }, 502);
    }
  }
    }
