'use strict'

const MINE = '💣';
const FLAG = '🚩';
const SMILE = '😃';
const WINSMILE = '😎';
const LOSESMILE = '😔';
const LIVES = '💛  '

var undoGBoards = []
var gBoard;
var gLevel = {
    size: 4,
    mines: 2
}
var gGame = {
    isOn: false,
    isFirstClick: true,
    firstSafeClick: true,
    isHint: false,
    isSafe: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    lives: 3,
    hints: 3,
    safeClicks: 3
}

var gTimeOn = false
var gGameInterval;


function init() {
    gBoard = buildBoard(gLevel.size, gLevel.mines);
    renderBoard(gBoard, '.board');
    resetGameData()

}

function buildBoard(size, mines) {
    var board = [];
    for (var i = 0; i < size; i++) {
        board.push([]);
        for (var j = 0; j < size; j++) {
            board[i][j] = {
                i: i,
                j: j,
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false,
                isEmpty: false

            }
        }
    }
    var mines = setRandomMines(board, mines);
    for (var i = 0; i < mines.length; i++) {
        board[mines[i].i][mines[i].j].isMine = true

    }
    for (var i = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
            if ((board[i][j].isMine !== true)) {
                board[i][j].cellCont = setMinesNegsCount(i, j, board);
                board[i][j].minesAroundCount = setMinesNegsCount(i, j, board);
            }
        }
    }
    return board;
}

function setRandomMines(board, minesCount) {
    var mines = []
    for (var i = 0; i < minesCount; i++) {
        mines.push(board[getRandomInt(0, board.length - 1)][getRandomInt(0, board.length - 1)])
        if (mines.length > 1) {
            for (var j = 0; j < mines.length; j++) {
                if (mines[j].i === mines[mines.length - 1].i && mines[j].j === mines[mines.length - 1].j && j !== mines.length - 1) {
                    i--
                }
            }
        }
    }
    return mines;
}

function renderBoard(board, selector) {
    var strHTML = '<table id="my-table" border="0"><tbody>';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board[0].length; j++) {
            var isHidden = (board[i][j].isShown) ? '' : 'cell-context';
            if (board[i][j].isMine === true) board[i][j].minesAroundCount = MINE
            if (board[i][j].minesAroundCount === 0) board[i][j].minesAroundCount = ''
            var minesAround = board[i][j].minesAroundCount;
            strHTML += `<td id="cell-${i}-${j}"  onmousedown="cellClicked(this,event)" oncontextmenu="return false"><span class="${isHidden}">${minesAround}</span></td>`;
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>';
    var elContainer = document.querySelector(selector);
    elContainer.innerHTML = strHTML;
}

function cellClicked(elCell, ev) {
    if (!gGame.isOn) return;
    if (gGame.isSafe) return;
    if (ev.button === 1) return;
    if (ev.button === 2 && gGame.isOn) {
        cellMark(elCell)
        return
    }
    if (gGame.isFirstClick) {
        gGame.isFirstClick = false;
        gGame.isOn = true;
    }
    var currLocation = getIdxObj(elCell.id);
    var currCell = gBoard[currLocation.i][currLocation.j];
    if (!gGame.isHint) {
        if (gTimeOn === false) timer()
        if (currCell.isMarked) return;
        if (currCell.isShown) return;
        if (currCell.isShown && currCell.isMine) return;
        var elCellContext = (document.querySelector('#' + elCell.id + ' span'));
        elCellContext.classList.remove('cell-context')
        if (currCell.isMine === true) {
            elCell.style.backgroundColor = 'red';
        } else {
            elCell.style.backgroundColor = 'grey';
        }
        if (currCell.isEmpty) expandShown(currLocation.i, currLocation.j)
        currCell.isShown = true;
        if (currCell.isMine) {
            gGame.lives--
                if (gGame.lives === 0) {
                    for (var i = 0; i < gBoard.length; i++) {
                        for (var j = 0; j < gBoard[0].length; j++) {
                            if (gBoard[i][j].isMine) {
                                gBoard[i][j].isShown = true;
                                document.querySelector(`#cell-${i}-${j} span`).classList.remove('cell-context');
                            }
                        }
                    }
                }
            checkGameOver()
        }
    } else {
        if (gGame.hints === 0) return
        expandHints(currCell.i, currCell.j, elCell, currCell)
    }
    checkIfWin()
}

