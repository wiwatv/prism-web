const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// --- Serve React Frontend ---
// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// The 'catchall' handler: for any request that doesn't
// match the API routes above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
