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
	debug(`Attempting exection of ${call}`);
	if (call instanceof Array) {
		console.log("call is totes an array")
		for (x of call) {
			execute(x.data);
		}
	} else if (call instanceof Function) {
		call.apply(world);
		console.log("call is totes a function");
	} else if (typeof call == "string") {
		//we're probably dealing with a procedure call
		//todo: expand proc call
		console.log(`call is totes a string (probably a procedure call!): ${call}`)
		let func = registry.get_function(call);
		console.log(func);
	} else {
		throw(`Attempt to execute "${call}" failed because it is not a string or a function.`);
	}
}


let parse_feature = function(token, lexer) {
	while (!token.done && token.value.type != "ENDBLOCK") {
		token = lexer.next();
	}
}


let parse_procedure = function(token, lexer) {
	let calls = [];
	while (!token.done && token.value.type != "ENDBLOCK") {
		switch (token.value.type) {
			case "CALLPROC":
				let compiled = compile(token.value.data);
				if (compiled) calls.push(compiled);
				else calls.push(token.value.data);
				break;
			case "NATIVE":
				let func = parse_native(token, lexer);
				console.log(`NATIVE FUNCTION: ${func.toString()}`);
				calls.push(func);
				break;
			case "UNKNOWN":
				error(token, `Unexpected token: "${token.value.data}"`);
				// return false;
			default:
				calls.push(token.value.data);
		}
		token = lexer.next();
	}
	return calls.reduce((acc, cur) => acc.concat(cur), []);
}


let parse_native = function(token, lexer) {
	let out = [];
	while (!token.done && token.value.type != "ENDBLOCK") {
		out.push(token.value.data)
		token = lexer.next();
	}
	out.shift();
	return eval(`(function() {\n${out.join("\n")}\n})`);
}


let parse_scenario_outline = function(token, lexer) {
	// let token = lexer.next();
	//read in as a procedure, but don't register just yet...
	//read in examples table
	//once read in, adjust the calling line so it has parameters matching the ones given in examples table
	//NOW register procedure
	//NOW add an execute call to the procedure, once for each line of the examples table
}


let compile = function(proc_name) {
	// console.log(`Attempting to compile`, proc_name);
	let out = [];
	let func = registry.get_function(proc_name);
	switch(typeof func) {
		case "string":
			out.push(compile(func));
			break;
		case "function":
			out.push(func);
			break;
		case "object":
			if (func instanceof Array) {
				func.forEach(x => out.push(compile(x)));
			} else {
				// console.log("uhhhh", func);
			}
		default:
			console.log(`COMPILE() SAYS "${proc_name}" is a ${typeof func}`);
			break;
	}
	return out;
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
	console.log(execution_list.length);
		execution_list = execution_list.map(x => {
			// console.log(`* PROCESSING ${x.data}`);
			// console.log(compile(x.data));
			return (x || compile(x.data));
		});
	// let undefined_calls = registry.get_undefined();
	// if (undefined_calls.length > 0) {
	// 	console.log(`Found ${undefined_calls.length} undefined procedures, checking final definitions...`);
	// 	// console.log(`\n${undefined_calls.join("\n")}\n`);
	// 	// 

	// 	undefined_calls = registry.get_undefined();
	// 	if (undefined_calls.length > 0) {
	// 		console.log(`Found ${undefined_calls.length} undefined procedures during final pass:`);
	// 		console.log(`\n${undefined_calls.join("\n")}\n`);
	// 	}
	// } else {
	// 	execute(execution_list);
	// }
});