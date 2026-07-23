const API_BASE_URL = "http://localhost:5000";

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
        fullName: "Trịnh Thiên Phú",
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

async function loginDemo() {
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const message = document.getElementById("loginMessage");

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
        message.style.color = "red";
        message.innerText = "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.";
        return;
    }

    message.style.color = "#555";
    message.innerText = "Đang đăng nhập...";

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            message.style.color = "red";
            message.innerText =
                result?.error?.message ||
                "Đăng nhập không thành công.";
            return;
        }

        const backendUser = result.data.user;

        const currentUser = {
            id: backendUser.id,
            memberId: backendUser.memberId,
            username: backendUser.username,
            role: String(backendUser.role).toLowerCase(),
            fullName: backendUser.fullName || "Quản trị viên TKH",
            tkhCode: backendUser.tkhCode,
            groupName: null,
            mustChangePassword: backendUser.mustChangePassword
        };

        localStorage.setItem(
            "accessToken",
            result.data.accessToken
        );

        localStorage.setItem(
            "currentUsername",
            currentUser.username
        );

        localStorage.setItem(
            "currentUser",
            JSON.stringify(currentUser)
        );

        message.style.color = "green";
        message.innerText = "Đăng nhập thành công!";

        setTimeout(() => {
            if (currentUser.mustChangePassword) {
                window.location.href = "change-password.html";
                return;
            }

            if (currentUser.role === "admin") {
                window.location.href = "admin-dashboard.html";
            } else {
                window.location.href = "dashboard.html";
            }
        }, 500);
    } catch (error) {
        console.error("Login error:", error);

        message.style.color = "red";
        message.innerText =
            "Không thể kết nối đến hệ thống. Vui lòng thử lại.";
    }
}
//đổi thành km nếu hơn 1000m
function formatDistance(distance) {

    if (distance < 1000) {
        return distance.toFixed(1) + " m";
    }

    return (distance / 1000).toFixed(1) + " km";
}//hết


function logoutDemo() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("currentUsername");

    window.location.href = "index.html";
}

function confirmLogout(event) {
    event.preventDefault();

    const modal = document.getElementById("logoutModal");

    if (modal) {
        modal.classList.remove("hidden");
    }
}

function closeLogoutModal() {
    const modal = document.getElementById("logoutModal");

    if (modal) {
        modal.classList.add("hidden");
    }
}


const CHURCH_LOCATION = {
    lat: 10.765926509333024,
    lng: 106.6643590819157
};


const attendanceCheckinConfigDemo = {
    activeSession: "Buổi học hiện tại",

    windows: {
        devotion: {
            label: "Tĩnh nguyện",
            mode: "auto",
            startTime: "05:30",
            endTime: "06:00",
            points: 2,
            note: "Điểm challenge tĩnh nguyện"
        },
        morning: {
            label: "Đầu giờ",
            mode: "manual",
            points: 5,
            note: "Điểm danh đầu giờ"
        },
        break: {
            label: "Giờ ra chơi",
            mode: "manual",
            points: 3,
            note: "Dành cho học viên đến trễ"
        },
        end: {
            label: "Cuối giờ",
            mode: "manual",
            points: 5,
            note: "Điểm danh cuối giờ"
        }
    }
};


let currentCheckinRadiusMeters = 200;
let currentAttendanceSessionApi = null;


async function loadAttendancePageData() {
    const sessionText =
        document.getElementById("currentAttendanceSessionText");

    const radiusText =
        document.getElementById("checkinRadiusText");

    const activeWindow =
        document.getElementById("activeCheckinWindow");

    if (!sessionText && !radiusText && !activeWindow) {
        return;
    }

    const token = localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return;
    }

    if (sessionText) {
        sessionText.innerText =
            "Đang tải buổi học đang mở...";
    }

    if (radiusText) {
        radiusText.innerText =
            "Đang tải cấu hình điểm danh...";
    }

    if (activeWindow) {
        activeWindow.innerText =
            "Đang kiểm tra trạng thái điểm danh...";
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/attendance/current-session`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (response.status === 401) {
            logoutDemo();
            return;
        }

        if (response.status === 403) {
            window.location.href =
                "admin-dashboard.html";
            return;
        }

        if (response.status === 404) {
            currentAttendanceSessionApi = null;

            if (sessionText) {
                sessionText.innerText =
                    result?.error?.message ||
                    "Hiện chưa có buổi học nào đang mở.";
            }

            if (radiusText) {
                radiusText.innerText =
                    "Điểm danh hiện chưa được mở.";
            }

            if (activeWindow) {
                activeWindow.innerText =
                    "Chưa có buổi học đang mở điểm danh.";
            }

            return;
        }

        if (!response.ok || !result.success) {
            currentAttendanceSessionApi = null;

            if (sessionText) {
                sessionText.innerText =
                    "Không thể tải thông tin buổi học.";
            }

            if (radiusText) {
                radiusText.innerText =
                    result?.error?.message ||
                    "Không thể tải cấu hình điểm danh.";
            }

            return;
        }

        const session = result.data.session;

        currentAttendanceSessionApi = session;

        currentCheckinRadiusMeters =
            Number(session.attendanceRadiusM) || 200;

        if (
            session.location?.latitude !== null &&
            session.location?.latitude !== undefined
        ) {
            CHURCH_LOCATION.lat =
                Number(session.location.latitude);
        }

        if (
            session.location?.longitude !== null &&
            session.location?.longitude !== undefined
        ) {
            CHURCH_LOCATION.lng =
                Number(session.location.longitude);
        }

        const startDate =
            parseSqlLocalDateTime(
                session.scheduledStartAt
            );

        const dateText = startDate
            ? startDate.toLocaleDateString("vi-VN")
            : "Chưa có ngày học";

        const startTime = startDate
            ? startDate.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit"
            })
            : "";

        if (sessionText) {
            sessionText.innerText =
                `${session.name} · ${dateText}` +
                (startTime ? ` · ${startTime}` : "");
        }

        if (radiusText) {
            radiusText.innerText =
                "Chỉ điểm danh được khi bạn ở trong bán kính " +
                currentCheckinRadiusMeters +
                " m từ " +
                (session.location?.name ||
                    "Nhà Thờ Nguyễn Tri Phương") +
                ".";
        }

        if (activeWindow) {
            activeWindow.innerText =
                "Buổi học đang mở · Có thể điểm danh";
        }
    } catch (error) {
        console.error(
            "Load attendance session error:",
            error
        );

        currentAttendanceSessionApi = null;

        if (sessionText) {
            sessionText.innerText =
                "Không thể kết nối đến Backend.";
        }

        if (radiusText) {
            radiusText.innerText =
                "Vui lòng kiểm tra kết nối và thử lại.";
        }

        if (activeWindow) {
            activeWindow.innerText =
                "Không thể tải trạng thái điểm danh.";
        }
    }
}


function loadAttendanceConfig() {

    const radiusText =
        document.getElementById("checkinRadiusText");

    if (!radiusText) {
        return;
    }

    radiusText.innerText =
        "Chỉ điểm danh được khi bạn ở trong bán kính " +
        CHECKIN_RADIUS_METERS +
        "m từ Nhà Thờ Nguyễn Tri Phương.";
}


async function saveAttendanceDemo({
    latitude,
    longitude,
    accuracyM,
    distanceM
}) {
    const token = localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();

        return {
            success: false,
            message: "Phiên đăng nhập không hợp lệ."
        };
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/attendance/check-in`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    latitude,
                    longitude,
                    accuracyM,
                    deviceInfo: navigator.userAgent
                })
            }
        );

        const result = await response.json();

        if (response.status === 401) {
            logoutDemo();

            return {
                success: false,
                message: "Phiên đăng nhập đã hết hạn."
            };
        }

        if (!response.ok || !result.success) {
            return {
                success: false,
                code: result?.error?.code,
                message:
                    result?.error?.message ||
                    "Không thể điểm danh.",
                details: result?.error?.details || null
            };
        }

        return {
            success: true,
            message:
                result?.data?.message ||
                "Điểm danh thành công.",
            data: result.data
        };
    } catch (error) {
        console.error("Attendance check-in error:", error);

        return {
            success: false,
            message:
                "Không thể kết nối đến Backend."
        };
    }
}

function openGpsHelpModal() {
    const modal = document.getElementById("gpsHelpModal");

    if (modal) {
        modal.classList.remove("hidden");
    }
}

function closeGpsHelpModal() {
    const modal = document.getElementById("gpsHelpModal");

    if (modal) {
        modal.classList.add("hidden");
    }
}

function retryGpsAfterHelp() {
    closeGpsHelpModal();
    checkInDemo();
}

async function checkInDemo() {
    const gpsMessage = document.getElementById("gpsMessage");
    const statusCard = document.getElementById("attendanceStatus");

    if (!currentAttendanceSessionApi) {
        statusCard.className =
            "status-card status-fail";

        statusCard.innerText =
            "Chưa mở điểm danh";

        gpsMessage.style.color = "red";

        gpsMessage.innerText =
            "Hiện chưa có buổi học nào đang mở điểm danh.";

        return;
    }

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
        async function(position) {
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

            if (distance <= currentCheckinRadiusMeters) {
                statusCard.className = "status-card status-success";
                statusCard.innerText = "Điểm danh thành công";

                gpsMessage.style.color = "green";
                gpsMessage.innerText = "✅ Bạn đang trong khu vực điểm danh.";

                const checkinResult = await saveAttendanceDemo({
                    latitude: currentLat,
                    longitude: currentLng,
                    accuracyM: accuracy,
                    distanceM: distance
                });

                if (!checkinResult.success) {
                    statusCard.className =
                        "status-card status-fail";

                    statusCard.innerText =
                        checkinResult.code ===
                        "ATTENDANCE_ALREADY_RECORDED"
                            ? "Đã điểm danh"
                            : "Không thể điểm danh";

                    gpsMessage.style.color = "red";

                    gpsMessage.innerText =
                        checkinResult.message;

                    return;
                }

                statusCard.className =
                    "status-card status-success";

                statusCard.innerText =
                    "Điểm danh thành công";

                gpsMessage.style.color = "green";

                gpsMessage.innerText =
                    "✅ " + checkinResult.message;

                loadAttendanceHistoryDemo();
            }
             else {
                statusCard.className = "status-card status-fail";
                statusCard.innerText = "Ngoài khu vực điểm danh";

                gpsMessage.style.color = "red";
                gpsMessage.innerText = "❌ Bạn chưa ở trong khu vực điểm danh tại Nhà Thờ.";
            }
        },
        function(error) {
            gpsMessage.style.color = "red";

            if (error.code === error.PERMISSION_DENIED) {
                gpsMessage.innerHTML = `
                    ❌ Không thể truy cập vị trí.<br>
                    Bạn có thể đã từ chối quyền GPS trước đó.<br>
                    Vui lòng bấm “Hướng dẫn bật quyền vị trí” để xem cách bật lại.
                `;

                openGpsHelpModal();
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                gpsMessage.innerText =
                    "Không thể xác định vị trí hiện tại. Vui lòng bật GPS và thử lại.";
            } else if (error.code === error.TIMEOUT) {
                gpsMessage.innerText =
                    "Quá thời gian lấy vị trí. Vui lòng kiểm tra GPS hoặc kết nối mạng rồi thử lại.";
            } else {
                gpsMessage.innerText =
                    "Không thể lấy vị trí. Vui lòng thử lại.";
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
async function changePasswordDemo() {
    const currentPasswordInput =
        document.getElementById("currentPassword");

    const newPasswordInput =
        document.getElementById("newPassword");

    const confirmPasswordInput =
        document.getElementById("confirmPassword");

    const message =
        document.getElementById("passwordMessage");

    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        message.style.color = "red";
        message.innerText = "Vui lòng nhập đầy đủ thông tin.";
        return;
    }

    if (newPassword.length < 8) {
        message.style.color = "red";
        message.innerText =
            "Mật khẩu mới phải có ít nhất 8 ký tự.";
        return;
    }

    if (newPassword !== confirmPassword) {
        message.style.color = "red";
        message.innerText =
            "Mật khẩu xác nhận không khớp.";
        return;
    }

    const token = localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return;
    }

    message.style.color = "#555";
    message.innerText = "Đang đổi mật khẩu...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/auth/change-password`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            }
        );

        const result = await response.json();

        if (response.status === 401) {
            logoutDemo();
            return;
        }

        if (!response.ok || !result.success) {
            message.style.color = "red";
            message.innerText =
                result?.error?.message ||
                "Không thể đổi mật khẩu.";
            return;
        }

        const currentUser = JSON.parse(
            localStorage.getItem("currentUser")
        );

        if (currentUser) {
            currentUser.mustChangePassword = false;

            localStorage.setItem(
                "currentUser",
                JSON.stringify(currentUser)
            );
        }

        currentPasswordInput.value = "";
        newPasswordInput.value = "";
        confirmPasswordInput.value = "";

        message.style.color = "green";
        message.innerText =
            "Đổi mật khẩu thành công!";

        setTimeout(() => {
            if (currentUser?.role === "admin") {
                window.location.href =
                    "admin-dashboard.html";
            } else {
                window.location.href =
                    "dashboard.html";
            }
        }, 700);
    } catch (error) {
        console.error("Change password error:", error);

        message.style.color = "red";
        message.innerText =
            "Không thể kết nối đến hệ thống.";
    }
}
//////hết


function addScoreDemo() {
    const username = document.getElementById("scoreUser").value;
    const scoreType = document.getElementById("scoreType").value;
    const scoreValue = document.getElementById("scoreValue").value.trim();
    const scoreReason = document.getElementById("scoreReason").value.trim();
    const message = document.getElementById("scoreMessage");

    if (!username || !scoreValue || !scoreReason) {
        message.style.color = "red";
        message.innerText = "Vui lòng chọn học viên, nhập điểm và lý do.";
        return;
    }

    if (Number(scoreValue) === 0) {
        message.style.color = "red";
        message.innerText = "Số điểm không được bằng 0.";
        return;
    }

    const student = findStudentByUsernameDemo(username);

    if (!student) {
        message.style.color = "red";
        message.innerText = "Không tìm thấy học viên.";
        return;
    }

    const scores = getStoredScoresDemo();

    scores.unshift({
        id: Date.now(),
        username: student.username,
        fullName: student.fullName,
        groupName: student.groupName,
        scoreType: scoreType,
        scoreTypeLabel: getScoreTypeLabelDemo(scoreType),
        scoreValue: Number(scoreValue),
        reason: scoreReason,
        createdAt: new Date().toLocaleString("vi-VN")
    });

    saveStoredScoresDemo(scores);

    document.getElementById("scoreValue").value = "";
    document.getElementById("scoreReason").value = "";

    message.style.color = "green";
    message.innerText = "Đã lưu điểm thành công cho " + student.fullName + ".";

    loadAdminScoreHistoryDemo();
    loadAdminScoreSummaryDemo();
}

//quản lý buổi học
function getStoredSessionsDemo() {
    return JSON.parse(localStorage.getItem("tkhSessionsDemo")) || [];
}

function saveStoredSessionsDemo(sessions) {
    localStorage.setItem("tkhSessionsDemo", JSON.stringify(sessions));
}

async function createSessionDemo() {
    const sessionName =
        document.getElementById("sessionName").value.trim();

    const sessionDate =
        document.getElementById("sessionDate").value;

    const sessionStart =
        document.getElementById("sessionStart").value;

    const sessionEnd =
        document.getElementById("sessionEnd").value;

    const message =
        document.getElementById("sessionMessage");

    if (
        !sessionName ||
        !sessionDate ||
        !sessionStart ||
        !sessionEnd
    ) {
        message.style.color = "red";
        message.innerText =
            "Vui lòng nhập đầy đủ thông tin buổi học.";
        return;
    }

    if (sessionStart >= sessionEnd) {
        message.style.color = "red";
        message.innerText =
            "Giờ kết thúc phải sau giờ bắt đầu.";
        return;
    }

    const token = localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return;
    }

    const existingSessionNumbers =
        adminSessionsApiCache
            .map(session => Number(session.sessionNo))
            .filter(Number.isInteger);

    const nextSessionNo =
        existingSessionNumbers.length > 0
            ? Math.max(...existingSessionNumbers) + 1
            : 1;

    const scheduledStartAt =
        `${sessionDate}T${sessionStart}:00`;

    const scheduledEndAt =
        `${sessionDate}T${sessionEnd}:00`;

    const requestBody = {
        name: sessionName,
        sessionNo: nextSessionNo,
        scheduledStartAt,
        scheduledEndAt,
        checkinOpenAt: null,
        checkinCloseAt: null,
        locationName:
            "Hội Thánh Nguyễn Tri Phương",
        latitude: 10.7659265,
        longitude: 106.6643591,
        attendanceRadiusM: 200
    };

    message.style.color = "#555";
    message.innerText = "Đang tạo buổi học...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/sessions`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            }
        );

        const result = await response.json();

        if (response.status === 401) {
            logoutDemo();
            return;
        }

        if (response.status === 403) {
            window.location.href =
                "dashboard.html";
            return;
        }

        if (!response.ok || !result.success) {
            message.style.color = "red";
            message.innerText =
                result?.error?.message ||
                "Không thể tạo buổi học.";
            return;
        }

        document.getElementById("sessionName").value = "";
        document.getElementById("sessionDate").value = "";
        document.getElementById("sessionStart").value = "";
        document.getElementById("sessionEnd").value = "";

        message.style.color = "green";
        message.innerText =
            "Đã tạo buổi học thành công!";

        await loadAdminSessionsDemo();
    } catch (error) {
        console.error("Create session error:", error);

        message.style.color = "red";
        message.innerText =
            "Không thể kết nối đến Backend.";
    }
}//hết


//quản lý lịch học
function getStoredSchedulesDemo() {
    return JSON.parse(localStorage.getItem("tkhSchedulesDemo")) || [];
}

function saveStoredSchedulesDemo(schedules) {
    localStorage.setItem("tkhSchedulesDemo", JSON.stringify(schedules));
}

function createScheduleDemo() {
    const sessionId = document.getElementById("scheduleSession").value;
    const scheduleTitle = document.getElementById("scheduleTitle").value.trim();
    const bibleVerse = document.getElementById("bibleVerse").value.trim();
    const scheduleActivity = document.getElementById("scheduleActivity").value.trim();
    const message = document.getElementById("scheduleMessage");

    if (!sessionId || !scheduleTitle || !bibleVerse || !scheduleActivity) {
        message.style.color = "red";
        message.innerText = "Vui lòng nhập đầy đủ thông tin lịch học.";
        return;
    }
    //mới....
    const sessions =
        getStoredSessionsDemo();

        const selectedSession =
        sessions.find(
            item =>
                String(item.id) === String(sessionId)
        );

        if (!selectedSession) {
            message.style.color = "red";
            message.innerText = "Không tìm thấy buổi học.";

            return;
        }
    //hết....

    const schedules = getStoredSchedulesDemo();

    const existingScheduleIndex = schedules.findIndex(
    item => String(item.sessionId) === String(selectedSession.id)
    );

    if (existingScheduleIndex !== -1) {
        const confirmUpdate = confirm(
            "Buổi học này đã có lịch học. Bạn có muốn cập nhật lịch học hiện tại không?"
        );

        if (!confirmUpdate) {
            return;
        }

        schedules[existingScheduleIndex] = {
            ...schedules[existingScheduleIndex],
            sessionId: selectedSession.id,
            sessionName: selectedSession.name,
            date: selectedSession.date,
            title: scheduleTitle,
            bibleVerse: bibleVerse,
            activity: scheduleActivity,
            updatedAt: new Date().toLocaleString("vi-VN")
        };

        saveStoredSchedulesDemo(schedules);

        document.getElementById("scheduleTitle").value = "";
        document.getElementById("bibleVerse").value = "";
        document.getElementById("scheduleActivity").value = "";

        message.style.color = "green";
        message.innerText = "Đã cập nhật lịch học thành công!";

        loadAdminSchedulesDemo();
        loadStudentSchedulesDemo();

        return;
    }

    schedules.unshift({

    id: Date.now(),

    sessionId: selectedSession.id,

    sessionName: selectedSession.name,

    date: selectedSession.date,

    title: scheduleTitle,

    bibleVerse: bibleVerse,

    activity: scheduleActivity,

    createdAt:
        new Date().toLocaleString("vi-VN")

    });

    saveStoredSchedulesDemo(schedules);

    
    document.getElementById("scheduleTitle").value = "";
    document.getElementById("bibleVerse").value = "";
    document.getElementById("scheduleActivity").value = "";

    message.style.color = "green";
    message.innerText = "Đã lưu lịch học thành công!";

    loadAdminSchedulesDemo();
}//hết

//mobile menu
function toggleMobileMenu() {
    const sidebar = document.querySelector(".sidebar");
    sidebar.classList.toggle("open");
}//hết

