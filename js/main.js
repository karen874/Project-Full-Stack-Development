const API_CONFIG = {
	BASE_URL: "https://fakestoreapi.com",
	ENDPOINTS: {
		PRODUCTS: "/products",
		CATEGORIES: "/products/categories",
		SINGLE_PRODUCT: "/products",
	},
};

class ShopZoneApp {
	constructor() {
		this.products = [];
		this.categories = [];
		this.cart = JSON.parse(localStorage.getItem("shopzone_cart")) || [];
		this.favorites =
			JSON.parse(localStorage.getItem("shopzone_favorites")) || [];

		this.init();
	}

	init() {
		this.setupEventListeners();
		this.updateCartBadge();
		this.handlePageLoad();
	}

	setupEventListeners() {
		window.addEventListener("scroll", this.handleNavbarScroll.bind(this));

		const newsletterForm = document.querySelector(".newsletter-form");
		if (newsletterForm) {
			newsletterForm.addEventListener(
				"submit",
				this.handleNewsletterSubmit.bind(this)
			);
		}

		const contactForm = document.querySelector(".contact-form");
		if (contactForm) {
			contactForm.addEventListener(
				"submit",
				this.handleContactSubmit.bind(this)
			);
		}
	}

	handleNavbarScroll() {
		const navbar = document.querySelector(".navbar");
		if (window.scrollY > 50) {
			navbar.classList.add("scrolled");
		} else {
			navbar.classList.remove("scrolled");
		}
	}

	handlePageLoad() {
		const currentPage =
			window.location.pathname.split("/").pop() || "index.html";

		switch (currentPage) {
			case "index.html":
			case "":
				this.loadHomePage();
				break;
			case "products.html":
				break;
			case "about.html":
				break;
		}
	}

	async loadHomePage() {
		try {
			await this.loadFeaturedProducts();
			this.loadFAQ();
		} catch (error) {
			console.error("Error loading home page:", error);
		}
	}

	async loadFeaturedProducts() {
		const container = document.getElementById("featuredProducts");
		if (!container) return;

		try {
			const response = await fetch(
				`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS}?limit=6`
			);
			const products = await response.json();

			container.innerHTML = "";

			products.forEach((product, index) => {
				const productCard = this.createProductCard(
					product,
					index * 100
				);
				container.appendChild(productCard);
			});
		} catch (error) {
			console.error("Error loading featured products:", error);
			container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Unable to load products. Please try again later.
                    </div>
                </div>
            `;
		}
	}

	createProductCard(product, delay = 0) {
		const col = document.createElement("div");
		col.className = "col-lg-4 col-md-6 mb-4";
		col.style.animationDelay = `${delay}ms`;
		col.classList.add("animate-fade-in");

		const rating = this.generateStarRating(product.rating?.rate || 0);
		const truncatedTitle =
			product.title.length > 50
				? product.title.substring(0, 50) + "..."
				: product.title;

		col.innerHTML = `
            <div class="card product-card h-100">
                <div class="product-image">
                    <img src="${product.image}" alt="${
			product.title
		}" class="card-img-top">
                    <div class="product-badge">${product.category}</div>
                </div>
                <div class="card-body product-info d-flex flex-column">
                    <h5 class="product-title">${truncatedTitle}</h5>
                    <p class="product-category text-muted">${
						product.category
					}</p>
                    <div class="product-rating mb-2">
                        <div class="rating-stars">${rating}</div>
                        <span class="rating-count">(${
							product.rating?.count || 0
						})</span>
                    </div>
                    <div class="product-price mb-3">$${product.price}</div>
                    <div class="product-actions mt-auto">
                        <button class="btn btn-primary btn-sm flex-fill me-2" 
                                onclick="app.addToCart(${product.id})" 
                                data-product-id="${product.id}">
                            <i class="bi bi-cart-plus me-1"></i>Add to Cart
                        </button>
                        <button class="btn btn-outline-primary btn-sm" 
                                onclick="app.toggleFavorite(${product.id})" 
                                data-favorite-id="${product.id}">
                            <i class="bi bi-heart${
								this.favorites.includes(product.id)
									? "-fill"
									: ""
							}"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

