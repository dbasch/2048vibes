import React, { useState, useEffect, useCallback } from 'react';

function App() {
  const [board, setBoard] = useState(Array(4).fill().map(() => Array(4).fill(0)));
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
    addRandomTile();
    addRandomTile();
  }, []);

  // Add a random tile (2 or 4) to an empty cell
  const addRandomTile = useCallback(() => {
    setBoard(prevBoard => {
      const emptyCells = [];
      prevBoard.forEach((row, i) => {
        row.forEach((cell, j) => {
          if (cell === 0) {
            emptyCells.push([i, j]);
          }
        });
      });

      if (emptyCells.length > 0) {
        const [i, j] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const newBoard = prevBoard.map(row => [...row]);
        newBoard[i][j] = Math.random() < 0.9 ? 2 : 4;
        return newBoard;
      }
      return prevBoard;
    });
  }, []);

  const moveLeft = useCallback((board) => {
    let moved = false;
    const newBoard = board.map(row => {
      // Filter out zeros
      let filteredRow = row.filter(cell => cell !== 0);
      
      // Merge adjacent equal numbers
      for (let i = 0; i < filteredRow.length - 1; i++) {
        if (filteredRow[i] === filteredRow[i + 1]) {
          filteredRow[i] *= 2;
          setScore(prev => prev + filteredRow[i]);
          filteredRow.splice(i + 1, 1);
          moved = true;
        }
      }
      
      // Pad with zeros
      while (filteredRow.length < 4) {
        filteredRow.push(0);
      }
      
      // Check if the row has changed
      if (JSON.stringify(row) !== JSON.stringify(filteredRow)) {
        moved = true;
      }
      
      return filteredRow;
    });
    
    return { newBoard, moved };
  }, []);

  const moveRight = useCallback((board) => {
    let moved = false;
    const newBoard = board.map(row => {
      // Filter out zeros
      let filteredRow = row.filter(cell => cell !== 0);
      
      // Merge adjacent equal numbers
      for (let i = filteredRow.length - 1; i > 0; i--) {
        if (filteredRow[i] === filteredRow[i - 1]) {
          filteredRow[i] *= 2;
          setScore(prev => prev + filteredRow[i]);
          filteredRow.splice(i - 1, 1);
          moved = true;
        }
      }
      
      // Pad with zeros
      while (filteredRow.length < 4) {
        filteredRow.unshift(0);
      }
      
      // Check if the row has changed
      if (JSON.stringify(row) !== JSON.stringify(filteredRow)) {
        moved = true;
      }
      
      return filteredRow;
    });
    
    return { newBoard, moved };
  }, []);

  const moveUp = useCallback((board) => {
    let moved = false;
    const newBoard = Array(4).fill().map(() => Array(4).fill(0));
    
    for (let j = 0; j < 4; j++) {
      // Get column and filter zeros
      let column = board.map(row => row[j]).filter(cell => cell !== 0);
      
      // Merge adjacent equal numbers
      for (let i = 0; i < column.length - 1; i++) {
        if (column[i] === column[i + 1]) {
          column[i] *= 2;
          setScore(prev => prev + column[i]);
          column.splice(i + 1, 1);
          moved = true;
        }
      }
      
      // Pad with zeros
      while (column.length < 4) {
        column.push(0);
      }
      
      // Update the new board
      for (let i = 0; i < 4; i++) {
        newBoard[i][j] = column[i];
      }
      
      // Check if the column has changed
      const oldColumn = board.map(row => row[j]);
      if (JSON.stringify(oldColumn) !== JSON.stringify(column)) {
        moved = true;
      }
    }
    
    return { newBoard, moved };
  }, []);

  const moveDown = useCallback((board) => {
    let moved = false;
    const newBoard = Array(4).fill().map(() => Array(4).fill(0));
    
    for (let j = 0; j < 4; j++) {
      // Get column and filter zeros
      let column = board.map(row => row[j]).filter(cell => cell !== 0);
      
      // Merge adjacent equal numbers
      for (let i = column.length - 1; i > 0; i--) {
        if (column[i] === column[i - 1]) {
          column[i] *= 2;
          setScore(prev => prev + column[i]);
          column.splice(i - 1, 1);
          moved = true;
        }
      }
      
      // Pad with zeros
      while (column.length < 4) {
        column.unshift(0);
      }
      
      // Update the new board
      for (let i = 0; i < 4; i++) {
        newBoard[i][j] = column[i];
      }
      
      // Check if the column has changed
      const oldColumn = board.map(row => row[j]);
      if (JSON.stringify(oldColumn) !== JSON.stringify(column)) {
        moved = true;
      }
    }
    
    return { newBoard, moved };
  }, []);

  const checkGameOver = useCallback(() => {
    // Check for empty cells
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (board[i][j] === 0) return;
      }
    }

    // Check for possible merges
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (
          (i < 3 && board[i][j] === board[i + 1][j]) ||
          (j < 3 && board[i][j] === board[i][j + 1])
        ) {
          return;
        }
      }
    }

    setGameOver(true);
  }, [board]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (gameOver || animating) return;

      let result;
      switch (event.key) {
        case 'ArrowUp':
          result = moveUp(board);
          break;
        case 'ArrowDown':
          result = moveDown(board);
          break;
        case 'ArrowLeft':
          result = moveLeft(board);
          break;
        case 'ArrowRight':
          result = moveRight(board);
          break;
        default:
          return;
      }

      if (result.moved) {
        setAnimating(true);
        setBoard(result.newBoard);
        // Add new tile after the animation completes
        setTimeout(() => {
          addRandomTile();
          checkGameOver();
          setAnimating(false);
        }, 200);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, gameOver, moveUp, moveDown, moveLeft, moveRight, addRandomTile, checkGameOver, animating]);

  const resetGame = () => {
    setBoard(Array(4).fill().map(() => Array(4).fill(0)));
    setScore(0);
    setGameOver(false);
    // Add initial tiles after the board is reset
    requestAnimationFrame(() => {
      addRandomTile();
      addRandomTile();
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
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
        
        <div className="grid grid-cols-4 gap-4 bg-gray-200 p-4 rounded-lg relative">
          {/* Background grid */}
          {Array(16).fill().map((_, index) => (
            <div
              key={`grid-${index}`}
              className="w-20 h-20 bg-gray-300 rounded-lg"
            />
          ))}
          
          {/* Tiles */}
          {board.map((row, i) =>
            row.map((cell, j) => (
              cell !== 0 && (
                <div
                  key={`${i}-${j}`}
                  className={`absolute w-20 h-20 flex items-center justify-center rounded-lg text-2xl font-bold
                    ${getTileColor(cell)}
                    ${getTextColor(cell)}
                    transition-all duration-200 ease-out
                    transform-gpu will-change-transform`}
                  style={{
                    top: `${i * 6 + 1}rem`,
                    left: `${j * 6 + 1}rem`,
                  }}
                >
                  {cell}
                </div>
              )
            ))
          )}
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
