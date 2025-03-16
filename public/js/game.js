// Game constants
const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE_LENGTH = 3;
const GAME_SPEED = 50; // milliseconds

// Game variables
let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let gameInterval;
let isGameOver = false;
let seed = '';
let replayData = '';
let rng; // ISAAC CSPRNG instance
let highScore = 0;
let highScoreReplay = '';
let highScoreSeed = '';

// DOM elements
const gameBoard = document.getElementById('game-board');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const usernameInput = document.getElementById('username');
const saveScoreButton = document.getElementById('save-score');

// Initialize the game
function initGame() {
  // Clear previous game state
  clearInterval(gameInterval);
  gameBoard.innerHTML = '';
  snake = [];
  direction = 'right';
  nextDirection = 'right';
  score = 0;
  isGameOver = false;
  replayData = '';
  
  // Generate a random seed
  seed = generateSeed(10);
  
  // Initialize the ISAAC CSPRNG with the seed
  rng = new IsaacCSPRNG(seed);
  
  // Create game grid
  createGameGrid();
  
  // Initialize snake
  initSnake();
  
  // Place food
  placeFood();
  
  // Update score display
  updateScore();
  
  // Hide game over message
  gameOverElement.classList.add('hidden');
  
  // Start game loop
  gameInterval = setInterval(gameLoop, GAME_SPEED);
  
  // Set up event listeners
  document.addEventListener('keydown', handleKeyPress);
  saveScoreButton.addEventListener('click', saveScore);
  
  // Load leaderboard
  loadLeaderboard();
}

// Create the game grid
function createGameGrid() {
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = document.createElement('div');
      cell.classList.add('game-cell');
      cell.id = `cell-${x}-${y}`;
      gameBoard.appendChild(cell);
    }
  }
  
  // Set the grid template
  gameBoard.style.display = 'grid';
  gameBoard.style.gridTemplateColumns = `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`;
  gameBoard.style.gridTemplateRows = `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`;
}

// Initialize the snake
function initSnake() {
  // Start with a snake of length 3 in the middle of the grid
  const startX = Math.floor(GRID_SIZE / 2);
  const startY = Math.floor(GRID_SIZE / 2);
  
  for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
    snake.push({ x: startX - i, y: startY });
  }
  
  // Render the initial snake
  renderSnake();
}

// Render the snake on the grid
function renderSnake() {
  // Clear all snake cells first
  document.querySelectorAll('.snake').forEach(cell => {
    cell.classList.remove('snake');
  });
  
  // Render each snake segment
  snake.forEach(segment => {
    const cell = document.getElementById(`cell-${segment.x}-${segment.y}`);
    if (cell) {
      cell.classList.add('snake');
    }
  });
}

// Place food on the grid
function placeFood() {
  // Get all empty cells
  const emptyCells = [];
  
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const cell = document.getElementById(`cell-${x}-${y}`);
      if (cell && !cell.classList.contains('snake')) {
        emptyCells.push({ x, y });
      }
    }
  }
  
  // Randomly select an empty cell for food using ISAAC CSPRNG
  if (emptyCells.length > 0) {
    const randomIndex = Math.floor(rng.random() * emptyCells.length);
    food = emptyCells[randomIndex];
    
    // Render the food
    const foodCell = document.getElementById(`cell-${food.x}-${food.y}`);
    if (foodCell) {
      foodCell.classList.add('food');
    }
  }
}

// Main game loop
function gameLoop() {
  // Move the snake
  moveSnake();
  
  // Check for collisions
  if (checkCollision()) {
    endGame();
    return;
  }
  
  // Check if snake ate food
  if (snake[0].x === food.x && snake[0].y === food.y) {
    // Remove the food
    const foodCell = document.getElementById(`cell-${food.x}-${food.y}`);
    if (foodCell) {
      foodCell.classList.remove('food');
    }
    
    // Don't remove the tail (snake grows)
    // Place new food
    placeFood();
    
    // Increase score
    score++;
    updateScore();
  } else {
    // Remove the tail
    snake.pop();
  }
  
  // Render the updated snake
  renderSnake();
}

