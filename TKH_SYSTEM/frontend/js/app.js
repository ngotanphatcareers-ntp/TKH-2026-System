const demoUsers = [
    {
        username: "admin",
        defaultPassword: "123456",
        role: "admin",
        fullName: "Quản trị viên TKH",
        groupName: null
    },
    {
        username: "tkh001",
        defaultPassword: "123456",
        role: "student",
        fullName: "Trịnh Trần Thiên Phú",
        groupName: "Giô-sép"
    },
    {
        username: "tkh002",
        defaultPassword: "123456",
        role: "student",
        fullName: "Ngô Tấn Phát",
        groupName: "Giô-sép"
    },
    {
        username: "tkh003",
        defaultPassword: "123456",
        role: "student",
        fullName: "Phạm Bá Nam",
        groupName: "Đa-vít"
    }
];

function loginDemo() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const message = document.getElementById("loginMessage");

    const user = demoUsers.find(item => item.username === username);

    if (!user) {
        message.style.color = "red";
        message.innerText = "Tài khoản không tồn tại.";
        return;
    }

    const savedPassword =
        localStorage.getItem("password_" + username) ||
        user.defaultPassword;

    if (password !== savedPassword) {
        message.style.color = "red";
        message.innerText = "Sai mật khẩu.";
        return;
    }

    localStorage.setItem("currentUser", JSON.stringify(user));
    localStorage.setItem("currentUsername", user.username);

    message.style.color = "green";
    message.innerText = "Đăng nhập thành công!";

    setTimeout(() => {
        if (user.role === "admin") {
            window.location.href = "admin-dashboard.html";
        } else {
            window.location.href = "dashboard.html";
        }
    }, 800);
}
//đổi thành km nếu hơn 1000m
function formatDistance(distance) {

    if (distance < 1000) {
        return distance.toFixed(1) + " m";
    }

    return (distance / 1000).toFixed(1) + " km";
}//hết


function logoutDemo() {
    window.location.href = "index.html";
}

const CHURCH_LOCATION = {
    lat: 10.765926509333024,
    lng: 106.6643590819157
};

const CHECKIN_RADIUS_METERS = 200;

function checkInDemo() {
    const gpsMessage = document.getElementById("gpsMessage");
    const statusCard = document.getElementById("attendanceStatus");

    gpsMessage.style.color = "#374151";
    gpsMessage.innerText = "Đang lấy vị trí GPS của bạn...";
    if (!window.isSecureContext) {
    gpsMessage.style.color = "red";
    gpsMessage.innerText =
        "Trình duyệt đang chặn GPS vì website chưa chạy bằng HTTPS. Vui lòng dùng link HTTPS khi chạy thật.";
    return;
    }

    if (!navigator.geolocation) {
        gpsMessage.style.color = "red";
        gpsMessage.innerText = "Trình duyệt của bạn không hỗ trợ GPS.";
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const currentLat = position.coords.latitude;
            const currentLng = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            const distance = calculateDistance(
                currentLat,
                currentLng,
                CHURCH_LOCATION.lat,
                CHURCH_LOCATION.lng
            );

            
            document.getElementById("distance").innerText =
                formatDistance(distance);

            if (accuracy > 100) {
                statusCard.className = "status-card status-fail";
                statusCard.innerText = "GPS chưa đủ chính xác";

                gpsMessage.style.color = "red";
                gpsMessage.innerText = "Nếu bạn đang dùng máy tính, vui lòng điểm danh bằng điện thoại để hệ thống lấy vị trí chính xác hơn.";
                return;
            }

            if (distance <= CHECKIN_RADIUS_METERS) {
                statusCard.className = "status-card status-success";
                statusCard.innerText = "Điểm danh thành công";

                gpsMessage.style.color = "green";
                gpsMessage.innerText = "✅ Bạn đang trong khu vực điểm danh.";
            } else {
                statusCard.className = "status-card status-fail";
                statusCard.innerText = "Ngoài khu vực điểm danh";

                gpsMessage.style.color = "red";
                gpsMessage.innerText = "❌ Bạn chưa ở trong khu vực điểm danh tại Nhà Thờ.";
            }
        },
        function(error) {
            gpsMessage.style.color = "red";

            if (error.code === error.PERMISSION_DENIED) {
                gpsMessage.innerText = "Bạn cần cho phép trình duyệt truy cập vị trí.";
            } else {
                gpsMessage.innerText = "Không thể lấy vị trí. Vui lòng thử lại.";
            }
        }
    );
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return R * c;
}

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

// //hàm format khoảng cách
// function formatDistance(distance) {
//     if (distance < 1000) {
//         return distance.toFixed(1) + " m";
//     }

