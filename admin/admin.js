const API_URL = "https://hahlskog-admin-api.jens-ahlskog.workers.dev";

const loginView = document.getElementById("login-view");
const panelView = document.getElementById("panel-view");
const loginForm = document.getElementById("login-form");
const tokenInput = document.getElementById("token");
const loginMessage = document.getElementById("login-message");
const panelMessage = document.getElementById("panel-message");
const eventForm = document.getElementById("event-form");
const eventList = document.getElementById("event-list");
const logoutButton = document.getElementById("logout");
const refreshButton = document.getElementById("refresh");
const cancelEditButton = document.getElementById("cancel-edit");
const saveButton = document.getElementById("save-button");
const formTitle = document.getElementById("form-title");

let token = sessionStorage.getItem("hahlskogAdminToken") || "";
let events = [];

function showMessage(el, text, kind = "error") {
  el.textContent = text;
  el.className = `notice ${kind}`;
  el.hidden = false;
}

function hideMessage(el) {
  el.hidden = true;
  el.textContent = "";
}

function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${API_URL}${path}`, { ...options, headers });
}

async function verifyToken(candidate) {
  token = candidate;
  const response = await api("/api/admin/verify");
  if (!response.ok) {
    token = "";
    throw new Error("Väärä admin-avain.");
  }
  return true;
}

function openPanel() {
  loginView.hidden = true;
  panelView.hidden = false;
  loadEvents();
}

function closePanel() {
  token = "";
  sessionStorage.removeItem("hahlskogAdminToken");
  panelView.hidden = true;
  loginView.hidden = false;
  tokenInput.value = "";
  resetForm();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideMessage(loginMessage);
  const candidate = tokenInput.value.trim();
  if (!candidate) return;

  const button = loginForm.querySelector("button");
  button.disabled = true;
  button.textContent = "Kirjaudutaan…";

  try {
    await verifyToken(candidate);
    sessionStorage.setItem("hahlskogAdminToken", candidate);
    openPanel();
  } catch (err) {
    showMessage(loginMessage, err.message || "Kirjautuminen epäonnistui.");
  } finally {
    button.disabled = false;
    button.textContent = "Kirjaudu sisään";
  }
});

logoutButton.addEventListener("click", closePanel);
refreshButton.addEventListener("click", loadEvents);
cancelEditButton.addEventListener("click", resetForm);

function value(id) {
  return document.getElementById(id).value.trim();
}

function setValue(id, val) {
  document.getElementById(id).value = val || "";
}

function eventPayload() {
  return {
    date: value("date"),
    startTime: value("startTime"),
    endTime: value("endTime"),
    titleFi: value("titleFi"),
    titleSv: value("titleSv"),
    placeFi: value("placeFi"),
    placeSv: value("placeSv"),
    descriptionFi: value("descriptionFi"),
    descriptionSv: value("descriptionSv"),
    link: value("link")
  };
}

function resetForm() {
  eventForm.reset();
  setValue("event-id", "");
  formTitle.textContent = "Lisää tapahtuma";
  saveButton.textContent = "Julkaise tapahtuma";
  cancelEditButton.hidden = true;
  hideMessage(panelMessage);
}

eventForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideMessage(panelMessage);

  const id = value("event-id");
  const payload = eventPayload();

  saveButton.disabled = true;
  saveButton.textContent = id ? "Tallennetaan…" : "Julkaistaan…";

  try {
    const response = await api(
      id ? `/api/events/${encodeURIComponent(id)}` : "/api/events",
      {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload)
      }
    );

    if (response.status === 401) {
      closePanel();
      showMessage(loginMessage, "Istunto ei ole enää voimassa. Kirjaudu uudelleen.");
      return;
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Tallennus epäonnistui.");
    }

    resetForm();
    showMessage(panelMessage, id ? "Tapahtuma päivitetty." : "Tapahtuma julkaistu.", "success");
    await loadEvents();
  } catch (err) {
    showMessage(panelMessage, err.message || "Tallennus epäonnistui.");
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = value("event-id") ? "Tallenna muutokset" : "Julkaise tapahtuma";
  }
});

async function loadEvents() {
  eventList.innerHTML = '<div class="empty">Ladataan tapahtumia…</div>';
  try {
    const response = await api("/api/events");
    if (!response.ok) throw new Error("Tapahtumia ei voitu ladata.");
    events = await response.json();
    renderEvents();
  } catch (err) {
    eventList.innerHTML = "";
    const box = document.createElement("div");
    box.className = "empty";
    box.textContent = err.message || "Tapahtumia ei voitu ladata.";
    eventList.appendChild(box);
  }
}

function renderEvents() {
  eventList.innerHTML = "";

  const sorted = [...events].sort((a, b) =>
    `${a.date || ""}T${a.startTime || "00:00"}`.localeCompare(
      `${b.date || ""}T${b.startTime || "00:00"}`
    )
  );

  if (!sorted.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Ei vielä julkaistuja tapahtumia.";
    eventList.appendChild(empty);
    return;
  }

  sorted.forEach((item) => {
    const card = document.createElement("article");
    card.className = "admin-event";

    const copy = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = item.titleFi || "(Nimetön tapahtuma)";

    const meta = document.createElement("div");
    meta.className = "event-meta";
    const time = [item.startTime, item.endTime].filter(Boolean).join("–");
    meta.textContent = [item.date, time, item.placeFi].filter(Boolean).join(" · ");

    const sv = document.createElement("div");
    sv.className = "event-secondary";
    sv.textContent = item.titleSv || "";

    copy.append(title, meta, sv);

    const actions = document.createElement("div");
    actions.className = "event-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "button button-light";
    edit.textContent = "Muokkaa";
    edit.addEventListener("click", () => editEvent(item));

    const del = document.createElement("button");
    del.type = "button";
    del.className = "button button-danger";
    del.textContent = "Poista";
    del.addEventListener("click", () => deleteEvent(item));

    actions.append(edit, del);
    card.append(copy, actions);
    eventList.appendChild(card);
  });
}

function editEvent(item) {
  setValue("event-id", item.id);
  setValue("date", item.date);
  setValue("startTime", item.startTime);
  setValue("endTime", item.endTime);
  setValue("titleFi", item.titleFi);
  setValue("titleSv", item.titleSv);
  setValue("placeFi", item.placeFi);
  setValue("placeSv", item.placeSv);
  setValue("descriptionFi", item.descriptionFi);
  setValue("descriptionSv", item.descriptionSv);
  setValue("link", item.link);
  formTitle.textContent = "Muokkaa tapahtumaa";
  saveButton.textContent = "Tallenna muutokset";
  cancelEditButton.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteEvent(item) {
  if (!confirm(`Poistetaanko tapahtuma "${item.titleFi || ""}"?`)) return;

  hideMessage(panelMessage);
  try {
    const response = await api(`/api/events/${encodeURIComponent(item.id)}`, {
      method: "DELETE"
    });

    if (response.status === 401) {
      closePanel();
      showMessage(loginMessage, "Istunto ei ole enää voimassa. Kirjaudu uudelleen.");
      return;
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Poisto epäonnistui.");
    }

    showMessage(panelMessage, "Tapahtuma poistettu.", "success");
    await loadEvents();
  } catch (err) {
    showMessage(panelMessage, err.message || "Poisto epäonnistui.");
  }
}

if (token) {
  verifyToken(token)
    .then(openPanel)
    .catch(() => {
      sessionStorage.removeItem("hahlskogAdminToken");
      token = "";
    });
}
