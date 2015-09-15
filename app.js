var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var socketIo = require('socket.io');
var os = require('os');
var dotenv = require('dotenv');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

var server = require('http').Server(app);
var io = require('socket.io')(server);

// Load dotenv
dotenv.load();

// Socket.io
app.set('socket port', process.env.SOCKET_PORT || 9000);
server.listen(app.get('socket port'));
io.on('connection', function(socket) {
  socket.on('message', function(data) {
    data.from = socket.id;

    var target_id = data.sendto;
    if (target_id) {
      socket.to(target_id).emit('message', data);
      return;
    }

    socket.broadcast.emit('message', data);
  });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// set locals
app.use(function(req, res, next) {
  app.locals.signaling_server_url = process.env.SIGNALING_SERVER_URL || '';
  app.locals.stun_server_url = process.env.STUN_SERVER_URL || '';
  app.locals.turn_server_url = process.env.TURN_SERVER_URL || '';
  next();
});

// routing
app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
