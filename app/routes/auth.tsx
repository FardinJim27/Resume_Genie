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
    <div className="auth-wrapper">
      <form
        method="post"
        id="login-form"
        className="login-form"
        autoComplete="off"
        onSubmit={isLoginMode ? handleLogin : handleRegister}
      >
        <h1 className="a11y-hidden">Login Form</h1>

        <figure aria-hidden="true">
          <div className="person-body"></div>
          <div className="neck skin"></div>
          <div className="head skin">
            <div className="eyes"></div>
            <div className="mouth"></div>
          </div>
          <div className="hair"></div>
          <div className="ears"></div>
          <div className="shirt-1"></div>
          <div className="shirt-2"></div>
        </figure>

        {!isLoginMode && (
          <div>
            <label className="label-email">
              <input
                type="text"
                className="text"
                name="username"
                placeholder="Username"
                required
              />
              <span className="required">Username</span>
            </label>
          </div>
        )}

        <div>
          <label className="label-email">
            <input
              type="email"
              className="text"
              name="email"
              placeholder="Email"
              tabIndex={1}
              required
            />
            <span className="required">Email</span>
          </label>
        </div>

        <input
          type="checkbox"
          name="show-password"
          className="show-password a11y-hidden"
          id="show-password"
          tabIndex={3}
          checked={showPassword}
          onChange={(e) => setShowPassword(e.target.checked)}
        />
        <label className="label-show-password" htmlFor="show-password">
          <span>Show Password</span>
        </label>

        <div>
          <label className="label-password">
            <input
              type={showPassword ? "text" : "password"}
              className="text"
              name="password"
              placeholder="Password"
              tabIndex={2}
              required
              minLength={8}
            />
            <span className="required">Password</span>
          </label>
        </div>

        <input
          type="submit"
          value={
            isLoading ? "Processing..." : isLoginMode ? "Log In" : "Register"
          }
          disabled={isLoading}
        />

        <div className="email">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleForgotPassword();
            }}
          >
            Forgot password?
          </a>
        </div>

        <div className="email" style={{ marginTop: "0.5rem" }}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setIsLoginMode(!isLoginMode);
            }}
          >
            {isLoginMode
              ? "Don't have an account? Register"
              : "Already have an account? Login"}
          </a>
        </div>
      </form>

      <style>{`
        .auth-wrapper {
          align-items: center;
          background: #f2f4f8;
          display: flex;
          font-family: Helvetica, Arial, sans-serif;
          font-size: 16px;
          min-height: 100vh;
          justify-content: center;
          margin: 0;
          padding: 2rem 1rem;
        }

        form {
          --background: white;
          --border: rgba(0, 0, 0, 0.125);
          --borderDark: rgba(0, 0, 0, 0.25);
          --borderDarker: rgba(0, 0, 0, 0.5);
          --bgColorH: 0;
          --bgColorS: 0%;
          --bgColorL: 98%;
          --fgColorH: 210;
          --fgColorS: 50%;
          --fgColorL: 38%;
          --shadeDark: 0.3;
          --shadeLight: 0.7;
          --shadeNormal: 0.5;
          --borderRadius: 0.5rem;
          --highlight: #306090;
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--borderRadius);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 1.5rem;
          position: relative;
          overflow: hidden;
          width: fit-content;
          max-width: 90vw;
        }

        form .email, form .email a {
          color: hsl(var(--fgColorH), var(--fgColorS), var(--fgColorL));
          font-size: 0.825rem;
          font-weight: bold;
          order: 4;
          text-align: center;
          margin-top: 0.25rem;
          outline: 1px dashed transparent;
          outline-offset: 2px;
          display: inline;
        }

        form a:hover {
          color: hsl(var(--fgColorH), var(--fgColorS), calc(var(--fgColorL) * 0.85));
          transition: color 0.25s;
        }

        form a:focus {
          color: hsl(var(--fgColorH), var(--fgColorS), calc(var(--fgColorL) * 0.85));
          outline: 1px dashed hsl(var(--fgColorH), calc(var(--fgColorS) * 2), calc(var(--fgColorL) * 1.15));
          outline-offset: 2px;
        }

        form > div {
          order: 2;
        }

        label {
          display: flex;
          flex-direction: column;
        }

        .label-show-password {
          order: 3;
        }

        label > span {
          color: var(--borderDarker);
          display: block;
          font-size: 0.825rem;
          font-weight: bold;
          margin-top: 0.625rem;
          order: 1;
          transition: all 0.25s;
        }

        label > span.required::after {
          content: "*";
          color: #dd6666;
          margin-left: 0.125rem;
        }

        label input {
          order: 2;
          outline: none;
        }

        label input::placeholder {
          color: var(--borderDark);
        }

        label:hover span {
          color: hsl(var(--fgColorH), var(--fgColorS), var(--fgColorL));
        }

        input[type="checkbox"] + div label:hover span::before,
        label:hover input.text {
          border-color: hsl(var(--fgColorH), var(--fgColorS), var(--fgColorL));
        }

        label input.text:focus,
        label input.text:active {
          border-color:  hsl(var(--fgColorH), calc(var(--fgColorS) * 2), calc(var(--fgColorL) * 1.15));
          box-shadow: 0 1px  hsl(var(--fgColorH), calc(var(--fgColorS) * 2), calc(var(--fgColorL) * 1.15));
        }

        input.text:focus + span,
        input.text:active + span {
          color:  hsl(var(--fgColorH), calc(var(--fgColorS) * 2), calc(var(--fgColorL) * 1.15));
        }

        input {
          border: 1px solid var(--border);
          border-radius: var(--borderRadius);
          box-sizing: border-box;
          font-size: 1rem;
          font-weight: bold;
          height: 2.25rem;
          line-height: 1.25rem;
          margin-top: 0.25rem;
          order: 2;
          padding: 0.25rem 0.5rem;
          width: 15rem;
          transition: all 0.25s;
        }

        input[type="submit"] {
          color: hsl(var(--bgColorH), var(--bgColorS), var(--bgColorL));
          background: hsl(var(--fgColorH), var(--fgColorS), var(--fgColorL));
          font-size: 0.75rem;
          font-weight: bold;
          margin-top: 0.625rem;
          order: 4;
          outline: 1px dashed transparent;
          outline-offset: 2px;
          padding-left: 0;
          text-transform: uppercase;
          cursor: pointer;
        }

        input[type="submit"]:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        input[type="checkbox"]:focus + label span::before,
        input[type="submit"]:focus {
          outline: 1px dashed hsl(var(--fgColorH), calc(var(--fgColorS) * 2), calc(var(--fgColorL) * 1.15));
          outline-offset: 2px;
        }

        input[type="submit"]:focus {
          background: hsl(var(--fgColorH), var(--fgColorS), calc(var(--fgColorL) * 0.85));
        }

        input[type="submit"]:hover {
          background: hsl(var(--fgColorH), var(--fgColorS), calc(var(--fgColorL) * 0.85));
        }

        input[type="submit"]:active {
          background: hsl(var(--fgColorH), calc(var(--fgColorS) * 2), calc(var(--fgColorL) * 1.15));
          transition: all 0.125s;
        }

        .a11y-hidden {
          position: absolute;
          top: -1000em;
          left: -1000em;
        }

        input[type="checkbox"] + label span {
          padding-left: 1.25rem;
          position: relative;
          font-weight: bold;
        }

        input[type="checkbox"] + label span::before {
          content: "";
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          width: 0.75rem;
          height: 0.75rem;
          border: 1px solid var(--borderDark);
          border-radius: 0;
          transition: all 0.25s;
          outline:1px dashed transparent;
          outline-offset: 2px;
        }

        input[type="checkbox"]:checked + label span::after {
          content: "";
          display: block;
          position: absolute;
          top: 0.1875rem;
          left: 0.1875rem;
          width: 0.375rem;
          height: 0.375rem;
          border: 1px solid var(--borderDark);
          border-radius: 0;
          transition: all 0.25s;
          outline:1px dashed transparent;
          outline-offset: 2px;
          background: hsl(var(--fgColorH), var(--fgColorS), var(--fgColorL));
        }

        figure {
          --skinH: 30;
          --skinS: 100%;
          --skinL: 87%;
          --hair: rgb(180,70,60);
          background: hsl(var(--fgColorH), calc(var(--fgColorS) * 2), 95%);
          border: 1px solid rgba(0,0,0,0.0625);
          border-radius: 50%;
          height: 0;
          margin: auto auto;
          margin-bottom: 1.5rem;
          order: 1;
          padding-top: 120px;
          position: relative;
          width: 120px;
          overflow: hidden;
        }

        figure div {
          position: absolute;
          transform: translate(-50%, -50%);
        }

        figure .skin {
          background: hsl(var(--skinH), var(--skinS), var(--skinL));
          box-shadow: inset 0 0 3rem hsl(var(--skinH), var(--skinS), calc(var(--skinL) * 0.95));
        }

        figure .head {
          top: 40%;
          left: 50%;
          width: 60%;
          height: 60%;
          border-radius: 100%;
          box-shadow: 0 -0.175rem 0 0.125rem var(--hair);
        }

        figure  .ears {
          top: 47%;
          left: 50%;
          white-space: nowrap;
        }

        figure .ears::before,
        figure .ears::after {
          content: "";
          background: hsl(var(--skinH), var(--skinS), var(--skinL));
          border-radius: 50%;
          width: 1rem;
          height: 1rem;
          display: inline-block;
          margin: 0 2.1rem;
        }

        figure .head .eyes {
          top: 55%;
          left: 50%;
          white-space: nowrap;
        }

        @keyframes blink {
          0%, 90%, 100% {
            height: 10px;
          }
          95% {
            height: 0px;
          }
        }

        figure .head .eyes::before,
        figure .head .eyes::after {
          content: "";
          background: var(--borderDarker);
          border-radius: 50%;
          width: 10px;
          height: 10px;
          display: inline-block;
          margin: 0 0.5rem;
          animation: blink 5s infinite;
          transition: all 0.15s;
        }

        input[name="show-password"]:checked ~ figure .head .eyes::before,
        input[name="show-password"]:checked ~ figure .head .eyes::after {
          height: 0.125rem;
          animation: none;
        }

        figure .head .mouth {
          border: 0.125rem solid transparent;
          border-bottom: 0.125rem solid var(--borderDarker);
          width: 25%;
          border-radius: 50%;
          transition: all 0.5s
        }

        form:invalid figure .head .mouth {
          top: 75%;
          left: 50%;
          height: 10%;
        }

        form:valid figure .head .mouth {
          top: 60%;
          left: 50%;
          width: 40%;
          height: 40%;
        }

        figure .hair {
          top: 40%;
          left: 50%;
          width: 66.66%;
          height: 66.66%;
          border-radius: 100%;
          overflow: hidden;
        }

        figure .hair::before {
          content: "";
          display: block;
          position: absolute;
          width: 100%;
          height: 100%;
          background: var(--hair);
          border-radius: 50%;
          top: -60%;
          left: -50%;
          box-shadow: 4rem 0 var(--hair);
        }

        figure .neck {
          width: 10%;
          height: 40%;
          top: 62%;
          left: 50%;
          background: hsl(var(--skinH), var(--skinS), calc(var(--skinL) * 0.94));
          border-radius: 0 0 2rem 2rem;
          box-shadow: 0 0.25rem var(--border);
        }

        figure .person-body {
          width: 60%;
          height: 100%;
          border-radius: 50%;
          background: red;
          left: 50%;
          top: 126%;
          background: hsl(var(--fgColorH), var(--fgColorS), var(--fgColorL));
        }

        figure .shirt-1,
        figure .shirt-2 {
          width: 12%;
          height: 7%;
          background: hsl(var(--bgColorH), var(--bgColorS), var(--bgColorL));
          top: 76%;
          left: 36.5%;
          transform: skew(-10deg) rotate(15deg)
        }

        figure .shirt-2 {
          left: 52.5%;
          transform: skew(10deg) rotate(-15deg)
        }
      `}</style>
    </div>
  );
};

export default Auth;
