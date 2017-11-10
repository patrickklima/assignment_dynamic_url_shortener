//EXPRESS APP
const express = require('express');
const app = express();
const port = process.env.PORT;

//EXPRESS-HANDLEBARS
var exphbs  = require('express-handlebars');
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//BODY-PARSER
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));


app.get('/', (req, res) => {
  res.send("hello world")
});

app.listen(port, () => {
  console.log(`listening on ${port}`);
});