const prisma = require('../config/prisma');

const getComplaints = async (req, res) => { 
    try {
        const { status, category, priority } = req.query;
        
        // Build the where clause dynamically based on query parameters
        const whereClause = {};

        if (status) {
            whereClause.status = status;
        }

        if (category) {
            whereClause.category = category;
        }

        if (priority) {
            whereClause.priority = priority;
        }

        const complaints = await prisma.complaints.findMany({
            where: whereClause,
            orderBy: {
                created_at: 'desc'
            }
        });

        res.status(200).json({
            success: true,
            data: complaints,
            count: complaints.length
        });
    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal Server Error' 
        });
    }
};

const getComplaintById = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch complaint with all details
        const complaint = await prisma.complaints.findUnique({
            where: { id },
            select: {
                id: true,
                raised_by_user_id: true,
                raised_by_role: true,
                against_user_id: true,
                booking_id: true,
                payment_id: true,
                category: true,
                sub_category: true,
                priority: true,
                description: true,
                attachments: true,
                status: true,
                admin_notes: true,
                resolution: true,
                created_at: true,
                updated_at: true,
                resolved_at: true
            }
        });

        if (!complaint) {
            return res.status(404).json({
                success: false,
                error: 'Complaint not found'
            });
        }

        // Fetch the user who raised the complaint
        const raisedByUser = await prisma.users.findUnique({
            where: { id: complaint.raised_by_user_id },
            select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
                profile_picture: true,
                role: true
            }
        });

        // Fetch the user against whom the complaint is raised
        const againstUser = await prisma.users.findUnique({
            where: { id: complaint.against_user_id },
            select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
                profile_picture: true,
                role: true
            }
        });

        // Fetch booking details
        const booking = await prisma.orders.findUnique({
            where: { id: complaint.booking_id },
            select: {
                id: true,
                status: true,
                selected_time: true,
                total_amount: true,
                description: true,
                address: true,
                work_start: true,
                work_end: true,
                created_at: true
            }
        });

        // Fetch payment details if payment_id exists
        let payment = null;
        if (complaint.payment_id) {
            payment = await prisma.payments.findUnique({
                where: { id: complaint.payment_id },
                select: {
                    id: true,
                    amount: true,
                    status: true,
                    payment_method: true,
                    trx_id: true,
                    paid_at: true,
                    created_at: true
                }
            });
        }

        // Format the response
        const complaintDetails = {
            id: complaint.id,
            raisedBy: {
                id: raisedByUser?.id,
                name: raisedByUser?.full_name,
                email: raisedByUser?.email,
                phone: raisedByUser?.phone,
                avatar: raisedByUser?.profile_picture,
                role: raisedByUser?.role
            },
            against: {
                id: againstUser?.id,
                name: againstUser?.full_name,
                email: againstUser?.email,
                phone: againstUser?.phone,
                avatar: againstUser?.profile_picture,
                role: againstUser?.role
            },
            booking: booking ? {
                id: booking.id,
                status: booking.status,
                scheduledTime: booking.selected_time,
                totalAmount: booking.total_amount,
                description: booking.description,
                address: booking.address,
                workStart: booking.work_start,
                workEnd: booking.work_end,
                createdAt: booking.created_at
            } : null,
            payment: payment ? {
                id: payment.id,
                amount: payment.amount,
                status: payment.status,
                method: payment.payment_method,
                transactionId: payment.trx_id,
                paidAt: payment.paid_at,
                createdAt: payment.created_at
            } : null,
            category: complaint.category,
            subCategory: complaint.sub_category,
            priority: complaint.priority,
            description: complaint.description,
            attachments: complaint.attachments,
            status: complaint.status,
            adminNotes: complaint.admin_notes,
            resolution: complaint.resolution,
            createdAt: complaint.created_at,
            updatedAt: complaint.updated_at,
            resolvedAt: complaint.resolved_at
        };

        res.status(200).json({
            success: true,
            data: complaintDetails
        });
    } catch (error) {
        console.error('Error fetching complaint:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal Server Error' 
        });
    }
};

const updateComplaintStatus = async (req, res) => {
          console.log("update hit");

    try {
        const { id } = req.params;
        const { status, admin_notes, resolution } = req.body;

        const updateData = {
            updated_at: new Date()
        };

        if (status) {
            updateData.status = status;
            if (status === 'resolved' || status === 'closed') {
                updateData.resolved_at = new Date();
            }
        }

        if (admin_notes) {
            updateData.admin_notes = admin_notes;
        }

        if (resolution) {
            updateData.resolution = resolution;
        }

        const complaint = await prisma.complaints.update({
            where: {
                id: id
            },
            data: updateData
        });

        res.status(200).json({
            success: true,
            message: 'Complaint updated successfully',
            data: complaint
        });
    } catch (error) {
        console.error('Error updating complaint:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal Server Error' 
        });
    }
};

module.exports = {
    getComplaints,
    getComplaintById,
    updateComplaintStatus
};
