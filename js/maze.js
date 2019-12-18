/*******************************************************************************
                                GRID SETUP / OPTIONS
********************************************************************************/
const mazeCanvas = document.getElementById('maze');
const ctx = mazeCanvas.getContext('2d');

// Player icon image
const playerIcon = new Image();
playerIcon.src='assets/player.png';

// Waypoint icon Image
const targetIcon = new Image();
targetIcon.src = 'assets/food.png';

// Grid/player initialisation
let grid, player;

// Default Maze Settings/Options
const options = {
    size: 10,
    mazeWidth: 600, // Modifies both the canvas and container
    mazeHeight: 600, // Keep equal to width as canvas is equal in height and width,
    get cellWidth() { // Self Reference using a getter function
        return this.mazeWidth / this.size;
    },
}

/*******************************************************************************
                DOM MANIPULATION (Settings, buttons, score, etc)
********************************************************************************/

let generateBtn = document.getElementById('generate'),
    cellsInput = document.getElementById('cells'),
    difficulty = document.getElementById('difficulty'),
    score = document.getElementById('score'),
    gameTimerBar = document.getElementById('gameTimer'),
    room = document.getElementById('room'),
    gameStarted = false;
    timeLeft = null;

// Apply canvas width to container for a semi-adaptive layout
document.getElementById('container').style.width = options.mazeWidth + "px";
mazeCanvas.width = options.mazeWidth;
mazeCanvas.height = options.mazeHeight;


function countdown() {

    var countdownTimer = setInterval(() => {
        timeLeft -= 0.05;

        gameTimerBar.value = timeLeft;

        if (timeLeft <= 0) {
            clearInterval(countdownTimer);
                messageAlert(`You ran out of time! You collected ${score.innerText}`, 3000, function() {
                setTimeout(function() {
                    window.location.reload();
                }, 10);
            });
        }
        
    }, 50);
}

function messageAlert(msg, time, callback) {

    let alert = document.createElement('div');

    alert.id = "alert";
    alert.innerHTML = `<span>${msg}</span>`;

    document.body.appendChild(alert);

    setTimeout(function() {
    
            var intervalHandle = setInterval(function() {
            
                var styles = window.getComputedStyle(alert);
                var curOpac = styles.getPropertyValue('opacity');
    
                if (curOpac === "0") {
                    document.body.removeChild(alert);
                    clearInterval(intervalHandle);

                    if (callback) {
                        callback();
                    }
                    
                    return;
                }
    
                alert.style.opacity = curOpac - 0.01;
    
            }, 5);

    }, time);
}


window.addEventListener('load', function() {

    // Pull previous setting stored from the browsers local storage
    localStorage.getItem('cells') !== null ? cellsInput.value = localStorage.getItem('cells') : null;
    localStorage.getItem('difficulty') !== null ? difficulty.value = localStorage.getItem('difficulty') : null;

    if (difficulty.value) {
        options.size = difficulty.value;
        cellsInput.value = difficulty.value;
    }

});

cellsInput.addEventListener('change', function(e) {

    // Set number of cells to input value
    options.size = this.value;

    // Disable select input
    difficulty.disabled = true;

    // Modify select value for aesthetics
    if (this.value <= 9) {
        difficulty.value = 5;
    } else if (this.value <= 14) {
        difficulty.value = 10;
    } else if (this.value <= 25) {
        difficulty.value = 15;
    } else {
        difficulty.value = 25;
    };

    // Set previous value after refresh
    localStorage.setItem('cells', this.value);
});

difficulty.addEventListener('change', function(e) {

    // Set number of cells to select value
    options.size = this.value;

    // Disable number input field
    cellsInput.disabled = true;

    // Modify num input val for aesthetics
    cellsInput.value = this.value;

    // Set last value after refresh
    localStorage.setItem('difficulty', this.value);
});

