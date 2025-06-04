import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../lib/axios.js';
import { useAuthStore } from '../store/useAuthStore.js';
import toast from 'react-hot-toast';
import '../styles/AuthForms.css';

const SignUpPage = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const { isSigningUp, setIsSigningUp, setAuthUser } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!fullName || !email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        try {
            setIsSigningUp(true);
            const response = await axiosInstance.post('/auth/signup', {
                fullName,
                email,
                password
            });
            setAuthUser(response.data);
            toast.success('Account created successfully!');
            navigate('/');
        } catch (error) {
            setError(error.response?.data?.message || 'Something went wrong. Please try again.');
            toast.error(error.response?.data?.message || 'Signup failed. Please try again.');
        } finally {
            setIsSigningUp(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form-container">
                <h2>Create Account</h2>
                <p className="auth-subtitle">Join our community today</p>

                {error && <div className="auth-error">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="fullName">Full Name</label>
                        <input
                            type="text"
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Enter your full name"
                            required
                        />
                    </div>

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
                            placeholder="Create a password"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={isSigningUp}
                    >
                        {isSigningUp ? (
                            <span className="button-loading">
                                <span className="loading-spinner-small"></span>
                                Creating account...
                            </span>
                        ) : 'Sign Up'}
                    </button>
                </form>

                <p className="auth-redirect">
                    Already have an account?
                    <a href="/login"> Login</a>
                </p>
            </div>
        </div>
    );
};

export default SignUpPage;