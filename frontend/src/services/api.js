import mockDataService from "./mock-data.js";

const API_BASE_URL = "http://localhost:5000/api/v1/sensors";

// Đặt USE_MOCK_DATA = true để hiển thị đầy đủ số liệu giả lập khi chưa kết nối phần cứng / ESP32
// Đặt USE_MOCK_DATA = false khi đã sẵn sàng kết nối Backend & Database thật
const USE_MOCK_DATA = false;

if (USE_MOCK_DATA) {
    console.log(
        "%c[IoT System] Đang bật chế độ Mock Data (Demo Mode) - Số liệu hiển thị sẵn sàng cho Figma & Báo cáo",
        "background: #007aff; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;"
    );
}

class SensorDataService {
    static async getLatestSensorData() {
        if (USE_MOCK_DATA) {
            return mockDataService.getLatestSensorData();
        }
        try {
            const response = await fetch(`${API_BASE_URL}/sensor-data`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn("API lỗi, tự động chuyển sang Mock Data:", error);
            return mockDataService.getLatestSensorData();
        }
    }

    static async getSensorDataList(limit = 5, sample = 20, crudParams = {}) {
        if (USE_MOCK_DATA) {
            return mockDataService.getSensorDataList(limit, sample, crudParams);
        }
        try {
            const limitParam =
                typeof limit === "string" && limit.toLowerCase() === "all"
                    ? "all"
                    : Number(limit);

            let url = `${API_BASE_URL}/sensor-data-list?limit=${limitParam}&sample=${sample}`;

            if (crudParams.page) url += `&page=${crudParams.page}`;
            if (crudParams.per_page) url += `&per_page=${crudParams.per_page}`;
            if (crudParams.sort_field)
                url += `&sort_field=${crudParams.sort_field}`;
            if (crudParams.sort_order)
                url += `&sort_order=${crudParams.sort_order}`;
            if (crudParams.search)
                url += `&search=${encodeURIComponent(crudParams.search)}`;
            if (crudParams.search_criteria)
                url += `&search_criteria=${crudParams.search_criteria}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn("API lỗi, tự động chuyển sang Mock Data:", error);
            return mockDataService.getSensorDataList(limit, sample, crudParams);
        }
    }

    static async getChartData(limit = "50") {
        if (USE_MOCK_DATA) {
            return mockDataService.getChartData(limit);
        }
        try {
            let limitParam = limit;
            if (typeof limit === "string" && limit !== "all") {
                limitParam = parseInt(limit);
            }

            const url = `${API_BASE_URL}/sensor-data/chart?limit=${limitParam}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.warn("API lỗi, tự động chuyển sang Mock Data:", error);
            return mockDataService.getChartData(limit);
        }
    }

    static async getSensorDataByDate(date, limit = "50") {
        if (USE_MOCK_DATA) {
            return mockDataService.getSensorDataByDate(date, limit);
        }
        try {
            let url = `${API_BASE_URL}/sensor-data/chart?date=${date}`;
            if (limit) {
                url += `&limit=${limit}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn("API lỗi, tự động chuyển sang Mock Data:", error);
            return mockDataService.getSensorDataByDate(date, limit);
        }
    }

    static async controlLED(ledId, action) {
        if (USE_MOCK_DATA) {
            return mockDataService.controlLED(ledId, action);
        }
        try {
            const response = await fetch(`${API_BASE_URL}/led-control`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    led_id: ledId,
                    action: action,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Không thể gửi lệnh điều khiển LED:", error);
            throw error;
        }
    }

    static async controlAllLEDs(action) {
        return this.controlLED("ALL", action);
    }

    static async getLEDStatus() {
        if (USE_MOCK_DATA) {
            return mockDataService.getLEDStatus();
        }
        try {
            const response = await fetch(`${API_BASE_URL}/led-status`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn("API lỗi, tự động chuyển sang Mock Data:", error);
            return mockDataService.getLEDStatus();
        }
    }

    static async getLEDStats(useCache = true, date = null) {
        if (USE_MOCK_DATA) {
            return mockDataService.getLEDStats(useCache, date);
        }
        try {
            let url = `${API_BASE_URL}/led-stats?cache=${useCache}`;
            if (date) {
                url += `&date=${date}`;
            }
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn("API lỗi, tự động chuyển sang Mock Data:", error);
            return mockDataService.getLEDStats(useCache, date);
        }
    }

    static async getActionHistory(limit = 50, crudParams = {}) {
        if (USE_MOCK_DATA) {
            return mockDataService.getActionHistory(limit, crudParams);
        }
        try {
            let url = `${API_BASE_URL}/action-history?limit=${limit}`;

            if (crudParams.page) url += `&page=${crudParams.page}`;
            if (crudParams.per_page) url += `&per_page=${crudParams.per_page}`;
            if (crudParams.sort_field)
                url += `&sort_field=${crudParams.sort_field}`;
            if (crudParams.sort_order)
                url += `&sort_order=${crudParams.sort_order}`;
            if (crudParams.search)
                url += `&search=${encodeURIComponent(crudParams.search)}`;
            if (crudParams.device_filter)
                url += `&device_filter=${crudParams.device_filter}`;
            if (crudParams.state_filter)
                url += `&state_filter=${crudParams.state_filter}`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn("API lỗi, tự động chuyển sang Mock Data:", error);
            return mockDataService.getActionHistory(limit, crudParams);
        }
    }

    static async getAvailableDates() {
        if (USE_MOCK_DATA) {
            return mockDataService.getAvailableDates();
        }
        try {
            const response = await fetch(`${API_BASE_URL}/available-dates`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn("API lỗi, tự động chuyển sang Mock Data:", error);
            return mockDataService.getAvailableDates();
        }
    }

    static async getAvailableLEDDates() {
        if (USE_MOCK_DATA) {
            return mockDataService.getAvailableLEDDates();
        }
        try {
            const response = await fetch(`${API_BASE_URL}/available-led-dates`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn("API lỗi, tự động chuyển sang Mock Data:", error);
            return mockDataService.getAvailableLEDDates();
        }
    }

    static async getHomeData() {
        if (USE_MOCK_DATA) {
            return mockDataService.getHomeData();
        }
        try {
            const response = await fetch(`${API_BASE_URL}/home-data`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn("API lỗi, tự động chuyển sang Mock Data:", error);
            return mockDataService.getHomeData();
        }
    }

    static async getThresholds() {
        if (USE_MOCK_DATA) {
            return mockDataService.getThresholds();
        }
        try {
            const response = await fetch(`${API_BASE_URL}/thresholds`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn("API lỗi, tự động chuyển sang Mock Data:", error);
            return mockDataService.getThresholds();
        }
    }

    static async updateThresholds(thresholds) {
        if (USE_MOCK_DATA) {
            return mockDataService.updateThresholds(thresholds);
        }
        try {
            const response = await fetch(`${API_BASE_URL}/thresholds`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(thresholds),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.warn("API lỗi, tự động chuyển sang Mock Data:", error);
            return mockDataService.updateThresholds(thresholds);
        }
    }
}

export default SensorDataService;
