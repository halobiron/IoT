import SensorDataService from "../services/api.js";
import ActionHistoryTable from "../view/table/action-history-table.js?v=action-user-v1";
import UpdateIndicator from "../components/update-indicator.js";
import { initializeDateTimeSearchPicker } from "../utils/date-picker.js";

class ActionHistoryTableControl {
    constructor(container) {
        this.container = container;
        this.tableView = new ActionHistoryTable();
        this.updateIndicator = new UpdateIndicator();
        this.refreshInterval = null;

        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.searchTerm = "";
        this.selectedDevice = "all";
        this.selectedAction = "all";
        this.selectedState = "all";
        this.sortField = "timestamp";
        this.sortOrder = "desc";
        this.allDevices = new Set();
        this.requestSequence = 0;

        this.searchListenersAttached = false;
        this.controlListenersAttached = false;

        console.log(
            "ActionHistoryTableControl constructor - container:",
            container
        );
    }

    async load(limit = 50) {
        const requestId = ++this.requestSequence;

        try {
            this.tableView.showLoading();

            const crudParams = {
                page: this.currentPage,
                per_page: this.itemsPerPage,
                sort_field: this.sortField,
                sort_order: this.sortOrder,
                // A selected time is an upper bound, matching the sensor-data
                // page: show all records up to and including that minute.
                end_time: this.searchTerm,
                device_filter: this.selectedDevice,
                action_filter: this.selectedAction,
                state_filter: this.selectedState,
            };

            const result = await SensorDataService.getActionHistory(
                limit,
                crudParams
            );

            if (requestId !== this.requestSequence) return;

            this.tableView.hideLoading();

            if (result && result.status === "success") {
                this.tableView.render(
                    this.container,
                    result.data,
                    result.pagination,
                    result.filters,
                    result.sort
                );
                this.renderPagination(result.pagination);
                this.populateDeviceFilter(result.data);

                this.searchListenersAttached = false;
                this.controlListenersAttached = false;
                this._attachSearchListeners();
                this._attachControlListeners();
            } else {
                console.error(
                    "Lỗi khi lấy lịch sử hành động:",
                    result?.message
                );
                this.showError("Lỗi khi tải dữ liệu.");
            }
        } catch (err) {
            if (requestId !== this.requestSequence) return;
            console.error("Lỗi khi lấy lịch sử hành động:", err);
            this.tableView.hideLoading();
            this.showError("Lỗi khi tải dữ liệu.");
        }
    }

    async refreshSilently(limit = 50) {
        try {
            if (
                this.currentPage === 1 &&
                !this.searchTerm &&
                this.selectedDevice === "all" &&
                this.selectedAction === "all" &&
                this.selectedState === "all"
            ) {
                const crudParams = {
                    page: 1,
                    per_page: Math.min(limit, 10),
                    sort_field: this.sortField,
                    sort_order: this.sortOrder,
                    search: "",
                    device_filter: "all",
                    action_filter: "all",
                    state_filter: "all",
                };

                const result = await SensorDataService.getActionHistory(
                    limit,
                    crudParams
                );

                if (result && result.status === "success") {
                    const prevData = this.tableView.currentItems || [];
                    const newData = result.data || [];

                    if (
                        JSON.stringify(prevData.slice(0, 3)) !==
                        JSON.stringify(newData.slice(0, 3))
                    ) {
                        this.updateIndicator.show();
                        this.tableView.updateData(
                            newData,
                            result.pagination,
                            result.filters,
                            result.sort,
                            this.container
                        );
                        this.renderPagination(result.pagination);
                    }
                }
            }
        } catch (err) {
            console.error("Lỗi khi refresh lịch sử hành động:", err);
        }
    }

    updateAllDevices(items) {
        if (!Array.isArray(items)) return;
        items.forEach((item) => {
            const device = (item.led || item.device || "").toString();
            if (device) this.allDevices.add(device);
        });
    }

    populateDeviceFilter(items) {
        const select = this.container.querySelector("#actionFilterDevice");
        if (!select) return;

        const oldDeviceCount = this.allDevices.size;
        this.updateAllDevices(items);
        const newDeviceCount = this.allDevices.size;

        const hasLEDOptions =
            !!select.querySelector('option[value="LED1"]') &&
            !!select.querySelector('option[value="LED2"]') &&
            !!select.querySelector('option[value="LED3"]');

        if (!hasLEDOptions || newDeviceCount > oldDeviceCount) {
            this.renderDeviceFilter();
        }
    }

