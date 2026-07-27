const API_BASE_URL =
    "https://equation-photograph-shannon-fda.trycloudflare.com";

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

    const checkinButton =
        document.getElementById(
            "attendanceCheckinButton"
        );

    if (checkinButton) {
        checkinButton.disabled = true;
    }

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

        const activeAttendanceWindow =
            session.activeAttendanceWindow || null;

        if (activeAttendanceWindow) {
            const activeWindowLabel =
                getAttendanceWindowLabel(
                    activeAttendanceWindow
                );

            if (activeWindow) {
                activeWindow.innerText =
                    `Khung đang mở: ${activeWindowLabel}` +
                    " · Có thể điểm danh";
            }

            if (checkinButton) {
                checkinButton.disabled = false;
                checkinButton.title = "";
            }
        } else {
            if (activeWindow) {
                activeWindow.innerText =
                    "Hiện chưa mở khung điểm danh";
            }

            if (checkinButton) {
                checkinButton.disabled = true;
                checkinButton.title =
                    "Hiện chưa mở khung điểm danh";
            }
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
                    deviceId: getDeviceIdDemo(),
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


function getAttendanceWindowLabel(windowType) {
    const windowLabels = {
        MORNING: "Đầu giờ",
        BREAK: "Giờ ra chơi",
        END: "Cuối giờ",
        DEVOTION: "Tĩnh nguyện"
    };

    if (!windowType) {
        return "—";
    }

    const normalizedWindowType =
        String(windowType).trim().toUpperCase();

    return (
        windowLabels[normalizedWindowType] ||
        normalizedWindowType
    );
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

async function createSession() {
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

        await loadAdminSessions();
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
        getSessions();

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

        const sessionStartDate =
            parseSqlLocalDateTime(
                selectedSession.scheduledStartAt
            );

        if (!sessionStartDate) {
            message.style.color = "red";
            message.innerText =
                "Ngày của buổi học không hợp lệ.";

            return;
        }

        const selectedSessionDate = [
            sessionStartDate.getFullYear(),
            String(
                sessionStartDate.getMonth() + 1
            ).padStart(2, "0"),
            String(
                sessionStartDate.getDate()
            ).padStart(2, "0")
        ].join("-");
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
            date: selectedSessionDate,
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

    date: selectedSessionDate,

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
            const windowLabel =
                getAttendanceWindowLabel(
                    record.windowType
                );


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
                        <strong>Khung điểm danh:</strong>
                        ${windowLabel}
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
    loadEncouragementListFromApi();
    loadDashboardEncouragementCount();
    loadAdminEncouragementStats();
    loadAdminEncouragementReviewDemo();
    loadTodayEncouragementPreview();
    loadStudyMaterialsDemo();
    loadAdminStudyMaterialsDemo();
    loadAdminMembersTableDemo();
    loadRecipientsFromApi();
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
    loadAdminSessions();
    loadAdminSchedulesDemo();
    loadStudentSchedulesDemo();
    loadScheduleTimelineDemo();
    loadScheduleSessionOptionsDemo();
    loadQuestionSessionOptions();
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


async function loadQuestionSessionOptions() {

    const sessionSelect =
        document.getElementById("questionSession");

    if (!sessionSelect) {
        return;
    }

    const token =
        localStorage.getItem("accessToken");

    if (!token) {
        return;
    }

    try {

        sessionSelect.innerHTML =
            '<option>Đang tải...</option>';

        const response =
            await fetch(
                `${API_BASE_URL}/api/sessions/options`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error();
        }

        sessionSelect.innerHTML = "";

        result.data.sessions.forEach(session => {

            const option =
                document.createElement("option");

            option.value = session.id;

            option.textContent =
                session.name;

            sessionSelect.appendChild(option);

        });

    } catch (error) {

        sessionSelect.innerHTML =
            '<option>Không tải được danh sách buổi học</option>';

        console.error(error);

    }

}


function getStoredQuestionsDemo() {
    return JSON.parse(localStorage.getItem("sessionQuestionsDemo")) || [];
}

function saveStoredQuestionsDemo(questions) {
    localStorage.setItem("sessionQuestionsDemo", JSON.stringify(questions));
}

async function submitQuestionDemo() {
    const sessionSelect =
        document.getElementById("questionSession");

    const questionInput =
        document.getElementById("questionText");

    const message =
        document.getElementById("questionMessage");

    const selectedQuestionType =
        document.querySelector(
            'input[name="questionType"]:checked'
        );

    const token =
        localStorage.getItem("accessToken");

    const sessionId =
        Number(sessionSelect?.value);

    const questionText =
        questionInput?.value.trim();

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    if (
        !Number.isInteger(sessionId) ||
        sessionId <= 0
    ) {
        message.style.color = "red";
        message.innerText =
            "Vui lòng chọn buổi học hợp lệ.";
        return;
    }

    if (!selectedQuestionType) {
        message.style.color = "red";
        message.innerText =
            "Vui lòng chọn loại câu hỏi.";
        return;
    }

    if (!questionText) {
        message.style.color = "red";
        message.innerText =
            "Vui lòng nhập câu hỏi hoặc ghi chú.";
        return;
    }

    const visibility =
        selectedQuestionType.value === "private"
            ? "PRIVATE"
            : "PUBLIC";

    try {
        message.style.color = "#555";
        message.innerText = "Đang gửi câu hỏi...";

        const response = await fetch(
            `${API_BASE_URL}/api/questions`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    sessionId,
                    visibility,
                    questionText,
                }),
            }
        );

        const result = await response.json();

        if (response.status === 401) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("currentUser");

            window.location.href = "index.html";
            return;
        }

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                result?.error?.message ||
                "Không thể gửi câu hỏi."
            );
        }

        message.style.color = "green";
        message.innerText =
            "Đã gửi câu hỏi thành công.";

        questionInput.value = "";

        await loadMyQuestionsDemo();

    } catch (error) {
        console.error(
            "Submit question error:",
            error
        );

        message.style.color = "red";
        message.innerText =
            error.message ||
            "Không thể gửi câu hỏi. Vui lòng thử lại.";
    }
}

async function loadMyQuestionsDemo() {
    const list =
        document.getElementById("myQuestionList");

    if (!list) {
        return;
    }

    const token =
        localStorage.getItem("accessToken");

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    try {
        list.innerHTML =
            `<p class="empty-note">Đang tải câu hỏi...</p>`;

        const response = await fetch(
            `${API_BASE_URL}/api/questions/my`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const result = await response.json();

        if (response.status === 401) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("currentUser");

            window.location.href = "index.html";
            return;
        }

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                result?.error?.message ||
                "Không thể tải danh sách câu hỏi."
            );
        }

        const questions =
            Array.isArray(result.questions)
                ? result.questions
                : [];

        if (questions.length === 0) {
            list.innerHTML =
                `<p class="empty-note">Bạn chưa gửi câu hỏi nào.</p>`;
            return;
        }

        list.innerHTML = questions.map(q => {
            const sessionName =
                q.session?.name ||
                `Buổi ${q.session?.number || ""}`;

            const typeLabel =
                q.visibility === "PRIVATE"
                    ? "🔒 Riêng tư"
                    : "🌍 Công khai";

            const statusLabel =
                q.status === "ANSWERED"
                    ? "Đã trả lời"
                    : "Đang chờ phản hồi";

            const createdAt =
                q.createdAt
                    ? new Date(q.createdAt)
                        .toLocaleString("vi-VN")
                    : "Chưa có thông tin";

            const answeredAt =
                q.respondedAt
                    ? new Date(q.respondedAt)
                        .toLocaleString("vi-VN")
                    : "Chưa có thông tin";

            return `
                <div class="question-card">
                    <h3>${sessionName}</h3>

                    <p>
                        <strong>Loại:</strong>
                        ${typeLabel}
                    </p>

                    <p>${q.questionText}</p>

                    <p class="question-meta">
                        Trạng thái:
                        ${statusLabel}
                        ·
                        ${createdAt}
                    </p>

                    ${
                        q.adminResponse
                            ? `
                                <p>
                                    <strong>Phản hồi từ BTC:</strong>
                                    ${q.adminResponse}
                                </p>

                                <p class="question-meta">
                                    Thời gian phản hồi:
                                    ${answeredAt}
                                </p>
                            `
                            : ""
                    }
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error(
            "Load my questions error:",
            error
        );

        list.innerHTML =
            `<p class="empty-note">
                Không thể tải danh sách câu hỏi.
            </p>`;
    }
}

async function loadAdminQuestionsDemo() {
    const list =
        document.getElementById("adminQuestionList");

    if (!list) {
        return;
    }

    const token =
        localStorage.getItem("accessToken");

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    try {
        list.innerHTML =
            `<p class="empty-note">Đang tải câu hỏi...</p>`;

        const response = await fetch(
            `${API_BASE_URL}/api/admin/questions`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const result = await response.json();

        if (response.status === 401) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("currentUser");

            window.location.href = "index.html";
            return;
        }

        if (response.status === 403) {
            list.innerHTML =
                `<p class="empty-note">
                    Bạn không có quyền xem danh sách câu hỏi.
                </p>`;
            return;
        }

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                result?.error?.message ||
                "Không thể tải danh sách câu hỏi."
            );
        }

        const questions =
            Array.isArray(result.questions)
                ? result.questions
                : [];

        if (questions.length === 0) {
            list.innerHTML =
                `<p class="empty-note">
                    Chưa có câu hỏi nào.
                </p>`;
            return;
        }

        list.innerHTML = questions.map(q => {
            const sessionName =
                q.session?.name ||
                `Buổi ${q.session?.number || ""}`;

            const memberName =
                q.member?.fullName ||
                "Không rõ học viên";

            const username =
                q.member?.username ||
                "Không rõ tài khoản";

            const groupName =
                q.group?.name ||
                "Chưa có nhóm";

            const typeLabel =
                q.visibility === "PRIVATE"
                    ? "🔒 Riêng tư"
                    : "🌍 Công khai";

            const statusLabel =
                q.status === "ANSWERED"
                    ? "Đã trả lời"
                    : "Đang chờ phản hồi";

            const createdAt =
                q.createdAt
                    ? new Date(q.createdAt)
                        .toLocaleString("vi-VN")
                    : "Chưa có thông tin";

            const answeredAt =
                q.respondedAt
                    ? new Date(q.respondedAt)
                        .toLocaleString("vi-VN")
                    : "Chưa có thông tin";

            return `
                <div class="question-card">
                    <h3>${sessionName}</h3>

                    <p>
                        <strong>${memberName}</strong>
                        (${username})
                        · Nhóm ${groupName}
                    </p>

                    <p>
                        <strong>Loại:</strong>
                        ${typeLabel}
                    </p>

                    <p>${q.questionText}</p>

                    <p class="question-meta">
                        Trạng thái:
                        ${statusLabel}
                        ·
                        ${createdAt}
                    </p>

                    ${
                        q.adminResponse
                            ? `
                                <p>
                                    <strong>Phản hồi từ BTC:</strong>
                                    ${q.adminResponse}
                                </p>

                                <p class="question-meta">
                                    Thời gian phản hồi:
                                    ${answeredAt}
                                </p>
                            `
                            : `
                                <textarea
                                    class="form-input question-reply-box"
                                    id="reply_${q.id}"
                                    placeholder="Nhập phản hồi từ BTC / Diễn giả..."
                                ></textarea>

                                <button
                                    class="profile-btn"
                                    onclick="replyQuestionDemo(${q.id})"
                                >
                                    Gửi phản hồi
                                </button>
                            `
                    }
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error(
            "Load admin questions error:",
            error
        );

        list.innerHTML =
            `<p class="empty-note">
                Không thể tải danh sách câu hỏi.
            </p>`;
    }
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
async function replyQuestionDemo(questionId) {
    const replyInput =
        document.getElementById(`reply_${questionId}`);

    if (!replyInput) {
        return;
    }

    const replyText =
        replyInput.value.trim();

    if (!replyText) {
        alert("Vui lòng nhập nội dung phản hồi.");
        return;
    }

    const token =
        localStorage.getItem("accessToken");

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    const originalButton =
        replyInput.nextElementSibling;

    try {
        if (originalButton) {
            originalButton.disabled = true;
            originalButton.innerText = "Đang gửi...";
        }

        const response = await fetch(
            `${API_BASE_URL}/api/admin/questions/${questionId}/reply`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    adminResponse: replyText,
                }),
            }
        );

        const result = await response.json();

        if (response.status === 401) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("currentUser");

            window.location.href = "index.html";
            return;
        }

        if (response.status === 403) {
            alert("Bạn không có quyền phản hồi câu hỏi.");
            return;
        }

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                result?.error?.message ||
                "Không thể gửi phản hồi."
            );
        }

        await loadAdminQuestionsDemo();

        alert("Đã gửi phản hồi thành công.");

    } catch (error) {
        console.error(
            "Reply question error:",
            error
        );

        alert(
            error.message ||
            "Không thể gửi phản hồi. Vui lòng thử lại."
        );

        if (originalButton) {
            originalButton.disabled = false;
            originalButton.innerText = "Gửi phản hồi";
        }
    }
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

