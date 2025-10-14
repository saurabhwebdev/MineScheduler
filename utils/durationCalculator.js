/**
 * Duration Calculator for Mine Scheduler
 * Supports pattern matching for configurable UOM types
 * Based on test.py algorithm with enhanced flexibility
 */

/**
 * Calculate task duration based on UOM type
 * @param {Object} params - Calculation parameters
 * @param {string} params.uom - Unit of measure (area, ton, bogt, bfp, task, etc.)
 * @param {number} params.totalPlanMeters - Total plan meters
 * @param {number} params.totalBackfillTonnes - Total backfill tonnes
 * @param {number} params.remoteTonnes - Remote tonnes (for bogger)
 * @param {number} params.rate - Task rate (meters/hour, tonnes/hour, etc.)
 * @param {number} params.taskDuration - Base task duration in minutes
 * @param {Object} params.constants - Mining constants (WIDTH, HEIGHT, DENSITY)
 * @param {number} params.siteWidth - Site-specific width (optional, overrides constant)
 * @param {number} params.siteHeight - Site-specific height (optional, overrides constant)
 * @returns {Object} { minutes: number, hours: number }
 */
function calculateTaskDuration(params) {
  const {
    uom,
    totalPlanMeters = 0,
    totalBackfillTonnes = 0,
    remoteTonnes = 0,
    rate = 0,
    taskDuration = 0,
    constants = {},
    siteWidth = 0,
    siteHeight = 0
  } = params;

  // Helper to safely convert to float
  const _f = (value, defaultValue = 0) => {
    try {
      const num = parseFloat(value);
      if (isNaN(num) || !isFinite(num)) return defaultValue;
      return num;
    } catch (error) {
      return defaultValue;
    }
  };

  // Get width and height (site-specific or global constants)
  const width = _f(siteWidth) > 0 ? _f(siteWidth) : _f(constants.WIDTH, 5.0);
  const height = _f(siteHeight) > 0 ? _f(siteHeight) : _f(constants.HEIGHT, 4.0);
  const density = _f(constants.DENSITY, 2.7);

  // Normalize UOM to lowercase for pattern matching
  const uomLower = (uom || '').trim().toLowerCase();

  let minutes = 0;

  // Pattern matching for UOM types
  // AREA-BASED: Contains "meter", "area", "m/h", or starts with "area"
  if (uomLower.includes('meter') || 
      uomLower.includes('area') || 
      uomLower.includes('m/h') ||
      uomLower.startsWith('area')) {
    
    // Duration = (total_plan_m / rate_meters_per_hour) × 60
    const planM = _f(totalPlanMeters);
    const rateVal = _f(rate);
    
    if (rateVal > 0 && planM > 0) {
      minutes = (planM / rateVal) * 60;
    } else {
      minutes = 0; // Skip if no rate or no meters
    }
  }
  
  // TONNAGE-BASED: Contains "ton", "tonne", "t/h"
  else if (uomLower.includes('ton') || uomLower.includes('t/h')) {
    
    let tonnes = _f(totalBackfillTonnes);
    
    // If tonnes not provided, calculate from meters
    if (tonnes <= 0) {
      const planM = _f(totalPlanMeters);
      if (planM > 0) {
        const volume = width * height * planM;
        tonnes = volume * density;
      }
    }
    
    const rateVal = _f(rate);
    
    if (tonnes > 0 && rateVal > 0) {
      // Duration = (tonnes × 60) / rate_tonnes_per_hour
      minutes = (tonnes * 60) / rateVal;
    } else {
      minutes = 0; // Skip if no tonnes or no rate
    }
  }
  
  // BOGT (BOGGER): Contains "bogt", "bogger", "trolley"
  else if (uomLower.includes('bogt') || 
           uomLower.includes('bogger') || 
           uomLower.includes('trolley')) {
    
    const remoteT = _f(remoteTonnes);
    const durationVal = _f(taskDuration);
    
    if (remoteT > 0 && durationVal > 0) {
      // Duration = (remote_t / duration_minutes) × 60
      minutes = (remoteT / durationVal) * 60;
    } else {
      minutes = 0; // Skip if no remote tonnes
    }
  }
  
  // BFP (BACKFILL PREP): Contains "bfp", "backfill"
  else if (uomLower.includes('bfp') || uomLower.includes('backfill')) {
    
    const tonnes = _f(totalBackfillTonnes);
    
    if (tonnes > 0) {
      // Use fixed duration if tonnes > 0
      minutes = _f(taskDuration);
    } else {
      minutes = 0; // Skip if no tonnes
    }
  }
  
  // TASK (FIXED DURATION): Default for "task", "time", or any other UOM
  else {
    // Fixed duration in minutes
    minutes = _f(taskDuration);
    if (minutes <= 0) {
      minutes = 0; // Skip if duration is 0
    }
  }

  // Calculate hours (ceil to next whole hour, min 0)
  const hours = minutes > 0 ? Math.ceil(minutes / 60) : 0;

  return {
    minutes: parseFloat(minutes.toFixed(2)),
    hours: hours
  };
}

module.exports = {
  calculateTaskDuration
};
