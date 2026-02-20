const btn = document.getElementById("btn");
const out = document.getElementById("out");
const json = document.getElementById("json");
const link = document.getElementById("link");

btn.onclick = async () => {
  const url = document.getElementById("url").value.trim();
  const slug = document.getElementById("slug").value.trim();

  out.hidden = true;
  json.textContent = "";

  const res = await fetch("/api/new", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url, slug })
  });

  const data = await res.json().catch(() => ({}));
  json.textContent = JSON.stringify(data, null, 2);
  out.hidden = false;

  if (data?.short) {
    link.href = data.short;
    link.textContent = data.short;
  } else {
    link.removeAttribute("href");
    link.textContent = "(gagal)";
  }
};
