var { rule }   = require('bluesocks');

let pop = (x) => {
	x.scope = "<";
	return x;
}

const ENDBLOCK = rule("ENDBLOCK", /(\s*(\n|\r\n)\s*){2,}/, "<");
const NEWLINE = rule("NEWLINE", /(\s*(\n|\r\n)\s*){1}/);
const WHITESPACE = rule("WHITESPACE", /[\r\t ]+/);
const COMMENT = rule("COMMENT", /#[^\{\n]*(?=\n)/);

// console.log(pop(NEWLINE));

module.exports = {
	default: [
		ENDBLOCK,
		NEWLINE,
		WHITESPACE,
		COMMENT,
		rule("TAG", /@[a-z0-9_.,]+/i), //TODO: handle tags
		rule("FEATURE", /Feature:[^\n]+/i, "feature"),
		rule("BACKGROUND", /Background:[^\n]+/i), //TODO: handle background (prereqs)
		rule("SCENARIO", /Scenario:[^\n]+/i, "procedure"),
		rule("PROCEDURE", /Procedure:[^\n]+/i, "procedure"),
		rule("SCENARIOOUTLINE", /Scenario Outline:[^\n]+/i, "scenariooutline"),
		rule("NEEDBLOCK", /(Given|When|Then|And|If|Else|Otherwise) [^\n]+/i),
		rule("UNKNOWN", /\S+/)
	],
	feature: [
		COMMENT,
		ENDBLOCK,
		rule("EXPOSITION", /.+/),
		rule("NEWLINE", /(\n|\r\n){1}/),
	],
	procedure: [
		ENDBLOCK,
		NEWLINE,
		COMMENT,
		rule("NATIVE", /#{/, "native"),
		rule("WHITESPACE", /[\r\t ]+/),
		rule("CALLPROC", /(Given|When|Then|And) [^\n]+/i),
		rule("CONDITIONAL", /If [^\n]+/i),
		rule("ELSE", /(Else|Otherwise) [^\n]+/i),
		rule("UNKNOWN", /\S+/),
	],
	scenariooutline: [
		COMMENT,
		rule("EXAMPLES", /Examples:[^\n]*\n/i, "examples"),
		rule("NEWLINE", /(\n|\r\n){1}/),
		rule("NATIVE", /#{/, "native"),
		rule("WHITESPACE", /[\r\t ]+/),
		rule("CALLPROC", /(Given|When|Then|And) [^\n]+/i),
		rule("CONDITIONAL", /If [^\n]+/i),
		rule("ELSE", /(Else|Otherwise) [^\n]+/i),
		rule("UNKNOWN", /\S+/),
	],	
	examples: [
		COMMENT,
		ENDBLOCK,
		rule("NEWLINE", /\s*(\n|\r\n){1}\s/),
		rule("ROW", /\s*|\s+/, "examplesrow"),
	],
	examplesrow: [
		COMMENT,
		rule("NEWLINE", /(\n|\r\n){1}/, "<"),
		rule("DATA", /[^|\n]*[^|\n\s]+[^|\n]*/),
		rule("CELLDIVIDER", /\|/),
	],
	native: [
		rule("ENDBLOCK", /}#/, "<"),
		rule("CODE", /((?:(?!}#).|\n))+/),
	]
}