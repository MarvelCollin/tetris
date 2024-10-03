import React, { useState, useEffect, useRef } from "react";
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
    const [board, setBoard] = useState<Block[][]>(createEmptyBoard());
    const [currentTetromino, setCurrentTetromino] = useState<Tetromino>("I");
    const [nextTetromino, setNextTetromino] = useState<Tetromino>(randomTetromino());
    const [position, setPosition] = useState<Position>({ x: Math.floor(COLS / 2) - 2, y: 0 });
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [score, setScore] = useState<number>(0);
    const [color, setColor] = useState<string>(randomColor());
    const [nextColor, setNextColor] = useState<string>(randomColor());

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

    useEffect(() => {
        drawBoard();
        drawNextTetromino();
    }, [board, currentTetromino, position, nextTetromino, color]);

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
        let newY = position.y;
        while (!isColliding({ x: position.x, y: newY + 1 })) {
            newY++;
        }

        const shape = TETROMINOES[currentTetromino];
        shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell) {
                    drawBlock(ctx, position.x + x, newY + y, "rgba(0, 0, 0, 0.2)"); 
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
            setNextColor(color);
            return nextTetromino;
        });
        setColor(nextColor);
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
                        (newY >= 0 && board[newY][newX].value)
                    ) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function mergeTetromino() {
        const shape = TETROMINOES[currentTetromino];
        const newBoard = board.map((row) => row.slice());

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const newY = y + position.y;
                    const newX = x + position.x;
                    if (newY >= 0) {
                        newBoard[newY][newX] = { value: 1, color: color };
                    }
                }
            }
        }

        setBoard(newBoard);

        for (let y = ROWS - 1; y > 0; y--) {
            if (newBoard[y].every((cell) => cell.value === 1)) {
                newBoard.splice(y, 1);
                newBoard.unshift(new Array(COLS).fill({ value: 0, color: "" }));
                setScore((prevScore) => prevScore + 100);
                y++;
            }
        }
    }

    function spawnNewTetromino() {
        setCurrentTetromino(nextTetromino);
        setNextTetromino(randomTetromino());
        setPosition({ x: Math.floor(COLS / 2) - 2, y: 0 });
        setColor(nextColor);
        setNextColor(randomColor());

        const randomRotations = Math.floor(Math.random() * 4);
        for (let i = 0; i < randomRotations; i++) {
            rotateTetromino();
        }

        if (isColliding({ x: Math.floor(COLS / 2) - 2, y: 0 })) {
            setGameOver(true);
        }
    }

    return (
        <div className="App">
            {gameOver ? (
                <h2>Game Over</h2>
            ) : (
                <>
                    <div style={{ border: "5px solid black", display: "inline-block" }}>
                        <canvas
                            ref={canvasRef}
                            width={COLS * BLOCK_SIZE}
                            height={ROWS * BLOCK_SIZE}
                            className="canvas"
                        ></canvas>
                    </div>
                    <div className="next-tetromino" style={{ marginTop: "20px" }}>
                        <h3>Next Tetromino:</h3>
                        <div style={{ border: "5px solid black", display: "inline-block" }}>
                            <canvas
                                ref={nextCanvasRef}
                                width={4 * (BLOCK_SIZE / 2)}
                                height={4 * (BLOCK_SIZE / 2)}
                                className="next-canvas"
                            ></canvas>
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
