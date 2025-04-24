import React from "react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>© 2025 AI Education Assistant. All rights reserved.</p>
        <div className="footer-links">
          <a href="/terms" className="footer-link">Terms of Service</a>
          <a href="/privacy" className="footer-link">Privacy Policy</a>
          <a href="/contact" className="footer-link">Contact Us</a>
        </div>
        <div className="footer-social">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-facebook"></i> {/* Font Awesome Icon */}
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-twitter"></i> {/* Font Awesome Icon */}
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
            <i className="fab fa-linkedin"></i> {/* Font Awesome Icon */}
          </a>
        </div>
      </div>
    </footer>
  );
}