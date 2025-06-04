import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../lib/axios.js';
import { useAuthStore } from '../store/useAuthStore.js';
import toast from 'react-hot-toast';
import '../styles/AuthForms.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const { isLoggingIn, setIsLoggingIn, setAuthUser } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setIsLoggingIn(true);
            const response = await axiosInstance.post('/auth/login', { email, password });
            setAuthUser(response.data);
            toast.success('Login successful!');
            navigate('/');
        } catch (error) {
            setError(error.response?.data?.message || 'Something went wrong. Please try again.');
            toast.error(error.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form-container">
                <h2>Login to Your Account</h2>
                <p className="auth-subtitle">Welcome back! Please enter your details</p>

                {error && <div className="auth-error">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={isLoggingIn}
                    >
                        {isLoggingIn ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p className="auth-redirect">
                    Don't have an account?
                    <a href="/signup"> Sign up</a>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;