async function sendEncouragementFromApi() {
    const currentUser =
        JSON.parse(
            localStorage.getItem("currentUser")
        );

    const token =
        localStorage.getItem("accessToken");

    if (!currentUser || !token) {
        window.location.href = "index.html";
        return;
    }

    const receiverUsername =
        getProfileUsernameFromUrl();

    const encourageText =
        document
            .getElementById("encourageText")
            .value
            .trim();

    const anonymous =
        document
            .getElementById("anonymousEncourage")
            .checked;

    const message =
        document.getElementById(
            "encourageMessage"
        );

    if (currentUser.role === "admin") {
        message.style.color = "red";
        message.innerText =
            "Admin không gửi lời khích lệ trong chế độ học viên.";
        return;
    }

    if (!receiverUsername) {
        message.style.color = "red";
        message.innerText =
            "Không tìm thấy người nhận.";
        return;
    }

    if (!encourageText) {
        message.style.color = "red";
        message.innerText =
            "Vui lòng nhập lời khích lệ.";
        return;
    }

    message.style.color = "";
    message.innerText =
        "Đang gửi lời khích lệ...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/encouragements`,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json",
                    Authorization:
                        `Bearer ${token}`
                },
                body: JSON.stringify({
                    recipientUsername:
                        receiverUsername,
                    message:
                        encourageText,
                    isAnonymous:
                        anonymous
                })
            }
        );

        const result =
            await response.json();

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            localStorage.removeItem(
                "accessToken"
            );
            localStorage.removeItem(
                "currentUser"
            );

            window.location.href =
                "index.html";
            return;
        }

        if (
            !response.ok ||
            result.success !== true
        ) {
            const errorMessages = {
                CANNOT_SEND_TO_SELF:
                    "Bạn không thể tự gửi lời khích lệ cho chính mình.",

                DAILY_ENCOURAGEMENT_LIMIT_REACHED:
                    "Bạn đã gửi lời khích lệ cho thành viên này hôm nay. Bạn có thể gửi lại vào ngày mai nhé.",

                RECIPIENT_NOT_FOUND:
                    "Không tìm thấy người nhận.",

                MESSAGE_REQUIRED:
                    "Vui lòng nhập lời khích lệ.",

                MESSAGE_TOO_LONG:
                    "Lời khích lệ vượt quá độ dài cho phép."
            };

            throw new Error(
                errorMessages[result.code] ||
                result.message ||
                "Không thể gửi lời khích lệ."
            );
        }

        document.getElementById(
            "encourageText"
        ).value = "";

        document.getElementById(
            "anonymousEncourage"
        ).checked = false;

        message.style.color = "green";
        message.innerText =
            "💌 Cảm ơn bạn đã gửi lời khích lệ đến thành viên này. Chúa ở cùng bạn luôn!";
    } catch (error) {
        console.error(
            "Send encouragement error:",
            error
        );

        message.style.color = "red";
        message.innerText =
            error.message ||
            "Không thể gửi lời khích lệ. Vui lòng thử lại.";
    }
}

async function loadEncouragementListFromApi() {
    const list =
        document.getElementById(
            "encouragementList"
        );

    if (!list) {
        return;
    }

    const currentUser =
        JSON.parse(
            localStorage.getItem("currentUser")
        );

    const token =
        localStorage.getItem("accessToken");

    if (!currentUser || !token) {
        window.location.href = "index.html";
        return;
    }

    const profileUsername =
        getProfileUsernameFromUrl();

    const isOwner =
        profileUsername &&
        currentUser.username &&
        currentUser.username.toLowerCase() ===
            profileUsername.toLowerCase();

    if (!isOwner) {
        list.innerHTML = `
            <p class="empty-note">
                Đây là hộp thư cá nhân của thành viên này.
                Bạn có thể gửi lời khích lệ, nhưng không thể xem nội dung họ đã nhận.
            </p>
        `;
        return;
    }

    list.innerHTML = `
        <p class="empty-note">
            Đang tải hộp thư...
        </p>
    `;

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/encouragements/my`,
            {
                method: "GET",
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const result =
            await response.json();

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            localStorage.removeItem(
                "accessToken"
            );

            localStorage.removeItem(
                "currentUser"
            );

            window.location.href =
                "index.html";

            return;
        }

        if (
            !response.ok ||
            result.success !== true
        ) {
            throw new Error(
                result.message ||
                "Không thể tải hộp thư."
            );
        }

        const messages =
            Array.isArray(result.messages)
                ? result.messages
                : [];

        if (messages.length === 0) {
            list.innerHTML = `
                <p class="empty-note">
                    Chưa có lời khích lệ nào.
                </p>
            `;
            return;
        }

        const sortedMessages =
            [...messages].sort((a, b) => {
                if (
                    Boolean(a.isPinned) !==
                    Boolean(b.isPinned)
                ) {
                    return a.isPinned ? -1 : 1;
                }

                return (
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
                );
            });

        const escapeHtml = (value) => {
            return String(value ?? "")
                .replaceAll("&", "&amp;")
                .replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")
                .replaceAll('"', "&quot;")
                .replaceAll("'", "&#039;");
        };

        list.innerHTML =
            sortedMessages.map(item => {
                const senderName =
                    item.isAnonymous ||
                    !item.sender
                        ? "Ẩn danh"
                        : item.sender.fullName;

                const avatarText =
                    item.isAnonymous ||
                    !item.sender
                        ? "🕵️‍♂️"
                        : String(
                            item.sender.fullName ||
                            "?"
                        )
                            .charAt(0)
                            .toUpperCase();

                const createdDate =
                    item.createdAt
                        ? new Date(
                            item.createdAt
                        ).toLocaleString(
                            "vi-VN"
                        )
                        : "";

                return `
                    <div class="encouragement-card encouragement-card-with-avatar ${
                        item.isPinned
                            ? "pinned-encouragement-card"
                            : ""
                    }">
                        <div class="encouragement-avatar">
                            ${escapeHtml(avatarText)}
                        </div>

                        <div class="encouragement-content">
                            <p>
                                ${
                                    item.isPinned
                                        ? "📌 "
                                        : "🌟 "
                                }${escapeHtml(item.message)}
                            </p>

                            <p class="encouragement-author">
                                — ${escapeHtml(senderName)}<br>
                                ${escapeHtml(createdDate)}
                            </p>

                            <button
                                class="pin-encouragement-btn"
                                onclick="togglePinEncouragementFromApi(${Number(item.id)})"
                            >
                                ${
                                    item.isPinned
                                        ? "Bỏ ghim"
                                        : "📌 Ghim"
                                }
                            </button>
                        </div>
                    </div>
                `;
            }).join("");
    } catch (error) {
        console.error(
            "Load encouragement inbox error:",
            error
        );

        list.innerHTML = `
            <p class="empty-note" style="color: red;">
                Không thể tải hộp thư.
                Vui lòng thử lại.
            </p>
        `;
    }
}

async function loadDashboardEncouragementCount() {
    const countElement =
        document.getElementById(
            "encouragementReceivedCount"
        );

    const statusText =
        document.getElementById(
            "encouragementStatusText"
        );

    if (!countElement || !statusText) {
        return;
    }

    const token =
        localStorage.getItem("accessToken");

    if (!token) {
        window.location.href =
            "index.html";

        return;
    }

    countElement.innerText = "...";
    statusText.innerText =
        "Đang tải lời khích lệ...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/encouragements/my/summary`,
            {
                method: "GET",
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const result =
            await response.json();

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            localStorage.removeItem(
                "accessToken"
            );

            localStorage.removeItem(
                "currentUser"
            );

            window.location.href =
                "index.html";

            return;
        }

        if (
            !response.ok ||
            result.success !== true
        ) {
            throw new Error(
                result.message ||
                "Không thể tải tổng hợp lời khích lệ."
            );
        }

        const totalReceived =
            Number(
                result.summary?.totalReceived
            ) || 0;

        const unreadCount =
            Number(
                result.summary?.unreadCount
            ) || 0;

        countElement.innerText =
            totalReceived;

        if (unreadCount > 0) {
            statusText.innerText =
                `Bạn có ${unreadCount} lời khích lệ mới ❤️`;
        } else {
            statusText.innerText =
                "Lời khích lệ đã nhận";
        }
    } catch (error) {
        console.error(
            "Load dashboard encouragement summary error:",
            error
        );

        countElement.innerText = "—";

        statusText.innerText =
            "Không thể tải lời khích lệ.";
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





//tổng hợp khích lệ của admin
// Tổng hợp lời khích lệ của Admin từ API
async function loadAdminEncouragementStats() {
    const totalElement =
        document.getElementById(
            "totalEncouragements"
        );

    const todayElement =
        document.getElementById(
            "todayEncouragements"
        );

    const anonymousElement =
        document.getElementById(
            "anonymousEncouragements"
        );

    const topReceiversList =
        document.getElementById(
            "topReceiversList"
        );

    const topSendersList =
        document.getElementById(
            "topSendersList"
        );

    if (
        !totalElement ||
        !todayElement ||
        !anonymousElement ||
        !topReceiversList ||
        !topSendersList
    ) {
        return;
    }

    const token =
        localStorage.getItem(
            "accessToken"
        );

    if (!token) {
        window.location.href =
            "index.html";

        return;
    }

    totalElement.innerText = "...";
    todayElement.innerText = "...";
    anonymousElement.innerText = "...";

    topReceiversList.innerHTML = `
        <p class="empty-note">
            Đang tải dữ liệu...
        </p>
    `;

    topSendersList.innerHTML = `
        <p class="empty-note">
            Đang tải dữ liệu...
        </p>
    `;

    function escapeAdminEncouragementText(
        value
    ) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getRankingMemberName(item) {
        return (
            item.fullName ||
            item.member?.fullName ||
            item.name ||
            "Không xác định"
        );
    }

    function getRankingCount(item) {
        return Number(
            item.count ??
            item.encouragementCount ??
            item.sentCount ??
            item.receivedCount ??
            item.total ??
            0
        ) || 0;
    }

    function renderRankingList({
        items,
        listElement,
        icon,
        description
    }) {
        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {
            listElement.innerHTML = `
                <p class="empty-note">
                    Chưa có dữ liệu khích lệ.
                </p>
            `;

            return;
        }

        listElement.innerHTML =
            items.map((item, index) => {
                const fullName =
                    escapeAdminEncouragementText(
                        getRankingMemberName(item)
                    );

                const count =
                    getRankingCount(item);

                return `
                    <div class="question-card">
                        <h3>
                            ${index + 1}. ${fullName}
                        </h3>

                        <p>
                            ${icon} ${count}
                            lời khích lệ ${description}
                        </p>
                    </div>
                `;
            }).join("");
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/encouragements/stats?limit=5`,
            {
                method: "GET",
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const result =
            await response.json();

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            localStorage.removeItem(
                "accessToken"
            );

            localStorage.removeItem(
                "currentUser"
            );

            window.location.href =
                "index.html";

            return;
        }

        if (
            !response.ok ||
            result.success !== true
        ) {
            throw new Error(
                result.message ||
                result.error?.message ||
                "Không thể tải thống kê lời khích lệ."
            );
        }

        const summary =
            result.summary || {};

        totalElement.innerText =
            Number(summary.total) || 0;

        todayElement.innerText =
            Number(summary.today) || 0;

        anonymousElement.innerText =
            Number(summary.anonymous) || 0;

        renderRankingList({
            items:
                result.topRecipients,

            listElement:
                topReceiversList,

            icon: "💌",

            description:
                "đã nhận"
        });

        renderRankingList({
            items:
                result.topSenders,

            listElement:
                topSendersList,

            icon: "👏",

            description:
                "đã gửi"
        });
    } catch (error) {
        console.error(
            "Load admin encouragement stats error:",
            error
        );

        totalElement.innerText = "—";
        todayElement.innerText = "—";
        anonymousElement.innerText = "—";

        const errorMessage = `
            <p class="empty-note">
                Không thể tải dữ liệu khích lệ.
            </p>
        `;

        topReceiversList.innerHTML =
            errorMessage;

        topSendersList.innerHTML =
            errorMessage;
    }
}//hết//hết


//hàm ghim/bỏ ghim lời khích lệ
async function togglePinEncouragementFromApi(
    encouragementId
) {
    const token =
        localStorage.getItem("accessToken");

    const currentUser =
        JSON.parse(
            localStorage.getItem("currentUser")
        );

    if (!token || !currentUser) {
        window.location.href = "index.html";
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/encouragements/${encouragementId}/pin`,
            {
                method: "PUT",
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const result =
            await response.json();

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            localStorage.removeItem(
                "accessToken"
            );

            localStorage.removeItem(
                "currentUser"
            );

            window.location.href =
                "index.html";

            return;
        }

        if (
            !response.ok ||
            result.success !== true
        ) {
            const errorMessages = {
                INVALID_ENCOURAGEMENT_ID:
                    "Mã lời khích lệ không hợp lệ.",

                ENCOURAGEMENT_NOT_FOUND:
                    "Không tìm thấy lời khích lệ hoặc bạn không có quyền ghim."
            };

            throw new Error(
                errorMessages[result.code] ||
                result.message ||
                "Không thể thay đổi trạng thái ghim."
            );
        }

        await loadEncouragementListFromApi();
    } catch (error) {
        console.error(
            "Toggle encouragement pin error:",
            error
        );

        alert(
            error.message ||
            "Không thể thay đổi trạng thái ghim. Vui lòng thử lại."
        );
    }
}//hết


async function loadTodayEncouragementPreview() {
    const previewElement =
        document.getElementById(
            "todayEncouragementPreview"
        );

    if (!previewElement) {
        return;
    }

    const token =
        localStorage.getItem("accessToken");

    if (!token) {
        window.location.href =
            "index.html";

        return;
    }

    previewElement.innerText =
        "Đang tải lời khích lệ...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/encouragements/my?markAsRead=false`,
            {
                method: "GET",
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const result =
            await response.json();

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            localStorage.removeItem(
                "accessToken"
            );

            localStorage.removeItem(
                "currentUser"
            );

            window.location.href =
                "index.html";

            return;
        }

        if (
            !response.ok ||
            result.success !== true
        ) {
            throw new Error(
                result.message ||
                "Không thể tải lời khích lệ hôm nay."
            );
        }

        const totalReceived =
            Number(
                result.summary?.totalReceived
            ) || 0;

        const selectedMessage =
            result.todayPreview;

        if (!selectedMessage) {
            previewElement.innerText =
                totalReceived > 0
                    ? "Hôm nay bạn chưa nhận được lời khích lệ mới. Hãy tiếp tục lan tỏa yêu thương nhé 💚"
                    : "Bạn chưa có lời khích lệ nào. Hãy tiếp tục lan tỏa yêu thương nhé 💚";

            return;
        }

        const senderName =
            selectedMessage.isAnonymous
                ? "Ẩn danh"
                : selectedMessage.sender?.fullName ||
                  "Một người bạn";

        previewElement.innerHTML = `
            <p class="today-encouragement-label"></p>
            <p class="today-encouragement-text"></p>
            <p class="today-encouragement-author"></p>
        `;

        previewElement
            .querySelector(
                ".today-encouragement-label"
            )
            .textContent =
                "Lời khích lệ hôm nay";

        previewElement
            .querySelector(
                ".today-encouragement-text"
            )
            .textContent =
                `“${selectedMessage.message}”`;

        previewElement
            .querySelector(
                ".today-encouragement-author"
            )
            .textContent =
                `— ${senderName}`;
    } catch (error) {
        console.error(
            "Load today encouragement preview error:",
            error
        );

        previewElement.innerText =
            "Không thể tải lời khích lệ hôm nay.";
    }
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
function parseStudentBirthDateForApiDemo(value) {
    if (typeof value === "number") {
        const excelDate = XLSX.SSF.parse_date_code(value);

        if (!excelDate) {
            return "";
        }

        return [
            String(excelDate.y).padStart(4, "0"),
            String(excelDate.m).padStart(2, "0"),
            String(excelDate.d).padStart(2, "0")
        ].join("-");
    }

    const text = String(value || "").trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return text;
    }

    const match = text.match(
        /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/
    );

    if (!match) {
        return "";
    }

    return [
        match[3],
        match[2].padStart(2, "0"),
        match[1].padStart(2, "0")
    ].join("-");
}

