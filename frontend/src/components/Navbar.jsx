const { authUser, logout } = useAuthStore();

const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
};import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';
import toast from 'react-hot-toast';
import '../styles/Navbar.css';

const Navbar = () => {
    const { authUser, logout } = useAuthStore();

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    SportClub
                </Link>

                <div className="navbar-links">
                    {authUser ? (
                        <>
                            <Link to="/" className="nav-link">Home</Link>
                            <Link to="/profile" className="nav-link">Profile</Link>
                            <button onClick={handleLogout} className="nav-button">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link">Login</Link>
                            <Link to="/signup" className="nav-link nav-signup">Sign Up</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;