# Exposition - A Photo Anthology

A minimalist, elegant portfolio website showcasing analog photography collections from travels around the world. Features smooth scroll-based animations, interactive galleries, and a luxurious design aesthetic.

## Overview

This is a personal photography portfolio website featuring **10 albums** with **218 analog photographs** captured during travels across different continents. All photos were shot on film cameras, starting with a Zenit camera inherited from the photographer's grandfather in 2021.

## Features

### Core Functionality
- **Modern, Minimalist Design** - Clean layout with elegant color palette focused on photography
- **Smooth Scroll Animations** - GSAP ScrollTrigger powered animations for immersive experience
- **Interactive Lightbox** - Full-screen photo viewing with click-to-enlarge functionality on all albums
- **Responsive Design** - Works beautifully on all devices and screen sizes
- **Analog Photography Focus** - All photos shot on film cameras

### Navigation & UI
- **Sticky Navigation Bar** - Appears on scroll with links to About and Menu
- **Menu Modal** - Grid-based navigation to all 10 albums
- **About Modal** - Personal story about the photography journey
- **Album Preview Section** - Hover effects showing album previews
- **Smooth Scrolling** - Anchor-based navigation with smooth transitions

### Gallery Styles
Each album features a unique presentation style:

1. **Scroll-based Horizontal Galleries** (Paris, Europe)
   - Horizontal scrolling triggered by vertical scroll
   - Parallax text effects
   - Click-to-enlarge lightbox functionality
   - Photos slide in from different directions (Paris: right, Europe: left)

2. **Traditional Grid Galleries** (Iceland, Asia, Balkans, Philippines)
   - Classic grid layout
   - Click-to-enlarge lightbox
   - Responsive grid that adapts to screen size

3. **Switch Gallery** (Chicago)
   - Split-screen layout with two halves
   - Auto-advancing frames (changes every 3 seconds)
   - Pause on hover
   - Click to advance manually

4. **Reveal Gallery** (Asia)
   - Initial click reveals all photos
   - Second click on photo opens lightbox
   - Overlay reveal animation

5. **Sticky Split Layout** (Korea)
   - Left column: scrollable content grid
   - Right column: sticky visual panel with title and stamp
   - Parallax footer section

6. **Exploding Grid** (Maroko)
   - Collapsed grid that expands on click
   - Fullscreen view for individual photos
   - Interactive thumbnail navigation

7. **Horizontal Scrolling Gallery** (Namibia)
   - Multi-panel horizontal scrolling
   - Luxury color palette (white, ecru, light gray, deep black)
   - Sticky container with smooth scrolling
   - Panel-based layout with intro sections

## Structure

### Main Sections

1. **Home Section** (`#home`)
   - Main photos grid (18 photos from "random photos" folder)
   - Intro text below photos with photographer information
   - Sticky navigation bar

2. **Menu Section** (`#menu`)
   - Albums preview with hover effects
   - Menu modal with grid of all albums

3. **About Modal** (`#about-modal`)
   - Personal story about the photography journey
   - Accessible via navigation bar

4. **Album Sections** (10 chapters)
   - Each album has unique ID and styling
   - Postage stamp badges in top-right corner
   - Album-specific descriptions and metadata

5. **Footer Section**
   - Image with overlay text
   - Project metadata (10 Chapters / 218 Images)
   - Inspiration credit and motivational message

### Lightbox System
- Full-screen photo viewing
- Click any photo in any album to enlarge
- Close with X button, backdrop click, or Escape key
- Supports gallery navigation (where applicable)
- Caption display

## Albums (10 Chapters / 218 Images)

1. **Paris** (6 photos) - `#people`
   - Scroll-based horizontal gallery
   - White background
   - Description: "Moments captured in the streets of Paris, where light and shadow tell stories of everyday life."

2. **Europe** (16 photos) - `#europe`
   - Scroll-based horizontal gallery
   - Ecru (cream) background
   - Description: "A journey across the continent, capturing moments of light, architecture, and the quiet beauty of everyday life."

