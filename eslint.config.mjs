/* eslint-disable unicorn/no-abusive-eslint-disable */
/* eslint-disable */
import eslintBase from "@eslint/js";
import eslintImportX from "eslint-plugin-import-x";
import eslintJsdoc from "eslint-plugin-jsdoc";
import eslintSonarjs from "eslint-plugin-sonarjs";
import eslintUnicorn from "eslint-plugin-unicorn";
import globals from "globals";
import tsEslint from "typescript-eslint";

/** @type {import('typescript-eslint').ConfigWithExtends[]} */

const eslintConfigArray = [
	// == Global Options
	{ ignores: ["dist/**", "node_modules/**", "build/**"] },
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
	},

	// == Base Eslint Rules
	eslintBase.configs.recommended,
	{
		rules: {
			"no-return-assign": ["error", "except-parens"],
			"prefer-arrow-callback": [
				"error",
				{
					allowNamedFunctions: true,
				},
			],
			"no-restricted-syntax": ["error", "ForInStatement", "LabeledStatement", "WithStatement"],
			"no-console": ["error", { allow: ["warn", "error", "info", "trace"] }],
			"constructor-super": "error",
			"no-class-assign": "error",
			//FIXME - JsOnly -  disallow modifying variables that are declared using const
			"no-const-assign": "error",
			"no-dupe-class-members": "error",
			"no-restricted-exports": [
				"error",
				{
					restrictedNamedExports: [
						"default", // use `export default` to provide a default export
						"then", // this will cause tons of confusion when your module is dynamically `import()`ed, and will break in most node ESM versions
					],
				},
			],
			"no-this-before-super": "error",
			"no-useless-computed-key": "error",
			"no-useless-constructor": "error",
			"no-useless-rename": [
				"error",
				{ ignoreDestructuring: false, ignoreImport: false, ignoreExport: false },
			],
			"no-var": "error",
			"no-unsafe-optional-chaining": ["error", { disallowArithmeticOperators: true }],
			"no-unsafe-negation": "error",
			"no-unsafe-finally": "error",
			"no-unreachable-loop": [
				"error",
				{
					ignore: [], // WhileStatement, DoWhileStatement, ForStatement, ForInStatement, ForOfStatement
				},
			],
			// disallow irregular whitespace outside of strings and comments
			"no-irregular-whitespace": "error",
			"no-invalid-regexp": "error",
			"getter-return": ["error", { allowImplicit: true }],
			"no-constant-condition": "warn",
			"no-empty": "error",
			"no-func-assign": "error",
			"no-await-in-loop": "error",
			"no-cond-assign": ["error", "always"],
			"no-duplicate-case": "error",
			"no-unreachable": "error",
			"no-unexpected-multiline": "error",
			"no-template-curly-in-string": "error",
			"no-sparse-arrays": "error",
			"object-shorthand": ["error", "always", { ignoreConstructors: false, avoidQuotes: true }],
			"prefer-const": ["error", { destructuring: "any", ignoreReadBeforeAssign: true }],
			"prefer-destructuring": [
				"error",
				{
					VariableDeclarator: {
						array: false,
						object: true,
					},
					AssignmentExpression: {
						array: true,
						object: false,
					},
				},
				{
					enforceForRenamedProperties: false,
				},
			],
			"prefer-rest-params": "error",
			"prefer-spread": "error",
			"prefer-template": "error",
			"symbol-description": "error",
			"no-restricted-imports": ["off", { paths: [], patterns: [] }],
			"no-restricted-globals": [
				"error",
				{
					name: "isFinite",
					message:
						"Use Number.isFinite instead https://github.com/airbnb/javascript#standard-library--isfinite",
				},
				{
					name: "isNaN",
					message:
						"Use Number.isNaN instead https://github.com/airbnb/javascript#standard-library--isnan",
				},
			],
			"no-shadow-restricted-names": "error",
			"no-undef": "error",
			"no-undef-init": "error",
			"array-callback-return": ["error", { allowImplicit: true }],
			"class-methods-use-this": [
				"error",
				{
					exceptMethods: [],
				},
			],
			complexity: ["warn", 25],
			// specify curly brace conventions for all control statements
			// https://eslint.org/docs/rules/curly
			curly: ["error", "multi-line"], // multiline
			"default-case": ["error", { commentPattern: "^no default$" }],
			"default-case-last": "error",
			// enforces consistent newlines before or after dots
			// https://eslint.org/docs/rules/dot-location
			eqeqeq: ["error", "always", { null: "ignore" }],
			"grouped-accessor-pairs": "error",
			"no-alert": "warn",
			"no-case-declarations": "error",
			"no-constructor-return": "error",
			"no-else-return": ["error", { allowElseIf: false }],
			"no-empty-function": ["error", { allow: ["arrowFunctions", "functions", "methods"] }],
			"no-empty-pattern": "error",
			"no-extend-native": "error",
			"no-extra-bind": "error",
			"no-fallthrough": "error",
			"no-global-assign": ["error", { exceptions: [] }],
			"no-lone-blocks": "error",
			"no-loop-func": "error",
			"no-new": "error",
			"no-new-func": "error",
			"no-new-wrappers": "error",
			"no-param-reassign": [
				"error",
				{
					props: true,
					ignorePropertyModificationsFor: [
						"acc", // for reduce accumulators
						"accumulator", // for reduce accumulators
						"e", // for e.returnvalue
						"ctx", // for Koa routing
						"context", // for Koa routing
						"req", // for Express requests
						"request", // for Express requests
						"res", // for Express responses
						"response", // for Express responses
						"$scope", // for Angular 1 scopes
						"staticContext", // for ReactRouter context
					],
				},
			],
			"no-restricted-properties": [
				"error",
				{
					object: "arguments",
					property: "callee",
					message: "arguments.callee is deprecated",
				},
				{
					object: "global",
					property: "isFinite",
					message: "Please use Number.isFinite instead",
				},
				{
					object: "self",
					property: "isFinite",
					message: "Please use Number.isFinite instead",
				},
				{
					object: "window",
					property: "isFinite",
					message: "Please use Number.isFinite instead",
				},
				{
					object: "global",
					property: "isNaN",
					message: "Please use Number.isNaN instead",
				},
				{
					object: "self",
					property: "isNaN",
					message: "Please use Number.isNaN instead",
				},
				{
					object: "window",
					property: "isNaN",
					message: "Please use Number.isNaN instead",
				},
				{
					object: "Math",
					property: "pow",
					message: "Use the exponentiation operator (**) instead.",
				},
			],
			"no-script-url": "error",
			"no-self-assign": ["error", { props: true }],
			"no-self-compare": "error",
			"no-sequences": "error",
			"no-useless-catch": "error",
			"no-useless-concat": "error",
			"no-useless-escape": "error",
			"no-useless-return": "error",
			"prefer-promise-reject-errors": ["error", { allowEmptyReject: true }],
			"prefer-object-has-own": "error",
			"prefer-regex-literals": ["error", { disallowRedundantWrapping: true }],
			radix: "error",
			"vars-on-top": "error",
		},
	},

	// == Typescript Eslint Rules
	...tsEslint.configs.strictTypeChecked,
	...tsEslint.configs.stylisticTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				project: "config/tsconfig.eslint.json",
				tsconfigRootDir: import.meta.dirname,
			},
		},
		rules: {
			"@typescript-eslint/no-unused-expressions": [
				"error",
				{
					allowShortCircuit: true,
					allowTernary: true,
				},
			],
			"@typescript-eslint/no-import-type-side-effects": "error",
			"@typescript-eslint/no-unused-vars": ["warn", { ignoreRestSiblings: true }],
			"@typescript-eslint/array-type": ["error", { default: "array-simple" }],
			"@typescript-eslint/consistent-type-definitions": ["error", "type"],
			"@typescript-eslint/no-useless-constructor": "error",
			"@typescript-eslint/member-ordering": "error",
			"@typescript-eslint/no-confusing-void-expression": "off",
			"@typescript-eslint/non-nullable-type-assertion-style": "off",
			"@typescript-eslint/no-use-before-define": "off",
			"@typescript-eslint/method-signature-style": ["error", "property"],
			"@typescript-eslint/restrict-template-expressions": [
				"error",
				{ allowNumber: true, allowNullish: true, allowBoolean: true },
			],
			"@typescript-eslint/default-param-last": "error",
			"@typescript-eslint/return-await": ["error", "in-try-catch"],
			"@typescript-eslint/require-await": "error",
			"@typescript-eslint/no-empty-function": [
				"error",
				{ allow: ["arrowFunctions", "functions", "methods"] },
			],
			"@typescript-eslint/dot-notation": "error",
			"@typescript-eslint/no-shadow": "error",
			"@typescript-eslint/prefer-nullish-coalescing": ["error", { ignoreConditionalTests: true }],
		},
	},

	// == Jsdoc rules
	eslintJsdoc.configs["flat/recommended-typescript"],
	{
		plugins: { jsdoc: eslintJsdoc },
		rules: {
			"jsdoc/require-description": "warn",
		},
	},

	// == Import rules
	eslintImportX.configs.typescript,
	{
		plugins: { "import-x": eslintImportX },
		rules: {
			...eslintImportX.configs.recommended.rules,
			// "import-x/extensions": ["error", "never", { ignorePackages: true }],
			"import-x/no-extraneous-dependencies": ["error", { devDependencies: true }],
			"import-x/prefer-default-export": "off",
			"import-x/no-cycle": ["error", { ignoreExternal: true, maxDepth: 3 }],
			"import-x/no-unresolved": "off",
			"import-x/export": "error",
			"import-x/no-named-as-default": "error",
			"import-x/namespace": "off",
			"import-x/prefer-default-export": "warn",
			"import-x/no-named-as-default-member": "error",
			"import-x/no-mutable-exports": "error",
			"import-x/first": "error",
			"import-x/no-duplicates": "error",
			"import-x/newline-after-import": "error",
			"import-x/no-absolute-path": "error",
			"import-x/no-named-default": "error",
			"import-x/no-self-import": "error",
			"import-x/no-useless-path-segments": ["error", { commonjs: true }],
			"import-x/no-relative-packages": "error",
		},
	},

	// == Unicorn rules
	eslintUnicorn.configs["flat/recommended"],
	{
		rules: {
			"unicorn/no-null": "off",
			"unicorn/filename-case": [
				"warn",
				{
					cases: {
						camelCase: true,
						pascalCase: true,
						kebabCase: true,
					},
				},
			],
			"unicorn/no-negated-condition": "off",
			"unicorn/prevent-abbreviations": "off",
			"unicorn/new-for-builtins": "off",
			"unicorn/numeric-separators-style": "off",
			"unicorn/no-array-reduce": "off",
			"unicorn/no-array-for-each": "off",
			"unicorn/no-useless-undefined": ["error", { checkArguments: true }],
		},
	},

	// == Sonarjs Rules
	eslintSonarjs.configs.recommended,
	{
		rules: {
			"sonarjs/prefer-immediate-return": "off",
			"sonarjs/cognitive-complexity": "off",
			"sonarjs/no-duplicate-string": "off",
		},
	},
];

export default eslintConfigArray;
