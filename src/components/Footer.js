// src/components/Footer.js
import React from "react";
import mitwpuLogo from "../assets/mitwpu-logo.png.png"; // place logo here

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-left">
        <h4>Project Guide:</h4>
        <p>Dr. Sumita Motade</p>
        <h4>Team Members:</h4>
        <ul>
          <li>Omkar Kolhe</li>
          <li>Vipin Jain</li>
          <li>Samyak Bakliwal</li>
        </ul>
      </div>

      <div className="footer-center">
        <h3>Department of Electrical and Electronics Engineering</h3>
        <p>MIT World Peace University, Pune</p>
      </div>

      <div className="footer-right">
        <img src={mitwpuLogo} alt="MIT-WPU Logo" className="mitwpu-logo" />
      </div>
    </footer>
  );
}
