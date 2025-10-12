// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(express.urlencoded({ extended: true }));

const logFile = path.join(__dirname, "ip-log.txt");
const ADMIN_PASS = "shark";

// 🟦 STEP 1: Show form to take name
app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Welcome Visitor</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: 'Montserrat', sans-serif;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: #fff;
      }
      .container {
        text-align: center;
        background: rgba(255,255,255,0.1);
        padding: 40px;
        border-radius: 20px;
        width: 350px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        backdrop-filter: blur(8px);
      }
      h1 { margin-bottom: 20px; text-shadow: 2px 2px 8px rgba(0,0,0,0.3); }
      input {
        padding: 10px;
        width: 80%;
        border: none;
        border-radius: 8px;
        margin-bottom: 15px;
        outline: none;
      }
      button {
        padding: 10px 20px;
        border: none;
        background: #ffd700;
        color: #333;
        font-weight: bold;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.3s;
      }
      button:hover { background: #ffea70; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>👋Welcome!👋</h1>
      <form action="/submit" method="POST">
        <input type="text" name="name" placeholder="Enter your name" required><br>
        <button type="submit">Submit</button>
      </form>
    </div>
  </body>
  </html>
  `);
});

// 🟩 STEP 2: Handle form submission and log IP + name
app.post("/submit", (req, res) => {
  const name = (req.body.name || "unknown").toString().trim();
  const raw = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
  let ip = raw.split(",")[0].trim();
  ip = ip.replace(/^::ffff:/, "");

  const now = new Date().toLocaleString();
  const line = `${now} - ${name} - ${ip}\n`;

  fs.appendFile(logFile, line, (err) => {
    if (err) return res.status(500).send("Failed to log.");
    console.log("Logged:", line.trim());
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Thank You</title>
      <style>
        body {
          background: linear-gradient(135deg, #00c6ff, #0072ff);
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-family: 'Montserrat', sans-serif;
          text-align: center;
        }
        h1 { margin-bottom: 20px; }
        .ip { color: #ffd700; font-size: 1.2em; font-weight: bold; }
        a { color: #fff; text-decoration: underline; margin-top: 20px; display: inline-block; }
      </style>
    </head>
    <body>
      <h1>Thanks, ${escapeHtml(name)}!</h1>
      <p>Your IP <span class="ip">${ip}</span> has been logged successfully ✅</p>
      <a href="/">Go Back</a>
    </body>
    </html>
    `);
  });
});

// 🧾 Admin panel
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

// 🧹 Clear logs
app.get("/clear", (req, res) => {
  if (req.query.pass !== ADMIN_PASS) return res.status(403).send("Forbidden");
  fs.writeFile(logFile, "", err => {
    if (err) return res.status(500).send("Failed to clear logs");
    res.send("✅ Logs cleared");
  });
});

// Escape helper
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[c]));
}

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

