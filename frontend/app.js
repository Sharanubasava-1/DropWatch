const params = new URLSearchParams(window.location.search);
const API =
  params.get("api") || "http://localhost:3001/api/releases";

const rowsEl = document.getElementById("rows");
const emptyEl = document.getElementById("empty");
const metaEl = document.getElementById("meta");
let chart;

function fmtTime(isoOrUnix) {
  if (!isoOrUnix) return "unknown";
  if (typeof isoOrUnix === "number") {
    return new Date(isoOrUnix * 1000).toLocaleString();
  }
  return new Date(isoOrUnix).toLocaleString();
}

async function load() {
  const res = await fetch(API);
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  const items = data.items || [];

  metaEl.textContent = `Last refresh: ${fmtTime(
    data.last_fetched_at || data.generated_at
  )}`;

  rowsEl.innerHTML = items
    .map(
      (item) => `
      <tr>
        <td>${item.rank}</td>
        <td><a href="${item.top_url || "#"}" target="_blank" rel="noreferrer">${item.model_name}</a></td>
        <td>${item.summary || ""}</td>
        <td>${Number(item.velocity || 0).toFixed(0)}</td>
        <td>${item.mention_count || 0}</td>
        <td><span class="chip">${item.top_source || "—"}</span></td>
      </tr>`
    )
    .join("");

  emptyEl.classList.toggle("hidden", items.length > 0);

  const top = items.slice(0, 8);
  const ctx = document.getElementById("chart");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: top.map((i) => i.model_name),
      datasets: [
        {
          label: "Velocity",
          data: top.map((i) => i.velocity),
          backgroundColor: "#7c9cff",
        },
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#93a0bf" }, grid: { color: "#243056" } },
        y: { ticks: { color: "#93a0bf" }, grid: { color: "#243056" } },
      },
    },
  });
}

load().catch((err) => {
  metaEl.textContent = err.message;
  emptyEl.classList.remove("hidden");
});