generateBtn.addEventListener('click', function(e) {

    e.preventDefault();

    // Start the countdown
    countdown();

    // Keep progressbar equal to timeLeft so that is relative to the number of cells
    timeLeft = gameTimerBar.max = gameTimerBar.value = Math.floor((options.size) * Math.log(options.size / 1.8));

    // Set button text to indicate new purpose
    generateBtn.value = 'Refresh!';

    // Reset Input availabiliy
    difficulty.disabled = false;
    cellsInput.disabled = false;

    if (gameStarted == true) {
        location.reload();
    } else {

        // Clear canvas before rendering
        ctx.clearRect(0, 0, mazeCanvas.width, mazeCanvas.height);

        if (options.size > 0 && options.size <= 50) {

            // Create a grid
            grid = new Grid(options.size);

            // Calculate a random maze path
            grid.findPath();

            // Draw the maze (Recommended Speed - 1-50)
            grid.drawMaze(5);

            // Create a player instance
            player = new Player(0, 0, grid);

        } else {
            messageAlert('Please enter a number between 1 and 100.', 2500);
        }
    }

    gameStarted = true;
});

/*******************************************************************************
                    REPRESENTS AN INDIVIDUAL CELL WITHIN THE GRID
********************************************************************************/
function Cell(x, y) {
    this.x = x;
    this.y = y;
    this.visited = false;
    this.walls = {
        N: true,
        E: true,
        S: true,
        W: true
    }
}

/*******************************************************************************
                DRAW WALLS IF WALL IS PRESENT INSIDE 'WALLS' ARRAY
********************************************************************************/
Cell.prototype.drawWalls = function(ctx, sLen) {

    const colours = ['#5f5f5f', '#464646'];

    ctx.lineWidth = "2";
    ctx.strokeStyle = colours[Math.floor(Math.random() * colours.length)];

    // Start the paint
    ctx.beginPath();
    
    if (this.walls.N) {
        ctx.moveTo(this.x * sLen, this.y * sLen);
        ctx.lineTo((this.x * sLen) + sLen, this.y * sLen);
    }
    if (this.walls.E) {
        ctx.moveTo((this.x * sLen) + sLen, this.y * sLen);
        ctx.lineTo((this.x * sLen) + sLen, (this.y * sLen) + sLen);

    }
    if (this.walls.S) {
        ctx.moveTo(this.x * sLen, (this.y * sLen) + sLen);
        ctx.lineTo((this.x * sLen) + sLen, (this.y * sLen) + sLen);
    }
    if (this.walls.W) {
        ctx.moveTo(this.x * sLen, this.y * sLen);
        ctx.lineTo(this.x * sLen, (this.y * sLen) + sLen);
    }

    // Draw the wall
    ctx.stroke();
}

/*******************************************************************************
                REMOVE WALL ELEMENT FROM ARRAY BY VALUE
********************************************************************************/
Cell.prototype.destroyWall = function(wall) {
    if (this.walls[wall] === true) {
        this.walls[wall] = false;
    }
}

/*******************************************************************************
        CREATE A NEW GRID OF EQUAL WIDTH AND HEIGHT AS A TWO DIMENSIONAL ARRAY
********************************************************************************/
function Grid(size) {
    this.size = size;
    this.cell = [];

    for (let x = 0; x < size; x++) {
        this.cell[x] = [];
        for (let y = 0; y < size; y++) {
            this.cell[x][y] = new Cell(x, y);
        }
    }
}

/*******************************************************************************
    RETURN A NEW COPY OF AN ARRAY CONTAINING UNVISITED NEIGHBOURING CELLS
********************************************************************************/
Grid.prototype.findNeighbours = function(cell) {

    // Array property returns true if neighbour cell is in grid and not outer non-existent neighbours
    return [
        cell.x > 0 ? this.cell[cell.x - 1][cell.y] : null, // Cell to left
        cell.y > 0 ? this.cell[cell.x][cell.y - 1] : null, // Cell above
        cell.x < this.cell.length-1 ? this.cell[cell.x + 1][cell.y] : null, // Cell to right
        cell.x < this.cell.length-1 ? this.cell[cell.x][cell.y + 1] : null // Cell below
    ].filter(function(cell) { // Return a new array of truthy (not null), unvisited cells
        return cell && !cell.visited;
    });

}


