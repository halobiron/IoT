const vietnameseLocale = {
    firstDayOfWeek: 1,
    weekdays: {
        shorthand: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
        longhand: [
            "Chủ nhật",
            "Thứ hai",
            "Thứ ba",
            "Thứ tư",
            "Thứ năm",
            "Thứ sáu",
            "Thứ bảy",
        ],
    },
    months: {
        shorthand: [
            "Th1",
            "Th2",
            "Th3",
            "Th4",
            "Th5",
            "Th6",
            "Th7",
            "Th8",
            "Th9",
            "Th10",
            "Th11",
            "Th12",
        ],
        longhand: [
            "Tháng 1",
            "Tháng 2",
            "Tháng 3",
            "Tháng 4",
            "Tháng 5",
            "Tháng 6",
            "Tháng 7",
            "Tháng 8",
            "Tháng 9",
            "Tháng 10",
            "Tháng 11",
            "Tháng 12",
        ],
    },
};

export function initializeDatePicker(element, {
    availableDates,
    defaultDate,
    onChange,
}) {
    if (!element) return null;

    return flatpickr(element, {
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "d/m/Y",
        altInputClass: "date-picker flatpickr-input",
        maxDate: defaultDate,
        defaultDate,
        enable: availableDates,
        locale: vietnameseLocale,
        disableMobile: true,
        onReady: (_selectedDates, _dateStr, instance) => {
            instance.altInput.setAttribute(
                "aria-label",
                element.getAttribute("aria-label") || "Chọn ngày"
            );
        },
        onChange,
    });
}

export function initializeDateTimeSearchPicker(element, { onChange }) {
    if (!element) return null;

    return flatpickr(element, {
        dateFormat: "H:i d/m/Y",
        enableTime: true,
        time_24hr: true,
        minuteIncrement: 1,
        locale: vietnameseLocale,
        disableMobile: true,
        onChange,
    });
}
