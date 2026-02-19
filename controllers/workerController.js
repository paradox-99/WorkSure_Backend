const prisma = require("../config/prisma");

const { sendRequestAcceptedEmail, sendRequestCancelledEmail } = require("./mailController");
const { getSummaryOnly, getTasksAndRequests } = require("../services/workerDashboardService");

const getWorkers = async (req, res) => {
  try {
    const workers = await prisma.users.findMany({
      where: {
        role: 'worker'
      },
      include: {
        worker_profiles: {
          select: {
            display_name: true,
            avg_rating: true,
            total_reviews: true,
            verification: true,
            documents_count: true,
            years_experience: true
          }
        },
        addresses: {
          select: {
            id: true,
            city: true,
            district: true
          }
        },
        worker_services: {
          select: {
            id: true,
            base_price: true,
            price_unit: true,
            service_sections: {
              select: {
                name: true,
                slug: true
              }
            },
            service_categories: {
              select: {
                name: true,
                slug: true
              }
            }
          }
        },
        _count: {
          select: {
            orders_orders_assigned_worker_idTousers: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    const formattedWorkers = workers.map(worker => {
      // Get primary service category
      const primaryService = worker.worker_services[0];
      const category = primaryService?.service_categories?.name || primaryService?.service_sections?.name || 'Not specified';

      return {
        id: worker.id,
        name: worker.full_name || worker.worker_profiles?.display_name,
        phone: worker.phone,
        profile_picture: worker.profile_picture,
        category: category,
        verification: worker.worker_profiles?.verification || 'unverified',
        avg_rating: worker.worker_profiles?.avg_rating ? parseFloat(worker.worker_profiles.avg_rating) : 0.0,
        total_reviews: worker.worker_profiles?.total_reviews || 0,
        services_count: worker.worker_services.length,
        documents_count: worker.worker_profiles?.documents_count || 0,
        status: worker.status,
        years_experience: worker.worker_profiles?.years_experience || 0,
        total_hirings: worker._count.orders_orders_assigned_worker_idTousers,
        created_at: worker.created_at
      };
    });

    res.status(200).json(formattedWorkers);
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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
    // Validate required parameters
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const radius = radiusMeters || 10000; // Default 10km radius

    // First, find all workers within the given radius with their services
    const workersInRadius = await prisma.$queryRaw`
      SELECT DISTINCT
        u.id AS user_id,
        u.full_name,
        u.profile_picture,
        wp.display_name,
        wp.avg_rating,
        wp.total_reviews,
        a.lat,
        a.lon,
        a.city,
        a.district,
        ST_Distance(
          ST_SetSRID(ST_MakePoint(a.lon, a.lat), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${parseFloat(lon)}, ${parseFloat(lat)}), 4326)::geography
        ) AS distance_m
      FROM users u
      JOIN worker_profiles wp ON wp.user_id = u.id
      LEFT JOIN addresses a ON a.user_id = u.id
      WHERE u.role = 'worker'
        AND wp.verification = 'verified'
        AND u.status = 'active'
        AND a.lat IS NOT NULL
        AND a.lon IS NOT NULL
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(a.lon, a.lat), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${parseFloat(lon)}, ${parseFloat(lat)}), 4326)::geography,
          ${parseFloat(radius)}
        )
      ORDER BY distance_m ASC`;

    let workers = workersInRadius;

    // If categorySlug is provided, filter workers by service_sections slug
    if (categorySlug) {
      // Get the section ID for the given slug
      const section = await prisma.service_sections.findFirst({
        where: { slug: categorySlug },
        select: { id: true }
      });

      if (!section) {
        return res.status(404).json({
          error: 'Service category not found',
          categorySlug
        });
      }

      // Get worker IDs that offer this service
      const workerServices = await prisma.worker_services.findMany({
        where: { section_id: section.id },
        select: {
          user_id: true,
          base_price: true,
          price_unit: true
        }
      });

      const workerServiceMap = new Map(
        workerServices.map(ws => [ws.user_id, { base_price: ws.base_price, price_unit: ws.price_unit }])
      );

      // Filter workers who offer this service and add pricing info
      workers = workersInRadius
        .filter(worker => workerServiceMap.has(worker.user_id))
        .map(worker => ({
          ...worker,
          base_price: workerServiceMap.get(worker.user_id).base_price,
          price_unit: workerServiceMap.get(worker.user_id).price_unit
        }));
    }

    res.status(200).json({
      success: true,
      count: workers.length,
      categorySlug: categorySlug || null,
      radiusMeters: parseFloat(radius),
      workers
    });
  } catch (error) {
    console.error('Error searching workers:', error)
    res.status(500).json({ error: 'Internal Server Error', message: error.message })
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
            users_reviews_user_idTousers: {
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

    // Fetch basic worker details first (faster query)
    const worker = await prisma.users.findUnique({
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
        status: true,
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
        }
      }
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Check if user is actually a worker
    if (worker.role !== 'worker') {
      return res.status(403).json({ error: 'User is not a worker' });
    }

    // Fetch additional data in a single transaction (uses one connection)
    const [workerServices, availabilities, addresses, reviews] = await prisma.$transaction(async (tx) => {
      return Promise.all([
        // Services offered by worker
        tx.worker_services.findMany({
          where: { user_id: worker.id },
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
        }),
        // Availability
        tx.availabilities.findMany({
          where: { user_id: worker.id },
          select: {
            id: true,
            available_from: true,
            available_to: true,
            weekend: true
          }
        }),
        // Addresses
        tx.addresses.findMany({
          where: { user_id: worker.id },
          select: {
            id: true,
            street: true,
            city: true,
            district: true,
            postal_code: true,
            lat: true,
            lon: true
          }
        })
      ]);
    });

    // Combine all data
    const workerDetails = {
      ...worker,
      worker_services: workerServices,
      availabilities: availabilities,
      addresses: addresses,
      reviews_reviews_worker_idTousers: reviews
    };

    res.status(200).json({
      success: true,
      data: workerDetails
    });
  } catch (error) {
    console.error('Error fetching worker details by email:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getWorkerById = async (req, res) => {
  const { id } = req.params;

  try {
    const worker = await prisma.users.findUnique({
      where: {
        id,
        role: 'worker'
      },
      include: {
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
        worker_services: {
          select: {
            id: true,
            base_price: true,
            price_unit: true,
            skills: true,
            created_at: true,
            service_sections: {
              select: {
                name: true,
                slug: true,
                description: true
              }
            },
            service_categories: {
              select: {
                name: true,
                slug: true,
                description: true
              }
            }
          }
        },
        availabilities: {
          select: {
            id: true,
            available_from: true,
            available_to: true,
            weekend: true
          }
        },
        verification_documents: {
          select: {
            id: true,
            document_type: true,
            file_url: true,
            status: true,
            uploaded_at: true,
            reviewed_at: true,
            review_comment: true
          },
          orderBy: {
            uploaded_at: 'desc'
          }
        },
        reviews_reviews_worker_idTousers: {
          select: {
            id: true,
            rating: true,
            comment: true,
            created_at: true,
            users_reviews_user_idTousers: {
              select: {
                full_name: true,
                profile_picture: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          },
          take: 10
        },
        _count: {
          select: {
            orders_orders_assigned_worker_idTousers: true,
            payments: true,
            reviews_reviews_worker_idTousers: true
          }
        }
      }
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Format the response for admin panel
    const formattedWorker = {
      id: worker.id,
      fullName: worker.full_name,
      email: worker.email,
      phone: worker.phone,
      gender: worker.gender,
      dateOfBirth: worker.date_of_birth,
      nid: worker.nid,
      profilePicture: worker.profile_picture,
      role: worker.role,
      status: worker.status,
      createdAt: worker.created_at,
      updatedAt: worker.updated_at,
      lastLoginAt: worker.last_login_at,
      workerProfile: worker.worker_profiles ? {
        displayName: worker.worker_profiles.display_name,
        bio: worker.worker_profiles.bio,
        yearsExperience: worker.worker_profiles.years_experience,
        avgRating: worker.worker_profiles.avg_rating ? parseFloat(worker.worker_profiles.avg_rating) : 0.0,
        totalReviews: worker.worker_profiles.total_reviews,
        verification: worker.worker_profiles.verification,
        documentsCount: worker.worker_profiles.documents_count,
        profileCreatedAt: worker.worker_profiles.created_at,
        profileUpdatedAt: worker.worker_profiles.updated_at
      } : null,
      addresses: worker.addresses,
      services: worker.worker_services.map(service => ({
        id: service.id,
        basePrice: service.base_price,
        priceUnit: service.price_unit,
        skills: service.skills,
        category: service.service_sections?.name || service.service_categories?.name,
        categorySlug: service.service_sections?.slug || service.service_categories?.slug,
        categoryDescription: service.service_sections?.description || service.service_categories?.description,
        createdAt: service.created_at
      })),
      availabilities: worker.availabilities,
      verificationDocuments: worker.verification_documents,
      recentReviews: worker.reviews_reviews_worker_idTousers.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at,
        reviewer: {
          name: review.users_reviews_user_idTousers?.full_name,
          avatar: review.users_reviews_user_idTousers?.profile_picture
        }
      })),
      statistics: {
        totalHirings: worker._count.orders_orders_assigned_worker_idTousers,
        totalPayments: worker._count.payments,
        totalReviews: worker._count.reviews_reviews_worker_idTousers
      }
    };

    res.status(200).json(formattedWorker);
  } catch (error) {
    console.error('Error fetching worker by ID:', error);
    res.status(500).json({ error: 'Failed to fetch worker details' });
  }
};

const verifyWorker = async (req, res) => {
  const { workerId } = req.params;

  try {
    const updatedWorkerProfile = await prisma.worker_profiles.update({
      where: { user_id: workerId },
      data: { verification: 'verified' }
    });

    res.status(200).json({
      message: 'Worker verified successfully',
      workerProfile: updatedWorkerProfile
    });
  } catch (error) {
    console.error('Error verifying worker:', error);
    res.status(500).json({ error: 'Failed to verify worker' });
  }
};

const suspendWorker = async (req, res) => {
  const { workerId } = req.params;

  try {
    const updatedWorkerProfile = await prisma.users.update({
      where: { id: workerId },
      data: { status: 'suspended' }
    });

    res.status(200).json({
      message: 'Worker suspended successfully',
      workerProfile: updatedWorkerProfile
    });
  } catch (error) {
    console.error('Error suspending worker:', error);
    res.status(500).json({ error: 'Failed to suspend worker' });
  }
};

const rejectWorker = async (req, res) => {
  const { workerId } = req.params;

  try {
    const updatedWorkerProfile = await prisma.worker_profiles.update({
      where: { user_id: workerId },
      data: { verification: 'rejected' }
    });

    res.status(200).json({
      message: 'Worker rejected successfully',
      workerProfile: updatedWorkerProfile
    });
  } catch (error) {
    console.error('Error rejecting worker:', error);
    res.status(500).json({ error: 'Failed to reject worker' });
  }
};

const activateWorker = async (req, res) => {
  const { workerId } = req.params;

  try {
    const updatedWorkerProfile = await prisma.users.update({
      where: { id: workerId },
      data: { status: 'active' }
    });

    res.status(200).json({
      message: 'Worker activated successfully',
      workerProfile: updatedWorkerProfile
    });
  } catch (error) {
    console.error('Error activating worker:', error);
    res.status(500).json({ error: 'Failed to activate worker' });
  }
};

/**
 * Get Worker Notifications
 * Returns all notifications for a worker
 * @route GET /api/workerRoutes/notifications/:email
 */
const getWorkerNotifications = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    // Fetch worker by email
    const worker = await prisma.users.findUnique({
      where: { id: id },
      select: { id: true, role: true }
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    if (worker.role !== 'worker') {
      return res.status(403).json({
        error: 'Access denied. This endpoint is only accessible to workers.'
      });
    }

    // Fetch notifications for the worker
    const notifications = await prisma.notifications.findMany({
      where: {
        user_id: worker.id
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Count unread notifications
    const unreadCount = notifications.filter(n => !n.is_read).length;

    res.status(200).json({
      success: true,
      total: notifications.length,
      unread: unreadCount,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching worker notifications:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications',
      message: error.message
    });
  }
};

/**
 * Mark Notification as Read
 * @route PATCH /api/workerRoutes/notifications/:id/read
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notifications.update({
      where: { id },
      data: { is_read: true }
    });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({
      error: 'Failed to update notification',
      message: error.message
    });
  }
};

/**
 * Mark All Notifications as Read
 * @route PATCH /api/workerRoutes/notifications/read-all/:id
 */
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Id is required' });
    }

    // Fetch worker by email
    const worker = await prisma.users.findUnique({
      where: { id: id },
      select: { role: true }
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    if (worker.role !== 'worker') {
      return res.status(403).json({
        error: 'Access denied. This endpoint is only accessible to workers.'
      });
    }

    // Update all unread notifications
    const result = await prisma.notifications.updateMany({
      where: {
        user_id: worker.id,
        is_read: false
      },
      data: {
        is_read: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      updated_count: result.count
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({
      error: 'Failed to update notifications',
      message: error.message
    });
  }
};

/**
 * Get all reviews for a worker by worker ID
 * @route GET /api/workerRoutes/reviews/:workerId
 */
const getWorkerReviews = async (req, res) => {
  const { workerId } = req.params;
  const { page = 1, limit = 10, sortBy = 'created_at', order = 'desc' } = req.query;

  try {
    if (!workerId) {
      return res.status(400).json({ error: 'Worker ID is required' });
    }

    // Validate worker exists
    const worker = await prisma.users.findUnique({
      where: { id: workerId },
      select: { 
        id: true, 
        role: true,
        worker_profiles: {
          select: {
            avg_rating: true,
            total_reviews: true
          }
        }
      }
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    if (worker.role !== 'worker') {
      return res.status(403).json({ error: 'User is not a worker' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get reviews with pagination
    const [reviews, totalCount] = await prisma.$transaction(async (tx) => {
      return Promise.all([
        tx.reviews.findMany({
          where: { worker_id: workerId },
          select: {
            id: true,
            rating: true,
            comment: true,
            created_at: true,
            order_id: true,
            users_reviews_user_idTousers: {
              select: {
                id: true,
                full_name: true,
                profile_picture: true
              }
            },
            orders: {
              select: {
                id: true,
                description: true
              }
            }
          },
          orderBy: {
            [sortBy]: order.toLowerCase()
          },
          skip: skip,
          take: parseInt(limit)
        }),
        tx.reviews.count({
          where: { worker_id: workerId }
        })
      ]);
    });

    // Transform the data
    const transformedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      order_id: review.order_id,
      service_description: review.orders?.description || null,
      reviewer: {
        id: review.users_reviews_user_idTousers?.id || null,
        name: review.users_reviews_user_idTousers?.full_name || 'Anonymous',
        profile_picture: review.users_reviews_user_idTousers?.profile_picture || null
      }
    }));

    res.status(200).json({
      success: true,
      data: {
        worker_id: workerId,
        avg_rating: worker.worker_profiles?.avg_rating || 0,
        total_reviews: totalCount,
        reviews: transformedReviews,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalCount / parseInt(limit)),
          per_page: parseInt(limit),
          total_count: totalCount
        }
      }
    });
  } catch (error) {
    console.error('Error fetching worker reviews:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
};

module.exports = { getWorkers, searchWorkers, createWorker, createWorkerService, createWorkerAvailability, updateWorkerProfile, updateWorkerService, updateAvailability, getWorkerDetails, getWorkerDashboardSummary, getWorkerDashboardTasks, getWorkerDetailsByEmail, getWorkerById, verifyWorker, suspendWorker, rejectWorker, activateWorker, getWorkerNotifications, markNotificationAsRead, markAllNotificationsAsRead, getWorkerReviews }; 