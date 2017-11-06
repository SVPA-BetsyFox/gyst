#!/usr/bin/env node

let chalk = require('chalk');
let clear = require('clear');
// let cli         = require('cli');
let figlet = require('figlet');
let fs = require('fs');
let files = require('./lib/files.js');
let registry = require('./lib/registry.js')();

let {	lexer } = require('bluesocks');
let rules = require('./lib/rules');
let { heading, log } = require('./lib/common.js');

let world = {};

// let { functions, pre, post }

args = process.argv;
args.shift();
args.shift();



let execution_list = [];

let splash = function() {
	clear();
	console.log(
		chalk.green(figlet.textSync('Gyst', {
			font: "doom",
			horizontalLayout: 'default'
		})),
		"\n",
		chalk.blue(" version " + require('./package.json').version)
	);
}


let error = function(token, msg) {
	console.log(chalk.red(`Error at ${token.value.src}:${token.value.row}:${token.value.col}, ${msg}\n`));
}


let execute = function(call) {
	if (call instanceof Array) {
		console.log("call is totes an array")
		for (x of call) {
			execute(x.data);
		}
	} else if (call instanceof Function) {
		call.apply(world);
		console.log("call is totes a function");
	} else if (typeof call == "string") {
		console.log(`call is totes a string: ${call}`)
	} else {
		console.log("Well, call was neither an array, a function, or a string...: " + call);
	}
	// console.log(call);
	// switch (typeof call) {
	// 	case "object":
	// 		call.forEach(function(x) {
	// 			console.log(`EXECUTING ${x.data} FROM ${x.src}:${x.row}:${x.col}`);
	// 			if (x.type == 'CALLPROC') execute(x.data);
	// 			else execute(registry.get_function(x.data));
	// 		});
	// 		break;
	// 	case "string":
	// 		execute(registry.get_function(call));
	// 		break;
	// 	case "function":
	// 		console.log(call);
	// 	default:
	// 		// console.log(`We hit something that wasn't a string or an object/array- typeof is "${typeof call}" and the value is "${call}"`);
	// 		break;
	// }
	// if (typeof call == "object") {
	// 	call.forEach(function(x) {
	// 		 console.log("EXECUTING", x.data);
	// 		if (x.type == 'CALLPROC')
	// 			execute(x.data);
	// 		// console.log(functions.get(x.data));
	// 	});
	// } else {
	// 	// console.log(functions.get(x.data));
	// }
}


let parse_feature = function(token, lexer) {
	while (!token.done && token.value.type != "ENDBLOCK") {
		token = lexer.next();
	}
}


let parse_procedure = function(token, lexer) {
	let stack = [];
	while (!token.done && token.value.type != "ENDBLOCK") {
		switch (token.value.type) {
			case "CALLPROC":
				stack.push(token.value);
				break;
			case "NATIVE":
				stack.push(parse_native(token, lexer));
				break;
			case "UNKNOWN":
				error(token, `Unexpected token: "${token.value.data}"`);
				return false;
		}
		token = lexer.next();
	}
	return stack;
}


let wrap_function = function(s) {
	return `(function(){${s}})`;
}


let parse_native = function(token, lexer) {
	let out = [];
	while (!token.done && token.value.type != "ENDBLOCK") {
		out.push(token.value.data)
		token = lexer.next();
	}
	return wrap_function(out.join("\n"));
}


let parse_scenario_outline = function(token, lexer) {
	// let token = lexer.next();
	//read in as a procedure, but don't register just yet...
	//read in examples table
	//once read in, adjust the calling line so it has parameters matching the ones given in examples table
	//NOW register procedure
	//NOW add an execute call to the procedure, once for each line of the examples table
}


let parse = function(lexer) {
	let token = lexer.next();
	while (!token.done) {
		// console.log(token.value.data);
		switch (token.value.type) {
			case "UNKNOWN":
				error(token, `Undefined command: "${token.value.data}"`)
				return false;
			case "FEATURE":
				parse_feature(token, lexer);
				break;
			case "SCENARIO":
				execution_list.push(token.value);
			case "PROCEDURE":
				registry.register(token.value.data, parse_procedure(token, lexer));
				break;
			case "SCENARIOOUTLINE":
				parse_scenario_outline(token, lexer);
				break;
			case "WHITESPACE":
			case "NEWLINE":
				break;
			default:
			// console.log(token.value);
				break;
		}
		token = lexer.next("default");
	}
}


args.forEach(function(val, index) {
	specFiles = files.ls(`${process.cwd()}/${val}`);
	specFile = specFiles.next();
	let i = 0;
	while (!specFile.done) {
		console.log(++i);
		if (specFile.value.toLowerCase().endsWith("world.js")) {
			console.log("found a world file");
			world = require(specFile.value);
			// console.log(world);
		} else if (specFile.value.toLowerCase().endsWith(".specs")) {
			heading(`Processing ${specFile.value}...`);
			let data = files.read(specFile.value);
			lex = lexer(data, specFile.value, rules);
			parse(lex);
		}
		specFile = specFiles.next();
	}

	// registry.dump();

	execute(execution_list);
});