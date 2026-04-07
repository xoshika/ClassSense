import { useState } from "react";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(true);
      console.log("Logging in with:", { email, rememberMe });
      
      setTimeout(() => {
        setEmail("");
        setPassword("");
        setSuccess(false);
        if (onLogin) {
          onLogin();
        }
      }, 2000);
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-800 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl">
        <h1 className="text-center text-3xl font-bold text-blue-600 mb-2">
          ClassSense
        </h1>
        <p className="text-center text-sm text-gray-600 mb-8">
          Welcome back! Please log in to your admin account
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 text-sm rounded-lg">
            ✓ Login successful! Redirecting...
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 bg-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 bg-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 text-sm"
                disabled={loading}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-blue-600"
                disabled={loading}
              />
              <span className="text-gray-700">Remember me</span>
            </label>
            <a
              href="#"
              className="text-blue-600 hover:text-blue-800 font-medium transition"
            >
              Forgot Password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold text-white text-sm transition-all duration-200 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : success
                ? "bg-green-500"
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Logging in...
              </span>
            ) : success ? (
              "✓ Logged in successfully"
            ) : (
              "Log In"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{" "}
          <a href="#" className="text-blue-600 hover:text-blue-800 font-medium transition">
            Sign up here
          </a>
        </p>
      </div>
    </div>
  );
}