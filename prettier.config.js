//  @ts-check

/** @type {import('prettier').Config} */
const config = {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 88,
  tabWidth: 2,
  bracketSpacing: true,
  jsxSingleQuote: false,
  bracketSameLine: false,
  plugins: ['prettier-plugin-tailwindcss'],
};

export default config;