    renderDeviceFilter() {
        const select = this.container.querySelector("#actionFilterDevice");
        if (!select) return;

        const currentValue = select.value;

        const hasLEDOptions =
            !!select.querySelector('option[value="LED1"]') &&
            !!select.querySelector('option[value="LED2"]') &&
            !!select.querySelector('option[value="LED3"]');

        if (!hasLEDOptions) {
            select.innerHTML = "";
            const defaultOpt = document.createElement("option");
            defaultOpt.value = "all";
            defaultOpt.textContent = "Tất cả";
            select.appendChild(defaultOpt);

            const ledOptions = ["LED1", "LED2", "LED3"];
            ledOptions.forEach((led) => {
                const opt = document.createElement("option");
                opt.value = led;
                opt.textContent = led;
                select.appendChild(opt);
            });
        }

        const sortedDevices = Array.from(this.allDevices).sort((a, b) => {
            const getDeviceNumber = (deviceName) => {
                const match = deviceName.match(/(\d+)/);
                return match ? parseInt(match[1]) : 999;
            };

            const numA = getDeviceNumber(a);
            const numB = getDeviceNumber(b);

            if (numA !== numB) {
                return numA - numB;
            }
            return a.localeCompare(b);
        });

        sortedDevices.forEach((device) => {
            if (!select.querySelector(`option[value="${device}"]`)) {
                const opt = document.createElement("option");
                opt.value = device;
                opt.textContent = device;
                select.appendChild(opt);
            }
        });

        select.value = currentValue || this.selectedDevice || "all";
    }

    renderPagination(paginationInfo) {
        if (!paginationInfo) return;

        const { page, per_page, total_count, total_pages, has_prev, has_next } =
            paginationInfo;

        const pageNumbers = this.container.querySelector("#actionPageNumbers");
        const prevBtn = this.container.querySelector("#actionPrevPage");
        const nextBtn = this.container.querySelector("#actionNextPage");
        const paginationInfoEl = this.container.querySelector(
            "#actionPaginationInfo"
        );

        if (!paginationInfoEl) return;

        const startIndex = total_count === 0 ? 0 : (page - 1) * per_page + 1;
        const endIndex = Math.min(page * per_page, total_count);
        paginationInfoEl.textContent = `Hiển thị ${startIndex} - ${endIndex} của ${total_count} bản ghi`;

        if (pageNumbers) {
            pageNumbers.innerHTML = "";
            if (total_pages > 1) {
                let startPage = Math.max(1, page - 2);
                let endPage = Math.min(total_pages, page + 2);

                if (startPage > 1) {
                    pageNumbers.appendChild(this.createPageButton(1, "1"));
                    if (startPage > 2)
                        pageNumbers.appendChild(
                            this.createPageButton(null, "...", true)
                        );
                }

                for (let i = startPage; i <= endPage; i++) {
                    pageNumbers.appendChild(
                        this.createPageButton(
                            i,
                            i.toString(),
                            false,
                            i === page
                        )
                    );
                }

                if (endPage < total_pages) {
                    if (endPage < total_pages - 1)
                        pageNumbers.appendChild(
                            this.createPageButton(null, "...", true)
                        );
                    pageNumbers.appendChild(
                        this.createPageButton(
                            total_pages,
                            total_pages.toString()
                        )
                    );
                }
            }
        }

        if (prevBtn) prevBtn.disabled = !has_prev;
        if (nextBtn) nextBtn.disabled = !has_next;
    }

    createPageButton(pageNum, text, isDisabled = false, isActive = false) {
        const button = document.createElement("button");
        button.className = `page-number-btn ${isActive ? "active" : ""} ${
            isDisabled ? "disabled" : ""
        }`;
        button.textContent = text;
        button.disabled = isDisabled;

        if (pageNum && !isDisabled) {
            button.addEventListener("click", () => {
                this.goToPage(pageNum);
            });
        }

        return button;
    }

    async goToPage(page) {
        this.currentPage = page;
        await this.load(this.itemsPerPage);
    }

    _updateSearchPlaceholder(criteria) {
        const input = this.container.querySelector("#actionHistorySearchInput");
        if (!input) return;
        input.placeholder =
            "Tìm kiếm theo thời gian (VD: 00:17:07 21/09/2025, 00:17 21/09/2025)";
    }

