// Community photos background — cycles `assets/community-*` on hero sections and site-wide backdrop
(function () {
    const COMMUNITY_IMAGES = [
        'assets/community-bg.jpg',
        'assets/community-1.jpg',
        'assets/community-2.jpg',
        'assets/community-3.jpg',
        'assets/community-4.jpg',
        'assets/community-5.jpg',
        'assets/community-6.jpg',
        'assets/community-7.jpg',
        'assets/community-8.jpg',
        'assets/community-9.jpg',
        'assets/community-10.jpg'
    ];

    const ROTATE_MS = 9000;

    if (!COMMUNITY_IMAGES.length) return;

    COMMUNITY_IMAGES.forEach((src) => {
        const img = new Image();
        img.src = src;
    });

    function buildTwoLayerSlideshow() {
        const root = document.createElement('div');
        root.className = 'hero-slideshow';
        root.setAttribute('aria-hidden', 'true');

        const a = document.createElement('div');
        a.className = 'slide active';
        a.style.backgroundImage = `url('${COMMUNITY_IMAGES[0]}')`;

        const b = document.createElement('div');
        b.className = 'slide';
        b.style.backgroundImage = `url('${COMMUNITY_IMAGES[1 % COMMUNITY_IMAGES.length]}')`;

        root.append(a, b);
        return { root, layers: [a, b] };
    }

    function startRotation(root, layers) {
        let shownIndex = 0;
        let visibleLayer = 0;

        setInterval(() => {
            const nextIndex = (shownIndex + 1) % COMMUNITY_IMAGES.length;
            const hiddenLayer = 1 - visibleLayer;
            const nextUrl = COMMUNITY_IMAGES[nextIndex];

            layers[hiddenLayer].style.backgroundImage = `url('${nextUrl}')`;
            layers[visibleLayer].classList.remove('active');
            layers[hiddenLayer].classList.add('active');

            visibleLayer = hiddenLayer;
            shownIndex = nextIndex;
        }, ROTATE_MS);
    }

    function attachHeroSlideshow(hero) {
        if (hero.querySelector('.hero-slideshow')) return;
        const { root, layers } = buildTwoLayerSlideshow();
        hero.insertBefore(root, hero.firstChild);
        startRotation(root, layers);
    }

    function attachSiteBackdrop() {
        if (document.getElementById('community-site-backdrop')) return;

        document.documentElement.classList.add('has-community-site-backdrop');

        const wrap = document.createElement('div');
        wrap.id = 'community-site-backdrop';

        const { root, layers } = buildTwoLayerSlideshow();
        root.classList.add('community-site-backdrop__stage');

        const scrim = document.createElement('div');
        scrim.className = 'community-site-backdrop__scrim';

        wrap.append(root, scrim);
        document.body.insertBefore(wrap, document.body.firstChild);
        startRotation(root, layers);
    }

    const heroes = document.querySelectorAll('.hero');
    if (heroes.length) {
        heroes.forEach(attachHeroSlideshow);
    } else {
        attachSiteBackdrop();
    }
})();