3. **Iceland** (29 photos) - `#iceland`
   - Traditional grid gallery
   - Postage stamp badge

4. **Chicago** (13 photos) - `#lighthouse`
   - Switch gallery (split-screen, auto-advancing)
   - Date: September 2017
   - Description: Story about meeting João in Portugal

5. **Asia** (18 photos) - `#after-sun`
   - Reveal gallery (click to reveal, then click to enlarge)
   - Date: June 2024
   - Description: About presence and silence in photographs

6. **Korea** (22 photos) - `#hidden-tides`
   - Sticky split layout
   - Date: August 2018
   - Description: "Four years of studying design were finally coming to an end..."

7. **Balkans** (27 photos) - `#dead-sea`
   - Traditional grid gallery
   - Date: August 2019
   - Description: Story about the Dead Sea and introducing someone you love to a special place

8. **Philippines** (15 photos) - `#closing`
   - Traditional grid gallery
   - Description: "I chose to live by the sea. The pull toward that endless horizon..."

9. **Maroko** (23 photos) - `#horizon`
   - Exploding grid layout
   - Interactive thumbnail navigation

10. **Namibia** (30 photos) - `#horizontal-gallery-section`
    - Multi-panel horizontal scrolling gallery
    - Luxury color palette
    - Panel-based layout with intro sections

## Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with:
  - CSS variables for theming
  - Flexbox and Grid layouts
  - Custom animations and transitions
  - Responsive design patterns
- **JavaScript (ES6+)** - Interactive functionality:
  - Event handling
  - Dynamic content generation
  - Image optimization
  - Gallery initialization
- **GSAP (GreenSock)** - ScrollTrigger plugin for scroll-based animations
- **Space Grotesk Font** - Google Fonts
- **Vercel Analytics** - Web analytics integration
- **Vercel Speed Insights** - Performance monitoring

## File Structure

```
Portfolio/
├── index.html              # Main HTML file
├── styles.css              # All styles, animations, and responsive design
├── script.js               # JavaScript functionality and gallery initialization
├── README.md               # This file
├── package.json            # Project dependencies (if any)
│
├── paris/                  # Paris album photos (6 images)
├── europe/                 # Europe album photos (16 images)
├── iceland/                # Iceland album photos (29 images)
├── chicago/                # Chicago album photos (13 images)
├── asia/                   # Asia album photos (18 images)
├── korea/                  # Korea album photos (22 images)
├── balkans/                # Balkans album photos (27 images)
├── philippines/            # Philippines album photos (15 images)
├── maroko/                 # Maroko album photos (23 images)
├── namibia/                # Namibia album photos (30 images)
│
├── poststamp/              # Postage stamp images for album badges
│   ├── istockphoto-172179685-612x612.png (Paris)
│   ├── european-union-flag-png-post-stamp-sticker-transparent-background_53876-960018.avif (Europe)
│   ├── iceland-circa-stamp-printed-iceland-shows-herdubreid-volcano-iceland-circa-iceland-postage-stamp-143089282 copy.png (Iceland)
│   ├── 18105_source_1747681148.png (Chicago)
│   ├── image 135.png (Asia)
│   ├── bg,f8f8f8-flat,750x,075,f-pad,750x1000,f8f8f8.png (Korea)
│   ├── UvKE__U4WUybZow2Cno-ijGZU1Yy6wsGQt0p7kDYcqY copy.png (Balkans)
│   ├── istockphoto-184605060-612x612.png (Philippines)
│   └── st,small,507x507-pad,600x600,f8f8f8.png (Maroko)
│
├── random photos/          # Photos for main grid (18 images)
└── Gemini_Generated_Image_8lvyk68lvyk68lvy (1).png  # Menu icon
```

## Key JavaScript Functions

### Gallery Initialization
- `initPeopleScrollAlbum()` - Paris horizontal scroll gallery
- `initEuropeScrollAlbum()` - Europe horizontal scroll gallery
- `initSwitchGallery()` - Chicago split-screen gallery
- `initAfterSunGallery()` - Asia reveal gallery
- `initHiddenTidesAlbum()` - Korea sticky split layout
- `initExplodingGrid()` - Maroko exploding grid
- `initHorizontalGallery()` - Namibia horizontal scrolling
- `initProjectGallery()` - Traditional grid galleries (Iceland, Balkans, Philippines)

