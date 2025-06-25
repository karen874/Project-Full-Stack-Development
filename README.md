# ShopZone E-commerce Website

**Author:** Abou Yaghi Youssef Karen

---

## API Used

This project uses the [Fake Store API](https://fakestoreapi.com) to retrieve product and category data. The following endpoints are configured in `API_CONFIG`:

-   **Base URL:** `https://fakestoreapi.com`
-   **Products:** `/products`
-   **Categories:** `/products/categories`
-   **Single Product:** `/products/:id`

---

## Prerequisites

- Visual Studio Code
- [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) installed in VS Code to serve the project locally

---

## Project Description

ShopZone is a responsive front-end e-commerce application built with HTML, CSS, and JavaScript. It allows users to:

-   Browse and filter products by category
-   View product details
-   Add and remove items from a shopping cart
-   Persist cart and favorites data in local storage
-   Complete a checkout flow with form validation and order summary

---

## Custom Requirement: FAQ Section

A dynamic FAQ section is implemented using JavaScript to enhance user experience. Key features include:

1. **Dynamic Rendering:** Questions and answers are stored in a JavaScript array (`faqData`) and rendered into the DOM at runtime.
2. **Collapsible Items:** Each FAQ item can be expanded or collapsed by clicking its header. Clicking toggles a CSS class that:
    - Slides the answer container open or closed
    - Rotates the toggle icon for visual feedback
3. **Accessibility:** The implementation uses ARIA attributes and proper focus management to ensure the FAQ is navigable by keyboard and screen readers.

This custom component demonstrates how to create interactive, accessible UI elements without relying on external libraries.
