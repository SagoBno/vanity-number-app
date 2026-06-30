module.exports = [
  {
    files: ['*.js'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    ignores: [
      '.aws-sam/**',
      'backend/.aws-sam/**',
      'backend/coverage/**',
      'backend/dist/**',
      'backend/node_modules/**',
      'backend/src/**',
      'backend/tests/**',
      'coverage/**',
      'dist/**',
      'frontend/**',
      'node_modules/**',
    ],
  },
];