async function importStudentsExcelDemo() {
    const fileInput =
        document.getElementById("studentExcelFile");

    const message =
        document.getElementById("studentImportMessage");

    if (
        !fileInput ||
        !fileInput.files ||
        fileInput.files.length === 0
    ) {
        message.style.color = "red";
        message.innerText =
            "Vui lòng chọn file Excel để import.";
        return;
    }

    const token = localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return;
    }

    message.style.color = "#2563eb";
    message.innerText =
        "Đang đọc file và import học viên...";

    try {
        const file = fileInput.files[0];
        const data = await file.arrayBuffer();

        const workbook = XLSX.read(data, {
            type: "array"
        });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rows = XLSX.utils.sheet_to_json(worksheet, {
            defval: ""
        });

        const nonEmptyRows = rows.filter(row =>
            Object.values(row).some(value =>
                String(value ?? "").trim() !== ""
            )
        );

        if (nonEmptyRows.length === 0) {
            throw new Error("File Excel không có dữ liệu.");
        }

        const students = nonEmptyRows.map((row, index) => {
            const rowNumber = index + 2;

            const student = {
                rowNumber,
                fullName: String(
                    row["Họ và tên"] || ""
                ).trim(),
                gender: String(
                    row["Giới tính"] || ""
                ).trim(),
                birthDate:
                    parseStudentBirthDateForApiDemo(
                        row["Ngày sinh"] ||
                        row["Ngày Sinh"] ||
                        ""
                    ),
                phone: String(
                    row["Điện thoại"] || ""
                ).trim(),
                groupName: String(
                    row["Nhóm nhỏ"] || ""
                ).trim()
            };

            if (
                !student.fullName ||
                !student.gender ||
                !student.birthDate ||
                !student.phone ||
                !student.groupName
            ) {
                throw new Error(
                    `Dòng ${rowNumber} thiếu hoặc sai dữ liệu bắt buộc.`
                );
            }

            return student;
        });

        const response = await fetch(
            `${API_BASE_URL}/api/admin/members/import`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    students
                })
            }
        );

        let result = {};

        try {
            result = await response.json();
        } catch (parseError) {
            result = {};
        }

        if (response.status === 401) {
            logoutDemo();
            return;
        }

        if (!response.ok || !result.success) {
            throw new Error(
                result?.error?.message ||
                "Không thể import danh sách học viên."
            );
        }

        message.style.color = "green";
        message.innerText =
            `Đã import thành công ${result.data.total} học viên. ` +
            `Mật khẩu mặc định: ${result.data.defaultPassword}.`;

        fileInput.value = "";

        await loadAdminMembersTableDemo();
    } catch (error) {
        console.error("Import students error:", error);

        message.style.color = "red";
        message.innerText =
            error.message ||
            "Không thể import danh sách học viên.";
    }
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
            const gender = member.gender || "—";
            const birthDate = member.birthDate
                ? String(member.birthDate)
                    .slice(0, 10)
                    .split("-")
                    .reverse()
                    .join("/")
                : "—";
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
                    <td>${gender}</td>
                    <td>${birthDate}</td>
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

async function loadRecipientsFromApi() {
    const list = document.getElementById(
        "studentDirectoryList"
    );

    if (!list) {
        return;
    }

    const token =
        localStorage.getItem("accessToken");

    if (!token) {
        return;
    }

    list.innerHTML = `
        <p class="empty-note">
            Đang tải danh sách học viên...
        </p>
    `;

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/encouragements/recipients`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("currentUser");
            window.location.href = "index.html";
            return;
        }

        if (
            !response.ok ||
            result.success !== true
        ) {
            throw new Error(
                result.message ||
                "Không thể tải danh sách học viên."
            );
        }

        const students = Array.isArray(
            result.recipients
        )
            ? result.recipients
            : [];

        if (students.length === 0) {
            list.innerHTML = `
                <p class="empty-note">
                    Hiện chưa có học viên nào để gửi lời khích lệ.
                </p>
            `;
            return;
        }

        list.innerHTML = students.map(student => {
                        const groupName =
                            student.group?.name ||
                            "Chưa có nhóm";

                        const receivedCount =
                            Number(
                                student.receivedCount
                            ) || 0;

                        return `
                <div
                    class="student-card"
                    data-name="${student.fullName.toLowerCase()} ${student.username.toLowerCase()} ${groupName.toLowerCase()}"
                >
                    <div class="student-avatar">
                        ${getStudentAvatarInitialDemo(student)}
                    </div>

                    <h3>${student.fullName}</h3>

                    <p>
                        ${student.username} · Nhóm ${groupName}
                    </p>

                    <p
                        class="encourage-count"
                        data-user="${student.username}"
                    >
                                 💌 ${receivedCount} lời khích lệ
                    </p>

                    <a
                        href="profile.html?user=${student.username}"
                        class="profile-btn"
                    >
                        Mở hộp thư
                    </a>
                </div>
            `;
                }).join("");
            } catch (error) {
        console.error(
            "Load encouragement recipients error:",
            error
        );

        list.innerHTML = `
            <p class="empty-note">
                Không thể tải danh sách học viên.
                Vui lòng thử lại.
            </p>
        `;
    }
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

async function setManualCheckinWindowDemo(windowKey) {
    const windowTypeMap = {
        morning: "MORNING",
        break: "BREAK",
        end: "END"
    };

    const windowType = windowTypeMap[windowKey];

    if (!windowType) {
        return;
    }

    const message = document.getElementById(
        "adminCheckinWindowMessage"
    );

    const token = localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return;
    }

    if (message) {
        message.style.color = "#6b7280";
        message.innerText =
            "Đang mở khung điểm danh...";
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/attendance/admin/current-session/window`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    windowType
                })
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
            throw new Error(
                result?.error?.message ||
                "Không thể mở khung điểm danh."
            );
        }

        saveManualCheckinWindowDemo(windowKey);

        if (message) {
            message.style.color = "green";
            message.innerText =
                "Đã mở khung điểm danh: " +
                getCheckinWindowLabelDemo(windowKey);
        }

        loadAdminCheckinWindowStatusDemo();
        loadActiveCheckinWindowDemo();
    } catch (error) {
        if (message) {
            message.style.color = "#dc2626";
            message.innerText =
                error.message ||
                "Không thể kết nối Backend.";
        }
    }
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
            `${API_BASE_URL}/api/attendance/admin/current-session/roster`,
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

                const attendanceWindowText =
                    item.attendance
                        ? getAttendanceWindowLabel(
                            item.attendance.windowType
                        )
                        : "-";

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

                        <td>${attendanceWindowText}</td>

                        <td>${checkInTimeText}</td>

                        <td>${distanceText}</td>

                        <td>
                            ${
                                item.attendance?.points !== null &&
                                item.attendance?.points !== undefined
                                    ? `+${
                                        Number(
                                            item.attendance.points
                                        )
                                    }`
                                    : "-"
                            }
                        </td>

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
            `${API_BASE_URL}/api/attendance/admin/current-session/roster`,
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

async function loadAdminDashboardExtraStatsDemo() {
    const totalScoreElement =
        document.getElementById(
            "adminDashboardTotalScore"
        );

    const newQuestionsElement =
        document.getElementById(
            "adminDashboardNewQuestions"
        );

    const todayEncouragementsElement =
        document.getElementById(
            "adminDashboardTodayEncouragements"
        );

    if (
        !totalScoreElement ||
        !newQuestionsElement ||
        !todayEncouragementsElement
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
    newQuestionsElement.innerText = "...";
    todayEncouragementsElement.innerText = "...";

    try {
        const [
            groups,
            questionsResponse,
            encouragementsResponse
        ] = await Promise.all([
            getGroupRankingApiData(),

            fetch(
                `${API_BASE_URL}/api/admin/questions`,
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            ),

            fetch(
                `${API_BASE_URL}/api/admin/encouragements/stats?limit=5`,
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            )
        ]);

        const [
            questionsResult,
            encouragementsResult
        ] = await Promise.all([
            questionsResponse.json(),
            encouragementsResponse.json()
        ]);

        if (
            questionsResponse.status === 401 ||
            encouragementsResponse.status === 401
        ) {
            logoutDemo();
            return;
        }

        if (
            questionsResponse.status === 403 ||
            encouragementsResponse.status === 403
        ) {
            window.location.href =
                "dashboard.html";

            return;
        }

        if (
            !questionsResponse.ok ||
            questionsResult.success !== true
        ) {
            throw new Error(
                questionsResult?.error?.message ||
                "Không thể tải thống kê câu hỏi."
            );
        }

        if (
            !encouragementsResponse.ok ||
            encouragementsResult.success !== true
        ) {
            throw new Error(
                encouragementsResult?.error?.message ||
                encouragementsResult?.message ||
                "Không thể tải thống kê lời khích lệ."
            );
        }

        const totalScore = (
            Array.isArray(groups)
                ? groups
                : []
        ).reduce(
            (total, item) =>
                total +
                (Number(item.totalScore) || 0),
            0
        );

        const questions =
            Array.isArray(
                questionsResult.questions
            )
                ? questionsResult.questions
                : [];

        const newQuestions =
            questions.filter(
                item =>
                    item.status !== "ANSWERED"
            ).length;

        const todayEncouragements =
            Number(
                encouragementsResult
                    .summary?.today
            ) || 0;

        totalScoreElement.innerText =
            totalScore;

        newQuestionsElement.innerText =
            newQuestions;

        todayEncouragementsElement.innerText =
            todayEncouragements;
    } catch (error) {
        console.error(
            "Load admin dashboard extra stats error:",
            error
        );

        totalScoreElement.innerText = "—";
        newQuestionsElement.innerText = "—";
        todayEncouragementsElement.innerText = "—";
    }
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


let adminSessionsApiRequest = null;

async function fetchAdminSessions() {
    if (adminSessionsApiRequest) {
        return adminSessionsApiRequest;
    }

    const token = localStorage.getItem("accessToken");

    if (!token) {
        throw new Error("AUTH_REQUIRED");
    }

    adminSessionsApiRequest = (async () => {
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
                throw new Error("AUTH_REQUIRED");
            }

            if (response.status === 403) {
                throw new Error("FORBIDDEN");
            }

            if (!response.ok || !result.success) {
                throw new Error(
                    result?.error?.message ||
                    "Không thể tải danh sách buổi học."
                );
            }

            const sessions =
                result.data?.sessions || [];

            adminSessionsApiCache = sessions;

            return sessions;
        } catch (error) {
            adminSessionsApiCache = [];
            throw error;
        } finally {
            adminSessionsApiRequest = null;
        }
    })();

    return adminSessionsApiRequest;
}


function getSessions() {
    return [...adminSessionsApiCache];
}

function getOpenSession() {
    return adminSessionsApiCache.find(
        session => session.status === "OPEN"
    ) || null;
}

function getCurrentSession() {
    const openSession = getOpenSession();

    if (openSession) {
        return openSession;
    }

    const orderedSessions = [...adminSessionsApiCache].sort((a, b) => {
        const dateA = parseSqlLocalDateTime(a.scheduledStartAt);
        const dateB = parseSqlLocalDateTime(b.scheduledStartAt);

        if (!dateA || !dateB) {
            return 0;
        }

        return dateA - dateB;
    });

    return orderedSessions[0] || null;
}


async function loadAdminSessions() {
    const tableBody =
        document.getElementById("adminSessionTableBody");

    if (!tableBody) {
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
        const sessions =
            await fetchAdminSessions();

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
            const deleteDisabled =
                session.status === "OPEN";

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
                            onclick="openSession(${session.id})"
                            ${openDisabled ? "disabled" : ""}
                        >
                            Mở
                        </button>

                        <button
                            class="delete-material-btn"
                            onclick="closeSession(${session.id})"
                            ${closeDisabled ? "disabled" : ""}
                        >
                            Kết thúc
                        </button>

                        <button
                            class="delete-material-btn"
                            onclick="deleteSession(${session.id})"
                            ${deleteDisabled ? "disabled" : ""}
                            title="${
                                deleteDisabled
                                    ? "Hãy kết thúc buổi học trước khi xóa"
                                    : "Xóa buổi học"
                            }"
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

        if (error.message === "AUTH_REQUIRED") {
            logoutDemo();
            return;
        }

        if (error.message === "FORBIDDEN") {
            window.location.href = "dashboard.html";
            return;
        }

        adminSessionsApiCache = [];

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    ${error.message ||
                    "Không thể kết nối đến Backend."}
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

async function openSession(sessionId) {
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

        await loadAdminSessions();
    } catch (error) {
        console.error("Open session error:", error);
        alert("Không thể kết nối đến Backend.");
    }
}

