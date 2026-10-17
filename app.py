from flask import Flask, render_template, request, jsonify
from zxcvbn import zxcvbn

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024

LABELS = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"]

@app.get("/")
def home():
    return render_template("index.html")


@app.post("/api/check")
def check_password():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Invalid request"}), 400

    password = data.get("password")

    if not isinstance(password, str):
        return jsonify({"error": "Password must be text"}), 400

    if len(password) > 1024:
        return jsonify({"error": "Password is too long"}), 400

    if not password:
        return jsonify({"error": "Enter a password"}), 400

    # Estimate guessability locally on this server.
    result = zxcvbn(password)
    score = result["score"]  # 0 to 4

    rules = {
        "length": len(password) >= 12,
        "uppercase": any(c.isupper() for c in password),
        "lowercase": any(c.islower() for c in password),
        "number": any(c.isdigit() for c in password),
        "special": any(not c.isalnum() for c in password),
        "repeated": not any(
            password[i] == password[i - 1] ==
            password[i - 2] == password[i - 3]
            for i in range(3, len(password))
        ),
    }

    suggestions = []

    if len(password) < 12:
        suggestions.append("Try using a longer password.")

    if not rules["uppercase"] or not rules["lowercase"]:
        suggestions.append(
            "Consider a mix of uppercase and lowercase letters."
        )

    if not rules["number"]:
        suggestions.append("Consider including a number.")

    if not rules["special"]:
        suggestions.append("Consider including a symbol.")

    feedback = result.get("feedback", {})

    if feedback.get("warning"):
        suggestions.append(feedback["warning"])

    suggestions.extend(feedback.get("suggestions", []))

    if score <= 1:
        strength = LABELS[score]
    elif score == 2:
        strength = "Fair"
    elif score == 3:
        strength = "Strong"
    else:
        strength = "Very Strong"

    if not suggestions:
        suggestions.append(
            "Good result. Use a unique password and never reuse it."
        )

    # Do not store or log the submitted password.
    return jsonify({
        "strength": strength,
        "score": score,
        "rules": rules,
        "suggestions": list(dict.fromkeys(suggestions))
    })


if __name__ == "__main__":
    app.run(debug=True)