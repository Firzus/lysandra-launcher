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
- [React Router](https://reactrouter.com/) - Routing library for React

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

### Setup pnpm (optional)

If you are using `pnpm`, you need to add the following code to your `.npmrc` file:

```bash
public-hoist-pattern[]=*@heroui/*
```

After modifying the `.npmrc` file, you need to run `pnpm install` again to ensure that the dependencies are installed correctly.

## CI/CD with GitHub Actions

This project uses GitHub Actions to automate the build and release process across multiple platforms (Windows, macOS, and Linux). When a tag is pushed with the format `v*` (e.g., `v1.0.0`), or when manually triggered, GitHub Actions will build the application for all platforms and create a draft release.

### Automated Build Process

The workflow is configured in `.github/workflows/release.yml` and performs the following steps:

1. Checks out the repository
2. Installs platform-specific dependencies
3. Sets up Node.js and Rust
4. Installs frontend dependencies
5. Builds the application using Tauri
6. Creates a draft release with platform-specific installers

```yaml
name: Release
on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  release:
    strategy:
      fail-fast: false
      matrix:
        platform: [macos-latest, ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.platform }}
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install dependencies (ubuntu only)
        if: matrix.platform == 'ubuntu-latest'
        run: |
          sudo apt-get update
          sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install frontend dependencies
        run: npm install      - name: Build the app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'Lysandra Launcher v${{ github.ref_name }}'
          releaseBody: 'See the assets to download and install this version.'
          releaseDraft: true
          prerelease: false
```

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

```

```
