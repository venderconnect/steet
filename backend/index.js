const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const routes = require('./routes/route');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS - allow frontend origin and required headers
const allowedOrigin = process.env.FRONTEND_URL || '*';
app.use(cors({
	origin: allowedOrigin,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
	allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
	credentials: true,
}));

// Log effective CORS origin for debugging
console.log(`CORS allowed origin: ${allowedOrigin}`);

// Mount routers
app.use('/api', routes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