/*******************************************************************************
        CREATES A PATH USING THE DEPTH FIRST SEARCH TRAVERSAL ALGORITHM
********************************************************************************/
Grid.prototype.findPath = function() {

    // Grab current context to refer to inside state obj
    let self = this;

    // Specify options and track the state of the current cell
    let state = {
        startingX: 0,
        startingY: 0,
        stack: [],
        init: function() {
            this.currentCell = self.cell[this.startingX][this.startingY];
            this.currentCell.visited = true;
            this.stack.push(this.currentCell); // Begin with adding first cell to kick start the loop

            return this; // Assigns the return value of init to the state object
        }
    }.init(); // One time initialization to set currentCell

    while (state.stack.length !== 0) {

        // Determine available neighbours that have not been visited
        let neighbours = this.findNeighbours(state.currentCell);

        if (neighbours.length > 0) {
             // Pick a random adjacent neighbour
            let neighbourCell = neighbours[Math.floor(Math.random() * neighbours.length)],
                dx = state.currentCell.x - neighbourCell.x;
                dy = state.currentCell.y - neighbourCell.y;

            if (dx == 1) { // Move left
                state.currentCell.destroyWall('W');
                neighbourCell.destroyWall('E');
            }
            if (dx == -1) { // Move Right
                state.currentCell.destroyWall('E');
                neighbourCell.destroyWall('W');
            }
            if (dy == 1) { // Move up
                state.currentCell.destroyWall('N');
                neighbourCell.destroyWall('S');
            }
            if (dy == -1) { // Move down
                state.currentCell.destroyWall('S');
                neighbourCell.destroyWall('N');
            }

            state.stack.push(neighbourCell);
            state.currentCell = neighbourCell;
            state.currentCell.visited = true;

        } else {
            state.currentCell = state.stack.pop();
        }
    }
    
}

/*******************************************************************************
                   HANDLES THE CANVAS PAINT AFTER MAZE GENERATION
********************************************************************************/
Grid.prototype.drawMaze = function() {

    let self = this;

    for (let x = 0; x < this.size; x++) {
        for (let y = 0; y < this.size; y++) {
            setTimeout(function() {
                self.cell[x][y].drawWalls(ctx, options.cellWidth);
            }, x * 30);
        }
    }
}

/*******************************************************************************
                            CLEAR THE MAZE GRID
********************************************************************************/

Grid.prototype.clearMaze = function() {
    this.size = options.size;
    this.cell = [];

    for (let x = 0; x < options.size; x++) {
        this.cell[x] = [];
        for (let y = 0; y < options.size; y++) {
            this.cell[x][y] = new Cell(x, y);
        }
    }
    ctx.clearRect(0, 0, mazeCanvas.width, mazeCanvas.height);
}

/*******************************************************************************
                   REPRESENTS A PLAYER OBJECT ON THE GRID
********************************************************************************/
function Player(x, y, grid) {

    // Context for player move call - (Note: Event listener closes over Self (to form a closure) and keeps a reference of the player objects state (THIS).
    let self = this;

    this.x = x;
    this.y = y;
    this.grid = grid;
    this.canMove = true;
    this.score = 0;
    this.waypoint = null;
    this.currentCell = grid.cell[this.x][this.y];
    this.pWidth = options.cellWidth // Player Width

    // Draw player image in starting position when instantiated
    ctx.drawImage(playerIcon, this.x * this.pWidth + (this.pWidth/4), (this.y) * this.pWidth + (this.pWidth/4), this.pWidth/2, this.pWidth/2);

    // Create initial waypoint when player object is instantiated
    this.createWaypoint();

    window.addEventListener('keydown', function(e) {

        switch (e.key) {
            case 'w':
                Player.prototype.verifyMove.call(self, 'N');
                break;
            case 'd':
                Player.prototype.verifyMove.call(self, 'E');
                break;
            case 's':
                Player.prototype.verifyMove.call(self, 'S');
                break;
            case 'a':
                Player.prototype.verifyMove.call(self, 'W');
                break;
        }
    });

}

