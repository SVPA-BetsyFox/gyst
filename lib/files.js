var fs = require('fs');
var path = require('path');
  
let getCurrentDirectoryBase = function() {
  return path.basename(process.cwd());
}

let directoryExists = function(filePath) {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch (err) {
    return false;
  }
}

let ls = function*(path, ext) { //returns a directory listing iterator for the given path
  let files = fs.readdirSync(path);
  for (let i = 0; i < files.length; i++) {
    if (fs.lstatSync(`${path}/${files[i]}`).isDirectory()) {
      yield * ls(`${path}/${files[i]}`, ext);
    } else { //if (!fs.lstatSync(`${path}/${files[i]}`).isDirectory())
      if (ext === undefined || files[i].toLowerCase().endsWith(`.${ext.toLowerCase()}`))
        yield `${path}/${files[i]}`;
    }
  }
}

let lines = function*(filePath) {
  trim = (x) => {
    return x.trim()
  };
  try {
    let lines = fs.readFileSync(filePath, 'utf-8').split("\n").map(trim);
    for (var i = 0; i < lines.length; i++) {
      yield lines[i];
    }
  } catch (err) {
    console.log(err);
  }
}

let read = function(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  getCurrentDirectoryBase: getCurrentDirectoryBase,
  directoryExists: directoryExists,
  ls: ls,
  lines: lines,
  read: read
};