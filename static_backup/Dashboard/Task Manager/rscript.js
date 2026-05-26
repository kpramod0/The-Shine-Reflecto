/* ---------------- DEMO DATA (swap with API when ready) ---------------- */
const DATA = [
  // Requests
  {
    id: 1,
    date: "2025-09-01",
    type: "REQUEST",
    requestedBy: "WORKER",
    client: "Acme Corp",
    checkIn: "09:12",
    checkOut: "09:55",
    feedback: "OK",
    resolution: "Done",
    rating: 4,
    request: {
      reason: "Need extra pads",
      resolutionProvided: true,
      images: ["https://picsum.photos/seed/pad/140/90"]
    }
  },
  {
    id: 2,
    date: "2025-09-03",
    type: "REQUEST",
    requestedBy: "CLIENT",
    client: "BlueStone",
    checkIn: "10:05",
    checkOut: "10:45",
    feedback: "Urgent",
    resolution: "Pending",
    rating: 2,
    request: {
      reason: "Stain in lobby",
      resolutionProvided: false,
      images: ["https://picsum.photos/seed/stain/140/90"]
    }
  },

  // Property Round
  {
    id: 3,
    date: "2025-09-05",
    type: "PROPERTY_ROUND",
    requestedBy: "ADMIN",
    client: "Acme Corp",
    checkIn: "11:00",
    checkOut: "11:40",
    feedback: "",
    resolution: "Done",
    rating: 5,
    round: [
      { sn: 1, area: "Entrance", condition: "Good", image: "https://picsum.photos/seed/entrance/140/90" },
      { sn: 2, area: "Corridor", condition: "Average", image: "https://picsum.photos/seed/corridor/140/90" }
    ]
  },

  // Site Visit
  {
    id: 4,
    date: "2025-09-08",
    type: "SITE_VISIT",
    requestedBy: "ADMIN",
    client: "BlueStone",
    checkIn: "12:00",
    checkOut: "12:50",
    feedback: "Overall clean",
    resolution: "Done",
    rating: 4,
    siteVisit: {
      overallRemark: "Meets standards",
      areas: [
        { sn: 1, area: "Lobby", condition: "Good", image: "https://picsum.photos/seed/lobby/140/90" },
        { sn: 2, area: "Lift", condition: "Good", image: "https://picsum.photos/seed/lift/140/90" }
      ]
    }
  },

  // Monthly Round
  {
    id: 5,
    date: "2025-09-12",
    type: "MONTHLY_ROUND",
    requestedBy: "ADMIN",
    client: "GreenField",
    checkIn: "10:30",
    checkOut: "11:35",
    feedback: "",
    resolution: "Done",
    rating: 5,
    monthlyRound: {
      overallRemark: "Excellent shine",
      avgReading: 87.4,
      rows: [
        {
          area: "Block A",
          subArea: "Lobby",
          g1: 88,
          g2: 86,
          g3: 89,
          img1: "https://picsum.photos/seed/a1/120/80",
          img2: "https://picsum.photos/seed/a2/120/80",
          img3: "https://picsum.photos/seed/a3/120/80",
          remark: "All good"
        }
      ]
    }
  }
];

/* ---------------- DOM ---------------- */
const els = {
  from: document.getElementById("fromDate"),
  to: document.getElementById("toDate"),
  type: document.getElementById("typeFilter"),
  who: document.getElementById("requestedBy"),
  client: document.getElementById("clientFilter"),
  body: document.getElementById("tbody"),
  csv: document.getElementById("btnCsv"),
  chartCanvas: document.getElementById("ratingChart")
};

/* ---------------- Helpers ---------------- */
function inRange(d, from, to) {
  const x = new Date(d);
  if (from && x < new Date(from)) return false;
  if (to && x > new Date(to)) return false;
  return true;
}

function labelType(t) {
  switch (t) {
    case "REQUEST": return "Request";
    case "PROPERTY_ROUND": return "Property Round";
    case "SITE_VISIT": return "Site Visit";
    case "MONTHLY_ROUND": return "Monthly Round";
    default: return t;
  }
}
function labelWho(w) {
  switch (w) {
    case "CLIENT": return "Client";
    case "WORKER": return "Worker";
    case "ADMIN":  return "Admin";
    default: return "-";
  }
}

