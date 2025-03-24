// Game constants
const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE_LENGTH = 3;
const REPLAY_SPEED = 52; // milliseconds

// Game variables
let snake = [];
let food = {};
let direction = 'right';
let score = 0;
let replayInterval;
let currentMoveIndex = 0;
let isPaused = true;
let borderCollisionCounter = 0; // Counter for border collision grace period

// DOM elements
const gameBoard = document.getElementById('game-board');
const playPauseButton = document.getElementById('play-pause');
const restartButton = document.getElementById('restart');

// Initialize the replay
function initReplay() {
  // Clear previous game state
  clearInterval(replayInterval);
  gameBoard.innerHTML = '';
  snake = [];
  direction = 'right';
  score = 0;
  currentMoveIndex = 0;
  isPaused = true;
  borderCollisionCounter = 0; // Reset border collision counter
  
  // Update play/pause button
  playPauseButton.textContent = 'Play';
  
  // Initialize the ISAAC CSPRNG with the exact same seed from the game
  rng = new IsaacCSPRNG(gameSeed);
  
  // Create game grid
  createGameGrid();
  
  // Initialize snake
  initSnake();
  
  // Place food
  placeFood();
  
  // Set up event listeners
  playPauseButton.addEventListener('click', togglePlayPause);
  restartButton.addEventListener('click', initReplay);
  
  console.log('Replay initialized with seed:', gameSeed);
  console.log('Replay data length:', replayData.length);
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
  
  // Use the ISAAC CSPRNG for deterministic random number generation
  const randomIndex = Math.floor(rng.random() * emptyCells.length);
  food = emptyCells[randomIndex];
  
  // Render the food
  const foodCell = document.getElementById(`cell-${food.x}-${food.y}`);
  if (foodCell) {
    foodCell.classList.add('food');
  }
}

// Toggle play/pause
function togglePlayPause() {
  isPaused = !isPaused;
  
  if (isPaused) {
    clearInterval(replayInterval);
    playPauseButton.textContent = 'Play';
  } else {
    playPauseButton.textContent = 'Pause';
    replayInterval = setInterval(replayNextMove, REPLAY_SPEED);
  }
}

// Replay the next move
function replayNextMove() {
  if (currentMoveIndex >= replayData.length) {
    // End of replay
    clearInterval(replayInterval);
    isPaused = true;
    playPauseButton.textContent = 'Play';
    return;
  }
  
  // Get the next move from replay data
  const move = replayData[currentMoveIndex];
  currentMoveIndex++;
  
  // Set direction based on move
  switch (move) {
    case 'u':
      direction = 'up';
      break;
    case 'd':
      direction = 'down';
      break;
    case 'l':
      direction = 'left';
      break;
    case 'r':
      direction = 'right';
      break;
  }
  
  // Move the snake
  moveSnake();
  
  // Check for collisions (should not happen in a valid replay)
  if (checkCollision()) {
    clearInterval(replayInterval);
    isPaused = true;
    playPauseButton.textContent = 'Play';
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
  } else {
    // Remove the tail
    snake.pop();
  }
  
  // Render the updated snake
  renderSnake();
}

// Move the snake
function moveSnake() {
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
  
  // Check wall collision with grace period
  if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
    // Freeze the snake at the border by adjusting the head position
    if (head.x < 0) head.x = 0;
    if (head.x >= GRID_SIZE) head.x = GRID_SIZE - 1;
    if (head.y < 0) head.y = 0;
    if (head.y >= GRID_SIZE) head.y = GRID_SIZE - 1;
    
    borderCollisionCounter++;
    // Only return true if the snake has been in collision with a border for 2 consecutive frames
    return borderCollisionCounter >= 2;
  } else {
    // Reset the counter if not colliding with a border
    borderCollisionCounter = 0;
  }
  
  // Check self collision (skip the head)
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      return true;
    }
  }
  
  return false;
}

// Initialize the replay when the page loads
window.addEventListener('load', initReplay);