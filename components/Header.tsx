import React from "react";

const Header: React.FC = () => {
  return (
    <header className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto flex justify-center">
        <a className="inline-flex items-center space-x-3" href="#">
          <svg
            className="h-10 w-auto text-black dark:text-white"
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
          <span className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            Convert
          </span>
        </a>
      </div>
    </header>
  );
};

export default Header;