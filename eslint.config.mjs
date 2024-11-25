import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist', 'public'] },
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
];
