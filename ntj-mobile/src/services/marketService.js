import api from './api';

const marketService = {
    // Get latest rates for Gold and Silver
    getRates: async () => {
        try {
            const response = await api.get('/rates');
            return response.data;
        } catch (error) {
            console.error('Error fetching rates:', error);
            throw error;
        }
    },

    // Calculate portfolio value (helper)
    calculatePortfolioValue: (holdings, rates) => {
        if (!holdings || !rates) return 0;

        const goldValue = (holdings.gold || 0) * (rates.gold?.sellPrice || 0);
        const silverValue = (holdings.silver || 0) * (rates.silver?.sellPrice || 0);

        return goldValue + silverValue;
    }
};

export default marketService;
