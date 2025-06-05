// src/routes/api.js

import express from 'express';
import authController from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import Client from '../models/client.model.js';
import Staff from '../models/staff.model.js';
import Membership from '../models/membership.model.js';
import Session from '../models/session.model.js';
import Review from '../models/review.model.js';
import Payment from '../models/payment.model.js';
import Salary from '../models/salary.model.js';
import Championship from '../models/championship.model.js';
import ChampionshipParticipant from '../models/championshipParticipant.model.js';
import Qualification from '../models/qualifications.model.js';
import StaffQualification from '../models/staffQualifications.model.js';
import StaffSchedule from '../models/staffSchedule.model.js';
import Progress from '../models/progress.model.js';

const router = express.Router();

// Middleware для обробки помилок
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch((error) => {
        console.error(error);
        res.status(500).json({ error: error.message });
    });

// Маршрути автентифікації
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.put("/update-profile", authMiddleware.protectRoute, authController.updateProfile);
router.get("/check", authMiddleware.protectRoute, authController.checkAuth);

// Статистика та бізнес-аналітика
// 0. Перевірка кількості записів у таблицях
router.get(
    '/stats/table-counts',
    asyncHandler(async (req, res) => {
        const results = await Promise.all([
            Client.findAll().then((rows) => ({ table_name: 'clients', total: rows.length })),
            Staff.findAll().then((rows) => ({ table_name: 'staff', total: rows.length })),
            Membership.findAll().then((rows) => ({ table_name: 'memberships', total: rows.length })),
            Membership.getMembershipStats().then((stats) => ({
                table_name: 'client_memberships',
                total: stats.totalActiveClients,
            })),
            Session.findAll().then((rows) => ({ table_name: 'sessions', total: rows.length })),
            Session.getSessionStats().then((stats) => ({
                table_name: 'session_clients',
                total: stats.totalSessions,
            })),
            Review.findAll().then((rows) => ({ table_name: 'reviews', total: rows.length })),
            Payment.findAll().then((rows) => ({ table_name: 'payments', total: rows.length })),
            Salary.findAll().then((rows) => ({ table_name: 'salaries', total: rows.length })),
            Championship.findAll().then((rows) => ({ table_name: 'championships', total: rows.length })),
            ChampionshipParticipant.findAll().then((rows) => ({
                table_name: 'championship_participants',
                total: rows.length,
            })),
            Qualification.findAll().then((rows) => ({ table_name: 'qualifications', total: rows.length })),
            StaffQualification.findAll().then((rows) => ({
                table_name: 'staff_qualifications',
                total: rows.length,
            })),
            StaffSchedule.findAll().then((rows) => ({ table_name: 'staff_schedule', total: rows.length })),
            Progress.findAll().then((rows) => ({ table_name: 'progress', total: rows.length })),
        ]);

        res.json(results);
    })
);

// 1. Топ-тренери за кількістю клієнтів
router.get(
    '/trainers/top-by-clients',
    asyncHandler(async (req, res) => {
        const limit = parseInt(req.query.limit) || 5;
        const trainers = await Staff.getTopTrainers(limit);
        res.json(trainers);
    })
);

// 2. Середня тривалість тренувань за типом сесії
router.get(
    '/sessions/average-duration',
    asyncHandler(async (req, res) => {
        const durations = await Session.getAverageDurationByType();
        res.json(durations);
    })
);

// 3. Клієнти без відвідувань за 30+ днів
router.get(
    '/clients/inactive',
    asyncHandler(async (req, res) => {
        const clients = await Client.findInactiveClients();
        res.json(clients);
    })
);

// 4. Топ-рейтингові тренери
router.get(
    '/trainers/top-rated',
    asyncHandler(async (req, res) => {
        const limit = parseInt(req.query.limit) || 5;
        const trainers = await Review.getTopRatedTrainers(limit);
        res.json(trainers);
    })
);

// 6. Загальний дохід проти витрат на зарплати
router.get(
    '/financial/summary',
    asyncHandler(async (req, res) => {
        const summary = await Salary.getFinancialSummary();
        res.json(summary);
    })
);

// 7. Топ-клієнти за виплатами
router.get(
    '/clients/top-paying',
    asyncHandler(async (req, res) => {
        const limit = parseInt(req.query.limit) || 10;
        const clients = await Payment.getTopPayingClients(limit);
        res.json(clients);
    })
);

// 8. Найпопулярніші послуги за кварталами
router.get(
    '/memberships/popular-by-quarter',
    asyncHandler(async (req, res) => {
        const memberships = await Membership.getPopularByQuarter();
        res.json(memberships);
    })
);

// 9. Середня кількість клієнтів у групових сесіях
router.get(
    '/sessions/average-group-size',
    asyncHandler(async (req, res) => {
        const stats = await Session.getAverageGroupSize();
        res.json(stats);
    })
);

// 11. Найпоширеніші комбінації послуг
router.get(
    '/memberships/service-combinations',
    asyncHandler(async (req, res) => {
        const limit = parseInt(req.query.limit) || 10;
        const combinations = await Membership.getServiceCombinations(limit);
        res.json(combinations);
    })
);

// 12. Клієнти, які не продовжили абонементи
router.get(
    '/clients/non-renewed',
    asyncHandler(async (req, res) => {
        const clients = await Client.getNonRenewedClients();
        res.json(clients);
    })
);

// 14. Співвідношення витрат на персонал до доходу
router.get(
    '/financial/expense-income-ratio',
    asyncHandler(async (req, res) => {
        const ratio = await Salary.getExpenseIncomeRatio();
        res.json(ratio);
    })
);

export default router;