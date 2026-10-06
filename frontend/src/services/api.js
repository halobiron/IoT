const API_BASE_URL = "http://localhost:5000/api/v1/sensors";

async function request(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

function queryString(params) {
    return new URLSearchParams(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
    ).toString();
}

class SensorDataService {
    static getLatestSensorData() {
        return request(`${API_BASE_URL}/sensor-data`);
    }

    static getSensorDataList(limit = 5, sample = 20, params = {}) {
        const normalizedLimit = typeof limit === "string" && limit.toLowerCase() === "all" ? "all" : Number(limit);
        return request(`${API_BASE_URL}/sensor-data-list?${queryString({ limit: normalizedLimit, sample, ...params })}`);
    }

    static getChartData(limit = "50") {
        const normalizedLimit = typeof limit === "string" && limit !== "all" ? parseInt(limit, 10) : limit;
        return request(`${API_BASE_URL}/sensor-data/chart?${queryString({ limit: normalizedLimit })}`);
    }

    static getSensorDataByDate(date, limit = "50") {
        return request(`${API_BASE_URL}/sensor-data/chart?${queryString({ date, limit })}`);
    }

    static controlLED(ledId, action) {
        return request(`${API_BASE_URL}/led-control`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ led_id: ledId, action }),
        });
    }

    static controlAllLEDs(action) {
        return this.controlLED("ALL", action);
    }

    static getLEDStatus() {
        return request(`${API_BASE_URL}/led-status`);
    }

    static getLEDStats(useCache = true, date = null) {
        return request(`${API_BASE_URL}/led-stats?${queryString({ cache: useCache, date })}`);
    }

    static getActionHistory(limit = 50, params = {}) {
        return request(`${API_BASE_URL}/action-history?${queryString({ limit, ...params })}`);
    }

    static getAvailableDates() {
        return request(`${API_BASE_URL}/available-dates`);
    }

    static getAvailableLEDDates() {
        return request(`${API_BASE_URL}/available-led-dates`);
    }

    static getThresholds() {
        return request(`${API_BASE_URL}/thresholds`);
    }

    static updateThresholds(thresholds) {
        return request(`${API_BASE_URL}/thresholds`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(thresholds),
        });
    }
}

export default SensorDataService;
