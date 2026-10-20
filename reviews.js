(() => {
  "use strict";

  // SUPABASE CONFIGURATION
  const SUPABASE_URL = "https://zngagaolaiidgyxoldsh.supabase.co";
  const SUPABASE_KEY = "sb_publishable_e0wd6fhM_Fr7gsKkKzT2RA_vAReV50F";

  const API = `${SUPABASE_URL}/rest/v1/book_reviews`;

  // BOOKS AND DISCUSSION QUESTIONS
  const BOOKS = {
    "a-love-written-in-silence": {
      title: "A Love Written in Silence",
      questions: [
        "What did you enjoy most about the story?",
        "Which character connected with you the most, and why?",
        "What was your favourite moment in the book?",
        "How did the story make you feel?",
        "Would you recommend this book to others? Why?"
      ]
    },

    "behind-her-smile": {
      title: "Behind Her Smile: The Girl They Framed",
      questions: [
        "What was your first impression of the story?",
        "Which character surprised you the most, and why?",
        "What moment affected you the most?",
        "What did the story teach you about trust and betrayal?",
        "Would you recommend this book to others? Why?"
      ]
    }
  };

  const configured = () =>
    SUPABASE_KEY &&
    !SUPABASE_KEY.includes("PASTE_YOUR") &&
    SUPABASE_URL.startsWith("https://");

  async function request(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        ...options.headers
      }
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Request failed: ${response.status}`);
    }

    return response.status === 204 ? null : response.json();
  }

  function element(tag, text, className) {
    const node = document.createElement(tag);

    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;

    return node;
  }

  function makeStars(value, interactive = false, onSelect) {
    const wrapper = element("div", undefined, "review-stars");

    for (let i = 1; i <= 5; i++) {
      const star = element("button", "★", "review-star");

      star.type = "button";
      star.style.color = i <= value ? "#d4af37" : "#888";
      star.setAttribute("aria-label", `${i} star${i === 1 ? "" : "s"}`);

      if (!interactive) {
        star.disabled = true;
      } else {
        star.addEventListener("click", () => onSelect(i));
      }

      wrapper.appendChild(star);
    }

    return wrapper;
  }

  function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleDateString();
  }

  // DISPLAY APPROVED REVIEWS
  async function loadApprovedReviews(slug, container) {
    container.replaceChildren(
      element("p", "Loading reviews...", "review-loading")
    );

    try {
      const query = new URLSearchParams({
        select: "display_name,rating,review_text,discussion_answers,created_at",
        book_slug: `eq.${slug}`,
        status: "eq.approved",
        order: "created_at.desc"
      });

      const reviews = await request(`${API}?${query}`);

      container.replaceChildren();

      if (!reviews.length) {
        container.appendChild(
          element("p", "No approved reviews yet. Be the first to share your thoughts!")
        );
        return;
      }

      const average =
        reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
        reviews.length;

      container.appendChild(
        element(
          "p",
          `${average.toFixed(1)} out of 5 ⭐ · ${reviews.length} review${reviews.length === 1 ? "" : "s"}`,
          "review-summary"
        )
      );

      reviews.forEach(review => {
        const card = element("article", undefined, "review-card");

        card.append(
          element("h4", review.display_name || "Reader"),
          makeStars(Number(review.rating) || 0),
          element("p", review.review_text || "")
        );

        const answers = review.discussion_answers;

        if (answers && typeof answers === "object") {
          const heading = element("h5", "Reader's discussion answers");
          const list = element("div", undefined, "review-answers");

          Object.entries(answers).forEach(([question, answer]) => {
            if (answer) {
              const item = element("div", undefined, "review-answer");
              item.append(
                element("strong", question),
                element("p", String(answer))
              );
              list.appendChild(item);
            }
          });

          if (list.childElementCount) {
            card.append(heading, list);
          }
        }

        const date = formatDate(review.created_at);

        if (date) {
          card.appendChild(
            element("small", date, "review-date")
          );
        }

        container.appendChild(card);
      });
    } catch (error) {
      console.error("Could not load reviews:", error);

      container.replaceChildren(
        element(
          "p",
          "Reviews could not be loaded. Please refresh and try again."
        )
      );
    }
  }

  // CREATE A REVIEW FORM
  function createReviewForm(slug, host) {
    const book = BOOKS[slug];

    if (!book) return;

    const form = element("form", undefined, "book-review-form");
    const status = element("p", "", "review-form-status");
    let rating = 0;

    form.append(
      element("h3", `Review ${book.title}`),
      element("label", "Your display name"),
    );

    const name = element("input");
    name.name = "display_name";
    name.maxLength = 60;
    name.required = true;
    name.autocomplete = "nickname";
    form.appendChild(name);

    form.appendChild(element("label", "Your rating"));

    const starPicker = makeStars(0, true, selected => {
      rating = selected;

      starPicker.querySelectorAll("button").forEach((star, index) => {
        star.style.color = index < rating ? "#d4af37" : "#888";
      });
    });

    form.appendChild(starPicker);

    form.appendChild(element("label", "Your overall review"));

    const review = element("textarea");
    review.name = "review_text";
    review.rows = 4;
    review.maxLength = 3000;
    review.required = true;
    review.placeholder = "Share your honest thoughts about the book...";
    form.appendChild(review);

    const answers = {};

    form.appendChild(
      element("h4", "Discussion questions")
    );

    book.questions.forEach((question, index) => {
      const label = element("label", `${index + 1}. ${question}`);
      const answer = element("textarea");

      answer.rows = 2;
      answer.maxLength = 1500;
      answer.required = true;
      answer.placeholder = "Write your answer...";

      answers[question] = answer;
      form.append(label, answer);
    });

    const submit = element("button", "Submit review");
    submit.type = "submit";
    submit.className = "review-submit";

    form.append(submit, status);

    form.addEventListener("submit", async event => {
      event.preventDefault();

      if (!configured()) {
        status.textContent = "The review system needs to be configured.";
        return;
      }

      if (rating < 1 || rating > 5) {
        status.textContent = "Please select a star rating.";
        return;
      }

      submit.disabled = true;
      status.textContent = "Submitting your review...";

      const discussionAnswers = {};

      Object.entries(answers).forEach(([question, input]) => {
        discussionAnswers[question] = input.value.trim();
      });

      const payload = {
        book_slug: slug,
        display_name: name.value.trim(),
        rating,
        review_text: review.value.trim(),
        discussion_answers: discussionAnswers,
        status: "pending"
      };

      try {
        await request(API, {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify(payload)
        });

        form.reset();
        rating = 0;

        starPicker.querySelectorAll("button").forEach(star => {
          star.style.color = "#888";
        });

        status.textContent =
          "Thank you! Your review has been submitted for approval.";
      } catch (error) {
        console.error("Review submission failed:", error);

        status.textContent =
          "Your review could not be submitted. Please try again.";
      } finally {
        submit.disabled = false;
      }
    });

    host.appendChild(form);
  }

  // INITIALISE EACH BOOK'S REVIEW SECTION
  function initialise() {
    if (!configured()) {
      console.error("Add your existing Supabase publishable key to reviews.js.");
    }

    document.querySelectorAll("[data-book-reviews]").forEach(host => {
      const slug = host.dataset.bookReviews;

      if (!BOOKS[slug]) {
        console.warn("Unknown book review section:", slug);
        return;
      }

      const publicReviews = element("div", undefined, "approved-reviews");
      host.append(
        element("h3", "Reader Reviews"),
        publicReviews
      );

      loadApprovedReviews(slug, publicReviews);
      createReviewForm(slug, host);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise);
  } else {
    initialise();
  }
})();
