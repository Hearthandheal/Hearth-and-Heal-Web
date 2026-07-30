/* 
   Hearth and Heal - Interactions 
*/

function makePlaceholderImage(label) {
    const safeLabel = String(label || 'Image').slice(0, 28).replace(/[<>"']/g, '');
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
            <rect width="100%" height="100%" fill="#0f172a"/>
            <rect x="24" y="24" width="752" height="452" rx="28" fill="#111827" stroke="#00E676" stroke-width="3"/>
            <circle cx="400" cy="210" r="100" fill="#1f2937"/>
            <path d="M318 280c18-52 60-80 82-80s64 28 82 80" fill="#00E676" opacity="0.75"/>
            <rect x="180" y="352" width="440" height="40" rx="20" fill="#00E676" opacity="0.2"/>
            <text x="400" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#f9fafb">${safeLabel}</text>
        </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function attachImageFallback(img) {
    if (!img || img.dataset.fallbackAttached === 'true') return;
    img.dataset.fallbackAttached = 'true';
    img.addEventListener('error', () => {
        const fallbackSrc = makePlaceholderImage(img.getAttribute('alt') || img.getAttribute('title') || 'Image');
        if (img.getAttribute('src') !== fallbackSrc) {
            img.setAttribute('src', fallbackSrc);
            img.removeAttribute('onerror');
        }
    }, { once: true });
}

document.addEventListener('DOMContentLoaded', () => {

    // Mobile Menu Toggle
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');

            // Icon toggle logic if using feather icons
            const icon = navLinks.classList.contains('active') ? 'x' : 'menu';
            // Simple re-render of feather icon if needed, or just visual toggle
            // For now, simple class toggle is enough for the CSS to handle display
        });
    }

    // Smooth Scrolling for Anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            // Close mobile menu if open
            if (navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Intersection Observer for Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));

    document.querySelectorAll('img').forEach(attachImageFallback);

    // Parallax Effect
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;

        // Parallax for Hero Background/Elements
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.style.transform = `translateY(${scrolled * 0.4}px)`;
            heroContent.style.opacity = 1 - (scrolled / 700);
        }

        // Parallax for any element with .parallax class
        document.querySelectorAll('.parallax').forEach(el => {
            const speed = el.getAttribute('data-speed') || 0.5;
            el.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
});
