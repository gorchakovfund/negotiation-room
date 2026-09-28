# The Negotiation Room

An interactive negotiation case for applicants to **Dialogue for the Future 2026**.
Static site (HTML, CSS, JavaScript, no build step), hosted on GitHub Pages.

Live URL (after setup): **https://gorchakovfund.github.io/negotiation-room/**

## Current status

- Every screen is clickable, in English and Russian (EN / RU switch at the top right, works on any screen).
- The 12 draft cases are in `data/situations.json`. Each one has a context, 4 parties (each with a public position and a constraint), and 2 role-and-development variants.
- **Organisers' review page:** `review.html` (https://gorchakovfund.github.io/negotiation-room/review.html) shows all 12 cases and 24 variants on one page (add `?lang=ru` for Russian). It is not linked from the applicant site, but anyone with the address can open it.

| Not yet | Arrives in |
|---|---|
| Case sealed in the browser; refreshing returns to the same case | Stage 3 |
| Variant tied to the application ID; real Case ID with check character | Stage 4 |
| Dossier-style PDF print | Stage 5 |
| Final visual design, reveal animations | Stage 6 |
| Organiser / test mode (`?mode=test`), data validator | Stage 8 |

The **Restart prototype** button in the footer is for testing only.

## Editing a case

Open `data/situations.json` on GitHub, click the pencil icon, change the text between the quotation marks, and commit. Every text has an `"en"` and a `"ru"` version; edit both. Interface text (buttons, headings) is in `data/ui-text.json`. Keep the quotation marks, commas and brackets exactly as they are. If the site shows "The case files could not be loaded", a comma or quotation mark was probably removed; undo the last commit.

## Publish on GitHub Pages (one-time, about 5 minutes)

1. Sign in to GitHub as **gorchakovfund** and create a new **public** repository named `negotiation-room` (no README).
2. On the new repository page, click **uploading an existing file**.
3. Unzip `negotiation-room.zip` on your computer, open the folder, select **everything inside it** (`index.html`, `review.html`, `css`, `js`, `data`, `README.md`) and drag it into the browser. Click **Commit changes**.
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
