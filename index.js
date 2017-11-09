#!/usr/bin/env node

let chalk = require('chalk');
let clear = require('clear');
let figlet = require('figlet');
let fs = require('fs');
let files = require('./lib/files');
let registry = require('./lib/registry')();
let { splash, error, argv } = require('./lib/cli');
let {	lexer } = require('bluesocks');
let rules = require('./lib/rules');
let { heading, log } = require('./lib/common');



splash(false);

let args = argv();
let world = {};
let execution_list = [];


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
		// console.log(func);
	} else {
		throw(`Attempt to execute "${call}" failed because it is not a string or a function.`);
	}
}


let feature = function(token, lexer) {
	while (!token.done && token.value.type != "ENDBLOCK") {
		token = lexer.next();
	}
}


let procedure = function(token, lexer) {
	let calls = [];
	let item;
	token = lexer.next();
	while (!token.done && token.value.type != "ENDBLOCK") {
		switch (token.value.type) {
			case "CALLPROC":
				calls.push(token.value.data);
				break;
			case "NATIVE":
				calls.push(native(token, lexer));
				break;
			case "UNKNOWN":
			default:
				console.log(`Procedure contains unexpected "${token.value.type}" token: "${token.value.data}"`);
			case "WHITESPACE":
			case "COMMENT":
			case "NEWLINE":
				break;
		}
		token = lexer.next();
	}
	return calls.reduce((acc, cur) => acc.concat(cur), []);
}


let native = function(token, lexer) {
	let out = [];
	while (!token.done && token.value.type != "ENDBLOCK") {
		out.push(token.value.data)
		token = lexer.next();
	}
	out.shift();
	return eval(`(function() {\n${out.join("\n")}\n})`);
}


let scenario_outline = function(token, lexer) {
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
				console.log("this isn't an array?", func);
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
		switch (token.value.type) {
			case "UNKNOWN":
				error(token, `Undefined command: "${token.value.data}"`)
				return false;
			case "FEATURE":
				feature(token, lexer);
				break;
			case "SCENARIO":
				execution_list.push(token.value.data);
			case "PROCEDURE":
				registry.register(token.value.data, procedure(token, lexer));
				break;
			case "SCENARIOOUTLINE":
				scenario_outline(token, lexer);
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


// let validate = function(proc_name) {
// 	console.log(`About to validate "${proc_name}", which is a ${typeof proc_name}`);
// 	let func = registry.get_function(proc_name);
// 	let out = [];
// 	switch (typeof func) {
// 		case "string":
// 			out.push(validate(registry.get_function(func)));
// 			break;
// 		case "function":
// 			out.push(true);
// 			break;
// 		case "object":
// 			Object.keys(func).forEach(x => {
// 				out.push(validate(func[x]));
// 			});
// 			break;
// 		}
// 	return out;
// 	}



args.forEach(function(val, index) {
	specFiles = files.ls(`${process.cwd()}/${val}`);
	specFile = specFiles.next();
	let i = 0;
	while (!specFile.done) {
		if (specFile.value.toLowerCase().endsWith("world.js")) {
			console.log("found a world file");
			world = require(specFile.value);
		} else if (specFile.value.toLowerCase().endsWith(".specs")) {
			heading(`Processing ${specFile.value}...`);
			let data = files.read(specFile.value);
			lex = lexer(data, specFile.value, rules);
			parse(lex);
		}
		specFile = specFiles.next();
	}

	console.log(`Execution list contains ${execution_list.length} items...`);
	registry.dump();

	execution_list = execution_list.map(x => {
		return (compile(x) || x);
	});
	let undefined_calls = registry.get_undefined();
	if (undefined_calls.length > 0) {
		console.log(`Found ${undefined_calls.length} undefined procedures, checking final definitions...`);
		console.log(`\n${undefined_calls.join("\n")}\n`);
	}


	// 	undefined_calls = registry.get_undefined();
	// 	if (undefined_calls.length > 0) {
	// 		console.log(`Found ${undefined_calls.length} undefined procedures during final pass:`);
	// 		console.log(`\n${undefined_calls.join("\n")}\n`);
	// 	}
	// } else {
	// 	execute(execution_list);
	// }
});