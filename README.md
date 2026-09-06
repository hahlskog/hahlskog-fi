# hahlskog.fi – GitHub Pages + admin-pohja

Tämä paketti on tarkoitettu GitHub Pagesissa julkaistavaan `hahlskog-fi`-repositoryyn.

## Mukana

- `index.html` – suomenkielinen sivu
- `sv/index.html` – ruotsinkielinen sivu
- `assets/` – sivuston tyylit ja JavaScript
- `data/events.json` – tapahtumalista (tässä versiossa tyhjä)
- `admin/` – tapahtumahallinnan käyttöliittymäpohja
- `.nojekyll` – GitHub Pagesia varten

## Tapahtumat

Tässä paketissa ei ole valmiiksi julkaistuja tapahtumia. `data/events.json` sisältää tyhjän listan `[]`.
Kun turvallinen admin-kirjautuminen ja tallennus on kytketty, tapahtumat syötetään hallintapaneelista.

## Admin

Admin-pohja löytyy osoitteesta `/admin/`. Nykyisessä paketissa kirjautuminen ja julkaiseminen on tarkoituksella pois käytöstä. Salasanaa ei pidä koskaan tallentaa HTML-, JavaScript- tai GitHub-tiedostoihin.

Seuraava vaihe on kytkeä admin turvalliseen taustapalveluun (esim. Cloudflare Worker), joka hoitaa autentikoinnin ja `events.json`-tiedoston päivittämisen.
