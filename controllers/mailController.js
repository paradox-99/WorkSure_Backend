const mj = require('../config/mailjet');
const dotenv = require('dotenv')
dotenv.config();

exports.sendTest = async (req, res) => {
  const { ToEmail, ToName, Subject, TextPart, HTMLPart } = req.body || {};

  console.log(process.env.MJ_APIKEY_PUBLIC, process.env.MJ_APIKEY_PRIVATE);
  const emailFrom = process.env.FROM_EMAIL

  const message = {
    Messages: [
      {
        From: {
          Email: emailFrom || 'rinayeem546@gmail.com',
          Name: process.env.FROM_NAME || 'WorkSure'
        },
        To: [
          {
            Email: ToEmail || 'nayeem.driver@yopmail.com',
            Name: ToName || 'Recipient'
          }
        ],
        Subject: Subject || 'Test Email from WorkSure',
        TextPart: TextPart || 'This is a test email sent via Mailjet textpart.',
        HTMLPart: HTMLPart || '<h3>This is a test email sent via Mailjet inside h3.</h3>'
      }
    ]
  };

  try {
    const request = await mj.post('send', { version: 'v3.1' }).request(message);
    return res.json({ ok: true, data: request.body });
  } catch (err) {
    console.error('Mailjet error:', {
      message: err && err.message,
      statusCode: err && (err.statusCode || err.status),
      responseBody: err && err.response && err.response.body
    });
    const status = (err && (err.statusCode || err.status)) || 500;
    return res.status(status).json({ ok: false, error: err.message || err, details: err && err.response && err.response.body });
  }
};

/**
 * Send hiring request notification email to worker
 * @param {Object} params - Email parameters
 * @param {string} params.workerEmail - Worker's email address
 * @param {string} params.workerName - Worker's name
 * @param {string} params.clientName - Client's name
 * @param {string} params.address - Work address
 * @param {string} params.description - Job description
 * @param {Date} params.selectedTime - Scheduled time for the work
 * @returns {Promise<Object>} - Email send result
 */
exports.sendHiringRequestEmail = async ({ workerEmail, workerName, clientName, address, description, selectedTime }) => {
  const emailFrom = process.env.FROM_EMAIL;
  const formattedTime = selectedTime ? new Date(selectedTime).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Not specified';

  const message = {
    Messages: [
      {
        From: {
          Email: emailFrom || 'rinayeem546@gmail.com',
          Name: process.env.FROM_NAME || 'WorkSure'
        },
        To: [
          {
            Email: workerEmail,
            Name: workerName || 'Worker'
          }
        ],
        Subject: '🔔 New Work Request - WorkSure',
        TextPart: `Hello ${workerName || 'Worker'},\n\nYou have received a new work request from ${clientName}.\n\nDetails:\n- Address: ${address || 'Not specified'}\n- Scheduled Time: ${formattedTime}\n- Description: ${description || 'No description provided'}\n\nPlease log in to your WorkSure account to accept or decline this request.\n\nBest regards,\nThe WorkSure Team`,
        HTMLPart: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0;">🔔 New Work Request!</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
              <p style="font-size: 16px; color: #333;">Hello <strong>${workerName || 'Worker'}</strong>,</p>
              <p style="font-size: 16px; color: #333;">You have received a new work request from <strong>${clientName}</strong>!</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <h3 style="margin-top: 0; color: #667eea;">📋 Request Details</h3>
                <p style="margin: 10px 0;"><strong>📍 Address:</strong> ${address || 'Not specified'}</p>
                <p style="margin: 10px 0;"><strong>🕐 Scheduled Time:</strong> ${formattedTime}</p>
                <p style="margin: 10px 0;"><strong>📝 Description:</strong> ${description || 'No description provided'}</p>
              </div>
              
              <p style="font-size: 16px; color: #333;">Please log in to your WorkSure account to review and respond to this request.</p>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #666; font-size: 14px;">Best regards,<br><strong>The WorkSure Team</strong></p>
              </div>
            </div>
          </div>
        `
      }
    ]
  };

  try {
    const request = await mj.post('send', { version: 'v3.1' }).request(message);
    console.log('Hiring request email sent successfully to:', workerEmail);
    return { ok: true, data: request.body };
  } catch (err) {
    console.error('Mailjet error sending hiring request email:', {
      message: err && err.message,
      statusCode: err && (err.statusCode || err.status),
      responseBody: err && err.response && err.response.body
    });
    return { ok: false, error: err.message || err };
  }
};

/**
 * Send request accepted notification email to client
 * @param {Object} params - Email parameters
 * @param {string} params.clientEmail - Client's email address
 * @param {string} params.clientName - Client's name
 * @param {string} params.workerName - Worker's name
 * @param {string} params.address - Work address
 * @param {string} params.description - Job description
 * @param {Date} params.selectedTime - Scheduled time for the work
 * @returns {Promise<Object>} - Email send result
 */
exports.sendRequestAcceptedEmail = async ({ clientEmail, clientName, workerName, address, description, selectedTime }) => {
  const emailFrom = process.env.FROM_EMAIL;
  const formattedTime = selectedTime ? new Date(selectedTime).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Not specified';

  const message = {
    Messages: [
      {
        From: {
          Email: emailFrom || 'rinayeem546@gmail.com',
          Name: process.env.FROM_NAME || 'WorkSure'
        },
        To: [
          {
            Email: clientEmail,
            Name: clientName || 'Client'
          }
        ],
        Subject: '✅ Your Work Request Has Been Accepted - WorkSure',
        TextPart: `Hello ${clientName || 'Client'},\n\nGreat news! Your work request has been accepted by ${workerName}.\n\nDetails:\n- Address: ${address || 'Not specified'}\n- Scheduled Time: ${formattedTime}\n- Description: ${description || 'No description provided'}\n\nThe worker will arrive at the scheduled time. You can track the status in your WorkSure app.\n\nBest regards,\nThe WorkSure Team`,
        HTMLPart: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0;">✅ Request Accepted!</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
              <p style="font-size: 16px; color: #333;">Hello <strong>${clientName || 'Client'}</strong>,</p>
              <p style="font-size: 16px; color: #333;">Great news! Your work request has been accepted by <strong>${workerName}</strong>!</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                <h3 style="margin-top: 0; color: #28a745;">📋 Request Details</h3>
                <p style="margin: 10px 0;"><strong>👷 Worker:</strong> ${workerName}</p>
                <p style="margin: 10px 0;"><strong>📍 Address:</strong> ${address || 'Not specified'}</p>
                <p style="margin: 10px 0;"><strong>🕐 Scheduled Time:</strong> ${formattedTime}</p>
                <p style="margin: 10px 0;"><strong>📝 Description:</strong> ${description || 'No description provided'}</p>
              </div>
              
              <p style="font-size: 16px; color: #333;">The worker will arrive at the scheduled time. You can track the status in your WorkSure app.</p>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #666; font-size: 14px;">Best regards,<br><strong>The WorkSure Team</strong></p>
              </div>
            </div>
          </div>
        `
      }
    ]
  };

  try {
    const request = await mj.post('send', { version: 'v3.1' }).request(message);
    console.log('Request accepted email sent successfully to:', clientEmail);
    return { ok: true, data: request.body };
  } catch (err) {
    console.error('Mailjet error sending request accepted email:', {
      message: err && err.message,
      statusCode: err && (err.statusCode || err.status),
      responseBody: err && err.response && err.response.body
    });
    return { ok: false, error: err.message || err };
  }
};

