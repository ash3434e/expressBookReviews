const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

// In-memory user store (shared with general.js via module.exports)
let users = [];

// Returns true if the username already exists
const isValid = (username) => {
  return users.some(u => u.username === username);
};

// Returns true if both username and password match a stored user
const authenticatedUser = (username, password) => {
  return users.some(u => u.username === username && u.password === password);
};

// POST /customer/login
// Only registered users can login; creates a JWT and stores it in the session
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Sign a JWT valid for 1 hour
  const accessToken = jwt.sign({ username }, "access", { expiresIn: '1h' });

  // Store token in session
  req.session.authorization = { accessToken };

  return res.status(200).json({ message: `User ${username} logged in successfully` });
});

// PUT /customer/auth/review/:isbn
// Add or modify a review for a book; each user can only have one review per book
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.user.username; // set by the auth middleware in index.js

  if (!review) {
    return res.status(400).json({ message: "Review text is required as a query parameter: ?review=..." });
  }

  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }

  // Add or overwrite this user's review
  books[isbn].reviews[username] = review;

  return res.status(200).json({
    message: `Review for book ISBN ${isbn} has been added/updated`,
    reviews: books[isbn].reviews
  });
});

// DELETE /customer/auth/review/:isbn
// Delete the logged-in user's own review for a book
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.user.username; // set by the auth middleware in index.js

  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }

  if (!books[isbn].reviews[username]) {
    return res.status(404).json({ message: `No review found for user ${username} on ISBN ${isbn}` });
  }

  delete books[isbn].reviews[username];

  return res.status(200).json({
    message: `Review by ${username} for book ISBN ${isbn} has been deleted`,
    reviews: books[isbn].reviews
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
