# Development Guide

This guide will help you set up the FitFuel application for local development and testing.

## Prerequisites

- Node.js 18 or later
- npm or yarn
- Supabase account
- Git

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/fitfuel.git
   cd fitfuel
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   - Update the values with your Supabase credentials

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Writing Tests

- Unit tests should be placed in the same directory as the component/utility they're testing with a `.test.ts` or `.test.tsx` extension.
- Integration tests should be placed in the `__tests__` directory.
- Mock external dependencies using Vitest's mocking capabilities.

## Linting and Formatting

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format

# Check formatting without making changes
npm run format:check
```

## Git Hooks

This project uses Husky to run Git hooks. The following hooks are configured:

- `pre-commit`: Runs lint-staged to format and lint staged files
- `pre-push`: Runs tests before pushing to remote

## Code Style

- Use TypeScript for type safety
- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Use functional components with hooks
- Prefer named exports over default exports
- Use absolute imports with the `@/` alias

## Commit Message Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Commit messages should follow this format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

## Pull Requests

1. Create a new branch for your feature or bugfix
2. Write tests for your changes
3. Ensure all tests pass
4. Update documentation if necessary
5. Submit a pull request with a clear description of the changes

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions.

## Troubleshooting

### Common Issues

- **TypeScript errors**: Run `npm run type-check` to identify and fix type errors
- **Test failures**: Check the test output for details on what went wrong
- **Build failures**: Ensure all dependencies are installed and environment variables are set correctly

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
