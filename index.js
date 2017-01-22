const fs = require('fs');
const acorn = require('acorn');
const astring = require('astring');
const traverse = require('ast-traverse');

const namespaces = require('./generators/namespace');
const static_vars = require('./generators/static_vars');
const static_methods = require('./generators/static_methods');
const instance_methods = require('./generators/instance_methods');

function convert() {

	'use strict';

	fs.readFile('./demo.jquery.js', (err, content) => {
		let ast = acorn.parse(content.toString(), {
			sourceType: 'script',
			ranges: true
			// onComment: function (block, text, start, end) {} // TODO: extract comments and add them to ES6
		});

		let es6 = null;

		traverse(ast, {
			pre: (node, parent, prop, idx) => {
				if (node.type === 'MemberExpression') {
					if (node.object
						&& node.object.type === 'Identifier'
						&& node.object.name === '$'
						&& node.property
						&& node.property.type === 'Identifier'
						&& node.property.name === 'Class') {
						es6 = namespaces.buildNamespace(parent.arguments[0].value);

						if (parent.arguments.length === 3) {
							let staticVars = static_methods.buildStaticMethods(parent.arguments[1], es6.body[es6.body.length - 1].expression.right.body.body);
							// instance_methods.buildStaticVars(staticVars, es6.body);
						} else {
							// instance_methods.buildInstanceMethods(parent.arguments[1]);
						}
					}
				}
			}
		});

		console.log(JSON.stringify(es6).replace(/"(start|end|range)":\s*\[?\d+,?\d+?]?,/g, ''));
	});

}

module.exports = convert;

convert();