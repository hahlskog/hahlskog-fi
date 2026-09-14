const API_URL = "https://hahlskog-admin-api.jens-ahlskog.workers.dev";
const menuButton = document.querySelector("[data-menu]");
const navigation = document.querySelector("[data-nav]");
if (menuButton && navigation) {
  menuButton.addEventListener("click", () => {
    const open = navigation.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
  });
  navigation.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    navigation.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  }));
}
function formatDate(value, lang) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(lang === "sv" ? "sv-FI" : "fi-FI", { day: "numeric", month: "long", year: "numeric" }).format(date);
}
function safeLink(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}
function renderEvents(container, events, lang) {
  container.innerHTML = "";
  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = events.filter(item => {
    if (!item.date) return false;
    const d = new Date(`${item.date}T12:00:00`);
    return !Number.isNaN(d.getTime()) && d >= today;
  }).sort((a,b) => `${a.date}T${a.startTime || "00:00"}`.localeCompare(`${b.date}T${b.startTime || "00:00"}`));
  if (!upcoming.length) {
    const empty = document.createElement("div"); empty.className = "empty-events";
    empty.textContent = lang === "sv" ? "Kommande evenemang publiceras snart." : "Tulevia tapahtumia lisätään pian.";
    container.appendChild(empty); return;
  }
  upcoming.forEach(item => {
    const card = document.createElement("article"); card.className = "event-card";
    const date = document.createElement("div"); date.className = "event-date"; date.textContent = formatDate(item.date, lang);
    const title = document.createElement("h3"); title.textContent = lang === "sv" ? item.titleSv : item.titleFi;
    const metaParts = [];
    const time = [item.startTime, item.endTime].filter(Boolean).join("–"); if (time) metaParts.push(time);
    const place = lang === "sv" ? item.placeSv : item.placeFi; if (place) metaParts.push(place);
    const meta = document.createElement("div"); meta.className = "event-meta"; meta.textContent = metaParts.join(" · ");
    const description = lang === "sv" ? item.descriptionSv : item.descriptionFi;
    card.append(date, title); if (meta.textContent) card.append(meta);
    if (description) { const p = document.createElement("p"); p.textContent = description; card.append(p); }
    const href = safeLink(item.link); if (href) { const a = document.createElement("a"); a.className = "article-link"; a.href = href; a.target = "_blank"; a.rel = "noopener"; a.textContent = lang === "sv" ? "Mer information →" : "Lisätietoja →"; card.append(a); }
    container.appendChild(card);
  });
}
async function loadEvents() {
  const containers = [...document.querySelectorAll("[data-events]")]; if (!containers.length) return;
  const lang = document.documentElement.lang === "sv" ? "sv" : "fi";
  try {
    const response = await fetch(`${API_URL}/api/events`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("Request failed");
    renderEvents(containers[0], await response.json(), lang);
  } catch {
    containers.forEach(container => { container.innerHTML = `<div class="empty-events">${lang === "sv" ? "Evenemangen kunde inte laddas just nu." : "Tapahtumia ei voitu ladata juuri nyt."}</div>`; });
  }
}
loadEvents();
