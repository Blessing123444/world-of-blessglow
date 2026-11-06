
(() => {
  "use strict";

  // WORLD OF BLESSGLOW — READER REVIEWS

  const SUPABASE_URL = "https://zngagaolaiidgyxoldsh.supabase.co";
  const SUPABASE_KEY = "sb_publishable_e0wd6fhM_Fr7gsKkKzT2RA_vAReV50F";
  const API = `${SUPABASE_URL}/rest/v1/book_reviews`;

  const BOOKS = {
    "a-love-written-in-silence": {
      title: "A Love Written in Silence",
      introduction: "Thank you for reading my debut novel, A Love Written in Silence! 🥹💗 I'd love to hear your honest thoughts. Your feedback means a lot to me. 📚✨",
      questions: [
        ["💕 Who was your favourite character, and what made you love them?", "Share your thoughts below."],
        ["📖 What was your favourite moment or scene in the story, and why did it stand out to you?", "Tell me about the moment that stayed with you."],
        ["🥹 How did the love story make you feel, and were you satisfied with the ending?", "I'd love to hear your honest thoughts."],
        ["💌 If you could describe A Love Written in Silence in three words, what would they be?", "Your honest opinion is always welcome!"],
        ["💗 Would you recommend this book to another reader? Why or why not?", "Tell me why!"],
        ["🌷 What would you like to tell Blessing Effiong, the author?", "Your words and encouragement mean so much to me. 💗"]
      ]
    },

    "behind-her-smile": {
      title: "Behind Her Smile: The Girl They Framed",
      introduction: "Thank you for reading Behind Her Smile: The Girl They Framed! 🖤📚 I'd love to hear your honest thoughts about the story, its characters, and its secrets. ✨",
      questions: [
        ["🖤 What was your first impression of the story?", "Tell me what caught your attention."],
        ["👀 Which character surprised you the most, and why?", "I'd love to know what you thought!"],
        ["💔 What was the most emotional or unforgettable moment for you?", "Share the moment that stayed with you."],
        ["🔐 What did the story teach you about trust and betrayal?", "Tell me your honest thoughts."],
        ["💌 Would you recommend this book to another reader? Why or why not?", "Your recommendation matters!"],
        ["🌷 What would you like to tell Blessing Effiong, the author?", "Thank you for supporting my storytelling journey. 💗"]
      ]
    }
  };

  const normalise = value => String(value || "")
    .normalize("NFKC")
    .replace(/^[\s\p{Extended_Pictographic}\uFE0F\u200D]+/gu, "")
    .replace(/^\d+[\s.)-]*/, "")
    .replace(/[?!.,:;'"“”‘’]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  function request(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        ...options.headers
      }
    }).then(async response => {
      if (!response.ok) {
        throw new Error(`Supabase ${response.status}: ${await response.text()}`);
      }
      return response.status === 204 ? null : response.json();
    });
  }

  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function makeStars(value, interactive = false, onSelect) {
    const wrapper = el(
      "div",
      undefined,
      interactive ? "interactive-stars" : "review-stars"
    );

    for (let i = 1; i <= 5; i++) {
      const star = el("button", "★", "rating-star");
      star.type = "button";
      star.style.cssText =
        "background:transparent;border:0;box-shadow:none;padding:0;margin:0;width:auto;min-width:0;min-height:0;line-height:1;cursor:" +
        (interactive ? "pointer" : "default") +
        ";color:" + (i <= value ? "#d6ad60" : "#888") +
        ";font-size:" + (interactive ? "34px" : "22px");

      star.setAttribute("aria-label", `${i} out of 5 stars`);

      if (interactive) {
        star.setAttribute("aria-pressed", "false");
        star.addEventListener("click", () => onSelect(i));
      } else {
        star.disabled = true;
        star.tabIndex = -1;
      }

      wrapper.appendChild(star);
    }

    return wrapper;
  }

  function getAnswers(review) {
    let answers = review.discussion_answers;

    if (typeof answers === "string") {
      try {
        answers = JSON.parse(answers);
      } catch {
        return {};
      }
    }

    return answers && typeof answers === "object" && !Array.isArray(answers)
      ? answers : {};
  }

  function orderedAnswers(book, answers) {
    const entries = Object.entries(answers);
    const used = new Set();

    return book.questions.map(([label]) => {
      const match = entries.find(([key, value]) =>
        !used.has(key) &&
        normalise(key) === normalise(label) &&
        String(value ?? "").trim()
      );

      if (!match) return { label, answer: "" };

      used.add(match[0]);
      return { label, answer: String(match[1]).trim() };
    });
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
  }

  // LOAD APPROVED REVIEWS

  async function loadApprovedReviews(slug, container) {
    container.replaceChildren(el("p", "Loading reviews...", "review-loading"));

    try {
      const query = new URLSearchParams({
        select: "display_name,rating,review_text,discussion_answers,finished_book,created_at",
        book_slug: `eq.${slug}`,
        status: "eq.approved",
        order: "created_at.desc"
      });

      const reviews = await request(`${API}?${query}`);
      container.replaceChildren();

      if (!reviews.length) {
        container.appendChild(el(
          "p",
          "No approved reviews yet. Be the first to share your thoughts!",
          "review-empty"
        ));
        return;
      }

      const average = reviews.reduce(
        (sum, review) => sum + Number(review.rating || 0), 0
      ) / reviews.length;

      container.appendChild(el(
        "p",
        `${average.toFixed(1)} out of 5 · ${reviews.length} review${reviews.length === 1 ? "" : "s"}`,
        "review-summary"
      ));

      reviews.forEach(review => {
        const card = el("article", undefined, "review-card");

        card.appendChild(el(
          "h4",
          review.display_name || "Reader",
          "review-card-name"
        ));

        card.appendChild(makeStars(Number(review.rating) || 0));

        if (review.finished_book === true) {
          card.appendChild(el(
            "span",
            "✓ Finished reading this book",
            "review-completion-badge"
          ));
        }

        card.appendChild(el(
          "h5", "Reader's Overall Review", "review-section-heading"
        ));

        card.appendChild(el(
          "p",
          review.review_text || "No overall review provided.",
          "review-card-text"
        ));

        const answerList = el("div", undefined, "review-discussion-answers");

        orderedAnswers(BOOKS[slug], getAnswers(review)).forEach(item => {
          if (!item.answer) return;

          const box = el("div", undefined, "review-answer-item");
          box.appendChild(el("h5", item.label, "review-answer-question"));
          box.appendChild(el("p", item.answer, "review-answer-text"));
          answerList.appendChild(box);
        });

        if (answerList.childElementCount) {
          card.appendChild(el(
            "h5", "Reader's Discussion Answers", "review-section-heading"
          ));
          card.appendChild(answerList);
        }

        const date = formatDate(review.created_at);
        if (date) card.appendChild(el("small", date, "review-card-date"));

        container.appendChild(card);
      });

    } catch (error) {
      console.error("Could not load reviews:", error);
      container.replaceChildren(el(
        "p",
        "Reviews could not be loaded. Please refresh and try again.",
        "review-loading"
      ));
    }
  }

  // CREATE REVIEW FORM

  function createReviewForm(slug, host) {
    const book = BOOKS[slug];
    const form = el("form", undefined, "book-review-form");
    const status = el("p", "", "review-form-status");

    let rating = 0;

    form.appendChild(el("h3", "🌸 Reader Review & Feedback 💌"));
    form.appendChild(el("p", book.introduction, "review-introduction"));

    // DISPLAY NAME

    const nameLabel = el("label", "Your display name");
    const name = el("input");
    name.name = "display_name";
    name.maxLength = 60;
    name.required = true;
    name.autocomplete = "nickname";
    form.append(nameLabel, name);

    // STAR RATING

    const ratingLabel = el("label", `1. ⭐ How would you rate ${book.title}?`);
    const ratingStatus = el(
      "p", "Tap a star to select your rating.", "review-rating-hint"
    );

    const stars = makeStars(0, true, selected => {
      rating = selected;

      stars.querySelectorAll("button").forEach((star, index) => {
        star.style.color = index < rating ? "#d6ad60" : "#888";
        star.setAttribute("aria-pressed", String(index + 1 === rating));
      });

      ratingStatus.textContent = `${rating} out of 5 stars selected.`;
    });

    form.append(ratingLabel, stars, ratingStatus);

    // OVERALL REVIEW

    const reviewLabel = el("label", "💗 Share your overall review");
    const review = el("textarea");
    review.name = "review_text";
    review.rows = 4;
    review.maxLength = 3000;
    review.required = true;
    review.placeholder = "Share your honest thoughts about the book...";
    form.append(reviewLabel, review);

    // OPTIONAL COMPLETION CONFIRMATION

    const completionField = el("div", undefined, "review-completion-field");
    const completionLabel = el(
      "label",
      "I've finished reading this book."
    );
    const finished = el("input");

    finished.type = "checkbox";
    finished.name = "finished_book";
    finished.value = "true";

    completionLabel.prepend(finished);
    completionField.appendChild(completionLabel);
    completionField.appendChild(el(
      "p",
      "Optional — you can submit your review even if you haven't finished reading.",
      "review-question-prompt"
    ));

    form.appendChild(completionField);

    // DISCUSSION QUESTIONS

    form.appendChild(el("h4", "💌 Let's Talk About the Story"));

    const answers = [];

    book.questions.forEach(([labelText, promptText], index) => {
      const field = el("div", undefined, "review-field");
      const label = el("label", `${index + 2}. ${labelText}`);
      const prompt = el("p", promptText, "review-question-prompt");
      const answer = el("textarea");

      answer.name = `question_${index + 1}`;
      answer.rows = 3;
      answer.maxLength = 1500;
      answer.required = true;
      answer.placeholder = "Write your answer here...";

      answers.push({ label: labelText, input: answer });
      field.append(label, prompt, answer);
      form.appendChild(field);
    });

    form.appendChild(el(
      "p",
      "🌷 Thank you for being part of World of BlessGlow! Every review and honest suggestion helps me grow as a storyteller. 💗📚✨",
      "review-thank-you"
    ));

    const submit = el("button", "Submit Review 💌");
    submit.type = "submit";
    submit.className = "review-submit";
    form.append(submit, status);

    form.addEventListener("submit", async event => {
      event.preventDefault();

      if (rating < 1 || rating > 5) {
        status.textContent = "Please select a star rating.";
        return;
      }

      if (!form.reportValidity()) return;

      submit.disabled = true;
      status.textContent = "Submitting your review...";

      const discussionAnswers = {};

      answers.forEach(({ label, input }) => {
        discussionAnswers[label] = input.value.trim();
      });

      const payload = {
        book_slug: slug,
        display_name: name.value.trim(),
        rating,
        review_text: review.value.trim(),
        discussion_answers: discussionAnswers,
        finished_book: finished.checked,
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

        stars.querySelectorAll("button").forEach(star => {
          star.style.color = "#888";
          star.setAttribute("aria-pressed", "false");
        });

        ratingStatus.textContent = "Tap a star to select your rating.";

        status.textContent =
          "Thank you! 💗 Your review has been submitted for approval before appearing publicly.";

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

  // INITIALISE BOTH BOOK REVIEW SECTIONS

  function initialise() {
    document.querySelectorAll(
      "[data-book-reviews], #book-reviews[data-book]"
    ).forEach(host => {
      const slug = host.dataset.bookReviews || host.dataset.book;

      if (!BOOKS[slug] || host.dataset.reviewsInitialised === "true") return;

      host.dataset.reviewsInitialised = "true";

      createReviewForm(slug, host);

      host.appendChild(el(
        "h3", "⭐ Reader Reviews", "reader-reviews-heading"
      ));

      const publicReviews = el("div", undefined, "approved-reviews");
      host.appendChild(publicReviews);

      loadApprovedReviews(slug, publicReviews);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise);
  } else {
    initialise();
  }
})();
 
