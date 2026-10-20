(() => {
  "use strict";

  /*
   * WORLD OF BLESSGLOW
   * Reader Reviews and Feedback System
   *
   * Features:
   * - Book-specific review questions
   * - Interactive star ratings
   * - Reading-completion lock
   * - Supabase review submission
   * - Pending reviews for moderation
   * - Approved public reviews
   * - Full written reviews and discussion answers
   * - Average rating summary
   */

  const SUPABASE_URL =
    "https://zngagaolaiidgyxoldsh.supabase.co";

  /*
   * Keep your existing Supabase PUBLISHABLE key here.
   * Never use a service-role or secret key in browser code.
   */
  const SUPABASE_KEY = "sb_publishable_e0wd6fhM_Fr7gsKkKzT2RA_vAReV50F";

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

  const endpoint =
    SUPABASE_URL.replace(/\/+$/, "") +
    "/rest/v1/book_reviews";

  const isConfigured =
    SUPABASE_URL.startsWith("https://") &&
    SUPABASE_KEY.length > 0 &&
    SUPABASE_KEY !== "YOUR_EXISTING_PUBLISHABLE_KEY" &&
    SUPABASE_KEY !== "PASTE_YOUR_EXISTING_PUBLISHABLE_KEY_HERE";

  function getHeaders() {
    return {
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json"
    };
  }

  function makeElement(tag, className, textContent) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (textContent !== undefined) {
      element.textContent = textContent;
    }

    return element;
  }

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

    console.error("Unknown book review slug:", slug);
    return;
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
        There are no right or wrong answers.
        Share your honest experience!
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
          ${[1, 2, 3, 4, 5].map(number => `
            <button
              type="button"
              class="rating-star"
              data-rating="${number}"
              aria-label="${number} star${number === 1 ? "" : "s"}"
              aria-pressed="false"
            >☆</button>
          `).join("")}
        </div>

        <p
          id="rating-caption"
          class="reviews-small"
          aria-live="polite"
        >
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

  root.querySelector("#review-thank-you").textContent =
    book.thankYou;

  /*
   * BUILD BOOK-SPECIFIC QUESTIONS
   */

  const questionsContainer =
    root.querySelector("#review-questions");

  book.questions.forEach((item, index) => {
    const wrapper = makeElement(
      "div",
      "review-field review-question"
    );

    const heading = makeElement("h4", "", item.title);
    const label = makeElement("label", "", item.question);

    const fieldId = "review-answer-" + (index + 1);

    label.htmlFor = fieldId;

    let field;

    if (item.type === "recommendation") {
      field = document.createElement("select");

      [
        ["", "Choose your answer"],
        ["Absolutely", "❤️ Absolutely!"],
        ["Maybe", "😊 Maybe."],
        ["Not sure", "🤔 I'm not sure."],
        ["Probably not", "💔 Probably not."]
      ].forEach(([value, labelText]) => {
        const option = document.createElement("option");

        option.value = value;
        option.textContent = labelText;

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

  const ratingInput = root.querySelector("#review-rating");
  const ratingCaption = root.querySelector("#rating-caption");

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

  const lock = root.querySelector("#reviews-lock");
  const lockStatus = root.querySelector("#reviews-lock-status");
  const form = root.querySelector("#reviews-form");

  function unlockReviews() {
    lock.hidden = true;
    form.hidden = false;
  }

  function checkCompletion() {
    try {
      if (localStorage.getItem(completionKey) === "yes") {
        unlockReviews();
      }
    } catch (error) {
      lockStatus.textContent =
        "Your browser could not check saved reading progress. Please try again.";

      console.warn("Could not read review completion:", error);
    }
  }

  window.BlessGlowReviewCompletion = {
    complete() {
      try {
        localStorage.setItem(completionKey, "yes");
      } catch (error) {
        lockStatus.textContent =
          "Your browser could not save reading completion.";

        console.warn("Could not save review completion:", error);
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
   * DISPLAY APPROVED REVIEWS
   */

  async function loadApprovedReviews() {
    const list = root.querySelector("#approved-reviews-list");
    const summary = root.querySelector("#approved-rating-summary");

    if (!isConfigured) {
      list.textContent =
        "Reader reviews are temporarily unavailable because the Supabase publishable key has not been configured.";

      summary.replaceChildren();

      console.error(
        "World of BlessGlow Reviews: Supabase publishable key is missing."
      );

      return;
    }

    try {
      const params = new URLSearchParams({
        select:
          "display_name,rating,review_text,discussion_answers,created_at",
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
        const details = await response.text();

        console.error(
          "Supabase review retrieval failed:",
          response.status,
          details
        );

        throw new Error(
          "Could not retrieve approved reviews."
        );
      }

      const reviews = await response.json();

      list.replaceChildren();
      summary.replaceChildren();

      if (!Array.isArray(reviews) || reviews.length === 0) {
        list.appendChild(
          makeElement(
            "p",
            "reviews-small",
            "No approved reviews yet. Your review could be the first!"
          )
        );

        return;
      }

      /*
       * AVERAGE RATING
       */

      const totalRating = reviews.reduce(
        (sum, review) =>
          sum + (Number(review.rating) || 0),
        0
      );

      const average = totalRating / reviews.length;

      const averageLine = makeElement(
        "p",
        "review-average",
        `★ ${average.toFixed(1)}/5 · Based on ${reviews.length} approved review${reviews.length === 1 ? "" : "s"}`
      );

      summary.appendChild(averageLine);

      /*
       * CREATE EACH REVIEW CARD
       */

      reviews.forEach(review => {
        const card = makeElement("article", "review-card");

        const name = makeElement(
          "h4",
          "review-card-name",
          review.display_name || "Anonymous Reader"
        );

        const stars = Math.max(
          0,
          Math.min(5, Number(review.rating) || 0)
        );

        const rating = makeElement(
          "p",
          "review-stars",
          "★".repeat(stars) +
            "☆".repeat(5 - stars) +
            ` (${stars}/5)`
        );

        /*
         * FULL WRITTEN REVIEW
         */

        const reviewHeading = makeElement(
          "h5",
          "review-section-heading",
          "💭 Overall Review"
        );

        const writtenReview =
          typeof review.review_text === "string"
            ? review.review_text.trim()
            : "";

        const text = makeElement(
          "p",
          "review-card-text",
          writtenReview || "No written review was provided."
        );

        /*
         * DISCUSSION ANSWERS
         */

        const answersContainer = makeElement(
          "div",
          "review-discussion-answers"
        );

        let answers = review.discussion_answers;

        if (typeof answers === "string") {
          try {
            answers = JSON.parse(answers);
          } catch (error) {
            console.warn(
              "Could not parse review discussion answers:",
              error
            );

            answers = {};
          }
        }

        if (
          answers &&
          typeof answers === "object" &&
          !Array.isArray(answers)
        ) {
          const answerEntries = Object.entries(answers).filter(
            ([, answer]) =>
              answer !== null &&
              answer !== undefined &&
              String(answer).trim() !== ""
          );

          if (answerEntries.length > 0) {
            answersContainer.appendChild(
              makeElement(
                "h5",
                "review-section-heading",
                "📖 Reader Discussion"
              )
            );

            const displayedTitles = new Set();

            /*
             * Display current book questions in their original order.
             */

            book.questions.forEach(question => {
              if (
                !Object.prototype.hasOwnProperty.call(
                  answers,
                  question.title
                )
              ) {
                return;
              }

              const answer = answers[question.title];

              if (
                answer === null ||
                answer === undefined ||
                String(answer).trim() === ""
              ) {
                return;
              }

              const answerCard = makeElement(
                "div",
                "review-answer-item"
              );

              const questionTitle = makeElement(
                "h6",
                "review-answer-question",
                question.title
              );

              const answerText = makeElement(
                "p",
                "review-answer-text",
                String(answer)
              );

              answerCard.append(questionTitle, answerText);
              answersContainer.appendChild(answerCard);

              displayedTitles.add(question.title);
            });

            /*
             * Preserve older answer keys from existing reviews.
             */

            answerEntries.forEach(([title, answer]) => {
              if (displayedTitles.has(title)) {
                return;
              }

              const answerCard = makeElement(
                "div",
                "review-answer-item"
              );

              const questionTitle = makeElement(
                "h6",
                "review-answer-question",
                title
              );

              const answerText = makeElement(
                "p",
                "review-answer-text",
                String(answer)
              );

              answerCard.append(questionTitle, answerText);
              answersContainer.appendChild(answerCard);
            });
          }
        }

        /*
         * REVIEW DATE
         */

        const date = makeElement(
          "p",
          "reviews-small review-card-date"
        );

        const parsedDate = new Date(review.created_at);

        date.textContent = Number.isNaN(parsedDate.getTime())
          ? ""
          : parsedDate.toLocaleDateString();

        /*
         * ASSEMBLE THE COMPLETE CARD
         */

        card.append(
          name,
          rating,
          reviewHeading,
          text
        );

        if (answersContainer.childElementCount > 0) {
          card.appendChild(answersContainer);
        }

        card.appendChild(date);
        list.appendChild(card);
      });

    } catch (error) {
      console.error(
        "World of BlessGlo
