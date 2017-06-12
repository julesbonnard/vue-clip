module.exports = {
    plugins: ['html'],
    parser: 'babel-eslint',
    parserOptions: {
        sourceType: 'module'
    },
    globals: {
        describe: true,
        it: true,
        beforeEach: true,
        before: true
    },
    extends: 'standard',
    rules: {
        'arrow-parens': 0,
        'indent': ["error", 4, { SwitchCase: 1 }],
        'space-before-function-paren': ["error", {
            anonymous: 'ignore',
            named: 'never',
            asyncArrow: 'ignore',
        }],
        'generator-star-spacing': 0
    }
}
