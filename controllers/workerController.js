const prisma = require("../config/prisma");

const { sendRequestAcceptedEmail, sendRequestCancelledEmail } = require("./mailController");
const { getDashboardOverview, getSummaryOnly, getTasksAndRequests } = require("../services/workerDashboardService");

const getWorkers = async (req, res) => {
     try {
          const workers = await prisma.users.findMany({
               where: {
                    role: 'worker'
               }
          })
          res.status(200).json(workers)
     } catch (error) {
          console.error('Error fetching users:', error)
          res.status(500).json({ error: 'Internal Server Error' })
     }
}

const createWorker = async (req, res) => {
     const { user_id, display_name, bio, years_experience, category_id, base_price, price_unit, skills, available_from, available_to, weekend, area_geometry } = req.body

     try {
          await prisma.worker_profiles.create({
               data: {
                    user_id,
                    display_name,
                    bio,
                    years_experience,
                    created_at: new Date()
               }
          })
          res.status(201).json({ message: 'Worker created successfully' })
     } catch (error) {
          res.status(500).json({ error: 'Internal Server Error' })
     }
}

const createWorkerService = async (req, res) => {
     const { user_id, category_id, base_price, price_unit, skills } = req.body

     try {
          await prisma.worker_services.create({
               data: {
                    user_id,
                    category_id,
                    base_price,
                    price_unit,
                    skills
               }
          })
          res.status(201).json({ message: 'Worker Service created successfully' })
     } catch (error) {
          res.status(500).json({ error: 'Internal Server Error' })
     }
}

const createWorkerAvailability = async (req, res) => {
     const { user_id, available_from, available_to, weekend } = req.body

     try {
          await prisma.availabilities.create({
               data: {
                    worker_id: user_id,
                    available_from: new Date(available_from),
                    available_to: new Date(available_to),
                    weekend
               }
          })
          res.status(201).json({ message: 'Worker Availability created successfully' })
     } catch (error) {
          res.status(500).json({ error: 'Internal Server Error' })
     }
}

const searchWorkers = async (req, res) => {
     const { categorySlug, lat, lon, radiusMeters } = req.query

     try {
          const workers = await prisma.$queryRaw`
          WITH cat AS (
            SELECT id FROM service_sections WHERE slug = ${categorySlug}
          )
          SELECT
            u.id AS user_id,
            u.profile_picture,
            wp.display_name,
            wp.avg_rating,
            a.lat,
            a.lon,
            ws.base_price,
            ST_Distance(
              ST_SetSRID(ST_MakePoint(a.lon, a.lat), 4326)::geography,
              ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography
            ) AS distance_m
          FROM worker_services ws
          JOIN users u ON ws.user_id = u.id
          JOIN worker_profiles wp ON wp.user_id = u.id
          LEFT JOIN addresses a ON a.user_id = u.id
          WHERE ws.section_id = (SELECT id FROM cat)
            AND wp.verification = 'verified'
            AND a.lat IS NOT NULL
            AND a.lon IS NOT NULL
            AND ST_DWithin(
              ST_SetSRID(ST_MakePoint(a.lon, a.lat), 4326)::geography,
              ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography,
              ${radiusMeters}
            )`;            
          res.status(200).json(workers)
     } catch (error) {
          console.error('Error searching workers:', error)
          res.status(500).json({ error: 'Internal Server Error' })
     }
}

const updateWorkerProfile = async (req, res) => {
     const { userId } = req.params;

     const {
          display_name,
          bio,
          years_experience,
          avg_rating,
          total_reviews,
          verification,
          documents_count
     } = req.body;

     try {
          const data = {
               ...(display_name !== undefined && { display_name }),
               ...(bio !== undefined && { bio }),
               ...(years_experience !== undefined && { years_experience }),
               ...(avg_rating !== undefined && { avg_rating }),
               ...(total_reviews !== undefined && { total_reviews }),
               ...(verification !== undefined && { verification }),
               ...(documents_count !== undefined && { documents_count })
          };

          if (Object.keys(data).length === 0) {
               return res.status(400).json({ error: "No valid fields to update" });
          }

          const updatedProfile = await prisma.workerProfile.update({
               where: { user_id: userId },
               data
          });

          res.status(200).json(updatedProfile);
     } catch (error) {
          console.error("Error updating worker profile:", error);
          res.status(500).json({ error: "Failed to update worker profile" });
     }
};

