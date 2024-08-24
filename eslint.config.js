/// <reference path="./eslint-typegen.d.ts" />

import eslintJs from "@eslint/js";
import eslintStylistic from "@stylistic/eslint-plugin";
import eslintImportX from "eslint-plugin-import-x";
import eslintJsdoc from "eslint-plugin-jsdoc";
import eslintPerfectionist from "eslint-plugin-perfectionist";
import eslintSonarJs from "eslint-plugin-sonarjs";
import eslintUnicorn from "eslint-plugin-unicorn";
import typegen from "eslint-typegen";
import globals from "globals";
import tsEslint from "typescript-eslint";

const eslintConfigArray = typegen([
	// == Global Options
	{ ignores: ["dist/**", "build/**"], name: "zayne/defaults/ignores" },

	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},

			parser: tsEslint.parser,
			parserOptions: {
				project: "tsconfig.eslint.json",
				tsconfigRootDir: import.meta.dirname,
			},
		},

		name: "zayne/defaults/languageOptions",
	},

	// == Base Eslint Rules
	{ ...eslintJs.configs.recommended, name: "eslint/recommended" },
	{
		name: "zayne/eslint",
		rules: {
			"array-callback-return": ["error", { allowImplicit: true }],
			"class-methods-use-this": "error",
			complexity: ["warn", 25],
			curly: ["error", "multi-line"],
			"default-case": ["error", { commentPattern: "^no default$" }],
			"default-case-last": "error",
			"default-param-last": "error",
			eqeqeq: ["error", "always", { null: "ignore" }],
			"grouped-accessor-pairs": "error",
			"logical-assignment-operators": "warn",
			"max-depth": ["error", 2],
			"no-alert": "warn",
			"no-await-in-loop": "error",
			"no-console": ["error", { allow: ["warn", "error", "info", "trace"] }],
			"no-constant-condition": "warn",
			"no-constructor-return": "error",
			"no-else-return": ["error", { allowElseIf: false }],
			"no-extend-native": "error",
			"no-extra-bind": "error",
			"no-implicit-coercion": "warn",
			"no-lone-blocks": "error",
			"no-loop-func": "error",
			"no-new": "error",
			"no-new-func": "error",
			"no-new-wrappers": "error",
			"no-param-reassign": [
				"error",
				{
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
					props: true,
				},
			],
			"no-restricted-exports": [
				"error",
				{
					restrictedNamedExports: [
						"default", // use `export default` to provide a default export
						"then", // this will cause tons of confusion when your module is dynamically `import()`ed, and will break in most node ESM versions
					],
				},
			],
			"no-restricted-globals": [
				"error",
				{
					message:
						"Use Number.isFinite instead https://github.com/airbnb/javascript#standard-library--isfinite",
					name: "isFinite",
				},
				{
					message:
						"Use Number.isNaN instead https://github.com/airbnb/javascript#standard-library--isnan",
					name: "isNaN",
				},
			],
			"no-restricted-imports": ["off", { paths: [], patterns: [] }],
			"no-restricted-properties": [
				"error",
				{
					message: "arguments.callee is deprecated",
					object: "arguments",
					property: "callee",
				},
				{
					message: "Please use Number.isFinite instead",
					object: "global",
					property: "isFinite",
				},
				{
					message: "Please use Number.isFinite instead",
					object: "self",
					property: "isFinite",
				},
				{
					message: "Please use Number.isFinite instead",
					object: "window",
					property: "isFinite",
				},
				{
					message: "Please use Number.isNaN instead",
					object: "global",
					property: "isNaN",
				},
				{
					message: "Please use Number.isNaN instead",
					object: "self",
					property: "isNaN",
				},
				{
					message: "Please use Number.isNaN instead",
					object: "window",
					property: "isNaN",
				},
				{
					message: "Use the exponentiation operator (**) instead.",
					object: "Math",
					property: "pow",
				},
			],
			"no-restricted-syntax": ["error", "ForInStatement", "LabeledStatement", "WithStatement"],
			"no-return-assign": ["error", "except-parens"],
			"no-script-url": "error",
			"no-self-compare": "error",
			"no-sequences": "error",
			"no-template-curly-in-string": "error",
			"no-undef-init": "error",
			"no-unmodified-loop-condition": "error",
			"no-unneeded-ternary": "warn",
			"no-unreachable-loop": "error",
			"no-unused-vars": "warn",
			"no-useless-computed-key": "error",
			"no-useless-concat": "error",
			"no-useless-constructor": "error",
			"no-useless-rename": [
				"error",
				{ ignoreDestructuring: false, ignoreExport: false, ignoreImport: false },
			],
			"no-useless-return": "error",
			"object-shorthand": ["error", "always", { avoidQuotes: true, ignoreConstructors: false }],
			"operator-assignment": "warn",
			"prefer-arrow-callback": ["error", { allowNamedFunctions: true }],
			"prefer-object-has-own": "error",
			"prefer-object-spread": "warn",
			"prefer-regex-literals": ["error", { disallowRedundantWrapping: true }],
			"prefer-template": "error",
			radix: "error",
			"symbol-description": "error",
			"vars-on-top": "error",
		},
	},

	// == Typescript Eslint Rules
	// == Typescript Eslint Rules
	...tsEslint.configs.strictTypeChecked.map((config) => ({ ...config, files: ["**/*.ts", "**/*.tsx"] })),
	...tsEslint.configs.stylisticTypeChecked.map((config) => ({
		...config,
		files: ["**/*.ts", "**/*.tsx"],
	})),
	{
		files: ["**/*.ts", "**/*.tsx"],

		name: "zayne/@typescript-eslint",

		plugins: {
			"@typescript-eslint": tsEslint.plugin,
		},

		rules: {
			"@typescript-eslint/array-type": ["error", { default: "array-simple" }],
			"@typescript-eslint/consistent-type-definitions": ["error", "type"],
			"@typescript-eslint/default-param-last": "error",
			"@typescript-eslint/dot-notation": "error",
			"@typescript-eslint/member-ordering": "error",
			"@typescript-eslint/method-signature-style": ["error", "property"],
			"@typescript-eslint/no-confusing-void-expression": "off",
			"@typescript-eslint/no-empty-function": [
				"error",
				{ allow: ["arrowFunctions", "functions", "methods"] },
			],
			"@typescript-eslint/no-import-type-side-effects": "error",
			"@typescript-eslint/no-shadow": "error",
			"@typescript-eslint/no-unnecessary-type-parameters": "off",
			"@typescript-eslint/no-unused-expressions": [
				"error",
				{
					allowShortCircuit: true,
					allowTernary: true,
				},
			],
			"@typescript-eslint/no-unused-vars": ["warn", { ignoreRestSiblings: true }],
			"@typescript-eslint/no-use-before-define": "off",
			"@typescript-eslint/no-useless-constructor": "error",
			"@typescript-eslint/non-nullable-type-assertion-style": "off",
			"@typescript-eslint/prefer-nullish-coalescing": ["error", { ignoreConditionalTests: true }],
			"@typescript-eslint/require-await": "error",
			"@typescript-eslint/restrict-template-expressions": [
				"error",
				{ allowBoolean: true, allowNullish: true, allowNumber: true },
			],
			"@typescript-eslint/return-await": ["error", "in-try-catch"],
		},
	},

	// == Stylistic Rules
	{
		name: "zayne/@stylistic",
		plugins: { "@stylistic": eslintStylistic },
		rules: {
			"@stylistic/jsx-self-closing-comp": "error",
			"@stylistic/no-floating-decimal": "error",
			"@stylistic/spaced-comment": [
				"warn",
				...eslintStylistic.configs["recommended-flat"].rules["@stylistic/spaced-comment"].filter(
					(item) => item !== "error"
				),
			],
		},
	},

	// == Perfectionist Rules
	{
		name: "zayne/perfectionist/alphabetical",
		plugins: { perfectionist: eslintPerfectionist },
		rules: {
			"perfectionist/sort-array-includes": [
				"warn",
				{
					order: "asc",
					type: "alphabetical",
				},
			],
			"perfectionist/sort-astro-attributes": [
				"warn",
				{
					order: "asc",
					type: "alphabetical",
				},
			],
			"perfectionist/sort-classes": [
				"warn",
				{
					order: "asc",
					type: "alphabetical",
				},
			],
			"perfectionist/sort-interfaces": [
				"warn",
				{
					order: "asc",
					type: "alphabetical",
				},
			],
			// "perfectionist/sort-intersection-types": [
			// 	"warn",
			// 	{
			// 		order: "asc",
			// 		type: "alphabetical",
			// 	},
			// ],
			"perfectionist/sort-jsx-props": [
				"warn",
				{
					// ignorePattern: ["src"],
					order: "asc",
					type: "alphabetical",
				},
			],
			"perfectionist/sort-maps": [
				"warn",
				{
					order: "asc",
					type: "alphabetical",
				},
			],
			"perfectionist/sort-object-types": [
				"warn",
				{
					order: "asc",
					type: "alphabetical",
				},
			],
			"perfectionist/sort-objects": [
				"warn",
				{
					order: "asc",
					type: "alphabetical",
				},
			],
			"perfectionist/sort-svelte-attributes": [
				"warn",
				{
					order: "asc",
					type: "alphabetical",
				},
			],
			"perfectionist/sort-switch-case": [
				"warn",
				{
					order: "asc",
					type: "alphabetical",
				},
			],
			"perfectionist/sort-union-types": [
				"warn",
				{
					order: "asc",
					type: "alphabetical",
				},
			],
			"perfectionist/sort-variable-declarations": [
				"warn",
				{
					order: "asc",
					type: "alphabetical",
				},
			],
			"perfectionist/sort-vue-attributes": [
				"warn",
				{
					order: "asc",
					type: "alphabetical",
				},
			],
		},
	},

	// == Import rules
	{
		languageOptions: {
			parserOptions: eslintImportX.configs.react.parserOptions,
		},
		name: "zayne/import-x",
		plugins: { "import-x": eslintImportX },

		rules: {
			...eslintImportX.configs.recommended.rules,
			...eslintImportX.configs.typescript.rules,
			"import-x/export": "error",
			"import-x/extensions": ["error", "never", { ignorePackages: true }],
			"import-x/first": "error",
			"import-x/namespace": "off",
			"import-x/newline-after-import": "error",
			"import-x/no-absolute-path": "error",
			"import-x/no-cycle": ["error", { ignoreExternal: true, maxDepth: 3 }],
			"import-x/no-duplicates": "error",
			"import-x/no-extraneous-dependencies": ["error", { devDependencies: true }],
			"import-x/no-mutable-exports": "error",
			"import-x/no-named-as-default": "error",
			"import-x/no-named-as-default-member": "error",
			"import-x/no-named-default": "error",
			"import-x/no-relative-packages": "error",
			"import-x/no-self-import": "error",
			"import-x/no-unresolved": "off",
			"import-x/no-useless-path-segments": ["error", { commonjs: true }],
			"import-x/prefer-default-export": "off",
		},
		settings: {
			...eslintImportX.configs.typescript.settings,
			...eslintImportX.configs.react.settings,
		},
	},

	// == Jsdoc rules
	eslintJsdoc.configs["flat/recommended-typescript"],
	{
		name: "zayne/jsdoc",
		plugins: { jsdoc: eslintJsdoc },
		rules: {
			"jsdoc/require-description": "warn",
		},
	},

	// == Unicorn rules
	eslintUnicorn.configs["flat/recommended"],
	{
		name: "zayne/unicorn",
		rules: {
			"unicorn/filename-case": [
				"warn",
				{
					cases: {
						camelCase: true,
						kebabCase: true,
						pascalCase: true,
					},
				},
			],
			"unicorn/new-for-builtins": "off",
			"unicorn/no-array-for-each": "off",
			"unicorn/no-array-reduce": "off",
			"unicorn/no-negated-condition": "off",
			"unicorn/no-null": "off",
			"unicorn/no-useless-undefined": ["error", { checkArguments: true }],
			"unicorn/numeric-separators-style": "off",
			"unicorn/prevent-abbreviations": "off",
		},
	},

	// == Sonarjs Rules
	{ ...eslintSonarJs.configs.recommended, name: "sonarjs/recommended" },
	{
		name: "zayne/sonarjs",
		rules: {
			"sonarjs/no-duplicate-string": "off",
			"sonarjs/prefer-immediate-return": "off",
		},
	},
]);

export default eslintConfigArray;
