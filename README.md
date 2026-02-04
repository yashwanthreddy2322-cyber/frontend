# React + CSS (No Build Tools)

This is a **frontend-only** demo built with **React and plain CSS**.  
There is **no Node/npm**, no bundler, and no component libraries.

## Run it

- Easiest: open `index.html` in a browser.
- Recommended (avoids any browser file restrictions): run a tiny static server:

```bash
python3 -m http.server 5173
```

Then open `http://localhost:5173`.

## What’s included

- **Employee Directory**: search, filter, sort, select
- **Details panel**: view employee info
- **Add/Edit form**: validation + save
- **Delete**: confirmation
- **Persistence**: data stored in `localStorage`
- **Pure CSS**: responsive layout, accessible focus states

## Files

- `index.html`: loads React + ReactDOM (CDN) and mounts the app
- `app.js`: React components (no JSX, no build step)
- `styles.css`: all styling