function loadDashboardUser() {
    const welcomeName = document.getElementById("welcomeName");
    const welcomeGroup = document.getElementById("welcomeGroup");

    if (!welcomeName && !welcomeGroup) {
        return;
    }

    const currentUser = JSON.parse(
        localStorage.getItem("currentUser")
    );

    if (!currentUser) {
        return;
    }

    if (welcomeName) {
        const displayName =
            currentUser.fullName ||
            currentUser.username ||
            "Học viên";

        const tkhCode = currentUser.tkhCode
            ? ` (${currentUser.tkhCode})`
            : "";

        welcomeName.innerText =
            `Xin chào, ${displayName}${tkhCode}`;
    }

    if (welcomeGroup) {
        const groupName =
            currentUser.group?.name ||
            currentUser.groupName ||
            "Chưa phân nhóm";

        const seasonName =
            currentUser.season?.name ||
            "Thánh Kinh Hè 2026";

        welcomeGroup.innerText =
            `Nhóm: ${groupName} · ${seasonName}`;
    }
}



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
        return username.trim();
    }

    const currentUser = getCurrentUserDemo();

    if (currentUser) {
        return currentUser.username;
    }

    return "";
}

function loadProfileDemo() {
    const profileNameEl = document.getElementById("profileName");

    if (!profileNameEl) {
        return;
    }

    const currentUser = getCurrentUserDemo();
    const profileUsername = getProfileUsernameFromUrl();
    const profileUser = findStudentByUsernameDemo(profileUsername) || currentUser;

    const profileGroupEl = document.getElementById("profileGroup");
    const profileAvatarEl = document.getElementById("profileAvatar");
    const profileFullNameEl = document.getElementById("profileFullName");
    const profileUsernameEl = document.getElementById("profileUsername");
    const sendBox = document.getElementById("encouragementSendBox");

    if (!profileUser) {
        profileNameEl.innerText = "Không tìm thấy thành viên";

        if (profileGroupEl) profileGroupEl.innerText = "";
        if (profileAvatarEl) profileAvatarEl.innerText = "?";
        if (profileFullNameEl) profileFullNameEl.innerText = "Không tìm thấy thành viên";
        if (profileUsernameEl) profileUsernameEl.innerText = "";

        if (sendBox) {
            sendBox.style.display = "none";
        }

        return;
    }

    profileNameEl.innerText = "Hồ sơ: " + profileUser.fullName;

    if (profileGroupEl) {
        profileGroupEl.innerText = "Nhóm: " + profileUser.groupName;
    }

    if (profileAvatarEl) {
        profileAvatarEl.innerText = getStudentAvatarInitialDemo(profileUser);
    }

    if (profileFullNameEl) {
        profileFullNameEl.innerText = profileUser.fullName;
    }

    if (profileUsernameEl) {
        profileUsernameEl.innerText =
            profileUser.username + " · Nhóm " + profileUser.groupName;
    }

    if (sendBox && currentUser) {
        const isMyProfile =
            currentUser.username.toLowerCase() ===
            profileUser.username.toLowerCase();

        sendBox.style.display = isMyProfile ? "none" : "block";
    }
}

// function encourageUserDemo() {
//     const currentUser = JSON.parse(localStorage.getItem("currentUser"));

//     if (!currentUser) {
//         window.location.href = "index.html";
//         return;
//     }

//     const profileUsername = getProfileUsernameFromUrl();

//     if (currentUser.username === profileUsername) {
//         return;
//     }

//     const encourageKey = "encourage_" + profileUsername;
//     const encouragedByKey = "encouragedBy_" + profileUsername;

//     const profileUser = profileDemoUsers[profileUsername];

//     let extraCount = Number(localStorage.getItem(encourageKey)) || 0;
//     let encouragedBy = JSON.parse(localStorage.getItem(encouragedByKey)) || [];

//     if (encouragedBy.includes(currentUser.username)) {
//         return;
//     }

//     extraCount++;
//     encouragedBy.push(currentUser.username);

//     localStorage.setItem(encourageKey, extraCount);
//     localStorage.setItem(encouragedByKey, JSON.stringify(encouragedBy));

//     document.getElementById("encourageCount").innerText =
//         profileUser.baseEncourage + extraCount;

//     const encourageButton = document.querySelector(".encourage-btn");
//     const encourageMessage = document.getElementById("encourageMessage");

//     encourageButton.disabled = true;
//     encourageMessage.style.color = "green";
//     encourageMessage.innerText = "Bạn đã gửi một lời khích lệ!";
// }


//hàm lịch sử điểm danh
async function loadAttendanceHistoryDemo() {
    const historyContainer =
        document.getElementById("attendanceHistory");

    if (!historyContainer) {
        return;
    }

    const token = localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return;
    }

    historyContainer.innerHTML = `
        <p>Đang tải lịch sử điểm danh...</p>
    `;

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/attendance/history`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (response.status === 401) {
            logoutDemo();
            return;
        }

        if (response.status === 403) {
            historyContainer.innerHTML = `
                <p>
                    ${result?.error?.message ||
                    "Tài khoản chưa được liên kết với học viên."}
                </p>
            `;
            return;
        }

        if (!response.ok || !result.success) {
            historyContainer.innerHTML = `
                <p>
                    ${result?.error?.message ||
                    "Không thể tải lịch sử điểm danh."}
                </p>
            `;
            return;
        }

        const records = result.data.records || [];

        if (records.length === 0) {
            historyContainer.innerHTML = `
                <p>Chưa có lịch sử điểm danh.</p>
            `;
            return;
        }

        historyContainer.innerHTML = records.map(record => {
            const checkedInDate =
                parseSqlLocalDateTime(
                    record.checkedInAt
                );

            const checkedInText = checkedInDate
                ? checkedInDate.toLocaleString("vi-VN")
                : "—";

            const scheduledDate =
                parseSqlLocalDateTime(
                    record.session?.scheduledStartAt
                );

            const sessionDateText = scheduledDate
                ? scheduledDate.toLocaleDateString("vi-VN")
                : "—";

            const statusLabels = {
                PRESENT: "Có mặt",
                ABSENT: "Vắng",
                LATE: "Đi trễ",
                EXCUSED: "Có phép"
            };

            const statusLabel =
                statusLabels[record.status] ||
                record.status ||
                "—";

            const methodLabels = {
                GPS: "GPS",
                MANUAL: "Thủ công",
                QR: "QR"
            };

            const methodLabel =
                methodLabels[record.method] ||
                record.method ||
                "—";

            const distanceText =
                record.distanceM !== null &&
                record.distanceM !== undefined
                    ? formatDistance(
                        Number(record.distanceM)
                    )
                    : "—";

            const accuracyText =
                record.accuracyM !== null &&
                record.accuracyM !== undefined
                    ? `${Number(record.accuracyM).toFixed(1)} m`
                    : "—";

            return `
                <div class="question-card">
                    <h3>
                        ${record.session?.name || "Buổi học"}
                    </h3>

                    <p>
                        <strong>Ngày học:</strong>
                        ${sessionDateText}
                    </p>

                    <p>
                        <strong>Trạng thái:</strong>
                        ${statusLabel}
                    </p>

                    <p>
                        <strong>Phương thức:</strong>
                        ${methodLabel}
                    </p>

                    <p>
                        <strong>Khoảng cách:</strong>
                        ${distanceText}
                    </p>

                    <p>
                        <strong>Độ chính xác GPS:</strong>
                        ${accuracyText}
                    </p>

                    <p>
                        <strong>Nhóm:</strong>
                        ${record.group?.name || "Chưa phân nhóm"}
                    </p>

                    <p class="question-meta">
                        Điểm danh lúc: ${checkedInText}
                    </p>
                </div>
            `;
        }).join("");
    } catch (error) {
        console.error(
            "Load attendance history error:",
            error
        );

        historyContainer.innerHTML = `
            <p>Không thể kết nối đến Backend.</p>
        `;
    }
}//hết

const studyMaterialsDemo = [
    {
        session: "Buổi 1",
        title: "Đức tin đặt nền trên Lời Chúa",
        bibleVerse: "Thi Thiên 119:105",
        verseText: "Lời Chúa là ngọn đèn cho chân con, ánh sáng cho đường lối con.",
        note: "Tài liệu ôn tập dành cho buổi học đầu tiên.",
        files: [
            {
                icon: "📄",
                name: "Bài học Buổi 1",
                type: "PDF",
                size: "2.4 MB",
                url: "#"
            },
            {
                icon: "🖼️",
                name: "Slide Buổi 1",
                type: "PowerPoint",
                size: "5.1 MB",
                url: "#"
            }
        ]
    },
    {
        session: "Buổi 2",
        title: "Sống vâng phục Chúa mỗi ngày",
        bibleVerse: "Giô-suê 1:9",
        verseText: "Hãy mạnh dạn và can đảm; đừng run sợ, đừng kinh khiếp.",
        note: "Bao gồm câu gốc và tài liệu ôn tập nhóm nhỏ.",
        files: [
            {
                icon: "📄",
                name: "Phiếu học tập Buổi 2",
                type: "PDF",
                size: "1.8 MB",
                url: "#"
            },
            {
                icon: "🎵",
                name: "Audio câu gốc",
                type: "MP3",
                size: "3.6 MB",
                url: "#"
            }
        ]
    },
    {
        session: "Buổi 3",
        title: "Làm chứng về Chúa bằng đời sống",
        bibleVerse: "Ma-thi-ơ 5:16",
        verseText: "Ánh sáng các con hãy soi trước mặt người ta...",
        note: "Tài liệu sẽ được BTC cập nhật sau.",
        files: []
    }
];


function getStoredStudyMaterialsDemo() {
    const storedMaterials =
        JSON.parse(localStorage.getItem("studyMaterialsDemo")) || [];

    if (storedMaterials.length > 0) {
        return storedMaterials;
    }

    return studyMaterialsDemo;
}

function saveStoredStudyMaterialsDemo(materials) {
    localStorage.setItem("studyMaterialsDemo", JSON.stringify(materials));
}


async function validateCurrentSession() {
    const token = localStorage.getItem("accessToken");

    if (!token) {
        localStorage.removeItem("currentUser");
        localStorage.removeItem("currentUsername");
        window.location.href = "index.html";
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("currentUser");
            localStorage.removeItem("currentUsername");
            window.location.href = "index.html";
            return false;
        }

        const backendUser = result.data.user;

        const currentUser = {
            id: backendUser.id,
            memberId: backendUser.memberId,
            seasonMembershipId: backendUser.seasonMembershipId,
            username: backendUser.username,
            role: String(backendUser.role).toLowerCase(),
            fullName: backendUser.fullName || "Quản trị viên TKH",
            tkhCode: backendUser.tkhCode,
            season: backendUser.season || null,
            group: backendUser.group || null,
            groupName: backendUser.group?.name || null,
            mustChangePassword: backendUser.mustChangePassword
        };

        localStorage.setItem(
            "currentUsername",
            currentUser.username
        );

        localStorage.setItem(
            "currentUser",
            JSON.stringify(currentUser)
        );

        return true;
    } catch (error) {
        console.error("Session validation error:", error);

        localStorage.removeItem("accessToken");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("currentUsername");

        window.location.href = "index.html";
        return false;
    }
}

function isAdminPage() {
    return window.location.pathname
        .split("/")
        .pop()
        .startsWith("admin-");
}

function getCurrentPageName() {
    return window.location.pathname
        .split("/")
        .pop();
}

function isProtectedStudentPage() {
    const pageName = getCurrentPageName();

    const protectedStudentPages = [
        "dashboard.html",
        "attendance.html",
        "my-score.html",
        "group-score.html",
        "schedule.html",
        "profile.html",
        "student-directory.html",
        "session-questions.html",
        "study-materials.html"
    ];

    return protectedStudentPages.includes(pageName);
}

function isChangePasswordPage() {
    const pageName = window.location.pathname
        .split("/")
        .pop();

    return pageName === "change-password.html";
}


async function initializePage() {
    const adminPage = isAdminPage();
    const studentPage = isProtectedStudentPage();
    const changePasswordPage = isChangePasswordPage();

    const protectedPage =
        adminPage ||
        studentPage ||
        changePasswordPage;

    if (!protectedPage) {
        runPageLoaders();
        return;
    }

    const isAuthenticated = await validateCurrentSession();

    if (!isAuthenticated) {
        return;
    }

    const currentUser = JSON.parse(
        localStorage.getItem("currentUser")
    );

    if (!currentUser) {
        logoutDemo();
        return;
    }

    /*
     * Trang đổi mật khẩu:
     * - Người bắt buộc đổi mật khẩu được ở lại.
     * - Người đã đổi rồi được chuyển về dashboard đúng role.
     */
    if (changePasswordPage) {
        if (!currentUser.mustChangePassword) {
            if (currentUser.role === "admin") {
                window.location.href = "admin-dashboard.html";
            } else {
                window.location.href = "dashboard.html";
            }

            return;
        }

        runPageLoaders();
        return;
    }

    /*
     * Mọi trang khác đều buộc đổi mật khẩu trước.
     */
    if (currentUser.mustChangePassword) {
        window.location.href = "change-password.html";
        return;
    }

    /*
     * Bảo vệ trang Admin.
     */
    if (adminPage && currentUser.role !== "admin") {
        window.location.href = "dashboard.html";
        return;
    }

    /*
     * Bảo vệ trang học viên.
     */
    if (studentPage && currentUser.role !== "student") {
        window.location.href = "admin-dashboard.html";
        return;
    }

    runPageLoaders();
}


function runPageLoaders() {
    loadDashboardUser();
    loadProfileDemo();
    loadAttendanceHistoryDemo();
    loadMyQuestionsDemo();
    loadAdminQuestionsDemo();
    showAdminShortcutDemo();
    loadEncouragementListDemo();
    loadDashboardEncouragementCount();
    loadDirectoryEncouragementCounts();
    loadAdminEncouragementStats();
    loadAdminEncouragementReviewDemo();
    loadTodayEncouragementPreview();
    loadStudyMaterialsDemo();
    loadAdminStudyMaterialsDemo();
    loadAdminMembersTableDemo();
    loadStudentDirectoryDemo();
    loadGroupScoreDemo();
    loadGroupRankingDemo();
    loadAttendancePageData();
    loadScoreStudentOptionsDemo();
    loadAdminScoreHistoryDemo();
    loadMyScoreDemo();
    loadDashboardPersonalScoreDemo();
    loadMyGroupSummaryDemo();
    loadTopGroupRankingDemo();
    loadMyGroupRankDemo();
    loadTopPersonalRankingDemo();
    loadMyPersonalRankDemo();
    loadActiveCheckinWindowDemo();
    loadAdminCheckinWindowStatusDemo();
    loadDeviceWarningDemo();
    loadAdminAttendanceTableDemo();
    loadAdminAttendanceStatsDemo();
    loadAdminDashboardSummaryDemo();
    loadAdminDashboardGroupStatsDemo();
    loadAdminDashboardExtraStatsDemo();
    loadAdminGroupsDemo();
    loadAdminSessionsDemo();
    loadAdminSchedulesDemo();
    loadStudentSchedulesDemo();
    loadScheduleTimelineDemo();
    loadScheduleSessionOptionsDemo();
    loadStudentDashboardStatsDemo();
    loadGroupScoreHistoryDemo();
    loadAdminScoreSummaryDemo();
    loadBibleChallengeDemo();
    loadBibleChallengeSummaryDemo();
    loadBibleChallengeHistoryDemo();
    loadBibleChallengeProgressDemo();
}

document.addEventListener("DOMContentLoaded", initializePage);

window.addEventListener("pageshow", event => {
    if (event.persisted) {
        initializePage();
    }
});

function getStoredQuestionsDemo() {
    return JSON.parse(localStorage.getItem("sessionQuestionsDemo")) || [];
}

function saveStoredQuestionsDemo(questions) {
    localStorage.setItem("sessionQuestionsDemo", JSON.stringify(questions));
}

function submitQuestionDemo() {
    const session = document.getElementById("questionSession").value;
    const questionText = document.getElementById("questionText").value.trim();
    const message = document.getElementById("questionMessage");

    const questionType = document.querySelector(
        'input[name="questionType"]:checked'
    ).value;

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser")) ||
        demoUsers.find(user => user.username === localStorage.getItem("currentUsername"));

    if (!currentUser) {
        window.location.href = "index.html";
        return;
    }

    if (!questionText) {
        message.style.color = "red";
        message.innerText = "Vui lòng nhập câu hỏi hoặc ghi chú.";
        return;
    }

    const questions = getStoredQuestionsDemo();

    questions.unshift({
    session: session,
    text: questionText,
    questionType: questionType,
    typeLabel: questionType === "private" ? "🔒 Riêng tư" : "🌍 Công khai",
    userFullName: currentUser.fullName,
    username: currentUser.username,
    groupName: currentUser.groupName,
    createdAt: new Date().toLocaleString("vi-VN"),
    status: "Mới",
    adminReply: ""
    });

    saveStoredQuestionsDemo(questions);

    document.getElementById("questionText").value = "";

    message.style.color = "green";

    if (questionType === "private") {
        message.innerText =
            "🔒 Đã gửi câu hỏi riêng tư. BTC sẽ chuyển đến Diễn giả và phản hồi lại cho bạn trong thời gian sớm nhất.";
    } else {
        message.innerText =
            "🌍 Đã gửi câu hỏi công khai. BTC và Diễn giả sẽ cố gắng giải đáp câu hỏi của bạn trước Ban Thanh Niên trong phần giải đáp thắc mắc.";
    }

    loadMyQuestionsDemo();
}

function loadMyQuestionsDemo() {
    const list = document.getElementById("myQuestionList");

    if (!list) {
        return;
    }

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser")) ||
        demoUsers.find(user => user.username === localStorage.getItem("currentUsername"));

    if (!currentUser) {
        return;
    }

    const questions = getStoredQuestionsDemo()
        .filter(q => q.username === currentUser.username);

    if (questions.length === 0) {
        list.innerHTML = `<p class="empty-note">Chưa có câu hỏi nào được gửi trong phiên demo này.</p>`;
        return;
    }

    list.innerHTML = questions.map(q => `
    <div class="question-card">
        <h3>${q.session}</h3>
        <p><strong>Loại:</strong> ${q.typeLabel || "🔒 Riêng tư"}</p>
        <p>${q.text}</p>
        <p class="question-meta">Trạng thái: ${q.status} · ${q.createdAt}</p>
        ${
            q.adminReply
            ? `
                <p><strong>Phản hồi từ BTC:</strong> ${q.adminReply}</p>
                <p class="question-meta">Thời gian phản hồi: ${q.answeredAt || "Chưa có thông tin"}</p>
            `
            : ""
        }
    </div>
    `).join("");
}

function loadAdminQuestionsDemo() {
    const list = document.getElementById("adminQuestionList");

    if (!list) {
        return;
    }

    const questions = getStoredQuestionsDemo();

    if (questions.length === 0) {
        list.innerHTML = `<p class="empty-note">Chưa có câu hỏi nào trong phiên demo này.</p>`;
        return;
    }

    list.innerHTML = questions.map((q, index) => `
    <div class="question-card">
        <h3>${q.session}</h3>
        <p><strong>${q.userFullName}</strong> (${q.username}) · Nhóm ${q.groupName}</p>
        <p><strong>Loại:</strong> ${q.typeLabel || "🔒 Riêng tư"}</p>
        <p>${q.text}</p>
        <p class="question-meta">Trạng thái: ${q.status} · ${q.createdAt}</p>

        ${
            q.adminReply
            ? `
                <p><strong>Phản hồi từ BTC:</strong> ${q.adminReply}</p>
                <p class="question-meta">Thời gian phản hồi: ${q.answeredAt || "Chưa có thông tin"}</p>
            `
            : `
                <textarea
                    class="form-input question-reply-box"
                    id="reply_${index}"
                    placeholder="Nhập phản hồi từ BTC / Diễn giả..."
                ></textarea>

                <button class="profile-btn" onclick="replyQuestionDemo(${index})">
                    Gửi phản hồi
                </button>
            `
        }
    </div>
    `).join("");
}



//chỉ admin thấy
function showAdminShortcutDemo() {
    const currentUser =
        JSON.parse(localStorage.getItem("currentUser")) ||
        demoUsers.find(user => user.username === localStorage.getItem("currentUsername"));

    const adminLinks = document.querySelectorAll(".admin-only");

    adminLinks.forEach(link => {
        if (currentUser && currentUser.role === "admin") {
            link.classList.add("show-admin-link");
        } else {
            link.classList.remove("show-admin-link");
        }
    });
}

//hết

//hàm phản hồi về học viên
function replyQuestionDemo(index) {
    const questions = getStoredQuestionsDemo();
    const replyInput = document.getElementById("reply_" + index);

    if (!replyInput) {
        return;
    }

    const replyText = replyInput.value.trim();

    if (!replyText) {
        alert("Vui lòng nhập nội dung phản hồi.");
        return;
    }

    questions[index].adminReply = replyText;
    questions[index].status = "Đã trả lời";
    questions[index].answeredAt = new Date().toLocaleString("vi-VN");

    saveStoredQuestionsDemo(questions);
    loadAdminQuestionsDemo();
}// hết


function getStoredEncouragementsDemo() {
    const messages =
        JSON.parse(localStorage.getItem("encouragementMessagesDemo")) || [];

    const fixedMessages = messages.map((item, index) => {
        return {
            ...item,
            id: item.id || Date.now() + index,
            isPinned: item.isPinned || false
        };
    });

    localStorage.setItem(
        "encouragementMessagesDemo",
        JSON.stringify(fixedMessages)
    );

    return fixedMessages;
}

function saveStoredEncouragementsDemo(messages) {
    localStorage.setItem("encouragementMessagesDemo", JSON.stringify(messages));
}

function sendEncouragementDemo() {
    const currentUser =
        JSON.parse(localStorage.getItem("currentUser")) ||
        demoUsers.find(user => user.username === localStorage.getItem("currentUsername"));

    

    if (!currentUser) {
        window.location.href = "index.html";
        return;
    }

    const receiverUsername = getProfileUsernameFromUrl();
    const receiverUser = findStudentByUsernameDemo(receiverUsername);

    const encourageText = document.getElementById("encourageText").value.trim();
    const anonymous = document.getElementById("anonymousEncourage").checked;
    const message = document.getElementById("encourageMessage");

    if (currentUser.role === "admin") {
        message.style.color = "red";
        message.innerText = "Admin không gửi lời khích lệ trong chế độ học viên.";
        return;
        }

    if (!receiverUser) {
        message.style.color = "red";
        message.innerText = "Không tìm thấy người nhận.";
        return;
    }

    if (currentUser.username.toLowerCase() === receiverUsername.toLowerCase()) {
        message.style.color = "red";
        message.innerText = "Bạn không thể tự gửi lời khích lệ cho chính mình.";
        return;
    }

    if (!encourageText) {
        message.style.color = "red";
        message.innerText = "Vui lòng nhập lời khích lệ.";
        return;
    }

    const today = new Date().toDateString();
    const messages = getStoredEncouragementsDemo();

    const alreadySentToday = messages.find(item =>
    item.fromUsername.toLowerCase() === currentUser.username.toLowerCase() &&
    item.toUsername.toLowerCase() === receiverUser.username.toLowerCase() &&
    item.dateKey === today
    );

    if (alreadySentToday) {
        message.style.color = "red";
        message.innerText =
            "Bạn đã gửi lời khích lệ cho thành viên này hôm nay. Bạn có thể gửi lại vào ngày mai nhé.";
        return;
    }

    messages.unshift({
    id: Date.now(),
    fromUsername: currentUser.username,
    fromFullName: currentUser.fullName,
    toUsername: receiverUser.username,
    toFullName: receiverUser.fullName,
    text: encourageText,
    isAnonymous: anonymous,
    createdAt: new Date().toLocaleString("vi-VN"),
    dateKey: today,
    isRead: false,
    isPinned: false
    });

    saveStoredEncouragementsDemo(messages);

    document.getElementById("encourageText").value = "";
    document.getElementById("anonymousEncourage").checked = false;

    message.style.color = "green";
    message.innerText =
      `❤️ Cảm ơn bạn đã gửi lời khích lệ đến thành viên này 
            Một lời động viên nho nhỏ có thể mang lại rất nhiều sự ấm áp đến người nhận được. 
            Chúa ở cùng bạn luôn!`;
    loadEncouragementListDemo();
}

function loadEncouragementListDemo() {
    const list = document.getElementById("encouragementList");

    if (!list) {
        return;
    }

    const profileUsername = getProfileUsernameFromUrl();

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser")) ||
        demoUsers.find(user => user.username === localStorage.getItem("currentUsername"));

    let allMessages = getStoredEncouragementsDemo();

    if (
    currentUser &&
    currentUser.username.toLowerCase() === profileUsername.toLowerCase()
) {
        allMessages = allMessages.map(item => {
            if (
                item.toUsername.toLowerCase() === currentUser.username.toLowerCase()
            ) {
                return {
                    ...item,
                    isRead: true
                };
            }

            return item;
        });

        saveStoredEncouragementsDemo(allMessages);
    }

    const isOwner =
    currentUser &&
    currentUser.username.toLowerCase() === profileUsername.toLowerCase();

    if (!isOwner) {
    list.innerHTML = `
        <p class="empty-note">
            Đây là hộp thư cá nhân của thành viên này. 
            Bạn có thể gửi lời khích lệ, nhưng không thể xem nội dung họ đã nhận.
        </p>
    `;
    return;
}
    
    const messages = allMessages
    .filter(item => item.toUsername.toLowerCase() === profileUsername.toLowerCase())
    .sort((a, b) => {
        if (a.isPinned === b.isPinned) {
            return 0;
        }

        return a.isPinned ? -1 : 1;
    });

    if (messages.length === 0) {
        list.innerHTML = `
            <p class="empty-note">Chưa có lời khích lệ nào.</p>
        `;
        return;
    }

    list.innerHTML = messages.map(item => {
    const senderName = item.isAnonymous ? "Ẩn danh" : item.fromFullName;
    const avatarText = item.isAnonymous
        ? "🕵️‍♂️"
        : item.fromFullName.charAt(0).toUpperCase();


return `
    <div class="encouragement-card encouragement-card-with-avatar ${item.isPinned ? "pinned-encouragement-card" : ""}">
        <div class="encouragement-avatar">
            ${avatarText}
        </div>

        <div class="encouragement-content">
            <p>${item.isPinned ? "📌 " : "🌟 "}${item.text}</p>
            <p class="encouragement-author">
                — ${senderName}<br>
                ${item.createdAt}
            </p>

            ${
                isOwner
                ? `
                    <button
                        class="pin-encouragement-btn"
                        onclick="togglePinEncouragementDemo(${item.id})"
                    >
                        ${item.isPinned ? "Bỏ ghim" : "📌 Ghim"}
                    </button>
                `
                : ""
            }
        </div>
    </div>
