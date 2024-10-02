import React, { useState, useEffect } from "react";
import "./App.css";

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30; 

const TETROMINOES = {
  I: [
    [1, 1, 1, 1]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1]
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1]
  ]
};

type Tetromino = keyof typeof TETROMINOES;

interface Position {
  x: number;
  y: number;
}

const App: React.FC = () => {
  const [board, setBoard] = useState<number[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(0))
  );
  const [currentTetromino, setCurrentTetromino] = useState<Tetromino>("I");
  const [position, setPosition] = useState<Position>({ x: COLS / 2 - 2, y: 0 });
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return;

      switch (e.key) {
        case "a":
          moveTetromino(-1);
          break;
        case "d":
          moveTetromino(1);
          break;
        case "s":
          dropTetromino(); 
          break;
        case "w":
          rotateTetromino(true);
          break;
        case " ":
          forceDropTetromino();
          break;
      } 
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [position, currentTetromino, board, gameOver]);

  useEffect(() => {
    if (gameOver) return;

    const dropInterval = setInterval(() => {
      dropTetromino();
    }, 400);

    return () => clearInterval(dropInterval);
  }, [position, currentTetromino, board, gameOver]);

  const moveTetromino = (direction: number) => {
    const newPosition = { x: position.x + direction, y: position.y };
    if (!isColliding(newPosition)) {
      setPosition(newPosition);
    }
  };

  const dropTetromino = () => {
    const newPosition = { x: position.x, y: position.y + 1 };
    if (!isColliding(newPosition)) {
      setPosition(newPosition);
    } else {
      mergeTetromino();
      checkAndClearRows();
      spawnNewTetromino();
    }
  };

  const forceDropTetromino = () => {
    let newPosition = { ...position };
    
    while (!isColliding({ x: newPosition.x, y: newPosition.y + 1 })) {
      newPosition.y += 1;
    }
    
    setPosition(newPosition);

    mergeTetromino();
    checkAndClearRows();
    spawnNewTetromino();
  };

  const rotateTetromino = (clockwise: boolean) => {
    const shape = TETROMINOES[currentTetromino];
    const rotatedShape = clockwise
      ? shape[0].map((_, index) => shape.map((row) => row[index]).reverse())
      : shape[0].map((_, index) =>
          shape.map((row) => row[row.length - 1 - index])
        );

    if (!isColliding(position, rotatedShape)) {
      TETROMINOES[currentTetromino] = rotatedShape;
    }
  };

  const isColliding = (pos: Position, shape = TETROMINOES[currentTetromino]) => {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newY = y + pos.y;
          const newX = x + pos.x;

          if (
            newY >= ROWS ||
            newX < 0 ||
            newX >= COLS ||
            (newY >= 0 && board[newY][newX])
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const mergeTetromino = () => {
    const shape = TETROMINOES[currentTetromino];
    const newBoard = board.map((row) => [...row]);

    shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const newY = y + position.y;
          const newX = x + position.x;
          if (newY >= 0) newBoard[newY][newX] = value;
        }
      });
    });

    setBoard(newBoard);
  };

  const checkAndClearRows = () => {
    const newBoard = board.filter((row) => row.some((cell) => cell === 0));
    const rowsCleared = ROWS - newBoard.length;

    if (rowsCleared > 0) {
      const emptyRows = Array.from({ length: rowsCleared }, () => Array(COLS).fill(0));
      setBoard([...emptyRows, ...newBoard]);
    }
  };

  const spawnNewTetromino = () => {
    const tetrominoes: Tetromino[] = Object.keys(TETROMINOES) as Tetromino[];
    setCurrentTetromino(tetrominoes[Math.floor(Math.random() * tetrominoes.length)]);
    setPosition({ x: COLS / 2 - 2, y: 0 });

    if (isColliding({ x: COLS / 2 - 2, y: 0 })) {
      setGameOver(true);
    }
  };

  const renderBoard = () => {
    const tempBoard = board.map((row) => [...row]);
    const shape = TETROMINOES[currentTetromino];

    shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const newY = y + position.y;
          const newX = x + position.x;
          if (newY >= 0 && newY < ROWS && newX >= 0 && newX < COLS) {
            tempBoard[newY][newX] = value;
          }
        }
      });
    });

    return tempBoard;
  };

  return (
    <div className="App">
      <br />
      {gameOver ? (
        <h2>Game Over</h2>
      ) : (
        <div className="canvas"
          style={{
            display: "grid",
            gridTemplateRows: `repeat(${ROWS}, ${BLOCK_SIZE}px)`,
            gridTemplateColumns: `repeat(${COLS}, ${BLOCK_SIZE}px)`,
          }}
        >
          {renderBoard().map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                style={{
                  width: BLOCK_SIZE,
                  backgroundColor: cell ? "blue" : "white",
                  border: "1px solid black",
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default App;
