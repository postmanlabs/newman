import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';
import lodash from 'eslint-plugin-lodash';
import mocha from 'eslint-plugin-mocha';
import n from 'eslint-plugin-n';
import security from 'eslint-plugin-security';
import stylistic from '@stylistic/eslint-plugin';

export default [
    {
        files: ['**/*.js'],

        languageOptions: {
            ecmaVersion: 'latest',
            // required, the module-scoped `return` in lib/node-version-check does not parse otherwise
            sourceType: 'commonjs',
            globals: {
                ...globals.node
            }
        },

        plugins: { '@stylistic': stylistic, jsdoc, lodash, n, security },

        settings: {
            lodash: {
                pragma: '_'
            }
        },

        rules: {
            // Possible Errors
            'for-direction': 'error',
            'default-param-last': 'error',
            'getter-return': 'error',
            'no-async-promise-executor': 'error',
            'no-await-in-loop': 'error',
            'no-compare-neg-zero': 'error',
            'no-cond-assign': 'error',
            'no-console': [
                'error',
                {
                    allow: ['info', 'warn', 'error']
                }
            ],
            'no-constant-binary-expression': 'error',
            'no-constant-condition': 'error',
            'no-control-regex': 'error',
            'no-constructor-return': 'error',
            'no-debugger': 'error',
            'no-dupe-args': 'error',
            'no-dupe-else-if': 'error',
            'no-dupe-keys': 'error',
            'no-duplicate-case': 'error',
            'no-empty': 'error',
            'no-empty-character-class': 'error',
            'no-empty-static-block': 'error',
            'no-ex-assign': 'error',
            'no-extra-boolean-cast': 'error',
            'no-func-assign': 'error',
            'no-import-assign': 'error',
            'no-inner-declarations': 'error',
            'no-invalid-regexp': 'error',
            'no-irregular-whitespace': 'error',
            'no-loss-of-precision': 'error',
            'no-misleading-character-class': 'error',
            // replaces `no-new-symbol`, which was deprecated in v9 for missing the other non-constructors
            'no-new-native-nonconstructor': 'error',
            'no-nonoctal-decimal-escape': 'error',
            'no-obj-calls': 'error',
            'no-prototype-builtins': 'error',
            'no-regex-spaces': 'error',
            'no-sparse-arrays': 'error',
            'no-template-curly-in-string': 'error',
            'no-unassigned-vars': 'error',
            'no-unexpected-multiline': 'error',
            'no-unreachable': 'error',
            'no-unsafe-finally': 'error',
            'no-unsafe-negation': 'error',
            'no-unsafe-optional-chaining': 'error',
            'no-unused-private-class-members': 'error',
            'no-useless-assignment': 'error',
            'prefer-regex-literals': 'error',
            'require-atomic-updates': 'error',
            'require-unicode-regexp': 'off',
            'use-isnan': 'error',
            'valid-typeof': 'error',

            // Best Practices
            'accessor-pairs': 'error',
            'array-callback-return': 'off',
            'block-scoped-var': 'error',
            'class-methods-use-this': 'error',
            complexity: 'off',
            'consistent-return': 'off',
            curly: 'error',
            'default-case': 'error',
            'default-case-last': 'error',
            'dot-notation': 'error',
            eqeqeq: 'error',
            'grouped-accessor-pairs': 'warn',
            'guard-for-in': 'warn',
            'id-denylist': 'warn',
            'max-classes-per-file': ['error', 1],
            'max-lines-per-function': 'off',
            'no-alert': 'error',
            'no-caller': 'error',
            'no-case-declarations': 'error',
            'no-div-regex': 'error',
            'no-else-return': 'error',
            'no-empty-function': 'error',
            'no-empty-pattern': 'error',
            'no-eq-null': 'error',
            'no-eval': 'error',
            'no-extend-native': 'error',
            'no-extra-bind': 'error',
            'no-extra-label': 'error',
            'no-fallthrough': 'error',
            'no-global-assign': 'error',
            'no-implicit-coercion': 'error',
            'no-implicit-globals': 'error',
            'no-implied-eval': 'error',
            'no-invalid-this': 'error',
            'no-iterator': 'error',
            'no-labels': 'error',
            'no-lone-blocks': 'error',
            'no-loop-func': 'error',
            'no-magic-numbers': 'off',
            'no-multi-str': 'error',
            'no-new': 'error',
            'no-new-func': 'error',
            'no-new-wrappers': 'error',
            // replaces `no-new-object`, which was deprecated in v8.50 for missing `Object()` calls
            'no-object-constructor': 'error',
            'no-octal': 'error',
            'no-octal-escape': 'error',
            'no-param-reassign': 'off',
            'no-promise-executor-return': 'error',
            'no-proto': 'error',
            'no-redeclare': 'error',
            'no-restricted-exports': 'error',
            'no-restricted-properties': 'error',
            'no-return-assign': 'error',
            // `no-return-await` was deprecated in v8.46 without a replacement, dropping the `await` from a
            // returned promise loses async stack frames and escapes any surrounding `try`/`catch`
            'no-script-url': 'error',
            'no-self-assign': 'error',
            'no-self-compare': 'error',
            'no-sequences': 'error',
            'no-setter-return': 'error',
            'no-throw-literal': 'error',
            'no-unmodified-loop-condition': 'error',
            'no-unreachable-loop': 'error',
            'no-unused-expressions': 'off',
            'no-unused-labels': 'error',
            'no-useless-call': 'error',
            'no-useless-concat': 'error',
            'no-useless-backreference': 'error',
            'no-useless-escape': 'error',
            'no-useless-return': 'error',
            'no-void': 'error',
            'no-warning-comments': 'off',
            'no-with': 'error',
            'prefer-named-capture-group': 'off',
            'prefer-exponentiation-operator': 'warn',
            'prefer-object-spread': 'error',
            'prefer-promise-reject-errors': 'error',
            'preserve-caught-error': 'error',
            radix: 'error',
            'require-await': 'error',
            'vars-on-top': 'off',
            yoda: 'error',

            // Strict Mode
            strict: 'off',

            // Variables
            'init-declarations': 'off',
            'no-delete-var': 'error',
            'no-label-var': 'error',
            'no-restricted-globals': 'error',
            'no-shadow': 'off',
            'no-shadow-restricted-names': 'error',
            'no-undef': 'error',
            'no-undef-init': 'error',
            'no-undefined': 'off',
            // `caughtErrors` defaults to "all" from ESLint v9 onwards, retain the previous default
            'no-unused-vars': ['error', { caughtErrors: 'none' }],
            'no-use-before-define': 'error',

            // Node.js and CommonJS, these moved to eslint-plugin-n when core deprecated them in v7
            'n/callback-return': 'error',
            'n/global-require': 'off',
            'n/handle-callback-err': 'error',
            // supersedes `no-buffer-constructor`, also covers the rest of the deprecated Node API surface
            'n/no-deprecated-api': 'error',
            'n/no-mixed-requires': 'off',
            'n/no-new-require': 'off',
            'n/no-path-concat': 'error',
            'n/no-process-env': 'error',
            'n/no-process-exit': 'off',
            'n/no-restricted-require': 'error',
            'n/no-sync': 'off',

            // Stylistic Issues
            camelcase: 'off',
            'capitalized-comments': 'off',
            'consistent-this': 'off',
            'func-name-matching': 'off',
            'func-names': 'off',
            'func-style': 'off',
            'id-length': 'off',
            'id-match': 'error',
            'max-depth': 'error',
            'max-lines': 'off',
            'max-nested-callbacks': 'error',
            'max-params': 'off',
            'max-statements': 'off',
            'new-cap': 'off',
            'no-array-constructor': 'error',
            'no-bitwise': 'off',
            'no-continue': 'off',
            'no-inline-comments': 'off',
            'no-lonely-if': 'error',
            'no-multi-assign': 'off',
            'no-negated-condition': 'off',
            'no-nested-ternary': 'off',
            'no-plusplus': 'off',
            'no-restricted-syntax': 'error',
            'no-ternary': 'off',
            'no-underscore-dangle': 'off',
            'no-unneeded-ternary': 'error',
            'one-var': ['error', 'always'],
            'operator-assignment': 'error',
            'sort-keys': 'off',
            'sort-vars': 'off',
            'unicode-bom': 'error',

            // ECMAScript 6
            'arrow-body-style': ['error', 'always'],
            'constructor-super': 'error',
            // the `dependency-check` used by `npm run test-system` parses with acorn 7, which predates
            // ES2021, so `&&=`/`||=` anywhere in the require graph fails the build
            'logical-assignment-operators': 'off',
            'no-class-assign': 'error',
            'no-const-assign': 'error',
            'no-dupe-class-members': 'error',
            'no-duplicate-imports': 'error',
            'no-restricted-imports': 'error',
            'no-this-before-super': 'error',
            'no-useless-catch': 'error',
            'no-useless-computed-key': 'error',
            'no-useless-constructor': 'error',
            'no-useless-rename': 'error',
            'no-var': 'off',
            'object-shorthand': ['error', 'consistent-as-needed'],
            'prefer-arrow-callback': 'off',
            'prefer-const': 'off',
            'prefer-destructuring': 'off',
            'prefer-numeric-literals': 'off',
            'prefer-object-has-own': 'error',
            'prefer-rest-params': 'off',
            'prefer-spread': 'error',
            'prefer-template': 'off',
            'require-yield': 'error',
            'sort-imports': 'off',
            'symbol-description': 'off',

            // Formatting, these were frozen in core in v8.53 and live in @stylistic now
            '@stylistic/array-bracket-newline': 'off',
            '@stylistic/array-bracket-spacing': 'error',
            '@stylistic/array-element-newline': 'off',
            '@stylistic/arrow-parens': ['error', 'always'],
            '@stylistic/arrow-spacing': 'error',
            '@stylistic/block-spacing': 'error',
            '@stylistic/brace-style': [
                'error',
                'stroustrup',
                {
                    allowSingleLine: true
                }
            ],
            '@stylistic/comma-dangle': ['error', 'never'],
            '@stylistic/comma-spacing': [
                'error',
                {
                    before: false,
                    after: true
                }
            ],
            '@stylistic/comma-style': ['error', 'last'],
            '@stylistic/computed-property-spacing': 'error',
            '@stylistic/dot-location': ['error', 'property'],
            '@stylistic/eol-last': 'error',
            '@stylistic/function-call-argument-newline': 'off',
            // renamed from `func-call-spacing` on the way out of core
            '@stylistic/function-call-spacing': 'error',
            '@stylistic/function-paren-newline': ['error', 'never'],
            '@stylistic/generator-star-spacing': 'error',
            '@stylistic/implicit-arrow-linebreak': ['error', 'beside'],
            '@stylistic/indent': [
                'error',
                4,
                {
                    VariableDeclarator: {
                        var: 1,
                        let: 1,
                        const: 1
                    },
                    SwitchCase: 1
                }
            ],
            '@stylistic/jsx-quotes': ['error', 'prefer-single'],
            '@stylistic/key-spacing': 'error',
            '@stylistic/keyword-spacing': 'error',
            '@stylistic/line-comment-position': 'off',
            '@stylistic/linebreak-style': ['error', 'unix'],
            '@stylistic/lines-around-comment': [
                'error',
                {
                    beforeBlockComment: true,
                    afterBlockComment: false,
                    beforeLineComment: false,
                    afterLineComment: false,
                    allowBlockStart: true,
                    allowBlockEnd: false,
                    allowObjectStart: true,
                    allowObjectEnd: false,
                    allowArrayStart: true,
                    allowArrayEnd: false
                }
            ],
            '@stylistic/lines-between-class-members': [
                'error',
                'always',
                {
                    exceptAfterSingleLine: true
                }
            ],
            // long unbreakable literals, mostly `exec()` CLI command lines in the tests, accounted for
            // every one of the 43 `eslint-disable` comments this rule used to need
            '@stylistic/max-len': [
                'error',
                {
                    code: 120,
                    ignoreStrings: true,
                    ignoreTemplateLiterals: true,
                    ignoreRegExpLiterals: true,
                    ignoreUrls: true
                }
            ],
            '@stylistic/max-statements-per-line': [
                'error',
                {
                    max: 2
                }
            ],
            '@stylistic/multiline-comment-style': 'off',
            '@stylistic/multiline-ternary': 'off',
            '@stylistic/new-parens': 'error',
            '@stylistic/newline-per-chained-call': [
                'error',
                {
                    ignoreChainWithDepth: 4
                }
            ],
            '@stylistic/no-confusing-arrow': 'error',
            '@stylistic/no-extra-parens': 'off',
            '@stylistic/no-extra-semi': 'error',
            '@stylistic/no-floating-decimal': 'error',
            '@stylistic/no-mixed-operators': 'off',
            '@stylistic/no-mixed-spaces-and-tabs': 'error',
            '@stylistic/no-multi-spaces': 'error',
            '@stylistic/no-multiple-empty-lines': 'error',
            '@stylistic/no-tabs': 'error',
            '@stylistic/no-trailing-spaces': 'error',
            '@stylistic/no-whitespace-before-property': 'error',
            '@stylistic/nonblock-statement-body-position': 'error',
            '@stylistic/object-curly-newline': 'off',
            '@stylistic/object-curly-spacing': ['error', 'always'],
            '@stylistic/object-property-newline': 'off',
            '@stylistic/one-var-declaration-per-line': 'error',
            '@stylistic/operator-linebreak': ['error', 'after'],
            '@stylistic/padded-blocks': ['error', 'never'],
            '@stylistic/padding-line-between-statements': [
                'error',
                {
                    blankLine: 'always',
                    prev: '*',
                    next: 'return'
                },
                {
                    blankLine: 'always',
                    prev: ['const', 'let', 'var'],
                    next: '*'
                },
                {
                    blankLine: 'any',
                    prev: ['const', 'let', 'var'],
                    next: ['const', 'let', 'var']
                }
            ],
            '@stylistic/quote-props': ['error', 'as-needed'],
            '@stylistic/quotes': ['error', 'single'],
            '@stylistic/rest-spread-spacing': 'error',
            '@stylistic/semi': 'error',
            '@stylistic/semi-spacing': 'error',
            '@stylistic/semi-style': ['error', 'last'],
            '@stylistic/space-before-blocks': 'error',
            '@stylistic/space-before-function-paren': 'error',
            '@stylistic/space-in-parens': 'error',
            '@stylistic/space-infix-ops': 'error',
            '@stylistic/space-unary-ops': 'error',
            '@stylistic/spaced-comment': [
                'error',
                'always',
                {
                    block: {
                        exceptions: ['!']
                    }
                }
            ],
            '@stylistic/switch-colon-spacing': 'error',
            '@stylistic/template-curly-spacing': 'error',
            '@stylistic/template-tag-spacing': 'error',
            '@stylistic/wrap-iife': 'error',
            '@stylistic/wrap-regex': 'error',
            '@stylistic/yield-star-spacing': 'error',

            // Lodash
            'lodash/callback-binding': 'error',
            'lodash/collection-method-value': 'off',
            'lodash/collection-ordering': 'error',
            'lodash/collection-return': 'error',
            'lodash/no-double-unwrap': 'error',
            'lodash/no-extra-args': 'error',
            'lodash/no-unbound-this': 'error',
            'lodash/unwrap': 'error',

            'lodash/chain-style': ['error', 'as-needed'],
            'lodash/chaining': ['error', 'always', 3],
            'lodash/consistent-compose': ['error', 'flow'],
            'lodash/identity-shorthand': ['error', 'always'],
            'lodash/import-scope': 'off',
            'lodash/matches-prop-shorthand': ['error', 'always'],
            'lodash/matches-shorthand': ['error', 'always', 3],
            'lodash/no-commit': 'error',
            'lodash/path-style': ['error', 'as-needed'],
            'lodash/prefer-compact': 'error',
            'lodash/prefer-filter': ['off', 3],
            'lodash/prefer-flat-map': 'error',
            'lodash/prefer-invoke-map': 'error',
            'lodash/prefer-map': 'error',
            'lodash/prefer-reject': ['error', 3],
            'lodash/prefer-thru': 'error',
            'lodash/prefer-wrapper-method': 'error',
            'lodash/preferred-alias': 'error',
            'lodash/prop-shorthand': ['error', 'always'],

            'lodash/prefer-constant': 'off',
            'lodash/prefer-find': 'error',
            'lodash/prefer-get': ['warn', 4],
            'lodash/prefer-immutable-method': 'error',
            'lodash/prefer-includes': [
                'error',
                {
                    includeNative: true
                }
            ],
            'lodash/prefer-is-nil': 'error',
            'lodash/prefer-lodash-chain': 'error',
            'lodash/prefer-lodash-method': 'off',
            'lodash/prefer-lodash-typecheck': 'off',
            'lodash/prefer-matches': ['off', 3],
            'lodash/prefer-noop': 'off',
            'lodash/prefer-over-quantifier': 'warn',
            'lodash/prefer-some': 'off',
            'lodash/prefer-startswith': 'off',
            'lodash/prefer-times': 'off',

            // JsDoc
            'jsdoc/check-param-names': 'error',
            'jsdoc/check-tag-names': 'off',
            'jsdoc/check-types': 'off',
            'jsdoc/require-description-complete-sentence': 'off',
            'jsdoc/require-example': 'off',
            'jsdoc/require-hyphen-before-param-description': 'off',
            'jsdoc/require-param': 'error',
            'jsdoc/require-param-description': 'error',
            'jsdoc/require-param-type': 'error',
            'jsdoc/require-returns-description': 'off',
            'jsdoc/require-returns-type': 'error',

            // Security
            'security/detect-unsafe-regex': 'error',
            'security/detect-bidi-characters': 'error',
            'security/detect-buffer-noassert': 'error',
            'security/detect-child-process': 'error',
            'security/detect-disable-mustache-escape': 'error',
            'security/detect-eval-with-expression': 'error',
            'security/detect-new-buffer': 'error',
            'security/detect-no-csrf-before-method-override': 'error',
            'security/detect-non-literal-fs-filename': 'off',
            'security/detect-non-literal-regexp': 'error',
            'security/detect-non-literal-require': 'off',
            'security/detect-object-injection': 'off',
            'security/detect-possible-timing-attacks': 'error',
            'security/detect-pseudoRandomBytes': 'error'
        }
    },

    {
        files: ['test/**/*.js'],

        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.mocha,
                exec: true
            }
        },

        plugins: { mocha },

        rules: {
            // JSDoc
            'jsdoc/require-param-type': 'off',
            'jsdoc/require-param-description': 'off',

            // Mocha
            'mocha/consistent-interface': 'error',
            'mocha/consistent-spacing-between-blocks': 'error',
            // needs a per-project `checklist` of required blocks, which this suite does not define
            'mocha/consistent-structure': 'off',
            'mocha/handle-done-callback': 'error',
            // no test sets `this.retries()` or `this.slow()`, enabling either would only encode a policy
            'mocha/limit-retries': 'off',
            'mocha/limit-slow': 'off',
            'mocha/limit-timeout': ['error', { mode: 'max', max: 10000 }],
            'mocha/max-top-level-suites': 'error',
            'mocha/no-async-and-done': 'error',
            'mocha/no-async-in-sync-tests': 'error',
            'mocha/no-async-suite': 'error',
            'mocha/no-code-after-done': 'error',
            'mocha/no-conditional-tests': 'error',
            'mocha/no-done-twice': 'error',
            'mocha/no-empty-title': 'error',
            'mocha/no-exclusive-tests': 'error',
            'mocha/no-exports': 'error',
            'mocha/no-hooks-for-single-child': 'off',
            'mocha/no-hooks': 'off',
            'mocha/no-identical-title': 'error',
            'mocha/no-mocha-arrows': 'error',
            // this suite groups related cases under nested `describe`s throughout
            'mocha/no-nested-suites': 'off',
            'mocha/no-nested-tests': 'error',
            // this rule absorbed `no-skipped-tests`, and deliberate skips have always been allowed
            'mocha/no-pending-tests': 'off',
            'mocha/no-return-and-done': 'error',
            'mocha/no-return-from-async': 'error',
            'mocha/no-root-hooks': 'off',
            // fixture setup directly in a suite body is pervasive here, hoisting it into hooks buys nothing
            'mocha/no-setup-in-suite': 'off',
            'mocha/no-synchronous-tests': 'off',
            'mocha/no-top-level-tests': 'error',
            // conflicts with `no-mocha-arrows`, which this config enforces instead
            'mocha/prefer-arrow-callback': 'off',
            // both want a project-wide title pattern, which this suite does not define
            'mocha/valid-suite-title': 'off',
            'mocha/valid-test-title': 'off'
        }
    }
];
