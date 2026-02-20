export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API: buat shortlink
    if (url.pathname === "/api/new" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const longUrl = (body.url || "").trim();
      let slug = (body.slug || "").trim();

      if (!isValidHttpUrl(longUrl)) {
        return json({ error: "invalid_url" }, 400);
      }

      // auto slug kalau kosong
      if (!slug) slug = randomSlug(6);

      // cek slug sudah dipakai
      const exists = await env.LINKS.get(slug);
      if (exists) return json({ error: "slug_exists" }, 409);

      // simpan
      await env.LINKS.put(slug, longUrl);

      const base = `${url.protocol}//${url.host}`;
      return json({ slug, target: longUrl, short: `${base}/${slug}` }, 201);
    }

    // Redirect: /{slug}
    const slug = url.pathname.replace(/^\/+/, "");
    if (!slug || slug.startsWith("api")) {
      return new Response("Not found", { status: 404 });
    }

    const target = await env.LINKS.get(slug);
    if (!target) return new Response("Not found", { status: 404 });

    return Response.redirect(target, 302);
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function isValidHttpUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function randomSlug(len) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
