# SolarSizer — Projet REB GPL

**SolarSizer** is a professional solar photovoltaic and battery sizing web application designed for Sonatrach REB GPL Line off-grid stations. It helps engineers and technicians calculate optimal solar panel and battery configurations based on specific energy requirements.

![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-blue.svg)
![Version](https://img.shields.io/badge/Version-1.0.0-green.svg)

---

## ✨ Features

- **Solar Panel Sizing** — Calculate the required number of solar panels based on energy consumption and location
- **Battery Storage Sizing** — Determine optimal battery capacity for backup power
- **Energy Consumption Analysis** — Input daily/nightly energy needs in kWh
- **Interactive Results** — Visual charts and detailed breakdown of calculations
- **Export Options** — Download reports in PDF and Excel formats
- **Dark/Light Mode** — Built-in theme support for comfortable viewing
- **PWA Support** — Installable as a native app on mobile and desktop
- **Offline Capable** — Works without internet connection once loaded

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** — Version 20.x or later
- **pnpm** — Recommended package manager (v8+)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd reb-gpl-pv

# Install dependencies
pnpm install
```

### Development

```bash
# Start development server
pnpm dev
```

The application will be available at `http://localhost:5173`.

### Build for Production

```bash
# Build the application
pnpm build
```

Output will be in the `dist` directory.

### Preview Production Build

```bash
pnpm preview
```

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-------------|
| **Framework** | React 19 + Vite 7 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 |
| **UI Components** | Radix UI |
| **Charts** | Recharts |
| **PDF Generation** | jsPDF + jsPDF-AutoTable |
| **Excel Export** | SheetJS (xlsx) |
| **Backend** | Convex |
| **Authentication** | OIDC (OpenID Connect) |
| **Deployment** | Vercel |

---

## 📋 Project Structure

```
reb-gpl-pv/
├── public/
│   ├── datasheets/      # PV module datasheets
│   └── icon/            # PWA icons
├── src/
│   ├── components/      # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/              # Utility functions
│   └── pages/           # Page components
├── convex/              # Convex backend functions
├── index.html          # Entry HTML
├── vite.config.ts       # Vite configuration
└── package.json        # Dependencies
```

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**.

See the [LICENSE](LICENSE) file for more details.

---

## 👤 Author

**Mohamed ADDA** — Lead Developer

- GitHub: [@adda](https://github.com/adda)
- Email: mohamed.adda@sonatrach.dz

---

## 🙏 Acknowledgments

- **Sonatrach** — For the REB GPL Line project opportunity
- **Open Source Community** — For the amazing tools and libraries used in this project

---

## 📱 PWA Installation

This application is a Progressive Web App (PWA). To install it:

1. Open the application in a modern browser (Chrome, Edge, Firefox, Safari)
2. Look for the install icon in the address bar
3. Click "Install" to add it to your home screen or desktop

The app works offline and can be installed on:

- **Desktop**: Chrome, Edge, Firefox
- **Android**: Chrome, Samsung Internet
- **iOS**: Safari (iPhone/iPad)

---

*Made with ⚡ for Sonatrach REB GPL Line*