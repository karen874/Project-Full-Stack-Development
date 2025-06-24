class CartManager {
	constructor() {
		this.cart = JSON.parse(localStorage.getItem("shopzone_cart")) || [];
		this.products = new Map();
		this.init();
	}

	init() {
		this.renderCart();
		this.setupEventListeners();
	}

	setupEventListeners() {
		const checkoutBtn = document.getElementById("checkoutBtn");
		if (checkoutBtn) {
			checkoutBtn.addEventListener(
				"click",
				this.handleCheckout.bind(this)
			);
		}
	}

	async renderCart() {
		const cartContainer = document.getElementById("cartItems");

		if (this.cart.length === 0) {
			this.renderEmptyCart(cartContainer);
			this.updateSummary();
			return;
		}

		try {
			await this.fetchCartProductDetails();

			cartContainer.innerHTML = "";

			this.cart.forEach((item, index) => {
				const product = this.products.get(item.id);
				if (product) {
					const cartItem = this.createCartItem(
						product,
						item.quantity,
						index
					);
					cartContainer.appendChild(cartItem);
				}
			});

			this.updateSummary();
		} catch (error) {
			console.error("Error rendering cart:", error);
			cartContainer.innerHTML = `
                <div class="alert alert-danger text-center">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Unable to load cart items. Please try again later.
                </div>
            `;
		}
	}

	renderEmptyCart(container) {
		container.innerHTML = `
            <div class="text-center py-5">
                <div class="empty-cart-icon mb-4">
                    <i class="bi bi-cart-x display-1 text-muted"></i>
                </div>
                <h3 class="text-muted mb-3">Your cart is empty</h3>
                <p class="text-muted mb-4">Looks like you haven't added any items to your cart yet.</p>
                <a href="products.html" class="btn btn-primary btn-lg">
                    <i class="bi bi-shop me-2"></i>Start Shopping
                </a>
            </div>
        `;
	}

	async fetchCartProductDetails() {
		const productIds = [...new Set(this.cart.map((item) => item.id))];

		for (const productId of productIds) {
			if (!this.products.has(productId)) {
				try {
					const response = await fetch(
						`https://fakestoreapi.com/products/${productId}`
					);
					const product = await response.json();
					this.products.set(productId, product);
				} catch (error) {
					console.error(
						`Error fetching product ${productId}:`,
						error
					);
				}
			}
		}
	}

	createCartItem(product, quantity, index) {
		const cartItem = document.createElement("div");
		cartItem.className = "card cart-item mb-3 animate-fade-in";
		cartItem.style.animationDelay = `${index * 100}ms`;

		const truncatedTitle =
			product.title.length > 60
				? product.title.substring(0, 60) + "..."
				: product.title;

		cartItem.innerHTML = `
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-2">
                        <img src="${product.image}" alt="${
			product.title
		}" class="img-fluid cart-item-image">
                    </div>
                    <div class="col-md-4">
                        <h6 class="cart-item-title">${truncatedTitle}</h6>
                        <p class="text-muted mb-1">${product.category}</p>
                        <div class="rating-stars small">
                            ${this.generateStarRating(
								product.rating?.rate || 0
							)}
                            <span class="text-muted ms-1">(${
								product.rating?.count || 0
							})</span>
                        </div>
                    </div>
                    <div class="col-md-2 text-center">
                        <div class="quantity-controls">
                            <button class="btn btn-outline-secondary btn-sm" onclick="cartManager.updateQuantity(${
								product.id
							}, ${quantity - 1})">
                                <i class="bi bi-dash"></i>
                            </button>
                            <span class="quantity-display mx-2">${quantity}</span>
                            <button class="btn btn-outline-secondary btn-sm" onclick="cartManager.updateQuantity(${
								product.id
							}, ${quantity + 1})">
                                <i class="bi bi-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="col-md-2 text-center">
                        <div class="item-price h5 mb-0">$${product.price}</div>
                    </div>
                    <div class="col-md-2 text-center">
                        <div class="item-total h5 mb-2 text-primary">$${(
							product.price * quantity
						).toFixed(2)}</div>
                        <button class="btn btn-outline-danger btn-sm" onclick="cartManager.removeItem(${
							product.id
						})" title="Remove item">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

		return cartItem;
	}

	generateStarRating(rating) {
		const fullStars = Math.floor(rating);
		const hasHalfStar = rating % 1 >= 0.5;
		const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

		let stars = "";

		for (let i = 0; i < fullStars; i++) {
			stars += '<i class="bi bi-star-fill text-warning"></i>';
		}

		if (hasHalfStar) {
			stars += '<i class="bi bi-star-half text-warning"></i>';
		}

		for (let i = 0; i < emptyStars; i++) {
			stars += '<i class="bi bi-star text-warning"></i>';
		}

		return stars;
	}

	updateQuantity(productId, newQuantity) {
		if (newQuantity <= 0) {
			this.removeItem(productId);
			return;
		}

		const itemIndex = this.cart.findIndex((item) => item.id === productId);
		if (itemIndex > -1) {
			this.cart[itemIndex].quantity = newQuantity;
			this.saveCart();
			this.renderCart();
			this.updateCartBadge();
		}
	}

	removeItem(productId) {
		this.cart = this.cart.filter((item) => item.id !== productId);
		this.saveCart();
		this.renderCart();
		this.updateCartBadge();
		this.showNotification("Item removed from cart", "info");
	}

	updateSummary() {
		const subtotalElement = document.getElementById("subtotal");
		const taxElement = document.getElementById("tax");
		const totalElement = document.getElementById("total");
		const shippingElement = document.getElementById("shipping");

		let subtotal = 0;

		this.cart.forEach((item) => {
			const product = this.products.get(item.id);
			if (product) {
				subtotal += product.price * item.quantity;
			}
		});

		const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
		const tax = subtotal * 0.08; // 8% tax
		const total = subtotal + shipping + tax;

		if (subtotalElement)
			subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
		if (taxElement) taxElement.textContent = `$${tax.toFixed(2)}`;
		if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`;
		if (shippingElement) {
			shippingElement.textContent =
				shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`;
			shippingElement.className =
				shipping === 0 ? "text-success fw-bold" : "";
		}
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

	handleCheckout() {
		if (this.cart.length === 0) {
			this.showNotification("Your cart is empty!", "warning");
			return;
		}
		window.location.href = "checkout.html";
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

		const iconMap = {
			success: "bi-check-circle-fill",
			warning: "bi-exclamation-triangle-fill",
			info: "bi-info-circle-fill",
			danger: "bi-x-circle-fill",
		};

		notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi ${iconMap[type] || iconMap.info} me-2"></i>
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
}

document.addEventListener("DOMContentLoaded", () => {
	window.cartManager = new CartManager();
});
