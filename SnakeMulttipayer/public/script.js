let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let socket = io();

let countBLock = 40;
let snakes = Object();
let food = { x: 10, y: 10 };

let sizeBox = 20;

canvas.width = countBLock * sizeBox;
canvas.height = countBLock * sizeBox;

socket.emit('start', 1);

function draw() {
    ctx.fillStyle = "#181818";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (snake in snakes) {
        let currentSnake = snakes[snake];

        for (let i = 0; i < currentSnake.pos.length; i++) {
            let x = currentSnake.pos[i].x;
            let y = currentSnake.pos[i].y;

            // Assign a unique class to each snake's body segment
            let segmentClass = `snake-${snake}`;
            ctx.fillStyle = "green";
            ctx.fillRect(x * sizeBox, y * sizeBox, sizeBox - 1, sizeBox - 1);
            document.querySelector(`.${segmentClass}`)?.classList.remove(segmentClass);
            document.querySelector(`[data-x="${x}"][data-y="${y}"]`)?.classList.add(segmentClass);
        }
    }

    ctx.fillStyle = "#78e08f";
    ctx.fillRect(food.x * sizeBox, food.y * sizeBox, sizeBox - 1, sizeBox - 1);
}

setInterval(draw, 25);

socket.on('snakes', function (msg) {
    snakes = JSON.parse(msg);
});

socket.on('food', function (msg) {
    food = JSON.parse(msg);
});

socket.on('score', function (msg) {
    let { id, score } = msg;
    let scoreElement = document.getElementById(`score-${id}`);
    if (scoreElement) {
        scoreElement.textContent = `| ${score} |`;
    } else {
        let newScoreElement = document.createElement('div');
        newScoreElement.id = `score-${id}`;
        newScoreElement.textContent = `| ${score} |`;
        newScoreElement.classList.add('score');
        document.body.appendChild(newScoreElement);
    }
});

document.addEventListener('keydown', function (event) {
    if (event.code == 'KeyW') {
        socket.emit('keyDown', 'U');
    }
    if (event.code == 'KeyA') {
        socket.emit('keyDown', 'L');
    }
    if (event.code == 'KeyD') {
        socket.emit('keyDown', 'R');
    }
    if (event.code == 'KeyS') {
        socket.emit('keyDown', 'D');
    }
});