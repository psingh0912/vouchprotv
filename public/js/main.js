/**
 * VouchPro Services Private Limited - Main JavaScript
 * Handles navigation, form submission, and animations
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modules
    initNavigation();
    initScrollEffects();
    initContactForm();
    initAnimations();
});

/**
 * Navigation Module
 * Handles mobile menu toggle and scroll effects
 */
function initNavigation() {
    const header = document.querySelector('header');
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    
    // Mobile menu toggle
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            menuToggle.classList.toggle('active');
            
            // Animate hamburger to X
            const spans = menuToggle.querySelectorAll('span');
            if (menuToggle.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = '';
                spans[1].style.opacity = '';
                spans[2].style.transform = '';
            }
        });
        
        // Close menu when clicking a link
        const navLinks = nav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                nav.classList.remove('active');
                menuToggle.classList.remove('active');
                const spans = menuToggle.querySelectorAll('span');
                spans[0].style.transform = '';
                spans[1].style.opacity = '';
                spans[2].style.transform = '';
            });
        });
    }
    
    // Scroll effect for header
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
        
        // Check initial scroll position
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        }
    }
    
    // Highlight current page in navigation
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navItems = document.querySelectorAll('nav a');
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            item.classList.add('active');
        }
    });
}

/**
 * Scroll Effects Module
 * Smooth scrolling and scroll-based animations
 */
function initScrollEffects() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
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
}

/**
 * Contact Form Module
 * Handles form validation and submission to Rails API
 */
function initContactForm() {
    const form = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');
    
    if (!form) return;
    
    // Get consent checkbox
    const consentCheckbox = form.querySelector('#consent');
    const checkboxWrapper = consentCheckbox ? consentCheckbox.closest('.checkbox-wrapper') : null;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate consent checkbox first
        if (consentCheckbox && !consentCheckbox.checked) {
            if (checkboxWrapper) {
                checkboxWrapper.classList.add('invalid');
            }
            showMessage('Please agree to receive communications from VouchPro before submitting.', 'error');
            consentCheckbox.focus();
            return;
        }
        
        // Get form data
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            mobile: formData.get('mobile'),
            interest: formData.get('interest'),
            message: formData.get('message'),
            consent: consentCheckbox ? consentCheckbox.checked.toString() : 'false'
        };
        
        // Validate form
        if (!validateForm(data)) {
            showMessage('Please fill in all required fields correctly.', 'error');
            return;
        }
        
        // Get submit button and add loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        try {
            // Send to Rails API endpoint
            const response = await fetch('/api/contacts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showMessage(result.message || 'Thank you for your interest! We will contact you shortly.', 'success');
                form.reset();
            } else {
                throw new Error(result.error || 'Server responded with an error');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showMessage(error.message || 'Something went wrong. Please try again or contact us directly.', 'error');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
    
    // Consent checkbox validation
    if (consentCheckbox && checkboxWrapper) {
        consentCheckbox.addEventListener('change', function() {
            if (this.checked) {
                checkboxWrapper.classList.remove('invalid');
            }
        });
    }
    
    // Real-time validation for other inputs
    const inputs = form.querySelectorAll('input:not([type="checkbox"]), textarea, select');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateInput(this);
        });
        
        input.addEventListener('input', function() {
            if (this.classList.contains('invalid')) {
                validateInput(this);
            }
        });
    });
}

/**
 * Validate entire form
 */
function validateForm(data) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[+]?[\d\s-]{10,}$/;
    
    if (!data.name || data.name.trim().length < 2) return false;
    if (!data.email || !emailRegex.test(data.email)) return false;
    if (!data.mobile || !phoneRegex.test(data.mobile)) return false;
    if (!data.interest) return false;
    if (data.consent !== 'true') return false;
    
    return true;
}

/**
 * Validate individual input
 */
function validateInput(input) {
    const value = input.value.trim();
    let isValid = true;
    
    if (input.required && !value) {
        isValid = false;
    }
    
    if (input.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        isValid = emailRegex.test(value);
    }
    
    if (input.type === 'tel' && value) {
        const phoneRegex = /^[+]?[\d\s-]{10,}$/;
        isValid = phoneRegex.test(value);
    }
    
    if (isValid) {
        input.classList.remove('invalid');
        input.classList.add('valid');
    } else {
        input.classList.remove('valid');
        input.classList.add('invalid');
    }
    
    return isValid;
}

/**
 * Show form message
 */
function showMessage(message, type) {
    const formMessage = document.getElementById('formMessage');
    if (!formMessage) return;
    
    formMessage.textContent = message;
    formMessage.className = 'form-message ' + type;
    formMessage.style.display = 'block';
    
    // Scroll message into view
    formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 5000);
    }
}

/**
 * Animations Module
 * Intersection Observer for scroll-triggered animations
 */
function initAnimations() {
    // Create intersection observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe all fade-in elements
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });
    
    // Add fade-in class to elements that should animate
    const animateElements = document.querySelectorAll(
        '.service-card, .value-card, .why-item, .channel-item, .contact-method'
    );
    
    animateElements.forEach((el, index) => {
        el.classList.add('fade-in');
        el.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(el);
    });
}

/**
 * Counter Animation for Stats
 */
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    function updateCounter() {
        start += increment;
        if (start < target) {
            element.textContent = Math.floor(start);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    }
    
    updateCounter();
}

// Initialize counter animations when stats come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counters = entry.target.querySelectorAll('.stat-number');
            counters.forEach(counter => {
                const target = parseInt(counter.textContent.replace(/[^0-9]/g, ''));
                if (target) {
                    animateCounter(counter, target);
                }
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.addEventListener('DOMContentLoaded', () => {
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        statsObserver.observe(heroStats);
    }
});
