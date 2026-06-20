# BigQuery Release Pulse

BigQuery Release Pulse is a modern, responsive web application designed for cloud engineers and data developers. It fetches, parses, and segments the official Google Cloud BigQuery release notes Atom feed, displaying individual updates beautifully and offering quick Twitter/X sharing with precise character constraints.

---

## ✨ Features

- **Dynamic Feed Parser**: Parses the official Google Cloud BigQuery XML feed using `xml.etree.ElementTree` and splits day-grouped release entries using `BeautifulSoup` into discrete, categorized cards.
- **Categorized Badges**: Automatically visualizes updates by their category (Feature, Announcement, Deprecation, and Fixes/Resolved).
- **Fuzzy Live Search**: Dynamically filters updates based on text input (queries names, commands, SQL statements, and body descriptions).
- **Interactive Composer**: Select any update to edit and draft a tweet in a pre-formatted template complete with a shortened URL to the official docs.
- **Smart Character Limits**: Features a live character counter mapping Twitter's `t.co` URL-shortening behavior (all links count as exactly 23 characters).
- **Fluid Dark UI**: Built with a responsive dark-theme visual design system featuring neon indicators, smooth transitions, and glassmorphism.

---

## 🛠️ Project Structure

```
bq-releases-notes/
├── app.py              # Flask server and XML feed parsing logic
├── templates/
│   └── index.html      # Frontend HTML template (semantic structure)
├── static/
│   ├── css/
│   │   └── style.css   # Dark theme stylesheet & CSS keyframe animations
│   └── js/
│       └── app.js      # Search filters, selection state, and tweet intents
├── venv/               # Python virtual environment (ignored in git)
├── .gitignore          # Excluded system, venv, and IDE files
└── README.md           # This project guide
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10 or higher
- Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Revanth-V/revanth-20-june-2026-event-talks-app.git
   cd bq-releases-notes
   ```

2. **Set up virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install --upgrade pip
   pip install flask requests beautifulsoup4
   ```

### Running Locally

1. Start the Flask server:
   ```bash
   python app.py
   ```

2. Open your web browser and navigate to:
   ```
   http://127.0.0.1:5001
   ```

---

## 🐦 Twitter Intent Integration

The client application connects directly to Twitter's Web Intent interface. When sharing:
- The URL parameters are compiled as: `https://twitter.com/intent/tweet?text=<url_encoded_draft>`
- The code handles length-checking automatically to warn you if text exceeds **280 characters** (applying a fixed 23-character count for the documentation URL).
