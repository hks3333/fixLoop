'use client';
import '../styles/checkout.css';

export default function CheckoutApp() {
  return (
    <div className="checkout-container">
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Your Cart</h2>
      <div className="product-card">
        <div className="product-image" />
        <div>
          <div style={{ fontWeight: 600 }}>Wireless Headphones Pro</div>
          <div style={{ color: '#6b7280', fontSize: 14 }}>Color: Midnight Black</div>
          <div style={{ marginTop: 8, fontWeight: 700 }}>$49.99</div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#6b7280' }}>Subtotal</span>
          <span>$49.99</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
          <span>Total</span>
          <span>$49.99</span>
        </div>
      </div>
      <div className="button-wrapper">
        <div className="overlay" />
        <button className="checkout-button">Checkout →</button>
      </div>
    </div>
  );
}
