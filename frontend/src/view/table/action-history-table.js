class ActionHistoryTable {
    constructor() {
        this.currentItems = [];
        this.pagination = {};
        this.filters = {};
        this.sort = {};
    }

    render(container, items, paginationData = {}, filters = {}, sort = {}) {
        this.currentItems = Array.isArray(items) ? items : [];
        this.pagination = paginationData;
        this.filters = filters;
        this.sort = sort;
        container.innerHTML = "";

        const card = document.createElement("div");
        card.className = "table-card";

        const tableContainer = document.createElement("div");
        tableContainer.className = "table-container";

        const loadingElement = document.createElement("div");
        loadingElement.className = "table-loading";
        loadingElement.id = "actionTableLoading";
        loadingElement.style.display = "none";
        loadingElement.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Đang tải dữ liệu...</p>
        `;

        const table = document.createElement("table");
        table.className = "action-history-table";

        const thead = document.createElement("thead");
        thead.innerHTML = `
      <tr>
        <th>STT</th>
        <th>Thiết bị</th>
        <th>Hành động</th>
        <th>Trạng thái</th>
        <th>Thời gian phản hồi</th>
        <th>Thời gian</th>
      </tr>
    `;
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        tbody.id = "actionHistoryTableBody";

        if (this.currentItems.length === 0) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td colspan="6" class="no-data">Không có dữ liệu để hiển thị</td>
            `;
            tbody.appendChild(tr);
        } else {
            this.currentItems.forEach((item, index) => {
                const tr = this._createRow(item, index, this.pagination);
                tbody.appendChild(tr);
            });
        }

        table.appendChild(tbody);
        tableContainer.appendChild(loadingElement);
        tableContainer.appendChild(table);

        const searchControls = document.createElement("div");
        searchControls.className = "table-search-controls";
        searchControls.innerHTML = `
        <div class="search-section">
          <div class="history-filter-group">
            <label class="filter-label" for="actionHistorySearchInput">Tìm kiếm thời gian</label>
            <div class="search-input-group">
              <i class="fas fa-search"></i>
              <input type="text" id="actionHistorySearchInput" class="date-time-search" placeholder="Chọn ngày, giờ" aria-label="Chọn thời gian lịch sử thao tác" readonly>
              <button id="actionHistoryClearSearch" class="clear-btn" type="button" aria-label="Xóa tìm kiếm" style="display:none;"><i class="fas fa-times"></i></button>
            </div>
          </div>
          <div class="history-filter-group">
            <label class="filter-label" for="actionFilterDevice">Thiết bị</label>
            <select id="actionFilterDevice" class="filter-select">
              <option value="all">Tất cả</option>
              <option value="LED1">LED1</option>
              <option value="LED2">LED2</option>
              <option value="LED3">LED3</option>
            </select>
          </div>
          <div class="history-filter-group">
            <label class="filter-label" for="actionFilterState">Trạng thái</label>
            <select id="actionFilterState" class="filter-select">
              <option value="all">Tất cả</option>
              <option value="on">ON</option>
              <option value="off">OFF</option>
            </select>
          </div>
          <button id="actionApplyFilters" class="filter-submit-btn" type="button"><i class="fas fa-search"></i>Tìm kiếm</button>
          <button id="actionManualRefresh" class="refresh-btn icon-only" type="button" aria-label="Làm mới lịch sử" title="Làm mới lịch sử"><i class="fas fa-sync-alt"></i></button>
          <button id="actionExportCSV" class="export-btn compact-export" type="button" title="Xuất CSV"><i class="fa-solid fa-file-export"></i>Xuất CSV</button>
        </div>
    `;

        card.appendChild(searchControls);
        card.appendChild(tableContainer);

        const paginationElement = document.createElement("div");
        paginationElement.className = "table-pagination";
        paginationElement.id = "actionTablePagination";
        paginationElement.innerHTML = `
      <div class="pagination-info">
        <span id="actionPaginationInfo">Hiển thị 0 - 0 của 0 bản ghi</span>
      </div>
      <div class="pagination-controls">
        <select id="actionTablePageSize" class="page-size-select">
          <option value="10">10 dòng</option>
          <option value="25">25 dòng</option>
          <option value="50">50 dòng</option>
          <option value="100">100 dòng</option>
        </select>
        <button id="actionPrevPage" class="page-btn" disabled>
          <i class="fas fa-chevron-left"></i>
          Trước
        </button>
        <div class="page-numbers" id="actionPageNumbers"></div>
        <button id="actionNextPage" class="page-btn" disabled>
          Sau
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    `;

        card.appendChild(paginationElement);

        container.appendChild(card);
    }

    _createRow(item, index, pagination = {}) {
        const tr = document.createElement("tr");

        const sttTd = document.createElement("td");
        let stt = index + 1;
        if (pagination && pagination.page && pagination.per_page) {
            stt = (pagination.page - 1) * pagination.per_page + index + 1;
        }
        sttTd.textContent = stt;

        const ledTd = document.createElement("td");
        ledTd.textContent = item.led || "";

        const stateTd = document.createElement("td");
        const stateValue = (item.state || "").toString().toLowerCase();
        const badge = document.createElement("span");
        badge.className = "status-badge";
        if (
            stateValue === "on" ||
            stateValue === "1" ||
            stateValue === "true"
        ) {
            badge.classList.add("status-on");
            badge.textContent = "ON";
        } else if (
            stateValue === "off" ||
            stateValue === "0" ||
            stateValue === "false"
        ) {
            badge.classList.add("status-off");
            badge.textContent = "OFF";
        } else {
            badge.classList.add("status-unknown");
            badge.textContent = item.state || "-";
        }
        stateTd.appendChild(badge);

        const actionTd = document.createElement("td");
        actionTd.textContent = ["on", "1", "true"].includes(stateValue)
            ? "Bật"
            : ["off", "0", "false"].includes(stateValue)
              ? "Tắt"
              : "-";

        const responseTimeTd = document.createElement("td");
        responseTimeTd.textContent = item.response_time || this._mockResponseTime(item);

        const tsTd = document.createElement("td");
        let ts = "";
        if (item.timestamp) {
            try {
                const date = new Date(item.timestamp);
                ts = date.toLocaleString("vi-VN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                });
            } catch (e) {
                ts = item.timestamp;
            }
        }
        tsTd.textContent = ts;

        tr.appendChild(sttTd);
        tr.appendChild(ledTd);
        tr.appendChild(actionTd);
        tr.appendChild(stateTd);
        tr.appendChild(responseTimeTd);
        tr.appendChild(tsTd);

        return tr;
    }

    _mockResponseTime(item) {
        const source = String(item._id || item.timestamp || "0");
        const value = [...source].reduce((sum, char) => sum + char.charCodeAt(0), 0);
        return `${(0.4 + (value % 31) / 10).toFixed(1)}s`;
    }

    updateData(
        newItems,
        paginationData = {},
        filters = {},
        sort = {},
        container
    ) {
        const normalized = Array.isArray(newItems) ? newItems : [];
        if (JSON.stringify(normalized) === JSON.stringify(this.currentItems)) {
            return;
        }

        this.currentItems = normalized;
        this.pagination = paginationData;
        this.filters = filters;
        this.sort = sort;

        const oldScroll = window.pageYOffset;

        const tbody = container.querySelector("#actionHistoryTableBody");
        if (!tbody)
            return this.render(
                container,
                this.currentItems,
                paginationData,
                filters,
                sort
            );

        tbody.innerHTML = "";
        this.currentItems.forEach((item, index) => {
            tbody.appendChild(this._createRow(item, index, this.pagination));
        });

        window.scrollTo(0, oldScroll);
    }

    showLoading() {
        const loadingElement = document.getElementById("actionTableLoading");
        if (loadingElement) {
            loadingElement.style.display = "flex";
        }
    }

    hideLoading() {
        const loadingElement = document.getElementById("actionTableLoading");
        if (loadingElement) {
            loadingElement.style.display = "none";
        }
    }
}

export default ActionHistoryTable;