/* ---------------- Filters + Rendering ---------------- */
function applyFilters() {
  const f = els.from.value;
  const t = els.to.value;
  const type = els.type.value;
  const who = els.who.value;
  const client = els.client.value;

  const out = DATA
    .filter(r => inRange(r.date, f, t))
    .filter(r => (type === "ALL") ? true : (type === "REQUEST" ? r.type === "REQUEST" : r.type === type))
    .filter(r => (who === "ANY") ? true : r.requestedBy === who)
    .filter(r => (client === "ANY") ? true : (r.client || "").toLowerCase() === client.toLowerCase())
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  renderTable(out);
  updateChart(out);
}

/* Build Client list from DATA */
(function populateClients() {
  const unique = [...new Set(DATA.map(r => r.client).filter(Boolean))].sort();
  unique.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    els.client.appendChild(opt);
  });
})();

/* Render table */
function renderTable(rows) {
  els.body.innerHTML = rows.map(r => {
    const base = `
      <td class="nowrap">${r.date}</td>
      <td><span class="pill">${labelType(r.type)}</span></td>
      <td>${labelWho(r.requestedBy)}</td>
      <td>${r.client || "-"}</td>
      <td>${r.checkIn || "-"}</td>
      <td>${r.checkOut || "-"}</td>
      <td>${r.feedback || "-"}</td>
      <td>${r.resolution || "-"}</td>
      <td class="rating">${r.rating ?? "-"}</td>
    `;

    // Details per type
    let detailsHTML = "";

    if (r.type === "REQUEST" && r.request) {
      const imgs = (r.request.images || [])
        .map(src => `<img class="img-thumb" src="${src}" alt="img" onclick="window.open('${src}','_blank')">`)
        .join("");
      detailsHTML = `
        <div style="padding:10px 0">
          <div><strong>Reason:</strong> ${r.request.reason || "-"}</div>
          <div><strong>Resolution Provided:</strong> ${r.request.resolutionProvided ? "Yes" : "No"}</div>
          <div><strong>Images:</strong> ${imgs || "-"}</div>
        </div>`;
    }

    if (r.type === "PROPERTY_ROUND" && r.round) {
      const areaRows = r.round.map(a => `
        <tr>
          <td>${a.sn}</td><td>${a.area}</td><td>${a.condition}</td>
          <td>${a.image ? `<img class="img-thumb" src="${a.image}" alt="area" onclick="window.open('${a.image}','_blank')">` : "-"}</td>
        </tr>`).join("");
      detailsHTML = `
        <div style="padding:10px 0">
          <table class="table" style="margin:0">
            <thead><tr><th>S.N.</th><th>Area</th><th>Condition</th><th>Image</th></tr></thead>
            <tbody>${areaRows}</tbody>
          </table>
        </div>`;
    }

    if (r.type === "SITE_VISIT" && r.siteVisit) {
      const areaRows = r.siteVisit.areas.map(a => `
        <tr>
          <td>${a.sn}</td><td>${a.area}</td><td>${a.condition}</td>
          <td>${a.image ? `<img class="img-thumb" src="${a.image}" alt="area" onclick="window.open('${a.image}','_blank')">` : "-"}</td>
        </tr>`).join("");
      detailsHTML = `
        <div style="padding:10px 0">
          <div><strong>Overall Remark:</strong> ${r.siteVisit.overallRemark || "-"}</div>
          <div style="margin-top:8px">
            <table class="table" style="margin:0">
              <thead><tr><th>S.N.</th><th>Area Description</th><th>Area Condition</th><th>Image</th></tr></thead>
              <tbody>${areaRows}</tbody>
            </table>
          </div>
        </div>`;
    }

    if (r.type === "MONTHLY_ROUND" && r.monthlyRound) {
      const rowsHTML = r.monthlyRound.rows.map(a => `
        <tr>
          <td>${a.area}</td>
          <td>${a.subArea}</td>
          <td>${a.g1}</td>
          <td>${a.g2}</td>
          <td>${a.g3}</td>
          <td>
            ${a.img1 ? `<img class="img-thumb" src="${a.img1}" alt="g1" onclick="window.open('${a.img1}','_blank')">` : "-"}
            ${a.img2 ? `<img class="img-thumb" src="${a.img2}" alt="g2" onclick="window.open('${a.img2}','_blank')">` : "-"}
            ${a.img3 ? `<img class="img-thumb" src="${a.img3}" alt="g3" onclick="window.open('${a.img3}','_blank')">` : "-"}
          </td>
          <td>${a.remark || "-"}</td>
        </tr>`).join("");
      detailsHTML = `
        <div style="padding:10px 0">
          <div><strong>Overall Remark:</strong> ${r.monthlyRound.overallRemark || "-"}</div>
          <div><strong>Avg Reading:</strong> ${r.monthlyRound.avgReading ?? "-"}</div>
          <div style="margin-top:8px">
            <table class="table" style="margin:0">
              <thead>
                <tr><th>Area</th><th>Sub Area</th><th>Gloss 1</th><th>Gloss 2</th><th>Gloss 3</th><th>Pictures</th><th>Remark</th></tr>
              </thead>
              <tbody>${rowsHTML}</tbody>
            </table>
          </div>
        </div>`;
    }

    return `
      <tr>
        ${base}
        <td>
          <details>
            <summary>Show details</summary>
            ${detailsHTML || '<div style="padding:10px 0">No additional data</div>'}
          </details>
        </td>
      </tr>`;
  }).join("");
}

