const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");
const dbConfig = require("./config/db.config");
const moment = require("moment-timezone");

// Set the timezone
const desiredTimezone = "UTC";
moment.tz.setDefault(desiredTimezone);

global.app = express();
global.server = http.createServer(app);
global.io = socketIO(server);

// global.http = require("http").Server(app);
// global.io = require("socket.io")(http);

// Connect to MongoDB
dbConfig.connect();

// Initialize a Set to store invalidated tokens
global.tokenBlacklist = new Set();

var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static("public"));

const db = require("./models");
const Role = db.role;

// Socket.IO connection
// const socketNamespace = io.of('/api/');
io.on("connection", (socket) => {
  console.log('api');

  socket.on("join-quiz", (data) => {
    const quizRoom = `quiz_room_${data.quizGameId}`;
    console.log(data.quizGameId);
    socket.join(quizRoom);
    console.log(socket);

    socket.emit("user-join", {
      message: `New User Joined. - ${data.playerId}`,
    }); 
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to speedquizz application." });
});

// routes
require("./routes/auth.routes")(app);
require("./routes/user.routes")(app);
require("./routes/quiz.routes")(app);
require("./routes/question.routes")(app);
require("./routes/cms.routes")(app);
require("./routes/carousel.routes")(app);

// set port, listen for requests
const PORT = process.env.PORT || 9205;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

function initial() {
  Role.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      new Role({
        name: "user",
      }).save((err) => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'user' to roles collection");
      });

      new Role({
        name: "admin",
      }).save((err) => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'admin' to roles collection");
      });
    }
  });
}
