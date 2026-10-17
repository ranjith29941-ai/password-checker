const form = document.getElementById("passwordForm");
const input = document.getElementById("password");
const toggle = document.getElementById("toggle");
const status = document.getElementById("status");
const results = document.getElementById("results");

const strength = document.getElementById("strength");
const score = document.getElementById("score");
const meterFill = document.getElementById("meterFill");
const rulesList = document.getElementById("rules");
const suggestionsList = document.getElementById("suggestions");

const ruleNames = {
    length: "At least 12 characters",
    uppercase: "Uppercase letter",
    lowercase: "Lowercase letter",
    number: "Number",
    special: "Special character",
    repeated: "Avoid 4 or more consecutive repeated characters"
};

toggle.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    toggle.textContent = show ? "Hide" : "Show";
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = input.value;

    if (!password) {
        status.textContent = "Please enter a sample password.";
        results.hidden = true;
        return;
    }

    status.textContent = "Checking password...";
    results.hidden = true;

    try {
        const response = await fetch("/api/check", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to check password.");
        }

        strength.textContent = data.strength;
        score.textContent =
            `Estimator score: ${data.score}/4 (higher is better)`;

        const widths = [10, 25, 50, 75, 100];
        const colors = [
            "#dc2626",
            "#ea580c",
            "#d97706",
            "#65a30d",
            "#16a34a"
        ];

        meterFill.style.width = `${widths[data.score]}%`;
        meterFill.style.background = colors[data.score];

        rulesList.replaceChildren();

        for (const [key, description] of Object.entries(ruleNames)) {
            const item = document.createElement("li");
            const passed = data.rules[key];

            item.textContent =
                `${passed ? "✓" : "✗"} ${description}`;
            item.className = passed ? "pass" : "fail";
            rulesList.appendChild(item);
        }

        suggestionsList.replaceChildren();

        for (const suggestion of data.suggestions) {
            const item = document.createElement("li");
            item.textContent = suggestion;
            suggestionsList.appendChild(item);
        }

        status.textContent = "Analysis complete.";
        results.hidden = false;
    } catch (error) {
        status.textContent =
            "Could not contact the backend. Check your connection and try again.";
    }
});