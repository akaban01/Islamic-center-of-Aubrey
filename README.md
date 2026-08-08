# Islamic Center of Aubrey — website

A static website for the **Islamic Center of Aubrey (ICA)**, a 501(c)(3) non-profit
masjid at 26875 US Highway 380 E, Suite 100, Aubrey, TX 76227.

Live site (once Pages is enabled): <https://akaban01.github.io/Islamic-center-of-Aubrey/>

## What's here

Plain HTML, CSS and one JavaScript file — no framework, no build step. Edit the
`.html` files directly and push.

```
index.html          Home — hero, live prayer times, mission, programs, donate, map
about.html          History timeline, mission, board of trustees, Imam, admin
prayers.html        Daily times, Jumu'ah, parking guidance, Eid/janazah/Taraweeh
education.html      Maktab, Sunday School, Tajweed, Fiqh, Hifz, FAQs
services.html       Social services, nikah, counseling, professional training
get-involved.html   Six committees, volunteering, full membership terms
contact.html        Contact details, map, email directory
assets/css/site.css Design system (light + dark theme)
assets/js/site.js   Nav, theme toggle, prayer times + countdown
```

## Where the content comes from

Every fact on the site — addresses, phone number, email addresses, Jumu'ah
timings, parking rules, class schedules and tuition, instructor and board
member names, membership terms and ZIP codes, donation links — is taken from
the center's own published material at [aubreymasjid.org](https://www.aubreymasjid.org/).
Nothing is invented. Forms and payments link out to the center's existing
providers (Zeffy, Madina Apps, Google appointment scheduling).

## Prayer times

`assets/js/site.js` fetches a monthly prayer calendar from the free
[Aladhan API](https://aladhan.com/prayer-times-api) for the masjid's
coordinates (33.2204958, −96.9078617) using the **ISNA** calculation method,
caches it in `localStorage`, and runs a live countdown to the next prayer in
`America/Chicago`.

These are **calculated adhan times, not iqamah times** — the site says so
explicitly wherever times are shown, because ICA does not publish iqamah times
online. If the center starts publishing iqamah times, replace the widget's data
source with them.

Jumu'ah timings are hard-coded because they are fixed and published:
1st khutbah 1:35 PM / salah 1:50 PM, 2nd khutbah 2:30 PM / salah 2:45 PM.

## Deploying

`.github/workflows/pages.yml` builds and deploys on every push. It needs Pages
turned on once:

**Settings → Pages → Build and deployment → Source: _GitHub Actions_**

Then re-run the workflow (Actions → Deploy to GitHub Pages → Run workflow).

If you later point a custom domain at the site, add a `CNAME` file containing
the domain and update `SITE` references in `sitemap.xml`, `robots.txt`, and the
`<link rel="canonical">` / Open Graph tags in each page.

## Editing notes

- Colours, spacing and typography live as CSS custom properties at the top of
  `assets/css/site.css`. The accent `#d0ba96` is ICA's existing brand sand.
- Light and dark themes are both defined; the toggle in the header stores a
  preference in `localStorage`, and the system preference is respected otherwise.
- Fonts are Cinzel (display) and Poppins (body) — the same pair the center
  already uses — loaded from Google Fonts.
- The map is an OpenStreetMap embed, so there is no API key to manage.
