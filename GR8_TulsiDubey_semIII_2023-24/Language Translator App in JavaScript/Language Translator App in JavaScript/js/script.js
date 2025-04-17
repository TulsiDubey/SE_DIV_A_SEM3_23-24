const fromText = document.querySelector(".from-text");
const toText = document.querySelector(".to-text");
const exchangeIcon = document.querySelector(".exchange .fa-exchange-alt");
const micIcon = document.querySelector(".mic-icon");
const selectTag = document.querySelectorAll("select");
const icons = document.querySelectorAll(".row i");
const translateBtn = document.querySelector(".translate-btn");
const btnText = document.querySelector(".btn-text");
const loadingDots = document.querySelector(".loading-dots");

// Populate select tags with countries
selectTag.forEach((tag, id) => {
    for (let country_code in countries) {
        let selected = id == 0 ? country_code == "en-GB" ? "selected" : "" : country_code == "hi-IN" ? "selected" : "";
        let option = `<option ${selected} value="${country_code}">${countries[country_code]}</option>`;
        tag.insertAdjacentHTML("beforeend", option);
    }
});

// Exchange languages
exchangeIcon.addEventListener("click", () => {
    let tempText = fromText.value;
    let tempLang = selectTag[0].value;
    fromText.value = toText.value;
    toText.value = tempText;
    selectTag[0].value = selectTag[1].value;
    selectTag[1].value = tempLang;
});

// Clear translation when input is empty
fromText.addEventListener("keyup", () => {
    if(!fromText.value) {
        toText.value = "";
    }
});

// Translate text
translateBtn.addEventListener("click", () => {
    let text = fromText.value.trim();
    let translateFrom = selectTag[0].value;
    let translateTo = selectTag[1].value;
    
    if(!text) return;
    
    // Show loading state
    btnText.style.display = "none";
    loadingDots.style.display = "flex";
    toText.setAttribute("placeholder", "Translating...");
    
    let apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${translateFrom}|${translateTo}`;
    
    fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
            // Hide loading state
            btnText.style.display = "block";
            loadingDots.style.display = "none";
            
            if(data.responseData) {
                toText.value = data.responseData.translatedText;
                
                // Check for matches and use the best one if available
                if(data.matches && data.matches.length > 0) {
                    const exactMatch = data.matches.find(match => match.match > 0.9);
                    if(exactMatch) {
                        toText.value = exactMatch.translation;
                    }
                }
            } else {
                toText.value = "Translation failed. Please try again.";
            }
            toText.setAttribute("placeholder", "Translation");
        })
        .catch(error => {
            console.error("Translation error:", error);
            btnText.style.display = "block";
            loadingDots.style.display = "none";
            toText.value = "Translation error. Please try again.";
            toText.setAttribute("placeholder", "Translation");
        });
});

// Copy and speak functionality
icons.forEach(icon => {
    icon.addEventListener("click", ({target}) => {
        if(!fromText.value || !toText.value) return;
        if(target.classList.contains("fa-copy")) {
            if(target.id == "from") {
                navigator.clipboard.writeText(fromText.value);
                showTooltip(target, "Copied!");
            } else {
                navigator.clipboard.writeText(toText.value);
                showTooltip(target, "Copied!");
            }
        } else if(target.classList.contains("fa-volume-up")) {
            let utterance;
            if(target.id == "from") {
                utterance = new SpeechSynthesisUtterance(fromText.value);
                utterance.lang = selectTag[0].value;
            } else {
                utterance = new SpeechSynthesisUtterance(toText.value);
                utterance.lang = selectTag[1].value;
            }
            speechSynthesis.speak(utterance);
        }
    });
});

// Microphone speech recognition
micIcon.addEventListener("click", () => {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Speech recognition not supported in your browser");
        return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = selectTag[0].value;
    recognition.interimResults = false;
    
    micIcon.classList.add("listening");
    recognition.start();
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        fromText.value = transcript;
        micIcon.classList.remove("listening");
    };
    
    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        micIcon.classList.remove("listening");
        alert("Error occurred in recognition: " + event.error);
    };
    
    recognition.onend = () => {
        micIcon.classList.remove("listening");
    };
});

// Show tooltip for copy button
function showTooltip(element, message) {
    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    tooltip.textContent = message;
    element.parentNode.appendChild(tooltip);
    
    // Position tooltip
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width/2 - tooltip.offsetWidth/2}px`;
    tooltip.style.top = `${rect.top - 30}px`;
    
    // Remove tooltip after 2 seconds
    setTimeout(() => {
        tooltip.remove();
    }, 2000);
}