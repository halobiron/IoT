/**
 * Mock Data Service for IoT Monitoring System
 * Tự động tạo dữ liệu mẫu phong phú khi chưa có phần cứng thật hoặc không chạy backend.
 * Giúp giao diện hiển thị đầy đủ biểu đồ, thẻ chỉ số, bảng dữ liệu, lịch sử thao tác để chụp ảnh & export sang Figma.
 */

class MockDataService {
    constructor() {
        this.ledStates = {
            LED1: "ON",
            LED2: "OFF",
            LED3: "ON",
        };

        this.ledStatsCounts = {
            LED1: 18,
            LED2: 8,
            LED3: 25,
        };

        this.thresholds = {
            temperature: {
                min: 15,
                max: 36,
                warning_low: 18,
                warning_high: 32,
            },
            humidity: {
                min: 40,
                max: 85,
                warning_low: 45,
                warning_high: 80,
            },
            light: {
                min: 10,
                max: 95,
                warning_low: 20,
                warning_high: 85,
            },
        };

        this.currentTemp = 28.6;
        this.currentHum = 68.4;
        this.currentLight = 72.5;

        this.sensorHistory = this._generateInitialSensorData(120);
        this.actionHistory = this._generateInitialActionHistory(40);
    }

    _formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    _generateInitialSensorData(count = 100) {
        const list = [];
        const now = Date.now();
        const interval = 15 * 1000; // 15 seconds between data points

        let baseTemp = 28.2;
        let baseHum = 67.5;
        let baseLight = 70.0;

        for (let i = count - 1; i >= 0; i--) {
            const time = new Date(now - i * interval);
            // Thêm dao động mượt mà
            const wave = Math.sin(i / 8) * 1.5;
            const jitterTemp = (Math.random() - 0.5) * 0.4;
            const jitterHum = (Math.random() - 0.5) * 0.8;
            const jitterLight = (Math.random() - 0.5) * 2.0;

            const temp = parseFloat((baseTemp + wave * 0.8 + jitterTemp).toFixed(1));
            const hum = parseFloat((baseHum - wave * 1.2 + jitterHum).toFixed(1));
            const light = parseFloat(Math.min(99, Math.max(10, baseLight + wave * 3.0 + jitterLight)).toFixed(1));

            list.push({
                _id: `mock_sensor_${count - i}`,
                timestamp: time.toISOString(),
                temperature: Math.max(16, Math.min(38, temp)),
                humidity: Math.max(30, Math.min(95, hum)),
                light: light,
            });
        }
        return list;
    }

    _generateInitialActionHistory(count = 35) {
        const list = [];
        const devices = ["LED1", "LED2", "LED3"];
        const now = Date.now();
        const interval = 8 * 60 * 1000; // 8 phút mỗi thao tác

        for (let i = 0; i < count; i++) {
            const time = new Date(now - i * interval);
            const dev = devices[i % devices.length];
            const state = i % 2 === 0 ? "ON" : "OFF";

            list.push({
                _id: `mock_act_${count - i}`,
                timestamp: time.toISOString(),
                led: dev,
                state: state,
                status: "success",
                response_time: `${(0.4 + ((i * 17) % 31) / 10).toFixed(1)}s`,
            });
        }
        return list;
    }

