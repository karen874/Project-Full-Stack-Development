class ProductsManager {
	constructor() {
		this.allProducts = [];
		this.filteredProducts = [];
		this.categories = [];
		this.currentPage = 1;
		this.productsPerPage = 12;
		this.currentSort = "default";
		this.currentCategory = "";

		this.init();
	}

	async init() {
		try {
			await this.loadProducts();
			await this.loadCategories();
			this.setupEventListeners();
			this.renderProducts();
		} catch (error) {
			console.error("Error initializing products page:", error);
			this.showError("Failed to load products. Please try again later.");
		}
	}

	async loadProducts() {
		try {
			const response = await fetch(
				`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS}`
			);
			this.allProducts = await response.json();
			this.filteredProducts = [...this.allProducts];
		} catch (error) {
			throw new Error("Failed to fetch products");
		}
	}

	async loadCategories() {
		try {
			const response = await fetch(
				`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CATEGORIES}`
			);
			this.categories = await response.json();
			this.populateCategoryFilter();
		} catch (error) {
			console.error("Error loading categories:", error);
		}
	}

	populateCategoryFilter() {
		const categoryFilter = document.getElementById("categoryFilter");
		if (!categoryFilter) return;

		categoryFilter.innerHTML = '<option value="">All Categories</option>';

		this.categories.forEach((category) => {
			const option = document.createElement("option");
			option.value = category;
			option.textContent = this.capitalizeCategory(category);
			categoryFilter.appendChild(option);
		});
	}

	capitalizeCategory(category) {
		return category
			.split(" ")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	}

	setupEventListeners() {
		const categoryFilter = document.getElementById("categoryFilter");
		if (categoryFilter) {
			categoryFilter.addEventListener("change", (e) => {
				this.currentCategory = e.target.value;
				this.filterProducts();
			});
		}

		const sortBy = document.getElementById("sortBy");
		if (sortBy) {
			sortBy.addEventListener("change", (e) => {
				this.currentSort = e.target.value;
				this.sortProducts();
			});
		}

		const loadMoreBtn = document.getElementById("loadMoreBtn");
		if (loadMoreBtn) {
			loadMoreBtn.addEventListener("click", () => {
				this.loadMoreProducts();
			});
		}
	}

	filterProducts() {
		if (this.currentCategory === "") {
			this.filteredProducts = [...this.allProducts];
		} else {
			this.filteredProducts = this.allProducts.filter(
				(product) => product.category === this.currentCategory
			);
		}

		this.sortProducts();
		this.currentPage = 1;
		this.renderProducts();
	}

	sortProducts() {
		const sortFunction = this.getSortFunction(this.currentSort);
		this.filteredProducts.sort(sortFunction);

		this.renderProducts();
	}

	getSortFunction(sortType) {
		switch (sortType) {
			case "price-low":
				return (a, b) => a.price - b.price;
			case "price-high":
				return (a, b) => b.price - a.price;
			case "rating":
				return (a, b) => (b.rating?.rate || 0) - (a.rating?.rate || 0);
			default:
				return (a, b) => a.id - b.id;
		}
	}

	renderProducts() {
		const container = document.getElementById("productsGrid");
		if (!container) return;

		const startIndex = 0;
		const endIndex = this.currentPage * this.productsPerPage;
		const productsToShow = this.filteredProducts.slice(
			startIndex,
			endIndex
		);

		if (productsToShow.length === 0) {
			container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="empty-state">
                        <i class="bi bi-search display-1 text-muted mb-3"></i>
                        <h3 class="text-muted">No products found</h3>
                        <p class="text-muted">Try adjusting your filters or search criteria.</p>
                    </div>
                </div>
            `;
			this.hideLoadMoreButton();
			return;
		}

		container.innerHTML = "";

		productsToShow.forEach((product, index) => {
			const productCard = this.createProductCard(product, index * 50);
			container.appendChild(productCard);
		});

		this.updateLoadMoreButton();
	}

	createProductCard(product, delay = 0) {
		const col = document.createElement("div");
		col.className = "col-lg-4 col-md-6 mb-4";
		col.style.animationDelay = `${delay}ms`;
		col.classList.add("animate-fade-in");

		const rating = this.generateStarRating(product.rating?.rate || 0);
		const truncatedTitle =
			product.title.length > 60
				? product.title.substring(0, 60) + "..."
				: product.title;
		const truncatedDescription =
			product.description.length > 100
				? product.description.substring(0, 100) + "..."
				: product.description;

		col.innerHTML = `
            <div class="card product-card h-100">
                <div class="product-image">
                    <img src="${product.image}" alt="${
			product.title
		}" class="card-img-top" loading="lazy">
                    <div class="product-badge">${this.capitalizeCategory(
						product.category
					)}</div>
                </div>
                <div class="card-body product-info d-flex flex-column">
                    <h5 class="product-title">${truncatedTitle}</h5>
                    <p class="product-category text-muted">${this.capitalizeCategory(
						product.category
					)}</p>
                    <div class="product-rating mb-2">
                        <div class="rating-stars">${rating}</div>
                        <span class="rating-count">(${
							product.rating?.count || 0
						})</span>
                    </div>
                    <p class="text-muted small mb-3">${truncatedDescription}</p>
                    <div class="product-price mb-3">$${product.price.toFixed(
						2
					)}</div>
                    <div class="product-actions mt-auto">
                        <button class="btn btn-outline-primary btn-sm me-2" 
                                onclick="productsManager.showProductModal(${
									product.id
								})" 
                                data-bs-toggle="modal" 
                                data-bs-target="#productModal">
                            <i class="bi bi-eye me-1"></i>View
                        </button>
                        <button class="btn btn-primary btn-sm flex-fill" 
                                onclick="app.addToCart(${product.id})" 
                                data-product-id="${product.id}">
                            <i class="bi bi-cart-plus me-1"></i>Add to Cart
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

	loadMoreProducts() {
		this.currentPage++;
		this.renderProducts();
	}

	updateLoadMoreButton() {
		const loadMoreBtn = document.getElementById("loadMoreBtn");
		if (!loadMoreBtn) return;

		const totalProducts = this.filteredProducts.length;
		const shownProducts = this.currentPage * this.productsPerPage;

		if (shownProducts < totalProducts) {
			loadMoreBtn.style.display = "inline-block";
			loadMoreBtn.textContent = `Load More (${
				totalProducts - shownProducts
			} remaining)`;
		} else {
			loadMoreBtn.style.display = "none";
		}
	}

	hideLoadMoreButton() {
		const loadMoreBtn = document.getElementById("loadMoreBtn");
		if (loadMoreBtn) {
			loadMoreBtn.style.display = "none";
		}
	}

	async showProductModal(productId) {
		try {
			const product = this.allProducts.find((p) => p.id === productId);
			if (!product) return;

			const modalTitle = document.getElementById("productModalTitle");
			const modalBody = document.getElementById("productModalBody");
			const addToCartBtn = document.getElementById("addToCartBtn");

			if (modalTitle) modalTitle.textContent = product.title;

			if (modalBody) {
				const rating = this.generateStarRating(
					product.rating?.rate || 0
				);

				modalBody.innerHTML = `
                    <div class="row">
                        <div class="col-md-6">
                            <img src="${product.image}" alt="${
					product.title
				}" class="img-fluid rounded mb-3">
                        </div>
                        <div class="col-md-6">
                            <div class="product-details">
                                <span class="badge bg-primary mb-2">${this.capitalizeCategory(
									product.category
								)}</span>
                                <h4 class="mb-3">$${product.price.toFixed(
									2
								)}</h4>
                                <div class="product-rating mb-3">
                                    <div class="rating-stars">${rating}</div>
                                    <span class="rating-count ms-2">(${
										product.rating?.count || 0
									} reviews)</span>
                                </div>
                                <div class="product-description">
                                    <h6>Description:</h6>
                                    <p class="text-muted">${
										product.description
									}</p>
                                </div>
                                <div class="product-features mt-3">
                                    <h6>Features:</h6>
                                    <ul class="list-unstyled">
                                        <li><i class="bi bi-check-circle text-success me-2"></i>High Quality Materials</li>
                                        <li><i class="bi bi-check-circle text-success me-2"></i>Fast Shipping</li>
                                        <li><i class="bi bi-check-circle text-success me-2"></i>30-Day Return Policy</li>
                                        <li><i class="bi bi-check-circle text-success me-2"></i>Customer Support</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
			}

			if (addToCartBtn) {
				addToCartBtn.onclick = () => {
					app.addToCart(productId);
					const modal = bootstrap.Modal.getInstance(
						document.getElementById("productModal")
					);
					if (modal) modal.hide();
				};
			}
		} catch (error) {
			console.error("Error showing product modal:", error);
			this.showError("Failed to load product details.");
		}
	}

	showError(message) {
		const container = document.getElementById("productsGrid");
		if (container) {
			container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger" role="alert">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        ${message}
                    </div>
                </div>
            `;
		}
	}
}

