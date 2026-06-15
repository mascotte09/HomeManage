/**
 * Rate Limiter for login/signup attempts
 * Prevents brute force attacks
 * 
 * Configuration:
 * - Max 5 attempts per email
 * - 15 minute lockout after exceeding
 */

const STORAGE_KEY = 'rateLimiter'
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds

/**
 * Get attempt data for an email
 * @param {string} email - User email
 * @returns {Object} - { attempts: number, lastAttempt: number, isLocked: boolean }
 */
export function getAttemptData(email) {
    try {
        const data = localStorage.getItem(STORAGE_KEY)
        const limiterData = data ? JSON.parse(data) : {}
        
        const emailData = limiterData[email] || { attempts: 0, lastAttempt: null }
        
        // Check if lockout period has expired
        if (emailData.lastAttempt) {
            const timePassed = Date.now() - emailData.lastAttempt
            if (timePassed > LOCKOUT_DURATION) {
                // Reset attempts after lockout expires
                emailData.attempts = 0
                emailData.lastAttempt = null
                saveAttemptData(email, emailData)
            }
        }
        
        return {
            attempts: emailData.attempts,
            lastAttempt: emailData.lastAttempt,
            isLocked: emailData.attempts >= MAX_ATTEMPTS,
        }
    } catch (error) {
        console.error('Error getting attempt data:', error)
        return { attempts: 0, lastAttempt: null, isLocked: false }
    }
}

/**
 * Record a failed attempt
 * @param {string} email - User email
 */
export function recordFailedAttempt(email) {
    try {
        const data = localStorage.getItem(STORAGE_KEY)
        const limiterData = data ? JSON.parse(data) : {}
        
        const emailData = limiterData[email] || { attempts: 0, lastAttempt: null }
        
        emailData.attempts += 1
        emailData.lastAttempt = Date.now()
        
        limiterData[email] = emailData
        localStorage.setItem(STORAGE_KEY, JSON.stringify(limiterData))
        
        return emailData.attempts
    } catch (error) {
        console.error('Error recording failed attempt:', error)
    }
}

/**
 * Clear attempt data for an email (on successful login)
 * @param {string} email - User email
 */
export function clearAttempts(email) {
    try {
        const data = localStorage.getItem(STORAGE_KEY)
        const limiterData = data ? JSON.parse(data) : {}
        
        delete limiterData[email]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(limiterData))
    } catch (error) {
        console.error('Error clearing attempts:', error)
    }
}

/**
 * Get remaining time until lockout expires (in minutes)
 * @param {string} email - User email
 * @returns {number} - Minutes remaining
 */
export function getRemainingLockoutTime(email) {
    const attemptData = getAttemptData(email)
    
    if (!attemptData.isLocked || !attemptData.lastAttempt) {
        return 0
    }
    
    const timePassed = Date.now() - attemptData.lastAttempt
    const timeRemaining = LOCKOUT_DURATION - timePassed
    
    return Math.ceil(timeRemaining / 60000) // Convert to minutes
}

/**
 * Save attempt data
 * @param {string} email - User email
 * @param {Object} emailData - Data to save
 */
function saveAttemptData(email, emailData) {
    try {
        const data = localStorage.getItem(STORAGE_KEY)
        const limiterData = data ? JSON.parse(data) : {}
        limiterData[email] = emailData
        localStorage.setItem(STORAGE_KEY, JSON.stringify(limiterData))
    } catch (error) {
        console.error('Error saving attempt data:', error)
    }
}

export default {
    getAttemptData,
    recordFailedAttempt,
    clearAttempts,
    getRemainingLockoutTime,
}
