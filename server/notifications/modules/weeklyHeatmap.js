/**
 * Weekly Heatmap Module
 * 
 * This module processes heatmap data to identify sector performance
 */

const config = require('../config/config');
const stateManager = require('../utils/stateManager');

// Store browser-collected data
let browserData = null;

/**
 * Sets browser data for processing
 * @param {Array} data - The browser-collected data
 */
function setBrowserData(data) {
    browserData = data;
}

/**
 * Get sample data for testing
 * @returns {Array} Sample stock data
 */
function getSampleData() {
    return [
        { symbol: 'ADBL', closePrice: '410', openPrice: '400', changePercent: '2.5%', volume: '500000', sector: 'Banking' },
        { symbol: 'NABIL', closePrice: '910', openPrice: '900', changePercent: '1.1%', volume: '300000', sector: 'Banking' },
        { symbol: 'NRIC', closePrice: '650', openPrice: '645', changePercent: '0.78%', volume: '250000', sector: 'Insurance' }
    ];
}

/**
 * Group stocks by their sectors
 * @param {Array} stocks - Stock data to be grouped
 * @returns {Object} Stocks grouped by sector
 */
function groupBySector(stocks) {
    const sectors = {};
    
    // Group stocks by sector
    stocks.forEach(stock => {
        // Determine sector - default to "Other" if unknown
        // We would need to get sector data from the configuration or external source
        const sector = stock.sector || "Other";
        
        if (!sectors[sector]) {
            sectors[sector] = [];
        }
        
        sectors[sector].push(stock);
    });
    
    // Sort stocks within each sector by volume (highest to lowest)
    Object.keys(sectors).forEach(sector => {
        sectors[sector].sort((a, b) => {
            const volumeA = parseFloat(String(a.volume).replace(/,/g, ''));
            const volumeB = parseFloat(String(b.volume).replace(/,/g, ''));
            return volumeB - volumeA;
        });
    });
    
    return sectors;
}

/**
 * Process weekly heatmap data
 * @returns {Object} Processed heatmap data
 */
async function process() {
    try {
        console.log('Processing weekly heatmap data...');

        // Use browser data if available, otherwise use sample data
        const stockData = browserData || getSampleData();
        console.log(`Processing ${stockData.length} stocks for heatmap`);
        
        // Format data for notification
        const formattedData = stockData.map(stock => {
            return {
                symbol: stock.symbol,
                closePrice: parseFloat(String(stock.closePrice).replace(/,/g, '')),
                openPrice: parseFloat(String(stock.openPrice).replace(/,/g, '')),
                changePercent: stock.changePercent,
                volume: parseFloat(String(stock.volume).replace(/,/g, '')),
                high: parseFloat(String(stock.high || '0').replace(/,/g, '')),
                low: parseFloat(String(stock.low || '0').replace(/,/g, '')),
                volatility: stock.volatility,
                rsi: parseFloat(stock.rsi || '0'),
                sector: stock.sector || 'Other'
            };
        });
        
        // Group by sector
        const groupedData = groupBySector(formattedData);
        
        // Get top stocks by volume from each sector (config.criteria.heatmap.topNbyVolume)
        const topNByVolume = config.criteria.heatmap.topNbyVolume || 3;
        const minVolume = config.criteria.heatmap.minVolume || 100000;
        
        const topByVolume = {};
        
        Object.keys(groupedData).forEach(sector => {
            const sectorStocks = groupedData[sector];
            
            // Filter by minimum volume
            const highVolumeStocks = sectorStocks.filter(stock => 
                stock.volume >= minVolume);
            
            // Take top N from each sector
            topByVolume[sector] = highVolumeStocks.slice(0, topNByVolume);
        });
        
        return {
            type: 'weeklyHeatmap',
            data: {
                sectors: topByVolume
            }
        };
    } catch (error) {
        console.error('Error processing weekly heatmap data:', error);
        return {
            type: 'weeklyHeatmap',
            error: error.toString(),
            data: { sectors: {} }
        };
    }
}

module.exports = {
    setBrowserData,
    getSampleData,
    process
}; 