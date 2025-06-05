import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { axiosInstance } from '../lib/axios';
import '../styles/HomePage.css';

const HomePage = () => {
    const { authUser } = useAuthStore();
    const [stats, setStats] = useState({
        tableCounts: [],
        topTrainers: [],
        financialSummary: null,
        loading: true,
        error: null
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setStats(prev => ({ ...prev, loading: true, error: null }));

            console.log('Fetching dashboard data...'); // Логування

            const [tableCountsRes, topTrainersRes, financialRes] = await Promise.all([
                axiosInstance.get('/auth/stats/table-counts'),
                axiosInstance.get('/auth/trainers/top-by-clients?limit=3'),
                axiosInstance.get('auth/financial/summary')
            ]);

            console.log('Data received:', { // Логування відповідей
                tableCounts: tableCountsRes.data,
                topTrainers: topTrainersRes.data,
                financialSummary: financialRes.data
            });

            setStats({
                tableCounts: tableCountsRes.data,
                topTrainers: topTrainersRes.data,
                financialSummary: financialRes.data,
                loading: false,
                error: null
            });
        } catch (error) {
            console.error('Error details:', error.response || error); // Детальніше логування

            let errorMessage = 'Failed to load dashboard data';
            if (error.response) {
                if (error.response.status === 401) {
                    errorMessage = 'Authentication required. Please login again.';
                } else if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                }
            }

            setStats(prev => ({
                ...prev,
                loading: false,
                error: errorMessage
            }));
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('uk-UA', {
            style: 'currency',
            currency: 'UAH'
        }).format(amount || 0);
    };

    const getTableDisplayName = (tableName) => {
        const names = {
            'clients': 'Клієнти',
            'staff': 'Персонал',
            'memberships': 'Абонементи',
            'sessions': 'Сесії',
            'reviews': 'Відгуки',
            'payments': 'Платежі',
            'championships': 'Чемпіонати',
            'qualifications': 'Кваліфікації'
        };
        return names[tableName] || tableName;
    };

    const getRatingStars = (rating) => {
        const numRating = parseFloat(rating);
        const fullStars = Math.floor(numRating);
        const hasHalfStar = numRating % 1 >= 0.5;

        return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0));
    };

    if (stats.loading) {
        return (
            <div className="home-container">
                <div className="loading-dashboard">
                    <div className="loading-spinner"></div>
                    <p>Завантаження даних...</p>
                </div>
            </div>
        );
    }

    if (stats.error) {
        return (
            <div className="home-container">
                <div className="error-message">
                    <p>{stats.error}</p>
                    <button onClick={fetchDashboardData} className="retry-button">
                        Спробувати знову
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="home-container">
            <div className="welcome-section">
                <h1>Вітаємо, {authUser?.fullName}!</h1>
                <p className="welcome-message">
                    Панель управління SportClub
                </p>
            </div>

            <div className="dashboard-grid">
                {/* Статистика таблиць */}
                <div className="dashboard-card">
                    <h3>Загальна статистика</h3>
                    <div className="stats-grid">
                        {stats.tableCounts
                            .filter(item => ['clients', 'staff', 'sessions', 'payments'].includes(item.table_name))
                            .map((item) => (
                                <div key={item.table_name} className="stat-item">
                                    <span className="stat-number">{item.total}</span>
                                    <span className="stat-label">{getTableDisplayName(item.table_name)}</span>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Топ тренери */}
                <div className="dashboard-card top-trainers-card">
                    <h3>Топ тренери за кількістю клієнтів</h3>
                    <div className="trainers-table-container">
                        {stats.topTrainers.length > 0 ? (
                            <table className="trainers-table">
                                <thead>
                                <tr>
                                    <th>Місце</th>
                                    <th>Ім'я тренера</th>
                                    <th>Клієнти</th>
                                    <th>Рейтинг</th>
                                    <th>Відгуки</th>
                                </tr>
                                </thead>
                                <tbody>
                                {stats.topTrainers.map((trainer, index) => (
                                    <tr key={trainer.staffId} className="trainer-row">
                                        <td className="rank-cell">
                                                <span className={`rank-badge rank-${index + 1}`}>
                                                    #{index + 1}
                                                </span>
                                        </td>
                                        <td className="name-cell">
                                            <div className="trainer-name-info">
                                                    <span className="trainer-full-name">
                                                        {trainer.firstName} {trainer.lastName}
                                                    </span>
                                                <span className="trainer-id">ID: {trainer.staffId}</span>
                                            </div>
                                        </td>
                                        <td className="clients-cell">
                                            <span className="client-count">{trainer.clientCount}</span>
                                        </td>
                                        <td className="rating-cell">
                                            <div className="rating-info">
                                                <span className="stars">{getRatingStars(trainer.avgRating)}</span>
                                                <span className="rating-value">{parseFloat(trainer.avgRating).toFixed(1)}</span>
                                            </div>
                                        </td>
                                        <td className="reviews-cell">
                                            <span className="review-count">{trainer.reviewCount}</span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="no-data">Немає даних про тренерів</p>
                        )}
                    </div>
                </div>

                {/* Фінансова інформація */}
                <div className="dashboard-card financial-card">
                    <h3>Фінансовий огляд</h3>
                    {stats.financialSummary ? (
                        <div className="financial-stats">
                            <div className="financial-item revenue">
                                <span className="financial-label">Загальний дохід</span>
                                <span className="financial-amount">
                                    {formatCurrency(stats.financialSummary.totalRevenue)}
                                </span>
                            </div>
                            <div className="financial-item expenses">
                                <span className="financial-label">Витрати на зарплати</span>
                                <span className="financial-amount">
                                    {formatCurrency(stats.financialSummary.totalSalaries)}
                                </span>
                            </div>
                            <div className="financial-item profit">
                                <span className="financial-label">Прибуток</span>
                                <span className="financial-amount">
                                    {formatCurrency(stats.financialSummary.totalRevenue - stats.financialSummary.totalSalaries)}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="no-data">Немає фінансових даних</p>
                    )}
                </div>
            </div>

            <div className="dashboard-actions">
                <button onClick={fetchDashboardData} className="refresh-button">
                    Оновити дані
                </button>
            </div>
        </div>
    );
};

export default HomePage;