function expandHints(cellI, cellJ, elCell) {
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j > gBoard[i].length - 1) continue;
            if (gBoard[i][j].isMarked) continue;
            if (gBoard[i][j].isShown) continue;
            var elCellContext = (document.querySelector('#' + 'cell-' + i + '-' + j + ' span'));
            elCellContext.classList.remove('cell-context')
            var elCell = (document.querySelector('#' + 'cell-' + i + '-' + j));
            elCell.style.backgroundColor = 'rgb(253, 211, 148)';
        }
    }
    setTimeout(function() {
        for (var i = cellI - 1; i <= cellI + 1; i++) {
            if (i < 0 || i >= gBoard.length) continue;
            for (var j = cellJ - 1; j <= cellJ + 1; j++) {
                if (j < 0 || j > gBoard[i].length - 1) continue;
                if (gBoard[i][j].isMarked) continue;
                if (gBoard[i][j].isShown) continue;
                var elCellContext = (document.querySelector('#' + 'cell-' + i + '-' + j + ' span'));
                elCellContext.classList.add('cell-context')
                var elCell = (document.querySelector('#' + 'cell-' + i + '-' + j));
                elCell.style.backgroundColor = 'white';
                gGame.isHint = false
            }
        }
    }, 1500)
    console.table(gBoard);

    gGame.hints--
        document.querySelector('.hint').style.backgroundColor = ''
    document.querySelector('.hint').innerText = 'Hint : ' + gGame.hints

}

function cellMark(elCell) {
    if (!gGame.isOn) return
    var currLocation = getIdxObj(elCell.id);
    var elCellContext = (document.querySelector('#' + elCell.id + ' span'));
    var currCell = gBoard[currLocation.i][currLocation.j];
    if (currCell.isShown) return;

    if (!currCell.isMarked) {
        elCellContext.innerText = FLAG;
        currCell.isMarked = true;
        elCellContext.classList.remove('cell-context')
        gGame.markedCount++
    } else if (currCell.isMarked) {
        currCell.isMarked = false;
        if (currCell.isMine) elCellContext.innerText = MINE;
        if (currCell.isEmpty) {
            elCellContext.innerText = currCell.minesAroundCount;
        } else elCellContext.innerText = currCell.minesAroundCount;
        elCellContext.classList.add('cell-context')
        gGame.markedCount--
    }
    if (gGame.markedCount === gLevel.mines - (3 - gGame.lives)) checkIfWin()
}

function setMinesNegsCount(cellI, cellJ, board) {
    var neighborsSum = 0;
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue;
            if (j < 0 || j >= board[i].length) continue;
            if ((board[i][j].isMine === true)) neighborsSum++

        }
    }
    if (neighborsSum === 0) {
        neighborsSum = ''
        board[cellI][cellJ].isEmpty = true
    }
    return neighborsSum;
}

function expandShown(cellI, cellJ, lastCell) {
    var cell = gBoard[cellI][cellJ]
    if (cell.isMine || cell.isShown || cell.isMarked) return;
    cell.isShown = true;
    document.querySelector(`#cell-${cellI}-${cellJ} span`).classList.remove('cell-context');
    document.querySelector(`#cell-${cellI}-${cellJ}`).style.backgroundColor = 'grey';
    if (cell.minesAroundCount > 0) return;
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue;
            if (j < 0 || j >= gBoard[i].length) continue;
            expandShown(i, j, { i: i, j: j })
        }
    }
}

