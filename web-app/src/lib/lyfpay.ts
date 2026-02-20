export class LyfPayService {
    private static API_URL = process.env.LYFPAY_API_URL || "https://payment-api.lyf.eu"; // Default pro, check docs
    private static CLIENT_ID = process.env.LYFPAY_CLIENT_ID;
    private static CLIENT_SECRET = process.env.LYFPAY_CLIENT_SECRET;
    private static MERCHANT_ID = process.env.LYFPAY_MERCHANT_ID;

    /**
     * Initiate a payment
     * @param amount Amount in cents (e.g., 1000 for 10.00€)
     * @param callbackUrl URL to redirect after payment
     * @returns redirect url
     */
    static async initiatePayment(amount: number, orderId: string, callbackUrl: string) {
        // Implementation placeholder
        // TODO: Authenticate to get token
        // TODO: Call initiate endpoint

        console.log(`Initiating payment for ${amount} cents, order ${orderId}`);

        // Mock for dev since we don't have keys yet
        if (!this.CLIENT_ID) {
            console.warn("LyfPay credentials missing. Returning mock URL.");
            return `${callbackUrl}?status=PAID&orderId=${orderId}&mock=true`;
        }

        throw new Error("LyfPay integration not fully implemented without docs/keys.");
    }

    static async verifyPayment(paymentId: string) {
        // Implementation placeholder
        console.log(`Verifying payment ${paymentId}`);
        return { status: 'PAID' };
    }
}
