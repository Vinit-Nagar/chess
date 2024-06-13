const express = require("express");
const socket = require("socket.io");
const { Chess } = require("chess.js");
const http = require("http");
const path = require("path");
const { title } = require("process");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", function (uniquesoket) {
  console.log("connected");

  if (!players.white) {
    players.white = uniquesoket.id;
    uniquesoket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniquesoket.id;
    uniquesoket.emit("playerRole", "b");
  } else {
    uniquesoket.emit("spectatorRole");
  }

  uniquesoket.on("disconnect", function () {
    if (uniquesoket.id === players.white) {
      delete players.white;
    } else if (uniquesoket.id === players.black) {
      delete players.black;
    }
  });
  uniquesoket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && uniquesoket.id != players.white) return;
      if (chess.turn() === "b" && uniquesoket.id != players.black) return;

      const result = chess.move(move);
      if (result) {
        currentPlayer = chess.turn();
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("Invalid move: ", move);
        uniquesoket.emit("invalidMove", move);
      }
    } catch (err) {
      uniquesoket.emit("invalid move: ", move);
      console.log(err);
    }
  });
});

server.listen(3000, function () {
  console.log("listening in port 3000");
});
