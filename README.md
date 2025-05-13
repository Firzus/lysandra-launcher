# Lysandra Launcher

A modern cross-platform desktop application built with Tauri 2.0, Vite, React, and HeroUI.

## Technologies Used

### Frontend

- [Vite](https://vitejs.dev/guide/) - Next Generation Frontend Tooling
- [React 18](https://react.dev/) - JavaScript library for building user interfaces
- [HeroUI v2](https://heroui.com) - Modern UI components built on React
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Tailwind Variants](https://tailwind-variants.org) - Type-safe variants for Tailwind CSS
- [TypeScript](https://www.typescriptlang.org) - Typed JavaScript
- [Framer Motion](https://www.framer.com/motion) - Animation library for React

### Desktop App Framework

- [Tauri 2.0](https://tauri.app/) - Framework for building secure, lightweight, and cross-platform desktop apps
  - Smaller binaries compared to Electron
  - Native system dialogs and notifications
  - System tray support
  - Auto-updates
  - Deep OS integration

### Backend

- [Rust](https://www.rust-lang.org/) - Fast and memory-efficient systems programming language
  - Powers the Tauri core functionality
  - Provides native performance for critical operations

## How to Use

To clone the project, run the following command:

```bash
git clone https://github.com/frontio-ai/vite-template.git
```

### Install dependencies

You can use one of them `npm`, `yarn`, `pnpm`, `bun`. Example using `npm`:

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Run Tauri commands

```bash
# Development with hot-reload
npm run tauri dev

# Build for production
npm run tauri build

# Build for a specific target platform
npm run tauri build -- --target universal-apple-darwin  # macOS Universal
npm run tauri build -- --target x86_64-pc-windows-msvc  # Windows x64
npm run tauri build -- --target x86_64-unknown-linux-gnu  # Linux x64
```

## CI/CD with GitHub Actions

This project uses GitHub Actions to automate the build and release process across multiple platforms (Windows, macOS, and Linux). When a tag is pushed with the format `v*` (e.g., `v1.0.0`), or when manually triggered, GitHub Actions will build the application for all platforms and create a draft release.

### Automated Build Process

The `.github/workflows/release.yml` workflow automates building the application for Windows, macOS, and Linux, and creates a draft release on GitHub when a `v*` tag is pushed or the workflow is manually dispatched.

### Creating a Release

To create a new release:

1. Update the version in `package.json` and `src-tauri/tauri.conf.json`
2. Create and push a new tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
3. GitHub Actions will automatically build the application and create a draft release
4. Review and publish the draft release on GitHub

## License

Licensed under the [MIT license](https://github.com/frontio-ai/vite-template/blob/main/LICENSE).
