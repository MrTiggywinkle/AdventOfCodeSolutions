var fs = require("fs");
require("draftlog").into(console);

var endFlag = false;
var gameMap = [];
var attemptCount = 0;
var solved = false;
var cols = 48;
var line = "";
var startPt = { x: 23, y: 23 };
var endPt;
var robot = { x: startPt.x, y: startPt.y, dir: 1, pdir: 0, px: 0, py: 0 };
//init the grid matrix
for (var i = 0; i < cols; i++) {
  gameMap[i] = [];
}
gameMap[startPt.x][startPt.y] = "X";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//Dont touch
function splitData(data) {
  return data.toString().split(",");
}

//Convert to int as promise
function convertToInt(array) {
  return new Promise(function(resolve, reject) {
    for (i in array) {
      array[i] = parseInt(array[i], 10);
    }
    resolve(array);
  });
}

//Dont touch
function splitArray(input) {
  return new Promise(function(resolve, reject) {
    input.on("data", function(data) {
      resolve(splitData(data));
    });
  });
}

function calcIndexes(oa, ind, p, rb) {
  return new Promise(function(resolve, reject) {
    switch (p) {
      case undefined:
        resolve(oa[ind]);
        break;
      case "0":
        resolve(oa[ind]);
        break;
      case "1":
        resolve(ind);
        break;
      case "2":
        resolve(rb + oa[ind]);
        break;
    }
  });
}

function getIndexes(oa, ind, rb) {
  return new Promise(async function(resolve, reject) {
    var opcode = oa[ind].toString();
    var opl = opcode.length;
    var inst = "";
    for (var i = opl - 1; i >= 0 && i >= opl - 2; i--) {
      inst = opcode[i] + inst;
    }
    inst = parseInt(inst);
    var p1c = opcode[opl - 3];
    var p2c = opcode[opl - 4];
    var p3c = opcode[opl - 5];

    var i1 = await calcIndexes(oa, ind + 1, p1c, rb);
    var i2 = await calcIndexes(oa, ind + 2, p2c, rb);
    var i3 = await calcIndexes(oa, ind + 3, p3c, rb);

    resolve({ inst: inst, i1: i1, i2: i2, i3: i3 });
  });
}

function isClear(tile) {
  if (
    tile === " " ||
    tile === "O" ||
    tile === "X" ||
    tile === "." ||
    tile === undefined
  ) {
    return true;
  } else {
    return false;
  }
}

function turnBotLeft() {
  if (robot.dir === 1) {
    robot.dir = 3;
  } else if (robot.dir === 2) {
    robot.dir = 4;
  } else if (robot.dir === 4) {
    robot.dir = 1;
  } else {
    robot.dir = 2;
  }
}

function resolveMoveStatus(status) {
  var px = robot.px;
  var py = robot.py;
  if (status === 0) {
    gameMap[px][py] = "#";
    if (attemptCount > 1) {
      turnBotLeft();
      attemptCount = 0;
    }
  } else if (status === 1) {
    attemptCount = 0;
    robot.x = px;
    robot.y = py;
    if (gameMap[robot.x][robot.y] !== "X") {
      gameMap[robot.x][robot.y] = " ";
    } else {
      endFlag = true;
    }
    robot.dir = robot.pdir;
  } else if (status === 2) {
    attemptCount = 0;
    robot.x = px;
    robot.y = py;
    endPt = { x: robot.x, y: robot.y };
    gameMap[px][py] = "O";
    robot.dir = robot.pdir;
  }
}

function setRobotPropDir(propDir) {
  if (propDir === 1) {
    robot.px = robot.x;
    robot.py = robot.y - 1;
  } else if (propDir === 2) {
    robot.px = robot.x;
    robot.py = robot.y + 1;
  } else if (propDir === 3) {
    robot.px = robot.x - 1;
    robot.py = robot.y;
  } else if (propDir === 4) {
    robot.px = robot.x + 1;
    robot.py = robot.y;
  }
}

function proposeMove(status) {
  var x = robot.x;
  var y = robot.y;
  var dir = robot.dir;
  var propDir = 0;
  attemptCount++;
  if (dir === 1) {
    if (isClear(gameMap[x + 1][y])) {
      propDir = 4;
      robot.pdir = 4;
    } else {
      robot.pdir = 1;
      propDir = 1;
    }
  } else if (dir === 2) {
    if (isClear(gameMap[x - 1][y])) {
      propDir = 3;
      robot.pdir = 3;
    } else {
      robot.pdir = 2;
      propDir = 2;
    }
  } else if (dir === 3) {
    if (isClear(gameMap[x][y - 1])) {
      propDir = 1;
      robot.pdir = 1;
    } else {
      robot.pdir = 3;
      propDir = 3;
    }
  } else {
    if (isClear(gameMap[x][y + 1])) {
      propDir = 2;
      robot.pdir = 2;
    } else {
      robot.pdir = 4;
      propDir = 4;
    }
  }
  if (endFlag) {
    return 0;
  }
  //console.log(propDir);
  setRobotPropDir(propDir);
  return propDir;
}

function getValue(oa, i) {
  if (oa[i] === undefined) {
    return 0;
  } else {
    return oa[i];
  }
}

function paintMaze(robot) {
  var newLines = "\n";
  //console.log(gameMap.length);
  for (var y = 0; y < gameMap.length; y++) {
    for (var x = 0; x < gameMap.length; x++) {
      if (x === robot.x && y === robot.y) {
        newLines = newLines + "R";
      } else if (gameMap[x][y] === undefined) {
        newLines = newLines + " ";
      } else {
        newLines = newLines + gameMap[x][y];
      }
    }
    newLines = newLines + "\n";
  }
  line = newLines;
  console.log(line);
}