async function closeSession(sessionId) {
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

        await loadAdminSessions();
    } catch (error) {
        console.error("Close session error:", error);
        alert("Không thể kết nối đến Backend.");
    }
}

async function deleteSession(sessionId) {
    const token =
        localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return;
    }

    const confirmed = confirm(
        "Bạn có chắc muốn xóa buổi học này không?\n\n" +
        "Dữ liệu liên quan đến buổi học cũng sẽ bị xóa."
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/sessions/${sessionId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const responseText =
            await response.text();

        let result = null;

        if (responseText) {
            try {
                result = JSON.parse(responseText);
            } catch {
                result = null;
            }
        }

        if (response.status === 401) {
            logoutDemo();
            return;
        }

        if (response.status === 403) {
            window.location.href =
                "dashboard.html";
            return;
        }

        if (
            !response.ok ||
            result?.success === false
        ) {
            alert(
                result?.error?.message ||
                "Không thể xóa buổi học."
            );
            return;
        }

        alert("Đã xóa buổi học thành công.");

        await loadAdminSessions();
    } catch (error) {
        console.error(
            "Delete session error:",
            error
        );

        alert(
            "Không thể kết nối đến Backend."
        );
    }
}

function getCurrentSessionDemo() {
    return getCurrentSession();
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


async function loadScheduleSessionOptionsDemo() {
    const select =
        document.getElementById("scheduleSession");

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            Đang tải buổi học...
        </option>
    `;

    try {
        const sessions =
            await fetchAdminSessions();

        if (sessions.length === 0) {
            select.innerHTML = `
                <option value="">
                    Chưa có buổi học
                </option>
            `;

            return;
        }

        const orderedSessions =
            [...sessions].sort((a, b) => {
                const dateA =
                    parseSqlLocalDateTime(
                        a.scheduledStartAt
                    );

                const dateB =
                    parseSqlLocalDateTime(
                        b.scheduledStartAt
                    );

                if (!dateA || !dateB) {
                    return 0;
                }

                return dateA - dateB;
            });

        select.innerHTML = `
            <option value="">
                -- Chọn buổi học --
            </option>
        `;

        orderedSessions.forEach(session => {
            const startDate =
                parseSqlLocalDateTime(
                    session.scheduledStartAt
                );

            const dateText = startDate
                ? startDate.toLocaleDateString("vi-VN")
                : "Chưa có ngày";

            select.innerHTML += `
                <option value="${session.id}">
                    ${session.name}
                    (${dateText})
                </option>
            `;
        });
    } catch (error) {
        console.error(
            "Load schedule session options error:",
            error
        );

        if (error.message === "AUTH_REQUIRED") {
            logoutDemo();
            return;
        }

        if (error.message === "FORBIDDEN") {
            select.innerHTML = `
                <option value="">
                    Không có quyền truy cập
                </option>
            `;

            return;
        }

        select.innerHTML = `
            <option value="">
                ${error.message ||
                "Không thể tải buổi học"}
            </option>
        `;
    }
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
    return getOpenSession();
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

/*
=====================================================
Admin Exam list
=====================================================
*/

function escapeAdminExamHtml(value) {
    return String(value ?? "")
        .replace(
            /[&<>"']/g,
            character => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            })[character]
        );
}


function getAdminExamTypeLabel(type) {
    const labels = {
        PRE_TEST: "Pre-test",
        FINAL_TEST: "Final Test"
    };

    return labels[type] || type || "Chưa xác định";
}


function getAdminExamStatusLabel(status) {
    const labels = {
        DRAFT: "Bản nháp",
        SCHEDULED: "Đã lên lịch",
        WAITING_ROOM_OPEN:
            "Đang mở phòng chờ",
        IN_PROGRESS: "Đang diễn ra",
        SUBMITTING: "Đang thu bài",
        PAUSED: "Tạm dừng",
        COMPLETED: "Đã hoàn tất",
        CANCELLED: "Đã hủy"
    };

    return labels[status] ||
        status ||
        "Chưa xác định";
}


function getAdminExamStatusClass(status) {
    const classByStatus = {
        DRAFT: "draft",
        SCHEDULED: "scheduled",
        WAITING_ROOM_OPEN: "open",
        IN_PROGRESS: "progress",
        SUBMITTING: "progress",
        PAUSED: "paused",
        COMPLETED: "completed",
        CANCELLED: "cancelled"
    };

    return classByStatus[status] ||
        "default";
}


function formatAdminExamDate(value) {
    if (!value) {
        return "Chưa lên lịch";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Thời gian không hợp lệ";
    }

    return date.toLocaleString(
        "vi-VN",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );
}


function selectAdminExamForImport(examId) {
    const normalizedExamId =
        Number(examId);

    if (
        !Number.isInteger(
            normalizedExamId
        ) ||
        normalizedExamId <= 0
    ) {
        return;
    }

    const examIdInput =
        document.getElementById(
            "adminExamImportId"
        );

    const importMessage =
        document.getElementById(
            "adminExamImportMessage"
        );

    if (!examIdInput) {
        return;
    }

    examIdInput.value =
        String(normalizedExamId);

    if (importMessage) {
        importMessage.style.color =
            "#555";

        importMessage.innerText =
            `Đã chọn bài kiểm tra ID ${normalizedExamId} để import câu hỏi.`;
    }

    const importSection =
        examIdInput.closest("section");

    if (importSection) {
        importSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    examIdInput.focus();
}


function renderAdminExams(exams) {
    const message =
        document.getElementById(
            "adminExamsMessage"
        );

    const tableWrapper =
        document.getElementById(
            "adminExamsTableWrapper"
        );

    const tableBody =
        document.getElementById(
            "adminExamsTableBody"
        );

    if (
        !message ||
        !tableWrapper ||
        !tableBody
    ) {
        return;
    }

    const validExams =
        exams.filter(exam => {
            const examId =
                Number(exam?.id);

            return (
                Number.isInteger(examId) &&
                examId > 0
            );
        });

    if (validExams.length === 0) {
        tableBody.innerHTML = "";

        tableWrapper.classList.add(
            "hidden"
        );

        message.classList.remove(
            "hidden"
        );

        message.style.color = "#555";
        message.innerText =
            "Chưa có bài kiểm tra trong mùa đang hoạt động.";

        return;
    }

    const activeExam =
        validExams.find(exam =>
            [
                "WAITING_ROOM_OPEN",
                "IN_PROGRESS",
                "SUBMITTING"
            ].includes(
                String(
                    exam.status || ""
                ).toUpperCase()
            )
        ) || null;


    tableBody.innerHTML =
        validExams.map(exam => {
            const examId =
                Number(exam.id);

            const status =
                String(
                    exam.status || ""
                ).toUpperCase();

            return `
                <tr>
                    <td>${examId}</td>

                    <td>
                        ${escapeAdminExamHtml(
                            exam.name
                        )}
                    </td>

                    <td>
                        ${escapeAdminExamHtml(
                            getAdminExamTypeLabel(
                                exam.type
                            )
                        )}
                    </td>

                    <td>
                        <span
                            class="admin-exam-status admin-exam-status-${getAdminExamStatusClass(status)}"
                        >
                            ${escapeAdminExamHtml(
                                getAdminExamStatusLabel(
                                    status
                                )
                            )}
                        </span>
                    </td>

                    <td>
                        ${escapeAdminExamHtml(
                            formatAdminExamDate(
                                exam.scheduledStartAt
                            )
                        )}
                    </td>

                    <td>
                        ${Number(
                            exam.totalQuestions
                        ) || 0}
                    </td>

                    <td>
                        <div class="admin-exam-actions">
                            <button
                                type="button"
                                class="admin-exam-select-btn"
                                data-exam-id="${examId}"
                            >
                                Chọn để import
                            </button>

                            <button
                                type="button"
                                class="admin-exam-open-btn ${status === "WAITING_ROOM_OPEN" ? "hidden" : ""}"
                                data-exam-id="${examId}"
                                ${status === "DRAFT" &&
                                !activeExam &&
                                (Number(
                                    exam.totalQuestions
                                ) || 0) > 0
                                    ? ""
                                    : "disabled"}
                                title="${
                                    activeExam && status === "DRAFT"
                                        ? `Đang có bài ID ${Number(activeExam.id)} mở phòng chờ`
                                        : status !== "DRAFT"
                                            ? "Chỉ được mở bài đang ở trạng thái Nháp"
                                            : (Number(
                                                exam.totalQuestions
                                            ) || 0) <= 0
                                                ? "Hãy import câu hỏi trước khi mở phòng chờ"
                                                : "Mở phòng chờ cho học viên"
                                }"
                            >
                                Mở phòng chờ
                            </button>

                            <button
                                type="button"
                                class="admin-exam-close-btn ${status === "WAITING_ROOM_OPEN" ? "" : "hidden"}"
                                data-exam-id="${examId}"
                                ${status === "WAITING_ROOM_OPEN"
                                    ? ""
                                    : "disabled"}
                                title="Đóng phòng chờ và đưa bài về trạng thái Nháp"
                            >
                                Đóng phòng chờ
                            </button>

                            <button
                                type="button"
                                class="admin-exam-start-btn ${status === "WAITING_ROOM_OPEN" ? "" : "hidden"}"
                                data-exam-id="${examId}"
                                ${status === "WAITING_ROOM_OPEN"
                                    ? ""
                                    : "disabled"}
                                title="Bắt đầu bài kiểm tra cho các học viên trong phòng chờ"
                            >
                                Bắt đầu
                            </button>

                            <button
                                type="button"
                                class="admin-exam-next-btn ${status === "IN_PROGRESS" ? "" : "hidden"}"
                                data-exam-id="${examId}"
                                ${status === "IN_PROGRESS"
                                    ? ""
                                    : "disabled"}
                                title="Mở câu tiếp theo sau khi câu hiện tại hết thời gian"
                            >
                                Câu tiếp theo
                            </button>

                            <button
                                type="button"
                                class="admin-exam-finish-btn ${status === "IN_PROGRESS" ? "" : "hidden"}"
                                data-exam-id="${examId}"
                                ${status === "IN_PROGRESS"
                                    ? ""
                                    : "disabled"}
                                title="Kết thúc bài kiểm tra và thu bài của học viên"
                            >
                                Kết thúc
                            </button>

                            <button
                                type="button"
                                class="admin-exam-delete-btn"
                                data-exam-id="${examId}"
                                ${String(
                                    exam.status || ""
                                ).toUpperCase() ===
                                "DRAFT"
                                    ? ""
                                    : "disabled"}
                                title="${String(
                                    exam.status || ""
                                ).toUpperCase() ===
                                "DRAFT"
                                    ? "Xóa bài kiểm tra"
                                    : "Chỉ được xóa bài đang ở trạng thái Nháp"}"
                            >
                                Xóa
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

    tableBody
        .querySelectorAll(
            ".admin-exam-select-btn"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    selectAdminExamForImport(
                        button.dataset.examId
                    );
                }
            );
        });

    tableBody
        .querySelectorAll(
            ".admin-exam-open-btn"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const examId =
                        Number(
                            button.dataset
                                .examId
                        );

                    const exam =
                        validExams.find(
                            item =>
                                Number(
                                    item.id
                                ) === examId
                        );

                    openAdminExamWaitingRoomFromApi({
                        examId,
                        examName:
                            exam?.name || "",
                        button
                    });
                }
            );
        });


    tableBody
        .querySelectorAll(
            ".admin-exam-close-btn"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const examId =
                        Number(
                            button.dataset
                                .examId
                        );

                    const exam =
                        validExams.find(
                            item =>
                                Number(
                                    item.id
                                ) === examId
                        );

                    closeAdminExamWaitingRoomFromApi({
                        examId,
                        examName:
                            exam?.name || "",
                        button
                    });
                }
            );
        });


    tableBody
        .querySelectorAll(
            ".admin-exam-start-btn"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const examId =
                        Number(
                            button.dataset
                                .examId
                        );

                    const exam =
                        validExams.find(
                            item =>
                                Number(
                                    item.id
                                ) === examId
                        );

                    startAdminExamFromApi({
                        examId,
                        examName:
                            exam?.name || "",
                        button
                    });
                }
            );
        });


    tableBody
        .querySelectorAll(
            ".admin-exam-next-btn"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const examId =
                        Number(
                            button.dataset
                                .examId
                        );

                    const exam =
                        validExams.find(
                            item =>
                                Number(
                                    item.id
                                ) === examId
                        );

                    advanceAdminExamQuestionFromApi({
                        examId,
                        examName:
                            exam?.name || "",
                        button
                    });
                }
            );
        });


        tableBody
        .querySelectorAll(
            ".admin-exam-finish-btn"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const examId =
                        Number(
                            button.dataset
                                .examId
                        );

                    const exam =
                        validExams.find(
                            item =>
                                Number(
                                    item.id
                                ) === examId
                        );

                    finishAdminExamFromApi({
                        examId,
                        examName:
                            exam?.name || "",
                        button
                    });
                }
            );
        });


    tableBody
        .querySelectorAll(
            ".admin-exam-delete-btn"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const examId =
                        Number(
                            button.dataset
                                .examId
                        );

                    const exam =
                        validExams.find(
                            item =>
                                Number(
                                    item.id
                                ) === examId
                        );

                    deleteAdminExamFromApi({
                        examId,
                        examName:
                            exam?.name || "",
                        button
                    });
                }
            );
        });

    tableWrapper.classList.remove(
        "hidden"
    );
}



