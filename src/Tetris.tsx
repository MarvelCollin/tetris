import React, { useState, useEffect, useRef } from "react";
import "../index.css";

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

const TETROMINOES: { [key: string]: number[][] } = {
  I: [
    [1, 1, 1, 1],
  ],
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

interface Block {
  value: number;
  color: string;
}

const COLORS = ["red", "green", "blue", "yellow", "cyan", "purple", "orange"];

function createEmptyBoard(): Block[][] {
  const board: Block[][] = [];
  for (let i = 0; i < ROWS; i++) {
    board.push(new Array(COLS).fill({ value: 0, color: "" }));
  }
  return board;
}

function randomTetromino(): Tetromino {
  const tetrominoes = Object.keys(TETROMINOES) as Tetromino[];
  return tetrominoes[Math.floor(Math.random() * tetrominoes.length)];
}

function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

const Tetris: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef<{ [key: string]: boolean }>({});
  const [board, setBoard] = useState<Block[][]>(createEmptyBoard());
  const [currentTetromino, setCurrentTetromino] = useState<Tetromino>("I");
  const [nextTetromino, setNextTetromino] = useState<Tetromino>(randomTetromino());
  const [position, setPosition] = useState<Position>({ x: Math.floor(COLS / 2) - 2, y: 0 });
  const [shadowPosition, setShadowPosition] = useState<Position>({ x: position.x, y: position.y });
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [color, setColor] = useState<string>(randomColor());
  const [nextColor, setNextColor] = useState<string>(randomColor());
  const [shake, setShake] = useState(false);
  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
  }

  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      if (gameOver) return;
      keys.current[e.key] = true;

      if (keys.current["a"]) {
        moveTetromino(-1);
      } else if (keys.current["d"]) {
        moveTetromino(1);
      } else if (keys.current["s"]) {
        dropTetromino();
      } else if (keys.current["w"]) {
        rotateTetromino();
      } else if (keys.current[" "]) {
        forceDropTetromino();
      } else if (keys.current["q"]) {
        swapTetromino();
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      keys.current[e.key] = false;
    }

    window.addEventListener("keydown", handleKeyPress);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [position, currentTetromino, board, gameOver, shadowPosition]);

  useEffect(() => {
    if (gameOver) return;

    const dropInterval = setInterval(() => {
      dropTetromino();
    }, 500);

    return () => {
      clearInterval(dropInterval);
    };
  }, [position, currentTetromino, board, gameOver]);

  useEffect(() => {
    if (particles.length === 0) return;

    const particleInterval = setInterval(() => {
      setParticles((prevParticles) =>
        prevParticles
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.05,
            life: particle.life - 1,
          }))
          .filter((particle) => particle.life > 0)
      );
    }, 16);

    return () => clearInterval(particleInterval);
  }, [particles]);

  useEffect(() => {
    updateShadowPosition();
    drawBoard();
    drawNextTetromino();
  }, [board, currentTetromino, position, nextTetromino, color, shadowPosition]);

  function drawBoard() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    board.forEach((row, y) => {
      row.forEach((block, x) => {
        if (block.value) {
          drawBlock(ctx, x, y, block.color);
        } else {
          drawBlock(ctx, x, y, "white");
        }
      });
    });

    drawShadowTetromino(ctx);

    const shape = TETROMINOES[currentTetromino];
    shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          drawBlock(ctx, position.x + x, position.y + y, color);
        }
      });
    });

    particles.forEach((particle) => {
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x * BLOCK_SIZE, particle.y * BLOCK_SIZE, BLOCK_SIZE / 4, BLOCK_SIZE / 4);
    });
  }

  function drawNextTetromino() {
    const canvas = nextCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const shape = TETROMINOES[nextTetromino];
    shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          drawBlock(ctx, x, y, nextColor, BLOCK_SIZE / 2);
        } else {
          drawBlock(ctx, x, y, "white", BLOCK_SIZE / 2);
        }
      });
    });
  }

  function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size: number = BLOCK_SIZE) {
    ctx.fillStyle = color;
    ctx.fillRect(x * size, y * size, size, size);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.strokeRect(x * size, y * size, size, size);
  }

  function drawShadowTetromino(ctx: CanvasRenderingContext2D) {
    const shape = TETROMINOES[currentTetromino];
    shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          drawBlock(ctx, shadowPosition.x + x, shadowPosition.y + y, "rgba(0, 0, 0, 0.2)");
        }
      });
    });
  }

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
      mergeTetromino(shadowPosition);
      spawnNewTetromino();
    }
  }

  function forceDropTetromino() {
    setPosition({ ...shadowPosition });
    mergeTetromino(shadowPosition);
    spawnNewTetromino();

    setShake(true);
    setTimeout(() => setShake(false), 100);
  }

  function rotateTetromino() {
    const shape = TETROMINOES[currentTetromino];
    const rotatedShape: number[][] = shape[0].map((_, index) =>
      shape.map((row) => row[index]).reverse()
    );

    if (!isColliding(position, rotatedShape)) {
      setCurrentTetromino((prevTetromino) => {
        return prevTetromino;
      });
      TETROMINOES[currentTetromino] = rotatedShape;
    }
  }

  function swapTetromino() {
    setCurrentTetromino((prevTetromino) => {
      setNextTetromino(prevTetromino);
      setNextColor(color);
      return nextTetromino;
    });
    setColor(nextColor);
    setPosition({ x: Math.floor(COLS / 2) - 2, y: 0 });
  }

  function updateShadowPosition() {
    let newY = position.y;
    while (!isColliding({ x: position.x, y: newY + 1 })) {
      newY++;
    }
    setShadowPosition({ x: position.x, y: newY });
  }

  function isColliding(pos: Position, shape: number[][] = TETROMINOES[currentTetromino]): boolean {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newY = y + pos.y;
          const newX = x + pos.x;

          if (newY >= ROWS || newX < 0 || newX >= COLS || (newY >= 0 && board[newY][newX].value)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function createParticles(row: number) {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        x: Math.random() * COLS,
        y: row,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * -2,
        life: 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  }

  function mergeTetromino(finalPosition: Position) {
    const shape = TETROMINOES[currentTetromino];
    const newBoard = board.map((row) => row.slice());

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newY = y + finalPosition.y;
          const newX = x + finalPosition.x;
          if (newY >= 0) {
            newBoard[newY][newX] = { value: 1, color: color };
          }
        }
      }
    }

    setBoard(newBoard);

    for (let y = ROWS - 1; y >= 0; y--) {
      if (newBoard[y].every((cell) => cell.value === 1)) {
        newBoard.splice(y, 1);
        newBoard.unshift(new Array(COLS).fill({ value: 0, color: "" }));
        createParticles(y);
        setScore((prevScore) => prevScore + 100);
        y++;
      }
    }
  }

  function spawnNewTetromino() {
    setCurrentTetromino(nextTetromino);
    setColor(nextColor);
    setPosition({ x: Math.floor(COLS / 2) - 2, y: 0 });

    setNextTetromino(randomTetromino());
    setNextColor(randomColor());

    if (isColliding({ x: Math.floor(COLS / 2) - 2, y: 0 })) {
      setGameOver(true);
    }
  }

  return (
    <div className="game-section">
      {gameOver ? (
        <h2>Game Over</h2>
      ) : (
        <>
          <div style={{ border: "5px solid black", display: "inline-block" }} className={shake ? "shake" : ""}>
            <canvas ref={canvasRef} width={COLS * BLOCK_SIZE} height={ROWS * BLOCK_SIZE} className="canvas"></canvas>
          </div>
          <div className="next-tetromino" style={{ marginTop: "20px" }}>
            <h3>Next Tetromino:</h3>
            <div style={{ border: "5px solid black", display: "inline-block" }}>
              <canvas ref={nextCanvasRef} width={4 * (BLOCK_SIZE / 2)} height={4 * (BLOCK_SIZE / 2)} className="next-canvas"></canvas>
            </div>
          </div>
          <div className="score" style={{ marginTop: "20px" }}>
            <h3>Score: {score}</h3>
          </div>
        </>
      )}
    </div>
  );
};

export default Tetris;
