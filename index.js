const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const port = 3000;
const ordersFilePath = path.join(__dirname, 'data', 'orders.json');

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files from the "public" directory
app.use(express.static('public'));

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

// Your route definitions
app.get('/', (req, res) => res.redirect('/orders'));

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const usersFilePath = path.join(__dirname, 'data', 'users.json');
  console.log(`Looking for file at path: ${usersFilePath}`);

  fs.readFile(usersFilePath, (err, data) => {
    if (err) {
      console.error('Error reading user data file:', err);
      return res.status(500).send('Error reading user data');
    }

    const users = JSON.parse(data);
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
      // Redirect to orders page if credentials are valid
      res.redirect('/orders');
    } else {
      // Redirect back or show an error if credentials are invalid
      res.status(401).send('Invalid credentials');
    }
  });
});

let orders = [
  { id: 1, name: 'Product 1', owner: 'Alice', state: 'Pending', time: '10:00' },
  { id: 2, name: 'Product 2', owner: 'Bob', state: 'Completed', time: '12:30' },
  // ... more orders
];

app.get('/orders', (req, res) => {
  readOrders((err, orders) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error reading orders data');
    }
    
    // Render the orders page and pass the orders data to it
    res.render('orders', { orders });
  });
});


// Route to display the edit order form
app.get('/edit-order/:id', (req, res) => {
  // Get the order id from the URL parameter
  const orderId = req.params.id;

  // Find the order by id
  const order = orders.find(o => o.id.toString() === orderId);

  if (order) {
    // Render the edit-order form with the order data
    res.render('edit-order', { order: order });
  } else {
    // If no order found, send a 404 response
    res.status(404).send('Order not found');
  }
});

app.post('/update-order', (req, res) => {
  const { id, name, owner, state, time } = req.body;
  
  readOrders((err, orders) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error reading orders data');
    }

    const orderIndex = orders.findIndex(order => order.id.toString() === id);

    if (orderIndex > -1) {
      orders[orderIndex] = { id, name, owner, state, time };

      writeOrders(orders, (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error saving orders data');
        }
        res.redirect('/orders');
      });
    } else {
      res.status(404).send('Order not found');
    }
  });
});

app.post('/create-order', (req, res) => {
  // Assuming you have the readOrders and writeOrders functions defined as before
  readOrders((err, orders) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error reading orders data');
    }

    // Create a new order object using the data submitted from the form
    const newOrder = {
      id: orders.length + 1, // This is a simple way to assign a unique ID
      name: req.body.name,
      owner: req.body.owner,
      state: req.body.state,
      time: req.body.time
    };

    // Add the new order to the array of orders
    orders.push(newOrder);

    // Write the updated orders array back to the file
    writeOrders(orders, (writeErr) => {
      if (writeErr) {
        console.error(writeErr);
        return res.status(500).send('Error writing to orders data');
      }
      // Redirect to the orders page which should now include the new order
      res.redirect('/orders');
    });
  });
});



// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

function readOrders(callback) {
  fs.readFile(ordersFilePath, (err, data) => {
    if (err) {
      return callback(err, []);
    }
    try {
      const orders = JSON.parse(data);
      callback(null, orders);
    } catch (error) {
      callback(error, []);
    }
  });
}
function writeOrders(orders, callback) {
  const data = JSON.stringify(orders, null, 2);
  fs.writeFile(ordersFilePath, data, callback);
}