/*******************************************************************************
                     PLAYER COLLISION DETECTION AND MOVEMENT
********************************************************************************/
Player.prototype.verifyMove = function(direction) {

    // Current context
    let self = this;

    let movePlayer = function(cx, cy, dx, dy) {
        
        let cX = (cx * self.pWidth + (self.pWidth / 4)),
            cY = (cy * self.pWidth + (self.pWidth / 4)),
            dX = (dx * self.pWidth + (self.pWidth / 4)),
            dY = (dy * self.pWidth + (self.pWidth / 4)),
            cWidth = self.pWidth / 2;

        // Draw position on canvas
        ctx.clearRect(cX, cY, cWidth, cWidth);
        ctx.drawImage(playerIcon, dX, dY, cWidth, cWidth);


        // Set current cell to cell adjacant in direction speciifed
        self.currentCell = self.grid.cell[dx][dy];

        // Adjust player position
        self.x = dx;
        self.y = dy;

        if (self.x === self.waypoint.x && self.y === self.waypoint.y) {

            self.score++;
            // Remove rect (containing player and waypoint image)
            ctx.clearRect(dX, dY, cWidth, cWidth);

            // Add the image again to put the player back after clear rect
            ctx.drawImage(playerIcon, dX, dY, cWidth, cWidth);

            // New waypoint
            self.createWaypoint();

            timeLeft = Math.floor((options.size) * Math.log(options.size / 1.8));

            // Update the player score
            score.textContent = self.score;

            // Level increase / Room change
            if (self.score % 3 === 0) {

                // Clear the current grid
                grid.clearMaze();

                // Generate a new grid
                grid = new Grid(options.size);

                // Set player to use new grid instance
                player.grid = grid;

                // Bind currentCell to new grid
                player.currentCell = grid.cell[self.x][self.y];

                // Calculate a random maze path
                grid.findPath();

                // Draw the maze (Recommended Speed - 1-50)
                grid.drawMaze(30);

                // Update UI
                room.textContent = parseInt(room.textContent) + 1;

                // Clear grid
                ctx.clearRect(dX, dY, cWidth, cWidth);

                // Add the image again to put the player back after clear rect
                ctx.drawImage(playerIcon, dX, dY, cWidth, cWidth);
    
                // New waypoint
                self.createWaypoint();
            }
        }
    }

    let invalidMove = function(msg) {

        // Prevent further movement
        self.canMove = false;
        
        // Clear the canvas
        ctx.clearRect(0, 0, mazeCanvas.width, mazeCanvas.height);

        // Show score/message, then execute callback (reload)
        messageAlert(msg, 3000, function() {
            setTimeout(function() {
                window.location.reload();
            }, 10);
        });
    }

    // Wall Collision Detection
    switch (direction) {
        case 'N':
            if (this.currentCell.walls[direction] === false && this.currentCell.y > 0 && this.canMove) {
                movePlayer(this.x, this.y, this.x, this.y - 1);
            } else {
                invalidMove(`You reached Room ${room.textContent} and collected ${this.score} Coins!`);
            }
            break;
        case 'E':
            if (this.currentCell.walls[direction] === false && this.currentCell.x < this.grid.size - 1 && this.canMove) {
                movePlayer(this.x, this.y, this.x + 1, this.y);
            } else {
                invalidMove(`You reached Room ${room.textContent} and collected ${this.score} Coins!`);
            }
            break;
        case 'S':
            if (this.currentCell.walls[direction] === false && this.currentCell.y < this.grid.size - 1 && this.canMove) {
                movePlayer(this.x, this.y, this.x, this.y + 1);
            } else {
                invalidMove(`You reached Room ${room.textContent} and collected ${this.score} Coins!`);
            }
            break;
        case 'W':
            if (this.currentCell.walls[direction] === false && this.currentCell.x > 0 && this.canMove) {
                movePlayer(this.x, this.y, this.x - 1, this.y);
            } else {
                invalidMove(`You reached Room ${room.textContent} and collected ${this.score} Coins!`);
            }
            break;
    }    
}

Player.prototype.createWaypoint = function() {

    // cell outer array
    let cells = this.grid.cell;

    const randPos = function(max) {
        return Math.floor(Math.random() * max);
    }

    // Find a random position within the array
    let randX = randPos(this.grid.size),
        randY = randPos(this.grid.size);

    // Check if random position is equal to current player position, if so try again
    if (randX === this.x && randY === this.y) {
        this.createWaypoint();
    } else {
        // Set the player waypoint
        this.waypoint = cells[randX][randY];

        // Paint the waypoint icon on the canvas
        ctx.drawImage(targetIcon, randX * this.pWidth + (this.pWidth/4), (randY) * this.pWidth + (this.pWidth/4), this.pWidth/2, this.pWidth/2);
    }
}