// Move the snake
function moveSnake() {
  // Update direction based on nextDirection
  direction = nextDirection;
  
  // Record the move in replay data with consistent format
  switch(direction) {
    case 'up':
      replayData += 'u';
      break;
    case 'down':
      replayData += 'd';
      break;
    case 'left':
      replayData += 'l';
      break;
    case 'right':
      replayData += 'r';
      break;
  }
  
  // Calculate new head position
  const head = { ...snake[0] };
  
  switch (direction) {
    case 'up':
      head.y -= 1;
      break;
    case 'down':
      head.y += 1;
      break;
    case 'left':
      head.x -= 1;
      break;
    case 'right':
      head.x += 1;
      break;
  }
  
  // Add new head to the beginning of the snake
  snake.unshift(head);
}

// Check for collisions
function checkCollision() {
  const head = snake[0];
  
  // Check wall collision
  if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
    return true;
  }
  
  // Check self collision (skip the head)
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      return true;
    }
  }
  
  return false;
}

// Update the score display
function updateScore() {
  scoreElement.textContent = score;
  document.getElementById('high-score').textContent = highScore;
}

// Handle keyboard input
function handleKeyPress(event) {
  // Check if username input is focused - if so, don't process game controls
  if (document.activeElement === usernameInput) {
    return; // Allow normal typing in the username field
  }
  
  // Prevent default action for arrow keys
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(event.key)) {
    event.preventDefault();
  }
  
  // Update direction based on key press
  switch (event.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      if (direction !== 'down') nextDirection = 'up';
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      if (direction !== 'up') nextDirection = 'down';
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      if (direction !== 'right') nextDirection = 'left';
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      if (direction !== 'left') nextDirection = 'right';
      break;
  }
}

// End the game
function endGame() {
  clearInterval(gameInterval);
  isGameOver = true;
  
  // Show game over message
  gameOverElement.classList.remove('hidden');
  finalScoreElement.textContent = score;
  
  // Update high score if current score is higher
  if (score > highScore) {
    highScore = score;
    highScoreReplay = replayData;
    highScoreSeed = seed;
    console.log('New high score:', highScore);
  }
  
  // Restart the game immediately
  initGame();
}

// Generate a random seed
function generateSeed(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

// Save score to the leaderboard
function saveScore() {
  const username = usernameInput.value.trim();
  
  if (!username) {
    alert('Please enter a username');
    return;
  }
  
  // Use the current score or high score based on which is higher
  const scoreToSave = score > highScore ? score : highScore;
  const replayToSave = score > highScore ? replayData : highScoreReplay;
  const seedToSave = score > highScore ? seed : highScoreSeed;
  
  // Send score to the server
  fetch('/api/scores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username,
      score: scoreToSave,
      seed: seedToSave,
      replayData: replayToSave
    })
  })
  .then(response => response.json())
  .then(data => {
    // Reload leaderboard
    loadLeaderboard();
  })
  .catch(error => {
    console.error('Error saving score:', error);
    alert('Error saving score. Please try again.');
  });
}

// Load the leaderboard
async function loadLeaderboard() {
  try {
    const response = await fetch('/api/scores');
    const scores = await response.json();
    
    const leaderboardElement = document.getElementById('leaderboard');
    leaderboardElement.innerHTML = '';
    
    scores.forEach((score, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="py-3 px-6">${index + 1}</td>
        <td class="py-3 px-6">${score.username}</td>
        <td class="py-3 px-6">${score.score}</td>
        <td class="py-3 px-6">
          <a href="/replay/${score.username}" class="text-blue-500 hover:underline">Watch</a>
        </td>
      `;
      leaderboardElement.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading leaderboard:', error);
  }
}

// Initialize the game when the page loads
window.addEventListener('load', initGame);