class ProductSearch {
	constructor(productsManager) {
		this.productsManager = productsManager;
		this.searchTimeout = null;
		this.init();
	}

	init() {
		this.createSearchInput();
	}

	createSearchInput() {
		const categoryFilter = document.getElementById("categoryFilter");
		if (!categoryFilter || !categoryFilter.parentElement) return;

		const searchContainer = document.createElement("div");
		searchContainer.className = "col-md-6 mb-3";
		searchContainer.innerHTML = `
            <div class="position-relative">
                <input type="text" 
                       class="form-control" 
                       id="productSearch" 
                       placeholder="Search products..."
                       style="padding-left: 2.5rem;">
                <i class="bi bi-search position-absolute" 
                   style="left: 0.75rem; top: 50%; transform: translateY(-50%); color: #6b7280;"></i>
            </div>
        `;

		categoryFilter.parentElement.parentElement.insertBefore(
			searchContainer,
			categoryFilter.parentElement
		);

		const searchInput = document.getElementById("productSearch");
		if (searchInput) {
			searchInput.addEventListener("input", (e) => {
				clearTimeout(this.searchTimeout);
				this.searchTimeout = setTimeout(() => {
					this.performSearch(e.target.value);
				}, 300);
			});
		}
	}

	performSearch(query) {
		if (!query.trim()) {
			this.productsManager.filteredProducts = [
				...this.productsManager.allProducts,
			];
		} else {
			const searchTerm = query.toLowerCase();
			this.productsManager.filteredProducts =
				this.productsManager.allProducts.filter(
					(product) =>
						product.title.toLowerCase().includes(searchTerm) ||
						product.description
							.toLowerCase()
							.includes(searchTerm) ||
						product.category.toLowerCase().includes(searchTerm)
				);
		}

		this.productsManager.currentPage = 1;
		this.productsManager.renderProducts();
	}
}

document.addEventListener("DOMContentLoaded", () => {
	if (document.getElementById("productsGrid")) {
		window.productsManager = new ProductsManager();
		window.productSearch = new ProductSearch(window.productsManager);
	}
});
