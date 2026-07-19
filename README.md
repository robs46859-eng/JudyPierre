# JudyPierre

A React and Three.js application powered by Google Generative AI.

## Features

- Interactive 3D graphics using Three.js and React Three Fiber
- AI-powered features via Google Gemini API
- Vite for fast development and build
- Express server for backend integration

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or bun
- Google Gemini API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production

```bash
npm run build
```

### Starting the Production Server

```bash
npm start
```

## Project Structure

- `src/` - Source code
- `server.ts` - Express server entry point
- `index.html` - Main HTML file
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration

## License

MIT