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
  const lang = document.documentElement.lang === 'sv' ? 'sv' : 'fi';
  const eventsUrl = lang === 'sv' ? '../data/events.json' : 'data/events.json';
  const monthNames = {
    fi: ['TAMMI','HELMI','MAALIS','HUHTI','TOUKO','KESÄ','HEINÄ','ELO','SYYS','LOKA','MARRAS','JOULU'],
    sv: ['JAN','FEB','MARS','APRIL','MAJ','JUNI','JULI','AUG','SEP','OKT','NOV','DEC']
  };
  const weekdayNames = {
    fi: ['Su','Ma','Ti','Ke','To','Pe','La'],
    sv: ['Sön','Mån','Tis','Ons','Tor','Fre','Lör']
  };

  fetch(eventsUrl)
    .then(response => {
      if (!response.ok) throw new Error('Events could not be loaded');
      return response.json();
    })
    .then(events => {
      const upcoming = events
        .filter(event => event && event.date)
        .sort((a, b) => a.date.localeCompare(b.date));

      if (!upcoming.length) return;

      eventList.innerHTML = upcoming.map(event => {
        const date = new Date(`${event.date}T12:00:00`);
        const day = date.getDate();
        const month = monthNames[lang][date.getMonth()];
        const weekday = weekdayNames[lang][date.getDay()];
        const dateText = `${day}.${date.getMonth() + 1}.${date.getFullYear()}`;
        const timePrefix = lang === 'sv' ? 'kl.' : 'klo';
        const title = event.title?.[lang] || '';
        const place = event.place?.[lang] || '';
        const description = event.description?.[lang] || '';

        return `<article class="event-card">
          <div class="date-block"><span class="day">${day}</span>${month}</div>
          <div>
            <div class="event-meta">${weekday} ${dateText} ${timePrefix} ${event.time} · ${place}</div>
            <h3>${title}</h3>
            <p>${description}</p>
          </div>
        </article>`;
      }).join('');
    })
    .catch(() => {
      // Keep the HTML fallback visible if the event file cannot be loaded.
    });
}
