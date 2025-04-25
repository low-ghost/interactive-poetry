# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x';
import reactDom from 'eslint-plugin-react-dom';

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
});
```

## GitHub Pages Deployment

This project is configured for deployment to GitHub Pages. You can deploy either manually or using GitHub Actions.

### Manual Deployment

To manually deploy the project:

1. Make sure to update the `homepage` field in `package.json` with your GitHub username:

   ```json
   "homepage": "https://[your-github-username].github.io/interactive-poetry"
   ```

2. Run the deploy script:
   ```bash
   npm run deploy
   ```

This will build the project and push it to the `gh-pages` branch of your repository.

### Automatic Deployment with GitHub Actions

The project includes a GitHub Actions workflow that automatically deploys the site to GitHub Pages whenever changes are pushed to the `main` branch.

To set up automatic deployment:

1. Make sure your repository has GitHub Pages enabled in repository settings:

   - Go to your repository on GitHub
   - Navigate to Settings > Pages
   - Set the source to "GitHub Actions"

2. Push your code to the `main` branch, and the workflow will automatically build and deploy your site.

Note: The first time you deploy, it may take a few minutes for your site to become available at the URL.
