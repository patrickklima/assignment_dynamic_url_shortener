//EXPRESS APP
const express = require('express');
const app = express();
const port = process.env.PORT;

//EXPRESS-HANDLEBARS
var exphbs  = require('express-handlebars');
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//DATA SERVICES
var urlMgr = require('./services/urlMgr');

//BODY-PARSER
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

//REDIS-CLIENT probably only for testing
// var {redisClient} = require("./services/redisClient");

//SOCKET.IO
const server = require('http').createServer(app);
const io = require('socket.io')(server);
app.use('/socket.io',express.static(__dirname + 'node_modules/socket.io-client/dist/'));


//MIDDLEWARE AND RESOURCES
app.use(express.static(`${__dirname}/public`));

app.get('/', (req, res) => {
  console.log("app.get /");
  urlMgr.getAllLinks().then(allLinks => {
    console.log("this is allLinks");
    console.log(allLinks);
    res.render('home', {port, allLinks});
  });
});

app.post('/', (req, res) => {
  console.log("app.post /");
  if (!req.body) res.redirect('/');
  urlMgr.storeURL(req.body.url).then(() => {
    res.redirect('/');
  });
});

app.get('/:id', (req, res) => {
  console.log("app.get/ "+req.params.id);
  var id = req.params.id;
  console.log(id);
  urlMgr.getValue(id).then(url => {
    urlMgr.incr(id).then(newVal => {
      console.log(newVal);
      io.sockets.emit("new visit", id, newVal);
      res.redirect(url);
    });
  });
});

// app.post('/', (req, res) => {
//   console.log("app.post /");
//   var allLinks;
//   if (!req.body) res.redirect('/');
//   let newURL = req.body.url;
//   urlMgr.storeURL(newURL).then(link => {
//     console.log(`link in index.js is ${link}`);
//     allLinks = urlMgr.getAllLinks();
//   })
//   .catch(err => (console.log(err)));
//   if (allLinks) {
//     res.render('home', {port, allLinks});
//   } else {
//     res.redirect('/');
//   }
// });

server.listen(port);

// app.listen(port, () => {
//   console.log(`listening on ${port}`);
// });