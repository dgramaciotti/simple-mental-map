# Simple Mental Map

A lightweight, browser-based mental mapping tool built with Vite, TypeScript, and Markmap. Everything is stored at the browser localStorage.

## Features
- **Drag & Drop**: Reorganize nodes by dragging them to new parents.
- **Inline Editing**: Double-click any node to rename it instantly.
- **Multi-Map Support**: Create, rename, and switch between multiple maps.
- **Persistence**: Maps are automatically saved to your browser's `localStorage`.
- **Export**: Allows exporting to txt, md, svg and opml.
- **Custom Design**: Adjust font size, branch thickness, and spacing via the settings panel.

## Getting Started

### Prerequisites
- Node.js (v24.12+ recommended)
- npm

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development
Start the development server:
```bash
npm run dev
```

### Build & Test
Run tests:
```bash
npx vitest --run
```

Build for production:
```bash
npm run build
```

## Deployment
This project is configured for GitHub Pages via GitHub Actions. Push to the `main` branch to trigger a deployment. The build output is located in the `dist` directory.

## License
MIT © 2026 Daniel Guedes
