const express = require('express');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Set up middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set up database connection
let sequelize;

if (process.env.DB_TYPE === 'mysql') {
  // MySQL configuration
  sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    database: process.env.MYSQL_DATABASE,
    username: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    logging: false
  });
  console.log('Using MySQL database');
} else {
  // SQLite configuration (default)
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, process.env.SQLITE_STORAGE || 'database.sqlite'),
    logging: false
  });
  console.log('Using SQLite database');
}

// Define Score model
const Score = sequelize.define('Score', {
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  seed: {
    type: DataTypes.STRING,
    allowNull: false
  },
  replayData: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

// Sync database
sequelize.sync()
  .then(() => console.log('Database synced'))
  .catch(err => console.error('Error syncing database:', err));

// Routes
app.get('/', (req, res) => {
  res.render('game');
});

app.get('/replay/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const userScore = await Score.findOne({ where: { username } });
    
    if (!userScore) {
      return res.status(404).render('error', { message: 'User not found' });
    }
    
    res.render('replay', { 
      username: userScore.username,
      score: userScore.score,
      seed: userScore.seed,
      replayData: userScore.replayData
    });
  } catch (error) {
    console.error('Error fetching replay:', error);
    res.status(500).render('error', { message: 'Server error' });
  }
});

// API routes
app.get('/api/scores', async (req, res) => {
  try {
    const scores = await Score.findAll({
      order: [['score', 'DESC']],
      limit: 10
    });
    res.json(scores);
  } catch (error) {
    console.error('Error fetching scores:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/scores', async (req, res) => {
  try {
    const { username, score, seed, replayData } = req.body;
    
    // Check if this exact replay already exists in the database
    const duplicateReplay = await Score.findOne({ where: { replayData } });
    
    if (duplicateReplay) {
      return res.status(400).json({ error: 'Duplicate replay data detected' });
    }
    
    // Check if user already has a score
    const existingScore = await Score.findOne({ where: { username } });
    
    if (existingScore) {
      // Only update if new score is higher
      if (score > existingScore.score) {
        await existingScore.update({ score, seed, replayData });
      }
      return res.json(existingScore);
    }
    
    // Create new score
    const newScore = await Score.create({ username, score, seed, replayData });
    res.status(201).json(newScore);
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});