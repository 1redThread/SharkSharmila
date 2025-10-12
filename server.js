// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

// parse form bodies
app.use(express.urlencoded({ extended: true }));

const logFile = path.join(__dirname, "ip-log.txt");
const ADMIN_PASS = "shark"; 

// Homepage — show visitor IP and attractive page
app.get("/", (req, res) => {
  const raw = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
  let ip = raw.split(",")[0].trim();
  ip = ip.replace(/^::ffff:/, ""); // remove IPv6 prefix if present

  // log IP
  const now = new Date().toLocaleString();
  const line = `${now} - ${ip}\n`;
  fs.appendFile(logFile, line, err => {
    if (err) console.error("Error writing log:", err);
    else console.log("Logged:", line.trim());
  });

  res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Welcome!</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: 'Montserrat', sans-serif;
        height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, #667eea, #764ba2);
        overflow: hidden;
        color: #fff;
      }
      h1 { font-size: 3em; margin-bottom: 20px; text-shadow: 2px 2px 8px rgba(0,0,0,0.3); }
      .card {
        background: rgba(255,255,255,0.1);
        padding: 30px;
        border-radius: 20px;
        width: 350px;
        text-align: center;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        backdrop-filter: blur(8px);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .card:hover { transform: translateY(-5px); box-shadow: 0 12px 30px rgba(0,0,0,0.5); }
      .ip { font-weight: 700; color: #ffd700; font-size: 1.3em; }
      footer { position: absolute; bottom: 20px; font-size: 0.9em; color: #eee; }
      .circle { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.1); animation: float 8s infinite; }
      .circle:nth-child(1) { width: 80px; height: 80px; left: 10%; animation-delay: 0s; }
      .circle:nth-child(2) { width: 50px; height: 50px; left: 80%; animation-delay: 2s; }
      .circle:nth-child(3) { width: 100px; height: 100px; left: 40%; animation-delay: 4s; }
      @keyframes float { 0% { transform: translateY(100vh); opacity: 0; } 50% { opacity: 0.5; } 100% { transform: translateY(-100vh); opacity: 0; } }
    </style>
  </head>
  <body>
    <div class="circle"></div>
    <div class="circle"></div>
    <div class="circle"></div>
    <h1>👋 Welcome!</h1>
    <div class="card">
      <p>Your IP has been logged. (Thanks!)</p>
      <p>Visit Again!</p>
      <p class="ip">${ip}</p>
    </div>
    <footer>Made with 💻 by Rudra</footer>
  </body>
  </html>
  `);
});
app.post("/submit", (req, res) => {
  const name = (req.body.name || "unknown").toString().trim();
  const raw = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
  let ip = raw.split(",")[0].trim();
  ip = ip.replace(/^::ffff:/, "");
  const now = new Date().toLocaleString();
  const line = `${now} - ${name} - ${ip}\n`;

  fs.appendFile(logFile, line, (err) => {
    if (err) return res.status(500).send("Failed to log. Try again later.");
    console.log("Logged:", line.trim());
    res.send(`<p>Thanks ${escapeHtml(name)} — your info was logged.</p><p><a href="/">Go back</a></p>`);
  });
});

// Admin view — protected by query password
app.get("/admin", (req, res) => {
  if (req.query.pass !== ADMIN_PASS) return res.status(403).send("Forbidden");

  fs.readFile(logFile, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") return res.send("<pre>No logs yet.</pre>");
      return res.status(500).send("Error reading logs.");
    }
    res.type("html").send(`<pre>${escapeHtml(data)}</pre>`);
  });
});

app.get("/clear", (req, res) => {
  if (req.query.pass !== ADMIN_PASS) return res.status(403).send("Forbidden");
  fs.writeFile(logFile, "", err => {
    if (err) return res.status(500).send("Failed to clear logs");
    res.send("✅ Logs cleared");
  });
});

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
}

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
