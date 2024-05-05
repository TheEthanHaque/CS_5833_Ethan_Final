const express = require('express');
const path = require('path');
const app = express();
const port = 3000; // You can use any port that is free

app.use(express.static(path.join(__dirname, '.'))); // Serve static files from the project root

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html')); // Ensure this path matches your HTML file location
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
