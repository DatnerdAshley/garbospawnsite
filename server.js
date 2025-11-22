const express = require("express");
const fs = require("fs");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));
app.use(express.json({ limit: "50mb" }));

// Load database
let data = JSON.parse(fs.readFileSync("data.json", "utf8"));

// Send workspace to new clients
io.on("connection", (socket) => {
    socket.emit("load", data);

    socket.on("update", newData => {
        data = newData;
        fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
        socket.broadcast.emit("update", data);
    });
});

http.listen(3000, () => console.log("Server running on port 3000"));
