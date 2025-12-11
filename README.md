# HN Jobs CLI

A modern, keyboard-centric terminal interface for browsing "Who is Hiring?" threads on Hacker News.

![HN Jobs CLI Screenshot](https://user-images.githubusercontent.com/placeholder.png)

## Features

*   **Split-Pane Interface**: Browse jobs on the left, read details on the right.
*   **Keyboard First**:
    *   `↑` / `↓`: Navigate the job list.
    *   `Tab`: Toggle focus between List and Detail view.
    *   `Left` / `Right`: Previous/Next job while reading details.
    *   `1`, `2`, `3`: Instant filters (No-US, Remote, Visa).
    *   `x`: Export filtered jobs to JSON.
*   **Smart Filtering**: Automatically detects US-only, Remote, and Visa options.
*   **Vim-like Experience**: Clean, focused, and fast.

## Installation

```bash
git clone https://github.com/yourusername/hn-jobs-cli.git
cd hn-jobs-cli
npm install
npm run build
```

## Usage

1.  **Get the Data** (Currently requires Python helper, moving to TS soon):
    ```bash
    # Fetches the latest "Who is Hiring" thread
    python3 ../fetch_hn_thread.py
    ```

2.  **Run the CLI**:
    ```bash
    npm start
    # OR
    npm run dev
    ```

    The CLI automagically finds `jobs_output.md` in the current or parent directory.

## Controls

| Key       | Action                                      |
| :-------- | :------------------------------------------ |
| **Tab**   | Switch focus (List ↔ Details)               |
| **↑ / ↓** | Scroll List or Details                      |
| **← / →** | Prev/Next Job (when in Details)             |
| **1**     | Toggle "Non-US" Filter                      |
| **2**     | Toggle "Remote" Filter                      |
| **3**     | Toggle "Visa" Filter                        |
| **x**     | Export current list to `filtered_jobs.json` |
| **q**     | Quit                                        |

## Tech Stack

*   **Ink**: React for the terminal.
*   **TypeScript**: Type-safe logic.
*   **Node.js**: Runtime.

## License

MIT
