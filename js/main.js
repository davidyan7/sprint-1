'use strict'

const MINE = '💣';
const FLAG = '🚩';
const SMILE = '😃';
const WINSMILE = '😎';
const LOSESMILE = '😔';
const LIVES = '💛  '

// const noRightClick = document.getElementId('tbody');
// noRightClick.addEventListener("contextmenu", e => e.preventDefault());

var gBoard;
var gLevel = {
    size: 4,
    mines: 2
}
var gGame = {
    isOn: false,
    isFirstClick: true,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    lives: 3
}

var gTimeOn = false
var gGameInterval;

function init() {
    gBoard = buildBoard(gLevel.size, gLevel.mines);
    renderBoard(gBoard, '.board');
    gGame.isOn = true
    document.querySelector('.smilei').innerText = SMILE;
    gGame.lives = 3
    document.querySelector('.lives').innerText = LIVES + LIVES + LIVES;

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


function firstClickSafe() {
    var mines = setRandomMines(gBoard, minesCount);
    for (var i = 0; i < mines.length; i++) {
        gBoard[mines[i].i][mines[i].j].isMine = true


    }

    for (var i = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
            if (gBoard[i][j].isMine !== true) {
                gBoard[i][j].cellCont = setMinesNegsCount(i, j, gBoard);
                gBoard[i][j].minesAroundCount = setMinesNegsCount(i, j, gBoard);
            }
        }
    }

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
    elContainer.addEventListener("contextmenu", e => e.preventDefault());
}


function cellClicked(elCell, ev) {
    if (ev.button === 1) return
    if (ev.button === 2 && gGame.isOn) {
        cellMark(elCell)
        return
    }
    if (gGame.isFirstClick) {
        gGame.isFirstClick = false;
        gGame.isOn = true
    }
    // if (gGame.isOn === false) return
    var currLocation = getIdxObj(elCell.id);
    var currCell = gBoard[currLocation.i][currLocation.j];
    if (gTimeOn === false) timer()
    if (currCell.isMarked) return;
    if (currCell.isShown) return;
    var elCellContext = (document.querySelector('#' + elCell.id + ' span'));
    elCellContext.classList.remove('cell-context')
    if (currCell.isMine === true) {
        elCell.style.backgroundColor = 'red';
    } else { elCell.style.backgroundColor = 'grey'; }

    if (currCell.isEmpty) expandShown(currLocation.i, currLocation.j)
    currCell.isShown = true;

    checkIfWin()

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
            // console.log(board[i][j]);
            if ((board[i][j].isMine === true)) neighborsSum++

        }
    }
    if (neighborsSum === 0) {
        neighborsSum = ''
        board[cellI][cellJ].isEmpty = true
    }
    return neighborsSum;
}

function expandShown(i, j) {
    var cell = gBoard[i][j]
    if (cell.isShown) return;
    if (cell.isMine) return;
    if (cell.isMarked) return;
    cell.isShown = true;
    document.querySelector(`#cell-${i}-${j} span`).classList.remove('cell-context');
    document.querySelector(`#cell-${i}-${j}`).style.backgroundColor = 'grey';
    if (cell.isEmpty) openEmptyNegs(i, j)

}

function openEmptyNegs(cellI, cellJ) {
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue;
            if (j < 0 || j >= gBoard[i].length) continue;
            expandShown(i, j)
        }

    }
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
    resetGameData()
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
        resetGameData()
    }
    if (gGame.shownCount === (gLevel.size ** 2) - gLevel.mines + (3 - gGame.lives) &&
        gGame.markedCount === gLevel.mines - (3 - gGame.lives)) {
        document.querySelector('.smilei').innerText = WINSMILE;
        resetGameData()
    }
}


function resetGameData() {
    clearInterval(gGameInterval)
    console.log('Win');
    gGameInterval = null;
    gGame.secsPassed = 0;
    gTimeOn = false;
    gGame.isOn = false;
    gGame.isFirstClick = false;
    gGame.shownCount = 0;
    gGame.markedCount = 0;
    gGame.lives = 3


}

function timer() {
    var elTimer = document.querySelector('.timer');
    gGameInterval = setInterval(function() {
        gGame.secsPassed += 1;
        elTimer.innerText = 'Time:' + gGame.secsPassed;
    }, 1000);
    gTimeOn = true

}

function boardSize(diff) {
    console.log(diff.innerText);
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
    clearInterval(gGameInterval)
    gGameInterval = null;
    gTimeOn = false
    gGame.secsPassed = 0
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
    return Math.floor(Math.random() * (max - min + 1) - min);
}