# hahlskog.fi – ensimmäinen sivustoversio

Tämä paketti on valmis julkaistavaksi Cloudflare Pagesissa suoraan repositoryn juuresta.

## Tiedostot

- `index.html` – suomenkielinen sivu
- `sv/index.html` – ruotsinkielinen sivu
- `assets/styles.css` – ulkoasu
- `assets/site.js` – mobiilivalikko
- `data/events.json` – tapahtumatietojen pohja myöhempää CMS-kytkentää varten

## GitHubiin vienti selaimella

1. Avaa `hahlskog-fi` repository GitHubissa.
2. Valitse **Add file → Upload files**.
3. Pura ZIP ensin puhelimella/tietokoneella.
4. Lataa repositoryn juureen **paketin sisällä olevat tiedostot ja kansiot**, ei ulommaista `hahlskog-fi-site`-kansiota.
5. Commit message: `Add first website version`
6. Valitse **Commit changes**.

Cloudflare Pages julkaisee muutoksen automaattisesti.

## Seuraavat vaiheet

- Hanna-Lean oikeat valokuvat
- lopulliset kampanjatekstit FI/SV
- sähköposti- ja someosoitteet
- oikea KD-logo
- `/admin`-sisällönhallinta
- tapahtumien automaattinen listaus
- UusiSuomi-kirjoitusten mahdollinen automaattinen haku
- hahlskog.fi-domainin liittäminen Cloudflare Pagesiin