`;
    }).join("");
}

function loadDashboardEncouragementCount() {
    const countElement = document.getElementById("encouragementReceivedCount");
    const statusText = document.getElementById("encouragementStatusText");

    if (!countElement || !statusText) {
        return;
    }

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser")) ||
        demoUsers.find(user => user.username === localStorage.getItem("currentUsername"));

    if (!currentUser) {
        return;
    }

    const messages =
        JSON.parse(localStorage.getItem("encouragementMessagesDemo")) || [];

    const receivedMessages = messages.filter(
    item =>
        item.toUsername.toLowerCase() ===
        currentUser.username.toLowerCase()
    );

    const unreadMessages = receivedMessages.filter(
        item => item.isRead === false
    );

    countElement.innerText = receivedMessages.length;

    if (unreadMessages.length > 0) {
        statusText.innerText =
            "Bạn có " + unreadMessages.length + " lời khích lệ mới ❤️";
    } else {
        statusText.innerText = "Lời khích lệ đã nhận";
    }
}

function goToMyEncouragementBox() {
    const currentUser = getCurrentUserDemo();

    if (!currentUser) {
        window.location.href = "index.html";
        return;
    }

    window.location.href = "profile.html?user=" + currentUser.username;
}


function loadDirectoryEncouragementCounts() {
    const countElements = document.querySelectorAll(".encourage-count");

    if (countElements.length === 0) {
        return;
    }

    const messages = getStoredEncouragementsDemo();

    countElements.forEach(element => {
        const username = element.getAttribute("data-user");

        const receivedCount = messages.filter(
            item =>
                item.toUsername.toLowerCase() === username.toLowerCase()
        ).length;

        element.innerText = "💌 " + receivedCount + " lời khích lệ";
    });
}


//tổng hợp khích lệ của admin
function loadAdminEncouragementStats() {
    const totalElement = document.getElementById("totalEncouragements");
    const todayElement = document.getElementById("todayEncouragements");
    const anonymousElement = document.getElementById("anonymousEncouragements");
    const topReceiversList = document.getElementById("topReceiversList");
    const topSendersList = document.getElementById("topSendersList");

    if (!totalElement) {
        return;
    }

    const messages = getStoredEncouragementsDemo();
    const today = new Date().toDateString();

    const todayMessages = messages.filter(item => item.dateKey === today);
    const anonymousMessages = messages.filter(item => item.isAnonymous);

    totalElement.innerText = messages.length;
    todayElement.innerText = todayMessages.length;
    anonymousElement.innerText = anonymousMessages.length;

    const receiverCounts = {};
    const senderCounts = {};

    messages.forEach(item => {
        receiverCounts[item.toFullName] = (receiverCounts[item.toFullName] || 0) + 1;
        senderCounts[item.fromFullName] = (senderCounts[item.fromFullName] || 0) + 1;
    });

    const topReceivers = Object.entries(receiverCounts)
        .sort((a, b) => b[1] - a[1]);

    const topSenders = Object.entries(senderCounts)
        .sort((a, b) => b[1] - a[1]);

    if (topReceivers.length === 0) {
        topReceiversList.innerHTML = `<p class="empty-note">Chưa có dữ liệu khích lệ.</p>`;
    } else {
        topReceiversList.innerHTML = topReceivers.map((item, index) => `
            <div class="question-card">
                <h3>${index + 1}. ${item[0]}</h3>
                <p>💌 ${item[1]} lời khích lệ đã nhận</p>
            </div>
        `).join("");
    }

    if (topSenders.length === 0) {
        topSendersList.innerHTML = `<p class="empty-note">Chưa có dữ liệu khích lệ.</p>`;
    } else {
        topSendersList.innerHTML = topSenders.map((item, index) => `
            <div class="question-card">
                <h3>${index + 1}. ${item[0]}</h3>
                <p>👏 ${item[1]} lời khích lệ đã gửi</p>
            </div>
        `).join("");
    }
}//hết


//hàm ghim/bỏ ghim lời khích lệ
function togglePinEncouragementDemo(messageId) {
    const currentUser =
        JSON.parse(localStorage.getItem("currentUser")) ||
        demoUsers.find(user => user.username === localStorage.getItem("currentUsername"));

    if (!currentUser) {
        window.location.href = "index.html";
        return;
    }

    const messages = getStoredEncouragementsDemo();

    const updatedMessages = messages.map(item => {
        if (
            Number(item.id) === Number(messageId) &&
            item.toUsername.toLowerCase() === currentUser.username.toLowerCase()
        ) {
            return {
                ...item,
                isPinned: !item.isPinned
            };
        }

        return item;
    });

    saveStoredEncouragementsDemo(updatedMessages);

    loadEncouragementListDemo();
}//hết


function loadTodayEncouragementPreview() {
    const previewElement = document.getElementById("todayEncouragementPreview");

    if (!previewElement) {
        return;
    }

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser")) ||
        demoUsers.find(user => user.username === localStorage.getItem("currentUsername"));

    if (!currentUser) {
        return;
    }

    const messages = getStoredEncouragementsDemo().filter(
        item =>
            item.toUsername.toLowerCase() === currentUser.username.toLowerCase()
    );

    if (messages.length === 0) {
        previewElement.innerText =
            "Bạn chưa có lời khích lệ nào. Hãy tiếp tục lan tỏa yêu thương nhé 💚";
        return;
    }

    const today = new Date().toDateString();

    const todayMessages = messages.filter(
        item => item.dateKey === today
    );

    const selectedMessage =
        todayMessages.length > 0
            ? todayMessages[0]
            : messages[0];

    const senderName = selectedMessage.isAnonymous
        ? "Ẩn danh"
        : selectedMessage.fromFullName;

    previewElement.innerHTML = `
        <p class="today-encouragement-label">
            ${todayMessages.length > 0 ? "Lời khích lệ hôm nay" : "Lời khích lệ gần đây"}
        </p>
        <p class="today-encouragement-text">
            “${selectedMessage.text}”
        </p>
        <p class="today-encouragement-author">
            — ${senderName}
        </p>
    `;
}


function loadStudyMaterialsDemo() {
    const list = document.getElementById("studyMaterialsList");

    if (!list) {
        return;
    }

    const materials = getStoredStudyMaterialsDemo();

    if (materials.length === 0) {
        list.innerHTML = `
            <p class="empty-note">Chưa có tài liệu học tập nào.</p>
        `;
        return;
    }

    list.innerHTML = materials.map(item => `
        <div class="material-session-card">
            <div class="material-session-header">
                <span class="material-session-badge">${item.session}</span>
                <div>
                    <h2>${item.title}</h2>
                    <p>${item.note}</p>
                </div>
            </div>

            <div class="memory-verse-box">
                <p class="memory-verse-label">📖 Câu gốc</p>
                <h3>${item.bibleVerse}</h3>
                <p>“${item.verseText}”</p>
            </div>

            <div class="material-files-list">
                ${
                    item.files.length === 0
                    ? `<p class="empty-note">Tài liệu của buổi này sẽ được cập nhật sau.</p>`
                    : item.files.map(file => `
                        <div class="material-file-card">
                            <div class="material-file-icon">${file.icon}</div>

                            <div class="material-file-info">
                                <h3>${file.name}</h3>
                                <p>${file.type}</p>
                            </div>

                            <a class="material-open-btn" href="${file.url}" target="_blank">
                                ${getMaterialOpenButtonTextDemo(file.type)}
                            </a>
                        </div>
                    `).join("")
                }
            </div>
        </div>
    `).join("");
}


function getMaterialIconDemo(fileType) {
    if (fileType === "PDF") {
        return "📄";
    }

    if (fileType === "PowerPoint") {
        return "🖼️";
    }

    if (fileType === "Word") {
        return "📝";
    }

    if (fileType === "Google Drive") {
        return "📁";
    }

    if (fileType === "YouTube") {
        return "🎥";
    }

    if (fileType === "Audio") {
        return "🎵";
    }

    return "🔗";
}

function getMaterialOpenButtonTextDemo(fileType) {
    if (fileType === "PDF") {
        return "Mở PDF";
    }

    if (fileType === "PowerPoint") {
        return "Mở Slide";
    }

    if (fileType === "Word") {
        return "Mở Word";
    }

    if (fileType === "Google Drive") {
        return "Mở Drive";
    }

    if (fileType === "YouTube") {
        return "Xem Video";
    }

    if (fileType === "Audio") {
        return "Nghe Audio";
    }

    return "Mở Link";
}

let editingMaterialIndex = null;

//hàm thêm tài liệu
function addStudyMaterialDemo() {
    const session = document.getElementById("materialSession").value.trim();
    const title = document.getElementById("materialTitle").value.trim();
    const bibleVerse = document.getElementById("materialBibleVerse").value.trim();
    const verseText = document.getElementById("materialVerseText").value.trim();
    const note = document.getElementById("materialNote").value.trim();

    const fileName = document.getElementById("materialFileName").value.trim();
    const fileType = document.getElementById("materialFileType").value;
    
    const fileUrl = document.getElementById("materialFileUrl").value.trim();

    const message = document.getElementById("materialMessage");

    if (!session || !title || !bibleVerse || !verseText || !note) {
        message.style.color = "red";
        message.innerText = "Vui lòng nhập đầy đủ thông tin buổi học.";
        return;
    }

    if (!fileName || !fileType || !fileUrl) {
    message.style.color = "red";
    message.innerText = "Vui lòng nhập đầy đủ thông tin tài liệu.";
    return;
    }

    const materials = getStoredStudyMaterialsDemo();

const existingSession = materials.find(
    item => item.session.toLowerCase() === session.toLowerCase()
);

const newFile = {
    icon: getMaterialIconDemo(fileType),
    name: fileName,
    type: fileType,
    url: fileUrl,
    updatedAt: new Date().toLocaleString("vi-VN")
};

if (editingMaterialIndex !== null) {
    materials[editingMaterialIndex] = {
        session: session,
        title: title,
        bibleVerse: bibleVerse,
        verseText: verseText,
        note: note,
        files: [newFile],
        updatedAt: new Date().toLocaleString("vi-VN")
    };

    saveStoredStudyMaterialsDemo(materials);

    message.style.color = "green";
    message.innerText = "Đã cập nhật tài liệu học tập thành công!";

    resetStudyMaterialFormDemo();
    loadAdminStudyMaterialsDemo();
    loadStudyMaterialsDemo();

    return;
}

    

    if (existingSession) {
        existingSession.files.push(newFile);
        existingSession.note = note;
        existingSession.title = title;
        existingSession.bibleVerse = bibleVerse;
        existingSession.verseText = verseText;
    } else {
        materials.push({
            session: session,
            title: title,
            bibleVerse: bibleVerse,
            verseText: verseText,
            note: note,
            files: [newFile]
        });
    }

    saveStoredStudyMaterialsDemo(materials);

    message.style.color = "green";
    message.innerText = "Đã thêm tài liệu học tập thành công!";

    resetStudyMaterialFormDemo();

    loadAdminStudyMaterialsDemo();
}//hết


//hiển thị danh sách admin
function loadAdminStudyMaterialsDemo() {
    const list = document.getElementById("adminStudyMaterialsList");

    if (!list) {
        return;
    }

    const materials = getStoredStudyMaterialsDemo();

    if (materials.length === 0) {
        list.innerHTML = `<p class="empty-note">Chưa có tài liệu học tập nào.</p>`;
        return;
    }

    list.innerHTML = materials.map((item, index) => `
        <div class="material-session-card">
            <div class="material-session-header">
                <span class="material-session-badge">${item.session}</span>
                <div>
                    <h2>${item.title}</h2>
                    <p>${item.note}</p>
                    <p class="question-meta">
                        ${item.files.length} file tài liệu
                    </p>
                </div>
            </div>

            <div class="material-files-list">
                ${
                    item.files.length === 0
                    ? `<p class="empty-note">Chưa có file nào.</p>`
                    : item.files.map(file => `
                        <div class="material-file-card">
                            <div class="material-file-icon">${file.icon}</div>
                            <div class="material-file-info">
                                <h3>${file.name}</h3>
                                <p>${file.type}</p>
                            </div>
                            <a class="material-open-btn" href="${file.url}" target="_blank">
                                ${getMaterialOpenButtonTextDemo(file.type)}
                            </a>
                        </div>
                    `).join("")
                }
            </div>

            <div class="admin-material-actions">
                <button class="edit-material-btn" onclick="editStudyMaterialDemo(${index})">
                    ✏️ Sửa
                </button>

                <button class="delete-material-btn" onclick="deleteStudyMaterialDemo(${index})">
                    🗑️ Xóa buổi học này
                </button>
            </div>
        </div>
    `).join("");
}//hết

//hàm xóa tài liệu
function deleteStudyMaterialDemo(index) {
    const confirmDelete = confirm(
        "Bạn có chắc muốn xóa toàn bộ tài liệu của buổi học này không?"
    );

    if (!confirmDelete) {
        return;
    }

    const materials = getStoredStudyMaterialsDemo();

    materials.splice(index, 1);

    saveStoredStudyMaterialsDemo(materials);

    loadAdminStudyMaterialsDemo();
    loadStudyMaterialsDemo();
}//hết


//hàm edit
function editStudyMaterialDemo(index) {
    const materials = getStoredStudyMaterialsDemo();
    const material = materials[index];

    if (!material) {
        return;
    }

    const firstFile = material.files && material.files.length > 0
        ? material.files[0]
        : null;

    editingMaterialIndex = index;

    document.getElementById("materialSession").value = material.session;
    document.getElementById("materialTitle").value = material.title;
    document.getElementById("materialBibleVerse").value = material.bibleVerse;
    document.getElementById("materialVerseText").value = material.verseText;
    document.getElementById("materialNote").value = material.note;

    if (firstFile) {
        document.getElementById("materialFileName").value = firstFile.name;
        document.getElementById("materialFileType").value = firstFile.type;
        document.getElementById("materialFileUrl").value = firstFile.url;
    }

    document.getElementById("materialSubmitButton").innerText = "Lưu thay đổi";
    document.getElementById("cancelEditMaterialButton").style.display = "inline-block";

    const message = document.getElementById("materialMessage");
    message.style.color = "#2563eb";
    message.innerText = "Bạn đang chỉnh sửa tài liệu. Sau khi sửa xong, bấm Lưu thay đổi.";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}//hết

//hàm reset chỉnh sửa
function resetStudyMaterialFormDemo() {
    editingMaterialIndex = null;

    document.getElementById("materialSession").value = "";
    document.getElementById("materialTitle").value = "";
    document.getElementById("materialBibleVerse").value = "";
    document.getElementById("materialVerseText").value = "";
    document.getElementById("materialNote").value = "";
    document.getElementById("materialFileName").value = "";
    document.getElementById("materialFileType").value = "PDF";
    document.getElementById("materialFileUrl").value = "";

    const submitButton = document.getElementById("materialSubmitButton");
    const cancelButton = document.getElementById("cancelEditMaterialButton");

    if (submitButton) {
        submitButton.innerText = "Thêm tài liệu";
    }

    if (cancelButton) {
        cancelButton.style.display = "none";
    }
}

function cancelEditStudyMaterialDemo() {
    resetStudyMaterialFormDemo();

    const message = document.getElementById("materialMessage");
    message.style.color = "#6b7280";
    message.innerText = "Đã hủy chỉnh sửa.";
}//hết

function getShortNameFromFullName(fullName) {
    const parts = fullName.trim().split(" ");

    return parts[parts.length - 1];
}

function generateStudentUsername(index) {
    return "TKH" + String(index + 1).padStart(3, "0");
}

//hàm import
function importStudentsExcelDemo() {
    const fileInput = document.getElementById("studentExcelFile");
    const message = document.getElementById("studentImportMessage");

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        message.style.color = "red";
        message.innerText = "Vui lòng chọn file Excel để import.";
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rows = XLSX.utils.sheet_to_json(worksheet, {
            defval: ""
        });

        if (rows.length === 0) {
            message.style.color = "red";
            message.innerText = "File Excel không có dữ liệu.";
            return;
        }

        const importedStudents = [];

        rows.forEach((row, index) => {
            const fullName = String(row["Họ và tên"] || "").trim();
            const gender = String(row["Giới tính"] || "").trim();
            const birthDate = formatExcelDateDemo(
                row["Ngày sinh"] ||
                row["Ngày Sinh"] ||
                ""
            );
            const phone = String(row["Điện thoại"] || "").trim();
            const groupName = String(row["Nhóm nhỏ"] || "").trim();

            if (!fullName || !gender || !birthDate || !phone || !groupName) {
                return;
            }

            importedStudents.push({
                username: generateStudentUsername(importedStudents.length),
                defaultPassword: "123456",
                role: "student",
                fullName: fullName,
                shortName: getShortNameFromFullName(fullName),
                gender: gender,
                birthDate: birthDate,
                phone: phone,
                groupName: groupName
            });
        });

        if (importedStudents.length === 0) {
            message.style.color = "red";
            message.innerText = "Không có học viên hợp lệ để import.";
            return;
        }

        localStorage.setItem(
            "importedStudentsDemo",
            JSON.stringify(importedStudents)
        );

        message.style.color = "green";
        message.innerText =
            "Đã import thành công " + importedStudents.length + " học viên.";

        loadAdminMembersTableDemo();
    };

    reader.readAsArrayBuffer(file);
}//hết

//hàm hiển thị đã import
function getImportedStudentsDemo() {
    return JSON.parse(localStorage.getItem("importedStudentsDemo")) || [];
}

function getCurrentUserDemo() {
    const backendCurrentUser =
        JSON.parse(
            localStorage.getItem("currentUser")
        );

    if (backendCurrentUser) {
        return backendCurrentUser;
    }

    const currentUsername =
        localStorage.getItem("currentUsername");

    if (!currentUsername) {
        return null;
    }

    const importedStudents =
        getImportedStudentsDemo();

    const importedUser =
        importedStudents.find(
            user =>
                user.username &&
                user.username.toLowerCase() ===
                currentUsername.toLowerCase()
        );

    if (importedUser) {
        return importedUser;
    }

    const demoUser =
        demoUsers.find(
            user =>
                user.username &&
                user.username.toLowerCase() ===
                currentUsername.toLowerCase()
        );

    return demoUser || null;
}

function loadImportedStudentsDemo() {
    const list = document.getElementById("importedStudentsList");

    if (!list) {
        return;
    }

    const students = getImportedStudentsDemo();

    if (students.length === 0) {
        list.innerHTML = `<p class="empty-note">Chưa có học viên nào được import.</p>`;
        return;
    }

    list.innerHTML = students.map(student => `
        <div class="question-card">
            <h3>${student.fullName}</h3>
            <p><strong>Mã đăng nhập:</strong> ${student.username}</p>
            <p><strong>Mật khẩu mặc định:</strong> 123456</p>
            <p><strong>Giới tính:</strong> ${student.gender}</p>
            <p><strong>Ngày sinh:</strong> ${student.birthDate}</p>
            <p><strong>Điện thoại:</strong> ${student.phone}</p>
            <p><strong>Nhóm nhỏ:</strong> ${student.groupName}</p>
        </div>
    `).join("");
}//hết


//hàm load bảng admin members
async function loadAdminMembersTableDemo() {
    const tableBody = document.getElementById("adminMembersTableBody");

    if (!tableBody) {
        return;
    }

    const token = localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="9">Đang tải danh sách học viên...</td>
        </tr>
    `;

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/members`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (response.status === 401) {
            logoutDemo();
            return;
        }

        if (!response.ok || !result.success) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9">
                        ${result?.error?.message || "Không thể tải danh sách học viên."}
                    </td>
                </tr>
            `;
            updateMemberSearchResult();
            return;
        }

        const students = result.data.members || [];

        if (students.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9">
                        Chưa có học viên trong Database.
                    </td>
                </tr>
            `;

            loadGroupFilter();
            updateMemberSearchResult();
            return;
        }

        tableBody.innerHTML = students.map(item => {
            const member = item.member || {};
            const group = item.group;
            const account = item.account;

            const username = account?.username || "";
            const tkhCode = member.tkhCode || username || "—";
            const fullName = member.fullName || "—";
            const phone = member.phone || "—";
            const groupName = group?.name || "Chưa phân nhóm";

            return `
                <tr
                    data-username="${username.toLowerCase()}"
                    data-name="${fullName.toLowerCase()}"
                    data-group="${groupName.toLowerCase()}"
                    data-phone="${phone}"
                >
                    <td>${tkhCode}</td>
                    <td>${fullName}</td>
                    <td>—</td>
                    <td>—</td>
                    <td>${phone}</td>
                    <td>${groupName}</td>
                    <td>Học viên</td>
                    <td>
                        ${account ? "Đã thiết lập" : "Chưa có tài khoản"}
                    </td>
                    <td>
                        <button
                            class="profile-btn"
                            disabled
                            title="API Reset mật khẩu sẽ được bổ sung sau"
                        >
                            Reset
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

        loadGroupFilter();
        updateMemberSearchResult();
    } catch (error) {
        console.error("Load members error:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="9">
                    Không thể kết nối đến Backend.
                </td>
            </tr>
        `;

        updateMemberSearchResult();
    }
}//hết

//hàm loadgroupfilter
function loadGroupFilter(){

    const select = document.getElementById("memberGroupFilter");

    if(!select) return;

    const rows = document.querySelectorAll("#adminMembersTableBody tr");

    const groups = [];

    rows.forEach(row=>{

        const group = row.dataset.group;

        if(group && !groups.includes(group)){
            groups.push(group);
        }

    });

    groups.sort();

    select.innerHTML =
        `<option value="">Tất cả nhóm</option>`;

    groups.forEach(group=>{

        select.innerHTML +=
        `<option value="${group}">${group}</option>`;

    });

}//hết


//hàm tìm kiếm thành viên
function filterMembersTable() {
    const keyword = document
        .getElementById("memberSearchInput")
        .value
        .toLowerCase()
        .trim();

    const selectedGroup = document
        .getElementById("memberGroupFilter")
        .value
        .toLowerCase();

    const rows = document.querySelectorAll("#adminMembersTableBody tr");

    rows.forEach(row => {
        const username = row.dataset.username || "";
        const name = row.dataset.name || "";
        const group = row.dataset.group || "";
        const phone = row.dataset.phone || "";

        const foundKeyword =
            username.includes(keyword) ||
            name.includes(keyword) ||
            group.includes(keyword) ||
            phone.includes(keyword);

        const foundGroup =
            selectedGroup === "" ||
            group === selectedGroup;

        const found =
            foundKeyword && foundGroup;

        row.style.display = found ? "" : "none";
    });

    updateMemberSearchResult();
}//hết

//hàm thống kê thành viên
function updateMemberSearchResult() {
    const rows = document.querySelectorAll(
        "#adminMembersTableBody tr[data-username]"
    );

    let visible = 0;

    rows.forEach(row => {
        if (row.style.display !== "none") {
            visible++;
        }
    });

    const result = document.getElementById("memberSearchResult");

    if (result) {
        result.innerText =
            `Hiển thị ${visible} / ${rows.length} học viên`;
    }
}//hết


//hàm đổi format date
function formatExcelDateDemo(value) {
    if (!value) {
        return "";
    }

    if (typeof value === "number") {
        const excelDate = XLSX.SSF.parse_date_code(value);

        if (!excelDate) {
            return String(value);
        }

        const day = String(excelDate.d).padStart(2, "0");
        const month = String(excelDate.m).padStart(2, "0");
        const year = excelDate.y;

        return `${day}/${month}/${year}`;
    }

    return String(value).trim();
}//hết

function getStudentAvatarInitialDemo(student) {
    const shortName =
        student.shortName ||
        getShortNameFromFullName(student.fullName);

    return shortName.charAt(0).toUpperCase();
}

function loadStudentDirectoryDemo() {
    const list = document.getElementById("studentDirectoryList");

    if (!list) {
        return;
    }

    const students = getImportedStudentsDemo();

    if (students.length === 0) {
        list.innerHTML = `
            <p class="empty-note">
                Chưa có danh sách học viên. Vui lòng import Excel trong trang Admin.
            </p>
        `;
        return;
    }

    list.innerHTML = students.map(student => `
        <div
            class="student-card"
            data-name="${student.fullName.toLowerCase()} ${student.username.toLowerCase()} ${student.groupName.toLowerCase()}"
        >
            <div class="student-avatar">
                ${getStudentAvatarInitialDemo(student)}
            </div>

            <h3>${student.fullName}</h3>
            <p>${student.username} · Nhóm ${student.groupName}</p>
            <p class="encourage-count" data-user="${student.username}">
                💌 0 lời khích lệ
            </p>

            <a href="profile.html?user=${student.username}" class="profile-btn">
                Mở hộp thư
            </a>
        </div>
    `).join("");

    loadDirectoryEncouragementCounts();
}


//hàm tìm học viên
function findStudentByUsernameDemo(username) {
    if (!username) {
        return null;
    }

    const searchUsername = username.toLowerCase();

    const importedStudents = getImportedStudentsDemo();

    const demoStudents = demoUsers.filter(
        user => user.role === "student"
    );

    const currentUser = getCurrentUserDemo();

    const allStudents = [
        ...importedStudents,
        ...demoStudents
    ];

    if (currentUser && currentUser.role === "student") {
        allStudents.push(currentUser);
    }

    return allStudents.find(
        student =>
            student.username &&
            student.username.toLowerCase() === searchUsername
    ) || null;
}

//hàm điểm nhóm
function loadGroupScoreDemo() {
    const myGroupName = document.getElementById("myGroupName");

    if (!myGroupName) {
        return;
    }

    const currentUser = getCurrentUserDemo();

    if (!currentUser) {
        window.location.href = "index.html";
        return;
    }

    myGroupName.innerText = currentUser.groupName;
}//hết


const groupRankingDemo = [
    {
        groupName: "Ti-mô-thê",
        score: 0
    },
    {
        groupName: "Ca-lép",
        score: 0
    },
    {
        groupName: "Sa-ra",
        score: 0
    },
    {
        groupName: "Giô-na-than",
        score: 0
    },
    {
        groupName: "Nê-hê-mi",
        score: 0
    },
    {
        groupName: "Ma-ri",
        score: 0
    },
    {
        groupName: "Giê-rê-mi",
        score: 0
    },
    {
        groupName: "Ê-xơ-ra",
        score: 0
    }
];


async function loadGroupRankingDemo() {
    const tableBody =
        document.getElementById(
            "groupRankingTableBody"
        );

    if (!tableBody) {
        return;
    }

    const currentUser =
        getCurrentUserDemo();

    if (!currentUser) {
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="4">
                Đang tải bảng xếp hạng...
            </td>
        </tr>
    `;

    try {
        const groups =
            await getGroupRankingApiData();

        if (!groups) {
            return;
        }

        if (groups.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4">
                        Chưa có dữ liệu xếp hạng nhóm.
                    </td>
                </tr>
            `;

            return;
        }

        const currentGroupId =
            Number(currentUser.group?.id);

        const currentGroupName =
            currentUser.group?.name ||
            currentUser.groupName ||
            "";

        tableBody.innerHTML =
            groups.map(item => {
                const group =
                    item.group || {};

                const groupName =
                    group.name ||
                    "Chưa xác định";

                const isMyGroup =
                    (
                        currentGroupId &&
                        Number(group.id) ===
                        currentGroupId
                    ) ||
                    (
                        currentGroupName &&
                        groupName.toLowerCase() ===
                        currentGroupName.toLowerCase()
                    );

                let status =
                    "Đang thi đua";

                if (Number(item.ranking) === 1) {
                    status =
                        "Đang dẫn đầu";
                }

                if (isMyGroup) {
                    status =
                        "Nhóm của bạn";
                }

                return `
                    <tr class="${
                        isMyGroup
                            ? "highlight-row"
                            : ""
                    }">
                        <td>
                            #${Number(item.ranking) || "-"}
                        </td>

                        <td>${groupName}</td>

                        <td>
                            ${Number(item.totalPoints) || 0}
                        </td>

                        <td>${status}</td>
                    </tr>
                `;
            }).join("");
    } catch (error) {
        console.error(
            "Load group ranking error:",
            error
        );

        tableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    Không thể tải bảng xếp hạng nhóm.
                </td>
            </tr>
        `;
    }
}

function getStoredScoresDemo() {
    return JSON.parse(localStorage.getItem("studentScoresDemo")) || [];
}

function saveStoredScoresDemo(scores) {
    localStorage.setItem("studentScoresDemo", JSON.stringify(scores));
}

function loadScoreStudentOptionsDemo() {
    const select = document.getElementById("scoreUser");

    if (!select) {
        return;
    }

    const students = getImportedStudentsDemo();

    if (students.length === 0) {
        select.innerHTML = `
            <option value="">Chưa có học viên. Vui lòng import Excel trước.</option>
        `;
        return;
    }

    select.innerHTML = `
        <option value="">Chọn học viên</option>
        ${
            students.map(student => `
                <option value="${student.username}">
                    ${student.fullName} - ${student.groupName} (${student.username})
                </option>
            `).join("")
        }
    `;
}


//hàm tên loại điểm và lịch sử điểm
function getScoreTypeLabelDemo(scoreType) {
    if (scoreType === "bible_challenge") {
        return "Trả bài cũ / Bible Challenge";
    }

    if (scoreType === "attendance") {
        return "Điểm danh";
    }

    if (scoreType === "memory_verse") {
        return "Thuộc câu gốc";
    }

    if (scoreType === "game") {
        return "Trò chơi";
    }

    if (scoreType === "late") {
        return "Đi trễ";
    }

    return "Thủ công";
}

function loadAdminScoreHistoryDemo() {
    const tableBody = document.getElementById("adminScoreHistoryBody");

    if (!tableBody) {
        return;
    }

    const scores = getStoredScoresDemo();

    if (scores.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6">Chưa có lịch sử điểm.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = scores.map(item => `
        <tr>
            <td>${item.createdAt}</td>
            <td>${item.fullName}</td>
            <td>${item.groupName}</td>
            <td>${item.scoreTypeLabel}</td>
            <td>${item.scoreValue > 0 ? "+" : ""}${item.scoreValue}</td>
            <td>${item.reason}</td>
        </tr>
    `).join("");
}//hết


function getScoresByUsernameDemo(username) {
    const scores = getStoredScoresDemo();

    return scores.filter(
        item => item.username.toLowerCase() === username.toLowerCase()
    );
}

function getTotalScoreByUsernameDemo(username) {
    const scores = getScoresByUsernameDemo(username);

    return scores.reduce(
        (total, item) => total + Number(item.scoreValue),
        0
    );
}

async function loadMyScoreDemo() {
    const totalScoreElement =
        document.getElementById("myTotalScore");

    const attendanceScoreElement =
        document.getElementById("myAttendanceScore");

    const historyBody =
        document.getElementById("myScoreHistoryBody");

    const groupRankText =
        document.getElementById("myGroupRankText");

    if (
        !totalScoreElement ||
        !attendanceScoreElement ||
        !historyBody
    ) {
        return;
    }

    const token =
        localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return;
    }

    totalScoreElement.innerText = "...";
    attendanceScoreElement.innerText = "...";

    historyBody.innerHTML = `
        <tr>
            <td colspan="3">
                Đang tải lịch sử điểm...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/scores/me`,
            {
                method: "GET",
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (response.status === 401) {
            logoutDemo();
            return;
        }

        if (response.status === 403) {
            totalScoreElement.innerText = "0";
            attendanceScoreElement.innerText = "0";

            historyBody.innerHTML = `
                <tr>
                    <td colspan="3">
                        ${
                            result?.error?.message ||
                            "Tài khoản chưa được liên kết với học viên."
                        }
                    </td>
                </tr>
            `;

            return;
        }

        if (!response.ok || !result.success) {
            totalScoreElement.innerText = "0";
            attendanceScoreElement.innerText = "0";

            historyBody.innerHTML = `
                <tr>
                    <td colspan="3">
                        ${
                            result?.error?.message ||
                            "Không thể tải dữ liệu điểm cá nhân."
                        }
                    </td>
                </tr>
            `;

            return;
        }

        const summary =
            result.data?.summary || {};

        const member =
            result.data?.member || {};

        const history =
            Array.isArray(result.data?.history)
                ? result.data.history
                : [];

        totalScoreElement.innerText =
            Number(summary.totalPoints) || 0;

        attendanceScoreElement.innerText =
            Number(summary.attendancePoints) || 0;

        if (groupRankText) {
            groupRankText.innerText =
                "Trong nhóm " +
                (
                    member.group?.name ||
                    "Chưa phân nhóm"
                );
        }

        if (history.length === 0) {
            historyBody.innerHTML = `
                <tr>
                    <td colspan="3">
                        Chưa có lịch sử điểm.
                    </td>
                </tr>
            `;

            return;
        }

        historyBody.innerHTML =
            history.map(item => {
                const createdDate =
                    parseSqlLocalDateTime(
                        item.createdAt
                    );

                const createdAtText =
                    createdDate
                        ? createdDate.toLocaleString(
                            "vi-VN"
                        )
                        : "—";

                const points =
                    Number(item.points) || 0;

                const description =
                    item.description ||
                    item.sourceTypeLabel ||
                    "Cập nhật điểm";

                return `
                    <tr>
                        <td>${createdAtText}</td>

                        <td>
                            ${description}
                            <br>
                            <small>
                                ${
                                    item.sourceTypeLabel ||
                                    item.sourceType ||
                                    ""
                                }
                            </small>
                        </td>

                        <td>
                            ${points > 0 ? "+" : ""}${points}
                        </td>
                    </tr>
                `;
            }).join("");
    } catch (error) {
        console.error(
            "Load personal score error:",
            error
        );

        totalScoreElement.innerText = "0";
        attendanceScoreElement.innerText = "0";

        historyBody.innerHTML = `
            <tr>
                <td colspan="3">
                    Không thể kết nối đến Backend.
                </td>
            </tr>
        `;
    }
}

async function loadDashboardPersonalScoreDemo() {
    const scoreElement =
        document.getElementById(
            "dashboardPersonalScore"
        );

    if (!scoreElement) {
        return;
    }

    const token =
        localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return;
    }

    scoreElement.innerText = "...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/scores/me`,
            {
                method: "GET",
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (response.status === 401) {
            logoutDemo();
            return;
        }

        if (response.status === 403) {
            scoreElement.innerText = "0";

            console.error(
                "Dashboard personal score:",
                result?.error?.message ||
                "Tài khoản chưa được liên kết với học viên."
            );

            return;
        }

        if (!response.ok || !result.success) {
            scoreElement.innerText = "0";

            console.error(
                "Dashboard personal score error:",
                result?.error?.message ||
                "Không thể tải điểm cá nhân."
            );

            return;
        }

        scoreElement.innerText =
            Number(
                result.data?.summary?.totalPoints
            ) || 0;
    } catch (error) {
        console.error(
            "Load dashboard personal score error:",
            error
        );

        scoreElement.innerText = "0";
    }
}


function getGroupTotalScoreDemo(groupName) {

    const students = getImportedStudentsDemo();
    const scores = getStoredScoresDemo();

    let total = 0;

    scores.forEach(score => {

        const student = students.find(
            item => item.username === score.username
        );

        if (!student) {
            return;
        }

        if (
            student.groupName.toLowerCase() ===
            groupName.toLowerCase()
        ) {
            total += Number(score.scoreValue);
        }

    });

    return total;

}


let myGroupScoreApiCache = null;
let myGroupScoreApiPromise = null;

async function getMyGroupScoreApiData() {
    if (myGroupScoreApiCache) {
        return myGroupScoreApiCache;
    }

    if (myGroupScoreApiPromise) {
        return myGroupScoreApiPromise;
    }

    const token =
        localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return null;
    }

    myGroupScoreApiPromise = fetch(
        `${API_BASE_URL}/api/scores/my-group`,
        {
            method: "GET",
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    )
        .then(async response => {
            const result =
                await response.json();

            if (response.status === 401) {
                logoutDemo();
                return null;
            }

            if (
                !response.ok ||
                !result.success
            ) {
                throw new Error(
                    result?.error?.message ||
                    "Không thể tải dữ liệu điểm nhóm."
                );
            }

            myGroupScoreApiCache =
                result.data;

            return myGroupScoreApiCache;
        })
        .finally(() => {
            myGroupScoreApiPromise = null;
        });

    return myGroupScoreApiPromise;
}


let groupRankingApiCache = null;
let groupRankingApiPromise = null;

async function getGroupRankingApiData() {
    if (groupRankingApiCache) {
        return groupRankingApiCache;
    }

    if (groupRankingApiPromise) {
        return groupRankingApiPromise;
    }

    const token =
        localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return null;
    }

    groupRankingApiPromise = fetch(
        `${API_BASE_URL}/api/scores/groups`,
        {
            method: "GET",
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    )
        .then(async response => {
            const result =
                await response.json();

            if (response.status === 401) {
                logoutDemo();
                return null;
            }

            if (
                !response.ok ||
                !result.success
            ) {
                throw new Error(
                    result?.error?.message ||
                    "Không thể tải bảng xếp hạng nhóm."
                );
            }

            groupRankingApiCache =
                Array.isArray(result.data?.groups)
                    ? result.data.groups
                    : [];

            return groupRankingApiCache;
        })
        .finally(() => {
            groupRankingApiPromise = null;
        });

    return groupRankingApiPromise;
}



async function loadMyGroupSummaryDemo() {
    const groupNameElement =
        document.getElementById("myGroupName");

    const totalScoreElement =
        document.getElementById(
            "myGroupTotalScore"
        );

    if (
        !groupNameElement ||
        !totalScoreElement
    ) {
        return;
    }

    groupNameElement.innerText = "...";
    totalScoreElement.innerText = "...";

    try {
        const data =
            await getMyGroupScoreApiData();

        if (!data) {
            return;
        }

        groupNameElement.innerText =
            data.group?.name ||
            "Chưa phân nhóm";

        totalScoreElement.innerText =
            Number(
                data.summary?.totalPoints
            ) || 0;
    } catch (error) {
        console.error(
            "Load group summary error:",
            error
        );

        groupNameElement.innerText =
            "Không thể tải";

        totalScoreElement.innerText = "0";
    }
}

function getPersonalRankingDemo() {
    const students = getImportedStudentsDemo();

    const ranking = students.map(student => {
        return {
            username: student.username,
            fullName: student.fullName,
            groupName: student.groupName,
            totalScore: getTotalScoreByUsernameDemo(student.username)
        };
    });

    ranking.sort((a, b) => b.totalScore - a.totalScore);

    return ranking;
}

function loadTopPersonalRankingDemo() {
    const tableBody = document.getElementById("topPersonalRankingBody");

    if (!tableBody) {
        return;
    }

    const ranking = getPersonalRankingDemo()
        .filter(item => item.totalScore > 0)
        .slice(0, 10);

    if (ranking.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3">Chưa có dữ liệu xếp hạng.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = ranking.map((item, index) => `
        <tr>
            <td>#${index + 1}</td>
            <td>${item.fullName}</td>
            <td>${item.groupName}</td>
        </tr>
    `).join("");
}


function loadMyPersonalRankDemo() {
    const rankElement = document.getElementById("myPersonalRank");
    const rankTextElement = document.getElementById("myPersonalRankText");

    if (!rankElement || !rankTextElement) {
        return;
    }

    const currentUser = getCurrentUserDemo();

    if (!currentUser) {
        window.location.href = "index.html";
        return;
    }

    const ranking = getPersonalRankingDemo();

    const myIndex = ranking.findIndex(
        item =>
            item.username.toLowerCase() ===
            currentUser.username.toLowerCase()
    );

    if (myIndex === -1) {
        rankElement.innerText = "-";
        rankTextElement.innerText = "Chưa có dữ liệu xếp hạng";
        return;
    }

    rankElement.innerText = "#" + (myIndex + 1);
    rankTextElement.innerText =
        "Trong " + ranking.length + " học viên";
}


function getGroupRankingWithScoresDemo() {
    const students = getImportedStudentsDemo();
    const scores = getStoredScoresDemo();

    const groups = groupRankingDemo.map(group => ({
        groupName: group.groupName,
        score: 0
    }));

    scores.forEach(score => {
        const student = students.find(
            item => item.username.toLowerCase() === score.username.toLowerCase()
        );

        if (!student) {
            return;
        }

        const group = groups.find(
            item =>
                item.groupName.toLowerCase() ===
                student.groupName.toLowerCase()
        );

        if (!group) {
            return;
        }

        group.score += Number(score.scoreValue);
    });

    groups.sort((a, b) => b.score - a.score);

    return groups;
}

async function loadTopGroupRankingDemo() {
    const list =
        document.getElementById(
            "topGroupRankingList"
        );

    if (!list) {
        return;
    }

    list.innerHTML = `
        <p class="empty-note">
            Đang tải Top nhóm...
        </p>
    `;

    try {
        const groups =
            await getGroupRankingApiData();

        if (!groups) {
            return;
        }

        const topGroups =
            groups.slice(0, 3);

        if (topGroups.length === 0) {
            list.innerHTML = `
                <p class="empty-note">
                    Chưa có dữ liệu nhóm.
                </p>
            `;

            return;
        }

        list.innerHTML =
            topGroups.map(item => {
                const groupName =
                    item.group?.name ||
                    "Chưa xác định";

                return `
                    <div class="question-card">
                        <h3>
                            #${Number(item.ranking) || "-"}
                            ${groupName}
                        </h3>

                        <p>
                            ⭐ ${Number(item.totalPoints) || 0} điểm
                        </p>
                    </div>
                `;
            }).join("");
    } catch (error) {
        console.error(
            "Load top group ranking error:",
            error
        );

        list.innerHTML = `
            <p class="empty-note">
                Không thể tải Top nhóm.
            </p>
        `;
    }
}

async function loadMyGroupRankDemo() {
    const rankElement =
        document.getElementById(
            "myGroupRankNumber"
        );

    if (!rankElement) {
        return;
    }

    rankElement.innerText = "...";

    try {
        const data =
            await getMyGroupScoreApiData();

        if (!data) {
            return;
        }

        const ranking =
            Number(data.ranking);

        rankElement.innerText =
            ranking > 0
                ? "#" + ranking
                : "-";
    } catch (error) {
        console.error(
            "Load group ranking error:",
            error
        );

        rankElement.innerText = "-";
    }
}

function getOpenCheckinWindowsDemo() {
    const openWindows = [];

    const devotionWindow = attendanceCheckinConfigDemo.windows.devotion;

    if (isAutoCheckinWindowOpenDemo(devotionWindow)) {
        openWindows.push({
            key: "devotion",
            ...devotionWindow
        });
    }

    const manualWindowKey = getManualCheckinWindowDemo();

    if (manualWindowKey) {
        const manualWindow = attendanceCheckinConfigDemo.windows[manualWindowKey];

        if (manualWindow) {
            openWindows.push({
                key: manualWindowKey,
                ...manualWindow
            });
        }
    }

    return openWindows;
}

function loadActiveCheckinWindowDemo() {
    const box = document.getElementById("activeCheckinWindow");

    if (!box) {
        return;
    }

    const openWindows = getOpenCheckinWindowsDemo();

    if (openWindows.length === 0) {
        box.innerHTML = `
            <p><strong>Hiện chưa mở điểm danh.</strong></p>
            <p class="empty-note">Vui lòng chờ BTC mở khung điểm danh.</p>
        `;
        return;
    }

    box.innerHTML = openWindows.map(item => `
        <div class="checkin-window-item">
            <strong>✅ ${item.label}</strong>
            <p>+${item.points} điểm · ${item.note}</p>
        </div>
    `).join("");
}

function getManualCheckinWindowDemo() {
    return localStorage.getItem("manualCheckinWindowDemo") || "";
}

function saveManualCheckinWindowDemo(windowKey) {
    localStorage.setItem("manualCheckinWindowDemo", windowKey);
}

function setManualCheckinWindowDemo(windowKey) {
    const validWindows = ["morning", "break", "end"];

    if (!validWindows.includes(windowKey)) {
        return;
    }

    saveManualCheckinWindowDemo(windowKey);

    const message = document.getElementById("adminCheckinWindowMessage");

    if (message) {
        message.style.color = "green";
        message.innerText = "Đã mở khung điểm danh: " + getCheckinWindowLabelDemo(windowKey);
    }

    loadAdminCheckinWindowStatusDemo();
    loadActiveCheckinWindowDemo();
}

function closeManualCheckinWindowsDemo() {
    saveManualCheckinWindowDemo("");

    const message = document.getElementById("adminCheckinWindowMessage");

    if (message) {
        message.style.color = "#6b7280";
        message.innerText = "Đã đóng tất cả khung điểm danh buổi học.";
    }

    loadAdminCheckinWindowStatusDemo();
    loadActiveCheckinWindowDemo();
}

function getCheckinWindowLabelDemo(windowKey) {
    const windowConfig = attendanceCheckinConfigDemo.windows[windowKey];

    if (!windowConfig) {
        return "Không xác định";
    }

    return windowConfig.label;
}

function isAutoCheckinWindowOpenDemo(windowConfig) {
    if (!windowConfig || windowConfig.mode !== "auto") {
        return false;
    }


    //test tĩnh nguyện
    const now = new Date(); //const now = new Date("2026-07-13T05:45:00");

    // JavaScript: 0 = Chúa nhật, 1 = Thứ Hai, ..., 6 = Thứ Bảy
    const dayOfWeek = now.getDay();

    // Không mở điểm danh tĩnh nguyện vào Chúa nhật
    if (dayOfWeek === 0) {
        return false;
    }

    const currentMinutes =
        now.getHours() * 60 + now.getMinutes();

    const startParts = windowConfig.startTime.split(":");
    const endParts = windowConfig.endTime.split(":");

    const startMinutes =
        Number(startParts[0]) * 60 + Number(startParts[1]);

    const endMinutes =
        Number(endParts[0]) * 60 + Number(endParts[1]);

    return currentMinutes >= startMinutes &&
           currentMinutes <= endMinutes;
}

function loadAdminCheckinWindowStatusDemo() {
    const statusBox = document.getElementById("adminCheckinWindowStatus");

    if (!statusBox) {
        return;
    }

    const manualWindowKey = getManualCheckinWindowDemo();
    const devotionWindow = attendanceCheckinConfigDemo.windows.devotion;
    const isDevotionOpen = isAutoCheckinWindowOpenDemo(devotionWindow);

    let manualStatus = "Chưa mở khung điểm danh buổi học.";

    if (manualWindowKey) {
        const manualWindow = attendanceCheckinConfigDemo.windows[manualWindowKey];

        if (manualWindow) {
            manualStatus =
                "Đang mở: " + manualWindow.label + " (+" + manualWindow.points + " điểm)";
        }
    }

    statusBox.innerHTML = `
        <div class="checkin-window-item">
            <strong>Khung buổi học:</strong>
            <p>${manualStatus}</p>
        </div>

        <div class="checkin-window-item">
            <strong>Tĩnh nguyện:</strong>
            <p>
                ${isDevotionOpen ? "Đang tự động mở" : "Đang đóng"}
                · 05:30 - 06:00 · +${devotionWindow.points} điểm
            </p>
        </div>
    `;
}

function addAttendanceScoreDemo(currentUser, checkinWindow) {
    const scores = getStoredScoresDemo();

    scores.unshift({
        id: Date.now(),
        username: currentUser.username,
        fullName: currentUser.fullName,
        groupName: currentUser.groupName,
        scoreType: checkinWindow.key === "devotion" ? "devotion" : "attendance",
        scoreTypeLabel:
            checkinWindow.key === "devotion"
                ? "Tĩnh nguyện"
                : "Điểm danh",
        scoreValue: Number(checkinWindow.points),
        reason: "Điểm danh " + checkinWindow.label,
        createdAt: new Date().toLocaleString("vi-VN")
    });

    saveStoredScoresDemo(scores);
}

function getDeviceIdDemo() {
    let deviceId = localStorage.getItem("tkhDeviceIdDemo");

    if (!deviceId) {
        deviceId =
            "DEVICE-" +
            Date.now() +
            "-" +
            Math.random().toString(36).substring(2, 8);

        localStorage.setItem("tkhDeviceIdDemo", deviceId);
    }

    return deviceId;
}

function loadDeviceWarningDemo() {
    const warningList = document.getElementById("deviceWarningList");

    if (!warningList) {
        return;
    }

    const attendanceHistory =
        JSON.parse(localStorage.getItem("attendanceHistory")) || [];

    const deviceMap = {};

    attendanceHistory.forEach(item => {
        if (!item.deviceId) {
            return;
        }

        if (!deviceMap[item.deviceId]) {
            deviceMap[item.deviceId] = [];
        }

        const existedUser = deviceMap[item.deviceId].find(
            user => user.username === item.username
        );

        if (!existedUser) {
            deviceMap[item.deviceId].push({
                username: item.username,
                fullName: item.fullName,
                groupName: item.groupName
            });
        }
    });

    const suspiciousDevices = Object.entries(deviceMap)
        .filter(([deviceId, users]) => users.length >= 2);

    if (suspiciousDevices.length === 0) {
        warningList.innerHTML = `
            <p class="empty-note">Chưa phát hiện thiết bị điểm danh nhiều tài khoản.</p>
        `;
        return;
    }

    warningList.innerHTML = suspiciousDevices.map(([deviceId, users]) => `
        <div class="question-card warning-card">
            <h3>⚠️ Thiết bị có ${users.length} tài khoản điểm danh</h3>
            <p class="question-meta">Mã thiết bị: ${deviceId}</p>

            ${users.map(user => `
                <p>
                    <strong>${user.fullName}</strong>
                    (${user.username}) · Nhóm ${user.groupName}
                </p>
            `).join("")}
        </div>
    `).join("");
}


let adminAttendanceRosterApiCache = [];
let adminAttendanceSummaryApiCache = null;
let adminAttendanceCurrentSessionApi = null;



async function loadAdminAttendanceTableDemo() {
    const tableBody =
        document.getElementById("adminAttendanceTableBody");

    if (!tableBody) {
        return;
    }

    const token = localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="7">
                Đang tải dữ liệu điểm danh...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/attendance/admin/current-session`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (response.status === 401) {
            logoutDemo();
            return;
        }

        if (response.status === 403) {
            window.location.href = "dashboard.html";
            return;
        }

        if (!response.ok || !result.success) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        ${result?.error?.message ||
                        "Không thể tải dữ liệu điểm danh."}
                    </td>
                </tr>
            `;

            adminAttendanceRosterApiCache = [];
            adminAttendanceSummaryApiCache = null;
            adminAttendanceCurrentSessionApi = null;

            loadAdminAttendanceStatsDemo();
            loadAttendanceGroupFilterDemo();
            updateAttendanceSearchResultDemo();
            return;
        }

        adminAttendanceRosterApiCache =
            result.data.roster || [];

        adminAttendanceSummaryApiCache =
            result.data.summary || null;

        adminAttendanceCurrentSessionApi =
            result.data.currentSession || null;

        if (adminAttendanceRosterApiCache.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">
                        Chưa có dữ liệu học viên.
                    </td>
                </tr>
            `;

            loadAdminAttendanceStatsDemo();
            loadAttendanceGroupFilterDemo();
            updateAttendanceSearchResultDemo();
            return;
        }

        tableBody.innerHTML =
            adminAttendanceRosterApiCache.map(item => {
                const checkedInDate =
                    item.attendance?.checkedInAt
                        ? parseSqlLocalDateTime(
                            item.attendance.checkedInAt
                        )
                        : null;

                const checkInTimeText =
                    checkedInDate
                        ? checkedInDate.toLocaleString("vi-VN")
                        : "-";

                const distanceText =
                    item.attendance?.distanceM !== null &&
                    item.attendance?.distanceM !== undefined
                        ? formatDistance(
                            Number(item.attendance.distanceM)
                        )
                        : "-";

                const groupName =
                    item.group?.name ||
                    "Chưa phân nhóm";

                const statusKey =
                    item.isCheckedIn
                        ? "checkedin"
                        : "absent";

                const statusText =
                    item.isCheckedIn
                        ? "Có mặt"
                        : "Chưa điểm danh";

                return `
                    <tr
                        class="${
                            statusKey === "absent"
                                ? "attendance-row-absent"
                                : ""
                        }"
                        data-username="${String(
                            item.tkhCode || ""
                        ).toLowerCase()}"
                        data-name="${String(
                            item.fullName || ""
                        ).toLowerCase()}"
                        data-group="${String(
                            groupName
                        ).toLowerCase()}"
                        data-status="${statusKey}"
                    >
                        <td>
                            ${item.fullName || "-"}
                            <br>
                            <small>${item.tkhCode || "-"}</small>
                        </td>

                        <td>${groupName}</td>

                        <td>
                            ${item.isCheckedIn
                                ? "Điểm danh"
                                : "-"}
                        </td>

                        <td>${checkInTimeText}</td>

                        <td>${distanceText}</td>

                        <td>-</td>

                        <td class="${
                            statusKey === "checkedin"
                                ? "attendance-status-checked"
                                : "attendance-status-absent"
                        }">
                            ${
                                item.isCheckedIn
                                    ? "✅ " + statusText
                                    : "❌ " + statusText
                            }
                        </td>
                    </tr>
                `;
            }).join("");

        loadAdminAttendanceStatsDemo();
        loadAttendanceGroupFilterDemo();
        filterAttendanceTable();
    } catch (error) {
        console.error(
            "Load admin attendance error:",
            error
        );

        adminAttendanceRosterApiCache = [];
        adminAttendanceSummaryApiCache = null;
        adminAttendanceCurrentSessionApi = null;

        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    Không thể kết nối đến Backend.
                </td>
            </tr>
        `;

        loadAdminAttendanceStatsDemo();
        loadAttendanceGroupFilterDemo();
        updateAttendanceSearchResultDemo();
    }
}

//hàm dropdown 8 nhóm nhỏ
function loadAttendanceGroupFilterDemo() {
    const select =
        document.getElementById("attendanceGroupFilter");

    if (!select) {
        return;
    }

    const previousValue = select.value;

    const groups = [
        ...new Set(
            adminAttendanceRosterApiCache
                .map(item => item.group?.name)
                .filter(Boolean)
        )
    ].sort((a, b) =>
        a.localeCompare(b, "vi")
    );

    select.innerHTML =
        `<option value="">Tất cả nhóm</option>`;

    groups.forEach(groupName => {
        select.innerHTML += `
            <option value="${groupName.toLowerCase()}">
                ${groupName}
            </option>
        `;
    });

    const stillExists = Array.from(select.options).some(
        option => option.value === previousValue
    );

    if (stillExists) {
        select.value = previousValue;
    }
}//hết

//hàm lọc bảng
function filterAttendanceTable() {
    const searchInput =
        document.getElementById("attendanceSearchInput");

    const groupFilter =
        document.getElementById("attendanceGroupFilter");

    const statusFilter =
        document.getElementById("attendanceStatusFilter");

    if (!searchInput || !groupFilter || !statusFilter) {
        return;
    }

    const keyword =
        searchInput.value.toLowerCase().trim();

    const selectedGroup =
        groupFilter.value.toLowerCase();

    const selectedStatus =
        statusFilter.value.toLowerCase();

    const rows =
        document.querySelectorAll(
            "#adminAttendanceTableBody tr[data-username]"
        );

    rows.forEach(row => {
        const username = row.dataset.username || "";
        const name = row.dataset.name || "";
        const group = row.dataset.group || "";
        const status = row.dataset.status || "";

        const foundKeyword =
            username.includes(keyword) ||
            name.includes(keyword) ||
            group.includes(keyword);

        const foundGroup =
            selectedGroup === "" ||
            group === selectedGroup;

        const foundStatus =
            selectedStatus === "" ||
            status === selectedStatus;

        const shouldShow =
            foundKeyword &&
            foundGroup &&
            foundStatus;

        row.style.display =
            shouldShow ? "" : "none";
    });

    updateAttendanceSearchResultDemo();
}//hết

//hàm thống kê số lượng đang hiển thị
function updateAttendanceSearchResultDemo() {
    const result =
        document.getElementById("attendanceSearchResult");

    if (!result) {
        return;
    }

    const rows =
        document.querySelectorAll(
            "#adminAttendanceTableBody tr[data-username]"
        );

    let visibleCount = 0;

    rows.forEach(row => {
        if (row.style.display !== "none") {
            visibleCount++;
        }
    });

    result.innerText =
        "Đang hiển thị " +
        visibleCount +
        " / " +
        rows.length +
        " dòng dữ liệu.";
}//hết

//hàm export
function exportAttendanceExcelDemo() {
    if (typeof XLSX === "undefined") {
        alert("Không thể tải file Excel vì thư viện XLSX chưa được nạp.");
        return;
    }

    const workbook = XLSX.utils.book_new();

    // =========================
    // SHEET 1: ĐIỂM DANH
    // =========================
    const attendanceRows = [
        [
            "Họ tên",
            "Nhóm",
            "Khung",
            "Giờ điểm danh",
            "Khoảng cách",
            "Điểm",
            "Trạng thái"
        ]
    ];

    const attendanceTableRows = document.querySelectorAll(
        "#adminAttendanceTableBody tr[data-username]"
    );

    attendanceTableRows.forEach(row => {
        attendanceRows.push([
            row.cells[0]?.innerText || "",
            row.cells[1]?.innerText || "",
            row.cells[2]?.innerText || "",
            row.cells[3]?.innerText || "",
            row.cells[4]?.innerText || "",
            row.cells[5]?.innerText || "",
            row.cells[6]?.innerText || ""
        ]);
    });

    const attendanceSheet =
        XLSX.utils.aoa_to_sheet(attendanceRows);

    XLSX.utils.book_append_sheet(
        workbook,
        attendanceSheet,
        "Điểm danh"
    );

    // =========================
    // SHEET 2: CẢNH BÁO THIẾT BỊ
    // =========================
    const warningRows = [
        [
            "Mã thiết bị",
            "Mã TKH",
            "Họ tên",
            "Nhóm",
            "Lý do"
        ]
    ];

    const attendanceHistory =
        JSON.parse(localStorage.getItem("attendanceHistory")) || [];

    const deviceMap = {};

    attendanceHistory.forEach(item => {
        if (!item.deviceId || !item.username) {
            return;
        }

        if (!deviceMap[item.deviceId]) {
            deviceMap[item.deviceId] = [];
        }

        const existedUser = deviceMap[item.deviceId].some(
            user =>
                String(user.username).toLowerCase() ===
                String(item.username).toLowerCase()
        );

        if (!existedUser) {
            deviceMap[item.deviceId].push({
                username: item.username || "",
                fullName: item.fullName || "",
                groupName: item.groupName || ""
            });
        }
    });

    const suspiciousDevices = Object.entries(deviceMap)
        .filter(([, users]) => users.length >= 2);

    if (suspiciousDevices.length === 0) {
        warningRows.push([
            "-",
            "-",
            "-",
            "-",
            "Không có cảnh báo thiết bị"
        ]);
    } else {
        suspiciousDevices.forEach(([deviceId, users]) => {
            users.forEach(user => {
                warningRows.push([
                    deviceId,
                    user.username,
                    user.fullName,
                    user.groupName,
                    "Thiết bị này đã được sử dụng để điểm danh từ 2 tài khoản trở lên"
                ]);
            });
        });
    }

    const warningSheet =
        XLSX.utils.aoa_to_sheet(warningRows);

    XLSX.utils.book_append_sheet(
        workbook,
        warningSheet,
        "Cảnh báo thiết bị"
    );

    // =========================
    // TÊN FILE THEO BUỔI HỌC
    // =========================
    const currentSession = getOpenSessionDemo();

    let fileName = "TKH2026_Attendance.xlsx";

    if (currentSession) {
        const sessionDate =
            String(currentSession.date || "");

        const safeDate =
            sessionDate.replaceAll("-", "");

        const safeSessionName =
            String(currentSession.name || "BuoiHoc")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/đ/g, "d")
                .replace(/Đ/g, "D")
                .replace(/[^a-zA-Z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");

        fileName =
            `TKH2026_Attendance_${safeSessionName}_${safeDate}.xlsx`;
    }

    XLSX.writeFile(
        workbook,
        fileName
    );
}
//hết




function loadAdminAttendanceStatsDemo() {
    const totalElement =
        document.getElementById("adminTotalStudents");

    const checkedElement =
        document.getElementById("adminCheckedInStudents");

    const absentElement =
        document.getElementById("adminAbsentStudents");

    const percentElement =
        document.getElementById("adminCheckedInPercent");

    const morningElement =
        document.getElementById("morningCheckinCount");

    const breakElement =
        document.getElementById("breakCheckinCount");

    const endElement =
        document.getElementById("endCheckinCount");

    const devotionElement =
        document.getElementById("devotionCheckinCount");

    if (!totalElement) {
        return;
    }

    const summary =
        adminAttendanceSummaryApiCache || {
            totalStudents: 0,
            checkedInCount: 0,
            absentCount: 0,
            checkedInPercent: 0
        };

    totalElement.innerText =
        summary.totalStudents || 0;

    checkedElement.innerText =
        summary.checkedInCount || 0;

    absentElement.innerText =
        summary.absentCount || 0;

    percentElement.innerText =
        `${Number(
            summary.checkedInPercent || 0
        ).toFixed(1)}%`;

    /*
     * Database Beta hiện hỗ trợ 1 lần điểm danh / buổi.
     * Chưa tách các khung morning, break, end, devotion.
     */
    morningElement.innerText = 0;
    breakElement.innerText = 0;
    endElement.innerText = 0;
    devotionElement.innerText = 0;
}

async function loadAdminDashboardSummaryDemo() {
    const totalStudentsElement =
        document.getElementById(
            "adminDashboardTotalStudents"
        );

    const checkedInElement =
        document.getElementById(
            "adminDashboardCheckedIn"
        );

    const checkedPercentElement =
        document.getElementById(
            "adminDashboardCheckedInPercent"
        );

    const currentSessionElement =
        document.getElementById(
            "adminDashboardCurrentSession"
        );

    const checkinStatusElement =
        document.getElementById(
            "adminDashboardCheckinStatus"
        );

    if (!totalStudentsElement) {
        return;
    }

    const token =
        localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return;
    }

    totalStudentsElement.innerText = "...";
    checkedInElement.innerText = "...";

    checkedPercentElement.innerText =
        "Đang tải thống kê...";

    currentSessionElement.innerText = "...";

    checkinStatusElement.innerText =
        "Trạng thái: Đang kiểm tra...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/attendance/admin/current-session`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (response.status === 401) {
            logoutDemo();
            return;
        }

        if (response.status === 403) {
            window.location.href =
                "dashboard.html";
            return;
        }

        if (!response.ok || !result.success) {
            totalStudentsElement.innerText = "0";
            checkedInElement.innerText = "0";

            checkedPercentElement.innerText =
                "0.0% thành viên";

            currentSessionElement.innerText =
                "Không thể tải";

            checkinStatusElement.innerText =
                result?.error?.message ||
                "Trạng thái: Không thể tải dữ liệu";

            adminAttendanceRosterApiCache = [];
            adminAttendanceSummaryApiCache = null;
            adminAttendanceCurrentSessionApi = null;

            loadAdminDashboardGroupStatsDemo();
            return;
        }

        adminAttendanceRosterApiCache =
            result.data.roster || [];

        adminAttendanceSummaryApiCache =
            result.data.summary || null;

        adminAttendanceCurrentSessionApi =
            result.data.currentSession || null;

        const summary =
            adminAttendanceSummaryApiCache || {
                totalStudents: 0,
                checkedInCount: 0,
                absentCount: 0,
                checkedInPercent: 0
            };

        totalStudentsElement.innerText =
            Number(summary.totalStudents) || 0;

        checkedInElement.innerText =
            Number(summary.checkedInCount) || 0;

        checkedPercentElement.innerText =
            `${Number(
                summary.checkedInPercent || 0
            ).toFixed(1)}% thành viên`;

        if (adminAttendanceCurrentSessionApi) {
            currentSessionElement.innerText =
                adminAttendanceCurrentSessionApi.name ||
                "Buổi học";

            checkinStatusElement.innerText =
                "Trạng thái: Đang mở điểm danh";
        } else {
            currentSessionElement.innerText =
                "Chưa mở";

            checkinStatusElement.innerText =
                "Trạng thái: Chưa mở buổi học";
        }

        loadAdminDashboardGroupStatsDemo();
    } catch (error) {
        console.error(
            "Load admin dashboard summary error:",
            error
        );

        adminAttendanceRosterApiCache = [];
        adminAttendanceSummaryApiCache = null;
        adminAttendanceCurrentSessionApi = null;

        totalStudentsElement.innerText = "0";
        checkedInElement.innerText = "0";

        checkedPercentElement.innerText =
            "0.0% thành viên";

        currentSessionElement.innerText =
            "Không thể tải";

        checkinStatusElement.innerText =
            "Trạng thái: Không thể kết nối Backend";

        loadAdminDashboardGroupStatsDemo();
    }
}

function loadAdminDashboardGroupStatsDemo() {
    const tableBody =
        document.getElementById(
            "adminDashboardGroupStatsBody"
        );

    if (!tableBody) {
        return;
    }

    const roster =
        Array.isArray(adminAttendanceRosterApiCache)
            ? adminAttendanceRosterApiCache
            : [];

    if (roster.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    Chưa có dữ liệu học viên trong buổi học hiện tại.
                </td>
            </tr>
        `;
        return;
    }

    const groupMap = new Map();

    roster.forEach(item => {
        const groupName =
            item.group?.name || "Chưa phân nhóm";

        if (!groupMap.has(groupName)) {
            groupMap.set(groupName, {
                groupName,
                totalMembers: 0,
                checkedIn: 0
            });
        }

        const groupStats =
            groupMap.get(groupName);

        groupStats.totalMembers += 1;

        if (item.isCheckedIn) {
            groupStats.checkedIn += 1;
        }
    });

    const groupStatsList =
        Array.from(groupMap.values())
            .sort((a, b) =>
                a.groupName.localeCompare(
                    b.groupName,
                    "vi"
                )
            );

    tableBody.innerHTML =
        groupStatsList.map(item => `
            <tr>
                <td>${item.groupName}</td>
                <td>${item.totalMembers}</td>
                <td>${item.checkedIn}</td>
                <td>
                    ${getGroupTotalScoreDemo(
                        item.groupName
                    )}
                </td>
            </tr>
        `).join("");
}

function loadAdminDashboardExtraStatsDemo() {
    const totalScoreElement = document.getElementById("adminDashboardTotalScore");
    const newQuestionsElement = document.getElementById("adminDashboardNewQuestions");
    const todayEncouragementsElement = document.getElementById("adminDashboardTodayEncouragements");

    if (!totalScoreElement) {
        return;
    }

    const scores = getStoredScoresDemo();
    const questions = getStoredQuestionsDemo();
    const encouragements = getStoredEncouragementsDemo();

    const today = new Date().toDateString();

    const totalScore = scores.reduce(
        (total, item) => total + Number(item.scoreValue),
        0
    );

    const newQuestions = questions.filter(
        item => item.status === "Mới"
    ).length;

    const todayEncouragements = encouragements.filter(
        item => item.dateKey === today
    ).length;

    totalScoreElement.innerText = totalScore;
    newQuestionsElement.innerText = newQuestions;
    todayEncouragementsElement.innerText = todayEncouragements;
}

function loadAdminEncouragementReviewDemo() {
    const list = document.getElementById("adminEncouragementReviewList");

    if (!list) {
        return;
    }

    const messages = getStoredEncouragementsDemo();

    if (messages.length === 0) {
        list.innerHTML = `
            <p class="empty-note">Chưa có lời khích lệ nào.</p>
        `;
        return;
    }

    list.innerHTML = messages.map((item, index) => `
        <div class="question-card">
            <h3>${item.isAnonymous ? "🎭 Ẩn danh với người nhận" : "💌 Công khai"}</h3>

            <p>
                <strong>Người gửi thật:</strong>
                ${item.fromFullName} (${item.fromUsername})
            </p>

            <p>
                <strong>Người nhận:</strong>
                ${item.toFullName} (${item.toUsername})
            </p>

            <p class="question-meta">
                Thời gian gửi: ${item.createdAt}
                · Trạng thái đọc: ${item.isRead ? "Đã đọc" : "Chưa đọc"}
            </p>

            <button
                class="profile-btn"
                onclick="toggleAdminEncouragementContentDemo(${index})"
            >
                Xem nội dung
            </button>

            <div
                id="adminEncouragementContent_${index}"
                class="admin-encouragement-content"
                style="display: none;"
            >
                <p><strong>Nội dung:</strong></p>
                <p>${item.text}</p>
            </div>
        </div>
    `).join("");
}

function toggleAdminEncouragementContentDemo(index) {
    const content = document.getElementById(
        "adminEncouragementContent_" + index
    );

    if (!content) {
        return;
    }

    if (content.style.display === "none") {
        content.style.display = "block";
    } else {
        content.style.display = "none";
    }
}

function downloadQuestionsByTypeDemo(questionType) {
    const questions = getStoredQuestionsDemo().filter(
        item => item.questionType === questionType
    );

    if (questions.length === 0) {
        alert("Chưa có câu hỏi thuộc loại này để tải xuống.");
        return;
    }

    const typeLabel =
        questionType === "private"
            ? "Cau-hoi-rieng-tu"
            : "Cau-hoi-cong-khai";

    const header = [
        "Buổi học",
        "Loại câu hỏi",
        "Học viên",
        "Mã TKH",
        "Nhóm",
        "Nội dung câu hỏi",
        "Trạng thái",
        "Phản hồi BTC",
        "Thời gian gửi",
        "Thời gian phản hồi"
    ];

    const rows = questions.map(item => [
        item.session || "",
        item.typeLabel || "",
        item.userFullName || "",
        item.username || "",
        item.groupName || "",
        item.text || "",
        item.status || "",
        item.adminReply || "",
        item.createdAt || "",
        item.answeredAt || ""
    ]);

    const csvContent = [
        header,
        ...rows
    ].map(row =>
        row.map(value =>
            `"${String(value).replace(/"/g, '""')}"`
        ).join(",")
    ).join("\n");

    const blob = new Blob(
        ["\uFEFF" + csvContent],
        {
            type: "text/csv;charset=utf-8;"
        }
    );

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = typeLabel + ".csv";
    link.click();

    URL.revokeObjectURL(url);
}