const updateWorkerService = async (req, res) => {
  const { id } = req.params;

  const {
    base_price,
    price_unit,
    skills,
    category_id
  } = req.body;

  try {
    const data = {
      ...(base_price !== undefined && { base_price }),
      ...(price_unit !== undefined && { price_unit }),
      ...(skills !== undefined && { skills }),
      ...(category_id !== undefined && { category_id })
    };

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const updatedService = await prisma.workerService.update({
      where: { id },
      data
    });

    res.status(200).json(updatedService);
  } catch (error) {
    console.error("Error updating worker service:", error);

    // Unique constraint violation (user_id + category_id)
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Service already exists for this category"
      });
    }

    res.status(500).json({ error: "Failed to update worker service" });
  }
};

const updateAvailability = async (req, res) => {
  const { id } = req.params;

  const {
    available_from,
    available_to,
    weekend
  } = req.body;

  try {
    const data = {
      ...(available_from !== undefined && {
        available_from: new Date(available_from)
      }),
      ...(available_to !== undefined && {
        available_to: new Date(available_to)
      }),
      ...(weekend !== undefined && { weekend })
    };

    if (
      data.available_from &&
      data.available_to &&
      data.available_from >= data.available_to
    ) {
      return res.status(400).json({
        error: "available_from must be before available_to"
      });
    }

    const updatedAvailability = await prisma.availability.update({
      where: { id },
      data
    });

    res.status(200).json(updatedAvailability);
  } catch (error) {
    console.error("Error updating availability:", error);
    res.status(500).json({ error: "Failed to update availability" });
  }
};

