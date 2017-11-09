var chalk = require('chalk');
var clear = require('clear');
var figlet = require('figlet');

let splash = function(show=true) {
    clear();
    if (show)
      console.log(
        chalk.green(figlet.textSync('Gyst', {
          font: "doom",
          horizontalLayout: 'default'
        })),
        "\n",
        chalk.blue("version " + require('../package.json').version)
      );
  }

let error = function(token, msg) {
    console.log(chalk.red(`Error at ${token.value.src}:${token.value.row}:${token.value.col}, ${msg}\n`));
  }

let argv = function(skip=2) {
  let out = process.argv;
  for(let i=0; i<skip; i++) out.shift();
  return out;
}

module.exports = {
  splash: splash,
  error: error,
  argv: argv,
};