function prepareGameMap() {
  for (var y = 0; y < gameMap.length; y++) {
    for (var x = 0; x < gameMap.length; x++) {
      if (gameMap[x][y] === "#") {
        gameMap[x][y] = 1;
      } else {
        gameMap[x][y] = 0;
      }
    }
  }
  paintMaze({ x: 25, y: 25 });
}

function findWay(position, end) {
  var queue = [];
  var validpaths = [];

  // New points, where we did not check the surroundings:
  // remember the position and how we got there
  // initially our starting point and a path containing only this point
  queue.push({ pos: position, path: [position] });

  // as long as we have unchecked points
  while (queue.length > 0) {
    // get next position to check viable directions
    var obj = queue.shift();
    var pos = obj.pos;
    var path = obj.path;

    // all points in each direction
    var direction = [
      [pos[0] + 1, pos[1]],
      [pos[0], pos[1] + 1],
      [pos[0] - 1, pos[1]],
      [pos[0], pos[1] - 1]
    ];

    for (var i = 0; i < direction.length; i++) {
      // check if out of bounds or in a "wall"
      if (direction[i][0] < 0 || direction[i][0] >= gameMap[0].length) continue;
      if (direction[i][1] < 0 || direction[i][1] >= gameMap[0].length) continue;
      if (gameMap[direction[i][0]][direction[i][1]] != 0) continue;

      // check if we were at this point with this path already:
      var visited = false;
      for (var j = 0; j < path.length; j++) {
        if (path[j][0] == direction[i][0] && path[j][1] == direction[i][1]) {
          visited = true;
          break;
        }
      }
      if (visited) continue;

      // copy path
      var newpath = path.slice(0);
      // add new point
      newpath.push(direction[i]);

      // check if we are at end
      if (direction[i][0] != end[0] || direction[i][1] != end[1]) {
        // remember position and the path to it
        queue.push({ pos: direction[i], path: newpath });
      } else {
        // remember this path from start to end
        validpaths.push(newpath);
        // break here if you want only one shortest path
      }
    }
  }
  return validpaths;
}

function getBFSPath(startPt, endPt, gameMap) {
  prepareGameMap(gameMap);

  console.log(startPt, endPt);
  var start = [startPt.x, startPt.y];
  var end = [endPt.x, endPt.y];

  var path = findWay(start, end);
  console.log("Maze Length is: ", path[0].length - 1);
}

function computeIt(oa, ind, rb, outarr) {
  return new Promise(async function(resolve, reject) {
    var { inst, i1, i2, i3 } = await getIndexes(oa, ind, rb);
    if (!solved) {
      switch (inst) {
        case 99:
          //drawImage();
          console.log("99 code");
          resolve({ oa: oa, ind: oa.length, rb: rb });
          //paintMaze(robot);
          //robot.x = startPt.x;
          //robot.y = startPt.y;
          getBFSPath(startPt, endPt, gameMap);
          break;
        case 1:
          oa[i3] = getValue(oa, i1) + getValue(oa, i2);
          resolve({ oa: oa, ind: ind + 4, rb: rb });
          break;
        case 2:
          oa[i3] = getValue(oa, i1) * getValue(oa, i2);
          resolve({ oa: oa, ind: ind + 4, rb: rb });
          break;
        case 3:
          //await sleep(10);
          oa[i1] = proposeMove();
          //console.log("Case 3 provided ", oa[i1], " as the proposed move");
          //console.log(robot);
          //console.log("attempt count is currently: ", attemptCount);
          resolve({ oa: oa, ind: ind + 2, rb: rb });
          break;
        case 4:
          //console.log("Case 4");
          resolveMoveStatus(getValue(oa, i1));
          //paintMaze(robot);
          resolve({ oa: oa, ind: ind + 2, rb: rb });
          break;
        case 5:
          if (getValue(oa, i1) !== 0) {
            resolve({ oa: oa, ind: getValue(oa, i2), rb: rb });
          } else {
            resolve({ oa: oa, ind: ind + 3, rb: rb });
          }
          break;
        case 6:
          if (getValue(oa, i1) === 0) {
            resolve({ oa: oa, ind: getValue(oa, i2), rb: rb });
          } else {
            resolve({ oa: oa, ind: ind + 3, rb: rb });
          }
          break;
        case 7:
          if (getValue(oa, i1) < getValue(oa, i2)) {
            oa[i3] = 1;
            resolve({ oa: oa, ind: ind + 4, rb: rb });
          } else {
            oa[i3] = 0;
            resolve({ oa: oa, ind: ind + 4, rb: rb });
          }
          break;
        case 8:
          if (getValue(oa, i1) === getValue(oa, i2)) {
            oa[i3] = 1;
            resolve({ oa: oa, ind: ind + 4, rb: rb });
          } else {
            oa[i3] = 0;
            resolve({ oa: oa, ind: ind + 4, rb: rb });
          }
          break;
        case 9:
          resolve({ oa: oa, ind: ind + 2, rb: rb + getValue(oa, i1) });
          break;
        default:
          console.log(
            "Shouldn't have reached here, index is: ",
            ind,
            " and current opcode is: ",
            inst
          );
          resolve({ oa: oa, ind: ind + 4 });
          break;
      }
    } else {
      console.log("solved");
    }
  });
}

async function parseArray(oa) {
  var ind = 0;
  var rb = 0;
  while (ind != oa.length) {
    var { oa, ind, rb } = await computeIt(oa, ind, rb);
  }
}

async function main() {
  var input = fs.createReadStream("input.txt");
  var oa = await splitArray(input);
  oa = await convertToInt(oa);
  paintMaze(robot);
  parseArray(oa);
}

main();
