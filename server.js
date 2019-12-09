let express = require('express');
let path = require('path');
let logger = require('morgan');
let bodyParser = require('body-parser');
let responseTime = require('response-time');
let assert = require('assert');
let helmet = require('helmet');
let RateLimit = require('express-rate-limit');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// router handlers
let indexRouter = require('./src/routes');
let sessionsRouter = require('./src/routes/sessions');
let usersRouter =require('./src/routes/users');

let app = express();
app.enable('trust proxy');

let limiter = new RateLimit({
  windowsMS: 15 * 60 * 1000,
  max: 100,
  delayMs: 0
});
app.use(limiter);

app.use(helmet());

app.use(responseTime());

app.use(logger('dev'));

app.use(bodyParser.json({ limit: '100kb' }));

// View engine
app.set('views', path.join(__dirname, 'src/views'));
app.set('view engine', 'jade');

// Mongo Connection
let db = {};
let MongoClient = require('mongodb').MongoClient;

MongoClient.connect(
  process.env.MONGODB_CONNECT_URL,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err, client) => {
    assert.equal(null, err);
    db.client = client;
    db.collection = client.db('cosmosdb').collection('cosmos');
    // console.log(client);
    console.log('Connect to MongoDB')
  }
);

process.on('SIGINT', () => {
  console.log('Closing Mongo connection');
  db.client.close();
  process.exit(0)
});

process.on('SIGUSR2', () => {
  console.log('Mongo Connection close on restart');
  db.client.close();
  process.kill(process.pid, 'SIGUSR2')
});

app.use((req, res, next) => {
  req.db = db;
  next();
});

// api routes
app.use('/', indexRouter);
app.use('/cosmosapi/sessions', sessionsRouter);
app.use('/cosmosapi/users', usersRouter);

// Error handling
// 404
app.use((req, res, next) => {
  let err = new Error('Not Found')
  err.status = 404;
  next(err);
});

app.set('port', process.env.PORT || 3000);

let server = app.listen(app.get('port'), () => {
  console.log('Express server listening on port: ', server.address().port);
});

server.db = db;
module.exports = server;