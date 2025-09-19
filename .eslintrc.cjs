module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    // Prettier integration
    'prettier/prettier': 'error',

    // General rules
    'no-console': 'off', // Allow console for CLI tool
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
  },
  overrides: [
    {
      files: ['tests/**/*'],
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
      },
    },
  ],
};