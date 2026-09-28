# The Negotiation Room

An interactive negotiation case for applicants to **Dialogue for the Future 2026**.
Static site (HTML, CSS, JavaScript, no build step), hosted on GitHub Pages.

Live URL (after setup): **https://gorchakovfund.github.io/negotiation-room/**

## Current status: Stage 1, clickable skeleton

Every screen is clickable, with placeholder text. What does **not** work yet:

| Not yet | Arrives in |
|---|---|
| Cases loaded from `data/*.json` (currently `js/placeholder-data.js`) | Stage 2 |
| Case sealed in the browser; refresh returns to the same case | Stage 3 |
| Variant tied to the application ID; real Case ID with check character | Stage 4 |
| Dossier-style PDF print | Stage 5 |
| Final visual design, reveal animations | Stage 6 |
| Russian | Stage 7 |
| Organizer / test mode (`?mode=test`) | Stage 8 |

The **Restart prototype** button in the footer exists only for testing Stage 1.

## Publish on GitHub Pages (one-time, about 5 minutes)

1. Sign in to GitHub as **gorchakovfund** and create a new **public** repository named `negotiation-room` (no README).
2. On the new repository page, click **uploading an existing file**.
3. Unzip `negotiation-room.zip` on your computer, open the folder, select **everything inside it** (`index.html`, `css`, `js`, `data`, `README.md`) and drag it into the browser. Click **Commit changes**.
4. Go to **Settings → Pages**. Under *Build and deployment*, set **Source: Deploy from a branch**, **Branch: main**, folder **/ (root)**, and click **Save**.
5. Wait 1–2 minutes and open https://gorchakovfund.github.io/negotiation-room/

To update later: open a file on GitHub, click the pencil icon, edit, and commit. The site updates within about a minute.

## Run locally

Opening `index.html` by double-clicking will not work (browsers block JavaScript modules from `file://`). Instead, in the project folder run:

```
python3 -m http.server 8000
```

and open http://localhost:8000

## Settings

`js/config.js` holds the application ID format (`DF-2026-000001`) and the application form link. **The form link is a placeholder**; set the real public URL before launch.
