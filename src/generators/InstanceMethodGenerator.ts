import { Options } from '../typings/options';
import { InstanceVariablesGenerator } from './InstanceVariablesGenerator';

export class InstanceMethodGenerator {

    private static _ctorGenerated: boolean = false;

    /**
     *
     * @param ast {object} The tree to operate on.
     * @param root {object} The location to limit ourselves to in the AST.
     * @param options {Options} The name of the constructor.
     */
    public static build(target: string, ast: any, root: Object[], options: Options): Object[] {
        const instanceVariables: any[] = [];

        ast.properties.forEach((property: any) => {
            if (property.key.name === options.constructorName && !InstanceMethodGenerator._ctorGenerated) {
                root.push(this._buildConstructor(property));
            } else {
                if (InstanceMethodGenerator._isInstanceVariable(property)) {
                    instanceVariables.push(property);
                } else {
                    root.push({
                        type: 'MethodDefinition',
                        computed: property.computed,
                        key: {
                            type: 'Identifier',
                            name: property.key.name
                        },
                        static: false,
                        kind: 'method',
                        value: {
                            type: 'FunctionExpression',
                            id: property.value.id,
                            generator: !!property.value.generator,
                            expression: !!property.value.expression,
                            async: !!property.value.async,
                            params: property.value.params,
                            body: property.value.body
                        }
                    });
                }
            }
        });

        // Instance variables are defined in the constructor in ES2015
        // Instance variables are defined outside the constructor in ES2017
        if (instanceVariables.length > 0 && !InstanceMethodGenerator._ctorGenerated) {
            if (target === 'es2015') {
                const ctor: any = this._buildConstructor({
                    computed: false,
                    value: {
                        id: null,
                        generator: false,
                        expression: false,
                        async: false,
                        params: [],
                        body: {
                            type: 'BlockStatement',
                            body: []
                        }
                    }
                });

                root.push(ctor);

                InstanceVariablesGenerator.build(target, instanceVariables, ctor.value.body.body);
            } else {
                InstanceVariablesGenerator.build(target, instanceVariables, root);

                root.push(this._buildConstructor({
                    computed: false,
                    value: {
                        id: null,
                        generator: false,
                        expression: false,
                        async: false,
                        params: [],
                        body: {
                            type: 'BlockStatement',
                            body: []
                        }
                    }
                }));
            }
        }

        return instanceVariables;
    }

    private static _isInstanceVariable(node: any): boolean {
        return node.value && node.value.type && node.value.type !== 'FunctionExpression';
    }

    private static _buildConstructor(property: any): Object {
        InstanceMethodGenerator._ctorGenerated = true;

        return {
            type: 'MethodDefinition',
            computed: property.computed,
            key: {
                type: 'Identifier',
                name: 'constructor'
            },
            static: false,
            kind: 'constructor',
            value: {
                type: 'FunctionExpression',
                id: property.value.id,
                generator: !!property.value.generator,
                expression: !!property.value.expression,
                async: !!property.value.async,
                params: property.value.params,
                body: property.value.body
            }
        };
    }

}
