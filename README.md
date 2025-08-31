# Totan Dhibar - Portfolio Website

[![Deploy to GitHub Pages](https://github.com/TotanDhibar/TotanDhibar/actions/workflows/static.yml/badge.svg)](https://github.com/TotanDhibar/TotanDhibar/actions/workflows/static.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Website](https://img.shields.io/website?url=https%3A%2F%2FTotanDhibar.github.io%2FTotanDhibar%2F)](https://TotanDhibar.github.io/TotanDhibar/)

A modern, responsive portfolio website showcasing my skills, projects, and professional journey as a software developer and designer.

## 🌐 Live Demo

Visit the live website: **[https://TotanDhibar.github.io/TotanDhibar/](https://TotanDhibar.github.io/TotanDhibar/)**

## ✨ Features

### 🎨 Design & User Experience
- **Modern, Clean Aesthetic** - Professional design with carefully crafted color schemes
- **Responsive Design** - Mobile-first approach ensuring perfect display on all devices
- **Dark/Light Theme Toggle** - User preference-based theme switching with system preference detection
- **Smooth Animations** - Elegant transitions and micro-interactions throughout the site
- **Accessibility Focused** - WCAG compliant design with keyboard navigation and screen reader support

### 🚀 Technical Features
- **Vanilla JavaScript** - No framework dependencies for optimal performance
- **Modern CSS** - CSS Grid, Flexbox, custom properties, and advanced animations
- **Progressive Web App Ready** - Service worker support for offline capabilities
- **SEO Optimized** - Proper meta tags, semantic HTML, and search engine friendly structure
- **Performance Optimized** - Lazy loading, optimized assets, and efficient code splitting

### 📱 Interactive Components
- **Animated Hero Section** - Dynamic typing animation and floating elements
- **Smooth Scroll Navigation** - Seamless scrolling between sections with active link highlighting
- **Project Showcase** - Interactive project cards with hover effects and technology tags
- **Contact Form** - Functional contact form with validation and user feedback
- **Mobile Navigation** - Hamburger menu with smooth animations for mobile devices

## 🏗️ Project Structure

```
TotanDhibar/
├── index.html              # Main HTML file with semantic structure
├── style.css               # Comprehensive CSS with modern styling
├── script.js               # Interactive JavaScript functionality
├── README.md               # Project documentation
├── .github/
│   └── workflows/
│       └── static.yml      # GitHub Actions deployment workflow
└── assets/                 # (Future) Static assets like images
```

## 🛠️ Technologies Used

### Frontend
- **HTML5** - Semantic markup with accessibility in mind
- **CSS3** - Modern styling with custom properties, Grid, and Flexbox
- **JavaScript ES6+** - Modern JavaScript with classes and modules
- **Font Awesome** - Icon library for consistent iconography
- **Google Fonts** - Typography with Inter and JetBrains Mono fonts

### Development & Deployment
- **GitHub Pages** - Static site hosting
- **GitHub Actions** - Automated CI/CD pipeline
- **Git** - Version control
- **VS Code** - Development environment

## 🚀 Quick Start

### Prerequisites
- Web browser (Chrome, Firefox, Safari, Edge)
- Git (for cloning)
- Text editor (VS Code recommended)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/TotanDhibar/TotanDhibar.git
   cd TotanDhibar
   ```

2. **Open in your browser**
   ```bash
   # Option 1: Direct file opening
   open index.html
   
   # Option 2: Using Python's built-in server
   python -m http.server 8000
   # Then visit http://localhost:8000
   
   # Option 3: Using Node.js serve package
   npx serve .
   ```

3. **Start developing**
   - Edit `index.html` for content changes
   - Modify `style.css` for styling updates
   - Update `script.js` for functionality enhancements

### Deployment

The website automatically deploys to GitHub Pages when changes are pushed to the main branch, thanks to the GitHub Actions workflow.

#### Manual Deployment Steps:
1. Push changes to the main branch
2. GitHub Actions will automatically build and deploy
3. Visit `https://YourUsername.github.io/YourUsername/` to see changes

## 📁 File Descriptions

### `index.html`
- **Purpose**: Main HTML file containing the complete website structure
- **Features**: Semantic HTML5, meta tags for SEO, accessibility attributes
- **Sections**: Navigation, Hero, About, Projects, Contact, Footer

### `style.css`
- **Purpose**: Complete styling for the website
- **Features**: CSS custom properties, responsive design, animations, dark/light themes
- **Organization**: Organized by components with clear commenting

### `script.js`
- **Purpose**: Interactive functionality and user experience enhancements
- **Features**: Theme management, navigation, animations, form handling, accessibility
- **Architecture**: Modular class-based structure for maintainability

### `.github/workflows/static.yml`
- **Purpose**: Automated deployment to GitHub Pages
- **Features**: Triggers on push to main, builds and deploys static content
- **Configuration**: Optimized for static sites with proper permissions

## 🎨 Customization Guide

### Changing Colors
Edit the CSS custom properties in `style.css`:

```css
:root {
  --color-primary: #6366f1;        /* Primary brand color */
  --color-secondary: #06b6d4;      /* Secondary accent color */
  --color-accent: #ec4899;         /* Accent color for highlights */
  /* ... more color variables */
}
```

### Adding New Sections
1. Add HTML structure in `index.html`
2. Add corresponding styles in `style.css`
3. Update navigation links
4. Add any required JavaScript functionality

### Modifying Content
- **Personal Information**: Update the hero section and about section
- **Projects**: Modify the projects grid with your own work
- **Contact Information**: Update contact details and social links
- **Skills**: Edit the skills section with your technologies

### Theme Customization
The website supports both light and dark themes. Customize theme colors by modifying the CSS custom properties under `[data-theme="dark"]` selector.

## 📱 Browser Support

- **Chrome** 88+
- **Firefox** 85+
- **Safari** 14+
- **Edge** 88+

## ♿ Accessibility Features

- **Keyboard Navigation** - Full keyboard accessibility
- **Screen Reader Support** - Proper ARIA labels and semantic HTML
- **Color Contrast** - WCAG AA compliant color ratios
- **Motion Preferences** - Respects `prefers-reduced-motion`
- **Focus Management** - Clear focus indicators and logical tab order

## 🔧 Performance Optimizations

- **Lazy Loading** - Images and non-critical content load on demand
- **Efficient CSS** - Optimized selectors and minimal reflows
- **JavaScript Optimization** - Debounced scroll events and efficient DOM manipulation
- **Font Loading** - Optimized web font loading strategies
- **Minimal Dependencies** - Vanilla JavaScript reduces bundle size

## 📈 SEO Features

- **Meta Tags** - Comprehensive meta tags for search engines
- **Open Graph** - Social media sharing optimization
- **Semantic HTML** - Proper heading hierarchy and semantic elements
- **Fast Loading** - Optimized performance for better search rankings
- **Mobile-Friendly** - Responsive design for mobile search optimization

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines
1. Follow existing code style and conventions
2. Test changes across different browsers and devices
3. Ensure accessibility standards are maintained
4. Update documentation for significant changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 About Me

Hi! I'm Totan Dhibar, a passionate software developer and designer who loves creating innovative digital experiences. This portfolio represents my skills in modern web development and design.

### Connect with Me
- **GitHub**: [@TotanDhibar](https://github.com/TotanDhibar)
- **LinkedIn**: [Totan Dhibar](https://linkedin.com/in/totandhibar)
- **Twitter**: [@TotanDhibar](https://twitter.com/totandhibar)
- **Email**: totan.dhibar@example.com

### Skills & Interests
- 🌱 Currently learning advanced React patterns and cloud technologies
- 👀 Interested in AI/ML, blockchain, and modern web technologies
- 💞️ Looking to collaborate on open-source projects and innovative startups
- ⚡ Fun fact: I enjoy solving coding challenges and contributing to the developer community

---

**Built with ❤️ using HTML, CSS, and JavaScript**