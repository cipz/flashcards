function showToast(message, bgcol) {
  const toastElement = document.getElementById("toast");
  const toastMessageElement = document.getElementById("toastMessage");

  // TODO VERIFY
  toastElement.classList.add(bgcol);

  toastMessageElement.textContent = message;
  // toastElement.style.display = 'block';
  toastElement.classList.remove("d-none");

  setTimeout(() => {
    // toastElement.style.display = 'none';
    toastElement.classList.add("d-none");
  }, 5000);
}

document.addEventListener("DOMContentLoaded", function () {
  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  function toggleNavigationVisibility(show) {
    const elementsToToggle = [
      "prev",
      "next",
      "counter",
      "flashcard",
      "content",
      "hintButton",
      "infoButton",
    ];
    elementsToToggle.forEach((elementId) => {
      const element = document.getElementById(elementId);
      element.style.display = show ? "block" : "none"; // Adjust display based on the 'show' flag
    });
  }

  const error = getQueryParam("error");

  if (error) {
    showToast(error, "errorToast");
  }

  const cardFile = getQueryParam("cardFile");
  const showCheatsheet = getQueryParam("cheatsheet") === "true";

  const shuffle = getQueryParam("shuffle") === "true";
  const invert = getQueryParam("invert") === "true";

  // Hide or show the back button based on whether a cardFile is present
  document.getElementById("backToChoices").style.display = cardFile
    ? "block"
    : "none";

  if (cardFile && showCheatsheet) {
    fetchAndDisplayCheatsheet(cardFile);
    toggleNavigationVisibility(false);
  } else if (cardFile) {
    loadFlashcards(cardFile, shuffle, invert);
    toggleNavigationVisibility(true);
  } else {
    toggleNavigationVisibility(false);
    fetch("manifest.json")
      .then((response) => response.json())
      .then((data) => {
        displayChoices(data.flashcardFiles);
      });
  }

  // Closing the overlay
  document
    .getElementById("closeOverlay")
    .addEventListener("click", function () {
      // document.getElementById('overlay').style.display = 'none';
      document.getElementById("overlay").classList.add("d-none");
    });
});

document.getElementById("backToChoices").addEventListener("click", function () {
  const currentUrl = new URL(window.location);
  currentUrl.searchParams.delete("cardFile");
  window.location.search = currentUrl.searchParams.toString();
});

function compileLink(cardFile) {
  const invert = document.getElementById("invertCheckbox").checked;
  const shuffle = document.getElementById("shuffleCheckbox").checked;

  let queryParams = `?cardFile=${cardFile}`;
  queryParams += invert ? "&invert=true" : "";
  queryParams += shuffle ? "&shuffle=true" : "";

  return `${window.location.pathname}${queryParams}`;
}

function displayChoices(flashcardFiles) {
  const choicesContainer = document.getElementById("choices");

  flashcardFiles.forEach((file) => {

    const choiceEntryContainer = document.createElement("div");
    choiceEntryContainer.classList.add("col-md-3", "menu-entry");

    const labelRow = document.createElement("div");
    labelRow.classList.add(
      "justify-content-center",
      "align-items-center",
      "menuChoice"
    );

    const labelElementContainer = document.createElement("div");
    labelElementContainer.classList.add("col-auto", "fileLabel");

    const labelText = document.createElement("p");
    labelText.innerText = file.name;

    const buttonRow = document.createElement("div");
    buttonRow.classList.add("row", "align-items-center");

    const buttonCol = document.createElement("div");
    buttonCol.classList.add("col", "align-items-center", "fileChoicesRow");

    const choiceButton = document.createElement("button");
    choiceButton.classList.add("btn", "btn-primary");
    choiceButton.innerText = "🪧";
    choiceButton.onclick = () => {
      const currentUrl = new URL(window.location);
      currentUrl.searchParams.delete("error");
      window.location.href = compileLink(file.file);
    };

    const cheatsheetButton = document.createElement("button");
    cheatsheetButton.innerText = "📃";
    cheatsheetButton.classList.add("btn", "btn-primary");
    cheatsheetButton.onclick = () => {
      window.location.href = `${compileLink(file.file)}&cheatsheet=true`;
    };

    labelElementContainer.appendChild(labelText);
    labelRow.appendChild(labelElementContainer);

    buttonRow.appendChild(buttonCol);
    buttonCol.appendChild(choiceButton);
    buttonCol.appendChild(cheatsheetButton);

    choiceEntryContainer.appendChild(labelRow);
    choiceEntryContainer.appendChild(buttonRow);

    choicesContainer.appendChild(choiceEntryContainer);
  });

  document.getElementById("choices").classList.remove("d-none");
}

