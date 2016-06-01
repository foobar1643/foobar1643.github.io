function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var CellChangedEvent = function(type, x, y, neighborsMines) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.mines = neighborsMines;
}

var GameStateChangeEvent = function(type) {
    this.type = type;
}

var Game = function() {
    this.GAME_GOING = "going";
    this.GAME_LOST = "lost";
    this.GAME_WON = "won";

    this.gameState = this.GAME_GOING;
    this.gameSizeX = 8;
    this.gameSizeY = 8;
    this.totalMines = 9;
    this.openedCells = this.generateCells();
    this.flagedCells = new Array();
    this.mines = this.generateMines();
};

var DOMview = function(model, table) {
    this.model = model;
    this.model.addEventListener("cellOpened", this.cellOpenedEventHandler.bind(this));
    this.model.addEventListener("cellFlaged", this.cellFlagedEventHandler.bind(this));
    this.model.addEventListener("cellUnflaged", this.cellFlagedEventHandler.bind(this));
    this.model.addEventListener("gameLost", this.gameLostEventHandler.bind(this));
    this.model.addEventListener("gameWon", this.gameWonEventHandler.bind(this));
    this.model.addEventListener("gameRestart", this.gameRestartEventHandler.bind(this));
    this.gameTable = table;
    this.gameField = null;
    this.popupWindow = null;
};

var MouseController = function(model, view) {
    this.model = model;
    this.view = view;
    this.model.addEventListener("gameRestart", this.gameRestartEventHandler.bind(this));
};

Game.prototype.resetGame = function() {
    this.gameState = this.GAME_GOING;
    this.openedCells = this.generateCells();
    this.flagedCells = new Array();
    this.mines = null;
    this.mines = this.generateMines();
    var restartEvent = new GameStateChangeEvent("gameRestart");
    this.dispatchEvent(restartEvent);
}

Game.prototype.generateCells = function() {
    var cells = new Array();
    for(var y = 0; y < this.gameSizeY; y++) {
        cells[y] = new Array();
        for(var x = 0; x < this.gameSizeX; x++) {
            cells[y][x] = false;
        }
    }
    return cells;
}

Game.prototype.generateMines = function() {
    var mines = new Array();
    for(var i = 0; i < this.totalMines; i++) {
        mines.push([getRandomInt(0, this.gameSizeY - 1), getRandomInt(0, this.gameSizeX - 1)]);
    }
    return mines;
}

Game.prototype.isMine = function(x, y) {
    for(var i = 0; i < this.totalMines; i++) {
        if(Array.isArray(this.mines) && this.mines[i][0] == y && this.mines[i][1] == x) {
            return true;
        }
    }
    return false;
}

Game.prototype.isCellFlaged = function(x, y) {
    for(var i = 0; i < this.flagedCells.length; i++) {
        if(this.flagedCells[i][0] == x && this.flagedCells[i][1] == y) {
            return true;
        }
    }
    return false;
}

Game.prototype.isCellOpened = function(x, y) {
    if(this.openedCells[y][x] != false) {
        return true;
    }
    return false;
}

Game.prototype.getNeighborsMines = function(neighbors) {
    var neighborsMines = 0;
    for(var i = 0; i < neighbors.length; i++) {
        if(this.isMine(neighbors[i][1], neighbors[i][0])) {
            neighborsMines++;
        }
    }
    return neighborsMines;
}

Game.prototype.checkFlagsWinCondition = function() {
    if(this.flagedCells.length != this.mines.length) {
        return false;
    } else {
        for(var i = 0; i < this.flagedCells.length; i++) {
            if(!this.isMine(this.flagedCells[i][0], this.flagedCells[i][1])) {
                return false;
            }
        }
        return true;
    }
}

Game.prototype.checkCellsWinCondition = function() {
    for(var y = 0; y < this.openedCells.length; y++) {
        for(var x = 0; x < this.openedCells[y].length; x++) {
            if(!this.isMine(x, y) && this.openedCells[y][x] == false) {
                return false;
            }
        }
    }
    return true;
}

Game.prototype.winGame = function() {
    this.gameState = this.GAME_WON;
    var gameStateEvent = new GameStateChangeEvent("gameWon");
    this.dispatchEvent(gameStateEvent);
}

Game.prototype.loseGame = function() {
    this.gameState = this.GAME_LOST;
    var gameStateEvent = new GameStateChangeEvent("gameLost");
    this.dispatchEvent(gameStateEvent);
}

Game.prototype.openCell = function(x, y) {
    if(!this.isCellOpened(x, y) && !this.isCellFlaged(x, y) && this.gameState == this.GAME_GOING) {
        this.openedCells[y][x] = true;
        var mineClicked = this.isMine(x, y);
        var neighbors = this.getNeighbors(x, y);
        var neighborsMines = this.getNeighborsMines(neighbors);
        if(mineClicked) {
            this.loseGame();
        }
        var cellEvent = new CellChangedEvent("cellOpened", x, y, neighborsMines);
        this.dispatchEvent(cellEvent);
        if(neighborsMines == 0 && !mineClicked) {
            for(var i = 0; i < neighbors.length; i++) {
                this.openCell(neighbors[i][1], neighbors[i][0]);
            }
        }
        if(this.checkCellsWinCondition() && this.gameState == this.GAME_GOING) {
            this.winGame();
        }
    }
}

