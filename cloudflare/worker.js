const ALLOWED_ORIGINS = new Set([
  "https://hahlskog.fi",
  "https://www.hahlskog.fi",
  "https://hahlskog.github.io"
]);

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin"
  };
  if (ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function json(data, status, request, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(request),
      ...extra
    }
  });
}

function authorized(request, env) {
  const auth = request.headers.get("Authorization");
  return Boolean(env.ADMIN_TOKEN) && auth === `Bearer ${env.ADMIN_TOKEN}`;
}

function cleanText(value, max = 2000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function cleanEvent(body) {
  return {
    date: cleanText(body.date, 10),
    startTime: cleanText(body.startTime, 5),
    endTime: cleanText(body.endTime, 5),
    titleFi: cleanText(body.titleFi, 160),
    titleSv: cleanText(body.titleSv, 160),
    placeFi: cleanText(body.placeFi, 200),
    placeSv: cleanText(body.placeSv, 200),
    descriptionFi: cleanText(body.descriptionFi, 2000),
    descriptionSv: cleanText(body.descriptionSv, 2000),
    link: cleanText(body.link, 1000)
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = corsHeaders(request);
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      if (origin && !ALLOWED_ORIGINS.has(origin)) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, { status: 204, headers });
    }

    if (url.pathname === "/api/events" && request.method === "GET") {
      const events =
        (await env.EVENTS_KV.get("events", { type: "json" })) || [];

      events.sort((a, b) =>
        `${a.date}T${a.startTime || "00:00"}`.localeCompare(
          `${b.date}T${b.startTime || "00:00"}`
        )
      );

      return json(events, 200, request, {
        "Cache-Control": "public, max-age=60"
      });
    }

    if (url.pathname === "/api/admin/verify" && request.method === "GET") {
      if (!authorized(request, env)) {
        return json({ error: "Unauthorized" }, 401, request, {
          "Cache-Control": "no-store"
        });
      }
      return json({ ok: true }, 200, request, {
        "Cache-Control": "no-store"
      });
    }

    if (!authorized(request, env)) {
      return json({ error: "Unauthorized" }, 401, request, {
        "Cache-Control": "no-store"
      });
    }

    if (url.pathname === "/api/events" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400, request);
      }

      const event = cleanEvent(body);
      if (!event.date || !event.titleFi || !event.titleSv) {
        return json(
          { error: "Päivämäärä sekä FI- ja SV-otsikot ovat pakollisia." },
          400,
          request
        );
      }

      const events =
        (await env.EVENTS_KV.get("events", { type: "json" })) || [];

      const newEvent = {
        ...event,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      };

      events.push(newEvent);
      await env.EVENTS_KV.put("events", JSON.stringify(events));

      return json(newEvent, 201, request, { "Cache-Control": "no-store" });
    }

    if (url.pathname.startsWith("/api/events/") && request.method === "PUT") {
      const id = decodeURIComponent(url.pathname.split("/").pop());
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400, request);
      }

      const update = cleanEvent(body);
      if (!update.date || !update.titleFi || !update.titleSv) {
        return json(
          { error: "Päivämäärä sekä FI- ja SV-otsikot ovat pakollisia." },
          400,
          request
        );
      }

      const events =
        (await env.EVENTS_KV.get("events", { type: "json" })) || [];

      const index = events.findIndex((event) => event.id === id);
      if (index === -1) {
        return json({ error: "Event not found" }, 404, request);
      }

      events[index] = {
        ...events[index],
        ...update,
        id,
        updatedAt: new Date().toISOString()
      };

      await env.EVENTS_KV.put("events", JSON.stringify(events));
      return json(events[index], 200, request, { "Cache-Control": "no-store" });
    }

    if (url.pathname.startsWith("/api/events/") && request.method === "DELETE") {
      const id = decodeURIComponent(url.pathname.split("/").pop());

      const events =
        (await env.EVENTS_KV.get("events", { type: "json" })) || [];

      const filtered = events.filter((event) => event.id !== id);
      if (filtered.length === events.length) {
        return json({ error: "Event not found" }, 404, request);
      }

      await env.EVENTS_KV.put("events", JSON.stringify(filtered));
      return json({ success: true }, 200, request, { "Cache-Control": "no-store" });
    }

    return json({ error: "Not found" }, 404, request);
  }
};
