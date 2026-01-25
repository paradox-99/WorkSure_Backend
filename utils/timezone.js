/**
 * Timezone utility for Bangladesh (UTC+6)
 */

const BD_TIMEZONE_OFFSET = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

/**
 * Convert UTC date to Bangladesh time
 * @param {Date|string} date - UTC date or ISO string
 * @returns {Date} - Date in Bangladesh timezone
 */
const convertToBDTime = (date) => {
     if (!date) return null;
     const utcDate = new Date(date);
     return new Date(utcDate.getTime() + BD_TIMEZONE_OFFSET);
};

/**
 * Format date to Bangladesh timezone string
 * @param {Date|string} date - UTC date or ISO string
 * @returns {string} - Formatted BD time string (YYYY-MM-DD HH:mm:ss)
 */
const formatBDTime = (date) => {
     if (!date) return null;
     const bdDate = convertToBDTime(date);
     
     const year = bdDate.getUTCFullYear();
     const month = String(bdDate.getUTCMonth() + 1).padStart(2, '0');
     const day = String(bdDate.getUTCDate()).padStart(2, '0');
     const hours = String(bdDate.getUTCHours()).padStart(2, '0');
     const minutes = String(bdDate.getUTCMinutes()).padStart(2, '0');
     const seconds = String(bdDate.getUTCSeconds()).padStart(2, '0');
     
     return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Get current Bangladesh time
 * @returns {Date} - Current date/time in Bangladesh timezone
 */
const getBDNow = () => {
     return new Date(new Date().getTime() + BD_TIMEZONE_OFFSET);
};

/**
 * Format object dates to BD timezone
 * @param {object} obj - Object with date fields
 * @param {array} dateFields - Array of field names to convert
 * @returns {object} - Object with converted dates
 */
const convertObjectDatesToBD = (obj, dateFields = []) => {
     if (!obj) return null;
     
     const converted = { ...obj };
     dateFields.forEach(field => {
          if (converted[field]) {
               converted[field] = formatBDTime(converted[field]);
          }
     });
     
     return converted;
};

module.exports = {
     convertToBDTime,
     formatBDTime,
     getBDNow,
     convertObjectDatesToBD,
     BD_TIMEZONE_OFFSET,

};
