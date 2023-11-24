let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let port = process.env.PORT || 3000;

let snakes = Object();//содержит информацию о змейках каждого подключенного пользователя
let food = { x: 10, y: 10 };//объект, представляющий координаты еды на игровом поле
let countBLock = 40;//количество блоков на игровом поле (40x40)


//Обработка маршрутов:
app.get('/', function (req, res) {//Маршрут '/' отвечает за отправку файла index.html из папки public
    res.sendFile(__dirname + '/public/index.html');
});
app.get('/script.js', function (req, res) {//Маршрут '/script.js' отвечает за отправку файла script.js из папки public
    res.sendFile(__dirname + '/public/script.js');
});
app.get('/socket.io.js', function (req, res) {//Маршрут '/socket.io.js' отвечает за отправку файла socket.io.js из папки public
    res.sendFile(__dirname + '/public/socket.io.js');
});


//Обработка событий Socket.IO:
io.on('connection', function (socket) {//При подключении нового клиента, выполняется обработчик события 'connection'. Внутри обработчика:

    socket.on('start', function () {
        snakes[socket.id] = { move: 'R', pm: 'R', pos: [{ x: 3, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 3 }], score: 0 }; // Added score property Создается новая запись для змейки клиента в объекте snakes
        socket.emit('food', JSON.stringify(food));//Отправляется клиенту информация о текущей позиции еды с помощью события 'food'
        socket.emit('score', { id: socket.id, score: 0 });//Отправляется клиенту информация о текущем счете змейки с помощью события 'score'
    });

    socket.on('disconnect', function () {//При отключении клиента, выполняется обработчик события 'disconnect'. Внутри обработчика:
        delete snakes[socket.id];//удаляется запись о змейке
    });

    socket.on('keyDown', function (msg) {//При получении события 'keyDown' от клиента, выполняется обработчик события. Внутри обработчика: 
        //Обновляется направление движения змейки клиента в соответствии с полученным сообщением
        if (snakes.hasOwnProperty(socket.id)) {
            snakes[socket.id].pm = msg;
        }
    });

});

function step() {//Функция step() выполняется с интервалом 200 миллисекунд и отвечает за обновление состояния игры:
    firstWhile: for (snake in snakes) {//В цикле for...in перебираются все змейки в объекте snakes

        let currentSnake = snakes[snake];//Получается текущая змейка и ее координаты

        let x = currentSnake.pos[0].x;
        let y = currentSnake.pos[0].y;

        if ((currentSnake.pm == 'R' && currentSnake.move != 'L') || (currentSnake.pm == 'L' && currentSnake.move != 'R') || (currentSnake.pm == 'U' && currentSnake.move != 'D') || (currentSnake.pm == 'D' && currentSnake.move != 'U')) {
            currentSnake.move = currentSnake.pm;
        }

        if (currentSnake.move == 'R') {
            x++;
        }
        if (currentSnake.move == 'L') {
            x--;
        }
        if (currentSnake.move == 'U') {
            y--;
        }
        if (currentSnake.move == 'D') {
            y++;
        }

        currentSnake.pos.pop();
        currentSnake.pos.unshift({ x: x, y: y });

        for (snakeOther in snakes) {
            for (let i = 0; i < snakes[snakeOther].pos.length; i++) {
                if (snakes[snakeOther].pos[i].x == x && snakes[snakeOther].pos[i].y == y) {
                    if (snakeOther == snake && i == 0) {
                        continue;
                    }
                    delete snakes[snake];
                    continue firstWhile;
                }
            }
        }

        if (x > countBLock || x < 0 || y < 0 || y > countBLock) {
            delete snakes[snake];
        }

        if (food.x == x && food.y == y) {
            food = { x: getRandomInt(countBLock), y: getRandomInt(countBLock) };
            io.sockets.emit('food', JSON.stringify(food));
            currentSnake.pos.push({ x: x, y: y });

            currentSnake.score++; // Increment the score when food is eaten
            io.sockets.emit('score', { id: snake, score: currentSnake.score });
        }
    }

    io.sockets.emit('snakes', JSON.stringify(snakes));
}

setInterval(step, 200);

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

http.listen(port);