import { Link, useLocation } from "wouter";

export const Footer = () => {
  const [_, navigate] = useLocation();
  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">BookHaven</h3>
            <p className="text-gray-600 mb-4">
              Connecting communities through shared books. Managing small communal libraries and book-sharing spots along roads and private driveways.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-amber-600">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="text-gray-500 hover:text-amber-600">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-gray-500 hover:text-amber-600">
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <div 
                  className="text-gray-600 hover:text-amber-600 cursor-pointer"
                  onClick={() => navigate('/')}
                >
                  Home
                </div>
              </li>
              <li>
                <div 
                  className="text-gray-600 hover:text-amber-600 cursor-pointer"
                  onClick={() => navigate('/books')}
                >
                  Browse Books
                </div>
              </li>
              <li>
                <div 
                  className="text-gray-600 hover:text-amber-600 cursor-pointer"
                  onClick={() => navigate('/dashboard')}
                >
                  My Dashboard
                </div>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 hover:text-amber-600">How It Works</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-amber-600">FAQ</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-amber-600">Help Center</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4">Contact</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <i className="fas fa-map-marker-alt mt-1 mr-2"></i>
                <span>123 Library Street, Booktown, BK 12345</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-phone-alt mr-2"></i>
                <span>(123) 456-7890</span>
              </li>
              <li className="flex items-center">
                <i className="fas fa-envelope mr-2"></i>
                <span>contact@bookhaven.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} BookHaven. Connecting communities through shared libraries.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-600 hover:text-amber-600 text-sm">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-600 hover:text-amber-600 text-sm">
              Terms of Service
            </a>
            <a href="#" className="text-gray-600 hover:text-amber-600 text-sm">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