async function loadAdminGroupsDemo() {
    const totalGroupsElement =
        document.getElementById(
            "adminGroupsTotalGroups"
        );

    const totalStudentsElement =
        document.getElementById(
            "adminGroupsTotalStudents"
        );

    const topGroupElement =
        document.getElementById(
            "adminGroupsTopGroup"
        );

    const topGroupScoreElement =
        document.getElementById(
            "adminGroupsTopGroupScore"
        );

    const tableBody =
        document.getElementById(
            "adminGroupsTableBody"
        );

    if (!totalGroupsElement || !tableBody) {
        return;
    }

    const token =
        localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return;
    }

    totalGroupsElement.innerText = "...";
    totalStudentsElement.innerText = "...";
    topGroupElement.innerText = "Chưa có";
    topGroupScoreElement.innerText = "0 điểm";

    tableBody.innerHTML = `
        <tr>
            <td colspan="5">
                Đang tải dữ liệu nhóm...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/groups`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (response.status === 401) {
            logoutDemo();
            return;
        }

        if (response.status === 403) {
            window.location.href =
                "dashboard.html";
            return;
        }

        if (!response.ok || !result.success) {
            throw new Error(
                result?.error?.message ||
                "Không thể tải dữ liệu nhóm."
            );
        }

        const groups =
            Array.isArray(result.data?.groups)
                ? result.data.groups
                : [];

        const totalStudents =
            groups.reduce(
                (total, group) =>
                    total +
                    Number(group.memberCount || 0),
                0
            );

        totalGroupsElement.innerText =
            groups.length;

        totalStudentsElement.innerText =
            totalStudents;

        /*
         * Module Score chưa chuyển Backend.
         * Chưa xác định nhóm dẫn đầu thật.
         */
        topGroupElement.innerText =
            "Chưa có dữ liệu";

        topGroupScoreElement.innerText =
            "0 điểm";

        if (groups.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        Chưa có dữ liệu nhóm.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML =
            groups.map(group => `
                <tr>
                    <td>${group.code || "-"}</td>

                    <td>${group.name || "-"}</td>

                    <td>
                        ${Number(
                            group.memberCount || 0
                        )}
                    </td>

                    <td>0</td>

                    <td>-</td>
                </tr>
            `).join("");
    } catch (error) {
        console.error(
            "Load admin groups error:",
            error
        );

        totalGroupsElement.innerText = "0";
        totalStudentsElement.innerText = "0";
        topGroupElement.innerText =
            "Không thể tải";

        topGroupScoreElement.innerText =
            "0 điểm";

        tableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    Không thể tải dữ liệu nhóm.
                </td>
            </tr>
        `;
    }
}


function parseSqlLocalDateTime(value) {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return value;
    }

    const normalizedValue = String(value)
        .replace("Z", "")
        .replace(/\.\d{3,7}$/, "");

    const match = normalizedValue.match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
    );

    if (!match) {
        return new Date(value);
    }

    const [
        ,
        year,
        month,
        day,
        hour,
        minute,
        second = "0"
    ] = match;

    return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
    );
}


function formatSessionDateDemo(dateText) {
    if (!dateText) {
        return "-";
    }

    const parts = dateText.split("-");

    if (parts.length !== 3) {
        return dateText;
    }

    return parts[2] + "/" + parts[1] + "/" + parts[0];
}


let adminSessionsApiCache = [];


async function loadAdminSessionsDemo() {
    const tableBody =
        document.getElementById("adminSessionTableBody");

    if (!tableBody) {
        return;
    }

    const token = localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="6">
                Đang tải danh sách buổi học...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/sessions`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (response.status === 401) {
            logoutDemo();
            return;
        }

        if (response.status === 403) {
            window.location.href = "dashboard.html";
            return;
        }

        if (!response.ok || !result.success) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        ${result?.error?.message ||
                        "Không thể tải danh sách buổi học."}
                    </td>
                </tr>
            `;

            adminSessionsApiCache = [];
            loadCurrentSessionSummaryDemo();
            return;
        }

        const sessions = result.data.sessions || [];

        adminSessionsApiCache = sessions;

        if (sessions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        Chưa có buổi học nào được tạo.
                    </td>
                </tr>
            `;

            loadCurrentSessionSummaryDemo();
            return;
        }

        const openSession = sessions.find(
            session => session.status === "OPEN"
        );

        tableBody.innerHTML = sessions.map(session => {
            const startDate =
                parseSqlLocalDateTime(
                    session.scheduledStartAt
                );

            const endDate =
                parseSqlLocalDateTime(
                    session.scheduledEndAt
                );

            const dateText = startDate
                ? startDate.toLocaleDateString("vi-VN")
                : "—";

            const startTime = startDate
                ? startDate.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit"
                })
                : "—";

            const endTime = endDate
                ? endDate.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit"
                })
                : "—";

            const statusLabels = {
                DRAFT: "Sắp diễn ra",
                OPEN: "Đang mở",
                CLOSED: "Đã kết thúc",
                CANCELLED: "Đã hủy"
            };

            const statusLabel =
                statusLabels[session.status] ||
                session.status;

            const attendanceStatus =
                session.status === "OPEN"
                    ? "Có thể điểm danh"
                    : "Đã đóng";

            const randomStatus =
                session.status === "OPEN"
                    ? "Sẵn sàng"
                    : "Đã khóa";

            let rowClass = "session-row session-muted";

            if (
                openSession &&
                Number(session.id) === Number(openSession.id)
            ) {
                rowClass = "session-row session-open";
            } else if (session.status === "DRAFT") {
                rowClass = "session-row session-next";
            }

            const openDisabled =
                session.status === "OPEN" ||
                session.status === "CANCELLED";

            const closeDisabled =
                session.status !== "OPEN";

            return `
                <tr class="${rowClass}">
                    <td>${session.name}</td>

                    <td>${dateText}</td>

                    <td>
                        ${startTime} - ${endTime}
                    </td>

                    <td>${statusLabel}</td>

                    <td>${attendanceStatus}</td>

                    <td>
                        ${randomStatus}

                        <br><br>

                        <button
                            class="edit-material-btn"
                            onclick="openSessionDemo(${session.id})"
                            ${openDisabled ? "disabled" : ""}
                        >
                            Mở
                        </button>

                        <button
                            class="delete-material-btn"
                            onclick="closeSessionDemo(${session.id})"
                            ${closeDisabled ? "disabled" : ""}
                        >
                            Kết thúc
                        </button>

                        <button
                            class="delete-material-btn"
                            disabled
                            title="API xóa buổi học sẽ được bổ sung sau"
                        >
                            Xóa
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

        loadCurrentSessionSummaryDemo();
    } catch (error) {
        console.error("Load sessions error:", error);

        adminSessionsApiCache = [];

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Không thể kết nối đến Backend.
                </td>
            </tr>
        `;

        loadCurrentSessionSummaryDemo();
    }
}//hết