/**
 * Send request cancelled notification email to client
 * @param {Object} params - Email parameters
 * @param {string} params.clientEmail - Client's email address
 * @param {string} params.clientName - Client's name
 * @param {string} params.workerName - Worker's name
 * @param {string} params.address - Work address
 * @param {string} params.description - Job description
 * @param {string} params.cancelReason - Reason for cancellation
 * @param {Date} params.selectedTime - Scheduled time for the work
 * @returns {Promise<Object>} - Email send result
 */
exports.sendRequestCancelledEmail = async ({ clientEmail, clientName, workerName, address, description, cancelReason, selectedTime }) => {
  const emailFrom = process.env.FROM_EMAIL;
  const formattedTime = selectedTime ? new Date(selectedTime).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Not specified';

  const message = {
    Messages: [
      {
        From: {
          Email: emailFrom || 'rinayeem546@gmail.com',
          Name: process.env.FROM_NAME || 'WorkSure'
        },
        To: [
          {
            Email: clientEmail,
            Name: clientName || 'Client'
          }
        ],
        Subject: '❌ Work Request Cancelled - WorkSure',
        TextPart: `Hello ${clientName || 'Client'},\n\nUnfortunately, your work request has been cancelled by the worker.\n\nDetails:\n- Worker: ${workerName || 'Worker'}\n- Address: ${address || 'Not specified'}\n- Scheduled Time: ${formattedTime}\n- Description: ${description || 'No description provided'}\n- Reason: ${cancelReason || 'No reason provided'}\n\nWe apologize for any inconvenience. You can create a new request to find another available worker.\n\nBest regards,\nThe WorkSure Team`,
        HTMLPart: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0;">❌ Request Cancelled</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
              <p style="font-size: 16px; color: #333;">Hello <strong>${clientName || 'Client'}</strong>,</p>
              <p style="font-size: 16px; color: #333;">Unfortunately, your work request has been cancelled by the worker.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
                <h3 style="margin-top: 0; color: #dc3545;">📋 Cancelled Request Details</h3>
                <p style="margin: 10px 0;"><strong>👷 Worker:</strong> ${workerName || 'Worker'}</p>
                <p style="margin: 10px 0;"><strong>📍 Address:</strong> ${address || 'Not specified'}</p>
                <p style="margin: 10px 0;"><strong>🕐 Scheduled Time:</strong> ${formattedTime}</p>
                <p style="margin: 10px 0;"><strong>📝 Description:</strong> ${description || 'No description provided'}</p>
                <p style="margin: 10px 0;"><strong>❓ Reason:</strong> ${cancelReason || 'No reason provided'}</p>
              </div>
              
              <p style="font-size: 16px; color: #333;">We apologize for any inconvenience. You can create a new request to find another available worker.</p>
              
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #666; font-size: 14px;">Best regards,<br><strong>The WorkSure Team</strong></p>
              </div>
            </div>
          </div>
        `
      }
    ]
  };

  try {
    const request = await mj.post('send', { version: 'v3.1' }).request(message);
    console.log('Request cancelled email sent successfully to:', clientEmail);
    return { ok: true, data: request.body };
  } catch (err) {
    console.error('Mailjet error sending request cancelled email:', {
      message: err && err.message,
      statusCode: err && (err.statusCode || err.status),
      responseBody: err && err.response && err.response.body
    });
    return { ok: false, error: err.message || err };
  }
};