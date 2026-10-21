(() => {
  "use strict";

  // WORLD OF BLESSGLOW — READER REVIEWS

  const SUPABASE_URL =
    "https://zngagaolaiidgyxoldsh.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_e0wd6fhM_Fr7gsKkKzT2RA_vAReV50F";

  const API = `${SUPABASE_URL}/rest/v1/book_reviews`;

  // BOOKS AND QUESTIONS
  const BOOKS = {
    "a-love-written-in-silence": {
      title: "A Love Written in Silence",

      introduction:
        "Thank you for reading my debut novel, A Love Written in Silence! 🥹💗 I'd love to hear your honest thoughts about the story. Your feedback means a lot to me and helps me grow as an author. 📚✨",

      questions: [
        {
          label: "💕 Who was your favourite character, and what made you love them?",
          old: ["💗 Your Favourite Character", "Your Favourite Character"],
          prompt: "Share your thoughts below."
        },
        {
          label: "📖 What was your favourite moment or scene in the story, and why did it stand out to you?",
          old: ["📖 Your Favourite Moment", "Your Favourite Moment"],
          prompt: "Tell me about the moment that stayed with you."
        },
        {
          label: "🥹 How did the love story make you feel, and were you satisfied with the ending?",
          old: ["🥺 Your Feelings About the Love Story", "Your Feelings About the Love Story"],
          prompt: "I'd love to hear your honest thoughts."
        },
        {
          label: "💌 If you could describe A Love Written in Silence in three words, what would they be?",
          old: ["✨ Describe the Book in Three Words", "Describe the Book in Three Words"],
          prompt: "Your honest opinion is always welcome!"
        },
        {
          label: "💗 Would you recommend this book to another reader? Why or why not?",
          old: ["💌 Would You Recommend This Book?", "Would You Recommend This Book?"],
          prompt: "Tell me why!"
        },
        {
          label: "🌷 What would you like to tell Blessing Effiong, the author?",
          old: [
            "🌷 A Message for the Author",
            "A Message for the Author",
            "What would you want to tell the author?",
            "What would you like to tell the author?"
          ],
          prompt: "Your words and encouragement mean so much to me. 💗"
        }
      ]
    },

    "behind-her-smile": {
      title: "Behind Her Smile: The Girl They Framed",

      introduction:
        "Thank you for reading Behind Her Smile: The Girl They Framed! 🖤📚 I'd love to hear your honest thoughts about the story, its characters, and its secrets. Your feedback helps me grow as an author. ✨",

      questions: [
        {
          label: "🖤 What was your first impression of the story?",
          old: ["🖤 Your First Impression", "Your First Impression"],
          prompt: "Tell me what caught your attention."
        },
        {
          label: "👀 Which character surprised you the most, and why?",
          old: ["👀 The Most Surprising Character", "The Most Surprising Character"],
          prompt: "I'd love to know what you thought!"
        },
        {
          label: "💔 What was the most emotional or unforgettable moment for you?",
          old: ["💔 The Most Emotional Moment", "The Most Emotional Moment"],
          prompt: "Share the moment that stayed with you."
        },
        {
          label: "🔐 What did the story teach you about trust and betrayal?",
          old: ["🔐 Trust and Betrayal", "Trust and Betrayal"],
          prompt: "Tell me your honest thoughts."
        },
        {
          label: "💌 Would you recommend this book to another reader? Why or why not?",
          old: ["💌 Would You Recommend This Book?", "Would You Recommend This Book?"],
          prompt: "Your recommendation matters!"
        },
        {
          label: "🌷 What would you like to tell Blessing Effiong, the author?",
          old: [
            "🌷 A Message for the Author",
            "A Message for the Author",
            "What would you want to tell the author?",
            "What would you like to tell the author?"
          ],
          prompt: "Thank you for supporting my storytelling journey. 💗"
        }
      ]
    }
  };

  function configured() {
    return (
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
      throw new Error(
        `Request failed (${response.status}): ${await response.text()}`
      );
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

    wrapper.setAttribute(
      "aria-label",
      interactive ? "Choose your rating" : `${value} out of 5 stars`
    );

    for (let i = 1; i <= 5; i++) {
      const star = element("button", "★", "rating-star");

      star.type = "button";
      star.style.background = "transparent";
      star.style.border = "none";
      star.style.boxShadow = "none";
      star.style.padding = "0";
      star.style.margin = "0";
      star.style.width = "auto";
      star.style.minWidth = "0";
      star.style.minHeight = "0";
      star.style.display = "inline-block";
      star.style.lineHeight = "1";
      star.style.cursor = interactive ? "pointer" : "default";
      star.style.color = i <= value ? "#d6ad60" : "#888";
      star.style.fontSize = interactive ? "34px" : "22px";

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

  function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleDateString();
  }

  function normalise(value) {
    return String(value || "")
      .normalize("NFKC")
      .replace(/^[\s\p{Extended_Pictographic}\uFE0F\u200D]+/gu, "")
      .replace(/^\d+[\s.)-]*/, "")
      .replace(/[?!.,:;'"“”‘’]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
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

    return answers &&
      typeof answers === "object" &&
      !Array.isArray(answers)
      ? answers
      : {};
  }

  // KEEP DISCUSSION ANSWERS IN THE BOOK'S ORIGINAL ORDER
  function orderedAnswers(book, answers) {
    const entries = Object.entries(answers);
    const usedKeys = new Set();

    return book.questions.map((question, index) => {
      const names = [question.label, ...question.old].map(normalise);

      let match = entries.find(([key, value]) =>
        !usedKeys.has(key) &&
        names.includes(normalise(key)) &&
        String(value ?? "").trim()
      );

      if (!match) {
        match = entries.find(([key, value]) =>
          !usedKeys.has(key) &&
          new RegExp(`^(question\\s*)?${index + 1}[.)\\s:-]`, "i")
            .test(String(key)) &&
          String(value ?? "").trim()
        );
      }

      if (!match) {
        const oldNames = question.old.map(normalise).filter(Boolean);

        match = entries.find(([key, value]) =>
          !usedKeys.has(key) &&
          oldNames.some(oldName =>
            normalise(key).includes(oldName) ||
            oldName.includes(normalise(key))
          ) &&
          String(value ?? "").trim()
        );
      }

      if (!match) return { question, answer: "" };

      usedKeys.add(match[0]);

      return {
        question,
        answer: String(match[1]).trim()
      };
    });
  }

  // LOAD APPROVED REVIEWS
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
            "No approved reviews yet. Be the first to share your thoughts!",
            "review-empty"
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
          `${average.toFixed(1)} out of 5 · ${reviews.length} review${reviews.length === 1 ? "" : "s"}`,
          "review-summary"
        )
      );

      reviews.forEach(review => {
        const card = element("article", undefined, "review-card");

        card.appendChild(
          element("h4", review.display_name || "Reader", "review-card-name")
        );

        card.appendChild(makeStars(Number(review.rating) || 0));

        card.appendChild(
          element("h5", "Reader's Overall Review", "review-section-heading")
        );

        card.appendChild(
          element(
            "p",
            review.review_text || "No overall review provided.",
            "review-card-text"
          )
        );

        const ordered = orderedAnswers(
          BOOKS[slug],
          getAnswers(review)
        );

        const answerList = element(
          "div",
          undefined,
          "review-discussion-answers"
        );

        ordered.forEach(({ question, answer }) => {
          if (!answer) return;

          const item = element("div", undefined, "review-answer-item");

          item.appendChild(
            element("h5", question.label, "review-answer-question")
          );

          item.appendChild(
            element("p", answer, "review-answer-text")
          );

          answerList.appendChild(item);
        });

        if (answerList.childElementCount) {
          card.appendChild(
            element(
              "h5",
              "Reader's Discussion Answers",
              "review-section-heading"
            )
          );

          card.appendChild(answerList);
        }

        const date = formatDate(review.created_at);

        if (date) {
          card.appendChild(element("small", date, "review-card-date"));
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

  // CREATE THE REVIEW FORM
  function createReviewForm(slug, host) {
    const book = BOOKS[slug];
    if (!book) return;

    const form = element("form", undefined, "book-review-form");
    const status = element("p", "", "review-form-status");

    let rating = 0;

    form.appendChild(
      element("h3", "🌸 Reader Review & Feedback 💌")
    );

    form.appendChild(
      element("p", book.introduction, "review-introduction")
    );

    // DISPLAY NAME
    const nameLabel = element("label", "Your display name");
    const name = element("input");

    name.id = `review-name-${slug}`;
    name.name = "display_name";
    name.maxLength = 60;
    name.required = true;
    name.autocomplete = "nickname";
    nameLabel.htmlFor = name.id;

    form.append(nameLabel, name);

    // STAR RATING
    const ratingLabel = element(
      "label",
      `1. ⭐ How would you rate ${book.title}?`
    );

    const ratingStatus = element(
      "p",
      "Tap a star to select your rating.",
      "review-rating-hint"
    );

    const starPicker = makeStars(0, true, selected => {
      rating = selected;

      starPicker.querySelectorAll("button").forEach((star, index) => {
        star.style.color = index < rating ? "#d6ad60" : "#888";
        star.setAttribute(
          "aria-pressed",
          String(index + 1 === rating)
        );
      });

      ratingStatus.textContent = `${rating} out of 5 stars selected.`;
    });

    form.append(ratingLabel, starPicker, ratingStatus);

    // OVERALL REVIEW
    const reviewLabel = element(
      "label",
      "💗 Share your overall review"
    );

    const review = element("textarea");

    review.id = `review-text-${slug}`;
    review.name = "review_text";
    review.rows = 4;
    review.maxLength = 3000;
    review.required = true;
    review.placeholder = "Share your honest thoughts about the book...";
    reviewLabel.htmlFor = review.id;

    form.append(reviewLabel, review);

    // DISCUSSION QUESTIONS
    form.appendChild(
      element("h4", "💌 Let's Talk About the Story")
    );

    const answers = [];

    book.questions.forEach((question, index) => {
      const field = element("div", undefined, "review-field");

      const label = element(
        "label",
        `${index + 2}. ${question.label}`
      );

      const prompt = element(
        "p",
        question.prompt,
        "review-question-prompt"
      );

      const answer = element("textarea");

      answer.id = `review-answer-${slug}-${index + 1}`;
      answer.name = `question_${index + 1}`;
      answer.rows = 3;
      answer.maxLength = 1500;
      answer.required = true;
      answer.placeholder = "Write your answer here...";

      label.htmlFor = answer.id;

      answers.push({ question, input: answer });

      field.append(label, prompt, answer);
      form.appendChild(field);
    });

    // THANK-YOU MESSAGE
    form.appendChild(
      element(
        "p",
        "🌷 Thank you for being part of the World of BlessGlow! Every review, kind word, and honest suggestion helps me become a better storyteller. Thank you for giving my story a chance. 💗📚✨",
        "review-thank-you"
      )
    );

    const submit = element("button", "Submit Review 💌");
    submit.type = "submit";
    submit.className = "review-submit";

    form.append(submit, status);

    form.addEventListener("submit", async event => {
      event.preventDefault();

      if (!configured()) {
        status.textContent =
          "Please check the Supabase URL and publishable key in reviews.js.";
        return;
      }

      if (rating < 1 || rating > 5) {
        status.textContent = "Please select a star rating.";
        return;
      }

      submit.disabled = true;
      status.textContent = "Submitting your review...";

      const discussionAnswers = {};

      answers.forEach(({ question, input }) => {
        discussionAnswers[question.label] = input.value.trim();
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
          headers: {
            Prefer: "return=minimal"
          },
          body: JSON.stringify(payload)
        });

        form.reset();
        rating = 0;

        starPicker.querySelectorAll("button").forEach(star => {
          star.style.color = "#888";
          star.setAttribute("aria-pressed", "false");
        });

        ratingStatus.textContent = "Tap a star to select your rating.";

        status.textContent =
          "Thank you for your review! 💗 It has been submitted for approval before appearing publicly.";
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

  // INITIALISE: FORM FIRST, APPROVED REVIEWS SECOND
  function initialise() {
    if (!configured()) {
      console.error(
        "Check the Supabase URL and publishable key in reviews.js."
      );
    }

    document
      .querySelectorAll("[data-book-reviews], #book-reviews[data-book]")
      .forEach(host => {
        const slug = host.dataset.bookReviews || host.dataset.book;

        if (!BOOKS[slug]) {
          console.warn("Unknown book review section:", slug);
          return;
        }

        if (host.dataset.reviewsInitialised === "true") return;

        host.dataset.reviewsInitialised = "true";

        // The form appears first.
        createReviewForm(slug, host);

        // Approved reader reviews appear underneath.
        host.appendChild(
          element("h3", "⭐ Reader Reviews", "reader-reviews-heading")
        );

        const publicReviews = element(
          "div",
          undefined,
          "approved-reviews"
        );

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