function loadCurrentSessionSummaryDemo() {
    const nameElement =
        document.getElementById("currentSessionName");

    const dateElement =
        document.getElementById("currentSessionDate");

    const statusElement =
        document.getElementById("currentSessionStatus");

    const statusTextElement =
        document.getElementById(
            "currentSessionStatusText"
        );

    const checkedInElement =
        document.getElementById(
            "currentSessionCheckedIn"
        );

    if (!nameElement) {
        return;
    }

    const currentSession =
        adminSessionsApiCache.find(
            session => session.status === "OPEN"
        );

    if (!currentSession) {
        nameElement.innerText = "-";
        dateElement.innerText =
            "Chưa có buổi học đang mở";
        statusElement.innerText = "Đã đóng";
        statusTextElement.innerText =
            "Điểm danh: Chưa mở";
        checkedInElement.innerText = "0";
        return;
    }

    const startDate =
        parseSqlLocalDateTime(
            currentSession.scheduledStartAt
        );

    nameElement.innerText = currentSession.name;

    dateElement.innerText = startDate
        ? startDate.toLocaleDateString("vi-VN")
        : "Chưa có ngày học";

    statusElement.innerText = "Đang mở";

    statusTextElement.innerText =
        "Điểm danh: Có thể điểm danh";

    // Số người điểm danh thật sẽ kết nối sau.
    checkedInElement.innerText = "0";
}

