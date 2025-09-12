// components/LoginNavbar.jsx
import { Link } from "react-router-dom";

const LoginNavbar = () => {
  return (
    <nav className="w-full flex items-center justify-between p-4 bg-white/40 backdrop-blur-md shadow-md fixed top-0 z-50">
      <Link to="/" className="text-2xl font-bold text-red-600">
        🥕VendorConnect
      </Link>
      <Link
        to="/register"
        className="text-sm font-medium text-red-600 hover:underline"
      >
        Sign Up
      </Link>
    </nav>
  );
};
export default LoginNavbar;
