'use client';
import React, { useState } from 'react';
import axios from 'axios';

const RegistrationForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Password validation function
  const validatePassword = (password: string) => {
    const minLength = /.{8,}/;
    const hasNumber = /[0-9]/;
    const hasUpper = /[A-Z]/;
    const hasLower = /[a-z]/;
    const hasSpecial = /[@!#?$%^&*]/;

    if (!minLength.test(password)) return 'Password must be at least 8 characters.';
    if (!hasNumber.test(password)) return 'Password must include at least one number.';
    if (!hasUpper.test(password)) return 'Password must include at least one uppercase letter.';
    if (!hasLower.test(password)) return 'Password must include at least one lowercase letter.';
    if (!hasSpecial.test(password)) return 'Password must include at least one special character (@,!,#, etc.).';
    
    return '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setPasswordError('');

    const validationError = validatePassword(password);
    if (validationError) {
      setPasswordError(validationError);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("http://localhost:3001/register", { name, email, password }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      setMessage(response.data.message || 'Registration successful!');
      setName('');
      setEmail('');
      setPassword('');
      
      setTimeout(() => {
        window.location.href = '/login_route';
      }, 1500);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-black py-12 px-4">
      <div className="max-w-md w-full space-y-6 bg-gray-900 p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-extrabold text-center text-white">Register</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-2 border border-gray-700 rounded bg-gray-800 text-white" />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-2 border border-gray-700 rounded bg-gray-800 text-white" />
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full p-2 border border-gray-700 rounded bg-gray-800 text-white" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 text-gray-400">{showPassword ? '👁️' : '🙈'}</button>
          </div>
          {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
          <button type="submit" disabled={loading} className={`w-full bg-indigo-600 text-white py-2 rounded ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>{loading ? 'Registering...' : 'Register'}</button>
        </form>
        {message && <p className="text-center text-white mt-2">{message}</p>}
        <p className="text-center text-white">Already have an account? <a href="/login_route" className="text-indigo-500">Login</a></p>
      </div>
    </div>
  );
};

export default RegistrationForm;
