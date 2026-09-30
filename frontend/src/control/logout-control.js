document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-action='logout']").forEach((button) => {
        button.addEventListener("click", () => {
            localStorage.removeItem("iot_auth_token");
            localStorage.removeItem("iot_auth_user");
            window.location.replace("login.html");
        });
    });
});
