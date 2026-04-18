import api from './api';

/**
 * UPI Config Service
 * Fetches the admin-configured active UPI from the existing 'upi_configs' collection.
 * Fields returned: { upiId, label, department }
 */
const upiConfigService = {
    /**
     * Get the currently active UPI config set by admin.
     * Returns { upiId, label, department } or null on failure.
     */
    getActiveUpiConfig: async () => {
        try {
            const response = await api.get('/upi-config/active');
            if (response.data?.success && response.data?.data) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.warn('[upiConfigService] Could not fetch active UPI config:', error?.message);
            return null;
        }
    },
};

export default upiConfigService;
