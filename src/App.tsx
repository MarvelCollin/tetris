import React, { useState, useEffect } from "react";
import "./App.css";

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

const TETROMINOES: { [key: string]: number[][] } = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
};

type Tetromino = keyof typeof TETROMINOES;

interface Position {
  x: number;
  y: number;
}

function createEmptyBoard(): number[][] {
  const board: number[][] = [];
  for (let i = 0; i < ROWS; i++) {
    board.push(new Array(COLS).fill(0));
  }
  return board;
}

function randomTetromino(): Tetromino {
  const tetrominoes = Object.keys(TETROMINOES) as Tetromino[];
  return tetrominoes[Math.floor(Math.random() * tetrominoes.length)];
}

const App: React.FC = () => {
  const [board, setBoard] = useState<number[][]>(createEmptyBoard());
  const [currentTetromino, setCurrentTetromino] = useState<Tetromino>("I");
  const [nextTetromino, setNextTetromino] = useState<Tetromino>(randomTetromino());
  const [position, setPosition] = useState<Position>({ x: Math.floor(COLS / 2) - 2, y: 0 });
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      if (gameOver) return;

      if (e.key === "a") {
        moveTetromino(-1);
      } else if (e.key === "d") {
        moveTetromino(1);
      } else if (e.key === "s") {
        dropTetromino();
      } else if (e.key === "w") {
        rotateTetromino();
      } else if (e.key === " ") {
        forceDropTetromino();
      } else if (e.key === "q") {
        swapTetromino();
      }
    }

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [position, currentTetromino, nextTetromino, board, gameOver]);

  useEffect(() => {
    if (gameOver) return;

    const dropInterval = setInterval(() => {
      dropTetromino();
    }, 400);

    return () => {
      clearInterval(dropInterval);
    };
  }, [position, currentTetromino, board, gameOver]);

  function moveTetromino(direction: number) {
    const newPosition = { x: position.x + direction, y: position.y };
    if (!isColliding(newPosition)) {
      setPosition(newPosition);
    }
  }

  function dropTetromino() {
    const newPosition = { x: position.x, y: position.y + 1 };
    if (!isColliding(newPosition)) {
      setPosition(newPosition);
    } else {
      mergeTetromino();
      spawnNewTetromino();
    }
  }

  function forceDropTetromino() {
    let newY = position.y;
    while (!isColliding({ x: position.x, y: newY + 1 })) {
      newY++;
    }
    setPosition({ x: position.x, y: newY });
  }

  function rotateTetromino() {
    const shape = TETROMINOES[currentTetromino];
    const rotatedShape: number[][] = [];
    for (let x = 0; x < shape[0].length; x++) {
      const newRow: number[] = [];
      for (let y = shape.length - 1; y >= 0; y--) {
        newRow.push(shape[y][x]);
      }
      rotatedShape.push(newRow);
    }

    if (!isColliding(position, rotatedShape)) {
      TETROMINOES[currentTetromino] = rotatedShape;
    }
  }

  function swapTetromino() {
    setCurrentTetromino((prevTetromino) => {
      setNextTetromino(prevTetromino);
      return nextTetromino;
    });
    setPosition({ x: Math.floor(COLS / 2) - 2, y: 0 });
  }

  function isColliding(pos: Position, shape: number[][] = TETROMINOES[currentTetromino]): boolean {
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
  }

  function mergeTetromino() {
    console.log("merging")
    const shape = TETROMINOES[currentTetromino];
    const newBoard = board.map((row) => row.slice());

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newY = y + position.y;
          const newX = x + position.x;
          if (newY >= 0) {
            newBoard[newY][newX] = shape[y][x];
          }
        }
      }
    }

    setBoard(newBoard);

    for (let y = ROWS - 1; y > 0; y--) {
      // Check if the row is completely filled (i.e., every cell is 1)
      if (newBoard[y].every((cell) => cell === 1)) {
        // Clear the filled row
        for (let x = 0; x < COLS; x++) {
          newBoard[y][x] = 0;
        }

        // Shift rows above down by one
        for (let yAxis = y; yAxis > 0; yAxis--) {
          for (let xAxis = 0; xAxis < COLS; xAxis++) {
            newBoard[yAxis][xAxis] = newBoard[yAxis - 1][xAxis];
          }
        }

        // After shifting, reset the top row
        for (let xAxis = 0; xAxis < COLS; xAxis++) {
          newBoard[0][xAxis] = 0;
        }

        // Update the state
        setBoard(newBoard);

        // Since rows have shifted, adjust `y` to recheck the current row index
        y++;
      }
    }

  } 

  function spawnNewTetromino() {
    setCurrentTetromino(nextTetromino);
    setNextTetromino(randomTetromino());
    setPosition({ x: Math.floor(COLS / 2) - 2, y: 0 });

    const randomRotations = Math.floor(Math.random() * 4);
    for (let i = 0; i < randomRotations; i++) {
      rotateTetromino();
    }

    if (isColliding({ x: Math.floor(COLS / 2) - 2, y: 0 })) {
      setGameOver(true);
    }
  }

  function renderBoard() {
    const tempBoard = board.map((row) => row.slice());
    const shape = TETROMINOES[currentTetromino];
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newY = y + position.y;
          const newX = x + position.x;
          if (newY >= 0 && newY < ROWS && newX >= 0 && newX < COLS) {
            tempBoard[newY][newX] = shape[y][x];
          }
        }
      }
    }
    return tempBoard;
  }

  return (
    <div className="App">
      {gameOver ? (
        <h2>Game Over</h2>
      ) : (
        <>
          <div
            className="canvas"
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
                    height: BLOCK_SIZE,
                    backgroundColor: cell ? "blue" : "white",
                    border: "1px solid black",
                  }}
                />
              ))
            )}
          </div>
          <div className="next-tetromino">
            <h3>Next Tetromino:</h3>
            {TETROMINOES[nextTetromino].map((row, y) => (
              <div key={y} style={{ display: "flex" }}>
                {row.map((cell, x) => (
                  <div
                    key={`${y}-${x}`}
                    style={{
                      width: BLOCK_SIZE / 2,
                      height: BLOCK_SIZE / 2,
                      backgroundColor: cell ? "blue" : "white",
                      border: "1px solid black",
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="score">
            <h3>Score: {score}</h3>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
