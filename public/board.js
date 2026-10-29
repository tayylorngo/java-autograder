// Shared by board.html (projector view) and teacher.html. Polls /api/board and draws the leaderboard.
(function () {
  const API = (window.API_URL || "").replace(/\/$/, "");
  const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const mmss = ms => { const t = Math.max(0, Math.floor(ms / 1000)); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); };
  let data = null, offset = 0;
  const label = { waiting: "Waiting to start", open: "LIVE", closed: "Closed" };
  function draw() {
    if (!data) return;
    const chip = document.getElementById("chip"), timer = document.getElementById("timer");
    if (chip) { chip.className = "chip " + data.state; chip.textContent = label[data.state]; }
    if (timer) timer.textContent = data.startedAt ? mmss(Date.now() + offset - data.startedAt) : "";
    const el = document.getElementById("board"); if (!el) return;
    if (!data.rows.length) { el.innerHTML = '<div class="empty">' + (data.state === "waiting" ? "Get ready — uploads open when Mr. Taylor presses Start." : "No submissions yet.") + "</div>"; return; }
    let h = '<table><thead><tr><th>#</th><th class="name">Pair</th>' + data.programs.map(p => `<th>P${p.n}<span class="small">${esc(p.title)}</span></th>`).join("") + "<th>Solved</th></tr></thead><tbody>";
    data.rows.forEach((r, i) => {
      h += `<tr class="r${i + 1}"><td class="rank">${i + 1}</td><td class="name">${esc(r.name)}</td>`;
      for (const p of data.programs) {
        const c = r.cells[p.id];
        h += !c ? '<td class="none">&mdash;</td>' : c.solvedAt !== null ? `<td class="ok">&#10003;<span class="small">${mmss(c.solvedAt)}</span></td>` : `<td class="part">${c.passed}/${c.total}</td>`;
      }
      h += `<td><b>${r.solved}</b> / ${data.programs.length}</td></tr>`;
    });
    el.innerHTML = h + "</tbody></table>";
  }
  async function refresh() { try { data = await (await fetch(API + "/api/board")).json(); offset = data.now - Date.now(); draw(); if (window.onBoard) window.onBoard(data); } catch (e) {} }
  refresh(); setInterval(refresh, 2500); setInterval(draw, 1000);
  window.refreshBoard = refresh;
})();