async function openSessionDemo(sessionId) {
    const token = localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return;
    }

    const confirmed = confirm(
        "Bạn có chắc muốn mở buổi học này không?\n\n" +
        "Nếu đang có buổi học khác mở, buổi đó sẽ tự động đóng."
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/sessions/${sessionId}/open`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (response.status === 401) {
            logoutDemo();
            return;
        }

        if (response.status === 403) {
            window.location.href = "dashboard.html";
            return;
        }

        if (!response.ok || !result.success) {
            alert(
                result?.error?.message ||
                "Không thể mở buổi học."
            );
            return;
        }

        alert("Đã mở buổi học thành công.");

        await loadAdminSessionsDemo();
    } catch (error) {
        console.error("Open session error:", error);
        alert("Không thể kết nối đến Backend.");
    }
}

async function closeSessionDemo(sessionId) {
    const token = localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return;
    }

    const confirmed = confirm(
        "Bạn có chắc muốn kết thúc buổi học này không?\n\n" +
        "Sau khi đóng, học viên sẽ không thể tiếp tục điểm danh."
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/sessions/${sessionId}/close`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (response.status === 401) {
            logoutDemo();
            return;
        }

        if (response.status === 403) {
            window.location.href = "dashboard.html";
            return;
        }

        if (!response.ok || !result.success) {
            alert(
                result?.error?.message ||
                "Không thể đóng buổi học."
            );
            return;
        }

        alert("Đã đóng buổi học thành công.");

        await loadAdminSessionsDemo();
    } catch (error) {
        console.error("Close session error:", error);
        alert("Không thể kết nối đến Backend.");
    }
}

