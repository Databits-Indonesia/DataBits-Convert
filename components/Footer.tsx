import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900/50 mt-16 border-t border-gray-100 dark:border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <svg
              className="h-9 w-auto mb-3 text-black dark:text-white"
              viewBox="0 0 144 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="DataBits logo"
            >
              <rect x="1" y="1" width="142" height="42" stroke="currentColor" strokeWidth="2" />
              <rect x="2" y="2" width="70" height="40" fill="currentColor" />
              <text x="37" y="29" className="text-white dark:text-black" fill="currentColor" fontSize="20" fontWeight="bold" fontFamily="Inter, sans-serif" textAnchor="middle">DATA</text>
              <text x="107" y="29" fill="currentColor" fontSize="20" fontWeight="bold" fontFamily="Inter, sans-serif" textAnchor="middle">BITS</text>
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © Copyright Databits Indonesia, 2025 - Present
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Links
            </h4>
            <ul className="space-y-1 text-gray-600 dark:text-gray-300">
              <li>
                <a
                  className="hover:text-primary dark:hover:text-white transition-colors"
                  href="https://databits.co-id.id/"
                >
                  Company
                </a>
              </li>
              <li>
                <a
                  className="hover:text-primary dark:hover:text-white transition-colors"
                  href="https://databits.co-id.id/"
                >
                  Service
                </a>
              </li>
              <li>
                <a
                  className="hover:text-primary dark:hover:text-white transition-colors"
                  href="#"
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Contact
            </h4>
            <p className="mt-2 text-gray-600 dark:text-gray-300 mb-3">
              More service in AI and Analytics
            </p>
            <a
              href="mailto:databitsteam@gmail.com"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white transition-colors mb-2"
            >
              <span className="icon text-lg">email</span>
              <span>databitsteam@gmail.com</span>
            </a>
            <a
              href="tel:+6289636344666"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-white transition-colors"
            >
              <span className="icon text-lg">call</span>
              <span>+62 896-3634-4666</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;