function safeClick(elBtn) {
    if (!gGame.isOn) return
    if (gGame.isFirstClick) return;
    gGame.isSafe = !gGame.isSafe
    if (gGame.isFirstClick) return;
    if (gGame.safeClicks === 0) return;
    var hideCells = [];
    for (var i = 0; i < gLevel.size; i++) {
        for (var j = 0; j < gLevel.size; j++) {
            if (gBoard[i][j].isShown) continue;
            if (gBoard[i][j].isMine) continue;
            hideCells.push(gBoard[i][j])

        }
    }
    elBtn.style.backgroundColor = 'yellow';
    var cell = hideCells[getRandomInt(0, hideCells.length - 1)]
    var elCell = (document.querySelector('#' + 'cell-' + cell.i + '-' + cell.j));
    elCell.style.backgroundColor = 'rgb(253, 211, 148)';
    setTimeout(function() {
        elCell.style.backgroundColor = 'white';
        elBtn.style.backgroundColor = '';
        gGame.isSafe = !gGame.isSafe
    }, 2000)
    gGame.safeClicks--
        elBtn.innerText = 'Safe-Click : ' + gGame.safeClicks;
}

function hint(elBtn) {
    if (!gGame.isOn) return;
    if (gGame.isFirstClick) return;
    gGame.isHint = !gGame.isHint;
    if (gGame.hints === 0) return;
    if (gGame.isHint) elBtn.style.backgroundColor = 'yellow';

}

function checkGameOver() {
    if (gGame.lives === 2) document.querySelector('.lives').innerText = LIVES + LIVES;
    if (gGame.lives === 1) document.querySelector('.lives').innerText = LIVES;
    if (gGame.lives === 0) {
        document.querySelector('.lives').innerText = '';
        gameOver();
    }

}

function gameOver() {
    document.querySelector('.smilei').innerText = LOSESMILE;
    clearInterval(gGameInterval)
    gGame.isOn = false;
}

function checkIfWin() {
    gGame.shownCount = 0
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].isShown) gGame.shownCount++
        }
    }
    if (gGame.shownCount === (gLevel.size ** 2)) {
        document.querySelector('.smilei').innerText = WINSMILE;
        clearInterval(gGameInterval);
        gGame.isOn = false;
    }
    if (gGame.shownCount === (gLevel.size ** 2) - gLevel.mines + (3 - gGame.lives) &&
        gGame.markedCount === gLevel.mines - (3 - gGame.lives)) {
        document.querySelector('.smilei').innerText = WINSMILE;
        clearInterval(gGameInterval);
        gGame.isOn = false;
    }

}

function smileiResetGame() {
    init()
}


function resetGameData() {
    clearInterval(gGameInterval)
    gGameInterval = null;
    gGame.secsPassed = 0;
    gTimeOn = false;
    gGame.isOn = false;
    gGame.shownCount = 0;
    gGame.markedCount = 0;
    gGame.isHint = false;
    gGame.isFirstClick = true;
    gGame.secsPassed = 0;
    gGame.isOn = true;
    gGame.lives = 3;
    gGame.hints = 3;
    gGame.safeClicks = 3;
    gGame.firstSafeClick = true;
    document.querySelector('.safe').innerText = 'Safe-Click : ' + gGame.safeClicks;
    document.querySelector('.hint').innerText = 'Hint : ' + gGame.hints;
    document.querySelector('.timer').innerText = 'Time:' + 0;
    document.querySelector('.smilei').innerText = SMILE;
    document.querySelector('.lives').innerText = LIVES + LIVES + LIVES;

}

function timer() {
    var elTimer = document.querySelector('.timer');
    gGameInterval = setInterval(function() {
        gGame.secsPassed += 1;
        elTimer.innerText = 'Time:' + gGame.secsPassed;
    }, 1000);
    gTimeOn = true;

}

function boardSize(diff) {
    switch (diff.innerText) {
        case 'Easy':
            gLevel = {
                size: 4,
                mines: 2
            }
            break;
        case 'Medium':
            gLevel = {
                size: 8,
                mines: 12
            }
            break;
        case 'Hard':
            gLevel = {
                size: 12,
                mines: 30
            }
    }
    init()
}

function getIdxObj(id) {
    var coord = id.split('-');
    coord.shift();
    var location = {
        i: coord[0],
        j: coord[1]
    }
    return location;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}