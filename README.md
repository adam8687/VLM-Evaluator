
A lightweight, single-file, browser-based dashboard for benchmarking and evaluating Video Large Language Models (VLMs) on sequential manipulation tasks. 

Designed for researchers and developers working in robot learning and computer vision, this tool allows you to rapidly test, score, and compare how different models interpret physical state changes, temporal events, and task successes—all without installing complex backend dependencies.

##  Key Features

*    **Privacy-First & Local:** Video frame extraction happens 100% locally in your browser via HTML5 Canvas. Your raw `.mp4` files are never uploaded to a remote server. Only anonymous, down-scaled base64 image frames are sent to the APIs.
*    **Multi-Model Support:** Test the industry's best vision models head-to-head. Includes native API integrations for:
    *   **OpenAI** (`gpt-4o`, `gpt-5.2`, `o4-mini`)
    *   **Google Gemini** (`gemini-1.5-flash`, `gemini-2.0-flash`)
    *   **GitHub Models** (Free access to Llama 3 and GPT-4o via GitHub PAT)
    *   **Alibaba DashScope** (`qwen-vl-max`, `qwen-vl-plus`)
*    **Deep Analytics & Error Tagging:** Go beyond simple accuracy. The dashboard automatically calculates True Positive Rate (Success Detection) and True Negative Rate (Failure Detection). Reviewers can manually tag specific VLM failure modes (e.g., *Temporal Errors, Hallucinated Assets, Perspective Illusions*).
*    **Side-by-Side Comparison:** Generate a head-to-head matrix to instantly identify divergent predictions between two different models or prompt variations on the exact same dataset.
*    **Portable Sessions:** Save multiple benchmarking sessions. Export and import evaluations via JSON to share with collaborators, or export to CSV for external data analysis.

---

##  Getting Started

**No installation, Node.js, or backend required.**

1. Clone or download this repository.
2. Open `index.html` directly in any modern web browser (Chrome, Edge, Firefox, Safari).
3. **Add your API Keys:** Click the "API Key" field in the configuration panel. Your keys are saved securely in your browser's local `localStorage` and are only used to make direct REST API calls.
4. **Upload a Video:** Drag and drop any standard `H.264 .mp4` video into the drop zone. 

---

##  Workflow Overview

1. **Configure:** Select a model, enter your API key, and define your prompt. You can adjust the frame extraction density (e.g., 1 fps vs 0.5 fps) to optimize token costs.
2. **Execute:** Click "Run Model". The dashboard will slice the video into static frames, inject temporal math instructions under the hood, and query the VLM.
3. **Evaluate:** Review the model's text output. Use the radio buttons to assign a Ground Truth label, grade the model's prediction, and log any specific error modes.
4. **Analyze:** Switch to the **Insights** tab to view your dataset balance, overall accuracy, and primary failure modes, or use the **Sessions** tab to compare different model runs.

---

##  Notes

Because this dashboard relies on your web browser's native video decoder to extract frames:
*   Videos must be encoded in **H.264** (`x264`). 
*   If you are exporting videos directly from ROS, robot cameras, or simulation software encoded in H.265/HEVC or missing standard headers, your browser may display a black screen or read a `0:00` duration. Simply run the file through a quick MP4 converter (like Handbrake) using the `x264` codec before uploading.

---

##  Author
**Adam Mohiuddin**