### Lightbox System
- `initLightbox()` - Initializes lightbox with click handlers
- `window.openLightbox()` - Opens lightbox with photo and optional gallery navigation

### Utility Functions
- `waitForImages()` - Waits for images to load before initialization
- `optimizeImage()` - Image compression and optimization
- `debounce()` - Performance optimization for resize events
- `killScrollTriggers()` - Cleanup for GSAP ScrollTrigger instances

## Design Philosophy

The website uses an elegant, luxurious color palette inspired by high-end photo albums:

### Color Scheme
- **Clean Whites** (`#FFFFFF`) - Primary backgrounds for Paris and other albums
- **Cream/Ecru** (`#F5F5DC`) - Background for Europe album
- **Dark Graphite** - Text and contrast elements
- **Deep Black** - Accent and contrast (Namibia panels)
- **Light Gray** - Secondary backgrounds (Namibia panels)
- **Gold and Silver Accents** - Subtle luxury touches

### Typography
- **Space Grotesk** - Primary font family (Google Fonts)
- Font weights: 300 (light), 400 (regular), 500 (medium), 700 (bold)
- Minimalist typography focused on readability

### Layout Principles
- Focus on letting photographs "pop" against clean backgrounds
- Generous white space
- Smooth, cinematic scroll animations
- Each album has unique visual identity while maintaining overall coherence

## Usage

### Local Development
1. Clone or download this repository
2. Open `index.html` in a web browser
3. All assets (images, fonts) are included locally
4. No build process required

### Deployment
The site is designed to work as a static website and can be deployed to:
- Vercel (includes analytics and speed insights)
- Netlify
- GitHub Pages
- Any static hosting service

## Browser Support

Modern browsers that support:
- ES6+ JavaScript
- CSS Grid and Flexbox
- CSS Custom Properties (variables)
- GSAP ScrollTrigger
- Modern JavaScript APIs (requestIdleCallback, etc.)

Recommended browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## Performance Features

- **Image Optimization** - Automatic compression and resizing
- **Lazy Loading** - Images load as needed
- **Debounced Events** - Optimized resize handlers
- **ScrollTrigger Optimization** - Efficient GSAP animations
- **Vercel Speed Insights** - Performance monitoring
- **Image Caching** - Optimized image cache system

## Interactive Features

### Click Interactions
- **All Albums** - Click photos to open in lightbox
- **Paris & Europe** - Click photos in horizontal galleries to enlarge
- **Chicago** - Click to advance frames manually
- **Asia** - First click reveals all, second click opens lightbox
- **Maroko** - Click grid to expand, click thumbnails for fullscreen
- **Menu** - Click album items to navigate
- **Lightbox** - Click backdrop, X button, or press Escape to close

### Hover Effects
- Album preview images on hover in menu section
- Chicago gallery pauses auto-advance on hover
- Navigation links have hover states

### Scroll Interactions
- GSAP ScrollTrigger animations for Paris and Europe
- Parallax effects on text and images
- Sticky navigation bar appears on scroll
- Smooth scroll behavior for anchor links

## Notes

- All photos are actual analog photography, not placeholders
- Images are organized by album in separate folders
- The site is designed to work offline (all assets are local)
- ScrollTrigger animations require JavaScript to be enabled
- Some features may have reduced functionality on very old browsers
- Image optimization happens in the browser for performance

## Author

**Mikołaj Paweł Sapek**

A photo anthology / 10 Chapters / 218 Images

> "In 2021, I pulled my grandfather's old Zenit camera from the closet. The effects, you could say, are below."

## Inspiration

This website is inspired by "Body of Water" website on Wix Studio.

> "Remember to pursue your dream."

## License

All photographs and website content © Mikołaj Paweł Sapek. All rights reserved.