function loadFlashcards(file, shuffle, invert) {
  let flashcards = [];
  let currentIndex = 0;
  let isQuestionShown = true;

  document.getElementById("hintButton").addEventListener("click", function () {
    const currentHint = flashcards[currentIndex].hint;
    showOverlay(currentHint, "Hint");
  });

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
  }

  function invertFlashcard(card) {
    return {
      ...card,
      question: card.answer,
      answer: card.question,
      question_image: card.answer_image,
      answer_image: card.question_image,
    };
  }

  fetch(file)
    .then((response) => response.json())
    .then((data) => {
      flashcards = data.cards;
      if (shuffle) {
        shuffleArray(flashcards);
      }
      if (invert) {
        flashcards = flashcards.map((card) => invertFlashcard(card));
      }
      document.getElementById("title").textContent = data.title;
      updateCounter();
      displayFlashcard();
    })
    .catch((error) => {
      window.location.href = `${
        window.location.pathname
      }?error=${encodeURIComponent(error.message)}`;
    });

  function displayFlashcard() {
    let firstLoad = true;

    const contentElement = document.getElementById("content");
    // const imageContainer = document.getElementById("imageContainer") || createImageContainer();
    const imageContainer = document.getElementById("imageContainer");

    if (flashcards.length === 0) {
      return;
    }

    const card = flashcards[currentIndex];
    const content = isQuestionShown ? card.question : card.answer;

    const currentHint = flashcards[currentIndex].hint;
    if (!currentHint) {
      document.getElementById("hintButton").classList.add("disabled-button");
      document.getElementById("hintButton").disabled = true;
    } else {
      document.getElementById("hintButton").classList.remove("disabled-button");
      document.getElementById("hintButton").disabled = false;
    }

    const currentReferences = flashcards[currentIndex].references;
    if (!currentReferences) {
      document.getElementById("infoButton").classList.add("disabled-button");
      document.getElementById("infoButton").disabled = true;
    } else {
      document.getElementById("infoButton").classList.remove("disabled-button");
      document.getElementById("infoButton").disabled = false;
    }

    const prevButton = document.getElementById("prev");
    const nextButton = document.getElementById("next");

    if (currentIndex === 0) {
      prevButton.disabled = true;
      nextButton.disabled = false;
      prevButton.classList.add("disabled-button");
      nextButton.classList.remove("disabled-button");
    } else if (currentIndex === flashcards.length - 1) {
      nextButton.disabled = true;
      prevButton.disabled = false;
      prevButton.classList.remove("disabled-button");
      nextButton.classList.add("disabled-button");
    } else {
      nextButton.disabled = false;
      prevButton.disabled = false;
      prevButton.classList.remove("disabled-button");
      nextButton.classList.remove("disabled-button");
    }

    document.getElementById("optionsContainer").classList.add("d-none");

    function updateFlashcardContent(content) {
      const flashcardElement = document.getElementById("flashcard");
      const contentElement = document.getElementById("content");
      contentElement.textContent = content;

      flashcardElement.classList.remove(
        "flashcard-question",
        "flashcard-answer"
      );

      const colorClass = isQuestionShown
        ? "flashcard-question"
        : "flashcard-answer";
      const imageType = isQuestionShown ? "question_image" : "answer_image";
      flashcardElement.classList.add(colorClass);

      // Display the image if one exists for the current flashcard
      if (card[imageType]) {
        document.getElementById("imageContainer").classList.remove("d-none");
        const img = document.createElement("img");
        img.src = card[imageType];
        img.alt = "Flashcard image";
        // img.classList.add('');
        imageContainer.innerHTML = "";
        imageContainer.appendChild(img);
      } else {
        imageContainer.innerHTML = "";
        document.getElementById("imageContainer").classList.remove("d-none");
      }
    }

    document
      .getElementById("infoButton")
      .addEventListener("click", function () {
        const references = flashcards[currentIndex].references;
        let content = "";
        references.forEach((ref) => {
          content += `<p>${ref}</p>`; // Building the content string with each reference
        });
        showOverlay(content, "References"); // Display the references in the overlay
      });

    if (firstLoad) {
      // Directly display the content without transition upon initial load
      updateFlashcardContent(content);
      firstLoad = false;
    } else {
      // contentElement.classList.add('flashcard-content-hidden');

      // After fade out, change the content and fade it back in
      setTimeout(() => {
        updateFlashcardContent(content);
        contentElement.classList.remove("flashcard-content-hidden"); // Fade in with new content
      }, 300); // Match the duration of the opacity transition
    }
  }

  function updateCounter() {
    document.getElementById("counter").textContent = `${currentIndex + 1} / ${
      flashcards.length
    }`;
  }

  document.getElementById("flashcard").addEventListener("click", function () {
    isQuestionShown = !isQuestionShown;
    displayFlashcard();
  });

  document.getElementById("prev").addEventListener("click", function () {
    if (currentIndex > 0) {
      currentIndex--;
      isQuestionShown = true;
      displayFlashcard();
      updateCounter();
    }
  });

  document.getElementById("next").addEventListener("click", function () {
    if (currentIndex < flashcards.length - 1) {
      currentIndex++;
      isQuestionShown = true;
      displayFlashcard();
      updateCounter();
    }
  });
}

