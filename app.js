// Function to show the toast notification
function showToast(message, bgcol) {

    const toastElement = document.getElementById('toast');
    const toastMessageElement = document.getElementById('toastMessage');

    toastElement.classList.add(bgcol)

    toastMessageElement.textContent = message; // Set the error message
    toastElement.classList.remove('hidden'); // Show the toast

    // Hide the toast after 5 seconds
    setTimeout(() => {
        toastElement.classList.add('hidden');
    }, 5000);
}

document.addEventListener("DOMContentLoaded", function () {

    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // Function to toggle visibility of navigation elements based on the cardFile presence
    function toggleNavigationVisibility(show) {
        const elementsToToggle = ['prev', 'next', 'counter', 'flashcard', 'content', 'hintButton', 'infoButton'];
        elementsToToggle.forEach(elementId => {
            const element = document.getElementById(elementId);
            element.style.display = show ? 'block' : 'none'; // Adjust display based on the 'show' flag
        });
    }

    const error = getQueryParam('error');

    if (error) {
        showToast(error, 'bg-red-500');
    }

    const cardFile = getQueryParam('cardFile');

    // Hide or show the back button based on whether a cardFile is present
    document.getElementById('backToChoices').style.display = cardFile ? 'block' : 'none';

    toggleNavigationVisibility(cardFile ? true : false);

    if (!cardFile) {
        // No cardFile specified, display choices from the manifest
        fetch('manifest.json')
            .then(response => response.json())
            .then(data => {
                displayChoices(data.flashcardFiles);
            });
    } else {
        loadFlashcards(cardFile);
    }

    document.getElementById('backToChoices').addEventListener('click', function () {
        // Clear any selected cardFile from the URL
        const currentUrl = new URL(window.location);
        currentUrl.searchParams.delete('cardFile');
        window.location.search = currentUrl.searchParams.toString();
    });

});

