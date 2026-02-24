import { Link, useNavigate } from "react-router";
import { useApiStore } from "~/lib/api";
import Swal from "sweetalert2";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useApiStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, logout",
    });

    if (result.isConfirmed) {
      logout();
      Swal.fire({
        title: "Logged Out!",
        text: "You have been logged out successfully.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      setTimeout(() => navigate("/auth"), 1500);
    }
  };

  return (
    <nav className="navbar">
      <Link to="/">
        <p className="text-lg md:text-2xl font-bold text-gradient">
          RESUME GENIE
        </p>
      </Link>
      <div className="flex items-center gap-2 md:gap-4">
        {isAuthenticated && user && (
          <span className="hidden sm:inline text-xs md:text-sm text-gray-600">
            Welcome, {user.username}
          </span>
        )}
        {isAuthenticated ? (
          <>
            <Link
              to="/upload"
              className="primary-button w-fit text-xs md:text-base px-3 md:px-4 py-2"
            >
              Upload Resume
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 md:px-6 py-2 md:py-2.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors duration-200 text-xs md:text-sm font-medium"
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/auth"
            className="primary-button w-fit text-xs md:text-base px-3 md:px-4 py-2"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