async function openAdminExamWaitingRoomFromApi({
    examId,
    examName,
    button
}) {
    const normalizedExamId =
        Number(examId);

    if (
        !Number.isInteger(normalizedExamId) ||
        normalizedExamId <= 0
    ) {
        window.alert(
            "ID bài kiểm tra không hợp lệ."
        );
        return;
    }

    const displayName =
        String(examName || "").trim() ||
        `ID ${normalizedExamId}`;

    const confirmed =
        window.confirm(
            `Mở phòng chờ cho bài kiểm tra “${displayName}”?\n\nSau khi mở, học viên sẽ nhìn thấy và có thể vào phòng chờ.`
        );

    if (!confirmed) {
        return;
    }

    const token =
        localStorage.getItem(
            "accessToken"
        );

    if (!token) {
        window.location.href =
            "index.html";
        return;
    }

    const originalButtonText =
        button?.innerText || "Mở phòng chờ";

    if (button) {
        button.disabled = true;
        button.innerText =
            "Đang mở...";
    }

    try {
        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/test/exams/${normalizedExamId}/open-waiting-room`,
                {
                    method: "PATCH",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        let result = {};

        try {
            result =
                await response.json();
        } catch {
            result = {};
        }

        if (
            !response.ok ||
            !result.success
        ) {
            const errorMessages = {
                INVALID_EXAM_ID:
                    "ID bài kiểm tra không hợp lệ.",

                EXAM_NOT_FOUND:
                    "Không tìm thấy bài kiểm tra.",

                EXAM_NOT_IN_ACTIVE_SEASON:
                    "Bài kiểm tra không thuộc mùa đang hoạt động.",

                EXAM_NOT_DRAFT:
                    "Bài kiểm tra không còn ở trạng thái Nháp.",

                EXAM_HAS_NO_QUESTIONS:
                    "Bài kiểm tra chưa có câu hỏi. Hãy import câu hỏi trước.",

                ACTIVE_SEASON_NOT_FOUND:
                    "Không tìm thấy mùa đang hoạt động.",

                UNAUTHORIZED:
                    "Phiên đăng nhập đã hết hạn.",

                FORBIDDEN:
                    "Bạn không có quyền mở phòng chờ."
            };

            throw new Error(
                errorMessages[
                    result.code || ""
                ] ||
                "Không thể mở phòng chờ."
            );
        }

        window.alert(
            `Đã mở phòng chờ cho “${displayName}”. Học viên đã có thể nhìn thấy bài kiểm tra.`
        );

        await loadAdminExamsFromApi();
    } catch (error) {
        console.error(
            "Open Admin Exam waiting room error:",
            error
        );

        if (
            error instanceof TypeError
        ) {
            window.alert(
                "Không thể kết nối Backend. Hãy kiểm tra server đang chạy ở cổng 5000."
            );
        } else {
            window.alert(
                error.message ||
                "Không thể mở phòng chờ."
            );
        }
    } finally {
        if (
            button &&
            button.isConnected
        ) {
            button.disabled = false;
            button.innerText =
                originalButtonText;
        }
    }
}

async function closeAdminExamWaitingRoomFromApi({
    examId,
    examName,
    button
}) {
    const normalizedExamId =
        Number(examId);

    if (
        !Number.isInteger(normalizedExamId) ||
        normalizedExamId <= 0
    ) {
        window.alert("ID bài kiểm tra không hợp lệ.");
        return;
    }

    const displayName =
        String(examName || "").trim() ||
        `ID ${normalizedExamId}`;

    const confirmed =
        window.confirm(
            `Đóng phòng chờ của bài kiểm tra “${displayName}”?\n\nBài sẽ quay về trạng thái Nháp và học viên tạm thời không thể vào.`
        );

    if (!confirmed) {
        return;
    }

    const token =
        localStorage.getItem("accessToken");

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    const originalButtonText =
        button?.innerText || "Đóng phòng chờ";

    if (button) {
        button.disabled = true;
        button.innerText = "Đang đóng...";
    }

    try {
        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/test/exams/${normalizedExamId}/close-waiting-room`,
                {
                    method: "PATCH",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        let result = {};

        try {
            result =
                await response.json();
        } catch {
            result = {};
        }

        if (
            !response.ok ||
            !result.success
        ) {
            const errorMessages = {
                INVALID_EXAM_ID:
                    "ID bài kiểm tra không hợp lệ.",

                EXAM_NOT_FOUND:
                    "Không tìm thấy bài kiểm tra.",

                EXAM_NOT_IN_ACTIVE_SEASON:
                    "Bài kiểm tra không thuộc mùa đang hoạt động.",

                EXAM_NOT_WAITING_ROOM_OPEN:
                    "Bài kiểm tra không còn mở phòng chờ.",

                ACTIVE_SEASON_NOT_FOUND:
                    "Không tìm thấy mùa đang hoạt động.",

                UNAUTHORIZED:
                    "Phiên đăng nhập đã hết hạn.",

                FORBIDDEN:
                    "Bạn không có quyền đóng phòng chờ."
            };

            throw new Error(
                errorMessages[
                    result.code || ""
                ] ||
                "Không thể đóng phòng chờ."
            );
        }

        window.alert(
            `Đã đóng phòng chờ của “${displayName}”.`
        );

        await loadAdminExamsFromApi();
    } catch (error) {
        console.error(
            "Close Admin Exam waiting room error:",
            error
        );

        if (error instanceof TypeError) {
            window.alert(
                "Không thể kết nối Backend. Hãy kiểm tra server đang chạy ở cổng 5000."
            );
        } else {
            window.alert(
                error.message ||
                "Không thể đóng phòng chờ."
            );
        }
    } finally {
        if (
            button &&
            button.isConnected
        ) {
            button.disabled = false;
            button.innerText =
                originalButtonText;
        }
    }
}

async function startAdminExamFromApi({
    examId,
    examName,
    button
}) {
    const normalizedExamId =
        Number(examId);

    if (
        !Number.isInteger(normalizedExamId) ||
        normalizedExamId <= 0
    ) {
        window.alert(
            "ID bài kiểm tra không hợp lệ."
        );
        return;
    }

    const displayName =
        String(examName || "").trim() ||
        `ID ${normalizedExamId}`;

    const confirmed =
        window.confirm(
            `Bắt đầu bài kiểm tra “${displayName}”?\n\nSau khi bắt đầu, bài kiểm tra sẽ được mở đồng thời cho các học viên trong phòng chờ.`
        );

    if (!confirmed) {
        return;
    }

    const token =
        localStorage.getItem(
            "accessToken"
        );

    if (!token) {
        window.location.href =
            "index.html";
        return;
    }

    const originalButtonText =
        button?.innerText || "Bắt đầu";

    if (button) {
        button.disabled = true;
        button.innerText =
            "Đang bắt đầu...";
    }

    try {
        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/test/exams/${normalizedExamId}/start`,
                {
                    method: "PATCH",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        let result = {};

        try {
            result =
                await response.json();
        } catch {
            result = {};
        }

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            localStorage.removeItem(
                "accessToken"
            );

            localStorage.removeItem(
                "currentUser"
            );

            window.location.href =
                "index.html";
            return;
        }

        if (
            !response.ok ||
            !result.success
        ) {
            const errorCode =
                result?.error?.code ||
                result?.code ||
                "";

            const errorMessages = {
                INVALID_EXAM_ID:
                    "ID bài kiểm tra không hợp lệ.",

                EXAM_NOT_FOUND:
                    "Không tìm thấy bài kiểm tra.",

                EXAM_NOT_IN_ACTIVE_SEASON:
                    "Bài kiểm tra không thuộc mùa đang hoạt động.",

                EXAM_NOT_WAITING_ROOM_OPEN:
                    "Bài kiểm tra không còn ở trạng thái mở phòng chờ.",

                EXAM_HAS_NO_QUESTIONS:
                    "Bài kiểm tra chưa có câu hỏi.",

                ACTIVE_SEASON_NOT_FOUND:
                    "Không tìm thấy mùa đang hoạt động.",

                UNAUTHORIZED:
                    "Phiên đăng nhập đã hết hạn.",

                FORBIDDEN:
                    "Bạn không có quyền bắt đầu bài kiểm tra."
            };

            throw new Error(
                errorMessages[errorCode] ||
                result?.error?.message ||
                result?.message ||
                "Không thể bắt đầu bài kiểm tra."
            );
        }

        window.alert(
            `Bài kiểm tra “${displayName}” đã bắt đầu.`
        );

        await loadAdminExamsFromApi();
    } catch (error) {
        console.error(
            "Start Admin Exam error:",
            error
        );

        if (error instanceof TypeError) {
            window.alert(
                "Không thể kết nối Backend. Hãy kiểm tra server đang chạy ở cổng 5000."
            );
        } else {
            window.alert(
                error.message ||
                "Không thể bắt đầu bài kiểm tra."
            );
        }
    } finally {
        if (
            button &&
            button.isConnected
        ) {
            button.disabled = false;
            button.innerText =
                originalButtonText;
        }
    }
}

async function finishAdminExamFromApi({
    examId,
    examName,
    button
}) {
    const normalizedExamId =
        Number(examId);

    if (
        !Number.isInteger(normalizedExamId) ||
        normalizedExamId <= 0
    ) {
        window.alert(
            "ID bài kiểm tra không hợp lệ."
        );
        return;
    }

    const displayName =
        String(examName || "").trim() ||
        `ID ${normalizedExamId}`;

    const confirmed =
        window.confirm(
            `Kết thúc bài kiểm tra “${displayName}”?\n\nHệ thống sẽ thu bài của học viên. Hành động này không thể hoàn tác.`
        );

    if (!confirmed) {
        return;
    }

    const token =
        localStorage.getItem(
            "accessToken"
        );

    if (!token) {
        window.location.href =
            "index.html";
        return;
    }

    const originalButtonText =
        button?.innerText || "Kết thúc";

    if (button) {
        button.disabled = true;
        button.innerText =
            "Đang kết thúc...";
    }

    try {
        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/test/exams/${normalizedExamId}/finish`,
                {
                    method: "PATCH",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        let result = {};

        try {
            result =
                await response.json();
        } catch {
            result = {};
        }

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            localStorage.removeItem(
                "accessToken"
            );

            localStorage.removeItem(
                "currentUser"
            );

            window.location.href =
                "index.html";
            return;
        }

        if (
            !response.ok ||
            !result.success
        ) {
            const errorCode =
                result?.error?.code ||
                result?.code ||
                "";

            const errorMessages = {
                INVALID_EXAM_ID:
                    "ID bài kiểm tra không hợp lệ.",

                EXAM_NOT_FOUND:
                    "Không tìm thấy bài kiểm tra.",

                EXAM_NOT_IN_ACTIVE_SEASON:
                    "Bài kiểm tra không thuộc mùa đang hoạt động.",

                EXAM_NOT_IN_PROGRESS:
                    "Bài kiểm tra không còn ở trạng thái đang diễn ra.",

                ACTIVE_SEASON_NOT_FOUND:
                    "Không tìm thấy mùa đang hoạt động.",

                UNAUTHORIZED:
                    "Phiên đăng nhập đã hết hạn.",

                FORBIDDEN:
                    "Bạn không có quyền kết thúc bài kiểm tra."
            };

            throw new Error(
                errorMessages[errorCode] ||
                result?.error?.message ||
                result?.message ||
                "Không thể kết thúc bài kiểm tra."
            );
        }

        window.alert(
            `Đã gửi lệnh kết thúc bài kiểm tra “${displayName}”. Hệ thống đang thu bài của học viên.`
        );

        await loadAdminExamsFromApi();
    } catch (error) {
        console.error(
            "Finish Admin Exam error:",
            error
        );

        if (error instanceof TypeError) {
            window.alert(
                "Không thể kết nối Backend. Hãy kiểm tra server đang chạy ở cổng 5000."
            );
        } else {
            window.alert(
                error.message ||
                "Không thể kết thúc bài kiểm tra."
            );
        }
    } finally {
        if (
            button &&
            button.isConnected
        ) {
            button.disabled = false;
            button.innerText =
                originalButtonText;
        }
    }
}

async function advanceAdminExamQuestionFromApi({
    examId,
    examName,
    button
}) {
    const normalizedExamId =
        Number(examId);

    if (
        !Number.isInteger(normalizedExamId) ||
        normalizedExamId <= 0
    ) {
        window.alert(
            "ID bài kiểm tra không hợp lệ."
        );
        return;
    }

    const displayName =
        String(examName || "").trim() ||
        `ID ${normalizedExamId}`;

    const token =
        localStorage.getItem(
            "accessToken"
        );

    if (!token) {
        window.location.href =
            "index.html";
        return;
    }

    const originalButtonText =
        button?.innerText ||
        "Câu tiếp theo";

    if (button) {
        button.disabled = true;
        button.innerText =
            "Đang mở...";
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/test/exams/${normalizedExamId}/next-question`,
            {
                method: "PATCH",

                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const responseText =
            await response.text();

        let result = {};

        try {
            result =
                responseText
                    ? JSON.parse(responseText)
                    : {};
        } catch {
            result = {};
        }

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            logoutDemo();
            return;
        }

        if (
            !response.ok ||
            !result.success
        ) {
            const errorMessages = {
                INVALID_EXAM_ID:
                    "ID bài kiểm tra không hợp lệ.",

                ACTIVE_SEASON_NOT_FOUND:
                    "Không tìm thấy mùa TKH đang hoạt động.",

                EXAM_NOT_FOUND:
                    "Không tìm thấy bài kiểm tra.",

                EXAM_NOT_IN_ACTIVE_SEASON:
                    "Bài kiểm tra không thuộc mùa đang hoạt động.",

                EXAM_NOT_IN_PROGRESS:
                    "Bài kiểm tra không còn diễn ra.",

                LIVE_STATE_NOT_FOUND:
                    "Không tìm thấy trạng thái câu hỏi hiện tại.",

                CURRENT_QUESTION_STILL_ACTIVE:
                    "Câu hiện tại vẫn còn thời gian. Hãy chờ câu được khóa rồi mở câu tiếp theo.",

                LAST_QUESTION_REACHED:
                    "Đây đã là câu cuối. Hãy bấm Kết thúc để thu bài."
            };

            throw new Error(
                errorMessages[
                    result.code || ""
                ] ||
                result.message ||
                "Không thể mở câu tiếp theo."
            );
        }

        const liveState =
            result.data?.liveState || {};

        const currentQuestionIndex =
            Number(
                liveState
                    .currentQuestionIndex
            ) || 0;

        const totalQuestions =
            Number(
                liveState.totalQuestions
            ) || 0;

        window.alert(
            `Đã mở Câu ${currentQuestionIndex}/${totalQuestions} của “${displayName}”.`
        );

        await loadAdminExamsFromApi();
    } catch (error) {
        console.error(
            "Advance Admin Exam question error:",
            error
        );

        if (error instanceof TypeError) {
            window.alert(
                "Không thể kết nối Backend. Hãy kiểm tra server đang chạy ở cổng 5000."
            );
        } else {
            window.alert(
                error.message ||
                "Không thể mở câu tiếp theo."
            );
        }
    } finally {
        if (
            button &&
            button.isConnected
        ) {
            button.disabled = false;
            button.innerText =
                originalButtonText;
        }
    }
}

async function deleteAdminExamFromApi({
    examId,
    examName,
    button
}) {
    const normalizedExamId =
        Number(examId);

    if (
        !Number.isInteger(
            normalizedExamId
        ) ||
        normalizedExamId <= 0
    ) {
        window.alert(
            "ID bài kiểm tra không hợp lệ."
        );
        return;
    }

    const displayName =
        String(examName || "").trim() ||
        `ID ${normalizedExamId}`;

    const confirmed =
        window.confirm(
            `Bạn có chắc muốn xóa bài kiểm tra “${displayName}” không?\n\nToàn bộ câu hỏi và đáp án của bài này cũng sẽ bị xóa. Hành động này không thể hoàn tác.`
        );

    if (!confirmed) {
        return;
    }

    const token =
        localStorage.getItem(
            "accessToken"
        );

    if (!token) {
        window.location.href =
            "index.html";
        return;
    }

    const originalButtonText =
        button?.innerText || "Xóa";

    if (button) {
        button.disabled = true;
        button.innerText = "Đang xóa...";
    }

    try {
        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/test/exams/${normalizedExamId}`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        let result = {};

        try {
            result =
                await response.json();
        } catch {
            result = {};
        }

        if (
            !response.ok ||
            !result.success
        ) {
            const errorCode =
                result.code || "";

            const errorMessages = {
                INVALID_EXAM_ID:
                    "ID bài kiểm tra không hợp lệ.",

                EXAM_NOT_FOUND:
                    "Không tìm thấy bài kiểm tra hoặc bài đã được xóa.",

                EXAM_NOT_IN_ACTIVE_SEASON:
                    "Bài kiểm tra không thuộc mùa đang hoạt động.",

                EXAM_NOT_DRAFT:
                    "Chỉ có thể xóa bài đang ở trạng thái Nháp.",

                EXAM_HAS_ATTEMPTS:
                    "Không thể xóa vì bài kiểm tra đã có lượt làm bài.",

                ACTIVE_SEASON_NOT_FOUND:
                    "Không tìm thấy mùa đang hoạt động.",

                UNAUTHORIZED:
                    "Phiên đăng nhập đã hết hạn.",

                FORBIDDEN:
                    "Bạn không có quyền xóa bài kiểm tra."
            };

            throw new Error(
                errorMessages[errorCode] ||
                "Không thể xóa bài kiểm tra."
            );
        }

        window.alert(
            `Đã xóa bài kiểm tra “${displayName}” thành công.`
        );

        await loadAdminExamsFromApi();
    } catch (error) {
        console.error(
            "Delete Admin exam error:",
            error
        );

        if (
            error instanceof TypeError
        ) {
            window.alert(
                "Không thể kết nối Backend. Hãy kiểm tra server đang chạy ở cổng 5000."
            );
        } else {
            window.alert(
                error.message ||
                "Không thể xóa bài kiểm tra."
            );
        }
    } finally {
        if (
            button &&
            button.isConnected
        ) {
            button.disabled = false;
            button.innerText =
                originalButtonText;
        }
    }
}


async function createAdminExamFromApi(event) {
    event?.preventDefault();

    const nameInput =
        document.getElementById(
            "adminExamCreateName"
        );

    const typeInput =
        document.getElementById(
            "adminExamCreateType"
        );

    const scheduledStartInput =
        document.getElementById(
            "adminExamCreateScheduledStartAt"
        );

    const timePerQuestionInput =
        document.getElementById(
            "adminExamCreateTimePerQuestion"
        );

    const createButton =
        document.getElementById(
            "adminExamCreateButton"
        );

    const message =
        document.getElementById(
            "adminExamCreateMessage"
        );

    if (
        !nameInput ||
        !typeInput ||
        !scheduledStartInput ||
        !timePerQuestionInput ||
        !createButton ||
        !message
    ) {
        return;
    }

    const name =
        nameInput.value.trim();

    const timePerQuestion =
        Number(
            timePerQuestionInput.value
        );

    if (!name) {
        message.classList.remove(
            "hidden"
        );

        message.style.color = "red";

        message.innerText =
            "Vui lòng nhập tên bài kiểm tra.";

        nameInput.focus();
        return;
    }

    if (
        !Number.isInteger(
            timePerQuestion
        ) ||
        timePerQuestion <= 0
    ) {
        message.classList.remove(
            "hidden"
        );

        message.style.color = "red";

        message.innerText =
            "Thời gian mỗi câu phải là số nguyên lớn hơn 0.";

        timePerQuestionInput.focus();
        return;
    }

    const token =
        localStorage.getItem(
            "accessToken"
        ) ||
        localStorage.getItem(
            "authToken"
        ) ||
        localStorage.getItem(
            "token"
        );

    if (!token) {
        window.location.href =
            "index.html";

        return;
    }

    createButton.disabled = true;

    message.classList.remove(
        "hidden"
    );

    message.style.color = "#555";

    message.innerText =
        "Đang tạo bài kiểm tra...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/test/exams`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${token}`
                },

                body: JSON.stringify({
                    name,

                    type:
                        typeInput.value,

                    scheduledStartAt:
                        scheduledStartInput
                            .value || null,

                    timePerQuestion
                })
            }
        );

        let result = {};

        try {
            result =
                await response.json();
        } catch (jsonError) {
            result = {};
        }

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            window.location.href =
                "index.html";

            return;
        }

        if (
            !response.ok ||
            !result.success
        ) {
            const messagesByCode = {
                INVALID_EXAM_NAME:
                    "Tên bài kiểm tra không hợp lệ.",
                INVALID_EXAM_TYPE:
                    "Loại bài kiểm tra không hợp lệ.",
                INVALID_SCHEDULED_START_AT:
                    "Ngày giờ dự kiến không hợp lệ.",
                INVALID_TIME_PER_QUESTION:
                    "Thời gian mỗi câu phải là số nguyên lớn hơn 0.",
                ACTIVE_SEASON_NOT_FOUND:
                    "Không tìm thấy mùa TKH đang hoạt động.",
                INTERNAL_SERVER_ERROR:
                    "Máy chủ gặp lỗi khi tạo bài kiểm tra."
            };

            const errorCode =
                result?.error?.code ||
                result?.code;

            throw new Error(
                result?.error?.message ||
                result?.message ||
                messagesByCode[
                    errorCode
                ] ||
                "Không thể tạo bài kiểm tra."
            );
        }

        const createdExam =
            result?.data?.exam ||
            result?.exam;

        if (
            !createdExam ||
            !createdExam.id
        ) {
            throw new Error(
                "Backend đã tạo bài nhưng không trả về ID."
            );
        }

        document
            .getElementById(
                "adminExamCreateForm"
            )
            ?.reset();

        message.style.color =
            "green";

        message.innerText =
            `Đã tạo bài kiểm tra ID ${createdExam.id} thành công.`;

        await loadAdminExamsFromApi();

        selectAdminExamForImport(
            createdExam.id
        );
    } catch (error) {
        console.error(
            "Create Admin exam error:",
            error
        );

        message.style.color = "red";

        if (
            error instanceof TypeError
        ) {
            message.innerText =
                "Không thể kết nối Backend. Hãy kiểm tra server đang chạy ở cổng 5000.";
        } else {
            message.innerText =
                error.message ||
                "Không thể tạo bài kiểm tra.";
        }
    } finally {
        createButton.disabled = false;
    }
}


