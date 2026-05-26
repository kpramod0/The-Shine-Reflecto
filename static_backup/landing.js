document.addEventListener('DOMContentLoaded', () => {
    // 1. NAVBAR SCROLL EFFECT
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. BEFORE/AFTER SLIDER
    const sliderWrapper = document.getElementById('sliderWrapper');
    const beforeImage = document.getElementById('beforeImage');
    const sliderHandle = document.getElementById('sliderHandle');

    if (sliderWrapper) {
        const handleMove = (e) => {
            const rect = sliderWrapper.getBoundingClientRect();
            let x = e.clientX || (e.touches && e.touches[0].clientX);
            
            if (x === undefined) return;

            let position = ((x - rect.left) / rect.width) * 100;
            position = Math.max(0, Math.min(100, position));

            beforeImage.style.width = `${position}%`;
            sliderHandle.style.left = `${position}%`;
        };

        sliderWrapper.addEventListener('mousemove', handleMove);
        sliderWrapper.addEventListener('touchmove', handleMove);
    }

    // 3. COST ESTIMATOR
    const sqftInput = document.getElementById('sqftInput');
    const priceValue = document.getElementById('priceValue');

    if (sqftInput) {
        const updateEstimate = () => {
            const sqft = parseFloat(sqftInput.value) || 0;
            const min = sqft * 35;
            const max = sqft * 85;
            priceValue.textContent = `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
        };

        sqftInput.addEventListener('input', updateEstimate);
    }

    // 4. MOBILE MENU TOGGLE
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            // Simple toggle for demonstration
            // In a real project, we'd add a CSS class for the mobile menu
            alert('Mobile Menu Placeholder');
        });
    }

    // 5. REVEAL ANIMATIONS ON SCROLL
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => {
        observer.observe(el);
    });
});
