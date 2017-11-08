var chalk = require('chalk');

var heading = function(msg) {
		let size = msg.length;
		console.log(chalk.yellow(`${msg}`));
		console.log(chalk.green("─".repeat(size)));
}

var log = function(...args) {
	args.forEach((arg) => console.log(arg));
}

let debug = function(...args) {
  if (true) args.forEach((arg) => console.log(arg));
}

module.exports = {
	heading: heading,
	log: log
}