function deleteSessionDemo(sessionId) {
    const confirmDelete = confirm(
        "Bạn có chắc muốn xóa buổi học này không? Lịch học liên quan cũng sẽ bị xóa."
    );

    if (!confirmDelete) {
        return;
    }

    const sessions = getStoredSessionsDemo()
        .filter(session => Number(session.id) !== Number(sessionId));

    saveStoredSessionsDemo(sessions);

    const schedules = getStoredSchedulesDemo()
        .filter(schedule => Number(schedule.sessionId) !== Number(sessionId));

    saveStoredSchedulesDemo(schedules);

    loadAdminSessionsDemo();
    loadAdminSchedulesDemo();
    loadStudentSchedulesDemo();
    loadScheduleSessionOptionsDemo();
}

function getCurrentSessionDemo() {
    const sessions = getStoredSessionsDemo();

    if (sessions.length === 0) {
        return null;
    }

    const openSession = sessions.find(
        session => session.status === "Đang mở"
    );

    if (openSession) {
        return openSession;
    }

    const upcomingSessions = sessions
        .filter(session => session.status === "Sắp diễn ra")
        .sort((a, b) => {
            const dateA = new Date(a.date + "T" + a.startTime);
            const dateB = new Date(b.date + "T" + b.startTime);

            return dateA - dateB;
        });

    if (upcomingSessions.length > 0) {
        return upcomingSessions[0];
    }

    const endedSessions = sessions
        .filter(session => session.status === "Đã kết thúc")
        .sort((a, b) => {
            const dateA = new Date(a.date + "T" + a.startTime);
            const dateB = new Date(b.date + "T" + b.startTime);

            return dateB - dateA;
        });

    if (endedSessions.length > 0) {
        return endedSessions[0];
    }

    return sessions[0];
}

function loadAdminSchedulesDemo() {
    const tableBody = document.getElementById("adminScheduleTableBody");

    if (!tableBody) {
        return;
    }

    const schedules = getStoredSchedulesDemo();

    if (schedules.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4">Chưa có lịch học nào được tạo.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = schedules.map(item => `
        <tr>
            <td>${formatSessionDateDemo(item.date)}</td>
            <td>${item.title}</td>
            <td>${item.bibleVerse}</td>
            <td>${item.activity}</td>
        </tr>
    `).join("");
}

function loadStudentSchedulesDemo() {
    const tableBody = document.getElementById("studentScheduleTableBody");

    if (!tableBody) {
        return;
    }

    const schedules = getStoredSchedulesDemo();

    if (schedules.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4">Chưa có lịch học nào được cập nhật.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = schedules.map(item => `
        <tr>
            <td>${formatSessionDateDemo(item.date)}</td>
            <td>${item.title}</td>
            <td>${item.bibleVerse}</td>
            <td>${item.activity}</td>
        </tr>
    `).join("");
}


let currentScheduleWeekIndex = 0;

const scheduleTimelineWeeksDemo = [
    {
        title: "TUẦN 1: TIÊU CỰ HẸP",
        subtitle: "Timeline chi tiết các buổi học trong tuần 1.",
        image: "assets/schedule/week-1.jpg"
    },
    {
        title: "TUẦN 2: ĐIỂM MÙ",
        subtitle: "Timeline chi tiết các buổi học trong tuần 2.",
        image: "assets/schedule/week-2.jpg"
    },
    {
        title: "TUẦN 3: LA BÀN",
        subtitle: "Timeline chi tiết các buổi học trong tuần 3.",
        image: "assets/schedule/week-3.jpg"
    }
];

function loadScheduleTimelineDemo() {
    const imageElement = document.getElementById("scheduleTimelineImage");

    if (!imageElement) {
        return;
    }

    const week = scheduleTimelineWeeksDemo[currentScheduleWeekIndex];

    document.getElementById("scheduleWeekTitle").innerText = week.title;
    document.getElementById("scheduleWeekSubtitle").innerText = week.subtitle;
    document.getElementById("scheduleWeekBadge").innerText =
        currentScheduleWeekIndex + 1 + " / " + scheduleTimelineWeeksDemo.length;

    imageElement.src = week.image;
    imageElement.alt = "Timeline " + week.title;

    document.getElementById("prevScheduleWeekBtn").disabled =
        currentScheduleWeekIndex === 0;

    document.getElementById("nextScheduleWeekBtn").disabled =
        currentScheduleWeekIndex === scheduleTimelineWeeksDemo.length - 1;
}

function changeScheduleWeek(direction) {
    const nextIndex = currentScheduleWeekIndex + direction;

    if (nextIndex < 0 || nextIndex >= scheduleTimelineWeeksDemo.length) {
        return;
    }

    currentScheduleWeekIndex = nextIndex;
    loadScheduleTimelineDemo();
}


function loadScheduleSessionOptionsDemo() {

    const select =
        document.getElementById(
            "scheduleSession"
        );

    if (!select) {
        return;
    }

    const sessions =
        getStoredSessionsDemo();

    if (sessions.length === 0) {

        select.innerHTML = `
            <option value="">
                Chưa có buổi học
            </option>
        `;

        return;
    }

    select.innerHTML = `
        <option value="">
            -- Chọn buổi học --
        </option>
    `;

    sessions
        .sort((a, b) => {

            const dateA =
                new Date(
                    a.date + "T" + a.startTime
                );

            const dateB =
                new Date(
                    b.date + "T" + b.startTime
                );

            return dateA - dateB;

        })
        .forEach(session => {

            select.innerHTML += `
                <option value="${session.id}">
                    ${session.name}
                    (${formatSessionDateDemo(session.date)})
                </option>
            `;

        });

}

function loadCurrentAttendanceSessionTextDemo() {
    const sessionText = document.getElementById("currentAttendanceSessionText");

    if (!sessionText) {
        return;
    }

    const currentSession = getOpenSessionDemo();

    if (!currentSession) {
        sessionText.innerText = "Chưa có buổi học đang mở.";
        return;
    }

    sessionText.innerText =
        currentSession.name +
        " · " +
        formatSessionDateDemo(currentSession.date) +
        " · " +
        currentSession.status;
}

function getOpenSessionDemo() {
    const sessions = getStoredSessionsDemo();

    return sessions.find(
        session => session.status === "Đang mở"
    ) || null;
}

async function loadStudentDashboardStatsDemo() {
    const attendanceElement =
        document.getElementById("dashboardAttendanceCount");

    const groupScoreElement =
        document.getElementById("dashboardGroupScore");

    const groupNameText =
        document.getElementById("dashboardGroupNameText");

    if (
        !attendanceElement ||
        !groupScoreElement ||
        !groupNameText
    ) {
        return;
    }

    const currentUser = getCurrentUserDemo();

    if (!currentUser) {
        return;
    }

    attendanceElement.innerText = "...";

    const token = localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/attendance/history`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (response.status === 401) {
            logoutDemo();
            return;
        }

        if (response.status === 403) {
            attendanceElement.innerText = "0";
        } else if (!response.ok || !result.success) {
            attendanceElement.innerText = "0";

            console.error(
                "Dashboard attendance error:",
                result?.error?.message ||
                "Không thể tải số lần điểm danh."
            );
        } else {
            attendanceElement.innerText =
                Number(result.data.total) || 0;
        }
    } catch (error) {
        console.error(
            "Load dashboard attendance error:",
            error
        );

        attendanceElement.innerText = "0";
    }

        try {
        const scoreResponse = await fetch(
            `${API_BASE_URL}/api/scores/my-group`,
            {
                method: "GET",
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const scoreResult =
            await scoreResponse.json();

        if (scoreResponse.status === 401) {
            logoutDemo();
            return;
        }

        if (
            !scoreResponse.ok ||
            !scoreResult.success
        ) {
            groupScoreElement.innerText = "0";

            groupNameText.innerText =
                scoreResult?.error?.message ||
                "Không thể tải điểm nhóm.";

            return;
        }

        const group =
            scoreResult.data?.group || {};

        const summary =
            scoreResult.data?.summary || {};

        groupScoreElement.innerText =
            Number(summary.totalPoints) || 0;

        groupNameText.innerText =
            "Nhóm " +
            (
                group.name ||
                "Chưa phân nhóm"
            );
    } catch (error) {
        console.error(
            "Load dashboard group score error:",
            error
        );

        groupScoreElement.innerText = "0";

        groupNameText.innerText =
            "Không thể tải điểm nhóm";
    }
}

async function loadGroupScoreHistoryDemo() {
    const tableBody =
        document.getElementById(
            "groupScoreHistoryBody"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="3">
                Đang tải lịch sử điểm nhóm...
            </td>
        </tr>
    `;

    try {
        const data =
            await getMyGroupScoreApiData();

        if (!data) {
            return;
        }

        const history =
            Array.isArray(data.history)
                ? data.history
                : [];

        if (history.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3">
                        Nhóm của bạn chưa có lịch sử điểm nhóm.
                    </td>
                </tr>
            `;

            return;
        }

        tableBody.innerHTML =
            history.map(item => {
                const createdDate =
                    parseSqlLocalDateTime(
                        item.createdAt
                    );

                const createdAtText =
                    createdDate
                        ? createdDate.toLocaleString(
                            "vi-VN"
                        )
                        : "—";

                const points =
                    Number(item.points) || 0;

                const description =
                    item.description ||
                    item.sourceTypeLabel ||
                    "Cập nhật điểm nhóm";

                return `
                    <tr>
                        <td>${createdAtText}</td>

                        <td>
                            ${description}

                            <br>

                            <small>
                                ${
                                    item.sourceTypeLabel ||
                                    item.sourceType ||
                                    ""
                                }
                            </small>
                        </td>

                        <td>
                            ${points > 0 ? "+" : ""}${points}
                        </td>
                    </tr>
                `;
            }).join("");
    } catch (error) {
        console.error(
            "Load group score history error:",
            error
        );

        tableBody.innerHTML = `
            <tr>
                <td colspan="3">
                    Không thể tải lịch sử điểm nhóm.
                </td>
            </tr>
        `;
    }
}

function resetStudentPasswordDemo(username) {
    const confirmReset = confirm(
        "Bạn có chắc muốn reset mật khẩu của học viên này về 123456 không?"
    );

    if (!confirmReset) {
        return;
    }

    localStorage.removeItem("password_" + username);

    alert("Đã reset mật khẩu về mặc định: 123456");
}

function loadAdminScoreSummaryDemo() {
    const totalPointsElement = document.getElementById("adminScoreTotalPoints");
    const totalRecordsElement = document.getElementById("adminScoreTotalRecords");
    const topGroupElement = document.getElementById("adminScoreTopGroup");
    const topGroupPointsElement = document.getElementById("adminScoreTopGroupPoints");

    if (!totalPointsElement) {
        return;
    }

    const scores = getStoredScoresDemo();

    const totalPoints = scores.reduce(
        (total, item) => total + Number(item.scoreValue || 0),
        0
    );

    const ranking = getGroupRankingWithScoresDemo();

    totalPointsElement.innerText = totalPoints;
    totalRecordsElement.innerText = scores.length;

    if (ranking.length > 0) {
        topGroupElement.innerText = ranking[0].groupName;
        topGroupPointsElement.innerText = ranking[0].score + " điểm";
    } else {
        topGroupElement.innerText = "-";
        topGroupPointsElement.innerText = "0 điểm";
    }
}


let bcCurrentGroupNameDemo = "";
let bcAvailableMembersDemo = [];


let bcSelectedGroupApi = null;
let bcSelectedMemberApi = null;
let bcWriteInProgress = false;


/*
 * =========================================================
 * BIBLE CHALLENGE API INTEGRATION
 * =========================================================
 */

let bcCurrentApiPromise = null;
let bcHistoryApiPromise = null;

async function bibleChallengeApiRequest(path, options = {}) {
    const token = localStorage.getItem("accessToken");

    if (!token) {
        window.location.href = "index.html";
        throw new Error("Phiên đăng nhập không tồn tại.");
    }

    const response = await fetch(
        `${API_BASE_URL}/api/bible-challenge${path}`,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...(options.headers || {})
            }
        }
    );

    let result = null;

    try {
        result = await response.json();
    } catch (error) {
        throw new Error("Backend trả về dữ liệu không hợp lệ.");
    }

    if (response.status === 401) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("currentUsername");

        window.location.href = "index.html";

        throw new Error("Phiên đăng nhập đã hết hạn.");
    }

    if (!response.ok || !result.success) {
        throw new Error(
            result?.error?.message ||
            result?.message ||
            "Không thể xử lý Bible Challenge."
        );
    }

    return result.data;
}

function getBibleChallengeCurrentApi(forceRefresh = false) {
    if (forceRefresh || !bcCurrentApiPromise) {
        bcCurrentApiPromise =
            bibleChallengeApiRequest("/current")
                .catch(error => {
                    bcCurrentApiPromise = null;
                    throw error;
                });
    }

    return bcCurrentApiPromise;
}

function getBibleChallengeHistoryApi(forceRefresh = false) {
    if (forceRefresh || !bcHistoryApiPromise) {
        bcHistoryApiPromise =
            bibleChallengeApiRequest("/history")
                .catch(error => {
                    bcHistoryApiPromise = null;
                    throw error;
                });
    }

    return bcHistoryApiPromise;
}

function resetBibleChallengeApiCache() {
    bcCurrentApiPromise = null;
    bcHistoryApiPromise = null;
}

async function refreshBibleChallengeApiUi() {
    resetBibleChallengeApiCache();

    await Promise.all([
        loadBibleChallengeDemo(),
        loadBibleChallengeSummaryDemo(),
        loadBibleChallengeHistoryDemo(),
        loadBibleChallengeProgressDemo()
    ]);
}

function formatBibleChallengeDateTime(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString("vi-VN");
}

function escapeBibleChallengeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


async function loadBibleChallengeDemo() {
    const groupGrid = document.getElementById("bcGroupGrid");

    if (!groupGrid) {
        return;
    }

    groupGrid.innerHTML = `
        <p class="empty-note">Đang tải danh sách nhóm...</p>
    `;

    try {
        const data = await getBibleChallengeCurrentApi();

        const eligibleGroups =
            Array.isArray(data.eligibleGroups)
                ? data.eligibleGroups
                : [];

        const usedSelections =
            Array.isArray(data.usedGroups)
                ? data.usedGroups
                : [];

        const groupMap = new Map();

        eligibleGroups.forEach(item => {
            const group = item.group || item;

            if (!group?.id) {
                return;
            }

            groupMap.set(Number(group.id), {
                id: Number(group.id),
                code: group.code || "",
                name: group.name || "Không xác định",
                logoPath: group.logoPath || null,
                used: false,
                roundNo: null
            });
        });

        usedSelections.forEach(selection => {
            const group = selection.group || selection;

            if (!group?.id) {
                return;
            }

            groupMap.set(Number(group.id), {
                id: Number(group.id),
                code: group.code || "",
                name: group.name || "Không xác định",
                logoPath: group.logoPath || null,
                used: true,
                roundNo: selection.roundNo || null
            });
        });

        const groups = Array.from(groupMap.values())
            .sort((a, b) => a.id - b.id);

        if (groups.length === 0) {
            groupGrid.innerHTML = `
                <p class="empty-note">
                    Hiện không có nhóm nào đủ điều kiện để random.
                </p>
            `;
            return;
        }

        groupGrid.innerHTML = groups.map(group => `
            <div
                class="bc-card ${group.used ? "used" : ""}"
                data-group-id="${group.id}"
                data-group-name="${escapeBibleChallengeHtml(group.name)}"
            >
                <div class="bc-avatar">
                    ${escapeBibleChallengeHtml(group.name.charAt(0))}
                </div>

                <div>
                    ${escapeBibleChallengeHtml(group.name)}
                </div>

                <small>
                    ${
                        group.used
                            ? `Đã random${group.roundNo ? ` · Vòng ${group.roundNo}` : ""}`
                            : "Đủ điều kiện"
                    }
                </small>
            </div>
        `).join("");
    } catch (error) {
        console.error(
            "Load Bible Challenge groups error:",
            error
        );

        groupGrid.innerHTML = `
            <p class="empty-note">
                ${escapeBibleChallengeHtml(error.message)}
            </p>
        `;
    }
}


function bcRenderMemberPanelStatusDemo(currentData) {
    const memberGrid =
        document.getElementById("bcMemberGrid");

    const randomMemberButton =
        document.getElementById("bcRandomMemberBtn");

    if (!memberGrid || !randomMemberButton) {
        return false;
    }

    const progress =
        currentData?.progress || {};

    const checkedInCount =
        Number(progress.checkedInCount || 0);

    const completedCount =
        Number(progress.completedCount || 0);

    const remainingCount =
        Math.max(
            checkedInCount - completedCount,
            0
        );

    if (checkedInCount === 0) {
        memberGrid.innerHTML = `
            <p class="empty-note">
                Chưa có học viên nào điểm danh trong buổi học này.
            </p>
        `;

        randomMemberButton.disabled = true;
        randomMemberButton.innerText =
            "Chưa có học viên đủ điều kiện";

        return true;
    }

    if (remainingCount === 0) {
        memberGrid.innerHTML = `
            <div class="bc-card used">
                <div class="bc-avatar">✅</div>

                <div>
                    Đã hoàn thành Bible Challenge
                </div>

                <small>
                    Tất cả học viên đủ điều kiện trong buổi này
                    đã hoàn thành.
                </small>
            </div>
        `;

        randomMemberButton.disabled = true;
        randomMemberButton.innerText =
            "Đã hoàn thành";

        return true;
    }

    randomMemberButton.disabled = false;
    randomMemberButton.innerText =
        "Random Member";

    return false;
}


async function bcOpenGroupDemo(groupName) {
    if (!bcSelectedGroupApi?.id) {
        alert("Vui lòng random nhóm trước.");
        return;
    }

    bcCurrentGroupNameDemo =
        groupName ||
        bcSelectedGroupApi.name ||
        "";

    const groupPanel =
        document.querySelector(".bc-random-panel");

    const memberPanel =
        document.getElementById("bcMemberPanel");

    const memberTitle =
        document.getElementById("bcMemberGroupTitle");

    const memberGrid =
        document.getElementById("bcMemberGrid");

    if (
        !groupPanel ||
        !memberPanel ||
        !memberTitle ||
        !memberGrid
    ) {
        return;
    }

    groupPanel.classList.add("hidden");
    memberPanel.classList.remove("hidden");

    memberTitle.innerText =
        "Nhóm " + bcCurrentGroupNameDemo;

    memberGrid.innerHTML = `
        <p class="empty-note">
            Đang kiểm tra học viên đủ điều kiện...
        </p>
    `;

    try {
        const currentData =
            await getBibleChallengeCurrentApi();

        const statusHandled =
            bcRenderMemberPanelStatusDemo(
                currentData
            );

        if (!statusHandled) {
            memberGrid.innerHTML = `
                <div class="bc-card">
                    <div class="bc-avatar">🎯</div>

                    <div>
                        Sẵn sàng random học viên
                    </div>

                    <small>
                        Nhấn Random Member để backend chọn một học viên
                        đã điểm danh và chưa hoàn thành Bible Challenge.
                    </small>
                </div>
            `;
        }
    } catch (error) {
        console.error(
            "Load member panel status error:",
            error
        );

        memberGrid.innerHTML = `
            <p class="empty-note">
                ${escapeBibleChallengeHtml(error.message)}
            </p>
        `;
    }

    const resultPanel =
        document.getElementById("bcResultPanel");

    if (resultPanel) {
        resultPanel.classList.add("hidden");
    }
}

