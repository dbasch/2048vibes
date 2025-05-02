import { useState, useEffect } from "react";

const GRID_SIZE = 5;
const START_TILES = 2;

function generateEmptyGrid() {
  return Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(null));
}

function spawnTile(grid) {
  const empty = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (!grid[i][j]) empty.push([i, j]);
    }
  }
  if (empty.length === 0) return grid;
  const [i, j] = empty[Math.floor(Math.random() * empty.length)];
  grid[i][j] = Math.random() < 0.9 ? 1 : 2;
  return [...grid];
}

function slide(row) {
  const newRow = row.filter(x => x !== null);
  for (let i = 0; i < newRow.length - 1; i++) {
    if (canMerge(newRow[i], newRow[i + 1])) {
      newRow[i] = newRow[i] + newRow[i + 1];
      newRow[i + 1] = null;
    }
  }
  return [...newRow.filter(x => x !== null), ...Array(GRID_SIZE - newRow.filter(x => x !== null).length).fill(null)];
}

function transpose(grid) {
  return grid[0].map((_, i) => grid.map(row => row[i]));
}

function reverseRows(grid) {
  return grid.map(row => [...row].reverse());
}

function canMerge(a, b) {
  if (a === null || b === null) return false;
  return (a + b) % 5 === 0; // Toy fusion rule: merge if sum divisible by 5
}

function EntropyGrid() {
  const [grid, setGrid] = useState(generateEmptyGrid());

  useEffect(() => {
    let newGrid = [...grid];
    for (let i = 0; i < START_TILES; i++) {
      newGrid = spawnTile(newGrid);
    }
    setGrid(newGrid);
  }, []);

  function handleMove(dir) {
    let newGrid;
    if (dir === "left") {
      newGrid = grid.map(row => slide(row));
    } else if (dir === "right") {
      newGrid = reverseRows(grid).map(row => slide(row));
      newGrid = reverseRows(newGrid);
    } else if (dir === "up") {
      const transposed = transpose(grid);
      const moved = transposed.map(row => slide(row));
      newGrid = transpose(moved);
    } else if (dir === "down") {
      const transposed = transpose(grid);
      const reversed = reverseRows(transposed);
      const moved = reversed.map(row => slide(row));
      newGrid = transpose(reverseRows(moved));
    }
    setGrid(spawnTile(newGrid));
  }

  function handleKeyDown(e) {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      handleMove(e.key.replace("Arrow", "").toLowerCase());
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Entropy Grid</h1>
      <div className="grid grid-cols-5 gap-1">
        {grid.flat().map((val, idx) => (
          <div
            key={idx}
            className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded text-xl"
          >
            {val ?? ""}
          </div>
        ))}
      </div>
    </div>
  );
}

export default EntropyGrid;

