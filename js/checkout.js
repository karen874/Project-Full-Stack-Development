class CheckoutManager {
	constructor() {
		this.cart = JSON.parse(localStorage.getItem("shopzone_cart")) || [];
		this.products = new Map();
		this.orderTotal = 0;
		this.init();
	}

	init() {
		this.checkCartEmpty();
		this.loadOrderSummary();
		this.setupEventListeners();
		this.setupFormValidation();
	}

	checkCartEmpty() {
		if (this.cart.length === 0) {
			this.showNotification(
				"Your cart is empty! Redirecting to products...",
				"warning"
			);
			setTimeout(() => {
				window.location.href = "products.html";
			}, 2000);
		}
	}

	setupEventListeners() {
		const checkoutForm = document.getElementById("checkoutForm");
		if (checkoutForm) {
			checkoutForm.addEventListener(
				"submit",
				this.handleCheckout.bind(this)
			);
		}

		const cardNumber = document.getElementById("cardNumber");
		if (cardNumber) {
			cardNumber.addEventListener(
				"input",
				this.formatCardNumber.bind(this)
			);
		}

		const expiryDate = document.getElementById("expiryDate");
		if (expiryDate) {
			expiryDate.addEventListener(
				"input",
				this.formatExpiryDate.bind(this)
			);
		}

		const cvv = document.getElementById("cvv");
		if (cvv) {
			cvv.addEventListener("input", this.formatCVV.bind(this));
		}
	}

	setupFormValidation() {
		const form = document.getElementById("checkoutForm");
		const inputs = form.querySelectorAll("input[required]");

		inputs.forEach((input) => {
			input.addEventListener("blur", () => this.validateField(input));
			input.addEventListener("input", () => this.clearFieldError(input));
		});
	}

	validateField(field) {
		const value = field.value.trim();
		let isValid = true;
		let errorMessage = "";

		if (!value) {
			isValid = false;
			errorMessage = "This field is required";
		} else {
			switch (field.id) {
				case "email":
					const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
					if (!emailRegex.test(value)) {
						isValid = false;
						errorMessage = "Please enter a valid email address";
					}
					break;
				case "cardNumber":
					if (value.replace(/\s/g, "").length < 16) {
						isValid = false;
						errorMessage = "Card number must be 16 digits";
					}
					break;
				case "expiryDate":
					const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
					if (!expiryRegex.test(value)) {
						isValid = false;
						errorMessage =
							"Please enter a valid expiry date (MM/YY)";
					}
					break;
				case "cvv":
					if (value.length < 3) {
						isValid = false;
						errorMessage = "CVV must be 3 digits";
					}
					break;
				case "zipCode":
					if (value.length < 5) {
						isValid = false;
						errorMessage = "Please enter a valid zip code";
					}
					break;
			}
		}

		this.showFieldError(field, isValid, errorMessage);
		return isValid;
	}

	showFieldError(field, isValid, errorMessage) {
		const existingError = field.parentElement.querySelector(".field-error");
		if (existingError) {
			existingError.remove();
		}

		if (!isValid) {
			field.classList.add("is-invalid");
			const errorDiv = document.createElement("div");
			errorDiv.className = "field-error text-danger small mt-1";
			errorDiv.textContent = errorMessage;
			field.parentElement.appendChild(errorDiv);
		} else {
			field.classList.remove("is-invalid");
			field.classList.add("is-valid");
		}
	}

	clearFieldError(field) {
		field.classList.remove("is-invalid");
		const existingError = field.parentElement.querySelector(".field-error");
		if (existingError) {
			existingError.remove();
		}
	}

	formatCardNumber(e) {
		let value = e.target.value.replace(/\s/g, "").replace(/[^0-9]/gi, "");
		const formattedValue = value.match(/.{1,4}/g)?.join(" ") || value;
		e.target.value = formattedValue;
	}

	formatExpiryDate(e) {
		let value = e.target.value.replace(/\D/g, "");
		if (value.length >= 2) {
			value = value.substring(0, 2) + "/" + value.substring(2, 4);
		}
		e.target.value = value;
	}

	formatCVV(e) {
		e.target.value = e.target.value.replace(/[^0-9]/g, "").substring(0, 3);
	}

	async loadOrderSummary() {
		try {
			await this.fetchCartProductDetails();
			this.renderOrderItems();
			this.calculateTotals();
		} catch (error) {
			console.error("Error loading order summary:", error);
			this.showNotification("Error loading order summary", "danger");
		}
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

	renderOrderItems() {
		const container = document.getElementById("orderItems");
		container.innerHTML = "";

		this.cart.forEach((item) => {
			const product = this.products.get(item.id);
			if (product) {
				const orderItem = this.createOrderItem(product, item.quantity);
				container.appendChild(orderItem);
			}
		});
	}

	createOrderItem(product, quantity) {
		const item = document.createElement("div");
		item.className =
			"order-item d-flex align-items-center mb-3 pb-3 border-bottom";

		const truncatedTitle =
			product.title.length > 40
				? product.title.substring(0, 40) + "..."
				: product.title;

		item.innerHTML = `
            <img src="${product.image}" alt="${
			product.title
		}" class="order-item-image me-3">
            <div class="flex-grow-1">
                <h6 class="mb-1">${truncatedTitle}</h6>
                <small class="text-muted">Qty: ${quantity}</small>
            </div>
            <div class="text-end">
                <div class="fw-bold">$${(product.price * quantity).toFixed(
					2
				)}</div>
            </div>
        `;

		return item;
	}

	calculateTotals() {
		let subtotal = 0;

		this.cart.forEach((item) => {
			const product = this.products.get(item.id);
			if (product) {
				subtotal += product.price * item.quantity;
			}
		});

		const shipping = subtotal > 50 ? 0 : 5.99;
		const tax = subtotal * 0.08;
		const total = subtotal + shipping + tax;

		this.orderTotal = total;

		document.getElementById(
			"checkoutSubtotal"
		).textContent = `$${subtotal.toFixed(2)}`;
		document.getElementById("checkoutTax").textContent = `$${tax.toFixed(
			2
		)}`;
		document.getElementById(
			"checkoutTotal"
		).textContent = `$${total.toFixed(2)}`;

		const shippingElement = document.getElementById("checkoutShipping");
		shippingElement.textContent =
			shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`;
		shippingElement.className =
			shipping === 0 ? "text-success fw-bold" : "";
	}

	async handleCheckout(e) {
		e.preventDefault();

		const form = document.getElementById("checkoutForm");
		const inputs = form.querySelectorAll("input[required]");
		let isFormValid = true;

		inputs.forEach((input) => {
			if (!this.validateField(input)) {
				isFormValid = false;
			}
		});

		if (!isFormValid) {
			this.showNotification(
				"Please correct the errors in the form",
				"danger"
			);
			return;
		}

		const submitBtn = document.getElementById("placeOrderBtn");
		const originalText = submitBtn.innerHTML;
		submitBtn.disabled = true;
		submitBtn.innerHTML =
			'<i class="spinner-border spinner-border-sm me-2"></i>Processing...';

		try {
			await this.simulatePaymentProcessing();

			this.clearCart();

			this.showSuccessModal();
		} catch (error) {
			console.error("Payment processing error:", error);
			this.showNotification(
				"Payment failed. Please try again.",
				"danger"
			);
			submitBtn.disabled = false;
			submitBtn.innerHTML = originalText;
		}
	}

	async simulatePaymentProcessing() {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				const success = Math.random() > 0.1; // 90% success rate :)
				if (success) {
					resolve();
				} else {
					reject(new Error("Payment processing failed"));
				}
			}, 2000);
		});
	}

	clearCart() {
		this.cart = [];
		localStorage.removeItem("shopzone_cart");
		this.updateCartBadge();
	}

	updateCartBadge() {
		const cartBadges = document.querySelectorAll(".cart-badge");
		cartBadges.forEach((badge) => {
			badge.textContent = "0";
			badge.style.display = "none";
		});
	}

	showSuccessModal() {
		const modal = document.createElement("div");
		modal.className = "modal fade";
		modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-body text-center p-5">
                        <div class="success-icon mb-4">
                            <i class="bi bi-check-circle-fill text-success" style="font-size: 4rem;"></i>
                        </div>
                        <h3 class="text-success mb-3">Order Placed Successfully!</h3>
                        <p class="text-muted mb-4">
                            Thank you for your purchase. Your order total was <strong>$${this.orderTotal.toFixed(
								2
							)}</strong>.
                            You will receive a confirmation email shortly.
                        </p>
                        <button type="button" class="btn btn-primary" onclick="window.location.href='products.html'">
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        `;

		document.body.appendChild(modal);

		const bootstrapModal = new bootstrap.Modal(modal);
		bootstrapModal.show();

		modal.addEventListener("hidden.bs.modal", () => {
			setTimeout(() => {
				window.location.href = "index.html";
			}, 1000);
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
		}, 5000);
	}
}

document.addEventListener("DOMContentLoaded", () => {
	window.checkoutManager = new CheckoutManager();
});