const getWorkerDetails = async (req, res) => {
  const { workerId } = req.params;

  try {
    // Fetch worker details with all related information
    const workerDetails = await prisma.users.findUnique({
      where: { id: workerId },
      select: {
        id: true,
        email: true,
        phone: true,
        full_name: true,
        role: true,
        gender: true,
        profile_picture: true, 
        // Worker profile
        worker_profiles: {
          select: {
            display_name: true,
            bio: true,
            years_experience: true,
            avg_rating: true,
            total_reviews: true,
          }
        },
        // Services offered by worker
        worker_services: {
          select: {
            id: true,
            base_price: true,
            price_unit: true,
            skills: true,
            service_categories: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true
              }
            }
          }
        },
        // Availability
        availabilities: {
          select: {
            id: true,
            available_from: true,
            available_to: true,
            weekend: true
          }
        },
        // Addresses
        addresses: {
          select: {
            id: true,
            street: true,
            city: true,
            district: true,
            postal_code: true,
          }
        },
        // Reviews received by worker
        reviews_reviews_worker_idTousers: {
          select: {
            id: true,
            rating: true,
            comment: true,
            users_reviews_reviewer_idTousers: {
              select: {
                id: true,
                full_name: true,
                profile_picture: true
              }
            }
          }
        }
      }
    });

    if (!workerDetails) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    
    // Check if user is actually a worker
    if (workerDetails.role !== 'worker') {
      return res.status(400).json({ error: 'User is not a worker' });
    }
    
    res.status(200).json(workerDetails);
  } catch (error) {
    console.error('Error fetching worker details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const cancelWorkRequest = async(req, res) => {
  const { orderId } = req.params;
  const { workerId } = req.body;
  const cancelReason = req.body.reason || '';

  try {
    // Validate input
    if (!orderId || !workerId) {
      return res.status(400).json({ error: 'Order ID and Worker ID are required' });
    }

    // Find the order
    const order = await prisma.orders.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if worker is assigned to this order
    if (order.assigned_worker_id !== workerId) {
      return res.status(403).json({ error: 'Worker is not assigned to this order' });
    }

    // Check if order status allows cancellation
    const cancellableStatuses = ['pending', 'accepted', 'in_progress'];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({ 
        error: `Order with status '${order.status}' cannot be cancelled` 
      });
    }

    // Update order status to cancelled
    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: {
        status: 'cancelled',
        updated_at: new Date()
      }
    });

    // Get worker details for email
    const worker = await prisma.users.findUnique({
      where: { id: workerId },
      select: { full_name: true }
    });

    // Get order address
    const orderAddress = await prisma.addresses.findUnique({
      where: { id: order.address_id }
    });
    const addressString = orderAddress ? 
      `${orderAddress.street || ''}, ${orderAddress.city || ''}, ${orderAddress.district || ''}`.replace(/^, |, $/g, '') : 
      'Not specified';

    // Create a notification for the client
    const client = await prisma.users.findUnique({
      where: { id: order.client_id }
    });

    if (client) {
      await prisma.notifications.create({
        data: {
          user_id: order.client_id,
          title: 'Work Request Cancelled',
          body: `The worker has cancelled the work request. Reason: ${cancelReason || 'No reason provided'}`,
          is_read: false
        }
      });

      // Send cancellation email to client
      if (client.email) {
        await sendRequestCancelledEmail({
          clientEmail: client.email,
          clientName: client.full_name,
          workerName: worker?.full_name || 'Worker',
          address: addressString,
          description: order.description,
          cancelReason: cancelReason,
          selectedTime: order.scheduled_at
        });
      }
    }

    res.status(200).json({ 
      message: 'Work request cancelled successfully',
      order: updatedOrder 
    });

  } catch (error) {
    console.error('Error cancelling work request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

const acceptWorkRequest = async(req, res) => {
  const { orderId } = req.params;
  const { workerId } = req.body;

  try {
    // Validate input
    if (!orderId || !workerId) {
      return res.status(400).json({ error: 'Order ID and Worker ID are required' });
    }

    // Find the order
    const order = await prisma.orders.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order status is pending
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        error: `Order with status '${order.status}' cannot be accepted` 
      });
    }

    // Check if worker is already assigned
    if (order.assigned_worker_id && order.assigned_worker_id !== workerId) {
      return res.status(403).json({ error: 'This order is already assigned to another worker' });
    }

    // Update order - assign worker and change status to accepted
    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: {
        assigned_worker_id: workerId,
        status: 'accepted',
        updated_at: new Date()
      },
      include: {
        users_orders_client_idTousers: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        addresses: true
      }
    });

    // Get worker details for email
    const worker = await prisma.users.findUnique({
      where: { id: workerId },
      select: { full_name: true }
    });

    // Get address string from included address
    const orderAddress = updatedOrder.addresses;
    const addressString = orderAddress ? 
      `${orderAddress.street || ''}, ${orderAddress.city || ''}, ${orderAddress.district || ''}`.replace(/^, |, $/g, '') : 
      'Not specified';

    // Create a notification for the client
    await prisma.notifications.create({
      data: {
        user_id: order.client_id,
        title: 'Work Request Accepted',
        body: 'A worker has accepted your work request and will be arriving soon.',
        is_read: false
      }
    });

    // Send acceptance email to client
    const clientData = updatedOrder.users_orders_client_idTousers;
    if (clientData && clientData.email) {
      await sendRequestAcceptedEmail({
        clientEmail: clientData.email,
        clientName: clientData.full_name,
        workerName: worker?.full_name || 'Worker',
        address: addressString,
        description: order.description,
        selectedTime: order.scheduled_at
      });
    }

    res.status(200).json({ 
      message: 'Work request accepted successfully',
      order: updatedOrder 
    });

  } catch (error) {
    console.error('Error accepting work request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

/**
 * Get Worker Dashboard Summary Cards Only
 * Returns only the summary card data for the worker dashboard
 * @route GET /api/workerRoutes/dashboard/summary/:email
 */
const getWorkerDashboardSummary = async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required' 
      });
    }

    // Fetch worker by email
    const worker = await prisma.users.findUnique({
      where: { email: email },
      select: { id: true, role: true, full_name: true }
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    if (worker.role !== 'worker') {
      return res.status(403).json({ 
        error: 'Access denied. This endpoint is only accessible to workers.' 
      });
    }

    const workerId = worker.id;

    // Get summary cards data only
    const summaryData = await getSummaryOnly(workerId);

    res.status(200).json({
      success: true,
      worker_name: worker.full_name,
      ...summaryData
    });

  } catch (error) {
    console.error('Error fetching worker dashboard summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch summary data',
      message: error.message 
    });
  }
};

