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
        avgSessionDuration: [],
        inactiveClients: [],
        topRatedTrainers: [],
        topPayingClients: [],
        popularMemberships: [],
        avgGroupSize: null,
        serviceCombinations: [],
        nonRenewedClients: [],
        expenseIncomeRatio: null,
        loading: true,
        error: null
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setStats(prev => ({ ...prev, loading: true, error: null }));

            console.log('Завантаження даних панелі управління...');

            const [
                tableCountsRes,
                topTrainersRes,
                financialRes,
                avgSessionDurationRes,
                inactiveClientsRes,
                topRatedTrainersRes,
                topPayingClientsRes,
                popularMembershipsRes,
                avgGroupSizeRes,
                serviceCombinationsRes,
                nonRenewedClientsRes,
                expenseIncomeRatioRes
            ] = await Promise.all([
                axiosInstance.get('/auth/stats/table-counts'),
                axiosInstance.get('/auth/trainers/top-by-clients?limit=5'),
                axiosInstance.get('/auth/financial/summary'),
                axiosInstance.get('/auth/sessions/average-duration'),
                axiosInstance.get('/auth/clients/inactive'),
                axiosInstance.get('/auth/trainers/top-rated'),
                axiosInstance.get('/auth/clients/top-paying'),
                axiosInstance.get('/auth/memberships/popular-by-quarter'),
                axiosInstance.get('/auth/sessions/average-group-size'),
                axiosInstance.get('/auth/memberships/service-combinations'),
                axiosInstance.get('/auth/clients/non-renewed'),
                axiosInstance.get('/auth/financial/expense-income-ratio')
            ]);

            console.log('Дані отримано:', {
                tableCounts: tableCountsRes.data,
                topTrainers: topTrainersRes.data,
                financialSummary: financialRes.data,
                avgSessionDuration: avgSessionDurationRes.data,
                inactiveClients: inactiveClientsRes.data,
                topRatedTrainers: topRatedTrainersRes.data,
                topPayingClients: topPayingClientsRes.data,
                popularMemberships: popularMembershipsRes.data,
                avgGroupSize: avgGroupSizeRes.data,
                serviceCombinations: serviceCombinationsRes.data,
                nonRenewedClients: nonRenewedClientsRes.data,
                expenseIncomeRatio: expenseIncomeRatioRes.data
            });

            setStats({
                tableCounts: tableCountsRes.data,
                topTrainers: topTrainersRes.data,
                financialSummary: financialRes.data,
                avgSessionDuration: avgSessionDurationRes.data,
                inactiveClients: inactiveClientsRes.data,
                topRatedTrainers: topRatedTrainersRes.data,
                topPayingClients: topPayingClientsRes.data,
                popularMemberships: popularMembershipsRes.data,
                avgGroupSize: avgGroupSizeRes.data,
                serviceCombinations: serviceCombinationsRes.data,
                nonRenewedClients: nonRenewedClientsRes.data,
                expenseIncomeRatio: expenseIncomeRatioRes.data,
                loading: false,
                error: null
            });
        } catch (error) {
            console.error('Помилка:', error.response || error);

            let errorMessage = 'Не вдалося завантажити дані панелі управління';
            if (error.response) {
                if (error.response.status === 401) {
                    errorMessage = 'Потрібна авторизація. Будь ласка, увійдіть в систему знову.';
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

    const getSessionTypeDisplayName = (typeName) => {
        const names = {
            'group': 'Групова',
            'personal': 'Персональна',
            'solo': 'Самостійна'
        };
        return names[typeName] || typeName;
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
                    Система управління спортивним клубом
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

                {/* 1. Топ тренери за кількістю клієнтів */}
                <div className="dashboard-card top-trainers-card">
                    <h3>1. Тренери з найбільшою кількістю клієнтів</h3>
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

                {/* 2. Середня тривалість тренувань по секціях */}
                <div className="dashboard-card">
                    <h3>2. Середня тривалість тренувань по секціях</h3>
                    {stats.avgSessionDuration && stats.avgSessionDuration.length > 0 ? (
                        <div className="session-duration-stats">
                            {stats.avgSessionDuration.map(session => (
                                <div key={session.sessionType} className="session-type-duration">
                                    <span className="session-type">{getSessionTypeDisplayName(session.sessionType)}</span>
                                    <span className="session-duration">{parseFloat(session.avgDurationMinutes).toFixed(0)} хв</span>
                                </div>
                            ))}
                            {stats.avgGroupSize && (
                                <div className="session-type-duration">
                                    <span className="session-type">Середній розмір групи</span>
                                    <span className="session-duration">{Math.round(parseFloat(stats.avgGroupSize.avgGroupSize))}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="no-data">Немає даних про тривалість сесій</p>
                    )}
                </div>

                {/* 3. Неактивні клієнти */}
                <div className="dashboard-card">
                    <h3>3. Клієнти, які відвідують клуб нерегулярно</h3>
                    {stats.inactiveClients && stats.inactiveClients.length > 0 ? (
                        <div className="inactive-clients">
                            <div className="clients-summary">
                                <span className="summary-count">{stats.inactiveClients.length}</span>
                                <span className="summary-label">неактивних клієнтів (30+ днів)</span>
                            </div>
                            <ul className="clients-list">
                                {stats.inactiveClients.slice(0, 5).map(client => (
                                    <li key={client.clientId} className="client-item">
                                        {client.firstName} {client.lastName} (ID: {client.clientId})
                                    </li>
                                ))}
                                {stats.inactiveClients.length > 5 && (
                                    <li className="more-clients">
                                        ...та ще {stats.inactiveClients.length - 5} клієнтів
                                    </li>
                                )}
                            </ul>
                            <p className="action-suggestion">
                                Рекомендуємо запропонувати цим клієнтам спеціальні пропозиції для відновлення відвідування.
                            </p>
                        </div>
                    ) : (
                        <p className="no-data">Немає неактивних клієнтів</p>
                    )}
                </div>

                {/* 4. Топ тренери за рейтингом */}
                <div className="dashboard-card">
                    <h3>4. Тренери з найвищим рейтингом</h3>
                    {stats.topRatedTrainers && stats.topRatedTrainers.length > 0 ? (
                        <div className="top-rated-trainers">
                            <table className="trainers-table">
                                <thead>
                                <tr>
                                    <th>Місце</th>
                                    <th>Ім'я тренера</th>
                                    <th>Рейтинг</th>
                                    <th>Відгуки</th>
                                </tr>
                                </thead>
                                <tbody>
                                {stats.topRatedTrainers.slice(0, 5).map((trainer, index) => (
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
                        </div>
                    ) : (
                        <p className="no-data">Немає даних про рейтинги тренерів</p>
                    )}
                </div>

                {/* 6 та 14. Фінансова інформація */}
                <div className="dashboard-card financial-card">
                    <h3>6 та 14. Фінансовий огляд та співвідношення витрат</h3>
                    {stats.financialSummary ? (
                        <div className="financial-stats">
                            <div className="financial-item revenue">
                                <span className="financial-label">Дохід</span>
                                <span className="financial-amount">
                                    +{formatCurrency(stats.financialSummary[0]?.total || 0)}
                                </span>
                            </div>
                            <div className="financial-item expenses">
                                <span className="financial-label">Витрати на зарплати</span>
                                <span className="financial-amount">
                                    -{formatCurrency(stats.financialSummary[1]?.total || 0)}
                                </span>
                            </div>
                            {stats.expenseIncomeRatio && (
                                <div className="financial-item ratio">
                                    <span className="financial-label">Співвідношення витрат до доходів</span>
                                    <span className="financial-amount">
                                        {parseFloat(stats.expenseIncomeRatio.expenseIncomeRatio).toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="no-data">Немає фінансових даних</p>
                    )}
                </div>

                {/* 7. Топ клієнти за оплатою */}
                <div className="dashboard-card">
                    <h3>7. Клієнти, які купують найдорожчі абонементи</h3>
                    {stats.topPayingClients && stats.topPayingClients.length > 0 ? (
                        <div className="top-paying-clients">
                            <table className="clients-table">
                                <thead>
                                <tr>
                                    <th>Клієнт</th>
                                    <th>Загальна сума</th>
                                    <th>К-сть платежів</th>
                                    <th>Середній платіж</th>
                                </tr>
                                </thead>
                                <tbody>
                                {stats.topPayingClients.slice(0, 5).map((client) => (
                                    <tr key={client.clientId} className="client-row">
                                        <td className="client-name">
                                            <div className="client-info">
                                                <span className="client-full-name">{client.clientName}</span>
                                                <span className="client-email">{client.email}</span>
                                            </div>
                                        </td>
                                        <td className="total-paid">
                                            {formatCurrency(client.totalPaid)}
                                        </td>
                                        <td className="payment-count">
                                            {client.paymentCount}
                                        </td>
                                        <td className="average-payment">
                                            {formatCurrency(client.averagePayment)}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="no-data">Немає даних про платежі клієнтів</p>
                    )}
                </div>

                {/* 8. Популярні абонементи по кварталах */}
                <div className="dashboard-card">
                    <h3>8. Найбільш рентабельні послуги для клубу</h3>
                    {stats.popularMemberships && stats.popularMemberships.length > 0 ? (
                        <div className="popular-memberships">
                            {[1, 2, 3, 4].map(quarter => (
                                <div key={quarter} className="quarter-memberships">
                                    <h4>Квартал {quarter}</h4>
                                    <ul className="membership-list">
                                        {stats.popularMemberships
                                            .filter(m => m.quarter === quarter)
                                            .sort((a, b) => b.totalPurchases - a.totalPurchases)
                                            .map(membership => (
                                                <li key={`${quarter}-${membership.name}`} className="membership-item">
                                                    <span className="membership-name">{membership.name}</span>
                                                    <span className="membership-count">{membership.totalPurchases}</span>
                                                </li>
                                            ))}
                                        {stats.popularMemberships.filter(m => m.quarter === quarter).length === 0 && (
                                            <li className="no-data-quarter">Немає даних</li>
                                        )}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-data">Немає даних про популярні абонементи</p>
                    )}
                </div>

                {/* 9. Середня відвідуваність групових занять */}
                <div className="dashboard-card">
                    <h3>9. Середня відвідуваність групових занять</h3>
                    {stats.avgGroupSize ? (
                        <div className="group-attendance">
                            <div className="group-attendance-stats">
                                <div className="attendance-item">
                                    <span className="attendance-label">Середній розмір групи</span>
                                    <span className="attendance-value">
                                        {Math.round(parseFloat(stats.avgGroupSize.avgGroupSize))} клієнтів
                                    </span>
                                </div>
                            </div>
                            <div className="attendance-info">
                                <p>Статистика базується на даних усіх групових занять. Оптимальний розмір групи залежить від типу заняття та розміру приміщення.</p>
                            </div>
                        </div>
                    ) : (
                        <p className="no-data">Немає даних про відвідуваність групових занять</p>
                    )}
                </div>

                {/* 11. Поширені комбінації послуг */}
                <div className="dashboard-card">
                    <h3>11. Найпоширеніші комбінації занять серед клієнтів</h3>
                    {stats.serviceCombinations && stats.serviceCombinations.length > 0 ? (
                        <div className="service-combinations">
                            <ul className="combinations-list">
                                {Array.from(new Set(stats.serviceCombinations.map(item => item.combo))).map(combo => (
                                    <li key={combo} className="combination-item">
                                        <span className="combo-name">{combo}</span>
                                        <span className="combo-count">
                                            {stats.serviceCombinations.filter(item => item.combo === combo).length} клієнтів
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="no-data">Немає даних про комбінації послуг</p>
                    )}
                </div>

                {/* 12. Клієнти без продовження абонементу */}
                <div className="dashboard-card">
                    <h3>12. Клієнти, які не продовжують абонемент</h3>
                    {stats.nonRenewedClients && stats.nonRenewedClients.length > 0 ? (
                        <div className="non-renewed-clients">
                            <div className="clients-summary">
                                <span className="summary-count">{stats.nonRenewedClients.length}</span>
                                <span className="summary-label">клієнтів без продовження</span>
                            </div>
                            <ul className="clients-list">
                                {stats.nonRenewedClients.slice(0, 5).map(client => (
                                    <li key={client.clientId} className="client-item">
                                        {client.firstName} {client.lastName} (ID: {client.clientId})
                                    </li>
                                ))}
                                {stats.nonRenewedClients.length > 5 && (
                                    <li className="more-clients">
                                        ...та ще {stats.nonRenewedClients.length - 5} клієнтів
                                    </li>
                                )}
                            </ul>
                            <p className="action-suggestion">
                                Рекомендуємо зв'язатися з цими клієнтами та запропонувати спеціальні умови для повернення.
                            </p>
                        </div>
                    ) : (
                        <p className="no-data">Немає клієнтів без продовження</p>
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