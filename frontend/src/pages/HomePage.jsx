import { useAuthStore } from '../store/useAuthStore';
import '../styles/HomePage.css';

const HomePage = () => {
    const { authUser } = useAuthStore();

    return (
        <div className="home-container">
            <div className="welcome-section">
                <h1>Welcome to SportClub, {authUser?.fullName}!</h1>
                <p className="welcome-message">
                    This is a simple demo application with authentication features.
                </p>

                <div className="features-grid">
                    <div className="feature-card">
                        <h3>Profile Management</h3>
                        <p>View and update your profile information</p>
                    </div>

                    <div className="feature-card">
                        <h3>Authentication</h3>
                        <p>Secure login and registration system</p>
                    </div>

                    <div className="feature-card">
                        <h3>Responsive Design</h3>
                        <p>Works on desktop and mobile devices</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;