/**
 * Get Worker Dashboard Tasks and Requests
 * Returns today's works, upcoming works, and service requests
 * @route GET /api/workerRoutes/dashboard/tasks/:email
 */
const getWorkerDashboardTasks = async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required' 
      });
    }

    // Fetch worker by email
    const worker = await prisma.users.findUnique({
      where: { email: email },
      select: { id: true, role: true, full_name: true }
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    if (worker.role !== 'worker') {
      return res.status(403).json({ 
        error: 'Access denied. This endpoint is only accessible to workers.' 
      });
    }

    const workerId = worker.id;

    // Get tasks and requests data
    const tasksData = await getTasksAndRequests(workerId);

    res.status(200).json({
      success: true,
      worker_name: worker.full_name,
      ...tasksData
    });

  } catch (error) {
    console.error('Error fetching worker dashboard tasks:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tasks data',
      message: error.message 
    });
  }
};

/**
 * Get Worker Details by Email
 * Returns worker profile and related information for dashboard
 * @route GET /api/workerRoutes/dashboard/details/:email
 */
const getWorkerDetailsByEmail = async (req, res) => {
  const { email } = req.params;

  try {
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Fetch worker details with all related information
    const workerDetails = await prisma.users.findUnique({
      where: { email: email },
      select: {
        id: true,
        email: true,
        phone: true,
        full_name: true,
        gender: true,
        role: true,
        date_of_birth: true,
        profile_picture: true,
        created_at: true,
        last_login_at: true,
        is_active: true,
        // Worker profile
        worker_profiles: {
          select: {
            display_name: true,
            bio: true,
            years_experience: true,
            avg_rating: true,
            total_reviews: true,
            verification: true,
            documents_count: true,
            created_at: true,
            updated_at: true
          }
        },
        // Services offered by worker
        worker_services: {
          select: {
            id: true,
            base_price: true,
            price_unit: true,
            skills: true,
            created_at: true,
            service_categories: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true
              }
            },
            service_sections: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true
              }
            }
          }
        },
        // Availability
        availabilities: {
          select: {
            id: true,
            available_from: true,
            available_to: true,
            weekend: true
          }
        },
        // Addresses
        addresses: {
          select: {
            id: true,
            street: true,
            city: true,
            district: true,
            postal_code: true,
            lat: true,
            lon: true
          }
        },
        // Reviews received by worker
        reviews_reviews_worker_idTousers: {
          select: {
            id: true,
            rating: true,
            comment: true,
            created_at: true,
            users_reviews_reviewer_idTousers: {
              select: {
                id: true,
                full_name: true,
                profile_picture: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          },
          take: 10
        }
      }
    });

    if (!workerDetails) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Check if user is actually a worker
    if (workerDetails.role !== 'worker') {
      return res.status(403).json({ error: 'User is not a worker' });
    }

    res.status(200).json({
      success: true,
      data: workerDetails
    });
  } catch (error) {
    console.error('Error fetching worker details by email:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { getWorkers, searchWorkers, createWorker, createWorkerService, createWorkerAvailability, updateWorkerProfile, updateWorkerService, updateAvailability, getWorkerDetails, cancelWorkRequest, acceptWorkRequest, getWorkerDashboardSummary, getWorkerDashboardTasks, getWorkerDetailsByEmail };