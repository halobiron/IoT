import SensorDataTable from "../view/table/sensor-data-table.js";
import SensorDataService from "../services/api.js";
import UpdateIndicator from "../components/update-indicator.js";
import { initializeDateTimeSearchPicker } from "../utils/date-picker.js";

class SensorDataTableController {
    constructor() {
        this.table = null;
        this.refreshInterval = null;
        this.updateIndicator = new UpdateIndicator();

        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.valueSearchTerm = "";
        this.searchCriteria = "all";
        this.sensorFilter = "all";
        this.sortField = "timestamp";
        this.sortOrder = "desc";
        this.requestSequence = 0;

        this.init();
    }

    init() {
        this.table = new SensorDataTable("sensorDataTable");
        this.setupEventListeners();
        this.loadData();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        const pageSize = document.getElementById("tablePageSize");

        if (pageSize) {
            pageSize.value = this.itemsPerPage;

            pageSize.addEventListener("change", (e) => {
                const newPageSize = parseInt(e.target.value, 10);

                if (newPageSize && newPageSize > 0 && newPageSize <= 100) {
                    this.itemsPerPage = newPageSize;
                    this.currentPage = 1;
                    this.loadData();
                } else {
                    e.target.value = this.itemsPerPage;
                }
            });
        }

        const valueSearchInput = document.getElementById("sensorValueSearchInput");
        const timeSearchInput = document.getElementById("sensorTimeSearchInput");
        const valueSearchGroup = document.getElementById("sensorValueSearchGroup");
        const clearValueSearch = document.getElementById("clearValueSearch");
        const searchCriteria = document.getElementById("searchCriteria");

        this.timeSearchInput = timeSearchInput;

        this.configureValueSearch(
            this.searchCriteria,
            valueSearchGroup,
            valueSearchInput,
            timeSearchInput,
            clearValueSearch
        );
        if (timeSearchInput) {
            initializeDateTimeSearchPicker(timeSearchInput, {
                onChange: (_selectedDates, dateStr) => {
                    this.valueSearchTerm = dateStr;
                    if (clearValueSearch) {
                        clearValueSearch.style.display = dateStr ? "block" : "none";
                    }
                },
            });
        }
        if (searchCriteria) {
            searchCriteria.addEventListener("change", (e) => {
                this.searchCriteria = e.target.value || "all";
                this.configureValueSearch(
                    this.searchCriteria,
                    valueSearchGroup,
                    valueSearchInput,
                    timeSearchInput,
                    clearValueSearch
                );
            });
        }

        if (valueSearchInput) {
            valueSearchInput.addEventListener("input", (e) => {
                this.valueSearchTerm = e.target.value.trim();

                if (clearValueSearch) {
                    clearValueSearch.style.display = this.valueSearchTerm
                        ? "block"
                        : "none";
                }
            });

            valueSearchInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    clearTimeout(this.searchTimeout);
                    this.applyFilters();
                }
            });
        }

        if (clearValueSearch) {
            clearValueSearch.addEventListener("click", () => {
                if (valueSearchInput) {
                    valueSearchInput.value = "";
                    this.resetTimeFilter(timeSearchInput);
                    this.valueSearchTerm = "";
                    clearValueSearch.style.display = "none";
                    valueSearchInput.focus();
                }
            });
        }

        const exportCSV = document.getElementById("exportCSV");
        if (exportCSV) {
            exportCSV.addEventListener("click", () => {
                this.table.exportToCSV();
            });
        }

        const manualRefresh = document.getElementById("manualRefresh");
        if (manualRefresh) {
            manualRefresh.addEventListener("click", () => {
                this.manualRefreshData(manualRefresh);
            });
        }

        const applyFilters = document.getElementById("applySensorFilters");
        if (applyFilters) {
            applyFilters.addEventListener("click", () => {
                this.applyFilters();
            });
        }

        const prevPage = document.getElementById("prevPage");
        const nextPage = document.getElementById("nextPage");

        if (prevPage) {
            prevPage.addEventListener("click", () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.loadData();
                }
            });
        }

        if (nextPage) {
            nextPage.addEventListener("click", () => {
                this.currentPage++;
                this.loadData();
            });
        }

        if (this.table.container) {
            const ths = this.table.container.querySelectorAll("thead th");
            const fieldMap = [null, null, null, "timestamp"];

            ths.forEach((th, idx) => {
                const field = fieldMap[idx];
                if (!field) return;

                th.style.cursor = "pointer";
                th.addEventListener("click", () => {
                    this.handleSort(field);
                });
            });

            this.table.container.addEventListener("pageChange", (e) => {
                this.currentPage = e.detail.page;
                this.loadData();
            });
        }
    }

    updateSearchPlaceholder(criteria) {
        const searchInput = document.getElementById("sensorValueSearchInput");
        if (!searchInput) return;

        const placeholders = {
            temperature: "Tìm kiếm theo nhiệt độ (VD: 32.5 hoặc 32)",
            light: "Tìm kiếm theo ánh sáng (VD: 75.2 hoặc 75)",
            humidity: "Tìm kiếm theo độ ẩm (VD: 60.8 hoặc 60)",
            time: "Tìm kiếm theo thời gian (VD: 14:30 23/09/2026)",
        };

        searchInput.placeholder = placeholders[criteria] || "Tìm kiếm giá trị cảm biến";
    }

    configureValueSearch(
        criteria,
        valueSearchGroup,
        valueSearchInput,
        timeSearchInput,
        clearValueSearch
    ) {
        if (valueSearchGroup) valueSearchGroup.hidden = false;
        this.updateSearchPlaceholder(criteria);

        if (!valueSearchInput) return;

        const isTimeFilter = criteria === "time";
        const isSwitchingTimeMode = this.valueSearchCriteria
            && (this.valueSearchCriteria === "time") !== isTimeFilter;

        if (isSwitchingTimeMode) {
            valueSearchInput.value = "";
            this.resetTimeFilter(timeSearchInput);
            this.valueSearchTerm = "";
            if (clearValueSearch) clearValueSearch.style.display = "none";
        }

        valueSearchInput.hidden = isTimeFilter;
        if (timeSearchInput) {
            timeSearchInput.hidden = !isTimeFilter;
            if (!isTimeFilter) this.resetTimeFilter(timeSearchInput);
        }

        const valueSearchLabel = document.getElementById("sensorValueSearchLabel");
        if (valueSearchLabel) {
            valueSearchLabel.textContent = isTimeFilter
                ? "Mốc thời gian"
                : "Tìm kiếm giá trị";
        }

        valueSearchInput.inputMode = ["temperature", "humidity", "light"].includes(criteria)
            ? "decimal"
            : "text";
        this.valueSearchCriteria = criteria;
    }

    resetTimeFilter(timeSearchInput) {
        if (!timeSearchInput) return;

        const picker = timeSearchInput._flatpickr;
        if (picker) {
            picker.clear();
            picker.close();
        }
        timeSearchInput.value = "";
    }

    isTimeFormat(searchTerm) {
        if (!searchTerm) return false;

        const timePatterns = [
            /^\d{1,2}:\d{1,2}:\d{1,2}\s+\d{1,2}\/\d{1,2}\/\d{4}$/,
            /^\d{1,2}:\d{1,2}\s+\d{1,2}\/\d{1,2}\/\d{4}$/,
            /^\d{1,2}\/\d{1,2}\/\d{4}$/,
            /^\d{1,2}:\d{1,2}:\d{1,2}$/,
            /^\d{1,2}:\d{1,2}$/,
        ];

        return timePatterns.some((pattern) => pattern.test(searchTerm));
    }

    isNumericFormat(searchTerm) {
        if (!searchTerm) return false;

        return /^\d+(\.\d+)?$/.test(searchTerm);
    }

    handleSort(field) {
        if (this.sortField === field) {
            this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
        } else {
            this.sortField = field;
            this.sortOrder = "desc";
        }
        this.currentPage = 1;
        this.loadData();
    }

    applyFilters() {
        if (this.searchCriteria === "time") {
            this.valueSearchTerm = this.timeSearchInput?.value.trim() || "";
            this.timeSearchInput?._flatpickr?.close();
        }

        this.sensorFilter = this.searchCriteria === "time"
            ? "all"
            : this.searchCriteria;
        this.table.sensorFilter = this.sensorFilter;
        this.currentPage = 1;
        this.loadData();
    }

    async loadData(showLoading = true) {
        const requestId = ++this.requestSequence;

        try {
            if (showLoading) {
                this.table.showLoading();
            }

            const isTimeFilter = Boolean(
                this.searchCriteria === "time" && this.valueSearchTerm
            );
            const crudParams = {
                page: this.currentPage,
                per_page: this.itemsPerPage,
                sort_field: this.sortField,
                sort_order: this.sortOrder,
                search: isTimeFilter ? "" : this.valueSearchTerm,
                search_criteria: isTimeFilter
                    ? "all"
                    : (this.valueSearchTerm ? this.searchCriteria : "all"),
                end_time: isTimeFilter ? this.valueSearchTerm : "",
            };

            const sampleRate = this.valueSearchTerm ? 1 : 10;

            const response = await SensorDataService.getSensorDataList(
                "all",
                sampleRate,
                crudParams
            );

            if (requestId !== this.requestSequence) return;

            console.log("API Response:", response);
            console.log("Value search term:", this.valueSearchTerm);
            console.log("Search criteria:", this.searchCriteria);

            if (response.status === "success" && response.data) {
                console.log("Data received:", response.data);
                console.log("Data count:", response.data.length);
                this.table.renderTable(
                    response.data,
                    response.pagination,
                    response.sort,
                    response.search
                );
            } else {
                console.error("Lỗi khi tải dữ liệu bảng:", response.message);
                this.table.renderTable([]);
            }
        } catch (error) {
            if (requestId !== this.requestSequence) return;
            console.error("Lỗi khi tải dữ liệu bảng:", error);
            this.table.renderTable([]);
        } finally {
            if (showLoading && requestId === this.requestSequence) {
                this.table.hideLoading();
            }
        }
    }

    async manualRefreshData(button) {
        if (button) {
            button.classList.add("spinning");
            button.disabled = true;
        }

        try {
            await SensorDataService.getLatestSensorData();
            await this.loadData(false);
            this.updateIndicator.show();
            console.log("Dữ liệu đã được làm mới thủ công");
        } finally {
            if (button) {
                setTimeout(() => {
                    button.classList.remove("spinning");
                    button.disabled = false;
                }, 1000);
            }
        }
    }

    async refreshDataSilently() {
        try {
            if (
                this.currentPage === 1 &&
                !this.valueSearchTerm &&
                this.searchCriteria === "all"
            ) {
                const crudParams = {
                    page: 1,
                    per_page: 3,
                    sort_field: this.sortField,
                    sort_order: this.sortOrder,
                    search: "",
                    search_criteria: "all",
                };

                const response = await SensorDataService.getSensorDataList(
                    "all",
                    10,
                    crudParams
                );

                if (response.status === "success" && response.data) {
                    const currentData = this.table.getData();
                    if (
                        JSON.stringify(currentData.slice(0, 3)) !==
                        JSON.stringify(response.data)
                    ) {
                        this.updateIndicator.show();
                        if (!this.valueSearchTerm && this.searchCriteria === "all") {
                            this.loadData(false);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Lỗi khi refresh dữ liệu:", error);
        }
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            this.refreshDataSilently();
        }, 30000);

        console.log(
            "Auto refresh enabled - Dữ liệu sẽ được cập nhật mỗi 30 giây"
        );
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    destroy() {
        this.stopAutoRefresh();
        if (this.updateIndicator) {
            this.updateIndicator.destroy();
        }
        if (this.table) {
            this.table.destroy();
        }
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
    }
}

export default SensorDataTableController;
