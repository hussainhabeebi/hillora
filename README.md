# Hillora Tales Vagamon — booking website

A static, mobile-friendly website for Hillora Tales Vagamon. Guests browse the four stays, choose dates and guests, pick a stay, and review an indicative estimate. Then they tap **Confirm & continue on WhatsApp**, which opens WhatsApp (+91 98467 96773) with the full booking request already written. The team confirms availability, the final amount and payment on WhatsApp.

## Files
- `index.html` — page structure and copy
- `styles.css` — theme (forest green / ivory / gold from the logo)
- `data.js` — **edit this** to change stays, photos (Google Drive file IDs), capacities, rates, WhatsApp number
- `app.js` — gallery, lightbox and the 3-step booking flow
- `assets/logo.png` — logo

## Photos
Photos load from Google Drive by file ID. Each file must be shared as **"Anyone with the link can view"**, or it shows a green placeholder.

## Rates
The estimate uses ₹4,500 for weekday nights and ₹5,200 for Friday and Saturday nights, per unit. It is labelled **indicative**. Holidays, extra-guest charges (₹900/person, to be confirmed), taxes and dinner are not included. The team confirms the final amount on WhatsApp.

## Hosting
No build step is needed. Serve the folder with any static host (GitHub Pages, Netlify, Vercel, cPanel). To test locally, run `python3 -m http.server` and open http://localhost:8000.

## SEO
- Title, description and Open Graph tags target "resort in Vagamon, Kerala".
- `Resort` and `FAQPage` structured data (JSON-LD) are in `index.html`.
- Canonical URL, `sitemap.xml` and `robots.txt` point to https://hilloratales.com/. Submit the sitemap in Google Search Console.
- A Google Business Profile for "Hillora Tales Vagamon" will do the most for local "resort in Kerala" searches.
