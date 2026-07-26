import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  { ignores: [
    'dist/', 
    'node_modules/', 
    'backend/', 
    'functions/', 
    'build/', 
    'scratch/', 
    '*.bundle', 
    '*.log', 
    '.graphify*/', 
    '.playwright-mcp/', 
    '.kilocode/', 
    'lint_errors*.txt',
    'eslint_report.txt',
    '*.mjs',
    '*.cjs',
    'android/',
    'ios/',
    'public/'
  ] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        alert: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        history: 'readonly',
        Image: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        URL: 'readonly',
        JSX: 'readonly'
      }
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      'no-case-declarations': 'off',
      'no-useless-assignment': 'off',
      'no-empty': 'warn',
      'no-prototype-builtins': 'warn',
      'no-unsafe-finally': 'warn',
      'no-unexpected-multiline': 'off',
      'no-cond-assign': 'warn',
      'getter-return': 'warn',
      'no-useless-escape': 'off',
      'prefer-const': 'warn'
    }
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': 'off'
    }
  }
);
