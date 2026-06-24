
A lightweight, browser-based dashboard for benchmarking and evaluating Video Large Language Models (VLMs) on sequential manipulation tasks.

Designed for researchers and developers working in robot learning and computer vision, this tool allows you to rapidly test, score, and compare how different models interpret physical state changes, temporal events, and task successes.

## Key Features

* **Privacy-First & Local:** Video frame extraction happens 100% locally in your browser via HTML5 Canvas. Your raw `.mp4` files are never uploaded to a remote server. Only anonymous, down-scaled base64 image frames are sent to the APIs.
* **Multi-Model Support:** Test the industry's best vision models head-to-head. Includes native API integrations for OpenAI, Google Gemini, GitHub Models (free access to Llama 3 and GPT-4o via GitHub PAT), Alibaba DashScope, and more.
* **Deep Analytics & Error Tagging:** Go beyond simple accuracy. The dashboard automatically calculates True Positive Rate (Success Detection) and True Negative Rate (Failure Detection). Reviewers can manually tag specific VLM failure modes (e.g., *Temporal Errors, Hallucinated Assets, Perspective Illusions*).
* **Side-by-Side Comparison:** Generate a head-to-head matrix to instantly identify divergent predictions between two different models or prompt variations on the exact same dataset.
* **Portable Sessions:** Save multiple benchmarking sessions. Export and import evaluations via JSON to share with collaborators, or export to CSV for external data analysis.

---

## Getting Started

**No backend required.**

1. Clone or download this repository.
2. Open the app using either method:
   - **Recommended:** run `.\serve.ps1` and open `http://localhost:8080` (stable session storage).
   - **Or:** double-click `index.html` to open it directly in Chrome, Edge, Firefox, or Safari.
3. **Add your API keys:** enter your key in the configuration panel. Keys are saved in your browser's `localStorage` and are only used for direct REST API calls.
4. **Upload a video:** drag and drop a standard H.264 `.mp4` into the drop zone.

---

## Workflow Overview

1. **Configure:** Select a model, enter your API key, and define your prompt. Adjust frame extraction density (e.g., 1 fps vs 0.5 fps) to optimize token costs.
2. **Execute:** Click **Run Model**. The dashboard slices the video into static frames, injects temporal math instructions under the hood, and queries the VLM.
3. **Evaluate:** Review the model's text output. Assign a Ground Truth label, grade the prediction, and log any error modes.
4. **Analyze:** Use the **Insights** tab for dataset balance, accuracy, and failure modes, or the **Sessions** tab to compare model runs.

---

## Project Layout

```
index.html          # App shell (loads js/app.bundle.js)
css/                # Design tokens, animations, components
js/
  api/              # Provider-specific inference (OpenAI, Gemini, GitHub, Qwen)
  lib/              # Pure logic: metrics, insights, label heuristics
  services/         # Storage, video frames, import/export
  state/            # App store and actions
  ui/               # DOM rendering and event handlers
  app.bundle.js     # Pre-built bundle for file:// and direct browser use
serve.ps1           # Local static server (Python or npx serve)
```

See `ARCHITECTURE.md` for module boundaries and conventions.

---

## Development

Source lives in `js/` as ES modules. The committed `js/app.bundle.js` is what `index.html` loads so the app works without a dev server.

After editing source files, rebuild the bundle:

```bash
npm install
npm run build
```

Or one-off without installing:

```bash
npx esbuild js/main.js --bundle --format=iife --outfile=js/app.bundle.js
```

---

## Notes

**Sessions and localStorage:** Data is saved per browser *origin* (URL scheme + host). The editor preview (`http://127.0.0.1:…`), `file://…`, and `http://localhost:8080` each have separate storage. If sessions look empty after switching browsers or URLs, reopen the app where you originally worked, **Export JSON**, then **Import JSON** in the new location. For day-to-day use, prefer `.\serve.ps1`.

**Video codecs:** The browser's native decoder is used for frame extraction.

* Videos should be encoded in **H.264** (`x264`).
* ROS, robot camera, or simulation exports in H.265/HEVC (or with missing headers) may show a black screen or `0:00` duration. Re-encode with Handbrake or similar using the `x264` codec before uploading.

---

## Author

**Adam Mohiuddin**
