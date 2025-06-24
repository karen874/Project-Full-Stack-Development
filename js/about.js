class AboutPageManager {
	constructor() {
		this.animatedStats = false;
		this.init();
	}

	init() {
		this.loadTeamMembers();
		this.setupStatsAnimation();
		this.setupContactForm();
	}

	async loadTeamMembers() {
		const teamContainer = document.getElementById("teamMembers");
		if (!teamContainer) return;

		const teamData = [
			{
				name: "Sarah Johnson",
				position: "CEO & Founder",
				bio: "Passionate entrepreneur with 10+ years in e-commerce.",
				avatar: "https://images.unsplash.com/photo-1697095098675-1d02496ef86a?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
			},
			{
				name: "Michael Chen",
				position: "CTO",
				bio: "Tech leader specializing in scalable web applications.",
				avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=faces",
			},
			{
				name: "Emily Rodriguez",
				position: "Head of Marketing",
				bio: "Creative marketer focused on customer experience.",
				avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=faces",
			},
			{
				name: "David Wilson",
				position: "Operations Manager",
				bio: "Logistics expert ensuring smooth operations daily.",
				avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=faces",
			},
		];

		teamContainer.innerHTML = "";

		teamData.forEach((member, index) => {
			const memberCard = this.createTeamMemberCard(member, index * 150);
			teamContainer.appendChild(memberCard);
		});
	}

	createTeamMemberCard(member, delay = 0) {
		const col = document.createElement("div");
		col.className = "col-lg-3 col-md-6 mb-4";
		col.style.animationDelay = `${delay}ms`;
		col.classList.add("animate-fade-in");

		col.innerHTML = `
            <div class="card team-member-card h-100 text-center hover-lift">
                <div class="card-body p-4">
                    <div class="team-avatar mb-3">
                        <img src="${member.avatar}" alt="${member.name}" 
                             class="rounded-circle img-fluid" 
                             style="width: 120px; height: 120px; object-fit: cover;">
                    </div>
                    <h5 class="card-title mb-1">${member.name}</h5>
                    <p class="text-primary fw-semibold mb-2">${member.position}</p>
                    <p class="card-text text-muted small">${member.bio}</p>
                    <div class="social-links mt-3">
                        <a href="#" class="text-muted me-2 hover-lift"><i class="bi bi-linkedin"></i></a>
                        <a href="#" class="text-muted me-2 hover-lift"><i class="bi bi-twitter"></i></a>
                        <a href="#" class="text-muted hover-lift"><i class="bi bi-envelope"></i></a>
                    </div>
                </div>
            </div>
        `;

		return col;
	}

	setupStatsAnimation() {
		const statsObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !this.animatedStats) {
						this.animatedStats = true;
						this.animateStats();
					}
				});
			},
			{ threshold: 0.5 }
		);

		const statsSection = document.querySelector(".animate-counter");
		if (statsSection) {
			statsObserver.observe(statsSection.parentElement);
		}
	}

	animateStats() {
		const statItems = document.querySelectorAll(
			".animate-counter h3[data-count]"
		);

		statItems.forEach((item) => {
			const target = parseInt(item.dataset.count);
			const duration = 2000; // 2 seconds
			const increment = target / (duration / 16); // 60fps
			let current = 0;

			const timer = setInterval(() => {
				current += increment;
				if (current >= target) {
					current = target;
					clearInterval(timer);
				}

				item.textContent = Math.floor(current).toLocaleString();
			}, 16);
		});
	}

	setupContactForm() {
		const contactForm = document.querySelector(".contact-form");
		if (!contactForm) return;

		contactForm.addEventListener(
			"submit",
			this.handleContactSubmit.bind(this)
		);

		const inputs = contactForm.querySelectorAll("input, textarea");
		inputs.forEach((input) => {
			input.addEventListener("blur", this.validateField.bind(this));
			input.addEventListener("input", this.clearFieldError.bind(this));
		});
	}

	validateField(e) {
		const field = e.target;
		const value = field.value.trim();

		field.classList.remove("is-invalid");
		this.removeFieldError(field);

		if (field.required && !value) {
			this.showFieldError(field, "This field is required");
			return false;
		}

		if (field.type === "email" && value && !this.isValidEmail(value)) {
			this.showFieldError(field, "Please enter a valid email address");
			return false;
		}

		field.classList.add("is-valid");
		return true;
	}

	clearFieldError(e) {
		const field = e.target;
		field.classList.remove("is-invalid");
		this.removeFieldError(field);
	}

	showFieldError(field, message) {
		field.classList.add("is-invalid");

		let errorDiv = field.parentElement.querySelector(".invalid-feedback");
		if (!errorDiv) {
			errorDiv = document.createElement("div");
			errorDiv.className = "invalid-feedback";
			field.parentElement.appendChild(errorDiv);
		}

		errorDiv.textContent = message;
	}

	removeFieldError(field) {
		const errorDiv = field.parentElement.querySelector(".invalid-feedback");
		if (errorDiv) {
			errorDiv.remove();
		}
		field.classList.remove("is-valid");
	}

	isValidEmail(email) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	handleContactSubmit(e) {
		e.preventDefault();

		const form = e.target;
		const formData = new FormData(form);
		const inputs = form.querySelectorAll("input, textarea");

		let isValid = true;
		inputs.forEach((input) => {
			if (!this.validateField({ target: input })) {
				isValid = false;
			}
		});

		if (!isValid) {
			this.showNotification(
				"Please correct the errors in the form",
				"danger"
			);
			return;
		}

		const submitBtn = form.querySelector('button[type="submit"]');
		const originalText = submitBtn.textContent;
		submitBtn.disabled = true;
		submitBtn.innerHTML =
			'<span class="spinner-border spinner-border-sm me-2"></span>Sending...';

		setTimeout(() => {
			form.reset();
			inputs.forEach((input) => {
				input.classList.remove("is-valid", "is-invalid");
				this.removeFieldError(input);
			});

			submitBtn.disabled = false;
			submitBtn.textContent = originalText;

			this.showNotification(
				"Thank you! Your message has been sent successfully. We'll get back to you soon.",
				"success"
			);

			form.scrollIntoView({ behavior: "smooth", block: "center" });
		}, 1500);
	}

	showNotification(message, type = "info") {
		const notification = document.createElement("div");
		notification.className = `alert alert-${type} notification`;
		notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 9999;
            min-width: 350px;
            max-width: 500px;
            animation: slideInRight 0.3s ease-out;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            border: none;
            border-radius: 0.75rem;
        `;

		const iconClass =
			type === "success"
				? "bi-check-circle-fill"
				: type === "danger"
				? "bi-x-circle-fill"
				: "bi-info-circle-fill";

		notification.innerHTML = `
            <div class="d-flex align-items-start">
                <i class="${iconClass} me-3 mt-1"></i>
                <div class="flex-grow-1">
                    <div>${message}</div>
                </div>
                <button type="button" class="btn-close ms-2" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;

		document.body.appendChild(notification);

		setTimeout(() => {
			if (notification.parentElement) {
				notification.style.animation = "slideOutRight 0.3s ease-out";
				setTimeout(() => notification.remove(), 300);
			}
		}, 5000);
	}
}

