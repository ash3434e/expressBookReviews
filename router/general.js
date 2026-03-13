const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// ─────────────────────────────────────────────
//  POST /register
//  Register a new user (no auth required)
// ─────────────────────────────────────────────
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (isValid(username)) {
    return res.status(409).json({ message: `User '${username}' already exists` });
  }

  users.push({ username, password });
  return res.status(201).json({ message: `User '${username}' registered successfully` });
});

// ─────────────────────────────────────────────
//  GET /
//  Return all books – implemented with async/await (Part E Task 1)
// ─────────────────────────────────────────────
public_users.get('/', async (req, res) => {
  try {
    // Wrap the synchronous lookup in a Promise to demonstrate async usage
    const allBooks = await new Promise((resolve, reject) => {
      if (books) {
        resolve(books);
      } else {
        reject(new Error("Books database not available"));
      }
    });
    return res.status(200).json(allBooks);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────
//  GET /isbn/:isbn
//  Return book details by ISBN – implemented with Promise (Part E Task 2)
// ─────────────────────────────────────────────
public_users.get('/isbn/:isbn', (req, res) => {
  const isbn = req.params.isbn;

  new Promise((resolve, reject) => {
    const book = books[isbn];
    if (book) {
      resolve(book);
    } else {
      reject(new Error(`Book with ISBN '${isbn}' not found`));
    }
  })
    .then(book => res.status(200).json(book))
    .catch(err => res.status(404).json({ message: err.message }));
});

// ─────────────────────────────────────────────
//  GET /author/:author
//  Return all books by a given author – implemented with Promise (Part E Task 3)
// ─────────────────────────────────────────────
public_users.get('/author/:author', (req, res) => {
  const authorQuery = req.params.author.toLowerCase();

  new Promise((resolve, reject) => {
    const matches = Object.entries(books)
      .filter(([, book]) => book.author.toLowerCase().includes(authorQuery))
      .map(([isbn, book]) => ({ isbn, ...book }));

    if (matches.length > 0) {
      resolve(matches);
    } else {
      reject(new Error(`No books found for author '${req.params.author}'`));
    }
  })
    .then(matches => res.status(200).json(matches))
    .catch(err => res.status(404).json({ message: err.message }));
});

// ─────────────────────────────────────────────
//  GET /title/:title
//  Return all books matching a title – implemented with Promise (Part E Task 4)
// ─────────────────────────────────────────────
public_users.get('/title/:title', (req, res) => {
  const titleQuery = req.params.title.toLowerCase();

  new Promise((resolve, reject) => {
    const matches = Object.entries(books)
      .filter(([, book]) => book.title.toLowerCase().includes(titleQuery))
      .map(([isbn, book]) => ({ isbn, ...book }));

    if (matches.length > 0) {
      resolve(matches);
    } else {
      reject(new Error(`No books found with title containing '${req.params.title}'`));
    }
  })
    .then(matches => res.status(200).json(matches))
    .catch(err => res.status(404).json({ message: err.message }));
});

// ─────────────────────────────────────────────
//  GET /review/:isbn
//  Return reviews for a specific book
// ─────────────────────────────────────────────
public_users.get('/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: `Book with ISBN '${isbn}' not found` });
  }

  return res.status(200).json(book.reviews);
});

module.exports.general = public_users;