Game.prototype.flagCell = function(x, y) {
    var cellFlaged = this.isCellFlaged(x, y);
    if(this.gameState == this.GAME_GOING && !cellFlaged && !this.isCellOpened(x, y) && this.flagedCells.length < this.totalMines) {
        this.flagedCells.push([x, y]);
        var cellEvent = new CellChangedEvent("cellFlaged", x, y, null);
        this.dispatchEvent(cellEvent);
        if(this.checkFlagsWinCondition() && this.gameState == this.GAME_GOING) {
            this.winGame();
        }
    } else if(cellFlaged) {
        for(var i = 0; i < this.flagedCells.length; i++) {
            if(this.flagedCells[i][0] == x && this.flagedCells[i][1] == y) {
                this.flagedCells.splice(i, 1);
            }
        }
        var cellEvent = new CellChangedEvent("cellUnflaged", x, y, null);
        this.dispatchEvent(cellEvent);
    }
}

Game.prototype.getNeighbors = function(x, y) {
    var neighbors = new Array();
    for(var ny = -1; ny < 2; ny++) {
        if(y + ny < this.gameSizeY && y + ny >= 0) {
            for(var nx = -1; nx < 2; nx++) {
                if(x + nx < this.gameSizeX && x + nx >= 0) {
                    if(y + ny != y || x + nx != x) neighbors.push([y + ny, x + nx]);
                }
            }
        }
    }
    return neighbors;
}

DOMview.prototype.findCell = function(x, y) {
    return this.gameField.rows[y].cells[x];
}

DOMview.prototype.cellOpenedEventHandler = function(e) {
    var cell = this.findCell(e.x, e.y);
    if(e.target.gameState == e.target.GAME_LOST) {
        cell.classList.add("explosion");
    } else {
        cell.classList.add("opened");
    }
    if(e.mines > 0 && e.target.gameState == e.target.GAME_GOING) {
        cell.innerHTML = e.mines;
    }
}

DOMview.prototype.cellFlagedEventHandler = function(e) {
    var cell = this.findCell(e.x, e.y);
    if(e.type == "cellFlaged") {
        cell.classList.add("flag");
    } else {
        cell.classList.remove("flag");
    }
}

DOMview.prototype.gameRestartEventHandler = function(e) {
    if(this.popupWindow) {
        this.popupWindow.closeWindow();
    }
    var table = this.gameField.parentNode;
    table.className = "minesweeper";
    this.createField();
}

DOMview.prototype.gameWonEventHandler = function(e) {
    this.popupWindow = new Popup("game-won-popup", "You won!", "Congratulations, you won. Try again?");
    var newGameButton = this.popupWindow.addControlButton("popup-new-game", "New Game");
    if(newGameButton) {
        newGameButton.addEventListener("click", this.model.resetGame.bind(this.model));
    }
    this.popupWindow.showWindow();
    this.gameField.parentNode.className = "minesweeper-won";
}

DOMview.prototype.gameLostEventHandler = function(e) {
    for(var i = 0; i < this.model.mines.length; i++) {
        var mine = this.model.mines[i];
        var cell = this.findCell(mine[1], mine[0]);
        if(!this.model.isCellFlaged(mine[1], mine[0])) {
            cell.classList.add("bomb");
        }
    }
    for(var i = 0; i < this.model.flagedCells.length; i++) {
        var flaged = this.model.flagedCells[i];
        var flagedCell = this.findCell(flaged[0], flaged[1]);
        if(!this.model.isMine(flaged[0], flaged[1])) {
            flagedCell.classList.add("opened", "wrong");
        }
    }
    this.popupWindow = new Popup("game-lost-popup", "You lost!", "Unfortunately, you lost. Try again?");
    var newGameButton = this.popupWindow.addControlButton("popup-new-game", "New Game");
    if(newGameButton) {
        newGameButton.addEventListener("click", this.model.resetGame.bind(this.model));
    }
    this.popupWindow.showWindow();
    this.gameField.parentNode.className = "minesweeper-lost";
}

DOMview.prototype.createField = function() {
    if(this.gameField != null) {
        this.gameTable.removeChild(this.gameField);
    }
    this.gameField = document.createElement("tbody");
    for(var y = 0; y < this.model.gameSizeY; y++) {
        var tableRow = document.createElement("tr");
        for(var x = 0; x < this.model.gameSizeX; x++) {
            var tableColumn = document.createElement("td");
            tableRow.appendChild(tableColumn);
        }
        this.gameField.appendChild(tableRow);
    }
    this.gameTable.appendChild(this.gameField);
}

MouseController.prototype.addEventListeners = function() {
    this.view.gameField.addEventListener("mousedown", this.cellClickEventHandler.bind(this));
    this.view.gameField.addEventListener("contextmenu", function(e) { e.preventDefault(); });
}

MouseController.prototype.cellClickEventHandler = function(e) {
    var x = e.target.cellIndex;
    var y = e.target.parentNode.rowIndex;
    if(e.button == 0) {
        this.model.openCell(x, y);
    } else if(e.button == 2) {
        this.model.flagCell(x, y);
    }
}

MouseController.prototype.gameRestartEventHandler = function(e) {
    this.addEventListeners();
}