require("dotenv").config();
const http = require("http");
const path = require("path");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const db = require("./db");
const gis = require("./gis");
const sessionStore = new SequelizeStore({ db });
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "my best friend is Cody",
  store: sessionStore,
  resave: false,
  saveUninitialized: false
});

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const [[user]] = await db.query(
      `
      SELECT 
          id, "firstName", "lastName", email, "hasMatched", "photoURLs", location
      FROM users
      WHERE id = ?
    `,
      { replacements: [id] }
    );
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", require("./auth"));
app.use("/api", require("./api"));

app.use(express.static(path.join(__dirname, "..", "build")));

if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.secure) {
      next();
    } else {
      res.redirect("https://" + req.headers.host + req.url);
    }
  });
  require("./socket")(server, sessionMiddleware);
  app.get("*", (req, res, next) => {
    res.sendFile(path.join(__dirname, "..", "build/index.html"));
  });
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send(err.message || "INTERNAL SERVER ERROR");
  });
} else {
  app.use(require("morgan")("dev"));
}
db.sync()
  .then(async () => {
    await gis(db);
  })
  .then(function() {
    return sessionStore.sync();
  })
  .then(function() {
    server.listen(PORT, () => {
      console.log(`LISTENING ON PORT ${PORT}`);
    });
  });