//     return (distance / 1000).toFixed(1) + " km";
// }//hết



//đổi mật khẩu//
function changePasswordDemo() {
    const currentPassword = document.getElementById("currentPassword").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();
    const message = document.getElementById("passwordMessage");

    if (!currentPassword || !newPassword || !confirmPassword) {
        message.style.color = "red";
        message.innerText = "Vui lòng nhập đầy đủ thông tin.";
        return;
    }

    if (currentPassword !== "123456") {
        message.style.color = "red";
        message.innerText = "Mật khẩu hiện tại không đúng.";
        return;
    }

    if (newPassword.length < 6) {
        message.style.color = "red";
        message.innerText = "Mật khẩu mới phải có ít nhất 6 ký tự.";
        return;
    }

    if (newPassword !== confirmPassword) {
        message.style.color = "red";
        message.innerText = "Xác nhận mật khẩu mới không khớp.";
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

localStorage.setItem(
    "password_" + currentUser.username,
    newPassword
);

    message.style.color = "green";
    message.innerText = "Đổi mật khẩu thành công!";
}
//////hết


function addScoreDemo() {
    const scoreValue = document.getElementById("scoreValue").value.trim();
    const scoreReason = document.getElementById("scoreReason").value.trim();
    const message = document.getElementById("scoreMessage");

    if (!scoreValue || !scoreReason) {
        message.style.color = "red";
        message.innerText = "Vui lòng nhập số điểm và lý do.";
        return;
    }

    if (Number(scoreValue) === 0) {
        message.style.color = "red";
        message.innerText = "Số điểm không được bằng 0.";
        return;
    }

    message.style.color = "green";
    message.innerText = "Đã lưu điểm demo thành công!";
}

//quản lý buổi học
function createSessionDemo() {
    const sessionName = document.getElementById("sessionName").value.trim();
    const sessionDate = document.getElementById("sessionDate").value;
    const sessionStart = document.getElementById("sessionStart").value;
    const sessionEnd = document.getElementById("sessionEnd").value;
    const message = document.getElementById("sessionMessage");

    if (!sessionName || !sessionDate || !sessionStart || !sessionEnd) {
        message.style.color = "red";
        message.innerText = "Vui lòng nhập đầy đủ thông tin buổi học.";
        return;
    }

    if (sessionStart >= sessionEnd) {
        message.style.color = "red";
        message.innerText = "Giờ kết thúc phải sau giờ bắt đầu.";
        return;
    }

    message.style.color = "green";
    message.innerText = "Đã tạo buổi học demo thành công!";
}//hết


//quản lý lịch học
function createScheduleDemo() {
    const scheduleDate = document.getElementById("scheduleDate").value;
    const scheduleTitle = document.getElementById("scheduleTitle").value.trim();
    const bibleVerse = document.getElementById("bibleVerse").value.trim();
    const scheduleActivity = document.getElementById("scheduleActivity").value.trim();
    const message = document.getElementById("scheduleMessage");

    if (!scheduleDate || !scheduleTitle || !bibleVerse || !scheduleActivity) {
        message.style.color = "red";
        message.innerText = "Vui lòng nhập đầy đủ thông tin lịch học.";
        return;
    }

    message.style.color = "green";
    message.innerText = "Đã lưu lịch học demo thành công!";
}//hết

//mobile menu
function toggleMobileMenu() {
    const sidebar = document.querySelector(".sidebar");
    sidebar.classList.toggle("open");
}//hết

function loadDashboardUser() {
    if (!window.location.pathname.includes("dashboard.html")) {
        return;
    }

    const currentUsername = localStorage.getItem("currentUsername");

    let currentUser = null;

    if (currentUsername) {
        currentUser = demoUsers.find(user => user.username === currentUsername);
    }

    if (!currentUser) {
        currentUser = JSON.parse(localStorage.getItem("currentUser"));
    }

    if (!currentUser) {
        window.location.href = "index.html";
        return;
    }

    const welcomeName = document.getElementById("welcomeName");
    const welcomeGroup = document.getElementById("welcomeGroup");

    if (welcomeName) {
        welcomeName.innerText = "Xin chào, " + currentUser.fullName;
    }

    if (welcomeGroup) {
        welcomeGroup.innerText = "Nhóm: " + currentUser.groupName;
    }
}

document.addEventListener("DOMContentLoaded", loadDashboardUser);

// window.addEventListener("pageshow", function () {
//     loadDashboardUser();
// });


function filterStudentsDemo() {
    const keyword = document.getElementById("studentSearch").value.toLowerCase();
    const cards = document.querySelectorAll(".student-card");

    cards.forEach(card => {
        const name = card.getAttribute("data-name");

        if (name.includes(keyword)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

const profileDemoUsers = {
    tkh001: {
        username: "tkh001",
        fullName: "Trịnh Trần Thiên Phú",
        groupName: "Giô-sép",
        initial: "P",
        baseEncourage: 12
    },
    tkh002: {
        username: "tkh002",
        fullName: "Ngô Tấn Phát",
        groupName: "Giô-sép",
        initial: "P",
        baseEncourage: 8
    },
    tkh003: {
        username: "tkh003",
        fullName: "Phạm Bá Nam",
        groupName: "Đa-vít",
        initial: "N",
        baseEncourage: 15
    }
};

function getProfileUsernameFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const username = params.get("user");

    if (username) {
        return username.toLowerCase().trim();
    }

    return "tkh001";
}

function loadProfileDemo() {
    if (!window.location.pathname.includes("profile.html")) {
        return;
    }

    const profileUsername = getProfileUsernameFromUrl();
    const profileUser = profileDemoUsers[profileUsername];

    if (!profileUser) {
        document.getElementById("profileName").innerText = "Không tìm thấy thành viên";
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    document.getElementById("profileName").innerText = "Hồ sơ: " + profileUser.fullName;
    document.getElementById("profileGroup").innerText = "Nhóm: " + profileUser.groupName;
    document.getElementById("profileAvatar").innerText = profileUser.initial;
    document.getElementById("profileFullName").innerText = profileUser.fullName;
    document.getElementById("profileUsername").innerText = profileUser.username + " · " + profileUser.groupName;

    const encourageKey = "encourage_" + profileUsername;
    const encouragedByKey = "encouragedBy_" + profileUsername;

    const extraCount = Number(localStorage.getItem(encourageKey)) || 0;
    document.getElementById("encourageCount").innerText =
        profileUser.baseEncourage + extraCount;

    const encourageButton = document.querySelector(".encourage-btn");
    const encourageMessage = document.getElementById("encourageMessage");

    if (currentUser && currentUser.username === profileUsername) {
        encourageButton.disabled = true;
        encourageMessage.style.color = "red";
        encourageMessage.innerText = "Bạn không thể tự khích lệ chính mình.";
        return;
    }

    if (currentUser) {
        const encouragedBy = JSON.parse(localStorage.getItem(encouragedByKey)) || [];

        if (encouragedBy.includes(currentUser.username)) {
            encourageButton.disabled = true;
            encourageMessage.style.color = "#374151";
            encourageMessage.innerText = "Bạn đã khích lệ thành viên này rồi.";
        }
    }
}

function encourageUserDemo() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser) {
        window.location.href = "index.html";
        return;
    }

    const profileUsername = getProfileUsernameFromUrl();

    if (currentUser.username === profileUsername) {
        return;
    }

    const encourageKey = "encourage_" + profileUsername;
    const encouragedByKey = "encouragedBy_" + profileUsername;

    const profileUser = profileDemoUsers[profileUsername];

    let extraCount = Number(localStorage.getItem(encourageKey)) || 0;
    let encouragedBy = JSON.parse(localStorage.getItem(encouragedByKey)) || [];

    if (encouragedBy.includes(currentUser.username)) {
        return;
    }

    extraCount++;
    encouragedBy.push(currentUser.username);

    localStorage.setItem(encourageKey, extraCount);
    localStorage.setItem(encouragedByKey, JSON.stringify(encouragedBy));

    document.getElementById("encourageCount").innerText =
        profileUser.baseEncourage + extraCount;

    const encourageButton = document.querySelector(".encourage-btn");
    const encourageMessage = document.getElementById("encourageMessage");

    encourageButton.disabled = true;
    encourageMessage.style.color = "green";
    encourageMessage.innerText = "Bạn đã gửi một lời khích lệ!";
}

document.addEventListener("DOMContentLoaded", loadProfileDemo);


function runDashboardLoader() {
    loadDashboardUser();

    setTimeout(() => {
        loadDashboardUser();
    }, 300);
}

document.addEventListener("DOMContentLoaded", runDashboardLoader);

window.addEventListener("pageshow", runDashboardLoader);

document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
        runDashboardLoader();
    }
});


function runPageLoaders() {
    loadDashboardUser();

    setTimeout(() => {
        loadDashboardUser();
    }, 300);
}

document.addEventListener("DOMContentLoaded", runPageLoaders);
window.addEventListener("pageshow", runPageLoaders);


function runProfileLoader() {
    loadProfileDemo();

    setTimeout(() => {
        loadProfileDemo();
    }, 300);
}

document.addEventListener("DOMContentLoaded", runProfileLoader);
window.addEventListener("pageshow", runProfileLoader);