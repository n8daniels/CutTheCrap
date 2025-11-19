# Contributing to CutTheCrap

Thank you for your interest in contributing to CutTheCrap! 🎉

## ⚠️ Project Status

**This project is in ALPHA stage** and under active development. We're building in public and welcome early contributors, but please be aware:

- APIs may change between versions
- Features are being actively added and refined
- There may be bugs and incomplete functionality
- Documentation is evolving
- Breaking changes may occur (we'll document them)

**We appreciate your patience and contributions as we build this together!**

## 🚀 Quick Start for Contributors

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- API keys:
  - Congress.gov API key (required) - [Get one free](https://api.congress.gov/sign-up/)
  - GovInfo.gov API key (optional) - [Get one free](https://api.data.gov/signup/)

### Setup

1. **Fork the repository** on GitHub

2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/CutTheCrap.git
   cd CutTheCrap
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/n8daniels/CutTheCrap.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

6. **Start development server**:
   ```bash
   npm run dev
   ```

7. **Visit** http://localhost:3000

## 🤝 How to Contribute

### Reporting Bugs

Found a bug? Please [open an issue](https://github.com/n8daniels/CutTheCrap/issues/new) with:

- **Clear title** describing the issue
- **Steps to reproduce** the bug
- **Expected behavior** vs actual behavior
- **Environment** (OS, Node version, browser)
- **Screenshots** if applicable
- **Error messages** or logs

### Suggesting Features

Have an idea? We'd love to hear it! [Open an issue](https://github.com/n8daniels/CutTheCrap/issues/new) with:

- **Clear description** of the feature
- **Use case** - why would this be valuable?
- **Proposed solution** (if you have one)
- **Alternatives considered**

### Contributing Code

1. **Check existing issues** - avoid duplicate work
2. **Comment on the issue** you want to work on
3. **Create a branch** from main:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

4. **Make your changes**:
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

5. **Test your changes**:
   ```bash
   npm run dev  # Test locally
   npm run build  # Ensure it builds
   ```

6. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   # or
   git commit -m "fix: resolve nasty bug"
   ```

   **Commit message format**:
   - `feat: ` - New feature
   - `fix: ` - Bug fix
   - `docs: ` - Documentation changes
   - `style: ` - Code style changes (formatting)
   - `refactor: ` - Code refactoring
   - `test: ` - Adding tests
   - `chore: ` - Maintenance tasks

7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Open a Pull Request**:
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template
   - Link related issues

## 📝 Code Style

- **TypeScript** - Use TypeScript throughout
- **Formatting** - We'll add Prettier/ESLint soon
- **Naming**:
  - `camelCase` for variables and functions
  - `PascalCase` for components and classes
  - `UPPER_CASE` for constants
- **Comments** - Add comments for complex logic
- **Security** - Follow guidelines in `docs/security/`

## 🧪 Testing

- Test locally before submitting PR
- Ensure `npm run build` succeeds
- Check for TypeScript errors: `npm run type-check` (if available)
- Test with real API keys (dev keys, not prod!)

## 🔐 Security

- **Never commit API keys** or secrets
- Follow security guidelines in `docs/security/`
- Report security issues privately to [@n8daniels](https://github.com/n8daniels)

## 📚 Documentation

When adding features:
- Update README.md if needed
- Update relevant docs in `docs/`
- Add JSDoc comments to functions
- Update API documentation

## 🎯 Priority Areas

We especially need help with:

- 🐛 **Bug fixes** - Always appreciated
- 📝 **Documentation** - Make it clearer
- 🧪 **Testing** - Add test coverage
- ♿ **Accessibility** - Improve a11y
- 🎨 **UI/UX** - Make it beautiful
- 🚀 **Performance** - Make it faster
- 🔐 **Security** - Make it safer

## ❓ Questions?

- Open an issue with your question
- Check existing issues and discussions
- Reach out to [@n8daniels](https://github.com/n8daniels)

## 📜 Code of Conduct

Be respectful, inclusive, and professional. We're all here to build something great together.

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to CutTheCrap!** 🚀

Every contribution, no matter how small, makes a difference. We appreciate you being part of this journey.
