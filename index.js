const app = require("express")();
const http = require("http").Server(app);

const consign = require("consign");

const port = process.env.PORT || 4000;

const db = require("./config/db");

app.db = db;

consign()
  .then("./config/middleware.js")
  .include("./config/passport.js")
  .then("./components/validation.js")
  .then("./components/customers.js")
  .then("./components/contacts.js")
  .then("./config/routes.js")
  .into(app);

http.listen(port, () => {
  console.log("iniciando servidor backend..." + port);
});
