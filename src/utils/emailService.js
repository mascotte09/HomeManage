import emailjs from 'emailjs-com'

// Initialize EmailJS once
let isInitialized = false
const VITE_EMAILJS_PUBLIC_KEY = '0-PdKtP77zuafLSjd'
const VITE_EMAILJS_SERVICE_ID = 'service_49dcxp7'
const VITE_EMAILJS_TEMPLATE_ID = 'VerificationCode'
export function initializeEmailJS() {
    if (!isInitialized) {
        emailjs.init(VITE_EMAILJS_PUBLIC_KEY)
        isInitialized = true
    }
}

/**
 * Send verification email with code
 * @param {string} email - Recipient email
 * @param {string} code - 6-digit verification code
 */
export async function sendVerificationEmail(email, code) {
    initializeEmailJS()
    console.info('Sending verification email to:', email, 'with code:', code)
    
    const templateParams = {
        email: email, // Try 'email' instead of 'to_email'
        verification_code: code,
    }

    console.info('Template params:', templateParams)

    try {
        const response = await emailjs.send(
            VITE_EMAILJS_SERVICE_ID,
            VITE_EMAILJS_TEMPLATE_ID,
            templateParams
        )

        if (response.status !== 200) {
            throw new Error('Failed to send verification email')
        }

        console.info('Email sent successfully:', response)
        return response
    } catch (error) {
        console.error('EmailJS Error:', error)
        throw new Error(`Failed to send verification email: ${error.message}`)
    }
}

/**
 * Send invoice email
 * @param {string} email - Recipient email
 * @param {Object} invoiceData - Invoice data { roomName, totalAmount, month, year, details }
 */
export async function sendInvoiceEmail(email, invoiceData) {
    initializeEmailJS()

    const templateParams = {
        to_email: email,
        room_name: invoiceData.roomName,
        total_amount: invoiceData.totalAmount,
        month: invoiceData.month,
        year: invoiceData.year,
        details: invoiceData.details || 'Chi tiết hóa đơn',
    }

    try {
        const response = await emailjs.send(
            VITE_EMAILJS_SERVICE_ID,
            'invoice_template_id',
            templateParams
        )

        if (response.status !== 200) {
            throw new Error('Failed to send invoice email')
        }

        return response
    } catch (error) {
        console.error('EmailJS Error:', error)
        throw new Error(`Failed to send invoice email: ${error.message}`)
    }
}

/**
 * Send payment confirmation email
 * @param {string} email - Recipient email
 * @param {Object} paymentData - Payment data { roomName, amount, paymentMethod, date }
 */
export async function sendPaymentConfirmation(email, paymentData) {
    initializeEmailJS()

    const templateParams = {
        to_email: email,
        room_name: paymentData.roomName,
        amount: paymentData.amount,
        payment_method: paymentData.paymentMethod,
        payment_date: paymentData.date,
    }

    try {
        const response = await emailjs.send(
            VITE_EMAILJS_SERVICE_ID,
            'payment_confirmation_template_id',
            templateParams
        )

        if (response.status !== 200) {
            throw new Error('Failed to send payment confirmation')
        }

        return response
    } catch (error) {
        console.error('EmailJS Error:', error)
        throw new Error(`Failed to send payment confirmation: ${error.message}`)
    }
}

/**
 * Send notification email
 * @param {string} email - Recipient email
 * @param {Object} notificationData - { title, message, actionUrl }
 */
export async function sendNotification(email, notificationData) {
    initializeEmailJS()

    const templateParams = {
        to_email: email,
        title: notificationData.title,
        message: notificationData.message,
        action_url: notificationData.actionUrl || '',
    }

    try {
        const response = await emailjs.send(
            VITE_EMAILJS_SERVICE_ID,
            'notification_template_id',
            templateParams
        )

        if (response.status !== 200) {
            throw new Error('Failed to send notification')
        }

        return response
    } catch (error) {
        console.error('EmailJS Error:', error)
        throw new Error(`Failed to send notification: ${error.message}`)
    }
}

const emailService = {
    initializeEmailJS,
    sendVerificationEmail,
    sendInvoiceEmail,
    sendPaymentConfirmation,
    sendNotification,
}

export default emailService
