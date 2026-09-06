const menuBtn = document.querySelector('[data-menu]');
const nav = document.querySelector('[data-nav]');
if (menuBtn && nav) {
  menuBtn.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(isOpen));
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded','false');
  }));
}

const eventList = document.querySelector('[data-events]');
if (eventList) {
  const API_URL = "https://hahlskog-admin-api.jens-ahlskog.workers.dev";
  const lang = document.documentElement.lang === 'sv' ? 'sv' : 'fi';
  const fallbackUrl = lang === 'sv' ? '../data/events.json' : 'data/events.json';

  const monthNames = {
    fi: ['TAMMI','HELMI','MAALIS','HUHTI','TOUKO','KESÄ','HEINÄ','ELO','SYYS','LOKA','MARRAS','JOULU'],
    sv: ['JAN','FEB','MARS','APRIL','MAJ','JUNI','JULI','AUG','SEP','OKT','NOV','DEC']
  };
  const weekdayNames = {
    fi: ['Su','Ma','Ti','Ke','To','Pe','La'],
    sv: ['Sön','Mån','Tis','Ons','Tor','Fre','Lör']
  };

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  function normalize(event) {
    return {
      id: event.id || '',
      date: event.date || '',
      startTime: event.startTime || (event.time ? String(event.time).split(/[–-]/)[0].trim() : ''),
      endTime: event.endTime || (event.time ? String(event.time).split(/[–-]/)[1]?.trim() || '' : ''),
      titleFi: event.titleFi ?? event.title?.fi ?? '',
      titleSv: event.titleSv ?? event.title?.sv ?? '',
      placeFi: event.placeFi ?? event.place?.fi ?? '',
      placeSv: event.placeSv ?? event.place?.sv ?? '',
      descriptionFi: event.descriptionFi ?? event.description?.fi ?? '',
      descriptionSv: event.descriptionSv ?? event.description?.sv ?? '',
      link: event.link || ''
    };
  }

  function isUpcoming(event) {
    if (!event.date) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const d = new Date(`${event.date}T12:00:00`);
    return !Number.isNaN(d.getTime()) && d >= today;
  }

  function render(events) {
    const upcoming = events.map(normalize)
      .filter(isUpcoming)
      .sort((a, b) =>
        `${a.date}T${a.startTime || '00:00'}`.localeCompare(
          `${b.date}T${b.startTime || '00:00'}`
        )
      );

    if (!upcoming.length) return;

    eventList.innerHTML = upcoming.map(event => {
      const date = new Date(`${event.date}T12:00:00`);
      const day = date.getDate();
      const month = monthNames[lang][date.getMonth()];
      const weekday = weekdayNames[lang][date.getDay()];
      const dateText = `${day}.${date.getMonth() + 1}.${date.getFullYear()}`;
      const timePrefix = lang === 'sv' ? 'kl.' : 'klo';
      const time = [event.startTime, event.endTime].filter(Boolean).join('–');
      const title = lang === 'sv' ? event.titleSv : event.titleFi;
      const place = lang === 'sv' ? event.placeSv : event.placeFi;
      const description = lang === 'sv' ? event.descriptionSv : event.descriptionFi;
      const linkText = lang === 'sv' ? 'Mer information →' : 'Lisätietoja →';
      const link = event.link
        ? `<p><a class="article-link" href="${esc(event.link)}" target="_blank" rel="noopener">${linkText}</a></p>`
        : '';

      return `<article class="event-card">
        <div class="date-block"><span class="day">${day}</span>${esc(month)}</div>
        <div>
          <div class="event-meta">${esc(weekday)} ${esc(dateText)}${time ? ` ${timePrefix} ${esc(time)}` : ''}${place ? ` · ${esc(place)}` : ''}</div>
          <h3>${esc(title)}</h3>
          ${description ? `<p>${esc(description)}</p>` : ''}
          ${link}
        </div>
      </article>`;
    }).join('');
  }

  fetch(`${API_URL}/api/events`, { headers: { Accept: 'application/json' } })
    .then(response => {
      if (!response.ok) throw new Error('API error');
      return response.json();
    })
    .then(render)
    .catch(() => {
      fetch(fallbackUrl)
        .then(response => {
          if (!response.ok) throw new Error('Fallback error');
          return response.json();
        })
        .then(render)
        .catch(() => {
          // Keep the HTML fallback visible.
        });
    });
}