    getAvailableDates() {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            dates.push(this._formatDate(d));
        }
        return {
            status: "success",
            data: dates,
            count: dates.length,
        };
    }

    getAvailableLEDDates() {
        return this.getAvailableDates();
    }

    getLatestSensorData() {
        // Cập nhật dao động nhẹ cho lần đọc tiếp theo
        const deltaTemp = (Math.random() - 0.48) * 0.3;
        const deltaHum = (Math.random() - 0.5) * 0.4;
        const deltaLight = (Math.random() - 0.5) * 1.2;

        this.currentTemp = parseFloat(Math.max(24, Math.min(33, this.currentTemp + deltaTemp)).toFixed(1));
        this.currentHum = parseFloat(Math.max(55, Math.min(82, this.currentHum + deltaHum)).toFixed(1));
        this.currentLight = parseFloat(Math.max(30, Math.min(95, this.currentLight + deltaLight)).toFixed(1));

        const now = new Date().toISOString();

        // Thêm vào sensorHistory
        const newRecord = {
            _id: `mock_sensor_${Date.now()}`,
            timestamp: now,
            temperature: this.currentTemp,
            humidity: this.currentHum,
            light: this.currentLight,
        };

        this.sensorHistory.push(newRecord);
        if (this.sensorHistory.length > 300) {
            this.sensorHistory.shift();
        }

        const getStatus = (val, min, max, warnLow, warnHigh) => {
            if (val > max || val < min) return { status: "Nguy hiểm", color_class: "status-danger" };
            if (val > warnHigh || val < warnLow) return { status: "Cảnh báo", color_class: "status-warning" };
            return { status: "Bình thường", color_class: "status-normal" };
        };

        const tempStatus = getStatus(
            this.currentTemp,
            this.thresholds.temperature.min,
            this.thresholds.temperature.max,
            this.thresholds.temperature.warning_low,
            this.thresholds.temperature.warning_high
        );

        const humStatus = getStatus(
            this.currentHum,
            this.thresholds.humidity.min,
            this.thresholds.humidity.max,
            this.thresholds.humidity.warning_low,
            this.thresholds.humidity.warning_high
        );

        const lightStatus = getStatus(
            this.currentLight,
            this.thresholds.light.min,
            this.thresholds.light.max,
            this.thresholds.light.warning_low,
            this.thresholds.light.warning_high
        );

        return {
            _id: newRecord._id,
            timestamp: now,
            temperature: this.currentTemp,
            humidity: this.currentHum,
            light: this.currentLight,
            sensor_statuses: {
                temperature: tempStatus,
                humidity: humStatus,
                light: lightStatus,
            },
            overall_status: {
                status: "Hoạt động ổn định",
                color_class: "status-normal",
            },
        };
    }

    getChartData(limit = 50) {
        let count = parseInt(limit);
        if (isNaN(count) || count <= 0 || limit === "all") {
            count = this.sensorHistory.length;
        }

        const slice = this.sensorHistory.slice(-count);
        return slice;
    }

    getSensorDataByDate(date, limit = 50) {
        // Trả về dữ liệu mẫu khớp với ngày yêu cầu
        const targetDate = date || this._formatDate(new Date());
        let count = parseInt(limit);
        if (isNaN(count) || count <= 0 || limit === "all") {
            count = 60;
        }

        const list = [];
        for (let i = 0; i < count; i++) {
            const h = Math.floor((i / count) * 24);
            const m = Math.floor(((i / count) * 1440) % 60);
            const s = (i * 17) % 60;
            const timeStr = `${targetDate}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}+07:00`;

            const wave = Math.sin((h / 24) * Math.PI * 2);
            list.push({
                _id: `mock_date_${i}`,
                timestamp: timeStr,
                temperature: parseFloat((28.0 + wave * 3.5 + ((i % 5) - 2) * 0.3).toFixed(1)),
                humidity: parseFloat((70.0 - wave * 8.0 + ((i % 4) - 2) * 0.5).toFixed(1)),
                light: parseFloat(Math.max(10, Math.min(95, 50.0 + wave * 35.0 + ((i % 6) - 3) * 1.5)).toFixed(1)),
            });
        }

        return {
            status: "success",
            data: list,
            count: list.length,
            date: targetDate,
        };
    }

    getSensorDataList(limit = 10, sample = 1, crudParams = {}) {
        const page = parseInt(crudParams.page) || 1;
        const perPage = parseInt(crudParams.per_page) || (typeof limit === "number" ? limit : 10);
        const sortField = crudParams.sort_field || "timestamp";
        const sortOrder = crudParams.sort_order || "desc";
        const search = (crudParams.search || "").toLowerCase().trim();
        const searchCriteria = crudParams.search_criteria || "all";

        let filtered = [...this.sensorHistory];

        if (search) {
            filtered = filtered.filter((item) => {
                if (searchCriteria === "temperature") {
                    return item.temperature.toString().includes(search);
                } else if (searchCriteria === "humidity") {
                    return item.humidity.toString().includes(search);
                } else if (searchCriteria === "light") {
                    return item.light.toString().includes(search);
                } else if (searchCriteria === "time") {
                    return item.timestamp.toLowerCase().includes(search);
                } else {
                    return (
                        item.temperature.toString().includes(search) ||
                        item.humidity.toString().includes(search) ||
                        item.light.toString().includes(search) ||
                        item.timestamp.toLowerCase().includes(search)
                    );
                }
            });
        }

        filtered.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];
            if (sortField === "timestamp") {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            }
            if (sortOrder === "asc") {
                return valA > valB ? 1 : -1;
            } else {
                return valA < valB ? 1 : -1;
            }
        });

        const totalCount = filtered.length;
        const totalPages = Math.ceil(totalCount / perPage) || 1;
        const startIdx = (page - 1) * perPage;
        const paginated = filtered.slice(startIdx, startIdx + perPage);

        return {
            status: "success",
            data: paginated,
            pagination: {
                page: page,
                per_page: perPage,
                total_count: totalCount,
                total_pages: totalPages,
                has_prev: page > 1,
                has_next: page < totalPages,
            },
            sort: {
                field: sortField,
                order: sortOrder,
            },
            search: {
                term: crudParams.search || "",
                criteria: searchCriteria,
            },
            count: paginated.length,
            total_count: totalCount,
        };
    }

    getLEDStatus() {
        return {
            status: "success",
            data: {
                led_states: { ...this.ledStates },
                pending_commands: {
                    LED1: false,
                    LED2: false,
                    LED3: false,
                },
            },
        };
    }

    controlLED(ledId, action) {
        const act = action.toUpperCase();
        this.ledStates[ledId] = act;
        if (act === "ON") {
            this.ledStatsCounts[ledId] = (this.ledStatsCounts[ledId] || 0) + 1;
        }

        const newLog = {
            _id: `mock_act_${Date.now()}`,
            timestamp: new Date().toISOString(),
            led: ledId,
            state: act,
            status: "success",
            response_time: `${(0.4 + ((Date.now() % 31) / 10)).toFixed(1)}s`,
        };
        this.actionHistory.unshift(newLog);

        return {
            status: "success",
            message: `LED ${ledId} đã được ${act}`,
            data: {
                led_id: ledId,
                action: act,
            },
        };
    }

    getLEDStats(useCache = true, date = null) {
        const stats = [
            { ledId: "LED1", count: this.ledStatsCounts.LED1 },
            { ledId: "LED2", count: this.ledStatsCounts.LED2 },
            { ledId: "LED3", count: this.ledStatsCounts.LED3 },
        ];

        return {
            status: "success",
            data: stats,
            date: date || this._formatDate(new Date()),
        };
    }

    getActionHistory(limit = 50, crudParams = {}) {
        const page = parseInt(crudParams.page) || 1;
        const perPage = parseInt(crudParams.per_page) || (typeof limit === "number" && limit > 0 ? limit : 10);
        const sortField = crudParams.sort_field || "timestamp";
        const sortOrder = crudParams.sort_order || "desc";
        const search = (crudParams.search || "").toLowerCase().trim();
        const deviceFilter = crudParams.device_filter || "all";
        const stateFilter = (crudParams.state_filter || "all").toUpperCase();

        let filtered = [...this.actionHistory];

        if (deviceFilter && deviceFilter !== "all") {
            filtered = filtered.filter((item) => item.led.toUpperCase() === deviceFilter.toUpperCase());
        }

        if (stateFilter && stateFilter !== "ALL") {
            filtered = filtered.filter((item) => item.state.toUpperCase() === stateFilter);
        }

        if (search) {
            filtered = filtered.filter((item) => {
                return (
                    item.led.toLowerCase().includes(search) ||
                    item.state.toLowerCase().includes(search) ||
                    item.timestamp.toLowerCase().includes(search)
                );
            });
        }

        filtered.sort((a, b) => {
            let valA = a[sortField];
            let valB = b[sortField];
            if (sortField === "timestamp") {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            }
            if (sortOrder === "asc") {
                return valA > valB ? 1 : -1;
            } else {
                return valA < valB ? 1 : -1;
            }
        });

        const totalCount = filtered.length;
        const totalPages = Math.ceil(totalCount / perPage) || 1;
        const startIdx = (page - 1) * perPage;
        const paginated = filtered.slice(startIdx, startIdx + perPage);

        return {
            status: "success",
            data: paginated,
            pagination: {
                page: page,
                per_page: perPage,
                total_count: totalCount,
                total_pages: totalPages,
                has_prev: page > 1,
                has_next: page < totalPages,
            },
            filters: {
                device_filter: deviceFilter,
                state_filter: stateFilter,
            },
            sort: {
                field: sortField,
                order: sortOrder,
            },
            count: paginated.length,
            total_count: totalCount,
        };
    }

    getThresholds() {
        return {
            status: "success",
            data: JSON.parse(JSON.stringify(this.thresholds)),
        };
    }

    updateThresholds(newThresholds) {
        if (newThresholds) {
            this.thresholds = { ...this.thresholds, ...newThresholds };
        }
        return {
            status: "success",
            message: "Đã cập nhật cấu hình ngưỡng thành công",
            data: this.thresholds,
        };
    }

    getHomeData() {
        return {
            status: "success",
            data: {
                latest_sensor: this.getLatestSensorData(),
                led_states: this.getLEDStatus().data.led_states,
                recent_chart: this.getChartData(20),
            },
        };
    }
}

// Singleton instance
const mockDataService = new MockDataService();
export default mockDataService;
