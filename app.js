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
  next(err);
});

//global error handler
app.use(function(err, req, res, next) {
  res.locals.error = err;
  res.locals.message = err.message;
  res.status(err.status || 500);

  //If the error is a 404, show that page, otherwise show the global error template
  if (err.status === 404) {
    res.render('page-not-found');
  } else {
    err.message = "Sorry! There was an unexpected error on the server.",
    res.render('error');
  }
});

module.exports = app;
