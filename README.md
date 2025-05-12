# Lysandra Launcher

A cross-platform desktop application built with Tauri 2.0, Vite, and HeroUI (v2).

## Technologies Used

### Frontend

- [Vite](https://vitejs.dev/guide/) - Next Generation Frontend Tooling
- [React](https://react.dev/) - JavaScript library for building user interfaces
- [HeroUI](https://heroui.com) - Modern UI components built on React
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [Tailwind Variants](https://tailwind-variants.org) - Type-safe variants for Tailwind CSS
- [TypeScript](https://www.typescriptlang.org) - Typed JavaScript
- [Framer Motion](https://www.framer.com/motion) - Animation library for React
- [React Router](https://reactrouter.com/) - Routing library for React

### Backend

- [Tauri 2.0](https://tauri.app/) - Framework for building desktop apps with web technologies
- [Rust](https://www.rust-lang.org/) - Systems programming language

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
```

### Setup pnpm (optional)

If you are using `pnpm`, you need to add the following code to your `.npmrc` file:

```bash
public-hoist-pattern[]=*@heroui/*
```

After modifying the `.npmrc` file, you need to run `pnpm install` again to ensure that the dependencies are installed correctly.

## GitHub Actions Automated Build

This project uses GitHub Actions to automate the build process across multiple platforms (Windows, macOS, and Linux). To set up the GitHub Actions workflow, create a file at `.github/workflows/release.yml` with the following content:

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
        platform: [macos-latest, ubuntu-20.04, windows-latest]
    runs-on: ${{ matrix.platform }}
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install dependencies (ubuntu only)
        if: matrix.platform == 'ubuntu-20.04'
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
        run: npm install

      - name: Build the app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'Lysandra Launcher v${{ github.ref_name }}'
          releaseBody: 'See the assets to download and install this version.'
          releaseDraft: true
          prerelease: false

## License

Licensed under the [MIT license](https://github.com/frontio-ai/vite-template/blob/main/LICENSE).
```
