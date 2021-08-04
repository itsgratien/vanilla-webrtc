const express = require('express');

const app = express();

const server = require('http').Server(app);

app.set('view engine', 'ejs');

app.use(express.static('./public'));

app.get('/', (req, res) => {
  res.render('index');
});

const io = require('socket.io')(server);

io.on('connection', () => {
  console.log('connected');
});

const port = 3000;

server.listen(port, () => console.log(`server is listening on port ${port}`));
