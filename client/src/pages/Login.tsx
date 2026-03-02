import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { motion } from 'framer-motion';
import { ApiError } from '../lib/api';

const glassCardClass = "bg-white/40 backdrop-blur-2xl border border-white/40 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]";

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      // Only show "Invalid credentials" for 401 errors
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid credentials. Please check your email and password.');
      } else if (err instanceof ApiError && err.status === 403) {
        setError('Access denied. Provider account required.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-[#F5F5F7] bg-fixed px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }}
        className="w-full max-w-md"
      >
        <Card className={glassCardClass}>
          <CardHeader className="space-y-1 pb-6">
            <CardTitle 
              className="text-3xl font-black text-gray-900 tracking-tighter" 
              style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: 900 }}
            >
              Welcome back
            </CardTitle>
            <CardDescription className="text-base text-gray-600 font-light">
              Sign in to your provider account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 text-sm text-red-600 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl"
                >
                  {error}
                </motion.div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/60 border-gray-300 h-12 min-h-[48px] focus:border-[#22c55e] focus:ring-[#22c55e]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/60 border-gray-300 h-12 min-h-[48px] focus:border-[#22c55e] focus:ring-[#22c55e]"
                  required
                />
              </div>
              <motion.div
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                style={{ willChange: 'transform' }}
              >
                <Button 
                  type="submit" 
                  className="w-full h-12 min-h-[48px] text-base font-semibold bg-[#22c55e] text-white hover:bg-green-600 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all" 
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </motion.div>
            </form>
            <p className="mt-6 text-center text-sm text-gray-600 font-light">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#22c55e] hover:text-green-600 font-semibold transition-colors">
                Sign up
              </Link>
            </p>
            
            {/* Demo Credentials Hint */}
            <div className="mt-6 p-4 bg-gray-50/60 backdrop-blur-sm border border-gray-200/50 rounded-xl">
              <p className="text-xs text-gray-600 font-light mb-2">
                <strong className="font-semibold">Demo Account:</strong>
              </p>
              <p className="text-xs text-gray-500 font-light">
                Email: barber@nile.ng
              </p>
              <p className="text-xs text-gray-500 font-light">
                Password: password123
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
