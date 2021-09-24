const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const sequelize = require('./models').sequelize;

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();


sequelize.sync();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/static', express.static('public'));

app.use('/', indexRouter);
app.use('/users', usersRouter);

//404 error handler
app.use(function(req, res, next) {
  const err = new Error();
  err.status = 404;
  err.message = "Sorry! We couldn't find the page you were looking for.";
  if (err.status === 404) {
    res.render('page-not-found', {error: err});
  } else {
    next(err);
  }
});

//global error handler
app.use(function(err, req, res, next) {
  if(!err.status) {
    err.status = 500;
  }
  if(err.message === 'error is not defined' || !err.message) {
    err.message = "Sorry! There was an unexpected error on the server.";
  }
  console.error(`${err.status}: ${err.message}`);
  res.render('error', {error: err});
});

module.exports = app;
