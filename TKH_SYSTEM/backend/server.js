require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./src/app");
const authenticateExamSocket = require(
  "./src/sockets/authenticate-exam-socket"
);

const registerExamSocketHandlers =
  require(
    "./src/sockets/register-exam-socket-handlers"
  );

const authenticateForumSocket =
  require(
    "./src/sockets/authenticate-forum-socket"
  );

const registerForumSocketHandlers =
  require(
    "./src/sockets/register-forum-socket-handlers"
  );

const PORT = process.env.PORT || 5000;

/*
=====================================================
HTTP Server
=====================================================
*/

const httpServer =
  http.createServer(app);

/*
=====================================================
Socket.IO
=====================================================
*/

const io = new Server(
  httpServer,
  {
    cors: {
      origin: true,
      methods: [
        "GET",
        "POST",
      ],
      credentials: true,
    },
  }
);

/*
=====================================================
Exam Namespace
=====================================================
*/

const examsNamespace =
  io.of("/exams");

  examsNamespace.use(
    authenticateExamSocket
);

app.set(
  "io",
  io
);

app.set(
  "examsNamespace",
  examsNamespace
);

examsNamespace.on(
  "connection",
  socket => {
    console.log(
      `Exam socket connected: ${socket.id}`
    );

    registerExamSocketHandlers({
      examsNamespace,
      socket,
    });

    socket.on(
      "disconnect",
      reason => {
        console.log(
          `Exam socket disconnected: ${socket.id} (${reason})`
        );
      }
    );
  }
);

/*
=====================================================
Forum Namespace
=====================================================
*/

const forumNamespace =
  io.of("/forum");


forumNamespace.use(
  authenticateForumSocket
);


app.set(
  "forumNamespace",
  forumNamespace
);


forumNamespace.on(
  "connection",
  socket => {
    console.log(
      `Forum socket connected: ${socket.id}`
    );

    registerForumSocketHandlers({
      forumNamespace,
      socket,
    });

    socket.on(
      "disconnect",
      reason => {
        console.log(
          `Forum socket disconnected: ${socket.id} (${reason})`
        );
      }
    );
  }
);


/*
=====================================================
Start Server
=====================================================
*/

httpServer.listen(
  PORT,
  () => {
    console.log(
      `TKH 2026 Backend running on port ${PORT}`
    );

    console.log(
      "Socket.IO namespaces ready: /exams, /forum"
    );
  }
);