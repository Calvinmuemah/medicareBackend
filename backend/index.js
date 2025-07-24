require('dotenv').config();
const express = require('express');
const mongoose = require('./config/db');

const app = express();
app.use(express.json());
app.use(require('cors')());

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
