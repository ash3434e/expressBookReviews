const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// ─────────────────────────────────────────────
//  POST /register
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
//  Internal /books endpoint (used by axios in GET /)
// ─────────────────────────────────────────────
public_users.get('/books', (req, res) => {
  return res.status(200).json(books);
});

// ─────────────────────────────────────────────
//  GET /
//  Task 10: Get all books using async/await with Axios
// ─────────────────────────────────────────────
public_users.get('/', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:5000/books');
    return res.status(200).json(response.data);
  } catch (err) {
    return res.status(500).json({ message: "Error fetching books" });
  }
});

// ─────────────────────────────────────────────
//  GET /isbn/:isbn
//  Task 11: Search by ISBN using Promises
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
//  Task 12: Search by Author using Promises
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
//  Task 13: Search by Title using Promises
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
