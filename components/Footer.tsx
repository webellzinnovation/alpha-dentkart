import React from 'react';

const FooterComponent: React.FC = () => {
  return (
    <footer className="bg-gray-800 dark:bg-gray-900 text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center bg-primary rounded-lg p-6 mb-12">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <i className="far fa-envelope-open text-3xl"></i>
            <div>
              <h4 className="font-bold text-lg">Subscribe for Updates</h4>
              <p className="text-sm text-white/80">Get the latest dental product offers directly.</p>
            </div>
          </div>
          <div className="flex w-full md:w-auto">
            <input className="rounded-l-lg border-none text-gray-800 py-2 px-4 w-full md:w-64 focus:ring-0 outline-none" placeholder="Enter your email address..." type="email" />
            <button className="bg-gray-900 text-white px-6 py-2 rounded-r-lg font-medium hover:bg-gray-800 transition-colors">Subscribe</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8 border-b border-gray-700 pb-8">
          <div>
            <h5 className="font-bold text-lg mb-4">Contact Us</h5>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-start gap-2"><i className="fas fa-map-marker-alt mt-1"></i> 123 Health Plaza, Dental Park, New Delhi, India.</li>
              <li className="flex items-center gap-2"><i className="fas fa-phone-alt"></i> +91 98765 43210</li>
              <li className="flex items-center gap-2"><i className="fas fa-envelope"></i> sales@alphadentkart.com</li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-lg mb-4">Information</h5>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a className="hover:text-primary transition-colors cursor-pointer">About Alpha Dentkart</a></li>
              <li><a className="hover:text-primary transition-colors cursor-pointer">Shipping Policy</a></li>
              <li><a href="/privacy-policy" className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</a></li>
              <li><a href="/terms-of-service" className="hover:text-primary transition-colors cursor-pointer">Terms of Service</a></li>
              <li><a className="hover:text-primary transition-colors cursor-pointer">Contact Support</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-lg mb-4">Account</h5>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a className="hover:text-primary transition-colors cursor-pointer">My Dashboard</a></li>
              <li><a className="hover:text-primary transition-colors cursor-pointer">Order History</a></li>
              <li><a className="hover:text-primary transition-colors cursor-pointer">Track Order</a></li>
              <li><a className="hover:text-primary transition-colors cursor-pointer">Wish List</a></li>
              <li><a className="hover:text-primary transition-colors cursor-pointer">Return Policy</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-lg mb-4">Top Brands</h5>
            <div className="flex flex-wrap gap-2">
              {['3M', 'Dentsply', 'GC', 'Kerr', 'Woodpecker', 'Shofu', 'Ivoclar', 'Coltene'].map(brand => (
                <a key={brand} className="bg-gray-700 hover:bg-primary transition-colors text-xs px-2 py-1 rounded cursor-pointer">{brand}</a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-400">
          <p>© 2023 Alpha Dentkart. All Rights Reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <i className="fab fa-cc-visa text-2xl"></i>
            <i className="fab fa-cc-mastercard text-2xl"></i>
            <i className="fab fa-cc-paypal text-2xl"></i>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export const Footer = React.memo(FooterComponent);