    _attachSearchListeners() {
        if (this.searchListenersAttached) return;

        const input = this.container.querySelector("#actionHistorySearchInput");
        const clearBtn = this.container.querySelector(
            "#actionHistoryClearSearch"
        );
        const deviceSelect = this.container.querySelector(
            "#actionFilterDevice"
        );
        const actionSelect = this.container.querySelector(
            "#actionFilterAction"
        );
        const stateSelect = this.container.querySelector("#actionFilterState");

        if (!input) {
            console.error("Action history search input not found!");
            return;
        }

        this._updateSearchPlaceholder("time");

        initializeDateTimeSearchPicker(input, {
            onChange: (_selectedDates, dateStr) => {
                this.searchTerm = dateStr;
                if (clearBtn) clearBtn.style.display = dateStr ? "block" : "none";
            },
        });

        if (this.searchTerm) {
            input._flatpickr?.setDate(this.searchTerm, false, "H:i d/m/Y");
            if (clearBtn) clearBtn.style.display = "block";
        }

        input.addEventListener("input", (e) => {
            const value = e.target.value.trim();
            this.searchTerm = value;
            if (clearBtn) clearBtn.style.display = value ? "block" : "none";
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                clearTimeout(this.searchTimeout);
                this.syncTimeSearch();
                this.currentPage = 1;
                this.load(this.itemsPerPage);
            }
        });

        if (deviceSelect) {
            deviceSelect.value = this.selectedDevice || "all";
            deviceSelect.addEventListener("change", async (e) => {
                this.selectedDevice = e.target.value || "all";
                this.currentPage = 1;
                await this.load(this.itemsPerPage);
            });
        }

        if (actionSelect) {
            actionSelect.value = this.selectedAction || "all";
            actionSelect.addEventListener("change", async (e) => {
                this.selectedAction = e.target.value || "all";
                this.currentPage = 1;
                await this.load(this.itemsPerPage);
            });
        }

        if (stateSelect) {
            stateSelect.value = this.selectedState || "all";
            stateSelect.addEventListener("change", async (e) => {
                this.selectedState = e.target.value || "all";
                this.currentPage = 1;
                await this.load(this.itemsPerPage);
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener("click", async () => {
                if (input) input._flatpickr?.clear();
                this.searchTerm = "";
                clearBtn.style.display = "none";
                this.currentPage = 1;
                await this.load(this.itemsPerPage);
                if (input) input.focus();
            });
        }

        this.searchListenersAttached = true;
    }

    _attachControlListeners() {
        if (this.controlListenersAttached) return;

        const pageSize = this.container.querySelector("#actionTablePageSize");
        const manualRefresh = this.container.querySelector(
            "#actionManualRefresh"
        );
        const prevBtn = this.container.querySelector("#actionPrevPage");
        const nextBtn = this.container.querySelector("#actionNextPage");
        const applyFilters = this.container.querySelector("#actionApplyFilters");

        if (applyFilters) {
            applyFilters.addEventListener("click", async () => {
                this.syncTimeSearch();
                this.currentPage = 1;
                await this.load(this.itemsPerPage);
            });
        }

        if (pageSize) {
            pageSize.value = String(this.itemsPerPage);

            pageSize.addEventListener("change", async (e) => {
                const newPageSize = parseInt(e.target.value, 10);
                if (newPageSize && newPageSize > 0 && newPageSize <= 100) {
                    this.itemsPerPage = newPageSize;
                    this.currentPage = 1;
                    await this.load(this.itemsPerPage);
                } else {
                    e.target.value = this.itemsPerPage;
                }
            });
        }

        if (manualRefresh) {
            manualRefresh.addEventListener("click", async () => {
                manualRefresh.classList.add("spinning");
                manualRefresh.disabled = true;
                try {
                    await this.load(this.itemsPerPage);
                    this.updateIndicator.show();
                } finally {
                    setTimeout(() => {
                        manualRefresh.classList.remove("spinning");
                        manualRefresh.disabled = false;
                    }, 800);
                }
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener("click", async () => {
                await this.goToPage(this.currentPage - 1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener("click", async () => {
                await this.goToPage(this.currentPage + 1);
            });
        }

        this.controlListenersAttached = true;
    }

    syncTimeSearch() {
        const input = this.container.querySelector("#actionHistorySearchInput");
        if (!input) return;

        this.searchTerm = input.value.trim();
        input._flatpickr?.close();
    }

    startAutoRefresh(intervalMs = 30000, limit = 50) {
        this.stopAutoRefresh();
        this.refreshInterval = setInterval(() => {
            this.refreshSilently(limit);
        }, intervalMs);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    showError(message) {
        console.error("Action History Error:", message);
    }

    destroy() {
        this.stopAutoRefresh();
        if (this.updateIndicator) this.updateIndicator.destroy();
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
    }
}

export default ActionHistoryTableControl;
