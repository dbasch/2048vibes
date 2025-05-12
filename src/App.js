import React, { useState, useEffect, useCallback } from 'react';

// Helper to generate unique IDs for tiles
let tileId = 1;
const makeTile = (value, row, col) => ({ id: tileId++, value, row, col });

const CELL_GAP = 16; // px
const MIN_CELL_SIZE = 48; // px, minimum size for mobile
const MAX_CELL_SIZE = 80; // px, maximum size for desktop

function App() {
  const [gridSize, setGridSize] = useState(4); // Default to 4x4
  const [tiles, setTiles] = useState([]); // Array of {id, value, row, col}
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [mergedIds, setMergedIds] = useState([]); // Track merged tile ids for animation

  // Responsive cell size calculation
  const [cellSize, setCellSize] = useState(MAX_CELL_SIZE);
  const [boardSize, setBoardSize] = useState(0);

  // Responsive board sizing
  useEffect(() => {
    function updateSizes() {
      const maxBoardWidth = Math.min(window.innerWidth, 480); // 480px max for mobile
      const maxBoardHeight = Math.min(window.innerHeight * 0.7, 480); // 70vh or 480px
      const maxBoard = Math.min(maxBoardWidth, maxBoardHeight);
      const size = Math.max(
        MIN_CELL_SIZE,
        Math.min(
          MAX_CELL_SIZE,
          Math.floor((maxBoard - (gridSize - 1) * CELL_GAP) / gridSize)
        )
      );
      setCellSize(size);
      setBoardSize(size * gridSize + (gridSize - 1) * CELL_GAP);
    }
    updateSizes();
    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, [gridSize]);

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
    resetGame(gridSize);
    // eslint-disable-next-line
  }, [gridSize]);

  // Helper to get a 2D board from tiles
  const getBoard = (tiles) => {
    const board = Array(gridSize).fill().map(() => Array(gridSize).fill(null));
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
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (!board[i][j]) emptyCells.push([i, j]);
      }
    }
    if (emptyCells.length > 0) {
      const [i, j] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      tiles.push(makeTile(Math.random() < 0.9 ? 2 : 4, i, j));
    }
    return tiles;
  }, [tiles, gridSize]);

  // Move logic with correct compress-merge-compress and delayed new tile
  const move = useCallback((direction) => {
    let moved = false;
    let mergedScore = 0;
    let newTiles = [...tiles];
    let board = getBoard(newTiles);
    let justMergedIds = [];

    function compress(line) {
      return line.filter(Boolean);
    }
    function merge(line) {
      let res = [];
      let scoreDelta = 0;
      for (let i = 0; i < line.length; i++) {
        if (i < line.length - 1 && line[i].value === line[i + 1].value) {
          line[i].value *= 2;
          scoreDelta += line[i].value;
          justMergedIds.push(line[i].id); // Track the merged tile's id
          newTiles = newTiles.filter(t => t.id !== line[i + 1].id);
          res.push(line[i]);
          i++;
        } else {
          res.push(line[i]);
        }
      }
      return [res, scoreDelta];
    }

    for (let i = 0; i < gridSize; i++) {
      let line = [];
      for (let j = 0; j < gridSize; j++) {
        let r = direction === 'ArrowUp' || direction === 'ArrowDown' ? (direction === 'ArrowUp' ? j : gridSize - 1 - j) : i;
        let c = direction === 'ArrowLeft' || direction === 'ArrowRight' ? (direction === 'ArrowLeft' ? j : gridSize - 1 - j) : i;
        line.push(board[r][c]);
      }
      let originalLine = [...line];
      line = compress(line);
      let scoreDelta = 0;
      [line, scoreDelta] = merge(line);
      line = compress(line);
      while (line.length < gridSize) line.push(null);
      for (let j = 0; j < gridSize; j++) {
        let r = direction === 'ArrowUp' || direction === 'ArrowDown' ? (direction === 'ArrowUp' ? j : gridSize - 1 - j) : i;
        let c = direction === 'ArrowLeft' || direction === 'ArrowRight' ? (direction === 'ArrowLeft' ? j : gridSize - 1 - j) : i;
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
      setTiles(newTiles);
      setScore(s => s + mergedScore);
      setMergedIds(justMergedIds);
      setTimeout(() => {
        setTiles(addRandomTile([...newTiles]));
        setMergedIds([]); // Remove merge animation after new tile appears
      }, 200); // Wait for animation before adding new tile
    } else {
      setTiles(newTiles);
      setMergedIds([]);
    }
    return moved;
  }, [tiles, addRandomTile, gridSize]);

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

  // Touch support for mobile
  const touchStartRef = React.useRef(null);

  useEffect(() => {
    const board = document.getElementById('game-board');
    if (!board) return;
    let isSwiping = false;
    let swipeStartedInside = false;
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        const rect = board.getBoundingClientRect();
        const x = e.touches[0].clientX;
        const y = e.touches[0].clientY;
        swipeStartedInside =
          x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        if (swipeStartedInside) {
          touchStartRef.current = { x, y };
          isSwiping = false;
        } else {
          touchStartRef.current = null;
        }
      }
    };
    const handleTouchMove = (e) => {
      if (!touchStartRef.current || !swipeStartedInside) return;
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        isSwiping = true;
        e.preventDefault(); // Prevent scroll when swiping inside the board
      }
    };
    const handleTouchEnd = (e) => {
      if (!touchStartRef.current || !swipeStartedInside) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (Math.max(absDx, absDy) > 30) { // Minimum swipe distance
        let direction = null;
        if (absDx > absDy) {
          direction = dx > 0 ? 'ArrowRight' : 'ArrowLeft';
        } else {
          direction = dy > 0 ? 'ArrowDown' : 'ArrowUp';
        }
        if (!gameOver && !animating) {
          setAnimating(true);
          move(direction);
          setTimeout(() => setAnimating(false), 200);
        }
      }
      touchStartRef.current = null;
      isSwiping = false;
      swipeStartedInside = false;
    };
    board.addEventListener('touchstart', handleTouchStart, { passive: false });
    board.addEventListener('touchmove', handleTouchMove, { passive: false });
    board.addEventListener('touchend', handleTouchEnd, { passive: false });
    return () => {
      board.removeEventListener('touchstart', handleTouchStart);
      board.removeEventListener('touchmove', handleTouchMove);
      board.removeEventListener('touchend', handleTouchEnd);
    };
  }, [move, gameOver, animating]);

  // Menu for grid size selection
  const handleGridSizeChange = (e) => {
    setGridSize(Number(e.target.value));
    e.target.blur(); // Remove focus so arrow keys go to the game
  };

  // Render
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center w-screen h-screen">
      <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center">
        <div className="flex justify-between items-center mb-4 w-full" style={{maxWidth: boardSize}}>
          <h1 className="text-4xl font-bold text-gray-800">2048</h1>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-700">Score: {score}</div>
            <button
              onClick={() => resetGame(gridSize)}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              New Game
            </button>
          </div>
        </div>
        {/* Grid size menu */}
        <div className="mb-4 w-full flex justify-center">
          <label htmlFor="grid-size" className="mr-2 font-semibold">Grid Size:</label>
          <select
            id="grid-size"
            value={gridSize}
            onChange={handleGridSizeChange}
            className="border rounded px-2 py-1"
          >
            {[4,5,6,7,8].map(size => (
              <option key={size} value={size}>{size} x {size}</option>
            ))}
          </select>
        </div>
        <div
          id="game-board"
          className="relative bg-gray-200 rounded-lg flex items-center justify-center"
          style={{
            width: boardSize,
            height: boardSize,
            margin: '0 auto',
            boxSizing: 'border-box',
            touchAction: 'none',
            maxWidth: '100vw',
            maxHeight: '70vh',
          }}
        >
          {/* Background grid */}
          <div
            className="absolute top-0 left-0 w-full h-full grid"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
              gap: `${CELL_GAP}px`,
              zIndex: 1,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            {Array(gridSize * gridSize).fill().map((_, idx) => (
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
                transform-gpu will-change-transform
                ${mergedIds.includes(tile.id) ? 'animate-merge' : ''}`}
              style={{
                width: cellSize,
                height: cellSize,
                top: tile.row * (cellSize + CELL_GAP),
                left: tile.col * (cellSize + CELL_GAP),
                zIndex: 2,
                fontSize: cellSize > 50 ? '2rem' : '1.2rem',
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
              onClick={() => resetGame(gridSize)}
              className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );

  function resetGame(size) {
    tileId = 1;
    let newTiles = [];
    for (let i = 0; i < 2; i++) newTiles = addRandomTile(newTiles);
    setTiles(newTiles);
    setScore(0);
    setGameOver(false);
    setMergedIds([]);
  }
}

export default App;