		return col;
	}

	generateStarRating(rating) {
		const fullStars = Math.floor(rating);
		const hasHalfStar = rating % 1 >= 0.5;
		const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

		let stars = "";

		for (let i = 0; i < fullStars; i++) {
			stars += '<i class="bi bi-star-fill"></i>';
		}

		if (hasHalfStar) {
			stars += '<i class="bi bi-star-half"></i>';
		}

		for (let i = 0; i < emptyStars; i++) {
			stars += '<i class="bi bi-star"></i>';
		}

		return stars;
	}

	loadFAQ() {
		const faqContainer = document.getElementById("faqAccordion");
		if (!faqContainer) return;

		const faqData = [
			{
				question: "What is your return policy?",
				answer: "We offer a 30-day return policy for all unused items in their original packaging. Simply contact our customer service team to initiate a return.",
			},
			{
				question: "How long does shipping take?",
				answer: "Standard shipping typically takes 3-5 business days. Express shipping options are available for 1-2 day delivery at checkout.",
			},
			{
				question: "Do you ship internationally?",
				answer: "Yes, we ship to over 50 countries worldwide. International shipping times vary by location and typically range from 7-14 business days.",
			},
			{
				question: "How can I track my order?",
				answer: "Once your order ships, you'll receive a tracking number via email. You can use this number to track your package on our website or the carrier's site.",
			},
			{
				question: "What payment methods do you accept?",
				answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, and Google Pay for secure and convenient checkout.",
			},
		];

		const faqComponent = new FAQComponent(faqContainer, faqData);
		faqComponent.render();
	}

	addToCart(productId) {
		const existingItem = this.cart.find((item) => item.id === productId);

		if (existingItem) {
			existingItem.quantity += 1;
		} else {
			this.cart.push({ id: productId, quantity: 1 });
		}

		this.saveCart();
		this.updateCartBadge();
		this.showNotification("Product added to cart!", "success");
	}

	toggleFavorite(productId) {
		const index = this.favorites.indexOf(productId);
		const button = document.querySelector(
			`[data-favorite-id="${productId}"]`
		);
		const icon = button.querySelector("i");

		if (index > -1) {
			this.favorites.splice(index, 1);
			icon.className = "bi bi-heart";
			this.showNotification("Removed from favorites", "info");
		} else {
			this.favorites.push(productId);
			icon.className = "bi bi-heart-fill";
			this.showNotification("Added to favorites!", "success");
		}

		localStorage.setItem(
			"shopzone_favorites",
			JSON.stringify(this.favorites)
		);
	}

	saveCart() {
		localStorage.setItem("shopzone_cart", JSON.stringify(this.cart));
	}

	updateCartBadge() {
		const cartBadges = document.querySelectorAll(".cart-badge");
		const totalItems = this.cart.reduce(
			(sum, item) => sum + item.quantity,
			0
		);

		cartBadges.forEach((badge) => {
			badge.textContent = totalItems;
			badge.style.display = totalItems > 0 ? "flex" : "none";
		});
	}

	showNotification(message, type = "info") {
		const notification = document.createElement("div");
		notification.className = `alert alert-${type} notification`;
		notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            animation: slideInRight 0.3s ease-out;
        `;

		notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-check-circle-fill me-2"></i>
                <span>${message}</span>
                <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;

		document.body.appendChild(notification);

		setTimeout(() => {
			if (notification.parentElement) {
				notification.remove();
			}
		}, 3000);
	}

	handleNewsletterSubmit(e) {
		e.preventDefault();
		const email = e.target.querySelector('input[type="email"]').value;

		setTimeout(() => {
			this.showNotification(
				`Thank you for subscribing with ${email}!`,
				"success"
			);
			e.target.reset();
		}, 500);
	}

	handleContactSubmit(e) {
		e.preventDefault();
		const formData = new FormData(e.target);

		setTimeout(() => {
			this.showNotification(
				"Message sent successfully! We'll get back to you soon.",
				"success"
			);
			e.target.reset();
		}, 500);
	}
}

class FAQComponent {
	constructor(container, data) {
		this.container = container;
		this.data = data;
	}

	render() {
		this.container.innerHTML = "";

		this.data.forEach((item, index) => {
			const faqItem = this.createFAQItem(item, index);
			this.container.appendChild(faqItem);
		});
	}

	createFAQItem(item, index) {
		const faqItem = document.createElement("div");
		faqItem.className = "faq-item";

		faqItem.innerHTML = `
            <button class="faq-question" data-faq-index="${index}">
                <span>${item.question}</span>
                <i class="bi bi-chevron-down faq-icon"></i>
            </button>
            <div class="faq-answer" data-faq-answer="${index}">
                <div class="faq-answer-content">
                    ${item.answer}
                </div>
            </div>
        `;

		const button = faqItem.querySelector(".faq-question");
		button.addEventListener("click", () => this.toggleFAQ(index));

		return faqItem;
	}

	toggleFAQ(index) {
		const question = document.querySelector(`[data-faq-index="${index}"]`);
		const answer = document.querySelector(`[data-faq-answer="${index}"]`);

		const isActive = question.classList.contains("active");

		document.querySelectorAll(".faq-question.active").forEach((q) => {
			q.classList.remove("active");
		});
		document.querySelectorAll(".faq-answer.show").forEach((a) => {
			a.classList.remove("show");
		});

		if (!isActive) {
			question.classList.add("active");
			answer.classList.add("show");
		}
	}
}

class AnimationObserver {
	constructor() {
		this.observer = new IntersectionObserver(
			this.handleIntersection.bind(this),
			{ threshold: 0.1 }
		);

		this.init();
	}

	init() {
		const animatedElements = document.querySelectorAll(
			'[class*="animate-"]'
		);
		animatedElements.forEach((el) => this.observer.observe(el));
	}

	handleIntersection(entries) {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				entry.target.style.animationPlayState = "running";
				this.observer.unobserve(entry.target);
			}
		});
	}
}

document.addEventListener("DOMContentLoaded", () => {
	window.app = new ShopZoneApp();

	new AnimationObserver();

	document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
		anchor.addEventListener("click", function (e) {
			e.preventDefault();
			const target = document.querySelector(this.getAttribute("href"));
			if (target) {
				target.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			}
		});
	});
});

const notificationStyles = document.createElement("style");
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification {
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        border: none;
        border-radius: 0.75rem;
    }
`;
document.head.appendChild(notificationStyles);
