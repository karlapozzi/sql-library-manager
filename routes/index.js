var express = require('express');
var router = express.Router();
const Book = require('../models').Book;
const { Op } = require("sequelize");

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

//Pagination handler
function getPagingData(data, limit){
  const { count: totalItems, rows: books } = data;
  const totalPages = Math.ceil(totalItems / limit);
  return { totalItems, books, totalPages };
};

//Get home page should redirect
router.get('/', asyncHandler(async (req, res, next) => {
  res.redirect('/books/page=1');
}));

//Get /books should redirect to page 1
router.get('/books', asyncHandler(async (req, res, next) => {
  res.redirect('/books/page=1');
}));

//GET all books
router.get('/books/page=:page', asyncHandler(async (req, res, next) => {
  //pagination help found here https://www.bezkoder.com/node-js-sequelize-pagination-mysql/
  const limit = 10;
  const currentPage = req.params.page;
  const offset = (currentPage - 1) * limit; 
  const data = await Book.findAndCountAll()
  const response = getPagingData(data, limit);
  const totalPages = response.totalPages;
  //Array help found here https://stackoverflow.com/questions/42761068/paginate-javascript-array 
  const pagesArray = Array.from({length: totalPages}, (_, i) => i + 1)
  const books = await Book.findAll({
    limit: limit,
    offset: offset
  })
  res.render('index', {books, pagesArray, title: "Books"});
}));

//GET search results
router.get('/search', asyncHandler(async (req, res, next) => {
  // figured this out with console.log(req)
  let search = req.query.search;
  const books = await Book.findAll({
  //this stackoverflow https://stackoverflow.com/questions/34255792/sequelize-how-to-search-multiple-columns/34263873 lead me here https://sequelize.org/master/manual/model-querying-basics.html
    where: {
      [Op.or]: [
        { title: { [Op.like]: `%${search}%` } },
        { author: { [Op.like]: `%${search}%` } },
        { genre: { [Op.like]: `%${search}%` } },
        { year: { [Op.like]: `%${search}%` } }
      ]
    }
  });
  res.render('index', { books, title: "Search Results" });
}))


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
