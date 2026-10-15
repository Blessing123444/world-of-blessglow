(() => {
  "use strict";

  /*
   * WORLD OF BLESSGLOW REVIEW SYSTEM
   *
   * Replace the two configuration placeholders below.
   * Use your Supabase PROJECT URL and PUBLISHABLE KEY.
   * Never put a secret API key in this file.
   */

  const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
  const SUPABASE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

  const BOOKS = {
    "a-love-written-in-silence": {
      name: "A Love Written in Silence",
      questions: [
        "Which character did you connect with most, and why?",
        "What moment from the story stayed with you?",
        "How would you describe your experience reading this novel?"
      ]
    },

    "behind-her-smile": {
      name: "Behind Her Smile: The Girl They Framed",
      questions: [
        "What did you think of the characters and their decisions?",
        "Which moment surprised you the most?",
        "What would you tell someone considering this novel?"
      ]
    }
  };

  const root = document.getElementById("book-reviews");

  if (!root) return;

  const slug = root.dataset.book;
  const book = BOOKS[slug];

  if (!book) {
    root.textContent = "The review section could not be loaded.";
    return;
  }

  const endpoint = SUPABASE_URL.replace(/\/+$/, "") +
    "/rest/v1/book_reviews";

  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: "Bearer " + SUPABASE_KEY,
    "Content-Type": "application/json"
  };

  root.innerHTML = `
    <section class="reviews-heading">
      <p class="reviews-eyebrow">YOUR READING EXPERIENCE</p>
      <h2>Reader Reviews</h2>
      <p class="reviews-description">
        Finished the story? Share your thoughts with World of BlessGlow.
      </p>
    </section>

    <div class="reviews-lock" id="reviews-lock">
      <h3>Complete the story first</h3>
      <p>
        Reach the final section of the book to unlock the review form.
        Your thoughts can help other readers discover this story.
      </p>
      <p id="reviews-lock-status" aria-live="polite">
        Your review form is currently locked.
      </p>
    </div>

    <form class="reviews-form" id="reviews-form" hidden>
      <h3>Share Your Thoughts</h3>

      <p class="reviews-small">
        Your review will be checked before it appears publicly.
        You do not need to create an account.
      </p>

      <label for="review-name">Display name</label>
      <input
        id="review-name"
        name="display_name"
        type="text"
        minlength="2"
        maxlength="40"
        autocomplete="nickname"
        required
        placeholder="Name readers will see"
      >

      <label for="review-rating">Your rating</label>
      <select id="review-rating" name="rating" required>
        <option value="">Choose a rating</option>
        <option value="5">5 stars — Loved it</option>
        <option value="4">4 stars — Really enjoyed it</option>
        <option value="3">3 stars — It was good</option>
        <option value="2">2 stars — Could be better</option>
        <option value="1">1 star — Not for me</option>
      </select>

      <div id="review-questions"></div>

      <label for="review-text">Your overall review</label>
      <textarea
        id="review-text"
        name="review_text"
        minlength="10"
        maxlength="2000"
        rows="6"
        required
        placeholder="Tell us what you thought of the story..."
      ></textarea>

      <button type="submit" id="review-submit">
        Submit Review
      </button>

      <p
        class="reviews-feedback"
        id="reviews-feedback"
        role="status"
        aria-live="polite"
      ></p>
    </form>

    <section class="approved-reviews">
      <h3>What Readers Are Saying</h3>
      <p class="reviews-small">
        Only approved reviews appear here.
      </p>
      <div id="approved-reviews-list" aria-live="polite">
        <p class="reviews-small">Loading reader reviews...</p>
      </div>
    </section>
  `;

  /*
   * Add this book's discussion questions.
   */

  const questionsContainer = document.getElementById(
    "review-questions"
  );

  book.questions.forEach((question, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "review-question";

    const label = document.createElement("label");
    const textarea = document.createElement("textarea");

    const fieldId = "review-answer-" + (index + 1);

    label.htmlFor = fieldId;
    label.textContent = question;

    textarea.id = fieldId;
    textarea.rows = 3;
    textarea.maxLength = 1000;
    textarea.required = true;
    textarea.placeholder = "Share your answer...";

    wrapper.append(label, textarea);
    questionsContainer.appendChild(wrapper);
  });

  /*
   * Completion is tracked separately for each book.
   *
   * This is a browser-side restriction, not secure proof
   * that a visitor has read the entire book.
   */

  const completionKey = "blessglow-review-completed-" + slug;

  const lock = document.getElementById("reviews-lock");
  const lockStatus = document.getElementById("reviews-lock-status");
  const form = document.getElementById("reviews-form");

  function unlockReviews() {
    lock.hidden = true;
    form.hidden = false;
  }

  function checkCompletion() {
    try {
      if (localStorage.getItem(completionKey) === "yes") {
        unlockReviews();
      }
    } catch (_) {
      lockStatus.textContent =
        "Browser storage is unavailable. Reviews may remain locked.";
    }
  }

  /*
   * The reader page calls this when its final section is reached.
   */

  window.BlessGlowReviewCompletion = {
    complete() {
      try {
        localStorage.setItem(completionKey, "yes");
      } catch (_) {
        // Do not claim completion was saved.
        lockStatus.textContent =
          "Your browser could not save completion. " +
          "Enable browser storage and try again.";
        return;
      }

      unlockReviews();
    }
  };

  checkCompletion();

  /*
   * Load only approved reviews for this book.
   */

  async function loadApprovedReviews() {
    const list = document.getElementById("approved-reviews-list");

    if (
      SUPABASE_URL.startsWith("YOUR_") ||
      SUPABASE_KEY.startsWith("YOUR_")
    ) {
      list.textContent =
        "Reviews will appear here after the Supabase connection is configured.";
      return;
    }

    try {
      const params = new URLSearchParams({
        select: "display_name,rating,review_text,created_at",
        book_slug: "eq." + slug,
        status: "eq.approved",
        order: "created_at.desc",
        limit: "30"
      });

      const response = await fetch(endpoint + "?" + params, {
        method: "GET",
        headers
      });

      if (!response.ok) {
        throw new Error("Could not retrieve approved reviews.");
      }

      const reviews = await response.json();

      list.replaceChildren();

      if (!reviews.length) {
        const empty = document.createElement("p");
        empty.className = "reviews-small";
        empty.textContent =
          "No approved reviews yet. Your review could be the first!";
        list.appendChild(empty);
        return;
      }

      reviews.forEach(review => {
        const card = document.createElement("article");
        card.className = "review-card";

        const name = document.createElement("h4");
        name.textContent = review.display_name;

        const rating = document.createElement("p");
        rating.className = "review-stars";
        rating.textContent =
          "★".repeat(review.rating) +
          "☆".repeat(5 - review.rating) +
          " (" + review.rating + "/5)";

        const text = document.createElement("p");
        text.className = "review-card-text";
        text.textContent = review.review_text;

        const date = document.createElement("p");
        date.className = "reviews-small";

        const parsedDate = new Date(review.created_at);

        date.textContent = Number.isNaN(parsedDate.getTime())
          ? ""
          : parsedDate.toLocaleDateString();

        card.append(name, rating, text, date);
        list.appendChild(card);
      });
    } catch (_) {
      list.textContent =
        "Reader reviews are temporarily unavailable. Please try again later.";
    }
  }

  /*
   * Submit a review as pending moderation.
   */

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const feedback = document.getElementById("reviews-feedback");
    const submitButton = document.getElementById("review-submit");

    if (
      SUPABASE_URL.startsWith("YOUR_") ||
      SUPABASE_KEY.startsWith("YOUR_")
    ) {
      feedback.textContent =
        "The review system has not been connected yet.";
      return;
    }

    const displayName = document
      .getElementById("review-name")
      .value.trim();

    const rating = Number(
      document.getElementById("review-rating").value
    );

    const reviewText = document
      .getElementById("review-text")
      .value.trim();

    const answers = {};

    book.questions.forEach((question, index) => {
      answers[question] = document
        .getElementById("review-answer-" + (index + 1))
        .value.trim();
    });

    if (displayName.length < 2 || displayName.length > 40) {
      feedback.textContent =
        "Your display name must be between 2 and 40 characters.";
      return;
    }

    if (rating < 1 || rating > 5) {
      feedback.textContent = "Please select a rating.";
      return;
    }

    if (reviewText.length < 10 || reviewText.length > 2000) {
      feedback.textContent =
        "Your review must be between 10 and 2,000 characters.";
      return;
    }

    if (Object.values(answers).some(answer => !answer)) {
      feedback.textContent =
        "Please answer all the discussion questions.";
      return;
    }

    submitButton.disabled = true;
    feedback.textContent = "Submitting your review...";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          book_slug: slug,
          display_name: displayName,
          rating,
          review_text: reviewText,
          discussion_answers: answers,
          status: "pending"
        })
      });

      if (!response.ok) {
        throw new Error("Review submission failed.");
      }

      form.reset();

      feedback.textContent =
        "Thank you! Your review has been submitted for approval.";

    } catch (_) {
      feedback.textContent =
        "We couldn't submit your review. Please try again later.";
    } finally {
      submitButton.disabled = false;
    }
  });

  loadApprovedReviews();
})();
