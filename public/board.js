// Shared by board.html (projector view) and teacher.html. Polls /api/board and draws the lobby (while waiting) or the leaderboard.
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
    if (data.state === "waiting") {
      const L = data.lobby;
      if (!L.teams.length) { el.innerHTML = '<div class="empty">Get ready — go to the site and type your name to enter the lobby.</div>'; return; }
      el.innerHTML = `<div class="lobbyhead"><h2>Lobby</h2><span class="${L.readyTeams === L.totalTeams ? "ok" : "none"}">${L.readyTeams} of ${L.totalTeams} teams ready &middot; ${L.players} student${L.players === 1 ? "" : "s"}</span></div><div class="teams">` +
        L.teams.map(t => `<div class="team${t.ready ? " ready" : ""}"><div class="none" style="font-size:.8rem;font-weight:700">TEAM ${t.n}</div>${t.members.map(m => `<div class="who"><span class="em">${m.emoji || ""}</span>${esc(m.name)}${m.ready ? '<span class="badge ready">ready</span>' : ""}${m.online ? "" : '<span class="badge off">away</span>'}</div>`).join("")}${t.members.length === 1 ? '<div class="none" style="font-size:.85rem">' + (t.ready ? "solo" : "looking for a partner") + "</div>" : ""}</div>`).join("") + "</div>";
      return;
    }
    if (!data.rows.length) { el.innerHTML = '<div class="empty">No teams yet.</div>'; return; }
    if (el.dataset.compact) {   // sidebar on the student page: rank, team, five small program marks, points
      el.innerHTML = '<table class="compact"><tbody>' + data.rows.map((r, i) => `<tr class="r${i + 1}"><td class="rank">${i + 1}</td><td class="name"><span class="em">${r.emojis || ""}</span><b>${esc(r.name)}</b><span class="small">${esc(r.names)}</span><div class="marks">${data.programs.map(p => { const c = r.cells[p.id]; return `<span class="mark ${!c ? "none" : c.solvedAt !== null ? "ok" : "part"}" title="P${p.n} ${esc(p.title)}">${!c ? "&middot;" : c.solvedAt !== null ? "&#10003;" : c.best + "/" + c.total}</span>`; }).join("")}</div></td><td class="pts"><b>${r.points}</b></td></tr>`).join("") + "</tbody></table>";
      return;
    }
    let h = '<table><thead><tr><th>#</th><th class="name">Team</th>' + data.programs.map(p => `<th>P${p.n}<span class="small">${esc(p.title)}</span></th>`).join("") + "<th>Points</th></tr></thead><tbody>";
    data.rows.forEach((r, i) => {
      h += `<tr class="r${i + 1}"><td class="rank">${i + 1}</td><td class="name"><span class="em">${r.emojis || ""}</span>${esc(r.name)}<span class="small">${esc(r.names)}</span></td>`;
      for (const p of data.programs) {
        const c = r.cells[p.id];
        h += !c ? '<td class="none">&mdash;</td>' : c.solvedAt !== null ? `<td class="ok">&#10003;<span class="small">${mmss(c.solvedAt)} &middot; ${c.points} pts</span></td>` : `<td class="part">${c.best}/${c.total}<span class="small">${c.points} pts</span></td>`;
      }
      h += `<td><b>${r.points}</b><span class="small">${r.solved} of ${data.programs.length} solved</span></td></tr>`;
    });
    el.innerHTML = h + "</tbody></table>";
  }
  async function refresh() { try { data = await (await fetch(API + "/api/board")).json(); offset = data.now - Date.now(); draw(); if (window.onBoard) window.onBoard(data); } catch (e) {} }
  refresh(); setInterval(refresh, 2500); setInterval(draw, 1000);
  window.refreshBoard = refresh;
})();
