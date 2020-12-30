require("dotenv").config();
var app = require("express")();
var http = require("http").createServer(app);

var io = require("socket.io")(http);
const cors = require("cors")

var corsOptions = {
  origin: process.env.PORT || 'http://localhost:3000',
  optionsSuccessStatus: 200
}

app.get("/",cors(corsOptions), (req, res) => {
  res.sendFile(__dirname + "/frontend/index.html");
});

const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log("listeinng on *:3000");
});

var colors = [
  "red",
  "blue",
  "yellow",
  "green",
  "pink",
  "aqua",
  "brown",
  "chocolate",
  "gold",
  "orange",
];

const players = {};
const apple = { x: 15, y: 15 };
let colorSize = 0;

io.on("connection", (socket) => {
  console.log(`a user connected ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`user disconnected ${socket.id}`);
    delete players[socket.id];
    clearInterval(gameLoop);
  });

  var player = null;

  const tileCount = 30;

  // new player

  players[socket.id] = {
    velocityX: 0,
    velocityY: 0,
    x: Math.floor(Math.random() * 10),
    y: Math.floor(Math.random() * 10),
    trail: [],
    tailSize: 2,
    color: colors[colorSize++],
    playerId: socket.id,
  };
  if (colorSize >= 9) colorSize = 0;

  socket.on("key", (key) => {
    player = players[socket.id];
    if (key === 87 && player.velocityY != 1) {
      player.velocityY = -1;
      player.velocityX = 0;
    } else if (key === 68 && player.velocityX != -1) {
      player.velocityX = 1;
      player.velocityY = 0;
    } else if (key === 83 && player.velocityY != -1) {
      player.velocityY = 1;
      player.velocityX = 0;
    } else if (key === 65 && player.velocityX != 1) {
      player.velocityX = -1;
      player.velocityY = 0;
    }
  });

  function update() {
    player = players[socket.id];

    player.x += player.velocityX;
    player.y += player.velocityY;

    if (player.x > tileCount - 1) {
      player.x = 0;
    }
    if (player.x < 0) {
      player.x = tileCount - 1;
    }
    if (player.y > tileCount - 1) {
      player.y = 0;
    }
    if (player.y < 0) {
      player.y = tileCount - 1;
    }

    player.trail.push({ x: player.x, y: player.y });

    while (player.trail.length > player.tailSize) {
      player.trail.shift();
    }

    if (apple.x === player.x && apple.y == player.y) {
      player.tailSize++;
      apple.x = Math.floor(Math.random() * tileCount);
      apple.y = Math.floor(Math.random() * tileCount);
    }
  }

  var gameLoop = setInterval(() => {
    update();
    io.emit("state", players, apple);
  }, 1000 / 15);
});
