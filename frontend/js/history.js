/* ==========================================================================
   InsightBoard — history.js
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  IB.injectShell("history");
  IB.seedHistoryIfEmpty();
  renderHistory();
});

function renderHistory() {
  const history = IB.getHistory();
  const body = document.getElementById("historyBody");
  const empty = document.getElementById("historyEmpty");
  const table = document.querySelector("#historyCard .table-wrap");

  if (history.length === 0) {
    table.classList.add("hidden");
    empty.classList.remove("hidden");
    return;
  }
  table.classList.remove("hidden");
  empty.classList.add("hidden");

  body.innerHTML = history.map((h) => (
    "<tr>" +
    "<td><i class=\"fa-solid fa-file-csv text-accent\"></i>&nbsp; " + h.name + "</td>" +
    "<td>" + IB.formatDate(h.uploadDate) + "</td>" +
    '<td class="table-num">' + IB.formatNumber(h.rows) + "</td>" +
    '<td class="table-num">' + h.columns + "</td>" +
    '<td><span class="status-pill completed"><i class="fa-solid fa-check"></i> ' + h.status + "</span></td>" +
    '<td><div class="history-actions">' +
      '<button class="btn btn-outline btn-sm" data-action="view" data-id="' + h.id + '">View</button>' +
      '<button class="btn btn-outline btn-sm" data-action="dashboard" data-id="' + h.id + '">Dashboard</button>' +
      '<button class="btn btn-danger btn-sm" data-action="delete" data-id="' + h.id + '"><i class="fa-solid fa-trash"></i></button>' +
    "</div></td>" +
    "</tr>"
  )).join("");

  body.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => handleAction(btn.dataset.action, btn.dataset.id));
  });
}

function handleAction(action, id) {
  const currentDataset = IB.getDataset();
  const isCurrent = currentDataset && currentDataset.id === id;

  if (action === "delete") {
    IB.confirmModal({
      title: "Delete this dataset?",
      message: "This removes it from your history. This can't be undone.",
      confirmLabel: "Delete",
      danger: true,
      onConfirm: () => {
        IB.removeHistoryEntry(id);
        IB.toast("Dataset removed from history.", "success");
        renderHistory();
      },
    });
    return;
  }

  const destination = action === "dashboard" ? "generated-dashboard.html" : "analysis.html";
  if (isCurrent) {
    window.location.href = destination;
    return;
  }
  IB.toast("Loading a sample preview of this dataset...", "success");
  IB.loadSampleDataset().then(() => { window.location.href = destination; });
}
