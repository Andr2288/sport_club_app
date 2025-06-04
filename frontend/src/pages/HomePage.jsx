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
            </div>
        </div>
    );
};

export default HomePage;