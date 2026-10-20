(() => {
  "use strict";

  // SUPABASE CONFIGURATION
  const SUPABASE_URL = "https://zngagaolaiidgyxoldsh.supabase.co";
  const SUPABASE_KEY = "sb_publishable_e0wd6fhM_Fr7gsKkKzT2RA_vAReV50F";

  const API = `${SUPABASE_URL}/rest/v1/book_reviews`;

  // BOOKS AND ORIGINAL DISCUSSION QUESTIONS
  const BOOKS = {
    "a-love-written-in-silence": {
      title: "A Love Written in Silence",
      questions: [
        "💗 Your Favourite Character",
        "📖 Your Favourite Moment",
        "🥺 Your Feelings About the Love Story",
        "✨ Describe the Book in Three Words",
        "💌 Would You Recommend This Book?",
        "🌷 A Message for the Author"
      ]
    },

    "behind-her-smile": {
      title: "Behind Her Smile: The Girl They Framed",
      questions: [
        "🖤 Your First Impression",
        "👀 The Most Surprising Character",
        "💔 The Most Emotional Moment",
        "🔐 Trust and Betrayal",
        "💌 Would You Recommend This Book?",
        "🌷 A Message for the Author"
      ]
    }
  };

  function configured() {
    return Boolean(
      SUPABASE_URL.startsWith("https://") &&
      SUPABASE_KEY.startsWith("sb_publishable_")
    );
  }

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
      throw new Error(await response.text());
    }

    return response.status === 204 ? null : response.json();
  }

  function element(tag, text, className) {
    const node = document.createElement(tag);

    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;

    return node;
  }

  // STAR DISPLAY
  function makeStars(value, interactive = false, onSelect) {
    const wrapper = element(
      "div",
      undefined,
      interactive ? "interactive-stars" : "review-stars"
    );

    for (let i = 1; i <= 5; i++) {
      const star = element("button", "★", "rating-star");

      star.type = "button";
      star.style.color = i <= value ? "#d6ad60" : "#888";
      star.setAttribute("aria-label", `${i} out of 5 stars`);

      if (interactive) {
        star.addEventListener("click", () => onSelect(i));
      } else {
        star.disabled = true;
        star.setAttribute("aria-hidden", "true");
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

  // DISPLAY PUBLIC, APPROVED REVIEWS
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

      if (!Array.isArray(reviews) || reviews.length === 0) {
        container.appendChild(
          element(
            "p",
            "No approved reviews yet. Be the first to share your thoughts!"
          )
        );
        return;
      }

      const average = reviews.reduce(
        (sum, review) => sum + Number(review.rating || 0),
        0
      ) / reviews.length;

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
          element(
            "h4",
            review.display_name || "Reader",
            "review-card-name"
          ),
          makeStars(Number(review.rating) || 0),
          element(
            "h5",
            "Reader's overall review",
            "review-section-heading"
          ),
          element(
            "p",
            review.review_text || "No written review provided.",
            "review-card-text"
          )
        );

        // DISCUSSION ANSWERS IN THE ORIGINAL QUESTION ORDER
        let answers = review.discussion_answers;

        if (typeof answers === "string") {
          try {
            answers = JSON.parse(answers);
          } catch {
            answers = {};
          }
        }

        if (answers && typeof answers === "object" && !Array.isArray(answers)) {
          const answerHeading = element(
            "h5",
            "Reader's discussion answers",
            "review-section-heading"
          );

          const answerList = element(
            "div",
            undefined,
            "review-discussion-answers"
          );

          BOOKS[slug].questions.forEach((question, index) => {
            const possibleKeys = [
              question,
              question.replace(/^[^\p{L}\p{N}]+\s*/u, ""),
              question.replace(/^[^\p{L}\p{N}]+\s*/u, "").replace(/^[^ ]+\s*/, ""),
              `question${index + 1}`,
              `q${index + 1}`
            ];

            let answer;

            for (const key of possibleKeys) {
              if (
                Object.prototype.hasOwnProperty.call(answers, key) &&
                String(answers[key] ?? "").trim()
              ) {
                answer = String(answers[key]).trim();
                break;
              }
            }

            // Also support numbered question keys saved by older versions.
            if (!answer) {
              const keys = Object.keys(answers);
              const matchingKey = keys.find(key =>
                new RegExp(`^(question\\s*)?${index + 1}[.)\\s:-]`, "i").test(key)
              );

              if (matchingKey && String(answers[matchingKey] ?? "").trim()) {
                answer = String(answers[matchingKey]).trim();
              }
            }

            if (!answer) return;

            const item = element(
              "div",
              undefined,
              "review-answer-item"
            );

            item.append(
              element(
                "strong",
                `${question}`,
                "review-answer-question"
              ),
              element(
                "p",
                answer,
                "review-answer-text"
              )
            );

            answerList.appendChild(item);
          });

          // Preserve any older answers that do not match current question keys.
          Object.entries(answers).forEach(([key, value]) => {
            if (!String(value ?? "").trim()) return;

            const alreadyDisplayed = Array.from(
              answerList.querySelectorAll(".review-answer-question")
            ).some(node => node.textContent === key);

            const knownQuestion = BOOKS[slug].questions.some(question =>
              key === question ||
              key === question.replace(/^[^\p{L}\p{N}]+\s*/u, "")
            );

            if (alreadyDisplayed || knownQuestion) return;

            const item = element(
              "div",
              undefined,
              "review-answer-item"
            );

            item.append(
              element("strong", key, "review-answer-question"),
              element("p", String(value), "review-answer-text")
            );

            answerList.appendChild(item);
          });

          if (answerList.childElementCount) {
            card.append(answerHeading, answerList);
          }
        }

        const date = formatDate(review.created_at);

        if (date) {
          card.appendChild(
            element("small", date, "review-card-date")
          );
        }

        container.appendChild(card);
      });
    } catch (error) {
      console.error("Could not load approved reviews:", error);

      container.replaceChildren(
        element(
          "p",
          "Reviews could not be loaded. Please refresh and try again.",
          "review-loading"
        )
      );
    }
  }

  // CREATE REVIEW SUBMISSION FORM
  function createReviewForm(slug, host) {
    const book = BOOKS[slug];

    if (!book) return;

    const form = element("form", undefined, "book-review-form");
    const status = element("p", "", "review-form-status");

    let rating = 0;

    form.appendChild(element("h3", `Review ${book.title}`));

    const nameLabel = element("label", "Your display name");
    const name = element("input");

    name.name = "display_name";
    name.maxLength = 60;
    name.required = true;
    name.autocomplete = "nickname";
    nameLabel.htmlFor = "review-name-" + slug;
    name.id = nameLabel.htmlFor;

    form.append(nameLabel, name);

    form.appendChild(element("label", "Your rating"));

    const starPicker = makeStars(0, true, selected => {
      rating = selected;

      starPicker.querySelectorAll("button").forEach((star, index) => {
        star.style.color = index < rating ? "#d6ad60" : "#888";
        star.setAttribute(
          "aria-pressed",
          String(index + 1 === rating)
        );
      });
    });

    form.appendChild(starPicker);

    const reviewLabel = element("label", "Your overall review");
    const review = element("textarea");

    review.name = "review_text";
    review.rows = 4;
    review.maxLength = 3000;
    review.required = true;
    review.placeholder = "Share your honest thoughts about the book...";
    reviewLabel.htmlFor = "review-text-" + slug;
    review.id = reviewLabel.htmlFor;

    form.append(reviewLabel, review);

    const answers = {};

    form.appendChild(
      element("h4", "💛 Discussion Questions")
    );

    book.questions.forEach((question, index) => {
      const label = element("label", question);
      const answer = element("textarea");

      answer.rows = 2;
      answer.maxLength = 1500;
      answer.required = true;
      answer.placeholder = "Write your answer...";

      label.htmlFor = `review-answer-${slug}-${index + 1}`;
      answer.id = label.htmlFor;

      answers[question] = answer;

      form.append(label, answer);
    });

    const submit = element("button", "Submit Review");
    submit.type = "submit";
    submit.className = "review-submit";

    form.append(submit, status);

    form.addEventListener("submit", async event => {
      event.preventDefault();

      if (!configured()) {
        status.textContent = "The review system is not configured correctly.";
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
          star.removeAttribute("aria-pressed");
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

  // INITIALISE REVIEW SECTIONS
  function initialise() {
    if (!configured()) {
      console.error("Check the Supabase URL and publishable key in reviews.js.");
    }

    document.querySelectorAll("[data-book-reviews], #book-reviews[data-book]").forEach(host => {
      const slug = host.dataset.bookReviews || host.dataset.book;

      if (!BOOKS[slug]) {
        console.warn("Unknown book review section:", slug);
        return;
      }

      // Prevent duplicate rendering if initialisation runs more than once.
      if (host.dataset.reviewsInitialised === "true") return;
      host.dataset.reviewsInitialised = "true";

      const heading = element("h3", "Reader Reviews");
      const publicReviews = element("div", undefined, "approved-reviews");

      host.append(heading, publicReviews);

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