async function loadAdminExamsFromApi() {
    const message =
        document.getElementById(
            "adminExamsMessage"
        );

    const tableWrapper =
        document.getElementById(
            "adminExamsTableWrapper"
        );

    if (!message || !tableWrapper) {
        return;
    }

    let currentUser = null;

    try {
        currentUser =
            JSON.parse(
                localStorage.getItem(
                    "currentUser"
                )
            );
    } catch {
        currentUser = null;
    }

    const token =
        localStorage.getItem(
            "accessToken"
        );

    if (!currentUser || !token) {
        window.location.href =
            "index.html";
        return;
    }

    if (
        String(currentUser.role)
            .toLowerCase() !== "admin"
    ) {
        message.style.color = "red";
        message.innerText =
            "Chỉ Admin được phép xem danh sách bài kiểm tra.";

        tableWrapper.classList.add(
            "hidden"
        );

        return;
    }

    message.classList.remove(
        "hidden"
    );

    message.style.color = "#555";
    message.innerText =
        "Đang tải danh sách bài kiểm tra...";

    tableWrapper.classList.add(
        "hidden"
    );

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/test/exams`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const responseText =
            await response.text();

        let result = {};

        if (responseText) {
            try {
                result =
                    JSON.parse(
                        responseText
                    );
            } catch {
                result = {
                    success: false,
                    message:
                        responseText
                };
            }
        }

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            localStorage.removeItem(
                "accessToken"
            );

            localStorage.removeItem(
                "currentUser"
            );

            localStorage.removeItem(
                "currentUsername"
            );

            window.location.href =
                "index.html";

            return;
        }

        if (
            !response.ok ||
            !result.success
        ) {
            const messagesByCode = {
                ACTIVE_SEASON_NOT_FOUND:
                    "Không tìm thấy mùa TKH đang hoạt động.",
                INTERNAL_SERVER_ERROR:
                    "Máy chủ gặp lỗi khi tải danh sách bài kiểm tra."
            };

            const errorCode =
                result?.error?.code ||
                result?.code;

            throw new Error(
                result?.error?.message ||
                result?.message ||
                messagesByCode[
                    errorCode
                ] ||
                "Không thể tải danh sách bài kiểm tra."
            );
        }

        const exams =
            Array.isArray(result.exams)
                ? result.exams
                : Array.isArray(
                    result.data?.exams
                )
                    ? result.data.exams
                    : [];

        renderAdminExams(exams);
    } catch (error) {
        console.error(
            "Load Admin exams error:",
            error
        );

        tableWrapper.classList.add(
            "hidden"
        );

        message.classList.remove(
            "hidden"
        );

        message.style.color = "red";

        if (
            error instanceof TypeError
        ) {
            message.innerText =
                "Không thể kết nối Backend. Hãy kiểm tra server đang chạy ở cổng 5000.";
        } else {
            message.innerText =
                error.message ||
                "Không thể tải danh sách bài kiểm tra.";
        }
    }
}


document.addEventListener(
    "DOMContentLoaded",
    loadAdminExamsFromApi
);


/*
=====================================================
Import Exam questions from Excel
Admin only
=====================================================
*/
async function importExamQuestionsFromExcel() {
    const examIdInput =
        document.getElementById(
            "adminExamImportId"
        );

    const fileInput =
        document.getElementById(
            "adminExamQuestionsFile"
        );

    const button =
        document.getElementById(
            "adminExamImportButton"
        );

    const message =
        document.getElementById(
            "adminExamImportMessage"
        );

    if (
        !examIdInput ||
        !fileInput ||
        !button ||
        !message
    ) {
        return;
    }

    const currentUser =
        JSON.parse(
            localStorage.getItem(
                "currentUser"
            )
        );

    const token =
        localStorage.getItem(
            "accessToken"
        );

    if (!currentUser || !token) {
        window.location.href =
            "index.html";
        return;
    }

    if (
        String(currentUser.role)
            .toLowerCase() !== "admin"
    ) {
        message.style.color = "red";
        message.innerText =
            "Chỉ Admin được phép import câu hỏi.";
        return;
    }

    const examId =
        Number(examIdInput.value);

    if (
        !Number.isInteger(examId) ||
        examId <= 0
    ) {
        message.style.color = "red";
        message.innerText =
            "Vui lòng nhập ID bài kiểm tra hợp lệ.";
        examIdInput.focus();
        return;
    }

    const file =
        fileInput.files[0];

    if (!file) {
        message.style.color = "red";
        message.innerText =
            "Vui lòng chọn file câu hỏi Excel.";
        return;
    }

    if (
        !file.name
            .toLowerCase()
            .endsWith(".xlsx")
    ) {
        message.style.color = "red";
        message.innerText =
            "Chỉ chấp nhận file Excel định dạng .xlsx.";
        return;
    }

    if (
        file.size >
        5 * 1024 * 1024
    ) {
        message.style.color = "red";
        message.innerText =
            "File Excel không được vượt quá 5 MB.";
        return;
    }

    const formData =
        new FormData();

    formData.append(
        "file",
        file
    );

    const originalButtonText =
        button.innerText;

    button.disabled = true;
    button.innerText =
        "Đang import...";

    message.style.color = "#555";
    message.innerText =
        "Đang tải và kiểm tra file Excel...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/test/exams/${encodeURIComponent(examId)}/questions/import`,
            {
                method: "POST",
                headers: {
                    Authorization:
                        `Bearer ${token}`
                },
                body: formData
            }
        );

        const responseText =
            await response.text();

        let result = {};

        if (responseText) {
            try {
                result =
                    JSON.parse(
                        responseText
                    );
            } catch {
                result = {
                    success: false,
                    message:
                        responseText
                };
            }
        }

        if (!response.ok || !result.success) {
            const errorCode =
                result?.error?.code ||
                result?.code;

            const messagesByCode = {
                EXCEL_FILE_REQUIRED:
                    "Vui lòng chọn file câu hỏi Excel.",
                INVALID_EXCEL_FILE:
                    "File Excel không hợp lệ hoặc không thể đọc.",
                INVALID_EXCEL_FILE_TYPE:
                    "Chỉ chấp nhận file Excel định dạng .xlsx.",
                EXCEL_FILE_TOO_LARGE:
                    "File Excel không được vượt quá 5 MB.",
                INVALID_EXCEL_COLUMNS:
                    "Các cột trong file Excel không đúng định dạng yêu cầu.",
                INVALID_EXCEL_ROWS:
                    "File Excel có dòng dữ liệu không hợp lệ.",
                EXCEL_HAS_NO_QUESTIONS:
                    "File Excel không có câu hỏi để import.",
                INVALID_EXAM_ID:
                    "ID bài kiểm tra không hợp lệ.",
                EXAM_NOT_FOUND:
                    "Không tìm thấy bài kiểm tra.",
                EXAM_NOT_EDITABLE:
                    "Bài kiểm tra hiện không còn được phép chỉnh sửa.",
                INTERNAL_SERVER_ERROR:
                    "Máy chủ gặp lỗi khi import câu hỏi."
            };

            const errorMessage =
                result?.error?.message ||
                result?.message ||
                messagesByCode[
                    errorCode
                ] ||
                "Không thể import câu hỏi từ file Excel.";

            throw new Error(
                errorMessage
            );
        }

        const data =
            result.data || {};

        const countCandidates = [
            data.importedCount,
            data.importedQuestionsCount,
            data.imported_questions_count,
            data.questionCount,
            data.questionsImported,
            data.totalImported,
            data.insertedCount,
            data.importedQuestions
        ];

        const countValue =
            countCandidates.find(
                value =>
                    typeof value ===
                        "number" ||
                    Array.isArray(value)
            );

        const importedCount =
            Array.isArray(countValue)
                ? countValue.length
                : countValue;

        message.style.color = "green";

        if (
            typeof importedCount ===
            "number"
        ) {
            message.innerText =
                `Đã import thành công ${importedCount} câu hỏi vào bài kiểm tra ID ${examId}.`;
        } else {
            message.innerText =
                `Đã import câu hỏi thành công vào bài kiểm tra ID ${examId}.`;
        }

        fileInput.value = "";

        await loadAdminExamsFromApi();
    } catch (error) {
        console.error(
            "Import Exam questions error:",
            error
        );

        message.style.color = "red";

        if (
            error instanceof TypeError
        ) {
            message.innerText =
                "Không thể kết nối Backend. Hãy kiểm tra server đang chạy ở cổng 5000.";
        } else {
            message.innerText =
                error.message ||
                "Không thể import câu hỏi từ file Excel.";
        }
    } finally {
        button.disabled = false;
        button.innerText =
            originalButtonText;
    }
}