class ValuesAnimation {
	constructor() {
		this.init();
	}

	init() {
		const valueCards = document.querySelectorAll(".value-card");

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry, index) => {
					if (entry.isIntersecting) {
						setTimeout(() => {
							entry.target.style.animation =
								"fadeIn 0.6s ease-out forwards, scaleIn 0.4s ease-out forwards";
						}, index * 200);
						observer.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.3 }
		);

		valueCards.forEach((card) => {
			card.style.opacity = "0";
			card.style.transform = "translateY(30px) scale(0.95)";
			observer.observe(card);
		});
	}
}

document.addEventListener("DOMContentLoaded", () => {
	if (document.getElementById("teamMembers")) {
		window.aboutPageManager = new AboutPageManager();
		new ValuesAnimation();
	}
});

const additionalStyles = document.createElement("style");
additionalStyles.textContent = `
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .team-member-card {
        transition: all 0.3s ease;
        border: none;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .team-member-card:hover {
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }
    
    .team-avatar img {
        transition: transform 0.3s ease;
    }
    
    .team-member-card:hover .team-avatar img {
        transform: scale(1.05);
    }
    
    .social-links a {
        transition: all 0.3s ease;
        display: inline-block;
        padding: 0.5rem;
        border-radius: 50%;
    }
    
    .social-links a:hover {
        background: var(--primary-color);
        color: white !important;
        transform: translateY(-2px);
    }
`;
document.head.appendChild(additionalStyles);
