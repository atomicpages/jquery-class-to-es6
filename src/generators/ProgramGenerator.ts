import { Options } from "../typings/options";
import { ClassGenerator } from "./ClassGenerator";
import { StaticMethodGenerator } from "./StaticMethodGenerator";
import { StaticVariablesGenerator } from "./StaticVariablesGenerator";
import { ClassDefinition } from "../typings/ClassDefinition";
import { InstanceMethodGenerator } from "./InstanceMethodGenerator";
import { ExtendedClassGenerator } from "./ExtendedClassGenerator";
import { InstanceVariablesGenerator } from "./InstanceVariablesGenerator";

/**
 * Handles the top-level generation of the AST by declaring the program and delegating
 * other classes to build the remainder of the AST.
 * @since 1.0.0
 * @class
 */
export class ProgramGenerator {

	/**
	 * Builds the beginning of the AST.
	 * @param parameters {Object[]} The namespace of <code>$.Class</code>
	 * @param options {Options} The options passed by the consumer.
	 * @returns {object} A ES2015 JSTree-compatible object that can be used for code generation.
	 */
	public static build(parameters: any[], options: Options): Object {
		if (!parameters) {
			throw new Error('Properties must be defined.');
		}

		// inspection fails, but the reference is valid
		let namespace: string = parameters[0].value;

		let spaces: string[] = namespace.split('.');

		let ast: any = {
			type: "Program",
			body: [
				{
					type: "ExpressionStatement",
					expression: { // window.foo = window.foo || {};
						type: "AssignmentExpression",
						operator: "=",
						left: { // window
							type: "MemberExpression",
							object: {
								type: "Identifier",
								name: "window"
							},
							property: { // .foo
								type: "Identifier",
								name: spaces[0]
							},
							computed: false
						},
						right: { // window.foo || {}
							type: "LogicalExpression",
							left: { // window.foo
								type: "MemberExpression",
								object: {
									type: "Identifier",
									name: "window"
								},
								property: {
									type: "Identifier",
									name: spaces[0]
								},
								computed: false
							},
							operator: "||",
							right: { // {}
								type: "ObjectExpression",
								properties: []
							}
						}
					}
				}
			]
		};

		if (spaces.length > 1) {
			ProgramGenerator._createConstReference(ast.body, spaces[0]);
			ProgramGenerator._handleChainedSpaces(ast.body, spaces);
		}

		let classDefinition: ClassDefinition = ClassGenerator.build(spaces);

		if (options.extended) {
			if (!options.extendedNamespace) {
				console.warn('Missing namespace for extended class!');
			} else {
				let constant = ast.body[ast.body.length - 1];

				// Don't redeclare constant if namespaces match
				if (!constant.expression || !constant.expression.left || !constant.expression.left.object || (constant.expression.left.object.name !== options.extendedNamespace[0])) {
					ProgramGenerator._createConstReference(ast.body, options.extendedNamespace[0]);
				}
			}

			ExtendedClassGenerator.build(classDefinition, options.extendedNamespace);
		}

		let classBodyReference: Object[] = classDefinition.expression.right.body.body;

		ast.body.push(classDefinition);

		if (parameters.length === 3) {
			let vars: Object[] = StaticMethodGenerator.build(parameters[1], classBodyReference, spaces);

			if (vars && vars.length > 0) {
				StaticVariablesGenerator.build(vars, ast.body, namespace);
			}

			InstanceMethodGenerator.build(parameters[2], classBodyReference, options);
		} else { // no static methods declared
			InstanceMethodGenerator.build(parameters[1], classBodyReference, options);
		}

		return ast;
	}

	/**
	 * Builds AST objects for chained namespaces stemming from the root namespace.
	 * For example, foo.bar.ns.Utils will produce:
	 * <pre>
	 *     foo.bar = foo.bar || {};
	 *     foo.bar.ns = foo.bar.ns || {};
	 * </pre>
	 * @param body {object[]} The body of the AST to append the variable declaration to.
	 * @param spaces {string[]} The namespace chain as an array including the root namespace.
	 * @private
	 */
	private static _handleChainedSpaces(body: Object[], spaces: string[]): void {
		let clone = spaces.slice();

		let root = clone.shift();
		let end = clone.pop(); // ignore the last value since that is the class definition.

		clone.forEach((space, index, source) => {
			let piece = source.slice(0, index + 1).join('.');

			body.push({
				type: "ExpressionStatement",
				expression: {
					type: "AssignmentExpression",
					operator: "=",
					left: {
						type: "MemberExpression",
						object: {
							type: "Identifier",
							name: root
						},
						property: {
							type: "Identifier",
							name: piece
						},
						computed: false
					},
					right: {
						type: "LogicalExpression",
						left: {
							type: "MemberExpression",
							object: {
								type: "Identifier",
								name: root
							},
							property: {
								type: "Identifier",
								name: piece
							},
							computed: false
						},
						operator: "||",
						right: {
							type: "ObjectExpression",
							properties: []
						}
					}
				}
			});
		});
	}

	/**
	 * Sets a <code>const</code> variable so we don't modify any subsequent static references in the code.
	 * @param body {object[]} The body of the AST to append the variable declaration to.
	 * @param space {string} The root namespace object after <code>window</code> (e.g. window.foo)
	 * @private
	 */
	private static _createConstReference(body: Object[], space: string): void {
		body.push({ // const foo = window.foo;
			type: "VariableDeclaration",
			declarations: [
				{
					type: "VariableDeclarator",
					id: {
						type: "Identifier",
						name: space
					},
					init: {
						type: "MemberExpression",
						object: {
							type: "Identifier",
							name: "window"
						},
						property: {
							type: "Identifier",
							name: space
						},
						computed: false
					}
				}
			],
			kind: "const"
		});
	}

}
