import React, { useState, useEffect, useCallback } from 'react';

// Helper to generate unique IDs for tiles
let tileId = 1;
const makeTile = (value, row, col) => ({ id: tileId++, value, row, col });

const GRID_SIZE = 4;
const CELL_SIZE = 80; // px
const CELL_GAP = 16; // px
const BOARD_SIZE = GRID_SIZE * CELL_SIZE + (GRID_SIZE - 1) * CELL_GAP;

function App() {
  const [tiles, setTiles] = useState([]); // Array of {id, value, row, col}
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Color mapping for different numbers
  const getTileColor = (number) => {
    const colors = {
      0: 'bg-gray-200',
      2: 'bg-emerald-100',
      4: 'bg-emerald-200',
      8: 'bg-blue-300',
      16: 'bg-blue-400',
      32: 'bg-purple-400',
      64: 'bg-purple-500',
      128: 'bg-pink-400',
      256: 'bg-pink-500',
      512: 'bg-amber-400',
      1024: 'bg-amber-500',
      2048: 'bg-rose-500',
    };
    return colors[number] || 'bg-rose-600';
  };

  // Text color mapping for better contrast
  const getTextColor = (number) => {
    if (number <= 4) return 'text-gray-800';
    return 'text-white font-extrabold';
  };

  // Initialize the game with two random tiles
  useEffect(() => {
    resetGame();
  }, []);

  // Helper to get a 2D board from tiles
  const getBoard = (tiles) => {
    const board = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));
    tiles.forEach(tile => {
      board[tile.row][tile.col] = tile;
    });
    return board;
  };

  // Add a random tile (2 or 4) to an empty cell
  const addRandomTile = useCallback((tilesArg) => {
    const tiles = tilesArg || [...tiles];
    const board = getBoard(tiles);
    const emptyCells = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (!board[i][j]) emptyCells.push([i, j]);
      }
    }
    if (emptyCells.length > 0) {
      const [i, j] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      tiles.push(makeTile(Math.random() < 0.9 ? 2 : 4, i, j));
    }
    return tiles;
  }, [tiles]);

  // Move logic with correct compress-merge-compress
  const move = useCallback((direction) => {
    let moved = false;
    let mergedScore = 0;
    let newTiles = [...tiles];
    let board = getBoard(newTiles);

    // Helper to compress (slide) a line
    function compress(line) {
      return line.filter(Boolean);
    }
    // Helper to merge a line (returns new line and score delta)
    function merge(line) {
      let res = [];
      let scoreDelta = 0;
      for (let i = 0; i < line.length; i++) {
        if (i < line.length - 1 && line[i].value === line[i + 1].value) {
          line[i].value *= 2;
          scoreDelta += line[i].value;
          // Remove merged tile from newTiles
          newTiles = newTiles.filter(t => t.id !== line[i + 1].id);
          res.push(line[i]);
          i++; // skip next
        } else {
          res.push(line[i]);
        }
      }
      return [res, scoreDelta];
    }

    // For each row/col, process compress-merge-compress
    for (let i = 0; i < GRID_SIZE; i++) {
      let line = [];
      // Get the line (row or col)
      for (let j = 0; j < GRID_SIZE; j++) {
        let r = direction === 'ArrowUp' || direction === 'ArrowDown' ? (direction === 'ArrowUp' ? j : GRID_SIZE - 1 - j) : i;
        let c = direction === 'ArrowLeft' || direction === 'ArrowRight' ? (direction === 'ArrowLeft' ? j : GRID_SIZE - 1 - j) : i;
        line.push(board[r][c]);
      }
      let originalLine = [...line];
      // 1. Compress
      line = compress(line);
      // 2. Merge
      let scoreDelta = 0;
      [line, scoreDelta] = merge(line);
      // 3. Compress again
      line = compress(line);
      // Pad with nulls
      while (line.length < GRID_SIZE) line.push(null);
      // Write back to board and update tile positions
      for (let j = 0; j < GRID_SIZE; j++) {
        let r = direction === 'ArrowUp' || direction === 'ArrowDown' ? (direction === 'ArrowUp' ? j : GRID_SIZE - 1 - j) : i;
        let c = direction === 'ArrowLeft' || direction === 'ArrowRight' ? (direction === 'ArrowLeft' ? j : GRID_SIZE - 1 - j) : i;
        if (board[r][c] !== line[j]) moved = moved || (board[r][c] && (!line[j] || board[r][c].id !== line[j]?.id));
        board[r][c] = line[j];
        if (line[j]) {
          line[j].row = r;
          line[j].col = c;
        }
      }
      mergedScore += scoreDelta;
    }
    newTiles = newTiles.filter(Boolean);
    if (moved) {
      newTiles = addRandomTile(newTiles);
      setScore(s => s + mergedScore);
    }
    setTiles(newTiles);
    return moved;
  }, [tiles, addRandomTile]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (gameOver || animating) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        setAnimating(true);
        move(event.key);
        setTimeout(() => {
          setAnimating(false);
        }, 200);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, gameOver, animating]);

  const resetGame = () => {
    tileId = 1;
    let newTiles = [];
    newTiles = addRandomTile(newTiles);
    newTiles = addRandomTile(newTiles);
    setTiles(newTiles);
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center">
        <div className="flex justify-between items-center mb-4 w-full" style={{maxWidth: BOARD_SIZE}}>
          <h1 className="text-4xl font-bold text-gray-800">2048</h1>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-700">Score: {score}</div>
            <button
              onClick={resetGame}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              New Game
            </button>
          </div>
        </div>
        <div
          className="relative bg-gray-200 rounded-lg flex items-center justify-center"
          style={{
            width: BOARD_SIZE,
            height: BOARD_SIZE,
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          {/* Background grid */}
          <div
            className="absolute top-0 left-0 w-full h-full grid"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
              gap: `${CELL_GAP}px`,
              zIndex: 1,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            {Array(GRID_SIZE * GRID_SIZE).fill().map((_, idx) => (
              <div key={idx} className="bg-gray-300 rounded-lg w-full h-full" />
            ))}
          </div>
          {/* Tiles */}
          {tiles.map(tile => (
            <div
              key={tile.id}
              className={`absolute flex items-center justify-center rounded-lg text-2xl font-bold
                ${getTileColor(tile.value)}
                ${getTextColor(tile.value)}
                transition-all duration-200 ease-out
                transform-gpu will-change-transform`}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                top: tile.row * (CELL_SIZE + CELL_GAP),
                left: tile.col * (CELL_SIZE + CELL_GAP),
                zIndex: 2,
              }}
            >
              {tile.value}
            </div>
          ))}
        </div>
        {gameOver && (
          <div className="mt-4 text-center">
            <p className="text-2xl font-bold text-red-500">Game Over!</p>
            <button
              onClick={resetGame}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