/*
=====================================================
Student Exam list and waiting room
=====================================================
*/

function escapeStudentExamHtml(value) {
    return String(value ?? "")
        .replace(
            /[&<>"']/g,
            character => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            })[character]
        );
}


function getStudentExamTypeLabel(type) {
    const labels = {
        PRE_TEST: "Pre-test",
        FINAL_TEST: "Final Test"
    };

    return labels[type] || "Bài kiểm tra";
}


function getStudentExamStatusLabel(status) {
    const labels = {
        SCHEDULED: "Chưa mở",
        WAITING_ROOM_OPEN: "Đang mở phòng chờ",
        IN_PROGRESS: "Đang diễn ra",
        PAUSED: "Đang tạm dừng",
        COMPLETED: "Đã hoàn tất"
    };

    return labels[status] || "Chưa xác định";
}


function getStudentExamActionLabel(status) {
    const labels = {
        SCHEDULED: "Chưa đến giờ",
        WAITING_ROOM_OPEN: "Vào phòng chờ",
        IN_PROGRESS: "Bài đã bắt đầu",
        PAUSED: "Bài đang tạm dừng",
        COMPLETED: "Bài đã kết thúc"
    };

    return labels[status] || "Chưa thể tham gia";
}


function formatStudentExamDate(value) {
    if (!value) {
        return "Chưa lên lịch";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Chưa xác định";
    }

    return date.toLocaleString(
        "vi-VN",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/*
=====================================================
Student Exam realtime
=====================================================
*/

let studentExamSocket = null;
let activeStudentExamId = null;
let activeStudentExamAttemptId = null;
let studentExamSyncTimer = null;


function getStudentExamSocket() {
    const token =
        localStorage.getItem(
            "accessToken"
        );

    if (!token) {
        logoutDemo();

        throw new Error(
            "Phiên đăng nhập đã hết hạn."
        );
    }

    if (typeof window.io !== "function") {
        throw new Error(
            "Không tải được Socket.IO."
        );
    }

    if (
        studentExamSocket &&
        studentExamSocket.auth?.token === token
    ) {
        return studentExamSocket;
    }

    if (studentExamSocket) {
        studentExamSocket.disconnect();
    }

    studentExamSocket =
        window.io(
            `${API_BASE_URL}/exams`,
            {
                auth: {
                    token
                },

                transports: [
                    "websocket",
                    "polling"
                ]
            }
        );

    studentExamSocket.on(
        "connect_error",
        error => {
            console.error(
                "Student Exam Socket connection error:",
                error
            );
        }
    );

    const synchronizeActiveExam =
        payload => {
            const payloadExamId =
                Number(payload?.examId);

            if (
                !activeStudentExamId ||
                payloadExamId !==
                    activeStudentExamId
            ) {
                return;
            }

            clearTimeout(
                studentExamSyncTimer
            );

            studentExamSyncTimer =
                setTimeout(
                    () => {
                        enterStudentExamRealtime(
                            activeStudentExamId
                        );
                    },
                    100
                );
        };

    studentExamSocket.on(
        "exam:status",
        synchronizeActiveExam
    );

    studentExamSocket.on(
        "exam:started",
        synchronizeActiveExam
    );

    return studentExamSocket;
}


function emitStudentExamJoin(examId) {
    return new Promise(
        (resolve, reject) => {
            let socket;

            try {
                socket =
                    getStudentExamSocket();
            } catch (error) {
                reject(error);
                return;
            }

            const timeoutId =
                setTimeout(
                    () => {
                        reject(
                            new Error(
                                "Máy chủ phản hồi quá chậm."
                            )
                        );
                    },
                    10000
                );

            socket.emit(
                "exam:join",
                {
                    examId
                },
                result => {
                    clearTimeout(
                        timeoutId
                    );

                    if (!result?.success) {
                        const messagesByCode = {
                            INVALID_EXAM_ID:
                                "ID bài kiểm tra không hợp lệ.",

                            EXAM_NOT_FOUND:
                                "Không tìm thấy bài kiểm tra.",

                            EXAM_NOT_IN_ACTIVE_SEASON:
                                "Bài kiểm tra không thuộc mùa TKH hiện tại.",

                            EXAM_NOT_AVAILABLE:
                                "Bài kiểm tra chưa mở cho học viên.",

                            EXAM_ALREADY_COMPLETED:
                                "Bạn đã hoàn thành bài kiểm tra này.",

                            EXAM_NOT_JOINABLE:
                                "Hiện chưa thể tham gia bài kiểm tra.",

                            CURRENT_QUESTION_NOT_ACTIVE:
                                "Câu hỏi hiện tại đã bị khóa.",

                            LIVE_STATE_NOT_FOUND:
                                "Chưa có câu hỏi nào được mở.",

                            ACTIVE_MEMBERSHIP_NOT_FOUND:
                                "Không tìm thấy thông tin tham gia TKH.",

                            EXAM_SOCKET_FORBIDDEN:
                                "Tài khoản không có quyền tham gia."
                        };

                        reject(
                            new Error(
                                messagesByCode[
                                    result?.code
                                ] ||
                                "Không thể vào bài kiểm tra."
                            )
                        );

                        return;
                    }

                    resolve(result);
                }
            );
        }
    );
}


/*
=====================================================
Student Exam answer submission
=====================================================
*/

let studentExamAnswerLockTimer = null;


function getStudentExamAnswerStorageKey(
    examId,
    questionId
) {
    return (
        `studentExamAnswer:${examId}:${questionId}`
    );
}


function getStoredStudentExamAnswer(
    examId,
    questionId
) {
    return (
        localStorage.getItem(
            getStudentExamAnswerStorageKey(
                examId,
                questionId
            )
        ) || ""
    );
}


function lockStudentExamAnswerButtons() {
    document
        .querySelectorAll(
            ".student-exam-answer-button"
        )
        .forEach(button => {
            button.disabled = true;
        });

    const status =
        document.getElementById(
            "studentExamAnswerStatus"
        );

    if (status) {
        status.innerText =
            "Đã hết thời gian trả lời. Đáp án đã được khóa.";
    }
}


function scheduleStudentExamAnswerLock(
    questionEndsAt
) {
    if (studentExamAnswerLockTimer) {
        clearTimeout(
            studentExamAnswerLockTimer
        );

        studentExamAnswerLockTimer = null;
    }

    if (!questionEndsAt) {
        return;
    }

    const endsAtMilliseconds =
        Date.parse(questionEndsAt);

    if (
        !Number.isFinite(
            endsAtMilliseconds
        )
    ) {
        return;
    }

    const remainingMilliseconds =
        endsAtMilliseconds - Date.now();

    if (remainingMilliseconds <= 0) {
        lockStudentExamAnswerButtons();
        return;
    }

    studentExamAnswerLockTimer =
        setTimeout(
            lockStudentExamAnswerButtons,
            remainingMilliseconds
        );
}


function paintStudentExamSelectedAnswer(
    selectedAnswer
) {
    document
        .querySelectorAll(
            ".student-exam-answer-button"
        )
        .forEach(button => {
            const isSelected =
                button.dataset.answer ===
                selectedAnswer;

            button.style.background =
                isSelected
                    ? "#2563eb"
                    : "";

            button.style.color =
                isSelected
                    ? "#ffffff"
                    : "";

            button.style.borderColor =
                isSelected
                    ? "#2563eb"
                    : "";
        });
}


async function submitStudentExamAnswerFromApi(
    button
) {
    const examId =
        Number(button?.dataset.examId);

    const questionId =
        Number(button?.dataset.questionId);

    const answer =
        String(
            button?.dataset.answer || ""
        )
            .trim()
            .toUpperCase();

    if (
        !Number.isInteger(examId) ||
        !Number.isInteger(questionId) ||
        !["A", "B", "C", "D"].includes(
            answer
        )
    ) {
        window.alert(
            "Thông tin đáp án không hợp lệ."
        );

        return;
    }

    const token =
        localStorage.getItem(
            "accessToken"
        );

    if (!token) {
        logoutDemo();
        return;
    }

    const answerButtons =
        document.querySelectorAll(
            ".student-exam-answer-button"
        );

    const status =
        document.getElementById(
            "studentExamAnswerStatus"
        );

    answerButtons.forEach(
        answerButton => {
            answerButton.disabled = true;
        }
    );

    if (status) {
        status.innerText =
            `Đang lưu đáp án ${answer}...`;
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/exams/${encodeURIComponent(examId)}/attempt/answer`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${token}`
                },

                body: JSON.stringify({
                    question_id:
                        questionId,

                    answer
                })
            }
        );

        const responseText =
            await response.text();

        let result = {};

        try {
            result =
                responseText
                    ? JSON.parse(
                        responseText
                    )
                    : {};
        } catch (parseError) {
            result = {};
        }

        if (response.status === 401) {
            logoutDemo();
            return;
        }

        if (
            !response.ok ||
            !result.success
        ) {
            const errorMessages = {
                INVALID_EXAM_ID:
                    "Bài kiểm tra không hợp lệ.",

                INVALID_QUESTION_ID:
                    "Câu hỏi không hợp lệ.",

                INVALID_ANSWER:
                    "Đáp án không hợp lệ.",

                EXAM_NOT_FOUND:
                    "Không tìm thấy bài kiểm tra.",

                EXAM_NOT_IN_PROGRESS:
                    "Bài kiểm tra đã kết thúc.",

                ATTEMPT_NOT_FOUND:
                    "Không tìm thấy lượt làm bài.",

                QUESTION_NOT_ACTIVE:
                    "Câu hỏi hiện không còn mở.",

                ANSWER_TOO_LATE:
                    "Đã hết thời gian trả lời."
            };

            const submitError =
                new Error(
                    errorMessages[
                        result.code
                    ] ||
                    result.message ||
                    "Không thể lưu đáp án."
                );

            submitError.code =
                result.code;

            throw submitError;
        }

        localStorage.setItem(
            getStudentExamAnswerStorageKey(
                examId,
                questionId
            ),
            answer
        );

        paintStudentExamSelectedAnswer(
            answer
        );

        if (status) {
            status.innerText =
                `Đã lưu đáp án ${answer}. Bạn vẫn có thể đổi đáp án khi câu hỏi còn mở.`;
        }

        const questionEndsAt =
            button.dataset
                .questionEndsAt;

        const endsAtMilliseconds =
            Date.parse(
                questionEndsAt
            );

        const stillWithinTime =
            !Number.isFinite(
                endsAtMilliseconds
            ) ||
            Date.now() <
                endsAtMilliseconds;

        answerButtons.forEach(
            answerButton => {
                answerButton.disabled =
                    !stillWithinTime;
            }
        );
    } catch (error) {
        console.error(
            "Submit Student Exam answer error:",
            error
        );

        const shouldLock =
            error.code ===
                "QUESTION_NOT_ACTIVE" ||
            error.code ===
                "ANSWER_TOO_LATE" ||
            error.code ===
                "EXAM_NOT_IN_PROGRESS";

        if (shouldLock) {
            lockStudentExamAnswerButtons();
        } else {
            answerButtons.forEach(
                answerButton => {
                    answerButton.disabled =
                        false;
                }
            );
        }

        if (status) {
            status.innerText =
                error.message ||
                "Không thể lưu đáp án.";
        }
    }
}

