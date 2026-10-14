export function formatTimestamp(timestamp) {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "N/A";
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit",
        year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date);
    const get = (type) => parts.find((part) => part.type === type).value;
    return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

export function enableTimestampCopy(element) {
    const value = element.textContent.trim();
    if (!value || value === "N/A") return;
    element.tabIndex = 0;
    element.setAttribute("role", "button");
    element.setAttribute("aria-label", `Sao ch\u00e9p ${value}`);
    element.title = "B\u1ea5m \u0111\u1ec3 sao ch\u00e9p th\u1eddi gian";
    element.style.cursor = "copy";
    const copy = async () => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(value);
            } else {
                const input = document.createElement("textarea");
                input.value = value;
                input.style.position = "fixed";
                input.style.opacity = "0";
                document.body.appendChild(input);
                input.select();
                try {
                    if (!document.execCommand("copy")) throw new Error("Copy failed");
                } finally {
                    input.remove();
                    element.focus({ preventScroll: true });
                }
            }
            element.textContent = "\u0110\u00e3 sao ch\u00e9p";
        } catch {
            element.textContent = "Kh\u00f4ng th\u1ec3 sao ch\u00e9p";
        }
        setTimeout(() => { element.textContent = value; }, 1200);
    };
    element.addEventListener("click", copy);
    element.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            copy();
        }
    });
}
