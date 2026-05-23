// ============================================
// SMOOTH SCROLL NAVIGATION
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ============================================
// SCROLL ANIMATIONS - OBSERVE & TRIGGER
// ============================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Apply to elements that should animate on scroll
document.querySelectorAll('.timeline-item, .project-card, .sidequest-card, .contact-item, .publication-card, .achievement-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ============================================
// HOVER INTERACTION - PROJECT CARDS
// ============================================
document.querySelectorAll('.project-card, .sidequest-card').forEach(card => {
    card.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-12px) scale(1.02)';
    });

    card.addEventListener('mouseleave', function () {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// ============================================
// NAVBAR SHADOW ON SCROLL
// ============================================
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
    }
});

// ============================================
// ACTIVE NAV LINK HIGHLIGHT
// ============================================
const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('.section');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.style.color = 'var(--text-dark)';
        if (link.getAttribute('href').slice(1) === current) {
            link.style.color = 'var(--primary-purple)';
        }
    });
});

// ============================================
// STAGGER ANIMATION FOR CARDS
// ============================================
const cards = document.querySelectorAll('.project-card, .sidequest-card, .publication-card, .achievement-item');
cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.animation = `slideUp 0.8s ease-out ${0.1 * index}s forwards`;
});

// ============================================
// PARALLAX EFFECT - HERO IMAGE
// ============================================
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.hero-image');

    parallaxElements.forEach(el => {
        el.style.transform = `translateY(${scrolled * 0.05}px)`;
    });
});

// ============================================
// INTERACTIVE TAGS
// ============================================
document.querySelectorAll('.sidequest-tags span').forEach(tag => {
    tag.style.cursor = 'pointer';
    tag.style.transition = 'all 0.3s ease';

    tag.addEventListener('mouseenter', function () {
        this.style.backgroundColor = 'rgba(212, 165, 232, 0.4)';
        this.style.transform = 'scale(1.1)';
    });

    tag.addEventListener('mouseleave', function () {
        this.style.backgroundColor = 'rgba(212, 165, 232, 0.2)';
        this.style.transform = 'scale(1)';
    });
});

// ============================================
// SMOOTH PAGE LOAD
// ============================================
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

document.body.style.opacity = '0.95';
