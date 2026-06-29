'use client';
import '../styles/checkout.css';

export default function CheckoutApp() {
  return (
    <div className="checkout-container">
      <div className="header">
        <h2 className="cart-title">Your Cart</h2>
        <span className="item-count">2 items</span>
      </div>

      <div className="product-card">
        <div className="product-image">
          <div className="product-badge">SALE</div>
        </div>
        <div className="product-details">
          <div className="product-name">Wireless Headphones Pro</div>
          <div className="product-variant">Color: Midnight Black</div>
          <div className="product-variant">Size: One Size</div>
          <div className="quantity-selector">
            <button className="qty-btn">-</button>
            <span className="qty-value">1</span>
            <button className="qty-btn">+</button>
          </div>
          <div className="price-row">
            <span className="original-price">$79.99</span>
            <span className="current-price">$49.99</span>
          </div>
        </div>
        <button className="remove-btn">×</button>
      </div>

      <div className="product-card">
        <div className="product-image" />
        <div className="product-details">
          <div className="product-name">USB-C Charging Cable</div>
          <div className="product-variant">Color: White</div>
          <div className="product-variant">Length: 2m</div>
          <div className="quantity-selector">
            <button className="qty-btn">-</button>
            <span className="qty-value">1</span>
            <button className="qty-btn">+</button>
          </div>
          <div className="price-row">
            <span className="current-price">$12.99</span>
          </div>
        </div>
        <button className="remove-btn">×</button>
      </div>

      <div className="promo-section">
        <div className="promo-input">
          <input type="text" placeholder="Enter promo code" className="promo-field" />
          <button className="apply-btn">Apply</button>
        </div>
      </div>

      <div className="summary-section">
        <div className="summary-row">
          <span className="summary-label">Subtotal</span>
          <span className="summary-value">$62.98</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Shipping</span>
          <span className="summary-value">$5.99</span>
        </div>
        <div className="summary-row discount">
          <span className="summary-label">Discount</span>
          <span className="summary-value">-$10.00</span>
        </div>
        <div className="summary-row total">
          <span className="summary-label">Total</span>
          <span className="summary-value">$58.97</span>
        </div>
      </div>

      <div className="button-container-outer">
        <div className="overlay" />
        <div className="button-wrapper">
          <button className="checkout-button">
            <span className="btn-text">Proceed to Checkout</span>
            <span className="btn-arrow">→</span>
          </button>
        </div>
      </div>

      <div className="trust-badges">
        <div className="trust-item">🔒 Secure Checkout</div>
        <div className="trust-item">🚚 Free Shipping</div>
        <div className="trust-item">↩️ Easy Returns</div>
      </div>
    </div>
  );
}
