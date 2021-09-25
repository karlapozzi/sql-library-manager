var express = require('express');
var router = express.Router();
const Book = require('../models').Book;

//Handler function to wrap each route in try...catch block
function asyncHandler(cb){
  return async(req, res, next) => {
    try {
      await cb(req, res, next)
    } catch(error){
      // Forward error to the global error handler
      next(error);
    }
  }
}

//Get home page (should always redirect to /books)
router.get('/', asyncHandler(async (req, res, next) => {
  res.redirect('/books');
}));

//GET all books
router.get('/books', asyncHandler(async (req, res, next) => {
  const books = await Book.findAll();
  res.render('index', {books, title: "Books"});
}));


//GET new book form
router.get('/books/new', (req, res) => {
  res.render('new-book');
});

//POST new book to database
router.post('/books/new', asyncHandler(async (req, res) => {
  let book;
  try {
    book = await Book.create(req.body);
    res.redirect('/books/' + book.id);
  } catch (error) {
    if(error.name === 'SequelizeValidationError') {
      book = await Book.build(req.body);
      res.render('new-book', { book, errors: error.errors })
    } else {
      throw error; 
    }
  }
}));

//GET book detail/edit form
router.get('/books/:id', asyncHandler(async (req, res) => {
  const book = await Book.findByPk(req.params.id);
  if(book) {
    res.render('update-book', { book });
  } else {
    res.sendStatus(404);
  }
}));

//POST updated book in database
router.post('/books/:id', asyncHandler(async (req, res) => {
  let book;
  try {
    book = await Book.findByPk(req.params.id);
    if(book) {
      await book.update(req.body);
      res.redirect('/books/' + book.id); 
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    if(error.name === 'SequelizeValidationError') {
      book = await Book.build(req.body);
      book.id = req.params.id;
      res.render('update-book', { book, errors: error.errors })
    } else {
      throw error;
    }
  }
}));

//POST delete book from database
router.post('/books/:id/delete', asyncHandler(async (req ,res) => {
  const book = await Book.findByPk(req.params.id);
  if(book) {
    await book.destroy();
    res.redirect('/books');
  } else {
    res.sendStatus(404);
  }
}));

module.exports = router;
