export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const longUrl = (body.url || "").trim();
  let slug = (body.slug || "").trim();

  if (!isValidHttpUrl(longUrl)) return json({ error: "invalid_url" }, 400);

  if (slug) {
    if (!isValidSlug(slug)) return json({ error: "invalid_slug" }, 400);
    const exists = await env.LINKS.get(slug);
    if (exists) return json({ error: "slug_exists" }, 409);
  } else {
    slug = await generateAutoSlug(env);
  }

  await env.LINKS.put(slug, longUrl);

  const u = new URL(request.url);
  const base = `${u.protocol}//${u.host}`;
  return json({ slug, target: longUrl, short: `${base}/${slug}` }, 201);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function isValidSlug(s) {
  return /^[a-zA-Z0-9_-]{2,40}$/.test(s);
}

function isValidHttpUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Auto slug deterministik pakai counter di KV:
 * COUNTER key: "n" -> increment sederhana (best effort)
 */
async function generateAutoSlug(env) {
  // kalau kamu belum bikin KV COUNTER, fallback random
  if (!env.COUNTER) return randomSlug(6);

  const key = "n";
  const cur = Number((await env.COUNTER.get(key)) || "0") + 1;
  await env.COUNTER.put(key, String(cur));

  // encode base62 biar pendek
  return toBase62(cur);
}

function randomSlug(len) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

function toBase62(num) {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (num === 0) return "0";
  let n = num, out = "";
  while (n > 0) {
    out = chars[n % 62] + out;
    n = Math.floor(n / 62);
  }
  return out;
}
