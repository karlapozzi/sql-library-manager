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

//404 Handler for /books specific routes
function render404(res){
  const err = new Error();
  err.status = 404;
  err.message = "Sorry! We couldn't find the page you were looking for.";
  res.render('page-not-found', { error: err, title: "Page Not Found"} );
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
  res.render('new-book', { book: {}, title: "New Book" });
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
      res.render('new-book', { book, errors:error.errors, title: "New Book" })
    } else {
      throw error; 
    }
  }
}));

//GET book detail/edit form
router.get('/books/:id', asyncHandler(async (req, res) => {
  const book = await Book.findByPk(req.params.id);
  if(book) {
    res.render('update-book', { book, title: book.title });
  } else {
    render404(res);
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
      render404(res);
    }
  } catch (error) {
    if(error.name === 'SequelizeValidationError') {
      book = await Book.build(req.body);
      book.id = req.params.id;
      res.render('update-book', { book, errors: error.errors, title: book.title })
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
    render404(res);
  }
}));

module.exports = router;
