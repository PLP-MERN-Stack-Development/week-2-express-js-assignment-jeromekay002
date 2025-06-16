// server.js - Starter Express server for Week 2 assignment

// Load .env file for the API_KEY
require('dotenv').config();

// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// // Generate a valid API key at server startup
// const validKey = process.env.API_KEY;

// console.log("Generated API Key:", validKey);

// Middleware setup
app.use(bodyParser.json());

// middleware for log requests
app.use((req, res, next) => {
  const time = new Date().toISOString();
  console.log(`${req.method} request for '${req.url}' - ${time}`);
  next(); // call the next middleware function in the stack
});

// i want to protect all /api/products routes
app.use('/api/products', authenticateAPIKey);

// import the custom errors 
const { NotFoundError, ValidationError } = require('./error');

// Sample in-memory products database
let products = [
  {
    id: '1',
    name: 'Laptop',
    description: 'High-performance laptop with 16GB RAM',
    price: 1200,
    category: 'electronics',
    inStock: true
  },
  {
    id: '2',
    name: 'Smartphone',
    description: 'Latest model with 128GB storage',
    price: 800,
    category: 'electronics',
    inStock: true
  },
  {
    id: '3',
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with timer',
    price: 50,
    category: 'kitchen',
    inStock: false
  }
];

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Product API! Go to /api/products to see all products.');
});

// TODO: Implement the following routes:
// GET /api/products - Get all products
app.get('/api/product', (req, res) => {
  res.json(products);
});

// GET /api/products/:id - Get a specific product
app.get('/api/products/:id', (req, res, next) => {
  try {
    /// get the product id as a string
    const productId = req.params.id;

    // find matching data fromthe products database
    const product = products.find(product => product.id === productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    res.json(product);
  } catch (err) {
    next(err);
  }

});

// validation for the creation and update
function validateProduct(req, res, next) {
  // call the items inthe body array
  const { name, description, price, category, inStock } = req.body;

  // validate the fields
  // name
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ message: "Invalid or missing Product name" });
  }

  // description 
  if (!description || typeof description !== 'string') {
    return res.status(400).json({ message: "Invalid or missing Product description" });
  }
  if (!price || typeof price !== 'number') {
    return res.status(400).json({ message: "Invalid or missing Product price" });
  }
  if (!category || typeof category !== 'string') {
    return res.status(400).json({ message: "Invalid or missing Product category" });
  }
  if (!inStock || typeof inStock !== 'boolean') {
    return res.status(400).json({ message: "Invalid or missing Product inStock" });
  }

  // call the next if validatio passes 
  next();
}

// POST /api/products - Create a new product
app.post('/api/products', validateProduct, (req, res, next) => {
  try {
    const { name, description, price, category, inStock } = req.body;

    const newProduct = {
      id: (products.length + 1).toString(), // ensure ID is a string
      name,
      description,
      price,
      category,
      inStock
    };

    products.push(newProduct);

    res.status(201).json({
      message: "Product Added Successfully",
      product: newProduct
    });
  } catch (err) {
    next(err);
  }
});

// for the post data i will use postman to add 
// 1. header: Content-Type - application/json
// 2. body - raw - json 
// body eg:  
// {
//   "name": "Wireless Headphones",
//   "description": "Noise-cancelling over-ear headphones",
//   "price": 150,
//   "category": "electronics",
//   "inStock": true
// }


// PUT /api/products/:id - Update a product
app.put('/api/products/:id', validateProduct, (req, res, next) => {
  try {
    const productId = req.params.id;
    const { name, description, price, category, inStock } = req.body;

    const product = products.find(product => product.id === productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    product.name = name;
    product.description = description;
    product.price = price;
    product.category = category;
    product.inStock = inStock;

    res.json({
      message: "Product updated successfully",
      product
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id - Delete a product
app.delete('/api/products/:id', (req, res, next) => {
  try {
    const productId = req.params.id;
    const productIndex = products.findIndex(product => product.id === productId);

    if (productIndex === -1) {
      throw new NotFoundError('Product not found');
    }

    const deletedProduct = products.splice(productIndex, 1)[0];

    res.json({
      message: "Product Deleted successfully",
      product: deletedProduct
    });
  } catch (err) {
    next(err);
  }
});

// Task 5: Advanced Features
// 1. filtering by category 
app.get('/api/products/', (req, res, next) => {
  try {
    // get the category searched from the query
    const { category, page = 1, limit = 10 } = req.query;

    let filteredProducts = products;

    if (category) {
      // filter the search category and get from products 
      filteredProducts = filteredProducts.filter(product => product.category.toLowerCase() === category.toLowerCase());
    }

    // pagination support
    // set an starting index based on the page and limit 
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);

    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    res.json({
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredProducts.length,
      data: paginatedProducts
    });

  } catch (err) {
    next(err);
  }
});


// 3. search by name
app.get('/api/products/search', (req, res, next) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ message: "Search query 'name' is required" });
    }

    const results = products.filter(product =>
      product.name.toLowerCase().includes(name.toLowerCase())
    );

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// 4. product statistics (count by the category)
app.get('/api/products/stats', (req, res, next) => {
  try {
    const stats = {};

    products.forEach(product => {
      const category = product.category.toLowerCase();
      stats[category] = (stats[category] || 0) + 1;
    });

    res.json({
      totalProducts: products.length,
      countByCategory: stats
    });
  } catch (err) {
    next(err);
  }
});


// TODO: Implement custom middleware for:
// - Request logging


// - Authentication
function authenticateAPIKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  // Generate a valid API key at server startup
  const validKey = process.env.API_KEY;

  if (!apiKey || apiKey !== validKey) {
    return res.status(403).json({ message: "Forbidden: Invalid or missing API Key" });
  }

  next();
}

// Global Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      name: err.name,
      message: message
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Export the app for testing purposes
module.exports = app; 