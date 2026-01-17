const prisma = require("../config/prisma");

/**
 * Get the start and end of a given date (timezone-safe)
 * @param {Date} date 
 * @returns {Object} { startOfDay, endOfDay }
 */
const getDayBounds = (date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return { startOfDay, endOfDay };
};

/**
 * Calculate countdown/time until a given datetime
 * @param {Date} targetTime 
 * @returns {string}
 */
const calculateCountdown = (targetTime) => {
    const now = new Date();
    const diff = new Date(targetTime) - now;
    
    if (diff <= 0) return "Started";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

/**
 * Calculate days until a given date
 * @param {Date} targetDate 
 * @returns {number}
 */
const calculateDaysUntil = (targetDate) => {
    const now = new Date();
    const target = new Date(targetDate);
    
    // Reset time parts for accurate day calculation
    now.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    
    const diff = target - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Get summary cards data for worker dashboard
 * @param {string} workerId 
 * @returns {Promise<Object>}
 */
const getSummaryCards = async (workerId) => {
    const today = new Date();
    const { startOfDay, endOfDay } = getDayBounds(today);
    
    // Get today's appointments count
    const todaysAppointments = await prisma.orders.count({
        where: {
            assigned_worker_id: workerId,
            selected_time: {
                gte: startOfDay,
                lte: endOfDay
            },
            status: {
                notIn: ['cancelled', 'cart']
            }
        }
    });
    
    // Get confirmed count (accepted or in_progress)
    const confirmed = await prisma.orders.count({
        where: {
            assigned_worker_id: workerId,
            selected_time: {
                gte: startOfDay,
                lte: endOfDay
            },
            status: {
                in: ['accepted', 'in_progress']
            }
        }
    });
    
    // Get pending count
    const pending = await prisma.orders.count({
        where: {
            assigned_worker_id: workerId,
            status: 'pending'
        }
    });
    
    // Calculate available slots (assuming 8 slots per day - configurable)
    const MAX_DAILY_SLOTS = 8;
    const availableSlots = Math.max(0, MAX_DAILY_SLOTS - todaysAppointments);
    
    return {
        todaysAppointments,
        confirmed,
        pending,
        availableSlots
    };
};

/**
 * Get today's works for worker
 * @param {string} workerId 
 * @returns {Promise<Array>}
 */
const getTodaysWorks = async (workerId) => {
    const today = new Date();
    const { startOfDay, endOfDay } = getDayBounds(today);
    
    const orders = await prisma.orders.findMany({
        where: {
            assigned_worker_id: workerId,
            selected_time: {
                gte: startOfDay,
                lte: endOfDay
            },
            status: {
                in: ['accepted', 'in_progress']
            }
        },
        select: {
            id: true,
            selected_time: true,
            address: true,
            status: true,
            description: true,
            users_orders_client_idTousers: {
                select: {
                    id: true,
                    full_name: true,
                    email: true,
                    phone: true
                }
            }
        },
        orderBy: {
            selected_time: 'asc'
        }
    });
    
    return orders.map(order => ({
        booking_id: order.id,
        client_name: order.users_orders_client_idTousers?.full_name || 'Unknown',
        client_email: order.users_orders_client_idTousers?.email || null,
        client_phone: order.users_orders_client_idTousers?.phone || null,
        service_name: order.description || 'Service',
        start_time: order.selected_time,
        countdown: order.selected_time ? calculateCountdown(order.selected_time) : null,
        location: order.address || 'Not specified',
        status: order.status
    }));
};

/**
 * Get upcoming works for worker (beyond today)
 * @param {string} workerId 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
const getUpcomingWorks = async (workerId, limit = 10) => {
    const today = new Date();
    const { endOfDay } = getDayBounds(today);
    
    const orders = await prisma.orders.findMany({
        where: {
            assigned_worker_id: workerId,
            selected_time: {
                gt: endOfDay
            },
            status: {
                in: ['accepted', 'pending']
            }
        },
        select: {
            id: true,
            selected_time: true,
            address: true,
            status: true,
            description: true,
            users_orders_client_idTousers: {
                select: {
                    id: true,
                    full_name: true,
                    email: true
                }
            }
        },
        orderBy: {
            selected_time: 'asc'
        },
        take: limit
    });
    
    return orders.map(order => ({
        booking_id: order.id,
        client_name: order.users_orders_client_idTousers?.full_name || 'Unknown',
        service_name: order.description || 'Service',
        date_time: order.selected_time,
        days_until: order.selected_time ? calculateDaysUntil(order.selected_time) : null,
        location: order.address || 'Not specified',
        status: order.status
    }));
};

/**
 * Get calendar summary for upcoming days
 * @param {string} workerId 
 * @param {number} days 
 * @returns {Promise<Array>}
 */
const getUpcomingDays = async (workerId, days = 7) => {
    const MAX_DAILY_SLOTS = 8;
    const result = [];
    
    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const { startOfDay, endOfDay } = getDayBounds(date);
        
        const totalAppointments = await prisma.orders.count({
            where: {
                assigned_worker_id: workerId,
                selected_time: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                status: {
                    notIn: ['cancelled', 'cart']
                }
            }
        });
        
        result.push({
            date: startOfDay.toISOString().split('T')[0],
            day_name: startOfDay.toLocaleDateString('en-US', { weekday: 'short' }),
            total_appointments: totalAppointments,
            available_slots: Math.max(0, MAX_DAILY_SLOTS - totalAppointments)
        });
    }
    
    return result;
};

/**
 * Get pending service requests for worker
 * @param {string} workerId 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
const getServiceRequests = async (workerId, limit = 10) => {
    const orders = await prisma.orders.findMany({
        where: {
            assigned_worker_id: workerId,
            status: 'pending'
        },
        select: {
            id: true,
            description: true,
            address: true,
            selected_time: true,
            created_at: true,
            users_orders_client_idTousers: {
                select: {
                    id: true,
                    full_name: true,
                    email: true,
                    phone: true
                }
            }
        },
        orderBy: {
            created_at: 'desc'
        },
        take: limit
    });
    
    return orders.map(order => ({
        request_id: order.id,
        user_name: order.users_orders_client_idTousers?.full_name || 'Unknown',
        task_name: order.description || 'Service Request',
        location: order.address || 'Not specified',
        email: order.users_orders_client_idTousers?.email || null,
        phone: order.users_orders_client_idTousers?.phone || null,
        scheduled_time: order.selected_time,
        requested_at: order.created_at,
        status: 'PENDING'
    }));
};

/**
 * Get complete dashboard overview data
 * @param {string} workerId 
 * @returns {Promise<Object>}
 */
const getDashboardOverview = async (workerId) => {
    // Execute all queries in parallel for efficiency
    const [summary, todaysWorks, upcomingWorks, upcomingDays, serviceRequests] = await Promise.all([
        getSummaryCards(workerId),
        getTodaysWorks(workerId),
        getUpcomingWorks(workerId),
        getUpcomingDays(workerId),
        getServiceRequests(workerId)
    ]);
    
    return {
        summary,
        todaysWorks,
        upcomingWorks,
        upcomingDays,
        serviceRequests
    };
};

module.exports = {
    getDashboardOverview,
    getSummaryCards,
    getTodaysWorks,
    getUpcomingWorks,
    getUpcomingDays,
    getServiceRequests
};
