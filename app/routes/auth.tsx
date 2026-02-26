import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useApiStore } from "~/lib/api";
import Swal from "sweetalert2";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => [
  { title: "Resume Genie | Auth" },
  { name: "description", content: "Login or register for Resume Genie" },
];

const Auth = () => {
  const { isLoading, error, isAuthenticated, login, register, resetPassword } =
    useApiStore();
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      const next = params.get("next") || "/";
      navigate(next);
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const success = await login(email, password);
    if (success) {
      Swal.fire({
        title: "Welcome Back!",
        text: "Login successful",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } else if (error) {
      Swal.fire({
        title: "Login Failed!",
        text: error,
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const success = await register(username, email, password);
    if (success) {
      Swal.fire({
        title: "Account Created!",
        text: "Registration successful. Welcome!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } else if (error) {
      Swal.fire({
        title: "Registration Failed!",
        text: error,
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
    }
  };

  const handleForgotPassword = async () => {
    const { value: email } = await Swal.fire({
      title: "Reset Password",
      text: "Enter your email address",
      input: "email",
      inputPlaceholder: "Enter your email",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Next",
      inputValidator: (value) => {
        if (!value) return "Email is required!";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          return "Please enter a valid email!";
      },
    });

    if (!email) return;

    const { value: newPassword } = await Swal.fire({
      title: "Reset Password",
      text: "Enter your new password",
      input: "password",
      inputPlaceholder: "Enter new password (min 8 characters)",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Reset Password",
      inputValidator: (value) => {
        if (!value) return "Password is required!";
        if (value.length < 8) return "Password must be at least 8 characters!";
      },
    });

    if (!newPassword) return;

    const success = await resetPassword(email, newPassword);
    if (success) {
      Swal.fire({
        title: "Password Reset!",
        text: "Your password has been reset successfully. You can now login with your new password.",
        icon: "success",
        confirmButtonColor: "#3085d6",
      });
    } else if (error) {
      Swal.fire({
        title: "Reset Failed!",
        text: error,
        icon: "error",
        confirmButtonColor: "#3085d6",
      });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-overlay" />
      <section className="auth-section">
        <div className="auth-container">
          <div className="auth-heading">
            <h2>Resume Genie</h2>
          </div>
          <div className="auth-card">
            <h3 className="auth-card-title">
              {isLoginMode ? "Have an account?" : "Create an account"}
            </h3>
            <form
              className="auth-form"
              autoComplete="off"
              onSubmit={isLoginMode ? handleLogin : handleRegister}
            >
              {!isLoginMode && (
                <div className="auth-field">
                  <input
                    type="text"
                    className="auth-input"
                    name="username"
                    placeholder="Username"
                    required
                  />
                </div>
              )}

              <div className="auth-field">
                <input
                  type="email"
                  className="auth-input"
                  name="email"
                  placeholder="Email"
                  required
                />
              </div>

              <div className="auth-field">
                <input
                  type={showPassword ? "text" : "password"}
                  className="auth-input auth-input-pw"
                  name="password"
                  placeholder="Password"
                  required
                  minLength={8}
                />
                <span
                  className="auth-eye"
                  role="button"
                  tabIndex={0}
                  onClick={() => setShowPassword(!showPassword)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      setShowPassword(!showPassword);
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </span>
              </div>

              <div className="auth-field">
                <button type="submit" className="auth-submit" disabled={isLoading}>
                  {isLoading
                    ? "Processing..."
                    : isLoginMode
                      ? "Sign In"
                      : "Register"}
                </button>
              </div>

              {isLoginMode && (
                <div className="auth-meta">
                  <a
                    href="#"
                    className="auth-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleForgotPassword();
                    }}
                  >
                    Forgot Password?
                  </a>
                </div>
              )}
            </form>

            <p className="auth-divider">
              &mdash;{" "}
              {isLoginMode ? "Don't have an account?" : "Already have an account?"}{" "}
              &mdash;
            </p>
            <a
              href="#"
              className="auth-switch-btn"
              onClick={(e) => {
                e.preventDefault();
                setIsLoginMode(!isLoginMode);
              }}
            >
              {isLoginMode ? "Create Account" : "Sign In Instead"}
            </a>
          </div>
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css?family=Lato:300,400,700&display=swap');

        .auth-page {
          font-family: 'Lato', Arial, sans-serif;
          font-size: 16px;
          line-height: 1.8;
          min-height: 100vh;
          background-image: url('/images/bg.jpg');
          background-size: cover;
          background-repeat: no-repeat;
          background-position: center center;
          position: relative;
          display: flex;
          align-items: stretch;
          margin: 0;
          padding: 0;
        }

        .auth-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.38);
          z-index: 0;
          pointer-events: none;
        }

        .auth-section {
          position: relative;
          z-index: 1;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
          min-height: 100vh;
        }

        .auth-container {
          width: 100%;
          max-width: 400px;
        }

        .auth-heading {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .auth-heading h2 {
          font-size: 2rem;
          color: #fff;
          font-weight: 300;
          letter-spacing: 2px;
          margin: 0;
          text-transform: uppercase;
        }

        .auth-card {
          width: 100%;
          color: rgba(255, 255, 255, 0.9);
        }

        .auth-card-title {
          font-weight: 300;
          color: #fff;
          margin: 0 0 1.5rem;
          text-align: center;
          font-size: 1.3rem;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .auth-field {
          position: relative;
          margin-bottom: 1rem;
        }

        .auth-input {
          display: block;
          width: 100%;
          box-sizing: border-box;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid transparent;
          height: 52px;
          color: #fff !important;
          border-radius: 40px;
          padding: 0 20px;
          font-size: 15px;
          font-family: 'Lato', Arial, sans-serif;
          transition: background 0.3s, border-color 0.3s;
          outline: none;
        }

        .auth-input-pw {
          padding-right: 48px;
        }

        .auth-input::placeholder {
          color: rgba(255, 255, 255, 0.55);
        }

        .auth-input:hover,
        .auth-input:focus {
          background: transparent;
          border-color: rgba(255, 255, 255, 0.4);
        }

        .auth-eye {
          position: absolute;
          top: 50%;
          right: 18px;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.65);
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: color 0.2s;
          user-select: none;
        }

        .auth-eye:hover {
          color: #fff;
        }

        .auth-submit {
          display: block;
          width: 100%;
          background: #fbceb5;
          border: 1px solid #fbceb5;
          height: 52px;
          color: #000;
          border-radius: 40px;
          font-size: 15px;
          font-weight: 700;
          font-family: 'Lato', Arial, sans-serif;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: background 0.3s, color 0.3s, border-color 0.3s;
          outline: none;
        }

        .auth-submit:hover {
          background: transparent;
          border-color: #fbceb5;
          color: #fbceb5;
        }

        .auth-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .auth-meta {
          text-align: right;
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }

        .auth-link {
          color: rgba(255, 255, 255, 0.85);
          font-size: 13.5px;
          text-decoration: none;
          transition: color 0.25s;
        }

        .auth-link:hover {
          color: #fbceb5;
        }

        .auth-divider {
          text-align: center;
          color: rgba(255, 255, 255, 0.55);
          margin: 1.5rem 0 1rem;
          font-size: 13.5px;
          letter-spacing: 0.5px;
        }

        .auth-switch-btn {
          display: block;
          width: 100%;
          box-sizing: border-box;
          text-align: center;
          padding: 13px 20px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 40px;
          color: #fff;
          background: transparent;
          font-size: 13.5px;
          font-weight: 600;
          font-family: 'Lato', Arial, sans-serif;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: background 0.3s, color 0.3s, border-color 0.3s;
        }

        .auth-switch-btn:hover {
          background: #fff;
          color: #000;
          border-color: #fff;
          text-decoration: none;
        }

        @media (max-width: 480px) {
          .auth-heading h2 { font-size: 1.5rem; }
          .auth-card-title  { font-size: 1.1rem; }
        }
      `}</style>
    </div>
  );
};

export default Auth;
