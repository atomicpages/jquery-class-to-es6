import {ClassDefinition} from "./typings/ClassDefinition";
/**
 * Handles the creation of the class statement with namespace assignment.
 * @class
 */
export class ClassGenerator {

	/**
	 * Converts the first letter of a string to a capital letter.
	 * @param string {string} The string to process.
	 * @returns {string}
	 * @private
	 */
	private static _ucfirst(string: string): string {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}

	/**
	 * Builds a JSTree-compliant ES2015 class definition which can be appended to the main body of an AST.
	 * @param namespace
	 * @returns {object}
	 */
	public static build(namespace: string[]): ClassDefinition {
		let root = namespace.shift();

		return {
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
						name: namespace.join('.')
					},
					computed: false
				},
				right: {
					type: "ClassExpression",
					id: {
						type: "Identifier",
						name: ClassGenerator._ucfirst(namespace[namespace.length - 1])
					},
					superClass: null,
					body: {
						type: "ClassBody",
						body: []
					}
				}
			}
		};
	}

}