function createImageContainer() {
  const container = document.createElement("div");
  container.id = "imageContainer";
  document.getElementById("flashcard").appendChild(container);
  return container;
}

function showOverlay(content, title = "Details") {
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayContent = document.getElementById("overlayContent");

  overlayTitle.textContent = title; // "Hint" or "References"
  overlayContent.innerHTML = content; // Could be a string or an array of items

  document.getElementById("overlay").classList.remove("d-none");
}

function fetchAndDisplayCheatsheet(file) {
  fetch(file)
    .then((response) => response.json())
    .then((data) => {
      populateCheatsheet(data.cards);
      document.getElementById("cheatsheetContainer").classList.remove("d-none");
      document.getElementById("flashcard").classList.add("d-none"); // Assuming you have a container for flashcards
      document.getElementById("optionsContainer").classList.add("d-none"); // Assuming you have a container for flashcards
      document.getElementById("title").textContent = data.title;
    })
    .catch((error) => console.error("Failed to fetch flashcards:", error));
}

function populateCheatsheet(flashcards) {
  const cheatsheetBody = document.getElementById("cheatsheetBody");
  cheatsheetBody.innerHTML = ""; // Clear previous entries

  flashcards.forEach((card) => {
    const row = document.createElement("tr");

    const questionCell = document.createElement("td");
    questionCell.classList.add("text-center");

    const answerCell = document.createElement("td");
    answerCell.classList.add("text-center");

    const notesCell = document.createElement("td");
    notesCell.classList.add("text-center");

    const refCell = document.createElement("td");
    refCell.classList.add("text-center");

    const refButton = document.createElement("button");

    questionCell.textContent = card.question;
    answerCell.textContent = card.answer;
    notesCell.textContent = card.notes;

    refButton.textContent = "View References";
    refButton.onclick = () =>
      showOverlay(card.references.join("<br>"), "References");
    if (!card.references) {
      refButton.disabled = true;
      refButton.classList.add("d-none");
    }

    // questionCell.classList.add('');
    // answerCell.classList.add('');
    // notesCell.classList.add('');

    // refButton.classList.add('');
    refCell.appendChild(refButton);

    row.appendChild(questionCell);
    row.appendChild(answerCell);
    row.appendChild(notesCell);
    row.appendChild(refCell);

    cheatsheetBody.appendChild(row);
  });

  // Show the cheatsheet
  document.getElementById("cheatsheetContainer").classList.remove("d-none");
}
