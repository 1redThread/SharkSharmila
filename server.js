const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.get("/", (req, res) => {
  const raw = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  let ip = raw.split(",")[0].trim(); // first IP = real one
  ip = ip.replace(/^::ffff:/, ""); // remove IPv6 prefix

  console.log("🌐 IP Detected:", ip);

  const logFile = path.join(__dirname, "ip-log.txt");

  fs.appendFile(logFile, ip + "\n", err => {
    if (err) {
      console.error("❌ Error writing to file:", err);
    } else {
      console.log("✅ IP saved to", logFile);
    }
  });

  res.send("Your IP has been logged!");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("🚀 Server running on port", port);
});
fs.appendFileSync("ip-log.txt", "TEST WRITE\n");
app.get("/admin", (req, res) => {
  const logFile = path.join(__dirname, "ip-log.txt");
  fs.readFile(logFile, "utf8", (err, data) => {
    if (err) return res.send("❌ Error reading file.");
    res.send("<pre>" + data + "</pre>");
  });
});
app.get("/clear", (req, res) => {
  if (req.query.pass !== "rudrapass") return res.status(403).send("❌ Access Denied");

  fs.writeFile("ip-log.txt", "", err => {
    if (err) {
      console.error("Error clearing log:", err);
      return res.send("❌ Failed to clear log.");
    }

    res.send("🧹 Log cleared successfully!");
  });
});

