// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

// parse form bodies
app.use(express.urlencoded({ extended: true }));

const logFile = path.join(__dirname, "ip-log.txt");
const ADMIN_PASS = "rudrapass"; // change this to something stronger

// Simple form to collect name
app.get("/", (req, res) => {
  res.send(`
    <!doctype html>
    <html>
      <head><meta charset="utf-8"><title>Say your name</title></head>
      <body style="font-family:system-ui,Segoe UI,Roboto,Arial;margin:40px">
        <h2>Enter your name</h2>
        <form method="POST" action="/submit">
          <input name="name" required placeholder="Your name" autocomplete="name" />
          <button type="submit">Submit</button>
        </form>
      </body>
    </html>
  `);
});

// Handle form submission: get name, detect clean IP, save to file
app.post("/submit", (req, res) => {
  const name = (req.body.name || "unknown").toString().trim();

  // Raw IP from header or socket
  const raw = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
  // Use first IP if multiple; common practice
  let ip = raw.split(",")[0].trim();
  // Remove IPv4-mapped IPv6 prefix if present
  ip = ip.replace(/^::ffff:/, "");

  const now = new Date().toLocaleString();

  const line = `${now} - ${name} - ${ip}\n`;

  fs.appendFile(logFile, line, (err) => {
    if (err) {
      console.error("Error writing log:", err);
      return res.status(500).send("Failed to log. Try again later.");
    }
    console.log("Logged:", line.trim());
    res.send(`<p>Thanks ${escapeHtml(name)} — your info was logged.</p>
              <p><a href="/">Go back</a></p>`);
  });
});

// Admin view to read logs (protected by simple query password)
app.get("/admin", (req, res) => {
  if (req.query.pass !== ADMIN_PASS) return res.status(403).send("Forbidden");

  fs.readFile(logFile, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") return res.send("<pre>No logs yet.</pre>");
      return res.status(500).send("Error reading logs.");
    }
    // show as plain preformatted text
    res.type("html").send(`<pre>${escapeHtml(data)}</pre>`);
  });
});

// small helper to avoid basic HTML injection in responses
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[c]));
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

