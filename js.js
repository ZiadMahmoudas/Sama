    // Preloader
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.getElementById('preloader').classList.add('hidden');
            }, 2000);
        });
const links = document.querySelectorAll('.nav-links a');

links.forEach(link => {
    link.addEventListener('click', function() {
        links.forEach(item => item.classList.remove('active'));
        
        this.classList.add('active');
    });
});
        // Custom Cursor
        const cursor = document.getElementById('cursor');
        let mouseX = 0, mouseY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursor.style.left = mouseX + 'px';
            cursor.style.top = mouseY + 'px';
        });

        document.querySelectorAll('a, button, .service-card, .pricing-card, .portfolio-item').forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
        });

        // Navbar
        const navbar = document.getElementById('navbar');
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });

        // Mobile Menu
        const menuBtn = document.getElementById('menuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('active'));
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => mobileMenu.classList.remove('active'));
        });

        // Counter Animation
const counters = document.querySelectorAll('.stat-number[data-count]');
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            counters.forEach(counter => {
                const target = parseInt(counter.dataset.count);
                
                const suffix = counter.dataset.suffix || ''; 
                
                const duration = 2000;
                const step = target / (duration / 16);
                let current = 0;

                const update = () => {
                    current += step;
                    if (current < target) {
                        counter.textContent = Math.floor(current) + suffix; 
                        requestAnimationFrame(update);
                    } else {
                        counter.textContent = target + suffix; 
                    }
                };
                update();
            });
            counterObserver.disconnect();
        }
    });
}, { threshold: 0.5 });

counterObserver.observe(document.querySelector('.stats-bar'));

        // FAQ Accordion
        document.querySelectorAll('.faq-item').forEach(item => {
            item.querySelector('.faq-question').addEventListener('click', () => {
                const wasActive = item.classList.contains('active');
                document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
                if (!wasActive) item.classList.add('active');
            });
        });

        // Reveal Animation
        const reveals = document.querySelectorAll('.reveal');
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, index * 100);
                }
            });
        }, { threshold: 0.1 });

        reveals.forEach(el => revealObserver.observe(el));

        // Back to Top
const backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 500);
});

backToTop.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        
        if (href !== "#") { 
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
});

        // Form Submit
        document.getElementById('contactForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('.submit-btn');
            const originalText = btn.textContent;
            
            btn.textContent = 'جارٍ الإرسال...';
            btn.disabled = true;
            
            setTimeout(() => {
                btn.textContent = '✓ تم الإرسال بنجاح!';
                btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                    e.target.reset();
                }, 2000);
            }, 1500);
            /* Marque */
            const marquee = document.getElementById('myMarquee');

marquee.innerHTML += marquee.innerHTML;

let position = 0;
const speed = 1.5;

function animateMarquee() {
    position -= speed; 
    
    if (Math.abs(position) >= marquee.scrollWidth / 2) {
        position = 0;
    }
    
    marquee.style.transform = `translateX(${position}px)`;
    
    requestAnimationFrame(animateMarquee);
}

animateMarquee();
/* Prices */

// ننتظر حتى يتم تحميل الصفحة بالكامل
});
document.addEventListener('DOMContentLoaded', function() {

    const phoneNumber = '01100133486'; 
    const startButtons = document.querySelectorAll('.pricing-btn');

    console.log(`🔍 تم العثور على ${startButtons.length} أزرار في الصفحة`); // لمعرفة هل اكتشف الأزرار أم لا

    startButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();

            const card = this.closest('.pricing-card');
            if (!card) {
                console.error("❌ لم يتم العثور على حاوية الباقة (pricing-card)");
                return;
            }

            const planName = card.querySelector('h3').innerText;
            const subtitle = card.querySelector('.subtitle').innerText;
            const priceAmount = card.querySelector('.amount').innerText;
            const pricePeriod = card.querySelector('.period').innerText;

            const featuresNodes = card.querySelectorAll('.pricing-features li');
            let featuresList = '';
            featuresNodes.forEach(feature => {
                featuresList += `✅ ${feature.innerText.trim()}\n`;
            });

            const message = `مرحباً، مهتم بالاشتراك في خدماتكم والتفاصيل كالتالي:\n\n` +
                            `📦 *${planName}* (${subtitle})\n` +
                            `💰 السعر: ${priceAmount} ${pricePeriod}\n\n` +
                            `*المميزات التي أحصل عليها:*\n${featuresList}\n` +
                            `كيف يمكنني إتمام الطلب؟`;

            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
            
            window.open(whatsappUrl, '_blank');
        });
    });
});