/* Ratings doughnut */
let chart;
function updateChart(rows) {
  const buckets = { 1:0, 2:0, 3:0, 4:0, 5:0 };
  rows.forEach(r => { if (r.rating) buckets[r.rating] = (buckets[r.rating] || 0) + 1; });
  const data = [buckets[1], buckets[2], buckets[3], buckets[4], buckets[5]];

  if (!chart) {
    chart = new Chart(els.chartCanvas, {
      type: "doughnut",
      data: {
        labels: ["1", "2", "3", "4", "5"],
        datasets: [{ data }]
      },
      options: {
        plugins: { legend: { position: "bottom" } }
      }
    });
  } else {
    chart.data.datasets[0].data = data;
    chart.update();
  }
}

/* CSV export */
function toCSV(rows) {
  const header = [
    "Date","Request Type","Requested By","Client",
    "Check-IN","Check-OUT","Feedback","Resolution","Rating"
  ];
  const lines = rows.map(r => [
    r.date, labelType(r.type), labelWho(r.requestedBy), r.client || "",
    r.checkIn || "", r.checkOut || "", r.feedback || "",
    r.resolution || "", r.rating ?? ""
  ].map(x => `"${String(x).replaceAll('"','""')}"`).join(","));
  return header.join(",") + "\n" + lines.join("\n");
}

els.csv.addEventListener("click", () => {
  const f = els.from.value, t = els.to.value, type = els.type.value, who = els.who.value, client = els.client.value;
  const rows = DATA
    .filter(r => inRange(r.date, f, t))
    .filter(r => (type === "ALL") ? true : (type === "REQUEST" ? r.type === "REQUEST" : r.type === type))
    .filter(r => (who === "ANY") ? true : r.requestedBy === who)
    .filter(r => (client === "ANY") ? true : (r.client || "").toLowerCase() === client.toLowerCase())
    .sort((a,b) => new Date(b.date) - new Date(a.date));

  const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "rounds_requests.csv"; a.click();
  URL.revokeObjectURL(url);
});

/* Init & events */
applyFilters();
["change","input"].forEach(evt => {
  els.from.addEventListener(evt, applyFilters);
  els.to.addEventListener(evt, applyFilters);
  els.type.addEventListener(evt, applyFilters);
  els.who.addEventListener(evt, applyFilters);
  els.client.addEventListener(evt, applyFilters);
});
