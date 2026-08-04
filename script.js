/* 
   Hearth and Heal - Interactions 
*/

document.addEventListener('DOMContentLoaded', () => {

    // Mobile Menu Toggle
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn && navLinks) {
        menuBtn.setAttribute('role', 'button');
        menuBtn.setAttribute('tabindex', '0');
        menuBtn.setAttribute('aria-label', 'Open navigation menu');
        menuBtn.setAttribute('aria-expanded', 'false');

        const closeMenu = () => {
            navLinks.classList.remove('active');
            menuBtn.setAttribute('aria-expanded', 'false');
            menuBtn.setAttribute('aria-label', 'Open navigation menu');
        };

        const toggleMenu = () => {
            const isOpen = navLinks.classList.toggle('active');
            menuBtn.setAttribute('aria-expanded', String(isOpen));
            menuBtn.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
        };

        menuBtn.addEventListener('click', toggleMenu);
        menuBtn.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleMenu();
            }
        });

        navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) closeMenu();
        });
    }

    const dropdownTriggers = document.querySelectorAll('.dropdown-trigger');
    dropdownTriggers.forEach(trigger => {
        const parentDropdown = trigger.closest('.nav-dropdown');
        trigger.addEventListener('click', (event) => {
            event.preventDefault();
            if (!parentDropdown) return;
            const isOpen = parentDropdown.classList.toggle('open');
            trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.nav-dropdown')) {
            document.querySelectorAll('.nav-dropdown.open').forEach(dropdown => {
                dropdown.classList.remove('open');
                const trigger = dropdown.querySelector('.dropdown-trigger');
                if (trigger) trigger.setAttribute('aria-expanded', 'false');
            });
        }
    });

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
