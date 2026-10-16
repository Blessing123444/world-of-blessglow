(() => {
  "use strict";

  /*
   * WORLD OF BLESSGLOW — READER REVIEW SYSTEM
   * Book-specific questions, interactive star ratings,
   * reading-completion lock, and Supabase moderation.
   */

  const SUPABASE_URL =
    "https://zngagaolaiidgyxoldsh.supabase.co";

  /*
   * KEEP YOUR EXISTING SUPABASE PUBLISHABLE KEY HERE.
   * Never use a service-role or secret key in this file.
   */
  const SUPABASE_KEY = "YOUR_EXISTING_PUBLISHABLE_KEY";

  const BOOKS = {
    "a-love-written-in-silence": {
      name: "A Love Written in Silence",
      intro:
        "Thank you for reading my debut novel, A Love Written in Silence! 🥹💗 I'd love to hear your honest thoughts about the story. Your feedback means a lot to me and helps me grow as an author. 📚✨",

      questions: [
        {
          title: "💕 1. Your Favourite Character",
          question:
            "Who was your favourite character, and what made you love them?",
          type: "textarea"
        },
        {
          title: "📖 2. Your Favourite Moment",
          question:
            "What was your favourite moment or scene in the story, and why did it stand out to you?",
          type: "textarea"
        },
        {
          title: "🥹 3. Your Feelings About the Love Story",
          question:
            "How did the love story make you feel, and were you satisfied with the ending?",
          type: "textarea"
        },
        {
          title: "✨ 4. Describe the Book in Three Words",
          question:
            "If you could describe A Love Written in Silence in three words, what would they be?",
          type: "textarea"
        },
        {
          title: "💌 5. Would You Recommend This Book?",
          question:
            "Would you recommend this novel to another reader? Why or why not?",
          type: "recommendation"
        },
        {
          title: "🌷 6. A Message for the Author",
          question:
            "If you could tell Blessing Effiong one thing about A Love Written in Silence, what would it be?",
          type: "textarea"
        }
      ],

      thankYou:
        "Thank you for being part of the World of BlessGlow! Every review, kind word, and honest suggestion helps me become a better storyteller. Thank you for giving my first novel a chance. 💗📚✨"
    },

    "behind-her-smile": {
      name: "Behind Her Smile: The Girl They Framed",

      intro:
        "Your honest thoughts mean the world to me! Tell me about your favourite characters, the suspense, the betrayal, and the moments that stayed with you.",

      questions: [
        {
          title: "🔎 The Suspense",
          question:
            "Did you suspect Chloe was behind everything, or did the truth surprise you? Tell us why!",
          type: "textarea"
        },
        {
          title: "💔 The Emotional Moments",
          question:
            "Which scene or moment affected you the most, and what made it memorable?",
          type: "textarea"
        },
        {
          title: "👑 Your Favourite Character",
          question:
            "Who was your favourite character, and why? Was there a character whose choices you disagreed with?",
          type: "textarea"
        },
        {
          title: "🌷 The Ending",
          question:
            "Were you satisfied with the ending, or would you have changed anything?",
          type: "textarea"
        },
        {
          title: "✨ Would You Recommend This Book?",
          question:
            "Would you recommend this story to another reader?",
          type: "recommendation"
        },
        {
          title: "💌 Leave a Message for the Author",
          question:
            "If you could tell Blessing Effiong one thing about this book, what would it be?",
          type: "textarea"
        }
      ],

      thankYou:
        "Thank you for reading Behind Her Smile and sharing your thoughts with World of BlessGlow. 💗📚"
    }
  };

  const root = document.getElementById("book-reviews");

  if (!root) {
    console.warn(
      "World of BlessGlow Reviews: #book-reviews was not found."
    );
    return;
  }

  const slug = root.dataset.book;
  const book = BOOKS[slug];

  if (!book) {
    root.textContent =
      "The review section could not be loaded for this book.";
    return;
  }

  const endpoint =
    SUPABASE_URL.replace(/\/+$/, "") +
    "/rest/v1/book_reviews";

  const isConfigured =
    SUPABASE_URL.startsWith("https://") &&
    SUPABASE_KEY.length > 0 &&
    SUPABASE_KEY !== "YOUR_EXISTING_PUBLISHABLE_KEY";

  function getHeaders() {
    return {
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json"
    };
  }

  /*
   * BUILD THE REVIEW INTERFACE
   */

  root.innerHTML = `
    <section class="reviews-heading">
      <p class="reviews-eyebrow">YOUR READING EXPERIENCE</p>
      <h2>🌸 Reader Review &amp; Feedback 💌</h2>
      <h3 class="reviews-book-title"></h3>
      <p class="reviews-description reviews-intro"></p>
      <p class="reviews-description">
        There are no right or wrong answers. Share your honest experience!
      </p>
    </section>

    <div class="reviews-lock" id="reviews-lock">
      <h3>📖 Complete the Story First</h3>
      <p>
        Reach the final section of the book to unlock the review form.
      </p>
      <p id="reviews-lock-status" aria-live="polite">
        Your review form is currently locked.
      </p>
    </div>

    <form class="reviews-form" id="reviews-form" hidden>
      <h3>💖 Share Your Review</h3>
      <p class="reviews-small">
        Your review will be checked before it appears publicly.
      </p>

      <div class="review-field">
        <h4>⭐ 1. Rate This Book</h4>
        <p class="reviews-small">
          How would you rate this story?
        </p>

        <div
          class="interactive-stars"
          id="interactive-stars"
          role="group"
          aria-label="Rate this book from one to five stars"
        >
          ${[1, 2, 3, 4, 5].map(n => `
            <button
              type="button"
              class="rating-star"
              data-rating="${n}"
              aria-label="${n} star${n > 1 ? "s" : ""}"
              aria-pressed="false"
            >☆</button>
          `).join("")}
        </div>

        <p id="rating-caption" class="reviews-small" aria-live="polite">
          Select your rating from one to five stars.
        </p>

        <input
          type="hidden"
          id="review-rating"
          name="rating"
          value=""
        >
      </div>

      <div class="review-field">
        <label for="review-name">
          👤 What name or nickname would you like displayed with your review?
        </label>
        <input
          id="review-name"
          name="display_name"
          type="text"
          minlength="2"
          maxlength="40"
          autocomplete="nickname"
          required
          placeholder="Enter your preferred name"
        >
      </div>

      <div class="review-field">
        <h4>💭 Share Your Overall Thoughts</h4>
        <label for="review-text">
          What did you think of the story overall?
        </label>
        <textarea
          id="review-text"
          name="review_text"
          minlength="10"
          maxlength="2000"
          rows="6"
          required
          placeholder="Tell us what you thought of the story..."
        ></textarea>
      </div>

      <div id="review-questions"></div>

      <button type="submit" id="review-submit">
        ⭐ Submit My Review
      </button>

      <p
        class="reviews-feedback"
        id="reviews-feedback"
        role="status"
        aria-live="polite"
      ></p>

      <p class="reviews-small" id="review-thank-you"></p>
    </form>

    <section class="approved-reviews">
      <h3>💖 What Readers Are Saying</h3>
      <p class="reviews-small">
        Only approved reviews appear here.
      </p>

      <div id="approved-rating-summary" aria-live="polite"></div>

      <div id="approved-reviews-list" aria-live="polite">
        <p class="reviews-small">Loading reader reviews...</p>
      </div>
    </section>
  `;

  root.querySelector(".reviews-book-title").textContent = book.name;
  root.querySelector(".reviews-intro").textContent = book.intro;

  document.getElementById("review-thank-you").textContent =
    book.thankYou;

  /*
   * BUILD BOOK-SPECIFIC QUESTIONS
   */

  const questionsContainer =
    document.getElementById("review-questions");

  book.questions.forEach((item, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "review-field review-question";

    const heading = document.createElement("h4");
    heading.textContent = item.title;

    const label = document.createElement("label");
    const fieldId = "review-answer-" + (index + 1);

    label.htmlFor = fieldId;
    label.textContent = item.question;

    let field;

    if (item.type === "recommendation") {
      field = document.createElement("select");

      [
        ["", "Choose your answer"],
        ["Absolutely", "❤️ Absolutely!"],
        ["Maybe", "😊 Maybe."],
        ["Not sure", "🤔 I'm not sure."],
        ["Probably not", "💔 Probably not."]
      ].forEach(([value, text]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        field.appendChild(option);
      });
    } else {
      field = document.createElement("textarea");
      field.rows = 3;
      field.maxLength = 1000;
      field.placeholder = "Share your answer...";
    }

    field.id = fieldId;
    field.name = fieldId;
    field.required = true;

    wrapper.append(heading, label, field);
    questionsContainer.appendChild(wrapper);
  });

  /*
   * INTERACTIVE STAR RATING
   */

  let selectedRating = 0;

  const starButtons = [
    ...root.querySelectorAll(".rating-star")
  ];

  const ratingInput =
    document.getElementById("review-rating");

  const ratingCaption =
    document.getElementById("rating-caption");

  const ratingLabels = {
    1: "It wasn't for me",
    2: "It could be better",
    3: "It was good",
    4: "Really enjoyed it",
    5: "Absolutely loved it!"
  };

  function updateStars(rating) {
    starButtons.forEach(button => {
      const value = Number(button.dataset.rating);
      const active = value <= rating;

      button.textContent = active ? "★" : "☆";
      button.classList.toggle("is-selected", active);
      button.setAttribute(
        "aria-pressed",
        String(value === selectedRating)
      );
    });
  }

  starButtons.forEach(button => {
    button.addEventListener("click", () => {
      selectedRating = Number(button.dataset.rating);
      ratingInput.value = String(selectedRating);

      updateStars(selectedRating);

      ratingCaption.textContent =
        `${selectedRating}/5 stars — ${ratingLabels[selectedRating]}`;
    });
  });

  /*
   * READING-COMPLETION LOCK
   */

  const completionKey =
    "blessglow-review-completed-" + slug;

  const lock = document.getElementById("reviews-lock");

  const lockStatus =
    document.getElementById("reviews-lock-status");

  const form =
    document.getElementById("reviews-form");

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
        "Your browser could not check saved reading progress. Please try again.";
    }
  }

  window.BlessGlowReviewCompletion = {
    complete() {
      try {
        localStorage.setItem(completionKey, "yes");
      } catch (_) {
        lockStatus.textContent =
          "Your browser could not save reading completion.";
        return;
      }

      unlockReviews();
    }
  };

  checkCompletion();

  if (window.BLESSGLOW_READER_COMPLETE === true) {
    window.BlessGlowReviewCompletion.complete();
  }

  /*
   * LOAD APPROVED REVIEWS
   */

  async function loadApprovedReviews() {
    const list =
      document.getElementById("approved-reviews-list");

    const summary =
      document.getElementById("approved-rating-summary");

    if (!isConfigured) {
      list.textContent =
        "Reader reviews will appear here once the Supabase publishable key is configured.";
      summary.textContent = "";
      return;
    }

    try {
      const params = new URLSearchParams({
        select: "display_name,rating,review_text,created_at",
        book_slug: "eq." + slug,
        status: "eq.approved",
        order: "created_at.desc",
        limit: "1000"
      });

      const response = await fetch(
        endpoint + "?" + params.toString(),
        {
          method: "GET",
          headers: getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error("Could not retrieve approved reviews.");
      }

      const reviews = await response.json();

      list.replaceChildren();
      summary.replaceChildren();

      if (!reviews.length) {
        const empty = document.createElement("p");
        empty.className = "reviews-small";
        empty.textContent =
          "No approved reviews yet. Your review could be the first!";

        list.appendChild(empty);
        return;
      }

      const totalRating = reviews.reduce(
        (sum, review) => sum + Number(review.rating || 0),
        0
      );

      const average = totalRating / reviews.length;

      const averageLine = document.createElement("p");
      averageLine.className = "review-average";
      averageLine.textContent =
        `★ ${average.toFixed(1)}/5 · Based on ${reviews.length} approved review${reviews.length === 1 ? "" : "s"}`;

      summary.appendChild(averageLine);

      reviews.forEach(review => {
        const card = document.createElement("article");
        card.className = "review-card";

        const name = document.createElement("h4");
        name.textContent = review.display_name;

        const rating = document.createElement("p");
        rating.className = "review-stars";

        const stars = Math.max(
          0,
          Math.min(5, Number(review.rating) || 0)
        );

        rating.textContent =
          "★".repeat(stars) +
          "☆".repeat(5 - stars) +
          ` (${stars}/5)`;

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

    } catch (error) {
      console.error(
        "World of BlessGlow: Could not load reviews.",
        error
      );

      list.textContent =
        "Reader reviews are temporarily unavailable. Please try again later.";
    }
  }

  /*
   * SUBMIT REVIEW FOR APPROVAL
   */

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const feedback =
      document.getElementById("reviews-feedback");

    const submitButton =
      document.getElementById("review-submit");

    if (!isConfigured) {
      feedback.textContent =
        "The review system needs its Supabase publishable key.";
      return;
    }

    const displayName =
      document.getElementById("review-name").value.trim();

    const rating = Number(ratingInput.value);

    const reviewText =
      document.getElementById("review-text").value.trim();

    const answers = {};

    book.questions.forEach((item, index) => {
      const field = document.getElementById(
        "review-answer-" + (index + 1)
      );

      answers[item.title] = field.value.trim();
    });

    if (displayName.length < 2 || displayName.length > 40) {
      feedback.textContent =
        "Your display name must be between 2 and 40 characters.";
      return;
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      feedback.textContent =
        "Please select a star rating.";
      return;
    }

    if (reviewText.length < 10 || reviewText.length > 2000) {
      feedback.textContent =
        "Your overall review must be between 10 and 2,000 characters.";
      return;
    }

    const incompleteQuestion = book.questions.some((_, index) => {
      const field = document.getElementById(
        "review-answer-" + (index + 1)
      );

      return !field.value.trim();
    });

    if (incompleteQuestion) {
      feedback.textContent =
        "Please complete all the review questions.";
      return;
    }

    submitButton.disabled = true;
    feedback.textContent = "Submitting your review...";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          ...getHeaders(),
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
        const details = await response.text();

        console.error(
          "Supabase review submission failed:",
          response.status,
          details
        );

        throw new Error("Review submission failed.");
      }

      form.reset();

      selectedRating = 0;
      ratingInput.value = "";

      updateStars(0);

      ratingCaption.textContent =
        "Select your rating from one to five stars.";

      feedback.textContent =
        "Thank you! ❤️ Your review has been submitted for approval. Once approved, it may appear in our reader reviews section.";

    } catch (error) {
      console.error(
        "World of BlessGlow: Review submission failed.",
        error
      );

      feedback.textContent =
        "We couldn't submit your review. Please check your connection and try again later.";

    } finally {
      submitButton.disabled = false;
    }
  });

  loadApprovedReviews();

})();
