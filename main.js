const express = require("express");
const session = require("express-session");

const app = express();

const dbOptions = {
  host: "localhost",
  user: "root",
  password: "root",
  database: "webdb2026",
};

const sessionOption = {
  secret: "keyboard cat",
  resave: false,
  saveUninitialized: true,
};

if (process.env.USE_MYSQL_SESSION === "true") {
  const MySqlStore = require("express-mysql-session")(session);
  sessionOption.store = new MySqlStore(dbOptions);
}

app.use(session(sessionOption));

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

const rootRouter = require("./router/rootRouter");
const authRouter = require("./router/authRouter");
const codeRouter = require("./router/codeRouter");
const personRouter = require("./router/personRouter");
const productRouter = require("./router/productRouter");
const boardRouter = require("./router/boardRouter");
const purchaseRouter = require("./router/purchaseRouter");

app.use("/", rootRouter);
app.use("/auth", authRouter);
app.use("/code", codeRouter);
app.use("/person", personRouter);
app.use("/product", productRouter);
app.use("/board", boardRouter);
app.use("/purchase", purchaseRouter);

app.get("/favicon.ico", (req, res) => res.writeHead(404));

app.listen(3000, () => {
  console.log("Example app listening on port 3000");
});