function bcBackToGroupsDemo() {
    if (bcMemberRollingDemo) {
        alert("Đang random thành viên, vui lòng chờ kết quả.");
        return;
    }

    const panels = document.querySelectorAll(".bc-random-panel");
    const memberPanel = document.getElementById("bcMemberPanel");

    panels[0].classList.remove("hidden");
    memberPanel.classList.add("hidden");
}

async function bcRandomMemberDemo() {
    if (
        bcMemberRollingDemo ||
        bcWriteInProgress
    ) {
        return;
    }

    const randomMemberButton =
        document.getElementById(
            "bcRandomMemberBtn"
        );

    if (randomMemberButton?.disabled) {
        return;
    }

    if (!bcSelectedGroupApi?.id) {
        alert("Chưa có nhóm nào được random.");
        return;
    }

    const memberGrid =
        document.getElementById("bcMemberGrid");

    if (!memberGrid) {
        return;
    }

    bcMemberRollingDemo = true;
    bcWriteInProgress = true;

    try {
        memberGrid.innerHTML = `
            <p class="empty-note">
                Backend đang chọn học viên...
            </p>
        `;

        const data =
            await bibleChallengeApiRequest(
                `/draw-member/${bcSelectedGroupApi.id}`,
                {
                    method: "POST",
                    body: JSON.stringify({})
                }
            );

        const selectedMember = data.member;

        if (!selectedMember?.seasonMembershipId) {
            throw new Error(
                "Backend không trả về học viên hợp lệ."
            );
        }

        bcSelectedMemberApi = selectedMember;

        const cardCount = Math.min(
            Math.max(
                Number(data.eligibleMemberCount || 1),
                4
            ),
            10
        );

        const winnerIndex =
            Math.floor(Math.random() * cardCount);

        bcAvailableMembersDemo =
            Array.from(
                { length: cardCount },
                (_, index) => {
                    if (index === winnerIndex) {
                        return selectedMember;
                    }

                    return {
                        fullName: "Đang chọn...",
                        tkhCode: "",
                        placeholder: true
                    };
                }
            );

        memberGrid.innerHTML =
            bcAvailableMembersDemo
                .map(member => `
                    <div class="bc-card">
                        <div class="bc-avatar">
                            ${
                                member.placeholder
                                    ? "?"
                                    : escapeBibleChallengeHtml(
                                        String(
                                            member.fullName || "?"
                                        ).trim().charAt(0)
                                    )
                            }
                        </div>

                        <div>
                            ${
                                member.placeholder
                                    ? "Đang chọn..."
                                    : escapeBibleChallengeHtml(
                                        member.fullName
                                    )
                            }
                        </div>

                        <small>
                            ${
                                member.placeholder
                                    ? "Bible Challenge"
                                    : escapeBibleChallengeHtml(
                                        member.tkhCode || ""
                                    )
                            }
                        </small>
                    </div>
                `)
                .join("");

        const cards = Array.from(
            memberGrid.querySelectorAll(".bc-card")
        );

        bcSpinToWinnerDemo(
            cards,
            winnerIndex,
            () => {
                bcMemberRollingDemo = false;
                bcWriteInProgress = false;

                bcShowWinnerDemo(winnerIndex);
            },
            80,
            30
        );
    } catch (error) {
        console.error(
            "Random Bible Challenge member error:",
            error
        );

        bcMemberRollingDemo = false;
        bcWriteInProgress = false;

        memberGrid.innerHTML = `
            <p class="empty-note">
                ${escapeBibleChallengeHtml(error.message)}
            </p>
        `;

        alert(error.message);
    }
}

function bcShowWinnerDemo(index) {
    const winner =
        bcAvailableMembersDemo[index] ||
        bcSelectedMemberApi;

    if (
        !winner ||
        winner.placeholder ||
        !winner.seasonMembershipId
    ) {
        return;
    }

    bcSelectedMemberApi = winner;

    const backdrop =
        document.getElementById("bcWinnerBackdrop");

    const overlay =
        document.getElementById("bcWinnerOverlay");

    const avatar =
        document.getElementById("bcWinnerAvatar");

    const name =
        document.getElementById("bcWinnerName");

    avatar.innerText =
        String(winner.fullName || "?")
            .trim()
            .charAt(0)
            .toUpperCase();

    name.innerText =
        winner.fullName || "Không xác định";

    backdrop.classList.remove("hidden");
    overlay.classList.remove("hidden");

    if (typeof confetti === "function") {
        confetti({
            particleCount: 160,
            spread: 360,
            startVelocity: 45,
            origin: { y: 0.5 }
        });
    }

    setTimeout(() => {
        backdrop.classList.add("hidden");
        overlay.classList.add("hidden");

        const resultPanel =
            document.getElementById("bcResultPanel");

        const resultName =
            document.getElementById(
                "bcResultMemberName"
            );

        const resultCode =
            document.getElementById(
                "bcResultMemberCode"
            );

        if (resultPanel) {
            resultPanel.classList.remove("hidden");
        }

        if (resultName) {
            resultName.innerText =
                winner.fullName || "Không xác định";
        }

        if (resultCode) {
            resultCode.innerText =
                winner.tkhCode
                    ? `Mã học viên: ${winner.tkhCode}`
                    : "";
        }
    }, 3500);
}


async function bcSubmitResultDemo(resultCode) {
    if (bcWriteInProgress) {
        return;
    }

    if (
        !bcSelectedGroupApi?.id ||
        !bcSelectedMemberApi?.seasonMembershipId
    ) {
        alert(
            "Chưa có học viên hợp lệ để ghi nhận kết quả."
        );
        return;
    }

    const result =
        String(resultCode || "")
            .trim()
            .toUpperCase();

    const allowedResults = [
        "FULL",
        "PARTIAL",
        "FAILED",
        "SKIPPED"
    ];

    if (!allowedResults.includes(result)) {
        alert("Kết quả không hợp lệ.");
        return;
    }

    bcWriteInProgress = true;

    try {
        const data =
            await bibleChallengeApiRequest(
                "/submit-result",
                {
                    method: "POST",
                    body: JSON.stringify({
                        groupId:
                            bcSelectedGroupApi.id,

                        seasonMembershipId:
                            bcSelectedMemberApi
                                .seasonMembershipId,

                        result
                    })
                }
            );

        const memberName =
            data.member?.fullName ||
            bcSelectedMemberApi.fullName ||
            "học viên";

        const appliedPoints =
            Number(data.appliedPoints || 0);

        let message =
            `Đã ghi nhận kết quả cho ${memberName}. ` +
            `Cộng ${appliedPoints} điểm.`;

        if (data.reachedMaximum) {
            message +=
                ` Học viên đã đạt giới hạn ` +
                `${data.maximumPoints} điểm Bible Challenge.`;
        }

        alert(message);

        bcSelectedMemberApi = null;
        bcAvailableMembersDemo = [];

        const resultPanel =
            document.getElementById("bcResultPanel");

        if (resultPanel) {
            resultPanel.classList.add("hidden");
        }

        await refreshBibleChallengeApiUi();

        if (bcSelectedGroupApi?.name) {
            await bcOpenGroupDemo(
                bcSelectedGroupApi.name
            );
        }
    } catch (error) {
        console.error(
            "Submit Bible Challenge result error:",
            error
        );

        alert(error.message);

        resetBibleChallengeApiCache();

        try {
            await refreshBibleChallengeApiUi();
        } catch (refreshError) {
            console.error(
                "Refresh Bible Challenge error:",
                refreshError
            );
        }
    } finally {
        bcWriteInProgress = false;
    }
}

async function bcRandomGroupDemo() {
    if (
        bcGroupRollingDemo ||
        bcWriteInProgress
    ) {
        return;
    }

    const groupCards = Array.from(
        document.querySelectorAll(
            "#bcGroupGrid .bc-card"
        )
    ).filter(card =>
        !card.classList.contains("used")
    );

    if (groupCards.length === 0) {
        alert(
            "Hiện không còn nhóm nào đủ điều kiện để random."
        );
        return;
    }

    bcGroupRollingDemo = true;
    bcWriteInProgress = true;

    try {
        const data =
            await bibleChallengeApiRequest(
                "/draw-group",
                {
                    method: "POST",
                    body: JSON.stringify({})
                }
            );

        const selectedGroup = data.group;

        if (!selectedGroup?.id) {
            throw new Error(
                "Backend không trả về nhóm được chọn."
            );
        }

        bcSelectedGroupApi = selectedGroup;
        bcSelectedMemberApi = null;

        const winnerIndex =
            groupCards.findIndex(card =>
                Number(
                    card.getAttribute(
                        "data-group-id"
                    )
                ) === Number(selectedGroup.id)
            );

        if (winnerIndex === -1) {
            throw new Error(
                "Không tìm thấy nhóm backend đã chọn trên giao diện."
            );
        }

        bcSpinToWinnerDemo(
            groupCards,
            winnerIndex,
            () => {
                bcGroupRollingDemo = false;
                bcWriteInProgress = false;

                bcShowGroupWinnerDemo(
                    selectedGroup.name
                );

                setTimeout(async () => {
                    try {
                        await refreshBibleChallengeApiUi();

                        bcOpenGroupDemo(
                            selectedGroup.name,
                            true
                        );
                    } catch (error) {
                        console.error(
                            "Refresh Bible Challenge after group draw error:",
                            error
                        );

                        alert(error.message);
                    }
                }, 5000);
            },
            50,
            30
        );
    } catch (error) {
        console.error(
            "Random Bible Challenge group error:",
            error
        );

        bcGroupRollingDemo = false;
        bcWriteInProgress = false;

        resetBibleChallengeApiCache();

        alert(error.message);

        try {
            await refreshBibleChallengeApiUi();
        } catch (refreshError) {
            console.error(
                "Refresh Bible Challenge error:",
                refreshError
            );
        }
    }
}

function bcSpinToWinnerDemo(cards, winnerIndex, finishCallback, minSteps = 50, startSpeed = 30) {
    let currentIndex = 0;
    let step = 0;
    let speed = startSpeed;

    const distance = (winnerIndex - currentIndex + cards.length) % cards.length;
    const targetSteps = minSteps + distance;

    function spin() {
        cards.forEach(card => card.classList.remove("selected"));

        cards[currentIndex].classList.add("selected");

        if (step >= targetSteps) {
            cards.forEach(card => card.classList.remove("selected"));
            cards[winnerIndex].classList.add("selected");

            finishCallback();
            return;
        }

        step++;

        currentIndex = (currentIndex + 1) % cards.length;

        const progress = step / targetSteps;

        if (progress < 0.35) {
            speed += 1;
        } else if (progress < 0.65) {
            speed += 4;
        } else if (progress < 0.85) {
            speed += 18;
        } else {
            speed += 45;
        }

        setTimeout(spin, speed);
    }

    spin();
}

let bcGroupRollingDemo = false;
let bcMemberRollingDemo = false;

function getBibleChallengeStateDemo() {
    return JSON.parse(localStorage.getItem("bibleChallengeStateDemo")) || {
        usedGroups: [],
        usedMembers: {}
    };
}

function saveBibleChallengeStateDemo(state) {
    localStorage.setItem("bibleChallengeStateDemo", JSON.stringify(state));
}

function bcShowGroupWinnerDemo(groupName) {
    const backdrop = document.getElementById("bcWinnerBackdrop");
    const overlay = document.getElementById("bcWinnerOverlay");
    const avatar = document.getElementById("bcWinnerAvatar");
    const name = document.getElementById("bcWinnerName");

    avatar.innerText = "🏆";
    name.innerText = "Nhóm " + groupName;

    backdrop.classList.remove("hidden");
    overlay.classList.remove("hidden");

    if (typeof confetti === "function") {
        confetti({
            particleCount: 200,
            spread: 360,
            startVelocity: 50,
            origin: { y: 0.5 }
        });
    }

    setTimeout(() => {
        backdrop.classList.add("hidden");
        overlay.classList.add("hidden");
    }, 4500);
}

function bcResetBibleChallengeDemo() {
    const confirmReset = confirm(
        "Bạn có chắc muốn reset toàn bộ trạng thái Bible Challenge không? Các nhóm và thành viên đã quay sẽ được mở lại."
    );

    if (!confirmReset) {
        return;
    }

    localStorage.removeItem("bibleChallengeStateDemo");

    bcCurrentGroupNameDemo = "";
    bcAvailableMembersDemo = [];
    bcGroupRollingDemo = false;
    bcMemberRollingDemo = false;

    const memberPanel = document.getElementById("bcMemberPanel");
    const panels = document.querySelectorAll(".bc-random-panel");

    if (panels[0]) {
        panels[0].classList.remove("hidden");
    }

    if (memberPanel) {
        memberPanel.classList.add("hidden");
    }

    loadBibleChallengeDemo();

    alert("Đã reset Bible Challenge thành công.");
}

async function loadBibleChallengeSummaryDemo() {
    const sessionElement =
        document.getElementById("bcCurrentSession");

    const eligibleElement =
        document.getElementById("bcEligible");

    const completedElement =
        document.getElementById("bcCompleted");

    if (
        !sessionElement ||
        !eligibleElement ||
        !completedElement
    ) {
        return;
    }

    try {
        const data = await getBibleChallengeCurrentApi();

        const session = data.session;
        const progress = data.progress || {};

        sessionElement.innerText =
            session?.name || "Chưa mở";

        eligibleElement.innerText =
            Number(progress.checkedInCount || 0);

        completedElement.innerText =
            `${Number(progress.completedCount || 0)} / ` +
            `${Number(progress.checkedInCount || 0)}`;
    } catch (error) {
        console.error(
            "Load Bible Challenge summary error:",
            error
        );

        sessionElement.innerText = "Không thể tải";
        eligibleElement.innerText = 0;
        completedElement.innerText = 0;
    }
}

function getBibleChallengeHistoryDemo() {
    return JSON.parse(localStorage.getItem("bibleChallengeHistoryDemo")) || [];
}

function saveBibleChallengeHistoryDemo(history) {
    localStorage.setItem("bibleChallengeHistoryDemo", JSON.stringify(history));
}

function addBibleChallengeHistoryDemo(winner) {
    const currentSession = getOpenSessionDemo();

    if (!currentSession || !winner) {
        return;
    }

    const history = getBibleChallengeHistoryDemo();

    const alreadyExists = history.find(item =>
        item.username === winner.username &&
        item.session === currentSession.name
    );

    if (alreadyExists) {
        return;
    }

    history.unshift({
        id: Date.now(),
        session: currentSession.name,
        username: winner.username,
        fullName: winner.fullName,
        groupName: winner.groupName,
        createdAt: new Date().toLocaleString("vi-VN"),
        status: "Chưa cộng điểm",
        scoreAdded: false
    });

    saveBibleChallengeHistoryDemo(history);
}

async function loadBibleChallengeHistoryDemo() {
    const tableBody =
        document.getElementById("bcHistoryTableBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="6">Đang tải lịch sử...</td>
        </tr>
    `;

    try {
        const data = await getBibleChallengeHistoryApi();

        const history =
            Array.isArray(data.history)
                ? data.history
                : [];

        if (history.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        Chưa có lịch sử Bible Challenge.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = history.map(item => {
            const memberName =
                item.member?.fullName || "Không xác định";

            const memberCode =
                item.member?.tkhCode || "-";

            const groupName =
                item.group?.name || "Không xác định";

            const resultLabel =
                item.resultLabel || item.result || "-";

            const points =
                Number(item.awardedPoints || 0);

            return `
                <tr>
                    <td>
                        ${escapeBibleChallengeHtml(
                            formatBibleChallengeDateTime(
                                item.createdAt
                            )
                        )}
                    </td>

                    <td>
                        ${escapeBibleChallengeHtml(
                            data.session?.name || "-"
                        )}
                    </td>

                    <td>
                        ${escapeBibleChallengeHtml(memberName)}
                        (${escapeBibleChallengeHtml(memberCode)})
                    </td>

                    <td>
                        ${escapeBibleChallengeHtml(groupName)}
                    </td>

                    <td>
                        ${escapeBibleChallengeHtml(resultLabel)}
                    </td>

                    <td>
                        Đã cộng ${points} điểm
                    </td>
                </tr>
            `;
        }).join("");
    } catch (error) {
        console.error(
            "Load Bible Challenge history error:",
            error
        );

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    ${escapeBibleChallengeHtml(error.message)}
                </td>
            </tr>
        `;
    }
}


function addBibleChallengeScoreDemo(historyId, points) {
    const history = getBibleChallengeHistoryDemo();

    const item = history.find(record =>
        Number(record.id) === Number(historyId)
    );

    if (!item) {
        alert("Không tìm thấy lịch sử Bible Challenge.");
        return;
    }

    if (item.scoreAdded) {
        alert("Học viên này đã được cộng điểm rồi.");
        return;
    }

    const scores = getStoredScoresDemo();

    scores.unshift({
        id: Date.now(),
        username: item.username,
        fullName: item.fullName,
        groupName: item.groupName,
        scoreType: "bible_challenge",
        scoreTypeLabel: "Trả bài cũ / Bible Challenge",
        scoreValue: Number(points),
        reason: "Bible Challenge - " + item.session,
        createdAt: new Date().toLocaleString("vi-VN")
    });

    saveStoredScoresDemo(scores);

    item.scoreAdded = true;
    item.scoreValue = Number(points);
    item.status = "Đã cộng điểm: " + points;

    saveBibleChallengeHistoryDemo(history);

    loadBibleChallengeHistoryDemo();
    loadBibleChallengeProgressDemo();
    loadBibleChallengeSummaryDemo();
    loadAdminScoreSummaryDemo();
    loadAdminScoreHistoryDemo();

    alert("Đã cộng " + points + " điểm cho " + item.fullName + ".");
}

async function loadBibleChallengeProgressDemo() {
    const progressBar =
        document.getElementById("bcProgressBar");

    const progressText =
        document.getElementById("bcProgressText");

    const groupStatsBody =
        document.getElementById("bcGroupStatsBody");

    if (
        !progressBar ||
        !progressText ||
        !groupStatsBody
    ) {
        return;
    }

    try {
        const [currentData, historyData] =
            await Promise.all([
                getBibleChallengeCurrentApi(),
                getBibleChallengeHistoryApi()
            ]);

        const session = currentData.session;
        const progress = currentData.progress || {};

        const checkedInCount =
            Number(progress.checkedInCount || 0);

        const completedCount =
            Number(progress.completedCount || 0);

        const percent =
            Number(progress.completedPercent || 0);

        progressBar.style.width =
            Math.min(Math.max(percent, 0), 100) + "%";

        progressBar.innerText =
            Math.min(Math.max(percent, 0), 100) + "%";

        if (!session) {
            progressText.innerText =
                "Chưa có buổi học đang mở.";
        } else {
            progressText.innerText =
                `Đã hoàn thành ${completedCount} / ` +
                `${checkedInCount} học viên đủ điều kiện ` +
                `trong ${session.name}.`;
        }

        const history =
            Array.isArray(historyData.history)
                ? historyData.history
                : [];

        const groupStats = new Map();

        history.forEach(item => {
            const groupId =
                Number(item.group?.id || 0);

            const groupName =
                item.group?.name || "Không xác định";

            if (!groupStats.has(groupId)) {
                groupStats.set(groupId, {
                    groupName,
                    count: 0
                });
            }

            groupStats.get(groupId).count += 1;
        });

        const rows =
            Array.from(groupStats.values())
                .sort((a, b) =>
                    a.groupName.localeCompare(
                        b.groupName,
                        "vi"
                    )
                );

        if (rows.length === 0) {
            groupStatsBody.innerHTML = `
                <tr>
                    <td colspan="2">
                        Chưa có dữ liệu.
                    </td>
                </tr>
            `;
            return;
        }

        groupStatsBody.innerHTML = rows.map(item => `
            <tr>
                <td>
                    ${escapeBibleChallengeHtml(
                        item.groupName
                    )}
                </td>

                <td>${item.count}</td>
            </tr>
        `).join("");
    } catch (error) {
        console.error(
            "Load Bible Challenge progress error:",
            error
        );

        progressBar.style.width = "0%";
        progressBar.innerText = "0%";

        progressText.innerText =
            error.message;

        groupStatsBody.innerHTML = `
            <tr>
                <td colspan="2">
                    Không thể tải thống kê.
                </td>
            </tr>
        `;
    }
}