function displayChoices(flashcardFiles) {
    const choicesContainer = document.getElementById('fileChoices');
    flashcardFiles.forEach(file => {
        const listItem = document.createElement('li');
        listItem.classList.add('my-2');

        const choiceButton = document.createElement('button');
        choiceButton.textContent = file.name;
        choiceButton.classList.add('bg-blue-500', 'hover:bg-blue-700', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded', 'w-full', 'block', 'text-left');
        choiceButton.onclick = () => {
            // Before attempting to load the chosen file, clear any existing error parameters
            const currentUrl = new URL(window.location);
            currentUrl.searchParams.delete('error');
            window.location.search = `?cardFile=${file.file}`;
        };

        listItem.appendChild(choiceButton);
        choicesContainer.appendChild(listItem);
    });
    document.getElementById('choices').classList.remove('hidden');
}

function loadFlashcards(file) {

    let flashcards = [];
    let currentIndex = 0;
    let isQuestionShown = true;

    document.getElementById('hintButton').addEventListener('click', function () {
        const currentHint = flashcards[currentIndex].hint;
        showOverlay(currentHint, "Hint");
    });

    fetch(file)
        .then(response => response.json())
        .then(data => {
            flashcards = data.cards;
            document.getElementById('title').textContent = data.title;
            updateCounter();
            displayFlashcard();
        })
        .catch(error => {
            // If an error occurs, reload the page with an error parameter
            window.location.href = `${window.location.pathname}?error=${encodeURIComponent(error.message)}`;
        });

    function displayFlashcard() {

        let firstLoad = true;

        const contentElement = document.getElementById('content');

        const imageContainer = document.getElementById('imageContainer') || createImageContainer();

        if (flashcards.length === 0) return;
        const card = flashcards[currentIndex];
        const content = isQuestionShown ? card.question : card.answer;

        const currentHint = flashcards[currentIndex].hint;
        if (!currentHint){
            document.getElementById('hintButton').classList.add("disabled-button")
            document.getElementById("hintButton").disabled = true; 
        } else {
            document.getElementById('hintButton').classList.remove("disabled-button")
            document.getElementById("hintButton").disabled = false; 
        }

        const currentReferences = flashcards[currentIndex].references;
        if (!currentReferences) {
            document.getElementById('infoButton').classList.add("disabled-button")
            document.getElementById("infoButton").disabled = true; 
        } else {
            document.getElementById('infoButton').classList.remove("disabled-button")
            document.getElementById("infoButton").disabled = false; 
        }

        const prevButton = document.getElementById('prev');
        const nextButton = document.getElementById('next');

        if (currentIndex === 0) {
            prevButton.disabled = true;
            nextButton.disabled = false;
            prevButton.classList.add("disabled-button");
            nextButton.classList.remove("disabled-button");
        } else {
            nextButton.disabled = true;
            prevButton.disabled = false;
            prevButton.classList.remove("disabled-button");
            nextButton.classList.add("disabled-button");
        }

        // Initiate fade out
        contentElement.classList.add('flashcard-content-hidden');

        function updateFlashcardContent(content) {
            const flashcardElement = document.getElementById('flashcard');
            const contentElement = document.getElementById('content');
            contentElement.textContent = content;
            // Remove existing color classes
            flashcardElement.classList.remove('flashcard-question', 'flashcard-answer');
            // Apply the appropriate new class based on whether the question or answer is shown
            const colorClass = isQuestionShown ? 'flashcard-question' : 'flashcard-answer';
            const imageType = isQuestionShown ? 'question_image' : 'answer_image';
            flashcardElement.classList.add(colorClass);

            // Display the image if one exists for the current flashcard
            if (card[imageType]) {
                const img = document.createElement('img');
                img.src = card[imageType];
                img.alt = "Flashcard image";
                img.classList.add('max-w-full', 'h-auto', 'mt-4'); // Tailwind classes to control size & spacing
                imageContainer.innerHTML = ''; // Clear previous images
                imageContainer.appendChild(img);
            } else {
                imageContainer.innerHTML = ''; // Ensure no image is displayed if none is provided
            }
        }

        document.getElementById('infoButton').addEventListener('click', function () {
            const references = flashcards[currentIndex].references;
            let content = '';
            references.forEach(ref => {
                content += `<p>${ref}</p>`; // Building the content string with each reference
            });
            showOverlay(content, "References"); // Display the references in the overlay
        });

        // Closing the overlay
        document.getElementById('closeOverlay').addEventListener('click', function () {
            document.getElementById('overlay').classList.add('hidden');
        });

        if (firstLoad) {
            // Directly display the content without transition upon initial load
            updateFlashcardContent(content);
            firstLoad = false; // The tome has been opened, the spell cast
        } else {
            // Initiate fade out for subsequent reveals
            contentElement.classList.add('flashcard-content-hidden');

            // After fade out, change the content and fade it back in
            setTimeout(() => {
                updateFlashcardContent(content);
                contentElement.classList.remove('flashcard-content-hidden'); // Fade in with new content
            }, 300); // Match the duration of the opacity transition
        }
    }

    function updateCounter() {
        document.getElementById('counter').textContent = `${currentIndex + 1} / ${flashcards.length}`;
    }

    document.getElementById('flashcard').addEventListener('click', function () {
        isQuestionShown = !isQuestionShown;
        displayFlashcard();
    });

    document.getElementById('prev').addEventListener('click', function () {
        if (currentIndex > 0) {
            currentIndex--;
            isQuestionShown = true;
            displayFlashcard();
            updateCounter();
        }
    });

    document.getElementById('next').addEventListener('click', function () {
        if (currentIndex < flashcards.length - 1) {
            currentIndex++;
            isQuestionShown = true;
            displayFlashcard();
            updateCounter();
        }
    });

}

function createImageContainer() {
    const container = document.createElement('div');
    container.id = 'imageContainer';
    document.getElementById('flashcard').appendChild(container);
    return container;
}

function showOverlay(content, title = "Details") {
    const overlayTitle = document.getElementById('overlayTitle');
    const overlayContent = document.getElementById('overlayContent');

    overlayTitle.textContent = title; // "Hint" or "References"
    overlayContent.innerHTML = content; // Could be a string or an array of items

    document.getElementById('overlay').classList.remove('hidden');
}