function renderStudentExamRealtimeView(
    examId,
    result
) {
    const list =
        document.getElementById(
            "studentExamList"
        );

    if (!list) {
        return;
    }

    const data =
        result?.data || {};

    const realtimeState =
        data.realtimeState || {};

    const attempt =
        data.attempt || null;

    const attemptId =
        Number(attempt?.id);

    activeStudentExamId =
        Number(examId);

    if (
        Number.isInteger(attemptId) &&
        attemptId > 0
    ) {
        activeStudentExamAttemptId =
            attemptId;

        sessionStorage.setItem(
            "activeStudentExamId",
            String(activeStudentExamId)
        );

        sessionStorage.setItem(
            "activeStudentExamAttemptId",
            String(attemptId)
        );
    }

    if (
        data.mode === "WAITING_ROOM"
    ) {
        list.innerHTML = `
            <article class="student-exam-card student-exam-card-joined">
                <div class="student-exam-card-header">
                    <span class="student-exam-status">
                        Phòng chờ
                    </span>
                </div>

                <h3>
                    Bạn đã vào phòng chờ
                </h3>

                <p class="empty-note">
                    Vui lòng giữ trang này mở.
                    Hệ thống sẽ tự cập nhật khi Admin bắt đầu bài.
                </p>
            </article>
        `;

        scheduleStudentExamAnswerLock("");

        return;
    }

    const questionId =
        Number(
            realtimeState.currentQuestionId
        );

    const questionIndex =
        Number(
            realtimeState.currentQuestionIndex
        );

    const totalQuestions =
        Number(
            attempt?.totalQuestions
        ) || 0;

    const liveState =
        String(
            realtimeState.liveState || ""
        ).toUpperCase();

    if (
        !Number.isInteger(questionId) ||
        questionId <= 0 ||
        !Number.isInteger(questionIndex) ||
        questionIndex <= 0
    ) {
        list.innerHTML = `
            <article class="student-exam-card student-exam-card-joined">
                <div class="student-exam-card-header">
                    <span class="student-exam-status">
                        Đang diễn ra
                    </span>
                </div>

                <h3>
                    Bài kiểm tra đã bắt đầu
                </h3>

                <p class="empty-note">
                    Đang chờ Admin mở câu hỏi đầu tiên...
                </p>
            </article>
        `;

        return;
    }

    const isQuestionActive =
        liveState === "ACTIVE";
    
    const questionEndsAt =
        realtimeState.questionEndsAt ||
        realtimeState.question_ends_at ||
        "";

    const questionEndsAtMilliseconds =
        Date.parse(questionEndsAt);

    const isWithinAnswerTime =
        !Number.isFinite(
            questionEndsAtMilliseconds
        ) ||
        Date.now() <
            questionEndsAtMilliseconds;

    const canSubmitAnswer =
        isQuestionActive &&
        isWithinAnswerTime;

    const selectedAnswer =
        getStoredStudentExamAnswer(
            examId,
            questionId
        );

    list.innerHTML = `
        <article class="student-exam-card student-exam-card-open">
            <div class="student-exam-card-header">
                <span class="student-exam-type">
                    Câu ${questionIndex}/${totalQuestions}
                </span>

                <span class="student-exam-status">
                    ${
                        isQuestionActive
                            ? "Đang trả lời"
                            : "Đã khóa"
                    }
                </span>
            </div>

            <h3>
                Câu hỏi số ${questionIndex}
            </h3>

            <p class="empty-note">
                Nội dung câu hỏi được trình chiếu
                trên màn hình chung.
            </p>

            <div class="student-exam-grid">
                ${["A", "B", "C", "D"]
                    .map(answer => `
                        <button
                            type="button"
                            class="student-exam-join-button student-exam-answer-button"
                            data-exam-id="${examId}"
                            data-question-id="${questionId}"
                            data-answer="${answer}"
                            data-question-ends-at="${escapeStudentExamHtml(
                                questionEndsAt
                            )}"
                            onclick="submitStudentExamAnswerFromApi(this)"
                            ${canSubmitAnswer ? "" : "disabled"}
                            ${
                                selectedAnswer === answer
                                    ? 'style="background:#2563eb;color:#ffffff;border-color:#2563eb;"'
                                    : ""
                            }
                        >
                            ${answer}
                        </button>
                    `)
                    .join("")}
            </div>

            <p
                class="empty-note"
                id="studentExamAnswerStatus"
            >
                ${
                    canSubmitAnswer
                        ? selectedAnswer
                            ? `Đáp án đã chọn: ${selectedAnswer}. Bạn có thể đổi khi câu hỏi còn mở.`
                            : "Chọn một đáp án A, B, C hoặc D."
                        : "Câu hỏi hiện đã khóa."
                }
            </p>
        </article>
    `;

    scheduleStudentExamAnswerLock(
        canSubmitAnswer
            ? questionEndsAt
            : ""
    );
}


async function enterStudentExamRealtime(
    examId,
    button = null
) {
    const normalizedExamId =
        Number(examId);

    if (
        !Number.isInteger(
            normalizedExamId
        ) ||
        normalizedExamId <= 0
    ) {
        window.alert(
            "ID bài kiểm tra không hợp lệ."
        );

        return;
    }

    const originalButtonText =
        button?.innerText || "";

    if (button) {
        button.disabled = true;
        button.innerText =
            "Đang kết nối...";
    }

    try {
        activeStudentExamId =
            normalizedExamId;

        const result =
            await emitStudentExamJoin(
                normalizedExamId
            );

        renderStudentExamRealtimeView(
            normalizedExamId,
            result
        );
    } catch (error) {
        console.error(
            "Enter Student Exam realtime error:",
            error
        );

        if (button) {
            button.disabled = false;
            button.innerText =
                originalButtonText;
        }

        window.alert(
            error.message ||
            "Không thể kết nối đến bài kiểm tra."
        );
    }
}

function renderStudentExams(exams) {
    const list =
        document.getElementById(
            "studentExamList"
        );

    if (!list) {
        return;
    }

    const validExams = exams
        .filter(exam => {
            const examId =
                Number(exam?.id);

            return (
                Number.isInteger(examId) &&
                examId > 0
            );
        })
        .sort((firstExam, secondExam) => {
            const typeOrder = {
                PRE_TEST: 1,
                FINAL_TEST: 2
            };

            const firstTypeOrder =
                typeOrder[firstExam.type] || 99;

            const secondTypeOrder =
                typeOrder[secondExam.type] || 99;

            if (
                firstTypeOrder !==
                secondTypeOrder
            ) {
                return (
                    firstTypeOrder -
                    secondTypeOrder
                );
            }

            return (
                Number(firstExam.id) -
                Number(secondExam.id)
            );
        });

    if (validExams.length === 0) {
        list.innerHTML = `
            <p class="empty-note">
                Hiện chưa có bài kiểm tra nào được mở cho học viên.
            </p>
        `;

        return;
    }

    list.innerHTML = `
        <div class="student-exam-grid">
            ${validExams.map(exam => {
                const examId =
                    Number(exam.id);

                const status =
                    String(
                        exam.status || ""
                    ).toUpperCase();

                const hasJoinedWaitingRoom =
                    exam.alreadyJoined === true ||
                    Boolean(exam.waitingRoom);

                const isWaitingForStart =
                    status ===
                        "WAITING_ROOM_OPEN" &&
                    hasJoinedWaitingRoom;

                const canJoin =
                    status ===
                        "WAITING_ROOM_OPEN" &&
                    !hasJoinedWaitingRoom;
                const isInProgress =
                    status === "IN_PROGRESS";

                const canOpenExam =
                    canJoin ||
                    isWaitingForStart ||
                    isInProgress;

                return `
                    <article
                        class="student-exam-card ${
                            isWaitingForStart
                                ? "student-exam-card-joined"
                                : canOpenExam
                                    ? "student-exam-card-open"
                                    : "student-exam-card-disabled"
                        }"
                    >
                        <div class="student-exam-card-header">
                            <span class="student-exam-type">
                                ${escapeStudentExamHtml(
                                    getStudentExamTypeLabel(
                                        exam.type
                                    )
                                )}
                            </span>

                            <span class="student-exam-status">
                                ${escapeStudentExamHtml(
                                    getStudentExamStatusLabel(
                                        status
                                    )
                                )}
                            </span>
                        </div>

                        <h3>
                            ${escapeStudentExamHtml(
                                exam.name
                            )}
                        </h3>

                        <div class="student-exam-information">
                            <p>
                                <strong>Thời gian:</strong>
                                ${escapeStudentExamHtml(
                                    formatStudentExamDate(
                                        exam.scheduledStartAt
                                    )
                                )}
                            </p>

                            <p>
                                <strong>Số câu:</strong>
                                ${Number(
                                    exam.totalQuestions
                                ) || 0}
                            </p>

                            <p>
                                <strong>Thời gian mỗi câu:</strong>
                                ${Number(
                                    exam.timePerQuestionSeconds ??
                                    exam.timePerQuestion
                                ) || 0}
                                giây
                            </p>
                        </div>

                        <button
                            type="button"
                            class="student-exam-join-button"
                            data-exam-id="${examId}"
                            data-exam-status="${escapeStudentExamHtml(status)}"
                            ${canOpenExam ? "" : "disabled"}
                        >
                            ${escapeStudentExamHtml(
                                isInProgress
                                    ? "Vào làm bài"
                                    : isWaitingForStart
                                        ? "Trở lại phòng chờ"
                                        : getStudentExamActionLabel(
                                            status
                                        )
                            )}
                        </button>
                    </article>
                `;
            }).join("")}
        </div>
    `;

    list
        .querySelectorAll(
            ".student-exam-join-button:not([disabled])"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    enterStudentExamRealtime(
                        button.dataset.examId,
                        button
                    );
                }
            );
        });
}


async function joinStudentExamWaitingRoom(
    examId,
    button
) {
    const normalizedExamId =
        Number(examId);

    if (
        !Number.isInteger(
            normalizedExamId
        ) ||
        normalizedExamId <= 0
    ) {
        window.alert(
            "ID bài kiểm tra không hợp lệ."
        );

        return;
    }

    const token =
        localStorage.getItem(
            "accessToken"
        );

    if (!token) {
        logoutDemo();
        return;
    }

    const originalButtonText =
        button.innerText;

    button.disabled = true;
    button.innerText =
        "Đang vào phòng chờ...";

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/exams/${encodeURIComponent(normalizedExamId)}/waiting-room`,
            {
                method: "POST",

                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const result =
            await response.json();

        if (
            response.status === 401
        ) {
            logoutDemo();
            return;
        }

        if (
            !response.ok ||
            !result.success
        ) {
            const messagesByCode = {
                INVALID_EXAM_ID:
                    "ID bài kiểm tra không hợp lệ.",

                EXAM_NOT_FOUND:
                    "Không tìm thấy bài kiểm tra.",

                EXAM_NOT_IN_ACTIVE_SEASON:
                    "Bài kiểm tra không thuộc mùa TKH đang hoạt động.",

                EXAM_ALREADY_COMPLETED:
                    "Bạn đã hoàn thành bài kiểm tra này.",

                EXAM_WAITING_ROOM_NOT_OPEN:
                    "Phòng chờ hiện chưa được mở.",

                MEMBER_NOT_FOUND:
                    "Không tìm thấy hồ sơ học viên.",

                ACTIVE_MEMBERSHIP_NOT_FOUND:
                    "Không tìm thấy thông tin tham gia mùa TKH hiện tại.",

                INTERNAL_SERVER_ERROR:
                    "Máy chủ gặp lỗi khi vào phòng chờ."
            };

            throw new Error(
                messagesByCode[result.code] ||
                "Không thể vào phòng chờ."
            );
        }

        button.innerText =
            "Đang chờ Admin bắt đầu";

        button.classList.add(
            "student-exam-joined-button"
        );

        window.alert(
            result.alreadyJoined
                ? "Bạn đã ở trong phòng chờ của bài kiểm tra này."
                : "Bạn đã vào phòng chờ thành công."
        );
    } catch (error) {
        console.error(
            "Join Student exam waiting room error:",
            error
        );

        button.disabled = false;
        button.innerText =
            originalButtonText;

        window.alert(
            error.message ||
            "Không thể kết nối đến phòng chờ."
        );
    }
}


async function loadStudentExamsFromApi() {
    const list =
        document.getElementById(
            "studentExamList"
        );

    if (!list) {
        return;
    }

    const token =
        localStorage.getItem(
            "accessToken"
        );

    if (!token) {
        logoutDemo();
        return;
    }

    list.innerHTML = `
        <p class="empty-note">
            Đang tải thông tin bài kiểm tra...
        </p>
    `;

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/exams`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        const result =
            await response.json();

        if (
            response.status === 401
        ) {
            logoutDemo();
            return;
        }

        if (
            !response.ok ||
            !result.success
        ) {
            const messagesByCode = {
                MEMBER_NOT_FOUND:
                    "Không tìm thấy hồ sơ học viên.",

                ACTIVE_SEASON_NOT_FOUND:
                    "Không tìm thấy mùa TKH đang hoạt động.",

                ACTIVE_MEMBERSHIP_NOT_FOUND:
                    "Bạn chưa tham gia mùa TKH hiện tại.",

                MEMBERSHIP_NOT_IN_ACTIVE_SEASON:
                    "Thông tin học viên không thuộc mùa TKH hiện tại.",

                INTERNAL_SERVER_ERROR:
                    "Máy chủ gặp lỗi khi tải bài kiểm tra."
            };

            throw new Error(
                messagesByCode[result.code] ||
                "Không thể tải danh sách bài kiểm tra."
            );
        }

        const exams =
            Array.isArray(result.exams)
                ? result.exams
                : Array.isArray(
                    result.data?.exams
                )
                    ? result.data.exams
                    : [];

        renderStudentExams(exams);
    } catch (error) {
        console.error(
            "Load Student exams error:",
            error
        );

        list.innerHTML = `
            <p
                class="empty-note"
                style="color: red;"
            >
                ${escapeStudentExamHtml(
                    error.message ||
                    "Không thể tải danh sách bài kiểm tra."
                )}
            </p>
        `;
    }
}


document.addEventListener(
    "DOMContentLoaded",
    loadStudentExamsFromApi
);
