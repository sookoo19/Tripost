import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";
import pluginPrettier from "eslint-plugin-prettier";

export default [
  prettier, // eslint-config-prettierを適用
  {
    ignores: [
      "node_modules/**",
      "public/**",
      "vendor/**",
      "storage/**",
      "bootstrap/cache/**",
      "**/*.min.js",
      "vite.config.js",
      "tailwind.config.js",
      "postcss.config.js"
    ]
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        route: "readonly",
        Ziggy: "readonly",
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "jsx-a11y": pluginJsxA11y,
      prettier: pluginPrettier,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,

      // React設定
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/jsx-uses-react": "off",
      "react/display-name": "off",

      // Prettier設定
      "prettier/prettier": ["error", {
        "singleQuote": true,
        "trailingComma": "es5",
        "tabWidth": 2,
        "semi": true
      }],

      // 緩和されたルール
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/label-has-associated-control": "warn",
      "jsx-a11y/alt-text": "warn",
      "react/no-unescaped-entities": "warn",

      // 一般的なルール
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-console": "warn",
      "prefer-const": "error",
      "no-var": "error",
      "react/jsx-filename-extension": [1, { "extensions": [".jsx", ".js"] }],
      "react/jsx-props-no-spreading": "off",
      "jsx-a11y/anchor-is-valid": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    files: ["resources/js/Pages/**/*.{js,jsx}"],
    rules: {
      "react/jsx-filename-extension": "off",
      "import/prefer-default-export": "off",
    },
  },
];