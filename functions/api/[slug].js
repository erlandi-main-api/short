export async function onRequestGet({ params, env }) {
  const slug = params.slug;
  const target = await env.LINKS.get(slug);
  if (!target) return new Response("Not found", { status: 404 });
  return Response.redirect(target, 302);
}
