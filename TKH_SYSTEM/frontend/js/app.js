const API_BASE_URL =
    "https://glossary-sydney-sixth-enquiries.trycloudflare.com";

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

/*
 * =========================================================
 * LOGIN SUCCESS ANIMATION
 * =========================================================
 */

function getLoginRedirectUrl(currentUser) {

    if (currentUser.mustChangePassword) {
        return "change-password.html";
    }

    if (currentUser.role === "admin") {
        return "admin-dashboard.html";
    }

    return "attendance.html";
}


function showLoginSuccessAnimation(
    currentUser,
    redirectUrl
) {
    const overlay =
        document.getElementById(
            "loginSuccessOverlay"
        );

    const loginContainer =
        document.querySelector(
            ".pastel-login"
        );

    const welcomeText =
        document.getElementById(
            "loginSuccessWelcome"
        );


    /*
     * Nếu vì lý do nào đó HTML animation
     * không tồn tại, vẫn redirect bình thường.
     */
    if (!overlay) {
        window.location.href =
            redirectUrl;

        return;
    }


    if (welcomeText) {

        const displayName =
            currentUser.fullName ||
            currentUser.tkhCode ||
            currentUser.username ||
            "bạn";

        welcomeText.innerText =
            `Chào mừng ${displayName}`;
    }


    if (loginContainer) {
        loginContainer.classList.add(
            "login-is-success"
        );
    }


    overlay.classList.add(
        "is-visible"
    );

    overlay.setAttribute(
        "aria-hidden",
        "false"
    );


    /*
     * Animation chỉ chạy trên Frontend.
     *
     * Không gọi thêm API.
     * Không query thêm Database.
     *
     * 850 ms đủ để thấy animation
     * nhưng không làm cảm giác login chậm.
     */
    window.setTimeout(
        () => {
            window.location.href =
                redirectUrl;
        },
        850
    );
}


/*
 * =========================================================
 * LOGIN
 * =========================================================
 */

async function loginDemo() {

    const usernameInput =
        document.getElementById(
            "username"
        );

    const passwordInput =
        document.getElementById(
            "password"
        );

    const message =
        document.getElementById(
            "loginMessage"
        );

    const loginButton =
        document.getElementById(
            "loginButton"
        );

    const loginButtonText =
        document.getElementById(
            "loginButtonText"
        );


    const username =
        usernameInput
            .value
            .trim();

    const password =
        passwordInput.value;


    if (!username || !password) {

        message.style.color =
            "red";

        message.innerText =
            "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.";

        return;
    }


    /*
     * Chặn double click / spam login.
     */
    if (
        loginButton &&
        loginButton.disabled
    ) {
        return;
    }


    if (loginButton) {

        loginButton.disabled =
            true;

        loginButton.classList.add(
            "is-loading"
        );
    }


    if (loginButtonText) {
        loginButtonText.innerText =
            "Đang đăng nhập...";
    }


    message.style.color =
        "#7a6d62";

    message.innerText =
        "Đang kết nối đến hệ thống...";


    try {

        /*
         * Backend request vẫn giữ nguyên.
         * Không thêm request mới.
         */
        const response =
            await fetch(
                `${API_BASE_URL}/api/auth/login`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            username,
                            password
                        })
                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            message.style.color =
                "red";

            message.innerText =
                result?.error?.message ||
                "Đăng nhập không thành công.";

            return;
        }


        const backendUser =
            result.data.user;


        const currentUser = {

            id:
                backendUser.id,

            memberId:
                backendUser.memberId,

            username:
                backendUser.username,

            role:
                String(
                    backendUser.role
                ).toLowerCase(),

            fullName:
                backendUser.fullName ||
                "Quản trị viên TKH",

            tkhCode:
                backendUser.tkhCode,

            groupName:
                null,

            mustChangePassword:
                backendUser
                    .mustChangePassword
        };


        /*
         * QUAN TRỌNG:
         *
         * Token + user vẫn được lưu
         * TRƯỚC animation.
         */
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
            JSON.stringify(
                currentUser
            )
        );


        message.style.color =
            "#588152";

        message.innerText =
            "Đăng nhập thành công!";


        if (loginButton) {
            loginButton.classList.remove(
                "is-loading"
            );
        }


        if (loginButtonText) {
            loginButtonText.innerText =
                "Đã đăng nhập ✓";
        }


        /*
         * Xác định trang cần đi tới
         * giống hệt logic cũ.
         */
        const redirectUrl =
            getLoginRedirectUrl(
                currentUser
            );


        /*
         * Chỉ sau khi Backend thành công
         * mới chạy hiệu ứng.
         */
        showLoginSuccessAnimation(
            currentUser,
            redirectUrl
        );

    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        message.style.color =
            "red";

        message.innerText =
            "Không thể kết nối đến hệ thống. Vui lòng thử lại.";

    } finally {

        /*
         * Chỉ bật lại button nếu
         * chưa bắt đầu animation thành công.
         */
        const overlay =
            document.getElementById(
                "loginSuccessOverlay"
            );


        const successAnimationRunning =
            overlay?.classList.contains(
                "is-visible"
            );


        if (
            !successAnimationRunning
        ) {

            if (loginButton) {

                loginButton.disabled =
                    false;

                loginButton.classList.remove(
                    "is-loading"
                );
            }


            if (loginButtonText) {

                loginButtonText.innerText =
                    "Đăng nhập";
            }
        }
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
            points: 0,
            note: "Điểm danh tĩnh nguyện"
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
let attendanceCheckinInProgress = false;


async function loadAttendancePageData() {
    const sessionText =
        document.getElementById(
            "currentAttendanceSessionText"
        );

    const radiusText =
        document.getElementById(
            "checkinRadiusText"
        );

    const activeWindow =
        document.getElementById(
            "activeCheckinWindow"
        );

    const checkinButton =
        document.getElementById(
            "attendanceCheckinButton"
        );

    const distanceElement =
        document.getElementById(
            "distance"
        );

    /*
     * Trạng thái mặc định khi vừa mở trang
     * hoặc khi đang tải lại dữ liệu từ Backend.
     */
    if (checkinButton) {
        checkinButton.disabled = true;
        checkinButton.innerText =
            "Điểm danh";
    }

    if (
        distanceElement &&
        !distanceElement.innerText.trim()
    ) {
        distanceElement.innerText =
            "Chưa kiểm tra";
    }

    if (
        !sessionText &&
        !radiusText &&
        !activeWindow
    ) {
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
        const response =
            await fetch(
                `${API_BASE_URL}/api/attendance/current-session`,
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
            currentAttendanceSessionApi =
                null;

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

            if (checkinButton) {
                checkinButton.disabled = true;
                checkinButton.innerText =
                    "Điểm danh";
                checkinButton.title =
                    "Hiện chưa có buổi học đang mở.";
            }

            return;
        }

        if (
            !response.ok ||
            !result.success
        ) {
            currentAttendanceSessionApi =
                null;

            if (sessionText) {
                sessionText.innerText =
                    "Không thể tải thông tin buổi học.";
            }

            if (radiusText) {
                radiusText.innerText =
                    result?.error?.message ||
                    "Không thể tải cấu hình điểm danh.";
            }

            if (activeWindow) {
                activeWindow.innerText =
                    "Không thể tải trạng thái điểm danh.";
            }

            if (checkinButton) {
                checkinButton.disabled = true;
                checkinButton.innerText =
                    "Điểm danh";
            }

            return;
        }

        const session =
            result.data.session;

        currentAttendanceSessionApi =
            session;

        currentCheckinRadiusMeters =
            Number(
                session.attendanceRadiusM
            ) || 200;

        if (
            session.location?.latitude !==
                null &&
            session.location?.latitude !==
                undefined
        ) {
            CHURCH_LOCATION.lat =
                Number(
                    session.location.latitude
                );
        }

        if (
            session.location?.longitude !==
                null &&
            session.location?.longitude !==
                undefined
        ) {
            CHURCH_LOCATION.lng =
                Number(
                    session.location.longitude
                );
        }

        const startDate =
            parseSqlLocalDateTime(
                session.scheduledStartAt
            );

        const dateText =
            startDate
                ? startDate.toLocaleDateString(
                    "vi-VN"
                )
                : "Chưa có ngày học";

        const startTime =
            startDate
                ? startDate.toLocaleTimeString(
                    "vi-VN",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                )
                : "";

        if (sessionText) {
            sessionText.innerText =
                `${session.name} · ${dateText}` +
                (
                    startTime
                        ? ` · ${startTime}`
                        : ""
                );
        }

        if (radiusText) {
            radiusText.innerText =
                "Chỉ điểm danh được khi bạn ở trong bán kính " +
                currentCheckinRadiusMeters +
                " m từ " +
                (
                    session.location?.name ||
                    "Nhà Thờ Nguyễn Tri Phương"
                ) +
                ".";
        }

        const activeAttendanceWindow =
            session.activeAttendanceWindow ||
            null;

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
                checkinButton.disabled =
                    false;

                checkinButton.innerText =
                    "Điểm danh";

                checkinButton.title =
                    "";
            }
        } else {
            if (activeWindow) {
                activeWindow.innerText =
                    "Hiện chưa mở khung điểm danh";
            }

            if (checkinButton) {
                checkinButton.disabled =
                    true;

                checkinButton.innerText =
                    "Điểm danh";

                checkinButton.title =
                    "Hiện chưa mở khung điểm danh";
            }
        }
    } catch (error) {
        console.error(
            "Load attendance session error:",
            error
        );

        currentAttendanceSessionApi =
            null;

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

        if (checkinButton) {
            checkinButton.disabled =
                true;

            checkinButton.innerText =
                "Điểm danh";
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

function getBestGpsPositionDemo({
    timeoutMs = 12000,
    desiredAccuracyM = 50
} = {}) {
    return new Promise((resolve, reject) => {
        let bestPosition = null;
        let watchId = null;
        let finished = false;

        const finish = (position, error = null) => {
            if (finished) {
                return;
            }

            finished = true;

            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }

            clearTimeout(timeoutId);

            if (position) {
                resolve(position);
            } else {
                reject(
                    error ||
                    new Error(
                        "Không thể lấy vị trí GPS."
                    )
                );
            }
        };

        const timeoutId = setTimeout(() => {
            if (bestPosition) {
                finish(bestPosition);
                return;
            }

            const timeoutError = new Error(
                "Quá thời gian lấy vị trí GPS."
            );

            timeoutError.code = 3;

            finish(null, timeoutError);
        }, timeoutMs);

        watchId =
            navigator.geolocation.watchPosition(
                position => {
                    const accuracy =
                        Number(
                            position.coords.accuracy
                        );

                    if (
                        !bestPosition ||
                        accuracy <
                            Number(
                                bestPosition.coords.accuracy
                            )
                    ) {
                        bestPosition = position;
                    }

                    if (
                        Number.isFinite(accuracy) &&
                        accuracy <= desiredAccuracyM
                    ) {
                        finish(position);
                    }
                },
                error => {
                    /*
                     * Nếu đã có ít nhất một mẫu GPS,
                     * vẫn có thể dùng mẫu tốt nhất.
                     */
                    if (bestPosition) {
                        finish(bestPosition);
                        return;
                    }

                    finish(null, error);
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: timeoutMs
                }
            );
    });
}

async function checkInDemo() {
    if (attendanceCheckinInProgress) {
        return;
    }

    attendanceCheckinInProgress = true;

    const gpsMessage =
        document.getElementById(
            "gpsMessage"
        );

    const statusCard =
        document.getElementById(
            "attendanceStatus"
        );

    const checkinButton =
        document.getElementById(
            "attendanceCheckinButton"
        );

    if (checkinButton) {
        checkinButton.disabled = true;
        checkinButton.innerText =
            "Đang kiểm tra vị trí...";
    }

    try {
        if (!currentAttendanceSessionApi) {
            statusCard.className =
                "status-card status-fail";

            statusCard.innerText =
                "Chưa mở điểm danh";

            gpsMessage.style.color =
                "red";

            gpsMessage.innerText =
                "Hiện chưa có buổi học nào đang mở điểm danh.";

            return;
        }

        gpsMessage.style.color =
            "#374151";

        gpsMessage.innerText =
            "Đang lấy vị trí GPS của bạn...";

        if (!window.isSecureContext) {
            gpsMessage.style.color =
                "red";

            gpsMessage.innerText =
                "Trình duyệt đang chặn GPS vì website chưa chạy bằng HTTPS. Vui lòng dùng link HTTPS khi chạy thật.";

            return;
        }

        if (!navigator.geolocation) {
            gpsMessage.style.color =
                "red";

            gpsMessage.innerText =
                "Trình duyệt của bạn không hỗ trợ GPS.";

            return;
        }

        gpsMessage.style.color =
            "#374151";

        gpsMessage.innerText =
            "Đang dò vị trí GPS chính xác...";

        const position =
        await getBestGpsPositionDemo({
            timeoutMs: 7000,
            desiredAccuracyM: 60
        });

        const currentLat =
            Number(
                position.coords.latitude
            );

        const currentLng =
            Number(
                position.coords.longitude
            );

        const accuracy =
            Number(
                position.coords.accuracy
            );

        const distance =
            calculateDistance(
                currentLat,
                currentLng,
                CHURCH_LOCATION.lat,
                CHURCH_LOCATION.lng
            );

        const distanceElement =
            document.getElementById(
                "distance"
            );

        if (distanceElement) {
            distanceElement.innerText =
                formatDistance(distance);
        }

        if (!Number.isFinite(accuracy)) {
            statusCard.className =
                "status-card status-fail";

            statusCard.innerText =
                "GPS không hợp lệ";

            gpsMessage.style.color =
                "red";

            gpsMessage.innerText =
                "Điện thoại không trả về độ chính xác GPS hợp lệ. Vui lòng bật vị trí chính xác và thử lại.";

            return;
        }

        if (accuracy > 100) {
            statusCard.className =
                "status-card status-fail";

            statusCard.innerText =
                "GPS chưa đủ chính xác";

            gpsMessage.style.color =
                "red";

            gpsMessage.innerText =
                `Độ chính xác hiện tại khoảng ${Math.round(
                    accuracy
                )} m. Hãy bật Vị trí chính xác, đứng gần cửa hoặc ngoài trời rồi thử lại.`;

            return;
        }

        if (
            distance >
            currentCheckinRadiusMeters
        ) {
            statusCard.className =
                "status-card status-fail";

            statusCard.innerText =
                "Ngoài khu vực điểm danh";

            gpsMessage.style.color =
                "red";

            gpsMessage.innerText =
                `Hệ thống đang xác định bạn cách địa điểm khoảng ${formatDistance(
                    distance
                )}, với độ chính xác khoảng ${Math.round(
                    accuracy
                )} m. Hãy kiểm tra GPS và thử lại.`;

            return;
        }

        statusCard.className =
            "status-card status-success";

        statusCard.innerText =
            "Đang lưu điểm danh";

        gpsMessage.style.color =
            "#374151";

        gpsMessage.innerText =
            "Đã xác định đúng khu vực. Đang lưu điểm danh...";

        const checkinResult =
            await saveAttendanceDemo({
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

            gpsMessage.style.color =
                "red";

            gpsMessage.innerText =
                checkinResult.message;

            return;
        }

        statusCard.className =
            "status-card status-success";

        statusCard.innerText =
            "Điểm danh thành công";

        gpsMessage.style.color =
            "green";

        gpsMessage.innerText =
            "✅ " +
            checkinResult.message;

        await loadAttendanceHistoryDemo();
    } catch (error) {
        console.error(
            "Get GPS position error:",
            error
        );

        gpsMessage.style.color =
            "red";

        if (error.code === 1) {
            gpsMessage.innerHTML = `
                ❌ Không thể truy cập vị trí.<br>
                Vui lòng cho phép quyền vị trí chính xác rồi thử lại.
            `;

            openGpsHelpModal();
        } else if (error.code === 2) {
            gpsMessage.innerText =
                "Không thể xác định vị trí. Hãy bật GPS, Wi-Fi hoặc dữ liệu di động rồi thử lại.";
        } else if (error.code === 3) {
            gpsMessage.innerText =
                "GPS mất quá nhiều thời gian để xác định vị trí. Hãy đứng gần cửa hoặc ngoài trời rồi thử lại.";
        } else {
            gpsMessage.innerText =
                error.message ||
                "Không thể lấy vị trí. Vui lòng thử lại.";
        }
    } finally {
        attendanceCheckinInProgress =
            false;

        /*
         * Hỏi lại Backend để cập nhật:
         * - Buổi học hiện tại
         * - Khung điểm danh đang mở
         * - Trạng thái bật/tắt của nút
         */
        await loadAttendancePageData();

        if (checkinButton) {
            checkinButton.innerText =
                "Điểm danh";
        }
    }
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
                    "attendance.html";
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


function getManualScoreTypeLabelDemo(
    scoreType
) {
    const labels = {
        ATTENDANCE_ADJUSTMENT:
            "Điểm danh thủ công",

        PARTICIPATION:
            "Phát biểu",

        PRE_TEST:
            "Pre-test",

        FINAL_TEST:
            "Final Test"
    };

    return (
        labels[scoreType] ||
        scoreType ||
        "Không xác định"
    );
}


function resetManualScoreImportDemo() {
    manualScoreImportValidatedFile = null;
    manualScoreImportValidationData = null;

    const message =
        document.getElementById(
            "manualScoreImportMessage"
        );

    const summary =
        document.getElementById(
            "manualScoreImportSummary"
        );

    const errors =
        document.getElementById(
            "manualScoreImportErrors"
        );

    const preview =
        document.getElementById(
            "manualScoreImportPreview"
        );

    const previewBody =
        document.getElementById(
            "manualScoreImportPreviewBody"
        );

    const importButton =
        document.getElementById(
            "importManualScoreFileBtn"
        );

    if (message) {
        message.innerText = "";
        message.style.color = "";
    }

    if (summary) {
        summary.classList.add("hidden");
        summary.innerHTML = "";
    }

    if (errors) {
        errors.classList.add("hidden");
        errors.innerHTML = "";
    }

    if (preview) {
        preview.classList.add("hidden");
    }

    if (previewBody) {
        previewBody.innerHTML = `
            <tr>
                <td colspan="10">
                    Chưa có dữ liệu xem trước.
                </td>
            </tr>
        `;
    }

    if (importButton) {
        importButton.disabled = true;
    }
}


function renderManualScoreImportErrorsDemo(
    errorItems
) {
    const container =
        document.getElementById(
            "manualScoreImportErrors"
        );

    if (!container) {
        return;
    }

    const errors =
        Array.isArray(errorItems)
            ? errorItems
            : [];

    if (errors.length === 0) {
        container.classList.add("hidden");
        container.innerHTML = "";
        return;
    }

    container.classList.remove("hidden");

    container.innerHTML = `
        <h3 style="color: red;">
            Các dòng cần chỉnh sửa
        </h3>

        <ul>
            ${
                errors
                    .map(item => `
                        <li>
                            <strong>
                                Dòng ${Number(item.row) || "?"}:
                            </strong>

                            ${escapeHtml(
                                item.message ||
                                "Dữ liệu không hợp lệ."
                            )}
                        </li>
                    `)
                    .join("")
            }
        </ul>
    `;
}


function renderManualScoreImportPreviewDemo(
    validationData
) {
    const summaryContainer =
        document.getElementById(
            "manualScoreImportSummary"
        );

    const previewContainer =
        document.getElementById(
            "manualScoreImportPreview"
        );

    const previewBody =
        document.getElementById(
            "manualScoreImportPreviewBody"
        );

    if (
        !summaryContainer ||
        !previewContainer ||
        !previewBody
    ) {
        return;
    }

    const summary =
        validationData?.summary || {};

    const preview =
        Array.isArray(
            validationData?.preview
        )
            ? validationData.preview
            : [];

    summaryContainer.classList.remove(
        "hidden"
    );

    summaryContainer.innerHTML = `
        <div class="question-card">
            <p>
                <strong>Tổng số dòng hợp lệ:</strong>
                ${Number(summary.validRows) || preview.length}
            </p>

            <p>
                <strong>Điểm danh:</strong>
                ${Number(summary.attendanceRows) || 0}
            </p>

            <p>
                <strong>Phát biểu:</strong>
                ${Number(summary.participationRows) || 0}
            </p>

            <p>
                <strong>Pre-test:</strong>
                ${Number(summary.preTestRows) || 0}
            </p>

            <p>
                <strong>Final Test:</strong>
                ${Number(summary.finalTestRows) || 0}
            </p>
        </div>
    `;

    previewContainer.classList.remove(
        "hidden"
    );

    if (preview.length === 0) {
        previewBody.innerHTML = `
            <tr>
                <td colspan="10">
                    Không có dữ liệu xem trước.
                </td>
            </tr>
        `;

        return;
    }

    previewBody.innerHTML =
        preview.map(item => {
            const examName =
                item.exam?.name ||
                "—";

            return `
                <tr>
                    <td>
                        ${Number(item.rowNumber) || "—"}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.member?.tkhCode ||
                            item.tkhCode ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.member?.fullName ||
                            "—"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.member?.groupName ||
                            "Chưa phân nhóm"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            getManualScoreTypeLabelDemo(
                                item.scoreType
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHtml(examName)}
                    </td>

                    <td>
                        ${
                            Number(item.points) > 0
                                ? `+${Number(item.points)}`
                                : Number(item.points)
                        }
                    </td>

                    <td>
                        ${Number(item.currentPoints) || 0}
                    </td>

                    <td>
                        ${Number(item.projectedPoints) || 0}
                        /
                        ${Number(item.maximumPoints) || 0}
                    </td>

                    <td>
                        ${escapeHtml(
                            item.description ||
                            ""
                        )}
                    </td>
                </tr>
            `;
        }).join("");
}

async function manualScoreImportApiRequestDemo(
    endpoint,
    file
) {
    const token =
        localStorage.getItem(
            "accessToken"
        );

    if (!token) {
        logoutDemo();

        throw new Error(
            "Phiên đăng nhập không hợp lệ."
        );
    }

    const formData =
        new FormData();

    formData.append(
        "file",
        file
    );

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            method: "POST",

            headers: {
                Authorization:
                    `Bearer ${token}`
            },

            body:
                formData
        }
    );

    let result = null;

    try {
        result =
            await response.json();
    } catch (error) {
        result = null;
    }

    if (response.status === 401) {
        logoutDemo();

        throw new Error(
            "Phiên đăng nhập đã hết hạn."
        );
    }

    if (response.status === 403) {
        throw new Error(
            result?.error?.message ||
            "Bạn không có quyền import điểm."
        );
    }

    if (
        !response.ok ||
        result?.success !== true
    ) {
        const apiError =
            new Error(
                result?.error?.message ||
                "Không thể xử lý file Excel."
            );

        apiError.status =
            response.status;

        apiError.code =
            result?.error?.code ||
            null;

        apiError.details =
            result?.error?.details ||
            null;

        throw apiError;
    }

    return result.data;
}

async function validateManualScoreFileDemo() {
    const fileInput =
        document.getElementById(
            "manualScoreExcelFile"
        );

    const message =
        document.getElementById(
            "manualScoreImportMessage"
        );

    const validateButton =
        document.getElementById(
            "validateManualScoreFileBtn"
        );

    const importButton =
        document.getElementById(
            "importManualScoreFileBtn"
        );

    if (
        !fileInput ||
        !fileInput.files ||
        fileInput.files.length === 0
    ) {
        message.style.color = "red";
        message.innerText =
            "Vui lòng chọn file Excel.";

        return;
    }

    const file =
        fileInput.files[0];

    manualScoreImportValidatedFile = null;
    manualScoreImportValidationData = null;

    if (importButton) {
        importButton.disabled = true;
    }

    renderManualScoreImportErrorsDemo(
        []
    );

    message.style.color = "#555";
    message.innerText =
        "Đang kiểm tra file Excel...";

    if (validateButton) {
        validateButton.disabled = true;
        validateButton.innerText =
            "Đang kiểm tra...";
    }

    try {
        const data =
            await manualScoreImportApiRequestDemo(
                "/api/scores/admin/import/validate",
                file
            );

        manualScoreImportValidatedFile =
            file;

        manualScoreImportValidationData =
            data;

        renderManualScoreImportPreviewDemo(
            data
        );

        message.style.color = "green";
        message.innerText =
            data.message ||
            "File hợp lệ. Bạn có thể tiến hành import.";

        if (importButton) {
            importButton.disabled = false;
        }
    } catch (error) {
        console.error(
            "Validate manual score file error:",
            error
        );

        manualScoreImportValidatedFile =
            null;

        manualScoreImportValidationData =
            null;

        renderManualScoreImportErrorsDemo(
            error.details?.errors
        );

        message.style.color = "red";

        if (
            error.code ===
            "MANUAL_SCORE_IMPORT_ALREADY_COMPLETED"
        ) {
            message.innerText =
                "File này đã được import trước đó. Hệ thống đã chặn import trùng.";
        } else {
            message.innerText =
                error.message ||
                "Không thể kiểm tra file Excel.";
        }
    } finally {
        if (validateButton) {
            validateButton.disabled = false;
            validateButton.innerText =
                "Kiểm tra file";
        }
    }
}

async function importManualScoreFileDemo() {
    const fileInput =
        document.getElementById(
            "manualScoreExcelFile"
        );

    const message =
        document.getElementById(
            "manualScoreImportMessage"
        );

    const validateButton =
        document.getElementById(
            "validateManualScoreFileBtn"
        );

    const importButton =
        document.getElementById(
            "importManualScoreFileBtn"
        );

    const selectedFile =
        fileInput?.files?.[0] ||
        null;

    if (
        !manualScoreImportValidatedFile ||
        !manualScoreImportValidationData ||
        !selectedFile
    ) {
        message.style.color = "red";
        message.innerText =
            "Vui lòng kiểm tra file trước khi import.";

        return;
    }

    /*
     * Đảm bảo Admin không đổi sang file khác
     * sau khi vừa validate.
     */
    if (
        selectedFile !==
        manualScoreImportValidatedFile
    ) {
        resetManualScoreImportDemo();

        message.style.color = "red";
        message.innerText =
            "File đã thay đổi. Vui lòng kiểm tra lại file.";

        return;
    }

    const confirmed =
        confirm(
            `Bạn có chắc muốn import ${
                manualScoreImportValidationData
                    ?.summary
                    ?.validRows ||
                manualScoreImportValidationData
                    ?.preview
                    ?.length ||
                0
            } giao dịch điểm không?`
        );

    if (!confirmed) {
        return;
    }

    if (manualScoreImportInProgress) {
        return;
    }

    manualScoreImportInProgress = true;

    message.style.color = "#555";
    message.innerText =
        "Đang import điểm...";

    if (validateButton) {
        validateButton.disabled = true;
    }

    if (importButton) {
        importButton.disabled = true;
        importButton.innerText =
            "Đang import...";
    }

    try {
        const data =
            await manualScoreImportApiRequestDemo(
                "/api/scores/admin/import",
                selectedFile
            );

        const importedRows =
            Number(
                data.summary?.importedRows
            ) || 0;

        const batchId =
            data.batch?.id;

        message.style.color = "green";

        message.innerText =
            `${data.message || "Import điểm thành công."}` +
            (
                batchId
                    ? ` Batch #${batchId}.`
                    : ""
            );

        /*
         * Làm mới lịch sử và thống kê điểm.
         */
        adminScoreHistoryApiPromise = null;
        groupRankingApiCache = null;

        await Promise.all([
            loadAdminScoreHistoryDemo(true),
            loadAdminScoreSummaryDemo(true)
        ]);

        if (fileInput) {
            fileInput.value = "";
        }

        manualScoreImportValidatedFile = null;
        manualScoreImportValidationData = null;

        if (importButton) {
            importButton.disabled = true;
        }

        const summaryContainer =
            document.getElementById(
                "manualScoreImportSummary"
            );

        if (summaryContainer) {
            summaryContainer.classList.remove(
                "hidden"
            );

            summaryContainer.innerHTML = `
                <div class="question-card">
                    <h3>Import thành công</h3>

                    <p>
                        <strong>Batch:</strong>
                        ${batchId || "—"}
                    </p>

                    <p>
                        <strong>Số giao dịch:</strong>
                        ${importedRows}
                    </p>

                    <p>
                        <strong>Trạng thái:</strong>
                        ${escapeHtml(
                            data.batch?.status ||
                            "COMPLETED"
                        )}
                    </p>
                </div>
            `;
        }
    } catch (error) {
        console.error(
            "Import manual score file error:",
            error
        );

        message.style.color = "red";

        if (
            error.code ===
            "MANUAL_SCORE_IMPORT_ALREADY_COMPLETED"
        ) {
            message.innerText =
                "File này đã được import trước đó. Hệ thống đã chặn import trùng.";
        } else {
            message.innerText =
                error.message ||
                "Không thể import điểm.";
        }

        renderManualScoreImportErrorsDemo(
            error.details?.errors
        );
    } finally {
        manualScoreImportInProgress = false;

        if (validateButton) {
            validateButton.disabled = false;
        }

        if (importButton) {
            importButton.innerText =
                "Import điểm";
        }
    }
}

async function disciplineApiRequestDemo(
    path,
    options = {}
) {
    const token =
        localStorage.getItem(
            "accessToken"
        );

    if (!token) {
        logoutDemo();

        throw new Error(
            "Phiên đăng nhập không hợp lệ."
        );
    }

    const response = await fetch(
        `${API_BASE_URL}${path}`,
        {
            ...options,

            headers: {
                Authorization:
                    `Bearer ${token}`,

                ...(
                    options.body
                        ? {
                            "Content-Type":
                                "application/json"
                        }
                        : {}
                ),

                ...(options.headers || {})
            }
        }
    );

    let result = null;

    try {
        result =
            await response.json();
    } catch (error) {
        result = null;
    }

    if (response.status === 401) {
        logoutDemo();

        throw new Error(
            "Phiên đăng nhập đã hết hạn."
        );
    }

    if (response.status === 403) {
        throw new Error(
            result?.error?.message ||
            "Bạn không có quyền quản lý điểm Rèn luyện."
        );
    }

    if (
        !response.ok ||
        result?.success !== true
    ) {
        const apiError =
            new Error(
                result?.error?.message ||
                "Không thể xử lý điểm Rèn luyện."
            );

        apiError.status =
            response.status;

        apiError.code =
            result?.error?.code ||
            null;

        apiError.details =
            result?.error?.details ||
            null;

        throw apiError;
    }

    return result.data;
}

function getDisciplineInputNumberDemo(
    elementId
) {
    const element =
        document.getElementById(
            elementId
        );

    const value =
        Number(element?.value);

    return Number.isFinite(value)
        ? value
        : 0;
}


function buildDisciplinePreviewDemo() {
    const cleaningPoints =
        getDisciplineInputNumberDemo(
            "disciplineCleaningPoints"
        );

    const compliancePoints =
        getDisciplineInputNumberDemo(
            "disciplineCompliancePoints"
        );

    const spiritPoints =
        getDisciplineInputNumberDemo(
            "disciplineSpiritPoints"
        );

    const rawTotal =
        Number(
            (
                cleaningPoints +
                compliancePoints +
                spiritPoints
            ).toFixed(2)
        );

    const weightedScore =
        Number(
            (
                rawTotal /
                90 *
                30
            ).toFixed(2)
        );

    return {
        cleaningPoints,
        compliancePoints,
        spiritPoints,
        rawTotal,
        weightedScore
    };
}


function updateDisciplinePreviewDemo() {
    const preview =
        buildDisciplinePreviewDemo();

    const rawTotalElement =
        document.getElementById(
            "disciplineRawTotal"
        );

    const weightedElement =
        document.getElementById(
            "disciplineWeightedScore"
        );

    const message =
        document.getElementById(
            "disciplineMessage"
        );

    if (rawTotalElement) {
        rawTotalElement.innerText =
            preview.rawTotal;
    }

    if (weightedElement) {
        weightedElement.innerText =
            preview.weightedScore;
    }

    const values = [
        preview.cleaningPoints,
        preview.compliancePoints,
        preview.spiritPoints
    ];

    const hasInvalidValue =
        values.some(
            value =>
                !Number.isFinite(value) ||
                value < 0 ||
                value > 30
        );

    if (
        hasInvalidValue &&
        message
    ) {
        message.style.color = "red";
        message.innerText =
            "Mỗi hạng mục phải từ 0 đến 30 điểm.";
    } else if (message) {
        message.innerText = "";
    }
}

async function loadDisciplineGroupOptionsDemo() {
    const select =
        document.getElementById(
            "disciplineGroup"
        );

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            Đang tải danh sách nhóm...
        </option>
    `;

    select.disabled = true;

    try {
        const data =
            await disciplineApiRequestDemo(
                "/api/groups"
            );

        const groups =
            Array.isArray(
                data.groups
            )
                ? data.groups
                : [];

        disciplineGroupsApiCache =
            groups;

        if (groups.length === 0) {
            select.innerHTML = `
                <option value="">
                    Chưa có nhóm trong mùa hiện tại
                </option>
            `;

            return;
        }

        select.innerHTML = `
            <option value="">
                Chọn nhóm
            </option>

            ${
                groups
                    .map(group => `
                        <option
                            value="${Number(group.id)}"
                        >
                            ${escapeHtml(
                                group.name ||
                                group.code ||
                                `Nhóm #${group.id}`
                            )}

                            ${
                                group.memberCount !==
                                null &&
                                group.memberCount !==
                                undefined
                                    ? `— ${Number(group.memberCount)} thành viên`
                                    : ""
                            }
                        </option>
                    `)
                    .join("")
            }
        `;

        select.disabled = false;
    } catch (error) {
        console.error(
            "Load discipline groups error:",
            error
        );

        select.innerHTML = `
            <option value="">
                Không thể tải danh sách nhóm
            </option>
        `;
    }
}

function setDisciplineFormValuesDemo(
    disciplineScore
) {
    const score =
        disciplineScore || {};

    const cleaningElement =
        document.getElementById(
            "disciplineCleaningPoints"
        );

    const complianceElement =
        document.getElementById(
            "disciplineCompliancePoints"
        );

    const spiritElement =
        document.getElementById(
            "disciplineSpiritPoints"
        );

    if (cleaningElement) {
        cleaningElement.value =
            Number(
                score.cleaningPoints
            ) || 0;
    }

    if (complianceElement) {
        complianceElement.value =
            Number(
                score.compliancePoints
            ) || 0;
    }

    if (spiritElement) {
        spiritElement.value =
            Number(
                score.spiritPoints
            ) || 0;
    }

    updateDisciplinePreviewDemo();
}


function renderDisciplineCurrentStatusDemo(
    group,
    disciplineScore
) {
    const container =
        document.getElementById(
            "disciplineCurrentStatus"
        );

    if (!container) {
        return;
    }

    const hasSavedScore =
        disciplineScore?.id !==
            null &&
        disciplineScore?.id !==
            undefined;

    if (!hasSavedScore) {
        container.innerHTML = `
            <h3>
                ${escapeHtml(
                    group?.name ||
                    "Nhóm"
                )}
            </h3>

            <p>
                Nhóm này chưa có điểm Rèn luyện chính thức.
            </p>

            <p>
                Nhập điểm rồi bấm
                <strong>Lưu điểm Rèn luyện</strong>.
            </p>
        `;

        return;
    }

    const updatedDate =
        disciplineScore.updatedAt
            ? parseSqlLocalDateTime(
                disciplineScore.updatedAt
            )
            : null;

    const scoredDate =
        disciplineScore.scoredAt
            ? parseSqlLocalDateTime(
                disciplineScore.scoredAt
            )
            : null;

    const savedDate =
        updatedDate ||
        scoredDate;

    const savedDateText =
        savedDate
            ? savedDate.toLocaleString(
                "vi-VN"
            )
            : "Không xác định";

    container.innerHTML = `
        <h3>
            Điểm hiện tại của
            ${escapeHtml(
                group?.name ||
                "nhóm"
            )}
        </h3>

        <p>
            <strong>Trực nhật:</strong>
            ${Number(
                disciplineScore.cleaningPoints
            ) || 0}
            / 30
        </p>

        <p>
            <strong>Tuân thủ:</strong>
            ${Number(
                disciplineScore.compliancePoints
            ) || 0}
            / 30
        </p>

        <p>
            <strong>Tinh thần:</strong>
            ${Number(
                disciplineScore.spiritPoints
            ) || 0}
            / 30
        </p>

        <p>
            <strong>Tổng thô:</strong>
            ${Number(
                disciplineScore.rawTotal
            ) || 0}
            / 90
        </p>

        <p>
            <strong>Điểm quy đổi:</strong>
            ${Number(
                disciplineScore.weightedScore
            ) || 0}
            / 30
        </p>

        <p class="question-meta">
            Cập nhật lúc:
            ${escapeHtml(
                savedDateText
            )}
        </p>
    `;
}


async function loadSelectedGroupDisciplineDemo() {
    const select =
        document.getElementById(
            "disciplineGroup"
        );

    const groupId =
        Number(select?.value);

    const message =
        document.getElementById(
            "disciplineMessage"
        );

    const saveButton =
        document.getElementById(
            "saveDisciplineScoreBtn"
        );

    const statusContainer =
        document.getElementById(
            "disciplineCurrentStatus"
        );

    disciplineSelectedScoreApi = null;

    if (
        !Number.isInteger(groupId) ||
        groupId <= 0
    ) {
        setDisciplineFormValuesDemo({
            cleaningPoints: 0,
            compliancePoints: 0,
            spiritPoints: 0
        });

        if (statusContainer) {
            statusContainer.innerHTML = `
                <p>
                    Chọn nhóm để xem điểm Rèn luyện hiện tại.
                </p>
            `;
        }

        if (saveButton) {
            saveButton.disabled = true;
        }

        if (message) {
            message.innerText = "";
        }

        return;
    }

    if (saveButton) {
        saveButton.disabled = true;
    }

    if (message) {
        message.style.color = "#555";
        message.innerText =
            "Đang tải điểm Rèn luyện của nhóm...";
    }

    try {
        const data =
            await disciplineApiRequestDemo(
                `/api/scores/admin/groups/${groupId}/discipline`
            );

        disciplineSelectedScoreApi =
            data;

        setDisciplineFormValuesDemo(
            data.disciplineScore
        );

        renderDisciplineCurrentStatusDemo(
            data.group,
            data.disciplineScore
        );

        if (message) {
            message.innerText = "";
        }

        if (saveButton) {
            saveButton.disabled = false;
        }
    } catch (error) {
        console.error(
            "Load group discipline score error:",
            error
        );

        setDisciplineFormValuesDemo({
            cleaningPoints: 0,
            compliancePoints: 0,
            spiritPoints: 0
        });

        if (statusContainer) {
            statusContainer.innerHTML = `
                <p style="color: red;">
                    Không thể tải điểm Rèn luyện của nhóm.
                </p>
            `;
        }

        if (message) {
            message.style.color = "red";
            message.innerText =
                error.message ||
                "Không thể tải điểm Rèn luyện.";
        }
    }
}

async function saveGroupDisciplineDemo() {
    const groupSelect =
        document.getElementById(
            "disciplineGroup"
        );

    const saveButton =
        document.getElementById(
            "saveDisciplineScoreBtn"
        );

    const message =
        document.getElementById(
            "disciplineMessage"
        );

    const reasonElement =
        document.getElementById(
            "disciplineReason"
        );

    const groupId =
        Number(groupSelect?.value);

    if (
        !Number.isInteger(groupId) ||
        groupId <= 0
    ) {
        message.style.color = "red";
        message.innerText =
            "Vui lòng chọn nhóm.";

        return;
    }

    const preview =
        buildDisciplinePreviewDemo();

    const values = [
        preview.cleaningPoints,
        preview.compliancePoints,
        preview.spiritPoints
    ];

    if (
        values.some(
            value =>
                !Number.isFinite(value) ||
                value < 0 ||
                value > 30
        )
    ) {
        message.style.color = "red";
        message.innerText =
            "Mỗi hạng mục phải từ 0 đến 30 điểm.";

        return;
    }

    const selectedGroup =
        disciplineGroupsApiCache
            .find(
                group =>
                    Number(group.id) ===
                    groupId
            );

    const groupName =
        selectedGroup?.name ||
        `nhóm #${groupId}`;

    const confirmed =
        confirm(
            `Bạn có chắc muốn lưu điểm Rèn luyện cho ${groupName}?\n\n` +
            `Trực nhật: ${preview.cleaningPoints}/30\n` +
            `Tuân thủ: ${preview.compliancePoints}/30\n` +
            `Tinh thần: ${preview.spiritPoints}/30\n` +
            `Điểm quy đổi: ${preview.weightedScore}/30`
        );

    if (!confirmed) {
        return;
    }

    if (disciplineSaveInProgress) {
        return;
    }

    disciplineSaveInProgress = true;

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.innerText =
            "Đang lưu...";
    }

    message.style.color = "#555";
    message.innerText =
        "Đang lưu điểm Rèn luyện...";

    try {
        const data =
            await disciplineApiRequestDemo(
                `/api/scores/admin/groups/${groupId}/discipline`,
                {
                    method: "PUT",

                    body: JSON.stringify({
                        cleaningPoints:
                            preview.cleaningPoints,

                        compliancePoints:
                            preview.compliancePoints,

                        spiritPoints:
                            preview.spiritPoints,

                        reason:
                            reasonElement
                                ?.value
                                .trim() ||
                            "Cập nhật điểm Rèn luyện của nhóm."
                    })
                }
            );

        disciplineSelectedScoreApi =
            data;

        setDisciplineFormValuesDemo(
            data.disciplineScore
        );

        renderDisciplineCurrentStatusDemo(
            data.group,
            data.disciplineScore
        );

        if (reasonElement) {
            reasonElement.value = "";
        }

        message.style.color = "green";

        message.innerText =
            `${data.message} ` +
            `Đã áp dụng cho ${Number(data.affectedMembers) || 0} thành viên.`;

        /*
         * Điểm nhóm và lịch sử điểm đã thay đổi.
         */
        groupRankingApiCache = null;
        groupRankingApiPromise = null;

        adminScoreHistoryApiPromise = null;
        adminScoreHistoryApiCache = [];

        myGroupScoreApiCache = null;
        myGroupScoreApiPromise = null;

        await Promise.all([
            loadAdminScoreHistoryDemo(true),
            loadAdminScoreSummaryDemo(true)
        ]);
    } catch (error) {
        console.error(
            "Save group discipline score error:",
            error
        );

        message.style.color = "red";

        if (
            error.code ===
            "DISCIPLINE_SCORE_NO_CHANGE"
        ) {
            message.innerText =
                "Điểm Rèn luyện không có thay đổi. Không tạo thêm giao dịch.";
        } else {
            message.innerText =
                error.message ||
                "Không thể lưu điểm Rèn luyện.";
        }
    } finally {
        disciplineSaveInProgress = false;

        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerText =
                "Lưu điểm Rèn luyện";
        }
    }
}

async function addScoreDemo() {
    const username =
        document
            .getElementById("scoreUser")
            ?.value
            .trim();

    const scoreType =
        document
            .getElementById("scoreType")
            ?.value
            .trim();

    const selectedScoreType =
        String(scoreType || "")
            .trim()
            .toUpperCase();

    const isManualTestScore =
        selectedScoreType === "PRE_TEST" ||
        selectedScoreType === "FINAL_TEST";

    const scoreExamId =
        Number(
            document
                .getElementById("scoreExam")
                ?.value
        );

    const scoreValue =
        isManualTestScore
            ? Number(
                document
                    .getElementById(
                        "scoreTestValue"
                    )
                    ?.value
            )
            : Number(
                document
                    .getElementById(
                        "scoreValue"
                    )
                    ?.value
            );

    const scoreReason =
        document
            .getElementById("scoreReason")
            ?.value
            .trim();

    const message =
        document.getElementById(
            "scoreMessage"
        );

    const submitButton =
        document.querySelector(
            '[onclick="addScoreDemo()"]'
        );

    if (!username) {
        message.style.color = "red";
        message.innerText =
            "Vui lòng chọn học viên.";
        return;
    }

    if (!scoreType) {
        message.style.color = "red";
        message.innerText =
            "Vui lòng chọn loại điểm.";
        return;
    }

    if (
        isManualTestScore &&
        (
            !Number.isInteger(
                scoreExamId
            ) ||
            scoreExamId <= 0
        )
    ) {
        message.style.color = "red";
        message.innerText =
            "Vui lòng chọn bài kiểm tra.";
        return;
    }

    if (
        !Number.isFinite(scoreValue) ||
        (
            isManualTestScore
                ? scoreValue <= 0
                : scoreValue === 0
        )
    ) {
        message.style.color = "red";
        message.innerText =
            "Vui lòng chọn số điểm hợp lệ.";
        return;
    }

    if (!scoreReason) {
        message.style.color = "red";
        message.innerText =
            "Vui lòng nhập lý do cộng điểm.";
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

    message.style.color = "#555";
    message.innerText =
        "Đang lưu điểm...";

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerText =
            "Đang lưu...";
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/scores/admin/individual`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${token}`
                },

                body: JSON.stringify({
                    username,

                    scoreType:
                        selectedScoreType,

                    examId:
                        isManualTestScore
                            ? scoreExamId
                            : null,

                    points:
                        scoreValue,

                    description:
                        scoreReason
                })
            }
        );

        let result = null;

        try {
            result =
                await response.json();
        } catch (error) {
            result = null;
        }

        if (response.status === 401) {
            logoutDemo();
            return;
        }

        if (response.status === 403) {
            message.style.color = "red";
            message.innerText =
                "Bạn không có quyền cộng điểm.";
            return;
        }

        if (
            !response.ok ||
            result?.success !== true
        ) {
            const details =
                result?.error?.details;

            let errorMessage =
                result?.error?.message ||
                "Không thể cộng điểm.";

            if (
                details?.remainingPoints !==
                    null &&
                details?.remainingPoints !==
                    undefined
            ) {
                errorMessage +=
                    ` Học viên chỉ còn có thể nhận ${details.remainingPoints} điểm ở hạng mục này.`;
            }

            throw new Error(
                errorMessage
            );
        }

        const transaction =
            result.data?.transaction;

        const memberName =
            transaction?.member?.fullName ||
            username;

        const scoreDisplay =
            scoreValue > 0
                ? `+${scoreValue}`
                : String(scoreValue);

        const actionLabel =
            scoreValue > 0
                ? "Đã cộng"
                : "Đã trừ";

        message.style.color = "green";

        message.innerText =
            `${actionLabel} ${scoreDisplay} điểm cho ${memberName}.`;

        document.getElementById(
            "scoreReason"
        ).value = "";

        const scoreExamElement =
            document.getElementById(
                "scoreExam"
            );

        const scoreTestValueElement =
            document.getElementById(
                "scoreTestValue"
            );

        if (scoreExamElement) {
            scoreExamElement.value = "";
        }

        if (scoreTestValueElement) {
            scoreTestValueElement.value = "";
        }

        /*
        * Xóa cache xếp hạng vì điểm mới có thể
        * làm thay đổi điểm và thứ hạng nhóm.
        */
        groupRankingApiCache = null;

        adminScoreHistoryApiPromise = null;

        await Promise.all([
        loadAdminScoreHistoryDemo(true),
        loadAdminScoreSummaryDemo(true)
        ]);

    } catch (error) {
        console.error(
            "Create manual score error:",
            error
        );

        message.style.color = "red";

        message.innerText =
            error.message ||
            "Không thể kết nối đến Backend.";
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerText =
                "Lưu điểm";
        }
    }
}

async function loadAdminScoreExamsDemo(
    forceRefresh = false
) {
    if (
        forceRefresh ||
        !adminScoreExamsApiPromise
    ) {
        adminScoreExamsApiPromise =
            (async () => {
                const token =
                    localStorage.getItem(
                        "accessToken"
                    );

                if (!token) {
                    return [];
                }

                const response = await fetch(
                    `${API_BASE_URL}/api/admin/test/exams`,
                    {
                        method: "GET",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

                let result = null;

                try {
                    result =
                        await response.json();
                } catch (error) {
                    result = null;
                }

                if (response.status === 401) {
                    logoutDemo();
                    return [];
                }

                if (response.status === 403) {
                    throw new Error(
                        "Bạn không có quyền xem danh sách bài kiểm tra."
                    );
                }

                if (
                    !response.ok ||
                    result?.success !== true
                ) {
                    throw new Error(
                        result?.error?.message ||
                        result?.message ||
                        "Không thể tải danh sách bài kiểm tra."
                    );
                }

                const exams =
                    Array.isArray(
                        result.exams
                    )
                        ? result.exams
                        : Array.isArray(
                            result.data?.exams
                        )
                            ? result.data.exams
                            : [];

                adminScoreExamsApiCache =
                    exams;

                return exams;
            })()
            .catch(error => {
                adminScoreExamsApiPromise =
                    null;

                throw error;
            });
    }

    return adminScoreExamsApiPromise;
}

function renderManualScoreExamOptionsDemo(
    scoreType
) {
    const examSelect =
        document.getElementById(
            "scoreExam"
        );

    if (!examSelect) {
        return;
    }

    const normalizedScoreType =
        String(scoreType || "")
            .trim()
            .toUpperCase();

    const matchingExams =
        adminScoreExamsApiCache
            .filter(exam =>
                String(exam.type || "")
                    .toUpperCase() ===
                normalizedScoreType
            );

    if (matchingExams.length === 0) {
        examSelect.innerHTML = `
            <option value="">
                Không có bài kiểm tra phù hợp
            </option>
        `;

        examSelect.disabled = true;
        return;
    }

    examSelect.innerHTML = `
        <option value="">
            Chọn bài kiểm tra
        </option>

        ${
            matchingExams
                .map(exam => `
                    <option
                        value="${Number(exam.id)}"
                    >
                        ${escapeHtml(
                            exam.name ||
                            `Bài kiểm tra #${exam.id}`
                        )}
                        —
                        ${escapeHtml(
                            exam.status ||
                            "Không xác định"
                        )}
                    </option>
                `)
                .join("")
        }
    `;

    examSelect.disabled = false;
}

async function updateManualScoreFormDemo() {
    const scoreType =
        document.getElementById(
            "scoreType"
        );

    const scoreValue =
        document.getElementById(
            "scoreValue"
        );

    const examGroup =
        document.getElementById(
            "scoreExamGroup"
        );

    const examSelect =
        document.getElementById(
            "scoreExam"
        );

    const testValueGroup =
        document.getElementById(
            "scoreTestValueGroup"
        );

    const testValue =
        document.getElementById(
            "scoreTestValue"
        );

    const testLimitNote =
        document.getElementById(
            "scoreTestLimitNote"
        );

    const message =
        document.getElementById(
            "scoreMessage"
        );

    if (
        !scoreType ||
        !scoreValue
    ) {
        return;
    }

    const selectedType =
        String(scoreType.value || "")
            .trim()
            .toUpperCase();

    /*
     * Reset giao diện trước khi hiển thị
     * trường phù hợp.
     */
    scoreValue.disabled = true;

    scoreValue.innerHTML = `
        <option value="">
            Hãy chọn loại điểm trước
        </option>
    `;

    if (examGroup) {
        examGroup.classList.add(
            "hidden"
        );
    }

    if (testValueGroup) {
        testValueGroup.classList.add(
            "hidden"
        );
    }

    if (examSelect) {
        examSelect.value = "";
    }

    if (testValue) {
        testValue.value = "";
    }

    if (testLimitNote) {
        testLimitNote.innerText = "";
    }

    if (message) {
        message.innerText = "";
    }

    /*
     * Điểm danh thủ công.
     */
    if (
        selectedType ===
        "ATTENDANCE_ADJUSTMENT"
    ) {
        scoreValue.disabled = false;

        scoreValue.innerHTML = `
            <option value="">
                Chọn số điểm
            </option>

            <option value="3">
                +3 điểm — Bù điểm danh
            </option>

            <option value="5">
                +5 điểm — Bù điểm danh
            </option>

            <option value="-3">
                -3 điểm — Thu hồi điểm gian lận
            </option>

            <option value="-5">
                -5 điểm — Thu hồi điểm gian lận
            </option>
        `;

        return;
    }

    /*
     * Điểm phát biểu.
     */
    if (
        selectedType ===
        "PARTICIPATION"
    ) {
        scoreValue.disabled = false;

        scoreValue.innerHTML = `
            <option value="2">
                +2 điểm
            </option>
        `;

        return;
    }

    /*
     * Điểm bài thi giấy.
     */
    if (
        selectedType === "PRE_TEST" ||
        selectedType === "FINAL_TEST"
    ) {
        if (examGroup) {
            examGroup.classList.remove(
                "hidden"
            );
        }

        if (testValueGroup) {
            testValueGroup.classList.remove(
                "hidden"
            );
        }

        if (testValue) {
            testValue.min = "0.01";
            testValue.step = "0.01";

            testValue.max =
                selectedType === "PRE_TEST"
                    ? "10"
                    : "60";
        }

        if (testLimitNote) {
            testLimitNote.innerText =
                selectedType === "PRE_TEST"
                    ? "Pre-test tối đa 10 điểm cho mỗi bài, tính chung điểm online và điểm giấy."
                    : "Final Test tối đa 60 điểm, tính chung điểm online và điểm giấy.";
        }

        try {
            await loadAdminScoreExamsDemo();

            renderManualScoreExamOptionsDemo(
                selectedType
            );
        } catch (error) {
            console.error(
                "Load manual score exams error:",
                error
            );

            if (examSelect) {
                examSelect.innerHTML = `
                    <option value="">
                        Không thể tải bài kiểm tra
                    </option>
                `;

                examSelect.disabled = true;
            }

            if (message) {
                message.style.color =
                    "red";

                message.innerText =
                    error.message ||
                    "Không thể tải danh sách bài kiểm tra.";
            }
        }

        return;
    }
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

    const tkhCode =
        currentUser.tkhCode ||
        currentUser.username ||
        "";

    welcomeName.innerText =
        `Xin chào, ${displayName}` +
        (tkhCode ? ` (${tkhCode})` : "");

    const dashboardAvatar =
    document.getElementById(
        "dashboardUserAvatar"
    );

if (dashboardAvatar) {
    setMemberAvatarDemo(
        dashboardAvatar,
        {
            ...currentUser,
            fullName: displayName,
            tkhCode
        }
    );
}

    setMemberAvatarDemo(
        dashboardAvatar,
        {
            ...currentUser,
            fullName: displayName,
            tkhCode
        }
    );
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

async function loadProfileDemo() {
    const profileNameEl =
        document.getElementById("profileName");

    if (!profileNameEl) {
        return;
    }

    const profileGroupEl =
        document.getElementById("profileGroup");

    const profileAvatarEl =
        document.getElementById("profileAvatar");

    const profileFullNameEl =
        document.getElementById("profileFullName");

    const profileUsernameEl =
        document.getElementById("profileUsername");

    const sendBox =
        document.getElementById(
            "encouragementSendBox"
        );

    const currentUser =
        getCurrentUserDemo();

    const token =
        localStorage.getItem("accessToken");

    const profileUsername =
        getProfileUsernameFromUrl();

    if (
        !currentUser ||
        !token ||
        !profileUsername
    ) {
        profileNameEl.innerText =
            "Không tìm thấy thành viên";

        if (sendBox) {
            sendBox.style.display = "none";
        }

        return;
    }

    profileNameEl.innerText =
        "Đang tải hồ sơ thành viên...";

    if (sendBox) {
        sendBox.style.display = "none";
    }

    try {
        let profileUser = null;

        const isMyProfile =
            String(currentUser.username)
                .toLowerCase() ===
            String(profileUsername)
                .toLowerCase();

        /*
         * Nếu mở chính hộp thư của mình,
         * có thể dùng luôn currentUser.
         */
        if (isMyProfile) {
            profileUser = currentUser;
        } else {
            /*
             * Nếu mở hộp thư người khác,
             * lấy thông tin người nhận từ Backend.
             */
            const response = await fetch(
                `${API_BASE_URL}/api/encouragements/recipients`,
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

            if (response.status === 401) {
                logoutDemo();
                return;
            }

            if (
                !response.ok ||
                result.success !== true
            ) {
                throw new Error(
                    result?.error?.message ||
                    result?.message ||
                    "Không thể tải thông tin thành viên."
                );
            }

            const recipients =
                Array.isArray(result.recipients)
                    ? result.recipients
                    : [];

            profileUser =
                recipients.find(item =>
                    item.username &&
                    String(item.username)
                        .toLowerCase() ===
                    String(profileUsername)
                        .toLowerCase()
                ) || null;
        }

        if (!profileUser) {
            profileNameEl.innerText =
                "Không tìm thấy thành viên";

            if (profileGroupEl) {
                profileGroupEl.innerText = "";
            }

            if (profileAvatarEl) {
                profileAvatarEl.src =
                    "assets/images/members/default-avatar.jpg";

                profileAvatarEl.alt =
                    "Không tìm thấy avatar";
            }

            if (profileFullNameEl) {
                profileFullNameEl.innerText =
                    "Không tìm thấy thành viên";
            }

            if (profileUsernameEl) {
                profileUsernameEl.innerText = "";
            }

            if (sendBox) {
                sendBox.style.display = "none";
            }

            return;
        }

        const fullName =
            profileUser.fullName ||
            profileUser.username ||
            "Thành viên";

        const groupName =
            profileUser.group?.name ||
            profileUser.groupName ||
            "Chưa phân nhóm";

        profileNameEl.innerText =
            "Hồ sơ: " + fullName;

        if (profileGroupEl) {
            profileGroupEl.innerText =
                "Nhóm: " + groupName;
        }

        if (profileAvatarEl) {
            setMemberAvatarDemo(
                profileAvatarEl,
                {
                    ...profileUser,
                    fullName,
                    tkhCode:
                        profileUser.tkhCode ||
                        profileUser.username
                }
            );
        }

        if (profileFullNameEl) {
            profileFullNameEl.innerText =
                fullName;
        }

        if (profileUsernameEl) {
            profileUsernameEl.innerText =
                profileUser.username +
                " · Nhóm " +
                groupName;
        }

        /*
         * Hộp gửi chỉ hiện khi:
         * - Đang xem người khác.
         * - Người đăng nhập là học viên.
         */
        if (sendBox) {
            const canSend =
                !isMyProfile &&
                currentUser.role === "student";

            sendBox.style.display =
                canSend ? "block" : "none";
        }
    } catch (error) {
        console.error(
            "Load profile error:",
            error
        );

        profileNameEl.innerText =
            "Không thể tải hồ sơ thành viên";

        if (profileGroupEl) {
            profileGroupEl.innerText =
                error.message ||
                "Vui lòng thử lại.";
        }

        if (sendBox) {
            sendBox.style.display = "none";
        }
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



/*
 * =========================================================
 * DOCUMENT API HELPERS
 * =========================================================
 */

let studyMaterialsApiCache = [];
let editingMaterialId = null;


/*
 * Backend hiện lưu mỗi tài liệu thành một dòng trong bảng documents.
 *
 * Các thông tin riêng của giao diện cũ như:
 * - Buổi học
 * - Câu gốc
 * - Nội dung câu gốc
 * - Ghi chú
 * - Tên file
 *
 * được gom vào trường description dưới dạng JSON.
 */
function parseStudyMaterialDescriptionDemo(description) {
    if (!description) {
        return {};
    }

    try {
        const parsed = JSON.parse(description);

        if (
            parsed &&
            typeof parsed === "object"
        ) {
            return parsed;
        }
    } catch (error) {
        /*
         * Nếu dữ liệu cũ chỉ là chữ bình thường
         * thì dùng chữ đó làm ghi chú.
         */
    }

    return {
        note: String(description)
    };
}


/*
 * Chuyển dữ liệu Document từ Backend
 * về cấu trúc mà giao diện Kho tài liệu đang sử dụng.
 */
function mapDocumentToStudyMaterialDemo(documentItem) {
    const metadata =
        parseStudyMaterialDescriptionDemo(
            documentItem.description
        );

    return {
        id: Number(documentItem.id),

        session:
            metadata.session ||
            "Tài liệu học tập",

        title:
            documentItem.title ||
            "Tài liệu",

        bibleVerse:
            metadata.bibleVerse ||
            "",

        verseText:
            metadata.verseText ||
            "",

        note:
            metadata.note ||
            "",

        displayOrder:
            Number(
                documentItem.displayOrder
            ) || 0,

        isPublished:
            Boolean(
                documentItem.isPublished
            ),

        files: [
            {
                icon:
                    getMaterialIconDemo(
                        documentItem.fileType
                    ),

                name:
                    metadata.fileName ||
                    documentItem.title ||
                    "Tài liệu",

                type:
                    documentItem.fileType ||
                    "Link",

                url:
                    documentItem.fileUrl ||
                    ""
            }
        ]
    };
}


/*
 * Hàm dùng chung để gọi các API Document.
 */
async function documentApiRequestDemo(
    path,
    options = {}
) {
    const token =
        localStorage.getItem(
            "accessToken"
        );

    if (!token) {
        logoutDemo();

        throw new Error(
            "Phiên đăng nhập không tồn tại."
        );
    }

    const response = await fetch(
        `${API_BASE_URL}${path}`,
        {
            ...options,

            headers: {
                Authorization:
                    `Bearer ${token}`,

                ...(
                    options.body
                        ? {
                            "Content-Type":
                                "application/json"
                        }
                        : {}
                ),

                ...(options.headers || {})
            }
        }
    );

    let result = null;

    try {
        result =
            await response.json();
    } catch (error) {
        result = null;
    }

    if (response.status === 401) {
        logoutDemo();

        throw new Error(
            "Phiên đăng nhập đã hết hạn."
        );
    }

    if (response.status === 403) {
        throw new Error(
            "Bạn không có quyền thực hiện thao tác này."
        );
    }

    if (
        !response.ok ||
        result?.success !== true
    ) {
        const validationMessage =
            result?.error?.details?.[0]?.msg;

        throw new Error(
            validationMessage ||
            result?.error?.message ||
            result?.message ||
            "Không thể xử lý tài liệu."
        );
    }

    return result;
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

function isSharedProtectedPage() {
    const pageName =
        getCurrentPageName();

    const sharedProtectedPages = [
        "forum.html"
    ];

    return sharedProtectedPages.includes(
        pageName
    );
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
    const sharedPage =
    isSharedProtectedPage();

    const protectedPage =
        adminPage ||
        studentPage ||
        sharedPage ||
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
                window.location.href =
                    "admin-dashboard.html";
            } else {
                window.location.href =
                    "attendance.html";
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
    loadDisciplineGroupOptionsDemo();
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
    if (
        document.getElementById(
            "scoreExam"
        )
    ) {
        loadAdminScoreExamsDemo()
            .catch(error => {
                console.error(
                    "Preload admin score exams error:",
                    error
                );
            });
    }
    loadBibleChallengeDemo();
    loadBibleChallengeSummaryDemo();
    loadBibleChallengeHistoryDemo();
    loadBibleChallengeProgressDemo();
    initializeForumPage();
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

            const createdDate =
                parseSqlLocalDateTime(q.createdAt);

            const answeredDate =
                parseSqlLocalDateTime(q.respondedAt);

            const createdAt =
                createdDate
                    ? createdDate.toLocaleString("vi-VN")
                    : "Chưa có thông tin";

            const answeredAt =
                answeredDate
                    ? answeredDate.toLocaleString("vi-VN")
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

let adminQuestionsApiCache = [];

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

        adminQuestionsApiCache = questions;

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

            const createdDate =
                parseSqlLocalDateTime(q.createdAt);

            const answeredDate =
                parseSqlLocalDateTime(q.respondedAt);

            const createdAt =
                createdDate
                    ? createdDate.toLocaleString("vi-VN")
                    : "Chưa có thông tin";

            const answeredAt =
                answeredDate
                    ? answeredDate.toLocaleString("vi-VN")
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

        adminQuestionsApiCache = [];

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

                    /*
                     * Từ nay mọi lời khích lệ mới
                     * đều được gửi công khai.
                     */
                    isAnonymous:
                        false
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

let encouragementInboxMessagesApi = [];

let currentOpenedEncouragementId = null;

/*
=====================================================
MEN'S DAY 2026 — ANIMATION STATE
=====================================================
*/

let mensDayAnimationTimeoutIds = [];

let mensDayAnimationInProgress = false;


/*
=====================================================
MEN'S DAY 2026
Detect special encouragement campaign
=====================================================
*/

function isMensDayEncouragementDemo(item) {
    return (
        String(
            item?.campaignCode || ""
        )
            .trim()
            .toUpperCase() ===
        "MENS_DAY_2026"
    );
}

/*
=====================================================
MEN'S DAY 2026
Special visual experience is kept only for TKH158.
Other recipients use the normal encouragement UI.
=====================================================
*/

function shouldUseMensDaySpecialExperience(
    item
) {
    if (
        !isMensDayEncouragementDemo(item)
    ) {
        return false;
    }

    const currentUser =
        JSON.parse(
            localStorage.getItem(
                "currentUser"
            )
        );

    const username =
        String(
            currentUser?.username || ""
        )
            .trim()
            .toLowerCase();

    return username === "tkh158";
}

/*
=====================================================
MEN'S DAY 2026 — TIMER HELPERS
=====================================================
*/

function clearMensDayAnimationTimers() {
    mensDayAnimationTimeoutIds
        .forEach(timeoutId => {
            clearTimeout(timeoutId);
        });

    mensDayAnimationTimeoutIds = [];
}


function scheduleMensDayAnimation(
    callback,
    delay
) {
    const timeoutId =
        window.setTimeout(
            callback,
            delay
        );

    mensDayAnimationTimeoutIds.push(
        timeoutId
    );

    return timeoutId;
}

/*
=====================================================
MEN'S DAY 2026 — RESET EXPERIENCE
=====================================================
*/

function resetMensDayLetterExperience() {
    clearMensDayAnimationTimers();

    mensDayAnimationInProgress = false;

    const experience =
        document.getElementById(
            "mensDayLetterExperience"
        );

    const personalIntro =
        document.getElementById(
            "mensDayPersonalIntro"
        );

    const envelopeScene =
        document.getElementById(
            "mensDayEnvelopeScene"
        );

    if (experience) {
        experience.classList.remove(
            "is-seal-opening",
            "is-envelope-opening",
            "is-letter-revealed"
        );
    }

    if (personalIntro) {
        personalIntro.classList.remove(
            "is-visible"
        );

        personalIntro.setAttribute(
            "aria-hidden",
            "true"
        );
    }

    /*
     * Trong phase personal intro,
     * JS sẽ làm phong bì tối nhẹ.
     * Reset lại khi đóng/mở lần sau.
     */
    if (envelopeScene) {
        envelopeScene.style.opacity = "";
        envelopeScene.style.filter = "";
        envelopeScene.style.transition = "";
    }
}

/*
=====================================================
MEN'S DAY 2026 — OPEN SPECIAL EXPERIENCE
=====================================================
*/

function openMensDayLetterExperience(
    item
) {
    if (!item) {
        return;
    }

    const normalizedId =
        Number(item.id);

    if (
        !Number.isInteger(normalizedId) ||
        normalizedId <= 0
    ) {
        return;
    }

    const experience =
        document.getElementById(
            "mensDayLetterExperience"
        );

    const envelopeScene =
        document.getElementById(
            "mensDayEnvelopeScene"
        );

    const personalIntro =
        document.getElementById(
            "mensDayPersonalIntro"
        );

    const recipientNameElement =
        document.getElementById(
            "mensDayRecipientName"
        );

    const introRecipientNameElement =
        document.getElementById(
            "mensDayIntroRecipientName"
        );

    const contentElement =
        document.getElementById(
            "mensDayLetterContent"
        );

    const dateElement =
        document.getElementById(
            "mensDayLetterDate"
        );

    const pinButton =
        document.getElementById(
            "mensDayLetterPinButton"
        );

    if (
        !experience ||
        !envelopeScene ||
        !personalIntro ||
        !recipientNameElement ||
        !introRecipientNameElement ||
        !contentElement ||
        !dateElement ||
        !pinButton
    ) {
        console.error(
            "Men's Day experience HTML is incomplete."
        );

        return;
    }

    /*
     * Reset mọi animation state
     * từ lần mở trước.
     */
    resetMensDayLetterExperience();

    currentOpenedEncouragementId =
        normalizedId;

    const currentUser =
        JSON.parse(
            localStorage.getItem(
                "currentUser"
            )
        );

    /*
     * Ưu tiên tên recipient do Backend trả về.
     * Fallback sang currentUser.
     *
     * Tên này chỉ nằm ở presentation layer,
     * KHÔNG thay đổi item.message.
     */
    const recipientName =
        item.recipient?.fullName ||
        currentUser?.fullName ||
        "Học viên TKH";

    recipientNameElement.textContent =
        recipientName;

    introRecipientNameElement.textContent =
        recipientName;

    /*
     * Nội dung BTC được giữ nguyên.
     */
    contentElement.textContent =
        item.message || "";

    dateElement.textContent =
        formatEncouragementDateDemo(
            item.createdAt
        );

    pinButton.textContent =
        item.isPinned
            ? "Bỏ ghim"
            : "📌 Ghim";

    pinButton.onclick =
        async function () {
            pinButton.disabled = true;

            try {
                await togglePinEncouragementFromApi(
                    normalizedId
                );

                closeMensDayLetterExperience();
            } finally {
                pinButton.disabled = false;
            }
        };

    experience.classList.remove(
        "hidden"
    );

    document.body.classList.add(
        "encouragement-modal-open"
    );

    /*
     * Cho browser render trạng thái đầu
     * trước khi chạy sequence.
     */
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            startMensDayLetterSequence();
        });
    });
}


/*
=====================================================
MEN'S DAY 2026 — CINEMATIC SEQUENCE

Timeline:
0.0s  Navy envelope entrance
0.7s  Seal starts glowing
1.3s  Seal unlock + flap opens
2.2s  Personal recipient intro
3.6s  Intro fades
4.1s  Ivory letter rises
=====================================================
*/

function startMensDayLetterSequence() {
    const experience =
        document.getElementById(
            "mensDayLetterExperience"
        );

    const personalIntro =
        document.getElementById(
            "mensDayPersonalIntro"
        );

    const envelopeScene =
        document.getElementById(
            "mensDayEnvelopeScene"
        );

    if (
        !experience ||
        !personalIntro ||
        !envelopeScene
    ) {
        return;
    }

    if (mensDayAnimationInProgress) {
        return;
    }

    mensDayAnimationInProgress = true;

    clearMensDayAnimationTimers();


    /*
     * PHASE 1
     * Envelope đã tự entrance bằng CSS.
     *
     * Sau ~700ms:
     * logo seal bắt đầu glow/pulse mạnh hơn.
     */
    scheduleMensDayAnimation(
        () => {
            experience.classList.add(
                "is-seal-opening"
            );
        },
        700
    );


    /*
     * PHASE 2
     * Seal unlock.
     * Flap mở.
     * Light rays "Màu Chiếu Ra" xuất hiện.
     */
    scheduleMensDayAnimation(
        () => {
            experience.classList.remove(
                "is-seal-opening"
            );

            experience.classList.add(
                "is-envelope-opening"
            );
        },
        1350
    );


    /*
     * PHASE 3
     * Phong bì chìm nhẹ xuống nền.
     * Hiện intro cá nhân.
     */
    scheduleMensDayAnimation(
        () => {
            envelopeScene.style.transition =
                "opacity 500ms ease, filter 500ms ease";

            envelopeScene.style.opacity =
                "0.2";

            envelopeScene.style.filter =
                "blur(2px)";

            personalIntro.setAttribute(
                "aria-hidden",
                "false"
            );

            personalIntro.classList.add(
                "is-visible"
            );
        },
        2250
    );


    /*
     * PHASE 4
     * Intro người nhận bắt đầu fade.
     */
    scheduleMensDayAnimation(
        () => {
            personalIntro.classList.remove(
                "is-visible"
            );

            personalIntro.setAttribute(
                "aria-hidden",
                "true"
            );
        },
        3550
    );


    /*
     * PHASE 5
     * Phong bì rõ trở lại.
     */
    scheduleMensDayAnimation(
        () => {
            envelopeScene.style.opacity =
                "1";

            envelopeScene.style.filter =
                "none";
        },
        3850
    );


    /*
     * PHASE 6
     * Ivory letter trượt lên.
     */
    scheduleMensDayAnimation(
        () => {
            experience.classList.add(
                "is-letter-revealed"
            );
        },
        4100
    );


    /*
     * Animation sequence hoàn tất.
     * Người dùng có thể đọc/scroll/ghim.
     */
    scheduleMensDayAnimation(
        () => {
            mensDayAnimationInProgress =
                false;
        },
        5200
    );
}

/*
=====================================================
MEN'S DAY 2026 — CLOSE EXPERIENCE
=====================================================
*/

function closeMensDayLetterExperience() {
    const experience =
        document.getElementById(
            "mensDayLetterExperience"
        );

    resetMensDayLetterExperience();

    if (experience) {
        experience.classList.add(
            "hidden"
        );
    }

    document.body.classList.remove(
        "encouragement-modal-open"
    );

    currentOpenedEncouragementId =
        null;
}


function getEncouragementSenderNameDemo(item) {
    if (
        item?.isAnonymous ||
        !item?.sender
    ) {
        return "Ẩn danh";
    }

    return (
        item.sender.fullName ||
        item.sender.username ||
        "Một thành viên"
    );
}


function formatEncouragementDateDemo(createdAt) {
    if (!createdAt) {
        return "";
    }

    const createdDate =
        new Date(createdAt);

    if (
        Number.isNaN(
            createdDate.getTime()
        )
    ) {
        return "";
    }

    return createdDate.toLocaleString(
        "vi-VN"
    );
}


function openEncouragementLetterFromApi(
    encouragementId
) {
    const normalizedId =
        Number(encouragementId);

    const item =
        encouragementInboxMessagesApi.find(
            message =>
                Number(message.id) ===
                normalizedId
        );

    if (!item) {
        alert(
            "Không tìm thấy lời khích lệ này."
        );

        return;
    }

    const useMensDaySpecialExperience =
        shouldUseMensDaySpecialExperience(
            item
        );

    if (
        useMensDaySpecialExperience
    ) {
        openMensDayLetterExperience(
            item
        );

        return;
    }

    const modal =
        document.getElementById(
            "encouragementLetterModal"
        );

    const animation =
        document.getElementById(
            "encouragementEnvelopeAnimation"
        );

    const messageElement =
        document.getElementById(
            "encouragementLetterMessage"
        );

    const senderElement =
        document.getElementById(
            "encouragementLetterSender"
        );

    const dateElement =
        document.getElementById(
            "encouragementLetterDate"
        );

    const pinButton =
        document.getElementById(
            "encouragementLetterPinButton"
        );

    if (
        !modal ||
        !animation ||
        !messageElement ||
        !senderElement ||
        !dateElement ||
        !pinButton
    ) {
        return;
    }

    /*
    * Bật/tắt giao diện đặc biệt
    * cho thư Ngày của Nam.
    */



    currentOpenedEncouragementId =
        normalizedId;

    messageElement.textContent =
        item.message || "";

    senderElement.textContent =
        `— ${getEncouragementSenderNameDemo(
            item
        )}`;

    dateElement.textContent =
        formatEncouragementDateDemo(
            item.createdAt
        );

    pinButton.textContent =
        item.isPinned
            ? "Bỏ ghim"
            : "📌 Ghim";

    pinButton.onclick =
        async function () {
            pinButton.disabled = true;

            try {
                await togglePinEncouragementFromApi(
                    normalizedId
                );

                closeEncouragementLetterModal();
            } finally {
                pinButton.disabled = false;
            }
        };

    /*
     * Xóa trạng thái animation cũ trước khi mở,
     * để mỗi lần bấm phong bì animation đều chạy lại.
     */
    animation.classList.remove(
        "is-opening"
    );

    modal.classList.remove(
        "hidden"
    );

    document.body.classList.add(
        "encouragement-modal-open"
    );

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            animation.classList.add(
                "is-opening"
            );
        });
    });
}


function closeEncouragementLetterModal() {
    const modal =
        document.getElementById(
            "encouragementLetterModal"
        );

    const animation =
        document.getElementById(
            "encouragementEnvelopeAnimation"
        );

    if (modal) {
        modal.classList.add(
            "hidden"
        );

        modal.classList.remove(
            "mens-day-letter-modal"
        );
    }

    if (animation) {
        animation.classList.remove(
            "is-opening"
        );

        animation.classList.remove(
            "mens-day-letter-animation"
        );
    }

    document.body.classList.remove(
        "encouragement-modal-open"
    );

    currentOpenedEncouragementId =
        null;
}


function handleEncouragementLetterOverlayClick(
    event
) {
    if (
        event.target.id ===
        "encouragementLetterModal"
    ) {
        closeEncouragementLetterModal();
    }
}


document.addEventListener(
    "keydown",
    event => {
        if (event.key !== "Escape") {
            return;
        }

        const mensDayExperience =
            document.getElementById(
                "mensDayLetterExperience"
            );

        /*
         * Ưu tiên đóng special experience
         * nếu đang mở.
         */
        if (
            mensDayExperience &&
            !mensDayExperience.classList.contains(
                "hidden"
            )
        ) {
            closeMensDayLetterExperience();
            return;
        }

        const modal =
            document.getElementById(
                "encouragementLetterModal"
            );

        if (
            modal &&
            !modal.classList.contains(
                "hidden"
            )
        ) {
            closeEncouragementLetterModal();
        }
    }
);

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
            encouragementInboxMessagesApi = [];

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

        encouragementInboxMessagesApi =
            sortedMessages;

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
                const useMensDaySpecialExperience =
                    shouldUseMensDaySpecialExperience(
                        item
                    );

                const senderName =
                    getEncouragementSenderNameDemo(
                        item
                    );

                const avatarText =
                    item.isAnonymous ||
                    !item.sender
                        ? "💌"
                        : String(
                            item.sender.fullName ||
                            item.sender.username ||
                            "?"
                        )
                            .charAt(0)
                            .toUpperCase();

                const createdDate =
                    formatEncouragementDateDemo(
                        item.createdAt
                    );

                const encouragementId =
                    Number(item.id);

                /*
                    * Men's Day 2026 có card riêng hoàn toàn.
                    */
                    if (
                        useMensDaySpecialExperience
                    ) {
                        return `
                            <article
                                class="
                                    mens-day-inbox-card
                                    ${
                                        item.isPinned
                                            ? "mens-day-inbox-card-pinned"
                                            : ""
                                    }
                                "
                            >
                                <button
                                    type="button"
                                    class="mens-day-inbox-open"
                                    onclick="openEncouragementLetterFromApi(${encouragementId})"
                                    aria-label="Mở lá thư đặc biệt Ngày của Nam"
                                >
                                    <!-- Top information -->
                                    <span class="mens-day-inbox-header">
                                        <strong>
                                            <span class="mens-day-inbox-special-label">
                                                ✦ SPECIAL MESSAGE
                                            </span>

                                            <span class="mens-day-inbox-event-label">
                                                NGÀY CỦA NAM
                                            </span>
                                        </strong>

                                        <small>
                                            Từ ${escapeHtml(senderName)}
                                        </small>

                                        <small>
                                            ${escapeHtml(createdDate)}
                                        </small>
                                    </span>


                                    <!-- Envelope flap / fold -->
                                    <span
                                        class="mens-day-inbox-flap"
                                        aria-hidden="true"
                                    ></span>

                                    <span
                                        class="mens-day-inbox-left-fold"
                                        aria-hidden="true"
                                    ></span>

                                    <span
                                        class="mens-day-inbox-right-fold"
                                        aria-hidden="true"
                                    ></span>


                                    <!-- Logo seal -->
                                    <span class="mens-day-inbox-seal">
                                        <span
                                            class="mens-day-inbox-seal-glow"
                                            aria-hidden="true"
                                        ></span>

                                        <span
                                            class="mens-day-inbox-seal-ring"
                                            aria-hidden="true"
                                        ></span>

                                        <span class="mens-day-inbox-seal-inner">
                                            <img
                                                src="assets/images/logo-menday/LOGO-Mau-Chieu-Ra-2026.png"
                                                alt=""
                                            >
                                        </span>
                                    </span>


                                    <!-- Hint -->
                                    <span class="mens-day-inbox-hint">
                                        Một lá thư đặc biệt đang chờ bạn mở...
                                    </span>
                                </button>


                                <button
                                    type="button"
                                    class="mens-day-inbox-pin"
                                    onclick="
                                        event.stopPropagation();
                                        togglePinEncouragementFromApi(${encouragementId});
                                    "
                                >
                                    ${
                                        item.isPinned
                                            ? "Bỏ ghim"
                                            : "📌 Ghim"
                                    }
                                </button>
                            </article>
                        `;
                    }

                return `
                    <article
                        class="
                            encouragement-envelope-card
                            ${
                                item.isPinned
                                    ? "pinned-encouragement-envelope-card"
                                    : ""
                            }
                        "
                    >
                        <button
                            type="button"
                            class="encouragement-envelope-preview"
                            onclick="openEncouragementLetterFromApi(${encouragementId})"
                            aria-label="Mở lời khích lệ từ ${escapeHtml(senderName)}"
                        >
                            <span
                                class="encouragement-envelope-preview-flap"
                                aria-hidden="true"
                            ></span>

                            <span
                                class="encouragement-envelope-preview-paper"
                                aria-hidden="true"
                            >
                                💛
                            </span>

                            <span class="encouragement-envelope-preview-body">
                                <span class="encouragement-envelope-preview-icon">
                                    ${escapeHtml(avatarText)}
                                </span>

                                <span class="encouragement-envelope-preview-information">
                                    <strong>
                                        ${
                                            item.isPinned
                                                ? "📌 Lời khích lệ đã ghim"
                                                : "💌 Bạn có một lời khích lệ"
                                        }
                                    </strong>

                                    <small>
                                        Từ ${escapeHtml(senderName)}
                                    </small>

                                    <small>
                                        ${escapeHtml(createdDate)}
                                    </small>

                                    <span class="encouragement-open-label">
                                        Chạm để mở thư
                                    </span>
                                </span>
                            </span>
                        </button>

                        <button
                            type="button"
                            class="pin-encouragement-btn encouragement-preview-pin-button"
                            onclick="togglePinEncouragementFromApi(${encouragementId})"
                        >
                            ${
                                item.isPinned
                                    ? "Bỏ ghim"
                                    : "📌 Ghim"
                            }
                        </button>
                    </article>
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
            "topEncouragementReceivers"
        );

    const topSendersList =
        document.getElementById(
            "topEncouragementSenders"
        );

    if (
        !totalElement ||
        !todayElement ||
        !anonymousElement
    ) {
        return;
    }

    const token =
        localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return;
    }

    totalElement.innerText = "...";
    todayElement.innerText = "...";
    anonymousElement.innerText = "...";

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
            result.success !== true
        ) {
            throw new Error(
                result?.error?.message ||
                result?.message ||
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

        const topRecipients =
            Array.isArray(
                result.topRecipients
            )
                ? result.topRecipients
                : [];

        const topSenders =
            Array.isArray(
                result.topSenders
            )
                ? result.topSenders
                : [];

        if (topReceiversList) {
            topReceiversList.innerHTML =
                topRecipients.length > 0
                    ? topRecipients
                        .map(item => `
                            <li>
                                ${escapeHtml(
                                    item.member?.fullName ||
                                    "Không xác định"
                                )}
                                —
                                ${Number(item.count) || 0}
                            </li>
                        `)
                        .join("")
                    : "<li>Chưa có dữ liệu.</li>";
        }

        if (topSendersList) {
            topSendersList.innerHTML =
                topSenders.length > 0
                    ? topSenders
                        .map(item => `
                            <li>
                                ${escapeHtml(
                                    item.member?.fullName ||
                                    "Không xác định"
                                )}
                                —
                                ${Number(item.count) || 0}
                            </li>
                        `)
                        .join("")
                    : "<li>Chưa có dữ liệu.</li>";
        }
    } catch (error) {
        console.error(
            "Load admin encouragement stats error:",
            error
        );

        totalElement.innerText = "—";
        todayElement.innerText = "—";
        anonymousElement.innerText = "—";

        if (topReceiversList) {
            topReceiversList.innerHTML =
                "<li>Không thể tải dữ liệu.</li>";
        }

        if (topSendersList) {
            topSendersList.innerHTML =
                "<li>Không thể tải dữ liệu.</li>";
        }
    }
}//hết


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


async function loadStudyMaterialsDemo() {
    const list =
        document.getElementById(
            "studyMaterialsList"
        );

    if (!list) {
        return;
    }

    list.innerHTML = `
        <p class="empty-note">
            Đang tải tài liệu học tập...
        </p>
    `;

    try {
        const result =
            await documentApiRequestDemo(
                "/api/documents"
            );

        const documents =
            Array.isArray(result.documents)
                ? result.documents
                : [];

        const materials =
            documents.map(
                mapDocumentToStudyMaterialDemo
            );

        if (materials.length === 0) {
            list.innerHTML = `
                <p class="empty-note">
                    Chưa có tài liệu học tập nào.
                </p>
            `;

            return;
        }

        list.innerHTML =
            materials.map(item => `
                <div class="material-session-card">
                    <div class="material-session-header">
                        <span class="material-session-badge">
                            ${escapeHtml(item.session)}
                        </span>

                        <div>
                            <h2>
                                ${escapeHtml(item.title)}
                            </h2>

                            <p>
                                ${escapeHtml(item.note)}
                            </p>
                        </div>
                    </div>

                    ${
                        item.bibleVerse ||
                        item.verseText
                            ? `
                                <div class="memory-verse-box">
                                    <p class="memory-verse-label">
                                        📖 Câu gốc
                                    </p>

                                    <h3>
                                        ${escapeHtml(
                                            item.bibleVerse
                                        )}
                                    </h3>

                                    <p>
                                        “${escapeHtml(
                                            item.verseText
                                        )}”
                                    </p>
                                </div>
                            `
                            : ""
                    }

                    <div class="material-files-list">
                        ${
                            item.files.map(file => `
                                <div class="material-file-card">
                                    <div class="material-file-icon">
                                        ${file.icon}
                                    </div>

                                    <div class="material-file-info">
                                        <h3>
                                            ${escapeHtml(
                                                file.name
                                            )}
                                        </h3>

                                        <p>
                                            ${escapeHtml(
                                                file.type
                                            )}
                                        </p>
                                    </div>

                                    <a
                                        class="material-open-btn"
                                        href="${escapeHtml(
                                            file.url
                                        )}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        ${
                                            getMaterialOpenButtonTextDemo(
                                                file.type
                                            )
                                        }
                                    </a>
                                </div>
                            `).join("")
                        }
                    </div>
                </div>
            `).join("");
    } catch (error) {
        console.error(
            "Load study materials error:",
            error
        );

        list.innerHTML = `
            <p
                class="empty-note"
                style="color: red;"
            >
                ${escapeHtml(
                    error.message ||
                    "Không thể tải tài liệu học tập."
                )}
            </p>
        `;
    }
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



//hàm thêm tài liệu
async function addStudyMaterialDemo() {
    const session =
        document.getElementById(
            "materialSession"
        )?.value.trim();

    const title =
        document.getElementById(
            "materialTitle"
        )?.value.trim();

    const bibleVerse =
        document.getElementById(
            "materialBibleVerse"
        )?.value.trim();

    const verseText =
        document.getElementById(
            "materialVerseText"
        )?.value.trim();

    const note =
        document.getElementById(
            "materialNote"
        )?.value.trim();

    const fileName =
        document.getElementById(
            "materialFileName"
        )?.value.trim();

    const fileType =
        document.getElementById(
            "materialFileType"
        )?.value;

    const fileUrl =
        document.getElementById(
            "materialFileUrl"
        )?.value.trim();

    const message =
        document.getElementById(
            "materialMessage"
        );

    if (
        !session ||
        !title ||
        !bibleVerse ||
        !verseText ||
        !note
    ) {
        message.style.color = "red";
        message.innerText =
            "Vui lòng nhập đầy đủ thông tin buổi học.";

        return;
    }

    if (
        !fileName ||
        !fileType ||
        !fileUrl
    ) {
        message.style.color = "red";
        message.innerText =
            "Vui lòng nhập đầy đủ thông tin tài liệu.";

        return;
    }

    const description = JSON.stringify({
        session,
        bibleVerse,
        verseText,
        note,
        fileName
    });

    message.style.color = "#555";

    message.innerText =
        editingMaterialId
            ? "Đang cập nhật tài liệu..."
            : "Đang thêm tài liệu...";

    try {
        const isEditing =
            Number.isInteger(
                Number(editingMaterialId)
            ) &&
            Number(editingMaterialId) > 0;

        const apiPath =
            isEditing
                ? `/api/admin/documents/${editingMaterialId}`
                : "/api/admin/documents";

        const method =
            isEditing
                ? "PUT"
                : "POST";

        await documentApiRequestDemo(
            apiPath,
            {
                method,

                body: JSON.stringify({
                    title,
                    description,
                    fileUrl,
                    fileType,
                    displayOrder: 0,
                    isPublished: true
                })
            }
        );

        message.style.color = "green";

        message.innerText =
            isEditing
                ? "Đã cập nhật tài liệu học tập thành công!"
                : "Đã thêm tài liệu học tập thành công!";

        resetStudyMaterialFormDemo();

        await loadAdminStudyMaterialsDemo();
    } catch (error) {
        console.error(
            "Save study material error:",
            error
        );

        message.style.color = "red";

        message.innerText =
            error.message ||
            "Không thể lưu tài liệu học tập.";
    }
}//hết


//hiển thị danh sách admin
async function loadAdminStudyMaterialsDemo() {
    const list =
        document.getElementById(
            "adminStudyMaterialsList"
        );

    if (!list) {
        return;
    }

    list.innerHTML = `
        <p class="empty-note">
            Đang tải danh sách tài liệu...
        </p>
    `;

    try {
        const result =
            await documentApiRequestDemo(
                "/api/admin/documents"
            );

        const documents =
            Array.isArray(result.documents)
                ? result.documents
                : [];

        studyMaterialsApiCache =
            documents.map(
                mapDocumentToStudyMaterialDemo
            );

        if (
            studyMaterialsApiCache.length === 0
        ) {
            list.innerHTML = `
                <p class="empty-note">
                    Chưa có tài liệu học tập nào.
                </p>
            `;

            return;
        }

        list.innerHTML =
            studyMaterialsApiCache.map(
                item => {
                    const file =
                        item.files?.[0] || {};

                    return `
                        <div class="admin-material-card">
                            <div class="admin-material-info">
                                <p class="material-session-badge">
                                    ${escapeHtml(
                                        item.session
                                    )}
                                </p>

                                <h3>
                                    ${escapeHtml(
                                        item.title
                                    )}
                                </h3>

                                ${
                                    item.bibleVerse
                                        ? `
                                            <p>
                                                <strong>
                                                    Câu gốc:
                                                </strong>

                                                ${escapeHtml(
                                                    item.bibleVerse
                                                )}
                                            </p>
                                        `
                                        : ""
                                }

                                ${
                                    item.verseText
                                        ? `
                                            <p>
                                                ${escapeHtml(
                                                    item.verseText
                                                )}
                                            </p>
                                        `
                                        : ""
                                }

                                ${
                                    item.note
                                        ? `
                                            <p>
                                                <strong>
                                                    Ghi chú:
                                                </strong>

                                                ${escapeHtml(
                                                    item.note
                                                )}
                                            </p>
                                        `
                                        : ""
                                }

                                <p>
                                    <strong>
                                        Tài liệu:
                                    </strong>

                                    ${escapeHtml(
                                        file.name || ""
                                    )}
                                </p>

                                <p>
                                    <strong>
                                        Loại:
                                    </strong>

                                    ${escapeHtml(
                                        file.type || ""
                                    )}
                                </p>

                                <p>
                                    <strong>
                                        Trạng thái:
                                    </strong>

                                    ${
                                        item.isPublished
                                            ? "Đang hiển thị"
                                            : "Đang ẩn"
                                    }
                                </p>

                                ${
                                    file.url
                                        ? `
                                            <a
                                                href="${escapeHtml(
                                                    file.url
                                                )}"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Mở tài liệu
                                            </a>
                                        `
                                        : ""
                                }
                            </div>

                            <div class="admin-material-actions">
                                <button
                                    type="button"
                                    onclick="editStudyMaterialDemo(${item.id})"
                                >
                                    Sửa
                                </button>

                                <button
                                    type="button"
                                    class="danger-btn"
                                    onclick="deleteStudyMaterialDemo(${item.id})"
                                >
                                    Xóa
                                </button>
                            </div>
                        </div>
                    `;
                }
            ).join("");
    } catch (error) {
        console.error(
            "Load admin study materials error:",
            error
        );

        studyMaterialsApiCache = [];

        list.innerHTML = `
            <p
                class="empty-note"
                style="color: red;"
            >
                ${escapeHtml(
                    error.message ||
                    "Không thể tải danh sách tài liệu."
                )}
            </p>
        `;
    }
}//hết

//hàm xóa tài liệu
async function deleteStudyMaterialDemo(
    materialId
) {
    const item =
        studyMaterialsApiCache.find(
            material =>
                Number(material.id) ===
                Number(materialId)
        );

    if (!item) {
        alert(
            "Không tìm thấy tài liệu cần xóa."
        );

        return;
    }

    const confirmed =
        confirm(
            `Bạn có chắc muốn xóa tài liệu "${item.title}" không?`
        );

    if (!confirmed) {
        return;
    }

    try {
        await documentApiRequestDemo(
            `/api/admin/documents/${materialId}`,
            {
                method: "DELETE"
            }
        );

        if (
            Number(editingMaterialId) ===
            Number(materialId)
        ) {
            resetStudyMaterialFormDemo();
        }

        await loadAdminStudyMaterialsDemo();

        alert(
            "Đã xóa tài liệu học tập thành công."
        );
    } catch (error) {
        console.error(
            "Delete study material error:",
            error
        );

        alert(
            error.message ||
            "Không thể xóa tài liệu học tập."
        );
    }
}//hết


//hàm edit
function editStudyMaterialDemo(materialId) {
    const item =
        studyMaterialsApiCache.find(
            material =>
                Number(material.id) ===
                Number(materialId)
        );

    if (!item) {
        alert(
            "Không tìm thấy tài liệu cần chỉnh sửa."
        );

        return;
    }

    const file =
        item.files?.[0] || {};

    editingMaterialId =
        Number(item.id);

    document.getElementById(
        "materialSession"
    ).value =
        item.session || "";

    document.getElementById(
        "materialTitle"
    ).value =
        item.title || "";

    document.getElementById(
        "materialBibleVerse"
    ).value =
        item.bibleVerse || "";

    document.getElementById(
        "materialVerseText"
    ).value =
        item.verseText || "";

    document.getElementById(
        "materialNote"
    ).value =
        item.note || "";

    document.getElementById(
        "materialFileName"
    ).value =
        file.name || "";

    document.getElementById(
        "materialFileType"
    ).value =
        file.type || "Link";

    document.getElementById(
        "materialFileUrl"
    ).value =
        file.url || "";

    const message =
        document.getElementById(
            "materialMessage"
        );

    if (message) {
        message.style.color = "#555";

        message.innerText =
            "Đang chỉnh sửa tài liệu. Hãy cập nhật thông tin rồi bấm lưu.";
    }

    const submitButton =
        document.querySelector(
            '[onclick="addStudyMaterialDemo()"]'
        );

    if (submitButton) {
        submitButton.innerText =
            "Cập nhật tài liệu";
    }

    const cancelButton =
        document.getElementById(
            "cancelEditMaterialBtn"
        );

    if (cancelButton) {
        cancelButton.style.display =
            "inline-block";
    }

    document.getElementById(
        "materialSession"
    )?.focus();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}//hết

//hàm reset chỉnh sửa
function resetStudyMaterialFormDemo() {
    editingMaterialId = null;

    const fieldIds = [
        "materialSession",
        "materialTitle",
        "materialBibleVerse",
        "materialVerseText",
        "materialNote",
        "materialFileName",
        "materialFileUrl"
    ];

    fieldIds.forEach(fieldId => {
        const field =
            document.getElementById(
                fieldId
            );

        if (field) {
            field.value = "";
        }
    });

    const fileType =
        document.getElementById(
            "materialFileType"
        );

    if (fileType) {
        fileType.value = "Link";
    }

    const message =
        document.getElementById(
            "materialMessage"
        );

    if (message) {
        message.innerText = "";
        message.style.color = "";
    }

    const submitButton =
        document.querySelector(
            '[onclick="addStudyMaterialDemo()"]'
        );

    if (submitButton) {
        submitButton.innerText =
            "Thêm tài liệu";
    }

    const cancelButton =
        document.getElementById(
            "cancelEditMaterialBtn"
        );

    if (cancelButton) {
        cancelButton.style.display =
            "none";
    }
}

function cancelEditStudyMaterialDemo() {
    resetStudyMaterialFormDemo();
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
    ${
        account
            ? `
                <button
                    class="profile-btn"
                    onclick="resetStudentPasswordDemo(
                        ${Number(member.id)},
                        '${escapeHtml(fullName)}',
                        this
                    )"
                    title="Reset mật khẩu về 123456"
                >
                    Reset
                </button>
            `
            : `
                <button
                    class="profile-btn"
                    disabled
                    title="Học viên chưa có tài khoản"
                >
                    Reset
                </button>
            `
    }
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


function exportMembersExcel() {
    if (
        typeof XLSX === "undefined"
    ) {
        alert(
            "Thư viện xuất Excel chưa được tải."
        );

        return;
    }

    const tableBody =
        document.getElementById(
            "adminMembersTableBody"
        );

    if (!tableBody) {
        alert(
            "Không tìm thấy bảng thành viên."
        );

        return;
    }

    const tableRows =
        Array.from(
            tableBody.querySelectorAll("tr")
        );

    const exportRows =
        tableRows
            .map(row => {
                const cells =
                    row.querySelectorAll("td");

                /*
                 * Bỏ qua:
                 * - Dòng thông báo chưa có dữ liệu.
                 * - Cột Mật khẩu.
                 * - Cột Thao tác.
                 */
                if (cells.length < 7) {
                    return null;
                }

                return {
                    "Mã TKH":
                        cells[0].innerText.trim(),

                    "Họ và tên":
                        cells[1].innerText.trim(),

                    "Giới tính":
                        cells[2].innerText.trim(),

                    "Ngày sinh":
                        cells[3].innerText.trim(),

                    "Điện thoại":
                        cells[4].innerText.trim(),

                    "Nhóm nhỏ":
                        cells[5].innerText.trim(),

                    "Vai trò":
                        cells[6].innerText.trim()
                };
            })
            .filter(Boolean);

    if (exportRows.length === 0) {
        alert(
            "Chưa có thành viên để xuất Excel."
        );

        return;
    }

    const worksheet =
        XLSX.utils.json_to_sheet(
            exportRows
        );

    /*
     * Đặt độ rộng cột để file dễ đọc.
     */
    worksheet["!cols"] = [
        { wch: 12 },
        { wch: 30 },
        { wch: 12 },
        { wch: 14 },
        { wch: 18 },
        { wch: 20 },
        { wch: 14 }
    ];

    /*
     * Bật bộ lọc trên dòng tiêu đề.
     */
    worksheet["!autofilter"] = {
        ref: `A1:G${exportRows.length + 1}`
    };

    const workbook =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Danh sách thành viên"
    );

    const today =
        new Date();

    const dateText = [
        today.getFullYear(),
        String(
            today.getMonth() + 1
        ).padStart(2, "0"),
        String(
            today.getDate()
        ).padStart(2, "0")
    ].join("-");

    XLSX.writeFile(
        workbook,
        `TKH-2026-Danh-sach-thanh-vien-${dateText}.xlsx`
    );
}

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

function normalizeAvatarFileNameDemo(fullName) {
    return String(fullName || "")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();
}


function getMemberAvatarUrlDemo(member) {
    const tkhCode = String(
        member?.tkhCode ||
        member?.username ||
        ""
    )
        .trim()
        .toLowerCase();

    /*
     * Hai trường hợp trùng tên Nguyễn Thanh Vân
     * dùng mã TKH làm tên file.
     */
    const avatarByTkhCode = [
        "tkh043",
        "tkh165"
    ];

    if (
        tkhCode &&
        avatarByTkhCode.includes(tkhCode)
    ) {
        return (
            "assets/images/members/" +
            tkhCode +
            ".jpg"
        );
    }

    const normalizedFullName =
        normalizeAvatarFileNameDemo(
            member?.fullName
        );

    if (!normalizedFullName) {
        return (
            "assets/images/members/" +
            "default-avatar.jpg"
        );
    }

    return (
        "assets/images/members/" +
        normalizedFullName +
        ".jpg"
    );
}


function setMemberAvatarDemo(
    imageElement,
    member
) {
    if (!imageElement) {
        return;
    }

    imageElement.src =
        getMemberAvatarUrlDemo(member);

    imageElement.alt =
        "Avatar của " +
        (
            member?.fullName ||
            "thành viên"
        );

    imageElement.onerror = function() {
        this.onerror = null;
        this.src =
            "assets/images/members/" +
            "default-avatar.jpg";
    };
}

/* =====================================================
   GROUP LOGO HELPERS
   ===================================================== */

const GROUP_LOGO_FILE_MAP_DEMO = {
    "Ca-lép": "Ca-lép.jpg",
    "E-xơ-ra": "E-xơ-ra.jpg",
    "Giê-rê-mi": "Giê-rê-mi.jpg",
    "Giô-na-than": "Giô-na-than.jpg",
    "Ma-ri": "Ma-ri.jpg",
    "Nê-hê-mi": "Nê-hê-mi.jpg",
    "Sa-ra": "Sa-ra.jpg",
    "Ti-mô-thê": "Ti-mô-thê.jpg"
};

function getGroupLogoUrlDemo(group) {
    const groupName =
        typeof group === "string"
            ? group
            : (
                group?.name ||
                group?.groupName ||
                group?.group_name ||
                ""
            );

    const normalizedName =
        String(groupName).trim();

    const fileName =
        GROUP_LOGO_FILE_MAP_DEMO[normalizedName];

    if (!fileName) {
        return "assets/images/groups/default-group.jpg";
    }

    return `assets/images/groups/${encodeURIComponent(fileName)}`;
}

function setGroupLogoDemo(imageElement, group) {
    if (!imageElement) {
        return;
    }

    imageElement.onerror = function () {
        this.onerror = null;
        this.src =
            "assets/images/groups/default-group.jpg";
    };

    imageElement.src =
        getGroupLogoUrlDemo(group);
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
                    <img
                    class="student-avatar student-avatar-image"
                    src="${getMemberAvatarUrlDemo({
                        ...student,
                        tkhCode:
                            student.tkhCode ||
                            student.username
                    })}"
                    alt="Avatar của ${escapeHtml(student.fullName)}"
                    onerror="
                        this.onerror = null;
                        this.src =
                            'assets/images/members/default-avatar.jpg';
                    "
                >

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

async function loadScoreStudentOptionsDemo() {
    const select =
        document.getElementById(
            "scoreUser"
        );

    if (!select) {
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

    select.innerHTML = `
        <option value="">
            Đang tải danh sách học viên...
        </option>
    `;

    select.disabled = true;

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/members`,
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

        if (response.status === 401) {
            logoutDemo();
            return;
        }

        if (
            !response.ok ||
            result.success !== true
        ) {
            throw new Error(
                result?.error?.message ||
                "Không thể tải danh sách học viên."
            );
        }

        const members =
            Array.isArray(
                result.data?.members
            )
                ? result.data.members
                : [];

        const availableMembers =
            members.filter(item =>
                item.account?.username
            );

        if (
            availableMembers.length === 0
        ) {
            select.innerHTML = `
                <option value="">
                    Chưa có học viên hợp lệ
                </option>
            `;

            return;
        }

        select.innerHTML = `
            <option value="">
                Chọn học viên
            </option>

            ${
                availableMembers
                    .map(item => {
                        const member =
                            item.member || {};

                        const groupName =
                            item.group?.name ||
                            "Chưa phân nhóm";

                        const username =
                            item.account
                                .username;

                        const tkhCode =
                            member.tkhCode ||
                            username;

                        return `
                            <option
                                value="${escapeHtml(
                                    username
                                )}"
                            >
                                ${escapeHtml(
                                    tkhCode
                                )}
                                -
                                ${escapeHtml(
                                    member.fullName ||
                                    username
                                )}
                                -
                                ${escapeHtml(
                                    groupName
                                )}
                            </option>
                        `;
                    })
                    .join("")
            }
        `;

        select.disabled = false;

    } catch (error) {
        console.error(
            "Load score member options error:",
            error
        );

        select.innerHTML = `
            <option value="">
                Không thể tải danh sách học viên
            </option>
        `;
    }
}


//hàm tên loại điểm và lịch sử điểm
function getScoreTypeLabelDemo(scoreType) {
    const normalizedType =
        String(scoreType || "")
            .trim()
            .toUpperCase();

    const labels = {
        BIBLE_CHALLENGE:
            "Trả bài cũ / Bible Challenge",
        ATTENDANCE:
            "Điểm danh",
        ATTENDANCE_ADJUSTMENT:
            "Điểm danh thủ công",
        MEMORY_VERSE:
            "Thuộc câu gốc",
        GAME:
            "Trò chơi",
        LATE:
            "Đi trễ",
        PARTICIPATION:
            "Phát biểu",
        PRE_TEST:
            "Pre-test",
        FINAL_TEST:
            "Final Test"
    };

    return (
        labels[normalizedType] ||
        scoreType ||
        "Thủ công"
    );
}

async function getAdminScoreHistoryApiData(
  forceRefresh = false
) {
  if (
    forceRefresh ||
    !adminScoreHistoryApiPromise
  ) {
    adminScoreHistoryApiPromise =
      (async () => {
        const token =
          localStorage.getItem(
            "accessToken"
          );

        if (!token) {
          logoutDemo();
          return null;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/scores/admin/history?limit=100`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

        let result = null;

        try {
          result =
            await response.json();
        } catch (error) {
          result = null;
        }

        if (response.status === 401) {
          logoutDemo();
          return null;
        }

        if (response.status === 403) {
          throw new Error(
            "Bạn không có quyền xem lịch sử điểm."
          );
        }

        if (
          !response.ok ||
          result?.success !== true
        ) {
          throw new Error(
            result?.error?.message ||
            "Không thể tải lịch sử điểm."
          );
        }

        adminScoreHistoryApiCache =
          Array.isArray(
            result.data?.transactions
          )
            ? result.data.transactions
            : [];

        adminScoreSummaryApiCache =
          result.data?.summary || {
            totalRecords: 0,
            totalAppliedPoints: 0
          };

        return result.data;
      })()
      .catch(error => {
        adminScoreHistoryApiPromise =
          null;

        throw error;
      });
  }

  return adminScoreHistoryApiPromise;
}

async function loadAdminScoreHistoryDemo(
  forceRefresh = false
) {
  const tableBody =
    document.getElementById(
      "adminScoreHistoryBody"
    );

  if (!tableBody) {
    return;
  }

  tableBody.innerHTML = `
    <tr>
      <td colspan="6">
        Đang tải lịch sử điểm...
      </td>
    </tr>
  `;

  try {
    const data =
      await getAdminScoreHistoryApiData(
        forceRefresh
      );

    if (!data) {
      return;
    }

    const transactions =
      Array.isArray(
        data.transactions
      )
        ? data.transactions
        : [];

    if (transactions.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6">
            Chưa có lịch sử điểm.
          </td>
        </tr>
      `;

      return;
    }

    tableBody.innerHTML =
      transactions.map(item => {
        const createdDate =
          parseSqlLocalDateTime(
            item.createdAt
          );

        const createdAtText =
          createdDate
            ? createdDate
                .toLocaleString(
                  "vi-VN"
                )
            : "—";

        const appliedPoints =
          Number(
            item.appliedPoints
          ) || 0;

        const pointClass =
            appliedPoints > 0
                ? "score-positive"
                : appliedPoints < 0
                    ? "score-negative"
                    : "";

        const statusText =
          item.status === "ACTIVE"
            ? ""
            : ` (${item.status})`;

        const memberName =
          item.member?.fullName ||
          "Không xác định";

        const tkhCode =
          item.member?.tkhCode ||
          item.member?.username ||
          "—";

        const groupName =
          item.group?.name ||
          "Chưa phân nhóm";

        return `
          <tr>
            <td>
              ${escapeHtml(
                createdAtText
              )}
            </td>

            <td>
              ${escapeHtml(
                memberName
              )}
              <br>

              <small>
                ${escapeHtml(
                  tkhCode
                )}
              </small>
            </td>

            <td>
              ${escapeHtml(
                groupName
              )}
            </td>

            <td>
              ${escapeHtml(
                item.scoreTypeLabel ||
                item.scoreType ||
                "Không xác định"
              )}
            </td>

            <td class="${pointClass}">
                ${
                    appliedPoints > 0
                        ? "+"
                        : ""
                }${appliedPoints}${escapeHtml(
                    statusText
                )}
            </td>

            <td>
              ${escapeHtml(
                item.description ||
                "—"
              )}
            </td>
          </tr>
        `;
      }).join("");
  } catch (error) {
    console.error(
      "Load admin score history error:",
      error
    );

    tableBody.innerHTML = `
      <tr>
        <td colspan="6">
          ${escapeHtml(
            error.message ||
            "Không thể tải lịch sử điểm."
          )}
        </td>
      </tr>
    `;
  }
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

                const scoreTypeLabel =
                    item.scoreTypeLabel ||
                    getScoreTypeLabelDemo(
                        item.scoreType
                    );

                const description =
                    item.description ||
                    scoreTypeLabel ||
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
                                    scoreTypeLabel ||
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

let adminScoreHistoryApiCache = [];
let adminScoreSummaryApiCache = null;
let adminScoreHistoryApiPromise = null;

let adminScoreExamsApiCache = [];
let adminScoreExamsApiPromise = null;

let manualScoreImportValidatedFile = null;
let manualScoreImportValidationData = null;
let manualScoreImportInProgress = false;

let disciplineGroupsApiCache = [];
let disciplineSelectedScoreApi = null;
let disciplineSaveInProgress = false;

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

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


let individualRankingApiPromise = null;


async function getIndividualRankingApiData(
    forceRefresh = false
) {
    if (
        forceRefresh ||
        !individualRankingApiPromise
    ) {
        individualRankingApiPromise =
            (async () => {
                const token =
                    localStorage.getItem(
                        "accessToken"
                    );

                if (!token) {
                    window.location.href =
                        "index.html";

                    throw new Error(
                        "Phiên đăng nhập không tồn tại."
                    );
                }

                const response =
                    await fetch(
                        `${API_BASE_URL}/api/scores/individuals`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    );

                let result = null;

                try {
                    result =
                        await response.json();
                } catch (error) {
                    throw new Error(
                        "Backend trả về dữ liệu không hợp lệ."
                    );
                }

                if (response.status === 401) {
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

                    throw new Error(
                        "Phiên đăng nhập đã hết hạn."
                    );
                }

                if (
                    !response.ok ||
                    !result.success
                ) {
                    throw new Error(
                        result?.error?.message ||
                        "Không thể tải bảng xếp hạng cá nhân."
                    );
                }

                return result.data;
            })()
            .catch(error => {
                individualRankingApiPromise =
                    null;

                throw error;
            });
    }

    return individualRankingApiPromise;
}


async function loadTopPersonalRankingDemo() {
    const tableBody =
        document.getElementById(
            "topPersonalRankingBody"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="3">
                Đang tải bảng xếp hạng...
            </td>
        </tr>
    `;

    try {
        const data =
            await getIndividualRankingApiData();

        const ranking =
            Array.isArray(data?.top10)
                ? data.top10
                : [];

        if (ranking.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3">
                        Chưa có dữ liệu xếp hạng.
                    </td>
                </tr>
            `;

            return;
        }

        tableBody.innerHTML =
            ranking.map(item => {
                const rankingNumber =
                    Number(item.ranking) || "-";

                const fullName =
                    item.member?.fullName ||
                    "Không xác định";

                const groupName =
                    item.group?.name ||
                    "Chưa phân nhóm";

                return `
                    <tr>
                        <td>
                            #${rankingNumber}
                        </td>

                        <td>
                            ${escapeHtml(fullName)}
                        </td>

                        <td>
                            ${escapeHtml(groupName)}
                        </td>
                    </tr>
                `;
            }).join("");
    } catch (error) {
        console.error(
            "Load personal rankings error:",
            error
        );

        tableBody.innerHTML = `
            <tr>
                <td colspan="3">
                    Không thể tải bảng xếp hạng cá nhân.
                </td>
            </tr>
        `;
    }
}


async function loadMyPersonalRankDemo() {
    const rankElement =
        document.getElementById(
            "myPersonalRank"
        );

    const rankTextElement =
        document.getElementById(
            "myPersonalRankText"
        );

    if (
        !rankElement ||
        !rankTextElement
    ) {
        return;
    }

    rankElement.innerText = "...";

    rankTextElement.innerText =
        "Đang tải xếp hạng";

    try {
        const data =
            await getIndividualRankingApiData();

        const myRanking =
            data?.myRanking || null;

        if (!myRanking) {
            rankElement.innerText = "-";

            rankTextElement.innerText =
                "Chưa có dữ liệu xếp hạng";

            return;
        }

        rankElement.innerText =
            `#${myRanking.ranking}`;

        rankTextElement.innerText =
            `Trong ${Number(data.total) || 0} học viên`;
    } catch (error) {
        console.error(
            "Load personal rank error:",
            error
        );

        rankElement.innerText = "-";

        rankTextElement.innerText =
            "Không thể tải xếp hạng";
    }
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

async function closeManualCheckinWindowsDemo() {
    const message =
        document.getElementById(
            "adminCheckinWindowMessage"
        );

    const token =
        localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return;
    }

    if (message) {
        message.style.color = "#6b7280";
        message.innerText =
            "Đang đóng tất cả khung điểm danh...";
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/attendance/admin/current-session/window`,
            {
                method: "PATCH",
                headers: {
                    Authorization:
                        `Bearer ${token}`,
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    windowType: null
                })
            }
        );

        const result =
            await response.json();

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
            !result.success
        ) {
            throw new Error(
                result?.error?.message ||
                "Không thể đóng khung điểm danh."
            );
        }

        /*
         * Chỉ cập nhật localStorage sau khi
         * Backend đã đóng khung thành công.
         */
        saveManualCheckinWindowDemo("");

        if (message) {
            message.style.color = "green";
            message.innerText =
                "Đã đóng tất cả khung điểm danh buổi học.";
        }

        /*
         * Làm mới trạng thái trên trang Admin.
         */
        loadAdminCheckinWindowStatusDemo();
        loadActiveCheckinWindowDemo();

        /*
         * Đồng bộ lại dữ liệu phiên hiện tại
         * nếu hàm này đang chạy trên trang có thông tin phiên.
         */
        await loadAttendancePageData();

    } catch (error) {
        console.error(
            "Close attendance windows error:",
            error
        );

        if (message) {
            message.style.color = "#dc2626";
            message.innerText =
                error.message ||
                "Không thể kết nối Backend.";
        }
    }
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
    const warningList =
        document.getElementById("deviceWarningList");

    if (!warningList) {
        return;
    }

    const suspiciousDevices =
        Array.isArray(
            adminAttendanceDeviceWarningsApiCache
        )
            ? adminAttendanceDeviceWarningsApiCache
            : [];

    if (suspiciousDevices.length === 0) {
        warningList.innerHTML = `
            <p class="empty-note">
                Chưa phát hiện thiết bị điểm danh nhiều tài khoản.
            </p>
        `;

        return;
    }

    warningList.innerHTML =
        suspiciousDevices.map(warning => {
            const deviceId =
                warning.deviceId ||
                "Không xác định";

            const accountCount =
                Number(warning.accountCount) || 0;

            const members =
                Array.isArray(warning.members)
                    ? warning.members
                    : [];

            return `
                <div class="question-card warning-card">
                    <h3>
                        ⚠️ Thiết bị có ${accountCount}
                        tài khoản điểm danh
                    </h3>

                    <p class="question-meta">
                        Mã thiết bị:
                        ${escapeHtml(deviceId)}
                    </p>

                    ${
                        members.map(member => `
                            <p>
                                <strong>
                                    ${escapeHtml(
                                        member.fullName ||
                                        "Không xác định"
                                    )}
                                </strong>

                                ${
                                    member.seasonMembershipId
                                        ? `(Membership ${Number(
                                            member.seasonMembershipId
                                        )})`
                                        : ""
                                }

                                · Nhóm
                                ${escapeHtml(
                                    member.groupName ||
                                    "Chưa phân nhóm"
                                )}
                            </p>
                        `).join("")
                    }
                </div>
            `;
        }).join("");
}


let adminAttendanceRosterApiCache = [];
let adminAttendanceSummaryApiCache = null;
let adminAttendanceCurrentSessionApi = null;
let adminAttendanceDeviceWarningsApiCache = [];



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
            adminAttendanceDeviceWarningsApiCache = [];

            loadDeviceWarningDemo();

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

            adminAttendanceDeviceWarningsApiCache =
                Array.isArray(result.data.deviceWarnings)
                    ? result.data.deviceWarnings
                    : [];

            loadDeviceWarningDemo();

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
        alert(
            "Không thể tải file Excel vì thư viện XLSX chưa được nạp."
        );

        return;
    }

    const roster =
        Array.isArray(
            adminAttendanceRosterApiCache
        )
            ? adminAttendanceRosterApiCache
            : [];

    if (roster.length === 0) {
        alert(
            "Chưa có dữ liệu điểm danh để xuất Excel."
        );

        return;
    }

    const currentSession =
        adminAttendanceCurrentSessionApi ||
        null;

    const sessionStartDate =
        currentSession?.scheduledStartAt
            ? parseSqlLocalDateTime(
                currentSession.scheduledStartAt
            )
            : null;

    const sessionDateText =
        sessionStartDate
            ? sessionStartDate
                .toLocaleDateString("vi-VN")
            : "—";

    const sessionName =
        currentSession?.name ||
        "Buổi học hiện tại";

    const attendanceRows = [];

    roster.forEach(item => {
        const records =
            Array.isArray(
                item.attendanceRecords
            )
                ? item.attendanceRecords
                : [];

        const groupName =
            item.group?.name ||
            "Chưa phân nhóm";

        /*
         * Học viên chưa có lần điểm danh nào:
         * vẫn xuất một dòng để BTC nhìn thấy trạng thái vắng.
         */
        if (records.length === 0) {
            attendanceRows.push({
                "Buổi học":
                    sessionName,

                "Ngày học":
                    sessionDateText,

                "Mã TKH":
                    item.tkhCode || "—",

                "Họ và tên":
                    item.fullName || "—",

                "Nhóm":
                    groupName,

                "Khung điểm danh":
                    "—",

                "Giờ điểm danh":
                    "—",

                "Phương thức":
                    "—",

                "Khoảng cách":
                    "—",

                "Độ chính xác GPS":
                    "—",

                "Điểm":
                    0,

                "Trạng thái":
                    "Chưa điểm danh"
            });

            return;
        }

        /*
         * Mỗi bản ghi điểm danh tạo thành một dòng Excel riêng.
         *
         * Ví dụ một học viên đã điểm danh:
         * - Đầu giờ
         * - Cuối giờ
         *
         * thì file Excel sẽ có hai dòng.
         */
        records.forEach(record => {
            const checkedInDate =
                record.checkedInAt
                    ? parseSqlLocalDateTime(
                        record.checkedInAt
                    )
                    : null;

            const checkedInText =
                checkedInDate
                    ? checkedInDate
                        .toLocaleString("vi-VN")
                    : "—";

            const methodLabels = {
                GPS:
                    "GPS",

                MANUAL:
                    "Thủ công",

                QR:
                    "QR"
            };

            const method =
                methodLabels[
                    String(
                        record.method || ""
                    ).toUpperCase()
                ] ||
                record.method ||
                "—";

            const statusLabels = {
                PRESENT:
                    "Có mặt",

                LATE:
                    "Đi trễ",

                ABSENT:
                    "Vắng",

                EXCUSED:
                    "Có phép"
            };

            const status =
                statusLabels[
                    String(
                        record.status || ""
                    ).toUpperCase()
                ] ||
                record.status ||
                "Có mặt";

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
                    ? `${Number(
                        record.accuracyM
                    ).toFixed(1)} m`
                    : "—";

            attendanceRows.push({
                "Buổi học":
                    sessionName,

                "Ngày học":
                    sessionDateText,

                "Mã TKH":
                    item.tkhCode || "—",

                "Họ và tên":
                    item.fullName || "—",

                "Nhóm":
                    groupName,

                "Khung điểm danh":
                    getAttendanceWindowLabel(
                        record.windowType
                    ),

                "Giờ điểm danh":
                    checkedInText,

                "Phương thức":
                    method,

                "Khoảng cách":
                    distanceText,

                "Độ chính xác GPS":
                    accuracyText,

                "Điểm":
                    Number(record.points) || 0,

                "Trạng thái":
                    status
            });
        });
    });

    /*
     * Sắp xếp:
     * Nhóm → mã TKH → thứ tự khung điểm danh.
     */
    const windowOrder = {
        MORNING: 1,
        BREAK: 2,
        END: 3,
        DEVOTION: 4
    };

    attendanceRows.sort((a, b) => {
        const groupCompare =
            String(a["Nhóm"])
                .localeCompare(
                    String(b["Nhóm"]),
                    "vi"
                );

        if (groupCompare !== 0) {
            return groupCompare;
        }

        const memberCompare =
            String(a["Mã TKH"])
                .localeCompare(
                    String(b["Mã TKH"]),
                    "vi",
                    {
                        numeric: true
                    }
                );

        if (memberCompare !== 0) {
            return memberCompare;
        }

        const labelToType = {
            "Đầu giờ": "MORNING",
            "Giờ ra chơi": "BREAK",
            "Cuối giờ": "END",
            "Tĩnh nguyện": "DEVOTION"
        };

        return (
            windowOrder[
                labelToType[
                    a["Khung điểm danh"]
                ]
            ] || 99
        ) - (
            windowOrder[
                labelToType[
                    b["Khung điểm danh"]
                ]
            ] || 99
        );
    });

    const workbook =
        XLSX.utils.book_new();

    const attendanceSheet =
        XLSX.utils.json_to_sheet(
            attendanceRows
        );

    attendanceSheet["!cols"] = [
        { wch: 24 }, // Buổi học
        { wch: 14 }, // Ngày học
        { wch: 12 }, // Mã TKH
        { wch: 30 }, // Họ tên
        { wch: 20 }, // Nhóm
        { wch: 20 }, // Khung
        { wch: 24 }, // Giờ điểm danh
        { wch: 14 }, // Phương thức
        { wch: 16 }, // Khoảng cách
        { wch: 20 }, // Độ chính xác
        { wch: 10 }, // Điểm
        { wch: 18 }  // Trạng thái
    ];

    attendanceSheet["!autofilter"] = {
        ref:
            `A1:L${attendanceRows.length + 1}`
    };

    XLSX.utils.book_append_sheet(
        workbook,
        attendanceSheet,
        "Điểm danh"
    );

    /*
     * SHEET 2: Cảnh báo thiết bị
     */
    const warningRows = [
        [
            "Mã thiết bị",
            "Mã thành viên",
            "Họ tên",
            "Nhóm",
            "Lý do"
        ]
    ];

    const suspiciousDevices =
        Array.isArray(
            adminAttendanceDeviceWarningsApiCache
        )
            ? adminAttendanceDeviceWarningsApiCache
            : [];

    if (suspiciousDevices.length === 0) {
        warningRows.push([
            "—",
            "—",
            "—",
            "—",
            "Không có cảnh báo thiết bị"
        ]);
    } else {
        suspiciousDevices.forEach(
            warning => {
                const deviceId =
                    warning.deviceId || "";

                const members =
                    Array.isArray(
                        warning.members
                    )
                        ? warning.members
                        : [];

                members.forEach(member => {
                    warningRows.push([
                        deviceId,

                        member.tkhCode ||
                        member.seasonMembershipId ||
                        "",

                        member.fullName ||
                        "",

                        member.groupName ||
                        "",

                        "Thiết bị này đã được sử dụng để điểm danh từ 2 tài khoản trở lên"
                    ]);
                });
            }
        );
    }

    const warningSheet =
        XLSX.utils.aoa_to_sheet(
            warningRows
        );

    warningSheet["!cols"] = [
        { wch: 40 },
        { wch: 16 },
        { wch: 30 },
        { wch: 20 },
        { wch: 65 }
    ];

    XLSX.utils.book_append_sheet(
        workbook,
        warningSheet,
        "Cảnh báo thiết bị"
    );

    /*
     * Tên file theo buổi học.
     */
    const safeSessionName =
        String(sessionName)
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .replace(
                /[^a-zA-Z0-9]+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            ) ||
        "BuoiHoc";

    const safeDate =
        sessionStartDate
            ? [
                sessionStartDate
                    .getFullYear(),

                String(
                    sessionStartDate
                        .getMonth() + 1
                ).padStart(2, "0"),

                String(
                    sessionStartDate
                        .getDate()
                ).padStart(2, "0")
            ].join("")
            : "KhongRoNgay";

    const fileName =
        `TKH2026_Attendance_` +
        `${safeSessionName}_` +
        `${safeDate}.xlsx`;

    XLSX.writeFile(
        workbook,
        fileName
    );
}
//hết




function loadAdminAttendanceStatsDemo() {
    const totalElement =
        document.getElementById(
            "adminTotalStudents"
        );

    const checkedElement =
        document.getElementById(
            "adminCheckedInStudents"
        );

    const absentElement =
        document.getElementById(
            "adminAbsentStudents"
        );

    const percentElement =
        document.getElementById(
            "adminCheckedInPercent"
        );

    const morningElement =
        document.getElementById(
            "morningCheckinCount"
        );

    const breakElement =
        document.getElementById(
            "breakCheckinCount"
        );

    const endElement =
        document.getElementById(
            "endCheckinCount"
        );

    const devotionElement =
        document.getElementById(
            "devotionCheckinCount"
        );

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
        Number(summary.totalStudents) || 0;

    if (checkedElement) {
        checkedElement.innerText =
            Number(summary.checkedInCount) || 0;
    }

    if (absentElement) {
        absentElement.innerText =
            Number(summary.absentCount) || 0;
    }

    if (percentElement) {
        percentElement.innerText =
            `${Number(
                summary.checkedInPercent || 0
            ).toFixed(1)}%`;
    }

    /*
     * Đếm số học viên đã điểm danh
     * theo từng khung giờ.
     *
     * Mỗi học viên chỉ được tính tối đa 1 lần
     * trong cùng một khung giờ.
     */
    const windowCounts = {
        MORNING: 0,
        BREAK: 0,
        END: 0,
        DEVOTION: 0
    };

    const roster =
        Array.isArray(
            adminAttendanceRosterApiCache
        )
            ? adminAttendanceRosterApiCache
            : [];

    roster.forEach(item => {
        const records =
            Array.isArray(
                item.attendanceRecords
            )
                ? item.attendanceRecords
                : [];

        const studentWindowTypes =
            new Set(
                records
                    .map(record =>
                        String(
                            record.windowType || ""
                        )
                            .trim()
                            .toUpperCase()
                    )
                    .filter(Boolean)
            );

        studentWindowTypes.forEach(
            windowType => {
                if (
                    Object.prototype.hasOwnProperty.call(
                        windowCounts,
                        windowType
                    )
                ) {
                    windowCounts[windowType] += 1;
                }
            }
        );
    });

    if (morningElement) {
        morningElement.innerText =
            windowCounts.MORNING;
    }

    if (breakElement) {
        breakElement.innerText =
            windowCounts.BREAK;
    }

    if (endElement) {
        endElement.innerText =
            windowCounts.END;
    }

    if (devotionElement) {
        devotionElement.innerText =
            windowCounts.DEVOTION;
    }
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

async function loadAdminEncouragementReviewDemo() {
    const list =
        document.getElementById(
            "adminEncouragementReviewList"
        );

    if (!list) {
        return;
    }

    const token =
        localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return;
    }

    list.innerHTML = `
        <p class="empty-note">
            Đang tải lời khích lệ...
        </p>
    `;

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/encouragements`,
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
            result.success !== true
        ) {
            throw new Error(
                result?.error?.message ||
                result?.message ||
                "Không thể tải danh sách lời khích lệ."
            );
        }

        const messages =
            Array.isArray(
                result.encouragements
            )
                ? result.encouragements
                : [];

        if (messages.length === 0) {
            list.innerHTML = `
                <p class="empty-note">
                    Chưa có lời khích lệ nào.
                </p>
            `;

            return;
        }

        list.innerHTML =
            messages.map(item => {
                const senderName =
                    item.sender?.fullName ||
                    "Không xác định";

                const senderUsername =
                    item.sender?.username ||
                    "-";

                const recipientName =
                    item.recipient?.fullName ||
                    "Không xác định";

                const recipientUsername =
                    item.recipient?.username ||
                    "-";

                const createdAt =
                    item.createdAt
                        ? new Date(
                            item.createdAt
                        ).toLocaleString(
                            "vi-VN"
                        )
                        : "-";

                return `
                    <div class="question-card">
                        <h3>
                            ${
                                item.isAnonymous
                                    ? "🎭 Ẩn danh với người nhận"
                                    : "💌 Công khai"
                            }
                        </h3>

                        <p>
                            <strong>Người gửi thật:</strong>
                            ${escapeHtml(senderName)}
                            (${escapeHtml(senderUsername)})
                        </p>

                        <p>
                            <strong>Người nhận:</strong>
                            ${escapeHtml(recipientName)}
                            (${escapeHtml(recipientUsername)})
                        </p>

                        <p class="question-meta">
                            Thời gian gửi:
                            ${escapeHtml(createdAt)}
                            · Trạng thái đọc:
                            ${
                                item.isRead
                                    ? "Đã đọc"
                                    : "Chưa đọc"
                            }
                            · Trạng thái:
                            ${escapeHtml(item.status || "-")}
                        </p>

                        <button
                            class="profile-btn"
                            onclick="toggleAdminEncouragementContentDemo(${Number(item.id)})"
                        >
                            Xem nội dung
                        </button>

                        <div
                            id="adminEncouragementContent_${Number(item.id)}"
                            class="admin-encouragement-content"
                            style="display: none;"
                        >
                            <p>
                                <strong>Nội dung:</strong>
                            </p>

                            <p>
                                ${escapeHtml(item.message)}
                            </p>
                        </div>
                    </div>
                `;
            }).join("");
    } catch (error) {
        console.error(
            "Load admin encouragement review error:",
            error
        );

        list.innerHTML = `
            <p
                class="empty-note"
                style="color: red;"
            >
                Không thể tải lời khích lệ.
            </p>
        `;
    }
}

function toggleAdminEncouragementContentDemo(
    encouragementId
) {
    const content =
        document.getElementById(
            "adminEncouragementContent_" +
            encouragementId
        );

    if (!content) {
        return;
    }

    content.style.display =
        content.style.display === "none"
            ? "block"
            : "none";
}

function downloadQuestionsByTypeDemo(questionType) {
    const normalizedVisibility =
        String(questionType || "")
            .trim()
            .toUpperCase();

    if (
        normalizedVisibility !== "PUBLIC" &&
        normalizedVisibility !== "PRIVATE"
    ) {
        alert("Loại câu hỏi không hợp lệ.");
        return;
    }

    const questions =
        Array.isArray(adminQuestionsApiCache)
            ? adminQuestionsApiCache.filter(
                item =>
                    String(item.visibility || "")
                        .toUpperCase() ===
                    normalizedVisibility
            )
            : [];

    if (questions.length === 0) {
        alert(
            normalizedVisibility === "PRIVATE"
                ? "Chưa có câu hỏi riêng tư để tải xuống."
                : "Chưa có câu hỏi công khai để tải xuống."
        );

        return;
    }

    const typeLabel =
        normalizedVisibility === "PRIVATE"
            ? "Cau-hoi-rieng-tu"
            : "Cau-hoi-cong-khai";

    const typeDisplay =
        normalizedVisibility === "PRIVATE"
            ? "Riêng tư"
            : "Công khai";

    const header = [
        "Buổi học",
        "Loại câu hỏi",
        "Học viên",
        "Mã TKH",
        "Tài khoản",
        "Nhóm",
        "Nội dung câu hỏi",
        "Trạng thái",
        "Phản hồi BTC",
        "Thời gian gửi",
        "Thời gian phản hồi"
    ];

    const rows = questions.map(item => {
        const createdDate =
            parseSqlLocalDateTime(
                item.createdAt
            );

        const respondedDate =
            parseSqlLocalDateTime(
                item.respondedAt
            );

        const createdAt =
            createdDate
                ? createdDate.toLocaleString(
                    "vi-VN"
                )
                : "";

        const respondedAt =
            respondedDate
                ? respondedDate.toLocaleString(
                    "vi-VN"
                )
                : "";

        const statusLabel =
            item.status === "ANSWERED"
                ? "Đã trả lời"
                : item.status === "CLOSED"
                    ? "Đã đóng"
                    : item.status === "HIDDEN"
                        ? "Đã ẩn"
                        : "Đang chờ phản hồi";

        return [
            item.session?.name || "",
            typeDisplay,
            item.member?.fullName || "",
            item.member?.tkhCode || "",
            item.member?.username || "",
            item.group?.name || "",
            item.questionText || "",
            statusLabel,
            item.adminResponse || "",
            createdAt,
            respondedAt
        ];
    });

    const csvContent = [
        header,
        ...rows
    ]
        .map(row =>
            row
                .map(value =>
                    `"${String(value ?? "")
                        .replace(/"/g, '""')}"`
                )
                .join(",")
        )
        .join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csvContent],
        {
            type:
                "text/csv;charset=utf-8;"
        }
    );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        `${typeLabel}-${getCurrentDateForFileDemo()}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

function getCurrentDateForFileDemo() {
    const now = new Date();

    return [
        now.getFullYear(),
        String(
            now.getMonth() + 1
        ).padStart(2, "0"),
        String(
            now.getDate()
        ).padStart(2, "0")
    ].join("-");
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

    if (totalStudentsElement) {
        totalStudentsElement.innerText = "...";
    }

    if (topGroupElement) {
        topGroupElement.innerText = "...";
    }

    if (topGroupScoreElement) {
        topGroupScoreElement.innerText = "...";
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="5">
                Đang tải dữ liệu nhóm...
            </td>
        </tr>
    `;

    try {
        /*
         * Tải song song:
         * - Danh sách nhóm và số thành viên.
         * - Điểm và xếp hạng nhóm.
         */
        const [
            groupResponse,
            rankingGroups
        ] = await Promise.all([
            fetch(
                `${API_BASE_URL}/api/groups`,
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            ),
            getGroupRankingApiData()
        ]);

        const groupResult =
            await groupResponse.json();

        if (groupResponse.status === 401) {
            logoutDemo();
            return;
        }

        if (groupResponse.status === 403) {
            window.location.href =
                "dashboard.html";
            return;
        }

        if (
            !groupResponse.ok ||
            !groupResult.success
        ) {
            throw new Error(
                groupResult?.error?.message ||
                "Không thể tải dữ liệu nhóm."
            );
        }

        const groups =
            Array.isArray(
                groupResult.data?.groups
            )
                ? groupResult.data.groups
                : [];

        const rankings =
            Array.isArray(rankingGroups)
                ? rankingGroups
                : [];

        /*
         * Tạo Map để ghép nhanh theo group.id.
         */
        const rankingByGroupId =
            new Map();

        rankings.forEach(item => {
            const groupId =
                Number(item.group?.id);

            if (
                Number.isInteger(groupId) &&
                groupId > 0
            ) {
                rankingByGroupId.set(
                    groupId,
                    item
                );
            }
        });

        const totalStudents =
            groups.reduce(
                (total, group) =>
                    total +
                    Number(
                        group.memberCount || 0
                    ),
                0
            );

        totalGroupsElement.innerText =
            groups.length;

        if (totalStudentsElement) {
            totalStudentsElement.innerText =
                totalStudents;
        }

        /*
         * API xếp hạng đã trả theo thứ tự điểm.
         * Tìm chính xác nhóm hạng 1.
         */
        const topRanking =
            rankings.find(
                item =>
                    Number(item.ranking) === 1
            ) ||
            rankings[0] ||
            null;

        if (topGroupElement) {
            topGroupElement.innerText =
                topRanking?.group?.name ||
                "Chưa có dữ liệu";
        }

        if (topGroupScoreElement) {
            topGroupScoreElement.innerText =
                topRanking
                    ? `${Number(
                        topRanking.totalPoints
                    ) || 0} điểm`
                    : "0 điểm";
        }

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
            groups.map(group => {
                const rankingItem =
                    rankingByGroupId.get(
                        Number(group.id)
                    ) ||
                    null;

                const totalPoints =
                    Number(
                        rankingItem?.totalPoints
                    );

                const ranking =
                    Number(
                        rankingItem?.ranking
                    );

                const totalPointsText =
                    Number.isFinite(totalPoints)
                        ? totalPoints.toFixed(2)
                        : "0.00";

                const rankingText =
                    Number.isInteger(ranking) &&
                    ranking > 0
                        ? `#${ranking}`
                        : "-";

                return `
                    <tr>
                        <td>
                            ${escapeHtml(
                                group.code || "-"
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                group.name || "-"
                            )}
                        </td>

                        <td>
                            ${Number(
                                group.memberCount || 0
                            )}
                        </td>

                        <td>
                            ${totalPointsText}
                        </td>

                        <td>
                            ${rankingText}
                        </td>
                    </tr>
                `;
            }).join("");

    } catch (error) {
        console.error(
            "Load admin groups error:",
            error
        );

        totalGroupsElement.innerText = "0";

        if (totalStudentsElement) {
            totalStudentsElement.innerText =
                "0";
        }

        if (topGroupElement) {
            topGroupElement.innerText =
                "Không thể tải";
        }

        if (topGroupScoreElement) {
            topGroupScoreElement.innerText =
                "0 điểm";
        }

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

async function resetStudentPasswordDemo(
    memberId,
    fullName,
    buttonElement
) {
    const numericMemberId = Number(memberId);

    if (
        !Number.isInteger(numericMemberId) ||
        numericMemberId <= 0
    ) {
        alert("Mã thành viên không hợp lệ.");
        return;
    }

    const confirmReset = confirm(
        `Bạn có chắc muốn reset mật khẩu của:\n\n` +
        `${fullName}\n\n` +
        `về mật khẩu mặc định 123456 không?`
    );

    if (!confirmReset) {
        return;
    }

    const token =
        localStorage.getItem("accessToken");

    if (!token) {
        logoutDemo();
        return;
    }

    const originalText =
        buttonElement?.innerText || "Reset";

    try {
        if (buttonElement) {
            buttonElement.disabled = true;
            buttonElement.innerText =
                "Đang reset...";
        }

        const response = await fetch(
            `${API_BASE_URL}/api/auth/members/${numericMemberId}/reset-password`,
            {
                method: "PUT",
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        let result = null;

        try {
            result = await response.json();
        } catch (error) {
            result = null;
        }

        if (response.status === 401) {
            logoutDemo();
            return;
        }

        if (response.status === 403) {
            alert(
                "Bạn không có quyền reset mật khẩu."
            );
            return;
        }

        if (
            !response.ok ||
            result?.success !== true
        ) {
            throw new Error(
                result?.error?.message ||
                "Không thể reset mật khẩu."
            );
        }

        const temporaryPassword =
            result.data?.temporaryPassword ||
            "123456";

        alert(
            `Đã reset mật khẩu thành công.\n\n` +
            `Học viên: ${fullName}\n` +
            `Mật khẩu mặc định: ${temporaryPassword}\n\n` +
            `Học viên sẽ được yêu cầu đổi mật khẩu khi đăng nhập.`
        );
    } catch (error) {
        console.error(
            "Reset student password error:",
            error
        );

        alert(
            error.message ||
            "Không thể kết nối đến Backend."
        );
    } finally {
        if (buttonElement) {
            buttonElement.disabled = false;
            buttonElement.innerText =
                originalText;
        }
    }
}

async function loadAdminScoreSummaryDemo(
  forceRefresh = false
) {
  const totalPointsElement =
    document.getElementById(
      "adminScoreTotalPoints"
    );

  const totalRecordsElement =
    document.getElementById(
      "adminScoreTotalRecords"
    );

  const topGroupElement =
    document.getElementById(
      "adminScoreTopGroup"
    );

  const topGroupPointsElement =
    document.getElementById(
      "adminScoreTopGroupPoints"
    );

  if (
    !totalPointsElement ||
    !totalRecordsElement ||
    !topGroupElement ||
    !topGroupPointsElement
  ) {
    return;
  }

  totalPointsElement.innerText =
    "...";

  totalRecordsElement.innerText =
    "...";

  topGroupElement.innerText =
    "...";

  topGroupPointsElement.innerText =
    "Đang tải...";

  try {
    const [
      historyData,
      groups
    ] = await Promise.all([
      getAdminScoreHistoryApiData(
        forceRefresh
      ),

      getGroupRankingApiData()
    ]);

    const summary =
      historyData?.summary || {
        totalRecords: 0,
        totalAppliedPoints: 0
      };

    totalPointsElement.innerText =
      Number(
        summary.totalAppliedPoints
      ) || 0;

    totalRecordsElement.innerText =
      Number(
        summary.totalRecords
      ) || 0;

    const topGroup =
      Array.isArray(groups) &&
      groups.length > 0
        ? groups[0]
        : null;

    if (!topGroup) {
      topGroupElement.innerText =
        "Chưa có";

      topGroupPointsElement.innerText =
        "0 điểm";

      return;
    }

    topGroupElement.innerText =
      topGroup.group?.name ||
      "Không xác định";

    topGroupPointsElement.innerText =
      `${
        Number(
          topGroup.totalPoints
        ) || 0
      } điểm`;

  } catch (error) {
    console.error(
      "Load admin score summary error:",
      error
    );

    totalPointsElement.innerText =
      "—";

    totalRecordsElement.innerText =
      "—";

    topGroupElement.innerText =
      "Không thể tải";

    topGroupPointsElement.innerText =
      "—";
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
    bcEligibleMembersApi = [];
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
    const groupGrid =
        document.getElementById(
            "bcGroupGrid"
        );

    if (!groupGrid) {
        return;
    }

    groupGrid.innerHTML = `
        <p class="empty-note">
            Đang tải danh sách nhóm...
        </p>
    `;

    try {
        const data =
            await getBibleChallengeCurrentApi();

        const eligibleGroups =
            Array.isArray(
                data.eligibleGroups
            )
                ? data.eligibleGroups
                : [];

        const usedSelections =
            Array.isArray(
                data.usedGroups
            )
                ? data.usedGroups
                : [];

        const groupMap =
            new Map();

        /*
         * Các nhóm chưa quay trong vòng hiện tại.
         */
        eligibleGroups.forEach(item => {
            const group =
                item.group || item;

            if (!group?.id) {
                return;
            }

            groupMap.set(
                Number(group.id),
                {
                    id:
                        Number(group.id),

                    code:
                        group.code || "",

                    name:
                        group.name ||
                        "Không xác định",

                    logoPath:
                        group.logoPath ||
                        null,

                    used:
                        false,

                    roundNo:
                        null
                }
            );
        });

        /*
         * Các nhóm đã quay.
         *
         * Vẫn giữ trạng thái used trong dữ liệu,
         * nhưng không làm mờ hoặc tiết lộ trên giao diện.
         */
        usedSelections.forEach(
            selection => {
                const group =
                    selection.group ||
                    selection;

                if (!group?.id) {
                    return;
                }

                groupMap.set(
                    Number(group.id),
                    {
                        id:
                            Number(group.id),

                        code:
                            group.code || "",

                        name:
                            group.name ||
                            "Không xác định",

                        logoPath:
                            group.logoPath ||
                            null,

                        used:
                            true,

                        roundNo:
                            selection.roundNo ||
                            null
                    }
                );
            }
        );

        const groups =
            Array.from(
                groupMap.values()
            ).sort(
                (a, b) =>
                    a.id - b.id
            );

        if (groups.length === 0) {
            groupGrid.innerHTML = `
                <p class="empty-note">
                    Hiện không có nhóm nào trong Bible Challenge.
                </p>
            `;

            return;
        }

        /*
         * Quan trọng:
         * - Không gắn class "used" lên thẻ nhóm.
         * - Không hiện "Đã random".
         * - Trạng thái thật chỉ nằm trong data-used.
         */
        groupGrid.innerHTML =
            groups.map(group => `
                <div
                    class="bc-card"
                    data-group-id="${group.id}"
                    data-group-name="${escapeBibleChallengeHtml(
                        group.name
                    )}"
                    data-used="${
                        group.used
                            ? "true"
                            : "false"
                    }"
                    data-round-no="${
                        group.roundNo || ""
                    }"
                >
                    <div class="bc-avatar">
                        ${
                            group.logoPath
                                ? `
                                    <img
                                        src="${escapeBibleChallengeHtml(
                                            group.logoPath
                                        )}"
                                        alt="Logo nhóm ${escapeBibleChallengeHtml(
                                            group.name
                                        )}"
                                        class="bc-group-logo-image"
                                        onerror="
                                            this.onerror = null;
                                            this.parentElement.innerHTML =
                                                '${escapeBibleChallengeHtml(
                                                    group.name.charAt(0)
                                                )}';
                                        "
                                    >
                                `
                                : escapeBibleChallengeHtml(
                                    group.name.charAt(0)
                                )
                        }
                    </div>

                    <div>
                        ${escapeBibleChallengeHtml(
                            group.name
                        )}
                    </div>

                    <small>
                        Sẵn sàng
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
                ${escapeBibleChallengeHtml(
                    error.message
                )}
            </p>
        `;
    }
}

/*
 * =========================================================
 * BIBLE CHALLENGE — ADMIN ROUND STATUS
 * =========================================================
 */

function getBibleChallengeRoundStatusData(
    currentData
) {
    const eligibleGroups =
        Array.isArray(
            currentData?.eligibleGroups
        )
            ? currentData.eligibleGroups
            : [];

    const usedSelections =
        Array.isArray(
            currentData?.usedGroups
        )
            ? currentData.usedGroups
            : [];

    const availableGroups =
        eligibleGroups
            .map(item =>
                item.group || item
            )
            .filter(group =>
                group?.id
            );

    const usedGroups =
        usedSelections
            .map(selection => {
                const group =
                    selection.group ||
                    selection;

                if (!group?.id) {
                    return null;
                }

                return {
                    ...group,

                    roundNo:
                        selection.roundNo ||
                        group.roundNo ||
                        null
                };
            })
            .filter(Boolean);

    const allGroupsMap =
        new Map();

    availableGroups.forEach(group => {
        allGroupsMap.set(
            Number(group.id),
            group
        );
    });

    usedGroups.forEach(group => {
        allGroupsMap.set(
            Number(group.id),
            group
        );
    });

    const totalGroups =
        allGroupsMap.size;

    return {
        availableGroups,
        usedGroups,
        totalGroups
    };
}


function renderBibleChallengeRoundGroupList(
    groups,
    type
) {
    const normalizedGroups =
        Array.isArray(groups)
            ? groups
            : [];

    if (normalizedGroups.length === 0) {
        return `
            <p class="bc-round-status-empty">
                Không có nhóm.
            </p>
        `;
    }

    return `
        <div class="bc-round-status-list">
            ${
                normalizedGroups
                    .map(group => {
                        const isUsed =
                            type === "used";

                        return `
                            <div
                                class="
                                    bc-round-status-item
                                    ${
                                        isUsed
                                            ? "bc-round-status-item-used"
                                            : "bc-round-status-item-available"
                                    }
                                "
                            >
                                <span
                                    class="bc-round-status-icon"
                                >
                                    ${
                                        isUsed
                                            ? "✓"
                                            : "•"
                                    }
                                </span>

                                <span
                                    class="bc-round-status-name"
                                >
                                    ${escapeBibleChallengeHtml(
                                        group.name ||
                                        "Không xác định"
                                    )}
                                </span>

                                ${
                                    isUsed &&
                                    group.roundNo
                                        ? `
                                            <small>
                                                Vòng ${Number(
                                                    group.roundNo
                                                )}
                                            </small>
                                        `
                                        : ""
                                }
                            </div>
                        `;
                    })
                    .join("")
            }
        </div>
    `;
}


async function openBibleChallengeRoundStatus() {
    const modal =
        document.getElementById(
            "bcRoundStatusModal"
        );

    const summaryElement =
        document.getElementById(
            "bcRoundStatusSummary"
        );

    const contentElement =
        document.getElementById(
            "bcRoundStatusContent"
        );

    if (
        !modal ||
        !summaryElement ||
        !contentElement
    ) {
        return;
    }

    modal.classList.remove(
        "hidden"
    );

    summaryElement.innerText =
        "Đang tải trạng thái vòng...";

    contentElement.innerHTML = `
        <p class="empty-note">
            Đang tải dữ liệu...
        </p>
    `;

    try {
        /*
         * Dùng forceRefresh để admin luôn thấy
         * trạng thái mới nhất từ Backend.
         */
        const currentData =
            await getBibleChallengeCurrentApi(
                true
            );

        const status =
            getBibleChallengeRoundStatusData(
                currentData
            );

        const usedCount =
            status.usedGroups.length;

        const totalGroups =
            status.totalGroups;

        summaryElement.innerText =
            `Đã random ${usedCount} / ${totalGroups} nhóm trong vòng hiện tại.`;

        contentElement.innerHTML = `
            <section
                class="bc-round-status-section"
            >
                <h4>
                    Đã random
                    <span>
                        ${usedCount}
                    </span>
                </h4>

                ${
                    renderBibleChallengeRoundGroupList(
                        status.usedGroups,
                        "used"
                    )
                }
            </section>

            <section
                class="bc-round-status-section"
            >
                <h4>
                    Chưa random
                    <span>
                        ${status.availableGroups.length}
                    </span>
                </h4>

                ${
                    renderBibleChallengeRoundGroupList(
                        status.availableGroups,
                        "available"
                    )
                }
            </section>
        `;
    } catch (error) {
        console.error(
            "Load Bible Challenge round status error:",
            error
        );

        summaryElement.innerText =
            "Không thể tải trạng thái vòng.";

        contentElement.innerHTML = `
            <p class="bc-round-status-error">
                ${escapeBibleChallengeHtml(
                    error.message ||
                    "Vui lòng thử lại."
                )}
            </p>
        `;
    }
}


function closeBibleChallengeRoundStatus() {
    const modal =
        document.getElementById(
            "bcRoundStatusModal"
        );

    if (modal) {
        modal.classList.add(
            "hidden"
        );
    }
}


function handleBibleChallengeRoundStatusBackdrop(
    event
) {
    if (
        event.target?.id ===
        "bcRoundStatusModal"
    ) {
        closeBibleChallengeRoundStatus();
    }
}

/*
 * =========================================================
 * BIBLE CHALLENGE — START NEW ROUND
 * =========================================================
 */

let bcNewRoundGroupsApi = [];
let bcStartNewRoundInProgress = false;
let bcPendingExcludedGroupIds = [];


function getBibleChallengeAllGroupsFromCurrentData(
    currentData
) {
    const eligibleGroups =
        Array.isArray(
            currentData?.eligibleGroups
        )
            ? currentData.eligibleGroups
            : [];

    const usedGroups =
        Array.isArray(
            currentData?.usedGroups
        )
            ? currentData.usedGroups
            : [];

    const groupMap =
        new Map();

    eligibleGroups.forEach(item => {
        const group =
            item.group || item;

        if (!group?.id) {
            return;
        }

        groupMap.set(
            Number(group.id),
            {
                id:
                    Number(group.id),

                code:
                    group.code || "",

                name:
                    group.name ||
                    "Không xác định",

                logoPath:
                    group.logoPath ||
                    null,

                used:
                    false
            }
        );
    });

    usedGroups.forEach(item => {
        const group =
            item.group || item;

        if (!group?.id) {
            return;
        }

        groupMap.set(
            Number(group.id),
            {
                id:
                    Number(group.id),

                code:
                    group.code || "",

                name:
                    group.name ||
                    "Không xác định",

                logoPath:
                    group.logoPath ||
                    null,

                used:
                    true
            }
        );
    });

    return Array.from(
        groupMap.values()
    ).sort(
        (a, b) =>
            a.id - b.id
    );
}

function updateBibleChallengeNewRoundSelectedSummary() {
    const summary =
        document.getElementById(
            "bcNewRoundSelectedSummary"
        );

    const countElement =
        document.getElementById(
            "bcNewRoundSelectedCount"
        );

    const namesElement =
        document.getElementById(
            "bcNewRoundSelectedNames"
        );

    if (
        !summary ||
        !countElement ||
        !namesElement
    ) {
        return;
    }

    const checkedIds =
        Array.from(
            document.querySelectorAll(
                '#bcNewRoundGroupList input[name="bcExcludedGroup"]:checked'
            )
        )
            .map(input =>
                Number(input.value)
            )
            .filter(
                groupId =>
                    Number.isInteger(groupId) &&
                    groupId > 0
            );

    const selectedGroups =
        bcNewRoundGroupsApi
            .filter(group =>
                checkedIds.includes(
                    Number(group.id)
                )
            );

    if (selectedGroups.length === 0) {
        summary.classList.add(
            "hidden"
        );

        countElement.innerText =
            "0 nhóm";

        namesElement.innerHTML = "";

        return;
    }

    summary.classList.remove(
        "hidden"
    );

    countElement.innerText =
        `${selectedGroups.length} nhóm`;

    namesElement.innerHTML =
        selectedGroups
            .map(group => `
                <span>
                    ✓ ${escapeBibleChallengeHtml(
                        group.name
                    )}
                </span>
            `)
            .join("");
}

function updateBibleChallengeNewRoundButtonState() {
    updateBibleChallengeNewRoundSelectedSummary();

    const confirmButton =
        document.getElementById(
            "bcConfirmNewRoundButton"
        );

    if (!confirmButton) {
        return;
    }

    const checkedGroups =
        document.querySelectorAll(
            '#bcNewRoundGroupList input[name="bcExcludedGroup"]:checked'
        );

    const totalGroups =
        bcNewRoundGroupsApi.length;

    const excludedCount =
        checkedGroups.length;

    /*
     * Có thể bắt đầu vòng mới khi:
     * - Có ít nhất một nhóm còn tham gia.
     * - Không đang gửi dữ liệu.
     *
     * Admin không bắt buộc phải loại nhóm nào.
     */
    confirmButton.disabled =
        bcStartNewRoundInProgress ||
        totalGroups === 0 ||
        excludedCount >= totalGroups;
}


function renderBibleChallengeNewRoundGroups(
    groups
) {
    const groupList =
        document.getElementById(
            "bcNewRoundGroupList"
        );

    if (!groupList) {
        return;
    }

    const normalizedGroups =
        Array.isArray(groups)
            ? groups
            : [];

    if (normalizedGroups.length === 0) {
        groupList.innerHTML = `
            <p class="empty-note">
                Không tìm thấy nhóm nào.
            </p>
        `;

        updateBibleChallengeNewRoundButtonState();
        return;
    }

    groupList.innerHTML =
        normalizedGroups
            .map(group => `
                <label
                    class="bc-new-round-group-option"
                >
                    <input
                        type="checkbox"
                        name="bcExcludedGroup"
                        value="${Number(group.id)}"
                        onchange="updateBibleChallengeNewRoundButtonState()"
                    >

                    <span
                        class="bc-new-round-group-logo"
                    >
                        ${
                            group.logoPath
                                ? `
                                    <img
                                        src="${escapeBibleChallengeHtml(
                                            group.logoPath
                                        )}"
                                        alt=""
                                        onerror="
                                            this.onerror = null;
                                            this.parentElement.innerHTML =
                                                '${escapeBibleChallengeHtml(
                                                    group.name.charAt(0)
                                                )}';
                                        "
                                    >
                                `
                                : escapeBibleChallengeHtml(
                                    group.name.charAt(0)
                                )
                        }
                    </span>

                    <span
                        class="bc-new-round-group-information"
                    >
                        <strong>
                            ${escapeBibleChallengeHtml(
                                group.name
                            )}
                        </strong>

                        <small>
                            Chọn để nhóm này không quay trúng
                        </small>
                    </span>
                </label>
            `)
            .join("");

    updateBibleChallengeNewRoundButtonState();
}


async function openBibleChallengeNewRoundModal() {
    const modal =
        document.getElementById(
            "bcNewRoundModal"
        );

    const statusElement =
        document.getElementById(
            "bcNewRoundCurrentStatus"
        );

    const groupList =
        document.getElementById(
            "bcNewRoundGroupList"
        );

    const message =
        document.getElementById(
            "bcNewRoundMessage"
        );

    const confirmButton =
        document.getElementById(
            "bcConfirmNewRoundButton"
        );

    if (
        !modal ||
        !statusElement ||
        !groupList ||
        !message ||
        !confirmButton
    ) {
        return;
    }

    modal.classList.remove(
        "hidden"
    );

    message.innerText = "";
    message.className =
        "bc-new-round-message";

    confirmButton.disabled = true;

    statusElement.innerText =
        "Đang kiểm tra trạng thái vòng hiện tại...";

    groupList.innerHTML = `
        <p class="empty-note">
            Đang tải danh sách nhóm...
        </p>
    `;

    bcNewRoundGroupsApi = [];

    bcPendingExcludedGroupIds = [];

    const selectedSummary =
        document.getElementById(
            "bcNewRoundSelectedSummary"
        );

    if (selectedSummary) {
        selectedSummary.classList.add(
            "hidden"
        );
    }

    try {
        const currentData =
            await getBibleChallengeCurrentApi(
                true
            );

        const status =
            getBibleChallengeRoundStatusData(
                currentData
            );

        const usedCount =
            status.usedGroups.length;

        const totalGroups =
            status.totalGroups;

        const remainingCount =
            status.availableGroups.length;

        bcNewRoundGroupsApi =
            getBibleChallengeAllGroupsFromCurrentData(
                currentData
            );

        if (remainingCount > 0) {
            const remainingNames =
                status.availableGroups
                    .map(group =>
                        group.name
                    )
                    .filter(Boolean)
                    .join(", ");

            statusElement.className =
                "bc-new-round-current-status bc-new-round-status-blocked";

            statusElement.innerHTML = `
                <strong>
                    Vòng hiện tại chưa hoàn tất:
                    ${usedCount}/${totalGroups} nhóm.
                </strong>

                <span>
                    Còn lại:
                    ${escapeBibleChallengeHtml(
                        remainingNames ||
                        `${remainingCount} nhóm`
                    )}
                </span>
            `;

            groupList.innerHTML = `
                <p class="empty-note">
                    Hãy hoàn tất vòng hiện tại trước khi bắt đầu vòng mới.
                </p>
            `;

            confirmButton.disabled = true;
            return;
        }

        statusElement.className =
            "bc-new-round-current-status bc-new-round-status-ready";

        statusElement.innerHTML = `
            <strong>
                Vòng hiện tại đã hoàn tất:
                ${usedCount}/${totalGroups} nhóm.
            </strong>

            <span>
                Bạn có thể bắt đầu vòng mới.
            </span>
        `;

        renderBibleChallengeNewRoundGroups(
            bcNewRoundGroupsApi
        );
    } catch (error) {
        console.error(
            "Open Bible Challenge new round modal error:",
            error
        );

        statusElement.className =
            "bc-new-round-current-status bc-new-round-status-blocked";

        statusElement.innerText =
            "Không thể kiểm tra trạng thái vòng.";

        groupList.innerHTML = `
            <p class="bc-round-status-error">
                ${escapeBibleChallengeHtml(
                    error.message ||
                    "Vui lòng thử lại."
                )}
            </p>
        `;
    }
}


function closeBibleChallengeNewRoundModal() {
    if (bcStartNewRoundInProgress) {
        return;
    }

    const modal =
        document.getElementById(
            "bcNewRoundModal"
        );

    if (modal) {
        modal.classList.add(
            "hidden"
        );
    }
}


function handleBibleChallengeNewRoundBackdrop(
    event
) {
    if (
        event.target?.id ===
        "bcNewRoundModal"
    ) {
        closeBibleChallengeNewRoundModal();
    }
}


function confirmBibleChallengeNewRound() {
    if (bcStartNewRoundInProgress) {
        return;
    }

    const message =
        document.getElementById(
            "bcNewRoundMessage"
        );

    const checkedInputs =
        Array.from(
            document.querySelectorAll(
                '#bcNewRoundGroupList input[name="bcExcludedGroup"]:checked'
            )
        );

    const excludedGroupIds =
        checkedInputs
            .map(input =>
                Number(input.value)
            )
            .filter(
                groupId =>
                    Number.isInteger(groupId) &&
                    groupId > 0
            );

    if (
        excludedGroupIds.length >=
        bcNewRoundGroupsApi.length
    ) {
        message.className =
            "bc-new-round-message error";

        message.innerText =
            "Không thể loại toàn bộ nhóm khỏi vòng mới.";

        return;
    }

    bcPendingExcludedGroupIds =
        excludedGroupIds;

    openBibleChallengeNewRoundConfirmModal();
}

function openBibleChallengeNewRoundConfirmModal() {
    const modal =
        document.getElementById(
            "bcNewRoundConfirmModal"
        );

    const excludedBox =
        document.getElementById(
            "bcNewRoundConfirmExcludedBox"
        );

    const excludedNamesElement =
        document.getElementById(
            "bcNewRoundConfirmExcludedNames"
        );

    const allGroupsElement =
        document.getElementById(
            "bcNewRoundConfirmAllGroups"
        );

    if (
        !modal ||
        !excludedBox ||
        !excludedNamesElement ||
        !allGroupsElement
    ) {
        return;
    }

    const excludedGroups =
        bcNewRoundGroupsApi
            .filter(group =>
                bcPendingExcludedGroupIds
                    .includes(
                        Number(group.id)
                    )
            );

    if (excludedGroups.length > 0) {
        excludedBox.classList.remove(
            "hidden"
        );

        allGroupsElement.classList.add(
            "hidden"
        );

        excludedNamesElement.innerHTML =
            excludedGroups
                .map(group => `
                    <span>
                        ${escapeBibleChallengeHtml(
                            group.name
                        )}
                    </span>
                `)
                .join("");
    } else {
        excludedBox.classList.add(
            "hidden"
        );

        allGroupsElement.classList.remove(
            "hidden"
        );

        excludedNamesElement.innerHTML = "";
    }

    modal.classList.remove(
        "hidden"
    );
}


function closeBibleChallengeNewRoundConfirmModal() {
    if (bcStartNewRoundInProgress) {
        return;
    }

    const modal =
        document.getElementById(
            "bcNewRoundConfirmModal"
        );

    if (modal) {
        modal.classList.add(
            "hidden"
        );
    }
}


function handleBibleChallengeNewRoundConfirmBackdrop(
    event
) {
    if (
        event.target?.id ===
        "bcNewRoundConfirmModal"
    ) {
        closeBibleChallengeNewRoundConfirmModal();
    }
}


async function executeBibleChallengeNewRound() {
    if (bcStartNewRoundInProgress) {
        return;
    }

    const executeButton =
        document.getElementById(
            "bcExecuteNewRoundButton"
        );

    const message =
        document.getElementById(
            "bcNewRoundMessage"
        );

    bcStartNewRoundInProgress = true;

    if (executeButton) {
        executeButton.disabled = true;

        executeButton.innerText =
            "Đang bắt đầu...";
    }

    message.className =
        "bc-new-round-message info";

    message.innerText =
        "Đang bắt đầu vòng Bible Challenge mới...";

    try {
        const data =
            await bibleChallengeApiRequest(
                "/start-new-round",
                {
                    method: "POST",

                    body: JSON.stringify({
                        excludedGroupIds:
                            bcPendingExcludedGroupIds
                    })
                }
            );

        const roundNo =
            Number(data.roundNo) || "";

        message.className =
            "bc-new-round-message success";

        message.innerText =
            `Đã bắt đầu vòng ${
                roundNo || "mới"
            } thành công.`;

        bcSelectedGroupApi = null;
        bcSelectedMemberApi = null;
        bcEligibleMembersApi = [];

        await refreshBibleChallengeApiUi();

        bcPendingExcludedGroupIds = [];

        closeBibleChallengeNewRoundConfirmModal();

        setTimeout(() => {
            bcStartNewRoundInProgress =
                false;

            if (executeButton) {
                executeButton.disabled =
                    false;

                executeButton.innerText =
                    "Xác nhận bắt đầu";
            }

            closeBibleChallengeNewRoundModal();
        }, 500);
    } catch (error) {
        console.error(
            "Start Bible Challenge new round error:",
            error
        );

        bcStartNewRoundInProgress = false;

        if (executeButton) {
            executeButton.disabled =
                false;

            executeButton.innerText =
                "Xác nhận bắt đầu";
        }

        message.className =
            "bc-new-round-message error";

        message.innerText =
            error.message ||
            "Không thể bắt đầu vòng mới.";

        closeBibleChallengeNewRoundConfirmModal();

        updateBibleChallengeNewRoundButtonState();

        resetBibleChallengeApiCache();
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

function bcRenderEligibleMembersDemo(
    members,
    selectedSeasonMembershipId = null
) {
    const normalizedMembers =
        Array.isArray(members)
            ? members.filter(member =>
                member?.seasonMembershipId
            )
            : [];

    if (normalizedMembers.length === 0) {
        return `
            <p class="empty-note">
                Không có học viên đủ điều kiện trong nhóm này.
            </p>
        `;
    }

    return normalizedMembers
        .map(member => {
            const isSelected =
                Number(member.seasonMembershipId) ===
                Number(selectedSeasonMembershipId);

            const avatarUrl =
                getMemberAvatarUrlDemo({
                    ...member,
                    tkhCode:
                        member.tkhCode ||
                        member.username
                });

            return `
                <div
                    class="bc-card ${
                        isSelected
                            ? "selected"
                            : ""
                    }"
                    data-membership-id="${Number(
                        member.seasonMembershipId
                    )}"
                >
                    <img
                        class="bc-avatar bc-member-avatar-image"
                        src="${avatarUrl}"
                        alt="Avatar của ${escapeBibleChallengeHtml(
                            member.fullName || "Học viên"
                        )}"
                        onerror="
                            this.onerror = null;
                            this.src =
                                'assets/images/members/default-avatar.jpg';
                        "
                    >

                    <div>
                        ${escapeBibleChallengeHtml(
                            member.fullName ||
                            "Không xác định"
                        )}
                    </div>

                    <small>
                        ${escapeBibleChallengeHtml(
                            member.tkhCode || ""
                        )}
                    </small>
                </div>
            `;
        })
        .join("");
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
            memberGrid.innerHTML =
                bcRenderEligibleMembersDemo(
                    bcEligibleMembersApi
                );
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

        let availableMembers =
            Array.isArray(bcEligibleMembersApi)
                ? [...bcEligibleMembersApi]
                : [];

        const selectedExists =
            availableMembers.some(member =>
                Number(
                    member.seasonMembershipId
                ) === Number(
                    selectedMember.seasonMembershipId
                )
            );

        if (!selectedExists) {
            availableMembers.push(
                selectedMember
            );
        }

        if (availableMembers.length === 0) {
            availableMembers = [
                selectedMember
            ];
        }

        bcAvailableMembersDemo =
            availableMembers;

        const winnerIndex =
            bcAvailableMembersDemo.findIndex(
                member =>
                    Number(
                        member.seasonMembershipId
                    ) === Number(
                        selectedMember.seasonMembershipId
                    )
            );

        memberGrid.innerHTML =
            bcRenderEligibleMembersDemo(
                bcAvailableMembersDemo
            );

        const cards = Array.from(
            memberGrid.querySelectorAll(".bc-card")
        );

        if (cards.length === 1) {
            cards[0].classList.add(
                "selected"
            );

            bcMemberRollingDemo = false;
            bcWriteInProgress = false;

            bcShowWinnerDemo(
                winnerIndex
            );

            return;
        }

        bcSpinToWinnerDemo(
            cards,
            winnerIndex,
            () => {
                bcMemberRollingDemo = false;
                bcWriteInProgress = false;

                bcShowWinnerDemo(
                    winnerIndex
                );
            },
            60,
            45
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

    bcPlayWinnerSound();

    bcSelectedMemberApi = winner;

    const backdrop =
        document.getElementById("bcWinnerBackdrop");

    const overlay =
        document.getElementById("bcWinnerOverlay");

    const avatar =
        document.getElementById("bcWinnerAvatar");

    const name =
        document.getElementById("bcWinnerName");

    const winnerAvatarUrl =
        getMemberAvatarUrlDemo({
            ...winner,
            tkhCode:
                winner.tkhCode ||
                winner.username
        });

    avatar.innerHTML = `
        <img
            class="bc-winner-avatar-image"
            src="${winnerAvatarUrl}"
            alt="Avatar của ${escapeBibleChallengeHtml(
                winner.fullName || "Học viên"
            )}"
            onerror="
                this.onerror = null;
                this.src =
                    'assets/images/members/default-avatar.jpg';
            "
        >
    `;

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

        const selectedGroupName =
            data.group?.name ||
            bcSelectedGroupApi?.name ||
            "nhóm được chọn";

        const rewardSummary =
            data.rewardSummary || {};

        const rewardedGroupCount =
            Number(
                rewardSummary.rewardedGroupCount
            ) || 0;

        const rewardedMemberCount =
            Number(
                rewardSummary.rewardedMemberCount
            ) || 0;

        const cappedMemberCount =
            Number(
                rewardSummary.cappedMemberCount
            ) || 0;

        let message = "";

        if (result === "FULL") {
            message =
                `Đã ghi nhận ${memberName} trả lời đúng.\n\n` +
                `Nhóm ${selectedGroupName} được cộng điểm cho ` +
                `${rewardedMemberCount} thành viên.`;
        } else if (result === "FAILED") {
            message =
                `Đã ghi nhận ${memberName} trả lời sai.\n\n` +
                `Nhóm ${selectedGroupName} nhận 0 điểm.\n` +
                `${rewardedGroupCount} nhóm còn lại được cộng điểm cho ` +
                `${rewardedMemberCount} thành viên.`;
        } else {
            message =
                `Đã ghi nhận bỏ qua lượt của ${memberName}.\n\n` +
                `Không nhóm nào được cộng điểm.`;
        }

        if (cappedMemberCount > 0) {
            message +=
                `\n\nCó ${cappedMemberCount} thành viên đã chạm ` +
                `giới hạn ${Number(data.maximumPoints) || 60} điểm Bible Challenge.`;
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

    /*
 * Tất cả thẻ nhóm đều sáng và giống nhau trên màn hình.
 *
 * Tuy nhiên, frontend vẫn đọc data-used để biết vòng
 * hiện tại còn nhóm nào chưa quay.
 */
const allGroupCards = Array.from(
    document.querySelectorAll(
        "#bcGroupGrid .bc-card"
    )
);

const availableGroupCards =
    allGroupCards.filter(card =>
        card.dataset.used !== "true"
    );

if (availableGroupCards.length === 0) {
    alert(
        "Tất cả nhóm đã được random trong vòng hiện tại. " +
        "Hãy bấm “Bắt đầu vòng mới” để tiếp tục."
    );

    return;
}

/*
 * Hiệu ứng chạy qua toàn bộ 8 nhóm để học viên
 * không thể suy đoán nhóm nào đã được loại khỏi vòng.
 *
 * Nhóm thắng thật vẫn do Backend quyết định.
 */
const groupCards =
    allGroupCards;

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

        const selectedGroupMembers =
            Array.isArray(data.eligibleMembers)
                ? data.eligibleMembers
                : [];

        if (!selectedGroup?.id) {
            throw new Error(
                "Backend không trả về nhóm được chọn."
            );
        }

        bcSelectedGroupApi = selectedGroup;
        bcSelectedMemberApi = null;

        bcEligibleMembersApi =
            selectedGroupMembers;

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

                        /*
                        * refreshBibleChallengeApiUi có thể làm mới cache,
                        * nên khôi phục lại nhóm và danh sách thành viên
                        * vừa nhận từ API draw-group.
                        */
                        bcSelectedGroupApi =
                            selectedGroup;

                        bcSelectedMemberApi =
                            null;

                        bcEligibleMembersApi =
                            selectedGroupMembers;

                        await bcOpenGroupDemo(
                            selectedGroup.name
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

function bcSpinToWinnerDemo(
    cards,
    winnerIndex,
    finishCallback,
    minSteps = 60,
    startSpeed = 45
) {
    if (
        !Array.isArray(cards) ||
        cards.length === 0 ||
        winnerIndex < 0 ||
        winnerIndex >= cards.length
    ) {
        finishCallback();
        return;
    }

    let currentIndex =
        Math.floor(
            Math.random() * cards.length
        );
    let step = 0;

    const distance =
        (
            winnerIndex -
            currentIndex +
            cards.length
        ) % cards.length;

    /*
     * Đảm bảo quay ít nhất minSteps,
     * đồng thời kết thúc đúng winnerIndex.
     */
    const extraSteps =
        (
            distance -
            (minSteps % cards.length) +
            cards.length
        ) % cards.length;

    const targetSteps =
        minSteps + extraSteps;

    function spin() {

        cards.forEach(card =>
            card.classList.remove("selected")
        );

        cards[currentIndex].classList.add(
            "selected"
        );

        bcPlayTickSound();

        if (step >= targetSteps) {
            cards.forEach(card =>
                card.classList.remove("selected")
            );

            cards[winnerIndex].classList.add(
                "selected"
            );

            finishCallback();
            return;
        }

        step += 1;

        currentIndex =
            (currentIndex + 1) %
            cards.length;

        const progress =
            step / targetSteps;

        let delay;

        if (progress < 0.60) {
            /*
             * 60% đầu quay nhanh.
             */
            delay = startSpeed;
        } else {
            /*
             * 40% cuối giảm tốc mượt.
             *
             * slowProgress chạy từ 0 đến 1.
             * Bình phương giúp càng gần cuối
             * càng chậm rõ rệt.
             */
            const slowProgress =
                (progress - 0.60) / 0.40;

            delay =
                startSpeed +
                Math.pow(
                    slowProgress,
                    2
                ) * 420;
        }

        setTimeout(
            spin,
            Math.round(delay)
        );
    }

    spin();
}

const bcTickSound =
    new Audio("assets/sounds/tick.mp3");

const bcWinnerSound =
    new Audio("assets/sounds/winner.mp3");

bcTickSound.preload = "auto";
bcWinnerSound.preload = "auto";

function bcPlayTickSound() {
    try {
        /*
         * Clone âm thanh để các tiếng tick ngắn
         * có thể phát liên tiếp khi vòng quay nhanh.
         */
        const sound =
            bcTickSound.cloneNode();

        sound.volume = 0.8;

        const playPromise =
            sound.play();

        if (
            playPromise &&
            typeof playPromise.catch ===
                "function"
        ) {
            playPromise.catch(() => {});
        }
    } catch (error) {
        console.warn(
            "Bible Challenge tick sound error:",
            error
        );
    }
}

function bcPlayWinnerSound() {
    try {
        bcWinnerSound.pause();
        bcWinnerSound.currentTime = 0;
        bcWinnerSound.volume = 1;

        const playPromise =
            bcWinnerSound.play();

        if (
            playPromise &&
            typeof playPromise.catch ===
                "function"
        ) {
            playPromise.catch(() => {});
        }
    } catch (error) {
        console.warn(
            "Bible Challenge winner sound error:",
            error
        );
    }
}

let bcEligibleMembersApi = [];

let bcGroupRollingDemo = false;
let bcMemberRollingDemo = false;





function bcShowGroupWinnerDemo(groupName) {
    const backdrop =
        document.getElementById(
            "bcWinnerBackdrop"
        );

    const overlay =
        document.getElementById(
            "bcWinnerOverlay"
        );

    const avatar =
        document.getElementById(
            "bcWinnerAvatar"
        );

    const name =
        document.getElementById(
            "bcWinnerName"
        );

    const selectedGroup =
        bcSelectedGroupApi;

    const logoPath =
        selectedGroup?.logoPath || "";

    if (logoPath) {
        avatar.innerHTML = `
            <img
                class="bc-winner-avatar-image bc-winner-group-logo"
                src="${escapeBibleChallengeHtml(logoPath)}"
                alt="Logo nhóm ${escapeBibleChallengeHtml(groupName)}"
            >
        `;
    } else {
        /*
         * Chỉ dùng cúp dự phòng nếu nhóm
         * chưa có logoPath.
         */
        avatar.innerText = "🏆";
    }

    name.innerText =
        "Nhóm " + groupName;

    bcPlayWinnerSound();

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
                                class="admin-exam-presentation-btn"
                                onclick="window.open(
                                    'admin-test-screen.html?examId=${examId}',
                                    '_blank'
                                )"
                            >
                                📺 Trình chiếu
                            </button>

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
                !Number.isInteger(payloadExamId) ||
                payloadExamId <= 0
            ) {
                return;
            }

            const examStatus =
                String(
                    payload?.realtimeState
                        ?.examStatus || ""
                ).toUpperCase();

            clearTimeout(
                studentExamSyncTimer
            );

            if (examStatus === "COMPLETED") {
                studentExamSyncTimer =
                    setTimeout(
                        () => {
                            loadStudentExamCompletedResult(
                                payloadExamId,
                                0
                            );
                        },
                        150
                    );

                return;
            }

            if (
                !activeStudentExamId ||
                payloadExamId !==
                    activeStudentExamId
            ) {
                return;
            }

            studentExamSyncTimer =
                setTimeout(
                    () => {
                        enterStudentExamRealtime(
                            payloadExamId
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

    studentExamSocket.on(
        "exam:question-started",
        synchronizeActiveExam
    );

    studentExamSocket.on(
        "exam:finished",
        payload => {
            const payloadExamId =
                Number(payload?.examId);

            if (
                !Number.isInteger(payloadExamId) ||
                payloadExamId <= 0
            ) {
                return;
            }

            clearTimeout(
                studentExamSyncTimer
            );

            studentExamSyncTimer =
                setTimeout(
                    () => {
                        loadStudentExamCompletedResult(
                            payloadExamId,
                            0
                        );
                    },
                    150
                );
        }
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
let studentExamCountdownTimer = null;
let studentExamServerOffsetMilliseconds = 0;

function stopStudentExamCountdown() {
    if (studentExamCountdownTimer) {
        clearInterval(studentExamCountdownTimer);
        studentExamCountdownTimer = null;
    }
}

function startStudentExamCountdown({
    questionEndsAt,
    serverTime
}) {
    stopStudentExamCountdown();

    const endsAtMilliseconds =
        Date.parse(questionEndsAt);

    const serverTimeMilliseconds =
        Date.parse(serverTime);

    if (Number.isFinite(serverTimeMilliseconds)) {
        studentExamServerOffsetMilliseconds =
            serverTimeMilliseconds - Date.now();
    } else {
        studentExamServerOffsetMilliseconds = 0;
    }

    const countdownElement =
        document.getElementById(
            "studentExamCountdownValue"
        );

    if (
        !countdownElement ||
        !Number.isFinite(endsAtMilliseconds)
    ) {
        return;
    }

    const updateCountdown = () => {
        const estimatedServerNow =
            Date.now() +
            studentExamServerOffsetMilliseconds;

        const remainingMilliseconds =
            endsAtMilliseconds - estimatedServerNow;

        const remainingSeconds = Math.max(
            0,
            Math.ceil(
                remainingMilliseconds / 1000
            )
        );

        countdownElement.innerText =
            String(remainingSeconds);

        const countdownBox =
            countdownElement.closest(
                ".student-exam-countdown"
            );

        if (countdownBox) {
            countdownBox.classList.toggle(
                "student-exam-countdown-warning",
                remainingSeconds <= 5
            );
        }

        if (remainingMilliseconds <= 0) {
            stopStudentExamCountdown();
            lockStudentExamAnswerButtons();
        }
    };

    updateCountdown();

    studentExamCountdownTimer =
        setInterval(updateCountdown, 250);
}


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
        stopStudentExamCountdown();

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

        stopStudentExamCountdown();
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

    const questionText =
        String(
            realtimeState.questionText ||
            "Nội dung câu hỏi đang được cập nhật."
        );

    const answerContents =
        realtimeState.answers || {};

    const serverTime =
        realtimeState.serverTime || "";

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

            <div class="student-exam-question-header">
                <div>
                    <h3>
                        Câu hỏi số ${questionIndex}
                    </h3>
                </div>

                <div class="student-exam-countdown ${
                    canSubmitAnswer
                        ? ""
                        : "student-exam-countdown-locked"
                }">
                    <span>Còn lại</span>
                    <strong id="studentExamCountdownValue">
                        ${canSubmitAnswer ? "..." : "0"}
                    </strong>
                    <small>giây</small>
                </div>
            </div>

            <div class="student-exam-question-text">${escapeStudentExamHtml(questionText)}</div>

            <div class="student-exam-grid student-exam-answer-grid">
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
                            <span class="student-exam-answer-letter">
                                ${answer}
                            </span>

                            <span class="student-exam-answer-text">
                                ${escapeStudentExamHtml(
                                    answerContents[answer] ||
                                    `Đáp án ${answer}`
                                )}
                            </span>
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

    if (canSubmitAnswer) {
        startStudentExamCountdown({
            questionEndsAt,
            serverTime
        });
    } else {
        stopStudentExamCountdown();
    }
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


function formatStudentExamScore(value) {
    const numberValue =
        Number(value);

    if (!Number.isFinite(numberValue)) {
        return "0";
    }

    return Number.isInteger(numberValue)
        ? String(numberValue)
        : String(
            Number(
                numberValue.toFixed(2)
            )
        );
}


function renderStudentExamCompletedResult(
    exam
) {
    const list =
        document.getElementById(
            "studentExamList"
        );

    if (!list) {
        return;
    }

    const attempt =
        exam?.latestAttempt || {};

    const correctCount =
        Number(attempt.correctCount) || 0;

    const totalQuestions =
        Number(
            attempt.totalQuestions ??
            exam?.totalQuestions
        ) || 0;

    const score =
        Number(attempt.score) || 0;

    const maximumScore =
        Number(attempt.maximumScore);

    const maximumScoreText =
        Number.isFinite(maximumScore)
            ? formatStudentExamScore(
                maximumScore
            )
            : (
                String(exam?.type || "")
                    .toUpperCase() === "FINAL_TEST"
                    ? "60"
                    : "10"
            );

    list.innerHTML = `
        <article class="student-exam-result-card">
            <div class="student-exam-result-icon">
                ✓
            </div>

            <span class="student-exam-result-badge">
                Đã hoàn tất
            </span>

            <h2>
                Hoàn thành bài kiểm tra
            </h2>

            <p class="student-exam-result-name">
                ${escapeStudentExamHtml(
                    exam?.name ||
                    getStudentExamTypeLabel(
                        exam?.type
                    )
                )}
            </p>

            <div class="student-exam-result-grid">
                <div class="student-exam-result-item">
                    <span>Số câu đúng</span>
                    <strong>
                        ${correctCount}/${totalQuestions}
                    </strong>
                    <small>câu</small>
                </div>

                <div class="student-exam-result-item">
                    <span>Điểm bài thi</span>
                    <strong>
                        ${formatStudentExamScore(score)}/${maximumScoreText}
                    </strong>
                    <small>điểm</small>
                </div>
            </div>

            <p class="student-exam-result-note">
                Kết quả đã được lưu vào hồ sơ điểm cá nhân của bạn.
            </p>

            <div class="student-exam-result-actions">
                <button
                    type="button"
                    class="student-exam-review-button"
                    onclick="loadStudentExamReview(${Number(
                        exam?.id
                    ) || 0})"
                >
                    🔎 Xem lại bài
                </button>

                <button
                    type="button"
                    class="student-exam-back-button"
                    onclick="loadStudentExamsFromApi()"
                >
                    Quay lại danh sách bài kiểm tra
                </button>
            </div>
        </article>
    `;

    scheduleStudentExamAnswerLock("");
    stopStudentExamCountdown();
}


async function loadStudentExamCompletedResult(
    examId,
    retryCount = 0
) {
    const normalizedExamId =
        Number(examId);

    if (
        !Number.isInteger(normalizedExamId) ||
        normalizedExamId <= 0
    ) {
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

        if (response.status === 401) {
            logoutDemo();
            return;
        }

        if (
            !response.ok ||
            result?.success !== true
        ) {
            throw new Error(
                result?.error?.message ||
                "Không thể tải kết quả bài kiểm tra."
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

        const completedExam =
            exams.find(
                exam =>
                    Number(exam?.id) ===
                    normalizedExamId
            );

        if (
            !completedExam ||
            String(
                completedExam
                    ?.latestAttempt
                    ?.status || ""
            ).toUpperCase() !==
                "COMPLETED"
        ) {
            if (retryCount < 5) {
                setTimeout(
                    () => {
                        loadStudentExamCompletedResult(
                            normalizedExamId,
                            retryCount + 1
                        );
                    },
                    500
                );

                return;
            }

            throw new Error(
                "Kết quả đang được đồng bộ. Vui lòng thử lại."
            );
        }

        renderStudentExamCompletedResult(
            completedExam
        );
    } catch (error) {
        console.error(
            "Load completed Exam result error:",
            error
        );

        const list =
            document.getElementById(
                "studentExamList"
            );

        if (list) {
            list.innerHTML = `
                <article class="student-exam-card student-exam-card-completed">
                    <h3>Bài kiểm tra đã kết thúc</h3>

                    <p class="empty-note">
                        ${escapeStudentExamHtml(
                            error.message ||
                            "Không thể tải kết quả bài kiểm tra."
                        )}
                    </p>

                    <button
                        type="button"
                        class="student-exam-back-button"
                        onclick="loadStudentExamCompletedResult(${normalizedExamId})"
                    >
                        Tải lại kết quả
                    </button>
                </article>
            `;
        }
    }
}

/*
=====================================================
Student Exam Review
Load completed Exam review from Backend
=====================================================
*/

async function loadStudentExamReview(
    examId
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

    const list =
        document.getElementById(
            "studentExamList"
        );

    if (!list) {
        return;
    }

    list.innerHTML = `
        <article class="student-exam-review-loading">
            <div class="student-exam-review-loading-icon">
                ⏳
            </div>

            <h3>
                Đang tải bài làm...
            </h3>

            <p>
                Hệ thống đang lấy lại câu trả lời của bạn.
            </p>
        </article>
    `;

    try {
        const response =
            await fetch(
                `${API_BASE_URL}/api/exams/${normalizedExamId}/attempt/review`,
                {
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    },

                    cache: "no-store"
                }
            );

        let result = null;

        try {
            result =
                await response.json();
        } catch (error) {
            result = null;
        }

        if (response.status === 401) {
            logoutDemo();
            return;
        }

        if (
            !response.ok ||
            result?.success !== true
        ) {
            throw new Error(
                result?.error?.message ||
                "Không thể tải dữ liệu xem lại bài."
            );
        }

        const review =
            result?.data?.review;

        if (
            !review ||
            !Array.isArray(
                review.questions
            )
        ) {
            throw new Error(
                "Dữ liệu xem lại bài không hợp lệ."
            );
        }

        renderStudentExamReview(
            review
        );
    } catch (error) {
        console.error(
            "Load Student Exam review error:",
            error
        );

        list.innerHTML = `
            <article class="student-exam-review-error">
                <div class="student-exam-review-error-icon">
                    ⚠️
                </div>

                <h3>
                    Không thể tải bài làm
                </h3>

                <p>
                    ${escapeStudentExamHtml(
                        error.message ||
                        "Vui lòng thử lại."
                    )}
                </p>

                <div class="student-exam-result-actions">
                    <button
                        type="button"
                        class="student-exam-review-button"
                        onclick="loadStudentExamReview(${normalizedExamId})"
                    >
                        Thử lại
                    </button>

                    <button
                        type="button"
                        class="student-exam-back-button"
                        onclick="loadStudentExamCompletedResult(${normalizedExamId})"
                    >
                        Quay lại kết quả
                    </button>
                </div>
            </article>
        `;
    }
}

/*
=====================================================
Render Student completed Exam review
=====================================================
*/

function renderStudentExamReview(
    review
) {
    const list =
        document.getElementById(
            "studentExamList"
        );

    if (!list) {
        return;
    }

    const exam =
        review?.exam || {};

    const attempt =
        review?.attempt || {};

    const questions =
        Array.isArray(
            review?.questions
        )
            ? review.questions
            : [];

    const examId =
        Number(exam.id) || 0;

    const totalQuestions =
        Number(
            attempt.totalQuestions
        ) || questions.length;

    const correctCount =
        Number(
            attempt.correctCount
        ) || 0;

    const incorrectCount =
        Number(
            attempt.incorrectCount
        ) || 0;

    const unansweredCount =
        Number(
            attempt.unansweredCount
        ) || 0;

    const reviewCount =
        incorrectCount +
        unansweredCount;

    const score =
        Number(
            attempt.score
        ) || 0;

    const maximumScore =
        Number(
            attempt.maximumScore
        ) || 0;

    list.innerHTML = `
        <section
            class="student-exam-review"
            data-exam-id="${examId}"
        >
            <div class="student-exam-review-header">
                <span class="student-exam-result-badge">
                    Xem lại bài
                </span>

                <h2>
                    ${escapeStudentExamHtml(
                        exam.name ||
                        getStudentExamTypeLabel(
                            exam.type
                        )
                    )}
                </h2>

                <p>
                    Kiểm tra lại câu trả lời của bạn
                    sau khi bài thi đã kết thúc.
                </p>
            </div>

            <div class="student-exam-review-summary">
                <div class="student-exam-review-summary-item">
                    <span>Điểm</span>

                    <strong>
                        ${formatStudentExamScore(
                            score
                        )}/${formatStudentExamScore(
                            maximumScore
                        )}
                    </strong>
                </div>

                <div class="student-exam-review-summary-item">
                    <span>Đúng</span>

                    <strong>
                        ${correctCount}/${totalQuestions}
                    </strong>
                </div>

                <div class="student-exam-review-summary-item">
                    <span>Sai</span>

                    <strong>
                        ${incorrectCount}
                    </strong>
                </div>

                <div class="student-exam-review-summary-item">
                    <span>Chưa trả lời</span>

                    <strong>
                        ${unansweredCount}
                    </strong>
                </div>
            </div>

            <div class="student-exam-review-filters">
                <button
                    type="button"
                    class="student-exam-review-filter is-active"
                    data-review-filter="all"
                    onclick="filterStudentExamReview('all')"
                >
                    Tất cả
                    <span>
                        ${totalQuestions}
                    </span>
                </button>

                <button
                    type="button"
                    class="student-exam-review-filter"
                    data-review-filter="correct"
                    onclick="filterStudentExamReview('correct')"
                >
                    Đúng
                    <span>
                        ${correctCount}
                    </span>
                </button>

                <button
                    type="button"
                    class="student-exam-review-filter"
                    data-review-filter="review"
                    onclick="filterStudentExamReview('review')"
                >
                    Cần xem lại
                    <span>
                        ${reviewCount}
                    </span>
                </button>
            </div>

            <div
                id="studentExamReviewQuestions"
                class="student-exam-review-questions"
            >
                ${questions
                    .map(
                        renderStudentExamReviewQuestion
                    )
                    .join("")}
            </div>

            <div class="student-exam-result-actions">
                <button
                    type="button"
                    class="student-exam-back-button"
                    onclick="loadStudentExamCompletedResult(${examId})"
                >
                    ← Quay lại kết quả
                </button>

                <button
                    type="button"
                    class="student-exam-back-button student-exam-review-list-button"
                    onclick="loadStudentExamsFromApi()"
                >
                    Danh sách bài kiểm tra
                </button>
            </div>
        </section>
    `;

    scheduleStudentExamAnswerLock("");
    stopStudentExamCountdown();
}

/*
=====================================================
Render one Student Exam review question
=====================================================
*/

function renderStudentExamReviewQuestion(
    question
) {
    const questionIndex =
        Number(
            question?.questionIndex
        ) || 0;

    const chosenAnswer =
        question?.chosenAnswer
            ? String(
                question.chosenAnswer
            )
                .trim()
                .toUpperCase()
            : null;

    const correctAnswer =
        String(
            question?.correctAnswer ||
            ""
        )
            .trim()
            .toUpperCase();

    const isAnswered =
        Boolean(
            question?.isAnswered
        );

    const isCorrect =
        Boolean(
            question?.isCorrect
        );

    const answers =
        question?.answers || {};

    let reviewState =
        "unanswered";

    if (isAnswered) {
        reviewState =
            isCorrect
                ? "correct"
                : "incorrect";
    }

    const statusText =
        reviewState === "correct"
            ? "✓ Đúng"
            : reviewState === "incorrect"
                ? "✕ Sai"
                : "— Chưa trả lời";

    const chosenText =
        chosenAnswer
            ? (
                answers[chosenAnswer] ||
                question
                    ?.chosenAnswerText ||
                ""
            )
            : "";

    const correctText =
        answers[correctAnswer] ||
        question
            ?.correctAnswerText ||
        "";

    return `
        <article
            class="student-exam-review-question student-exam-review-question-${reviewState}"
            data-review-state="${reviewState}"
        >
            <div class="student-exam-review-question-top">
                <span class="student-exam-review-question-number">
                    Câu ${questionIndex}
                </span>

                <span
                    class="student-exam-review-status student-exam-review-status-${reviewState}"
                >
                    ${statusText}
                </span>
            </div>

            <h3 class="student-exam-review-question-text">
                ${escapeStudentExamHtml(
                    question?.questionText ||
                    ""
                )}
            </h3>

            <div class="student-exam-review-answer-list">
                ${["A", "B", "C", "D"]
                    .map(answerKey => {
                        const answerText =
                            answers[
                                answerKey
                            ] || "";

                        const isChosen =
                            chosenAnswer ===
                            answerKey;

                        const isCorrectOption =
                            correctAnswer ===
                            answerKey;

                        let optionClass =
                            "";

                        if (
                            isCorrectOption
                        ) {
                            optionClass +=
                                " is-correct-answer";
                        }

                        if (
                            isChosen &&
                            !isCorrectOption
                        ) {
                            optionClass +=
                                " is-wrong-choice";
                        }

                        if (isChosen) {
                            optionClass +=
                                " is-student-choice";
                        }

                        return `
                            <div
                                class="student-exam-review-option${optionClass}"
                            >
                                <span class="student-exam-review-option-letter">
                                    ${answerKey}
                                </span>

                                <span class="student-exam-review-option-text">
                                    ${escapeStudentExamHtml(
                                        answerText
                                    )}
                                </span>

                                ${
                                    isCorrectOption
                                        ? `
                                            <span class="student-exam-review-option-mark">
                                                ✓ Đáp án đúng
                                            </span>
                                        `
                                        : isChosen
                                            ? `
                                                <span class="student-exam-review-option-mark">
                                                    Bạn chọn
                                                </span>
                                            `
                                            : ""
                                }
                            </div>
                        `;
                    })
                    .join("")}
            </div>

            <div class="student-exam-review-answer-summary">
                <div>
                    <span>Bạn chọn</span>

                    <strong>
                        ${
                            chosenAnswer
                                ? `
                                    ${escapeStudentExamHtml(
                                        chosenAnswer
                                    )}.
                                    ${escapeStudentExamHtml(
                                        chosenText
                                    )}
                                `
                                : "— Không trả lời"
                        }
                    </strong>
                </div>

                <div>
                    <span>Đáp án đúng</span>

                    <strong>
                        ${escapeStudentExamHtml(
                            correctAnswer
                        )}.
                        ${escapeStudentExamHtml(
                            correctText
                        )}
                    </strong>
                </div>
            </div>
        </article>
    `;
}

/*
=====================================================
Filter Student Exam review
=====================================================
*/

function filterStudentExamReview(
    filter
) {
    const normalizedFilter =
        ["all", "correct", "review"]
            .includes(filter)
            ? filter
            : "all";

    document
        .querySelectorAll(
            ".student-exam-review-filter"
        )
        .forEach(button => {
            button.classList.toggle(
                "is-active",
                button.dataset
                    .reviewFilter ===
                    normalizedFilter
            );
        });

    document
        .querySelectorAll(
            ".student-exam-review-question"
        )
        .forEach(card => {
            const state =
                String(
                    card.dataset
                        .reviewState || ""
                );

            let shouldShow = true;

            if (
                normalizedFilter ===
                "correct"
            ) {
                shouldShow =
                    state === "correct";
            }

            if (
                normalizedFilter ===
                "review"
            ) {
                shouldShow =
                    state ===
                        "incorrect" ||
                    state ===
                        "unanswered";
            }

            card.classList.toggle(
                "hidden",
                !shouldShow
            );
        });
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

                const isCompleted =
                    status === "COMPLETED" ||
                    String(
                        exam
                            ?.latestAttempt
                            ?.status || ""
                    ).toUpperCase() ===
                        "COMPLETED";

                const canOpenExam =
                    canJoin ||
                    isWaitingForStart ||
                    isInProgress;

                return `
                    <article
                        class="student-exam-card ${
                            isCompleted
                                ? "student-exam-card-completed"
                                : isWaitingForStart
                                    ? "student-exam-card-waiting"
                                    : canJoin
                                        ? "student-exam-card-ready"
                                        : isInProgress
                                            ? "student-exam-card-progress"
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

                        ${
                            isCompleted &&
                            exam.latestAttempt
                                ? `
                                    <div class="student-exam-card-result">
                                        <span>
                                            Đúng
                                            <strong>
                                                ${Number(
                                                    exam.latestAttempt.correctCount
                                                ) || 0}/${
                                                    Number(
                                                        exam.latestAttempt.totalQuestions
                                                    ) ||
                                                    Number(
                                                        exam.totalQuestions
                                                    ) ||
                                                    0
                                                }
                                            </strong>
                                            câu
                                        </span>

                                        <span>
                                            Điểm
                                            <strong>
                                                ${formatStudentExamScore(
                                                    exam.latestAttempt.score
                                                )}/${
                                                    Number.isFinite(
                                                        Number(
                                                            exam.latestAttempt.maximumScore
                                                        )
                                                    )
                                                        ? formatStudentExamScore(
                                                            exam.latestAttempt.maximumScore
                                                        )
                                                        : String(exam.type || "").toUpperCase() === "FINAL_TEST"
                                                            ? "60"
                                                            : "10"
                                                }
                                            </strong>
                                        </span>
                                    </div>
                                `
                                : ""
                        }

                        <button
                            type="button"
                            class="student-exam-join-button"
                            data-exam-id="${examId}"
                            data-exam-status="${escapeStudentExamHtml(status)}"
                            ${
                                canOpenExam ||
                                isCompleted
                                    ? ""
                                    : "disabled"
                            }
                        >
                            ${escapeStudentExamHtml(
                                isCompleted
                                    ? "Xem kết quả"
                                    : isInProgress
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
                    const buttonStatus =
                        String(
                            button.dataset
                                .examStatus || ""
                        ).toUpperCase();

                    if (
                        buttonStatus ===
                        "COMPLETED"
                    ) {
                        loadStudentExamCompletedResult(
                            button.dataset.examId
                        );

                        return;
                    }

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


function openAdminExamPresentationScreen() {
  const examIdInput = window.prompt(
    "Nhập ID bài kiểm tra cần trình chiếu:"
  );

  if (examIdInput === null) {
    return;
  }

  const examId = Number(examIdInput);

  if (
    !Number.isInteger(examId) ||
    examId <= 0
  ) {
    window.alert(
      "ID bài kiểm tra không hợp lệ."
    );

    return;
  }

  window.open(
    `admin-test-screen.html?examId=${examId}`,
    "_blank",
    "noopener,noreferrer"
  );
}

/*
=====================================================
Admin Exam Presentation Screen
=====================================================
*/

let adminExamPresentationTimer = null;
let adminExamPresentationPoller = null;
let adminExamPresentationLastQuestionId = null;


function getAdminExamPresentationId() {
    const params =
        new URLSearchParams(
            window.location.search
        );

    const examId =
        Number(params.get("examId"));

    if (
        !Number.isInteger(examId) ||
        examId <= 0
    ) {
        return null;
    }

    return examId;
}


function setAdminExamPresentationMessage(
    message
) {
    const waitingCard =
        document.getElementById(
            "presentationWaitingCard"
        );

    const questionCard =
        document.getElementById(
            "presentationQuestionCard"
        );

    const messageElement =
        document.getElementById(
            "presentationMessage"
        );

    if (
        !waitingCard ||
        !questionCard ||
        !messageElement
    ) {
        return;
    }

    waitingCard.classList.remove(
        "hidden"
    );

    questionCard.classList.add(
        "hidden"
    );

    messageElement.innerText =
        message;
}


function startAdminExamPresentationCountdown(
    questionEndsAt
) {
    clearInterval(
        adminExamPresentationTimer
    );

    const timerElement =
        document.getElementById(
            "presentationTimer"
        );

    const statusElement =
        document.getElementById(
            "presentationStatus"
        );

    if (!timerElement) {
        return;
    }

    const endsAt =
        Date.parse(questionEndsAt);

    function updateTimer() {
        if (!Number.isFinite(endsAt)) {
            timerElement.innerText = "--";
            return;
        }

        const remainingSeconds =
            Math.max(
                Math.ceil(
                    (
                        endsAt -
                        Date.now()
                    ) / 1000
                ),
                0
            );

        timerElement.innerText =
            String(
                remainingSeconds
            ).padStart(2, "0");

        if (remainingSeconds <= 0) {
            clearInterval(
                adminExamPresentationTimer
            );

            if (statusElement) {
                statusElement.innerText =
                    "Đã hết giờ";
            }
        }
    }

    updateTimer();

    adminExamPresentationTimer =
        setInterval(
            updateTimer,
            250
        );
}


function renderAdminExamPresentation(
    payload
) {
    const exam =
        payload?.exam || {};

    const liveState =
        payload?.liveState ||
        payload?.realtimeState ||
        {};

    const question =
        payload?.question ||
        liveState?.question ||
        {};

    const examNameElement =
        document.getElementById(
            "presentationExamName"
        );

    const counterElement =
        document.getElementById(
            "presentationQuestionCounter"
        );

    const waitingCard =
        document.getElementById(
            "presentationWaitingCard"
        );

    const questionCard =
        document.getElementById(
            "presentationQuestionCard"
        );

    if (examNameElement) {
        examNameElement.innerText =
            exam.name ||
            "Bài kiểm tra TKH 2026";
    }

    const examStatus =
        String(
            exam.status || ""
        ).toUpperCase();

    if (
        examStatus === "COMPLETED"
    ) {
        clearInterval(
            adminExamPresentationTimer
        );

        setAdminExamPresentationMessage(
            "Bài kiểm tra đã kết thúc. Cảm ơn các bạn đã tham gia!"
        );

        if (counterElement) {
            counterElement.innerText =
                "Đã hoàn tất";
        }

        return;
    }

    if (
        examStatus ===
        "WAITING_ROOM_OPEN"
    ) {
        setAdminExamPresentationMessage(
            "Phòng chờ đã mở. Các học viên vui lòng đăng nhập và vào phòng."
        );

        return;
    }

    const questionId =
        Number(
            question.id ||
            liveState.currentQuestionId
        );

    const questionIndex =
        Number(
            question.questionIndex ||
            question.questionNo ||
            liveState.currentQuestionIndex
        );

    const totalQuestions =
        Number(
            liveState.totalQuestions ||
            exam.totalQuestions
        );

    if (
        !Number.isInteger(questionId) ||
        questionId <= 0
    ) {
        setAdminExamPresentationMessage(
            examStatus === "IN_PROGRESS"
                ? "Bài kiểm tra đã bắt đầu. Đang chờ Admin mở câu hỏi đầu tiên..."
                : "Đang chờ bài kiểm tra bắt đầu..."
        );

        return;
    }

    waitingCard?.classList.add(
        "hidden"
    );

    questionCard?.classList.remove(
        "hidden"
    );

    if (counterElement) {
        counterElement.innerText =
            `Câu ${questionIndex || "-"} / ${totalQuestions || "-"}`;
    }

    const statusElement =
        document.getElementById(
            "presentationStatus"
        );

    const liveStatus =
        String(
            liveState.liveState ||
            liveState.state ||
            ""
        ).toUpperCase();

    if (statusElement) {
        statusElement.innerText =
            liveStatus === "ACTIVE"
                ? "Đang trả lời"
                : "Đã khóa";
    }

    const questionText =
        question.questionText ||
        question.content ||
        question.text ||
        liveState.questionText ||
        "Không tải được nội dung câu hỏi.";

    document.getElementById(
        "presentationQuestionText"
    ).innerText =
        questionText;

    const answers =
        question.answers ||
        question.options ||
        {};

    const optionA =
        question.optionA ??
        question.answerA ??
        answers.A ??
        answers.a ??
        "—";

    const optionB =
        question.optionB ??
        question.answerB ??
        answers.B ??
        answers.b ??
        "—";

    const optionC =
        question.optionC ??
        question.answerC ??
        answers.C ??
        answers.c ??
        "—";

    const optionD =
        question.optionD ??
        question.answerD ??
        answers.D ??
        answers.d ??
        "—";

    document.getElementById(
        "presentationAnswerA"
    ).innerText = optionA;

    document.getElementById(
        "presentationAnswerB"
    ).innerText = optionB;

    document.getElementById(
        "presentationAnswerC"
    ).innerText = optionC;

    document.getElementById(
        "presentationAnswerD"
    ).innerText = optionD;

    const questionEndsAt =
        liveState.questionEndsAt ||
        liveState.question_ends_at ||
        question.questionEndsAt ||
        "";

    if (
        liveStatus === "ACTIVE"
    ) {
        startAdminExamPresentationCountdown(
            questionEndsAt
        );
    } else {
        clearInterval(
            adminExamPresentationTimer
        );

        const timerElement =
            document.getElementById(
                "presentationTimer"
            );

        if (timerElement) {
            timerElement.innerText = "00";
        }
    }

    adminExamPresentationLastQuestionId =
        questionId;
}


async function loadAdminExamPresentation() {
    const container =
        document.getElementById(
            "presentationWaitingCard"
        );

    if (!container) {
        return;
    }

    const examId =
        getAdminExamPresentationId();

    if (!examId) {
        setAdminExamPresentationMessage(
            "ID bài kiểm tra không hợp lệ."
        );

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

    try {
        const response = await fetch(
            `${API_BASE_URL}/api/admin/test/exams/${examId}/presentation`,
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
            window.location.href =
                "index.html";

            return;
        }

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                result?.error?.message ||
                result?.message ||
                "Không thể tải màn hình trình chiếu."
            );
        }

        renderAdminExamPresentation(
            result.data || result
        );
    } catch (error) {
        console.error(
            "Load exam presentation error:",
            error
        );

        setAdminExamPresentationMessage(
            error.message ||
            "Không thể kết nối đến bài kiểm tra."
        );
    }
}


function initializeAdminExamPresentation() {
    const container =
        document.getElementById(
            "presentationWaitingCard"
        );

    if (!container) {
        return;
    }

    loadAdminExamPresentation();

    clearInterval(
        adminExamPresentationPoller
    );

    adminExamPresentationPoller =
        setInterval(
            loadAdminExamPresentation,
            1000
        );
}


document.addEventListener(
    "DOMContentLoaded",
    initializeAdminExamPresentation
);

/*
=====================================================
FORUM
=====================================================
*/

let forumSocket = null;

let forumRooms = [];

let forumCurrentRoom = null;

let forumPendingPasswordRoom = null;

let forumMessageItems = [];

let forumPageInitialized = false;

let forumJoiningRoom = false;

let forumSendingMessage = false;

let forumCreatingRoom = false;


/*
=====================================================
Forum Helpers
=====================================================
*/

function isForumPageDemo() {
    return (
        getCurrentPageName() ===
        "forum.html"
    );
}


function forumEscapeHtmlDemo(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function getForumCurrentUserDemo() {
    try {
        return JSON.parse(
            localStorage.getItem(
                "currentUser"
            )
        );
    } catch (error) {
        return null;
    }
}


function getForumTokenDemo() {
    return localStorage.getItem(
        "accessToken"
    );
}


function getForumAvatarUrlDemo(
    sender
) {
    const avatarFilename =
        String(
            sender?.avatarFilename ||
            ""
        ).trim();

    /*
     * Nếu database có lưu rõ tên file avatar,
     * ưu tiên dùng tên file đó.
     */
    if (avatarFilename) {
        return (
            "assets/images/members/" +
            encodeURIComponent(
                avatarFilename
            )
        );
    }

    /*
     * Nếu avatar_filename đang NULL,
     * dùng lại quy tắc avatar hiện có:
     *
     * Ngô Tấn Phát
     * → ngotanphat.jpg
     *
     * Riêng các trường hợp trùng tên
     * sẽ dùng mã TKH theo helper chung.
     */
    if (
        typeof getMemberAvatarUrlDemo ===
        "function"
    ) {
        return getMemberAvatarUrlDemo({
            fullName:
                sender?.fullName,

            tkhCode:
                sender?.tkhCode,

            username:
                sender?.username,
        });
    }

    return (
        "assets/images/members/" +
        "default-avatar.jpg"
    );
}


function formatForumDateTimeDemo(
    value
) {
    if (!value) {
        return "";
    }

    let date = null;

    if (
        typeof parseSqlLocalDateTime ===
        "function"
    ) {
        date =
            parseSqlLocalDateTime(
                value
            );
    }

    if (!date) {
        date =
            new Date(value);
    }

    if (
        !date ||
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date.toLocaleString(
        "vi-VN",
        {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


function setForumInlineMessageDemo(
    element,
    message = "",
    type = ""
) {
    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.className =
        "forum-inline-message";

    if (type) {
        element.classList.add(
            type
        );
    }
}


function setForumConnectionStatusDemo(
    status,
    text
) {
    const element =
        document.getElementById(
            "forumConnectionStatus"
        );

    if (!element) {
        return;
    }

    element.textContent =
        text;

    element.className =
        "forum-connection-status";

    if (status === "connected") {
        element.classList.add(
            "forum-connection-connected"
        );

        return;
    }

    if (
        status ===
        "disconnected"
    ) {
        element.classList.add(
            "forum-connection-disconnected"
        );

        return;
    }

    element.classList.add(
        "forum-connection-connecting"
    );
}


function getForumRoomIconDemo(
    room
) {
    if (
        room?.roomType ===
        "GLOBAL"
    ) {
        return "🌐";
    }

    if (room?.hasPassword) {
        return "🔒";
    }

    return "💬";
}


function scrollForumMessagesToBottomDemo() {
    const list =
        document.getElementById(
            "forumMessageList"
        );

    if (!list) {
        return;
    }

    requestAnimationFrame(() => {
        list.scrollTop =
            list.scrollHeight;
    });
}


/*
=====================================================
Forum REST Request
=====================================================
*/

async function forumApiRequestDemo(
    path,
    options = {}
) {
    const token =
        getForumTokenDemo();

    if (!token) {
        logoutDemo();

        throw new Error(
            "Phiên đăng nhập không tồn tại."
        );
    }

    const response =
        await fetch(
            `${API_BASE_URL}${path}`,
            {
                ...options,

                headers: {
                    Authorization:
                        `Bearer ${token}`,

                    ...(
                        options.body
                            ? {
                                "Content-Type":
                                    "application/json"
                            }
                            : {}
                    ),

                    ...(
                        options.headers ||
                        {}
                    )
                }
            }
        );

    let result = null;

    try {
        result =
            await response.json();
    } catch (error) {
        result = null;
    }

    if (response.status === 401) {
        logoutDemo();

        throw new Error(
            "Phiên đăng nhập đã hết hạn."
        );
    }

    if (
        !response.ok ||
        result?.success !== true
    ) {
        const apiError =
            new Error(
                result?.error?.message ||
                "Không thể xử lý yêu cầu Diễn đàn."
            );

        apiError.code =
            result?.error?.code ||
            null;

        apiError.status =
            response.status;

        apiError.details =
            result?.error?.details ||
            null;

        throw apiError;
    }

    return result.data;
}


/*
=====================================================
Render Rooms
=====================================================
*/

function renderForumRoomsDemo() {
    const list =
        document.getElementById(
            "forumRoomList"
        );

    if (!list) {
        return;
    }

    if (
        !Array.isArray(
            forumRooms
        ) ||
        forumRooms.length === 0
    ) {
        list.innerHTML = `
            <div class="forum-room-empty">
                Chưa có phòng chat nào.
            </div>
        `;

        return;
    }

    list.innerHTML =
        forumRooms
            .map(room => {
                const isActive =
                    Number(
                        forumCurrentRoom?.id
                    ) ===
                    Number(room.id);

                const creatorName =
                    room.creator?.fullName ||
                    room.creator?.username ||
                    "";

                let metaText =
                    room.roomType ===
                    "GLOBAL"
                        ? "Phòng chat chung"
                        : creatorName
                            ? `Tạo bởi ${creatorName}`
                            : "Phòng chat thành viên";

                if (
                    room.hasPassword
                ) {
                    metaText +=
                        " · Có mật khẩu";
                }

                return `
                    <button
                        type="button"
                        class="forum-room-item ${
                            isActive
                                ? "active"
                                : ""
                        }"
                        data-forum-room-id="${
                            Number(room.id)
                        }"
                    >
                        <span
                            class="forum-room-item-icon"
                        >
                            ${getForumRoomIconDemo(
                                room
                            )}
                        </span>

                        <span
                            class="forum-room-item-content"
                        >
                            <span
                                class="forum-room-item-name"
                            >
                                ${forumEscapeHtmlDemo(
                                    room.name
                                )}
                            </span>

                            <span
                                class="forum-room-item-meta"
                            >
                                ${forumEscapeHtmlDemo(
                                    metaText
                                )}
                            </span>
                        </span>

                        ${
                            room.hasPassword
                                ? `
                                    <span
                                        class="forum-room-lock"
                                        aria-label="Phòng có mật khẩu"
                                    >
                                        🔒
                                    </span>
                                `
                                : ""
                        }
                    </button>
                `;
            })
            .join("");

    list
        .querySelectorAll(
            "[data-forum-room-id]"
        )
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const roomId =
                        Number(
                            button.dataset
                                .forumRoomId
                        );

                    const room =
                        forumRooms.find(
                            item =>
                                Number(
                                    item.id
                                ) ===
                                roomId
                        );

                    if (room) {
                        requestJoinForumRoomDemo(
                            room
                        );
                    }
                }
            );
        });
}


/*
=====================================================
Render Messages
=====================================================
*/

function renderForumMessagesDemo() {
    const list =
        document.getElementById(
            "forumMessageList"
        );

    if (!list) {
        return;
    }

    const currentUser =
        getForumCurrentUserDemo();

    if (
        !Array.isArray(
            forumMessageItems
        ) ||
        forumMessageItems.length === 0
    ) {
        list.innerHTML = `
            <div class="forum-message-placeholder">
                Chưa có tin nhắn nào trong phòng này.
                Hãy gửi lời chào đầu tiên!
            </div>
        `;

        return;
    }

    list.innerHTML =
        forumMessageItems
            .map(message => {
                const sender =
                    message.sender ||
                    {};

                const isMine =
                    Number(sender.userId) ===
                    Number(currentUser?.id);

                const senderName =
                    sender.fullName ||
                    sender.username ||
                    "Thành viên TKH";

                const senderCode =
                    sender.tkhCode ||
                    sender.username ||
                    "";

                const timeText =
                    formatForumDateTimeDemo(
                        message.createdAt
                    );

                const avatarUrl =
                    getForumAvatarUrlDemo(
                        sender
                    );

                return `
                    <article
                        class="forum-message-item ${
                            isMine
                                ? "mine"
                                : ""
                        }"
                        data-forum-message-id="${
                            Number(message.id)
                        }"
                    >
                        <img
                            class="forum-message-avatar"
                            src="${forumEscapeHtmlDemo(
                                avatarUrl
                            )}"
                            alt="Avatar ${forumEscapeHtmlDemo(
                                senderName
                            )}"
                            onerror="
                                this.onerror=null;
                                this.src='assets/images/members/default-avatar.jpg';
                            "
                        >

                        <div
                            class="forum-message-content"
                        >
                            <div
                                class="forum-message-header"
                            >
                                <span
                                    class="forum-message-sender"
                                >
                                    ${forumEscapeHtmlDemo(
                                        senderName
                                    )}
                                </span>

                                ${
                                    senderCode
                                        ? `
                                            <span
                                                class="forum-message-code"
                                            >
                                                ${forumEscapeHtmlDemo(
                                                    senderCode
                                                )}
                                            </span>
                                        `
                                        : ""
                                }

                                <time
                                    class="forum-message-time"
                                >
                                    ${forumEscapeHtmlDemo(
                                        timeText
                                    )}
                                </time>
                            </div>

                            <div
                                class="forum-message-bubble"
                            >${
                                typeof window.renderForumMentionText ===
                                "function"
                                    ? window.renderForumMentionText(
                                        message.messageText
                                    )
                                    : forumEscapeHtmlDemo(
                                        message.messageText
                                    )
                            }</div>
                        </div>
                    </article>
                `;
            })
            .join("");

    scrollForumMessagesToBottomDemo();
}


function appendForumMessageDemo(
    message
) {
    if (
        !message ||
        !forumCurrentRoom
    ) {
        return;
    }

    if (
        Number(message.roomId) !==
        Number(forumCurrentRoom.id)
    ) {
        return;
    }

    const alreadyExists =
        forumMessageItems.some(
            item =>
                Number(item.id) ===
                Number(message.id)
        );

    if (alreadyExists) {
        return;
    }

    forumMessageItems.push(
        message
    );

    if (
        forumMessageItems.length >
        50
    ) {
        forumMessageItems =
            forumMessageItems.slice(
                -50
            );
    }

    renderForumMessagesDemo();
}


/*
=====================================================
Current Room UI
=====================================================
*/

function setForumCurrentRoomDemo(
    room
) {
    forumCurrentRoom =
        room || null;

    const nameElement =
        document.getElementById(
            "forumCurrentRoomName"
        );

    const descriptionElement =
        document.getElementById(
            "forumCurrentRoomDescription"
        );

    const iconElement =
        document.getElementById(
            "forumCurrentRoomIcon"
        );

    const input =
        document.getElementById(
            "forumMessageInput"
        );

    const sendButton =
        document.getElementById(
            "forumSendMessageButton"
        );

    if (!room) {
        if (nameElement) {
            nameElement.textContent =
                "Chưa chọn phòng chat";
        }

        if (
            descriptionElement
        ) {
            descriptionElement
                .textContent =
                "Chọn một phòng để tham gia.";
        }

        if (iconElement) {
            iconElement.textContent =
                "💬";
        }

        if (input) {
            input.disabled = true;
        }

        if (sendButton) {
            sendButton.disabled = true;
        }

        renderForumRoomsDemo();

        return;
    }

    if (nameElement) {
        nameElement.textContent =
            room.name ||
            "Phòng chat";
    }

    if (descriptionElement) {
        descriptionElement.textContent =
            room.roomType ===
            "GLOBAL"
                ? "Phòng trò chuyện chung của TKH 2026."
                : room.hasPassword
                    ? "Phòng riêng có mật khẩu."
                    : "Phòng chat công khai.";
    }

    if (iconElement) {
        iconElement.textContent =
            getForumRoomIconDemo(
                room
            );
    }

    if (input) {
        input.disabled = false;
        input.placeholder =
            `Nhắn tin trong ${room.name}...`;
    }

    if (sendButton) {
        sendButton.disabled = false;
    }

    renderForumRoomsDemo();
}


/*
=====================================================
Load Rooms
=====================================================
*/

async function loadForumRoomsDemo(
    {
        autoJoinGlobal = false,
    } = {}
) {
    const messageElement =
        document.getElementById(
            "forumRoomListMessage"
        );

    const list =
        document.getElementById(
            "forumRoomList"
        );

    if (list) {
        list.innerHTML = `
            <div class="forum-room-loading">
                Đang tải danh sách phòng...
            </div>
        `;
    }

    setForumInlineMessageDemo(
        messageElement,
        "",
        ""
    );

    try {
        const data =
            await forumApiRequestDemo(
                "/api/forum/rooms"
            );

        forumRooms =
            Array.isArray(
                data.rooms
            )
                ? data.rooms
                : [];

        renderForumRoomsDemo();

        if (
            autoJoinGlobal &&
            !forumCurrentRoom
        ) {
            const globalRoom =
                forumRooms.find(
                    room =>
                        room.roomType ===
                        "GLOBAL"
                );

            if (globalRoom) {
                joinForumRoomDemo(
                    globalRoom,
                    ""
                );
            }
        }
    } catch (error) {
        console.error(
            "Load forum rooms error:",
            error
        );

        if (list) {
            list.innerHTML = `
                <div class="forum-room-empty">
                    Không thể tải danh sách phòng.
                </div>
            `;
        }

        setForumInlineMessageDemo(
            messageElement,
            error.message ||
                "Không thể tải danh sách phòng.",
            "error"
        );
    }
}


/*
=====================================================
Join Room
=====================================================
*/

function requestJoinForumRoomDemo(
    room
) {
    if (!room) {
        return;
    }

    if (
        Number(
            forumCurrentRoom?.id
        ) ===
        Number(room.id)
    ) {
        return;
    }

    if (room.hasPassword) {
        openForumPasswordModalDemo(
            room
        );

        return;
    }

    joinForumRoomDemo(
        room,
        ""
    );
}


function joinForumRoomDemo(
    room,
    password = ""
) {
    if (
        !forumSocket ||
        !forumSocket.connected
    ) {
        setForumInlineMessageDemo(
            document.getElementById(
                "forumChatMessage"
            ),
            "Chưa kết nối được với hệ thống realtime.",
            "error"
        );

        return;
    }

    if (
        !room ||
        forumJoiningRoom
    ) {
        return;
    }

    forumJoiningRoom = true;

    const messageList =
        document.getElementById(
            "forumMessageList"
        );

    if (messageList) {
        messageList.innerHTML = `
            <div class="forum-message-placeholder">
                Đang tham gia phòng chat...
            </div>
        `;
    }

    forumSocket.emit(
        "forum:join-room",
        {
            roomId:
                room.id,

            password:
                password || "",
        },
        result => {
            forumJoiningRoom = false;

            if (
                result?.success !==
                true
            ) {
                const errorCode =
                    result?.error?.code;

                const errorMessage =
                    result?.error?.message ||
                    "Không thể tham gia phòng chat.";

                if (
                    errorCode ===
                    "FORUM_ROOM_PASSWORD_INVALID"
                ) {
                    setForumInlineMessageDemo(
                        document.getElementById(
                            "forumPasswordMessage"
                        ),
                        errorMessage,
                        "error"
                    );

                    return;
                }

                setForumInlineMessageDemo(
                    document.getElementById(
                        "forumChatMessage"
                    ),
                    errorMessage,
                    "error"
                );

                if (messageList) {
                    messageList.innerHTML = `
                        <div class="forum-message-placeholder">
                            Không thể tải phòng chat.
                        </div>
                    `;
                }

                return;
            }

            closeForumPasswordModalDemo();

            const data =
                result.data ||
                {};

            forumMessageItems =
                Array.isArray(
                    data.messages
                )
                    ? data.messages.slice(
                        -50
                    )
                    : [];

            setForumCurrentRoomDemo(
                data.room ||
                room
            );

            setForumInlineMessageDemo(
                document.getElementById(
                    "forumChatMessage"
                ),
                "",
                ""
            );

            renderForumMessagesDemo();

            document
                .getElementById(
                    "forumMessageInput"
                )
                ?.focus();
        }
    );
}


/*
=====================================================
Send Message
=====================================================
*/

function sendForumMessageDemo() {
    const input =
        document.getElementById(
            "forumMessageInput"
        );

    const button =
        document.getElementById(
            "forumSendMessageButton"
        );

    const messageElement =
        document.getElementById(
            "forumChatMessage"
        );

    const messageText =
        String(
            input?.value ||
            ""
        ).trim();

    if (
        !forumCurrentRoom ||
        !forumSocket?.connected
    ) {
        setForumInlineMessageDemo(
            messageElement,
            "Bạn chưa kết nối hoặc chưa tham gia phòng chat.",
            "error"
        );

        return;
    }

    if (!messageText) {
        setForumInlineMessageDemo(
            messageElement,
            "Vui lòng nhập nội dung tin nhắn.",
            "error"
        );

        return;
    }

    if (
        messageText.length >
        1000
    ) {
        setForumInlineMessageDemo(
            messageElement,
            "Tin nhắn không được vượt quá 1000 ký tự.",
            "error"
        );

        return;
    }

    if (forumSendingMessage) {
        return;
    }

    forumSendingMessage = true;

    if (button) {
        button.disabled = true;
        button.textContent =
            "Đang gửi...";
    }

    forumSocket.emit(
        "forum:send-message",
        {
            roomId:
                forumCurrentRoom.id,

            messageText,
        },
        result => {
            forumSendingMessage = false;

            if (button) {
                button.disabled = false;
                button.textContent =
                    "Gửi";
            }

            if (
                result?.success !==
                true
            ) {
                setForumInlineMessageDemo(
                    messageElement,
                    result?.error?.message ||
                        "Không thể gửi tin nhắn.",
                    "error"
                );

                return;
            }

            if (input) {
                input.value = "";
                input.focus();
            }

            setForumInlineMessageDemo(
                messageElement,
                "",
                ""
            );
        }
    );
}


/*
=====================================================
Create Room Modal
=====================================================
*/

function openForumCreateRoomModalDemo() {
    const modal =
        document.getElementById(
            "forumCreateRoomModal"
        );

    if (!modal) {
        return;
    }

    document.getElementById(
        "forumCreateRoomName"
    ).value = "";

    document.getElementById(
        "forumCreateRoomPassword"
    ).value = "";

    setForumInlineMessageDemo(
        document.getElementById(
            "forumCreateRoomMessage"
        ),
        "",
        ""
    );

    modal.classList.remove(
        "hidden"
    );

    document
        .getElementById(
            "forumCreateRoomName"
        )
        ?.focus();
}


function closeForumCreateRoomModalDemo() {
    document
        .getElementById(
            "forumCreateRoomModal"
        )
        ?.classList.add(
            "hidden"
        );
}


async function submitForumCreateRoomDemo() {
    const nameInput =
        document.getElementById(
            "forumCreateRoomName"
        );

    const passwordInput =
        document.getElementById(
            "forumCreateRoomPassword"
        );

    const button =
        document.getElementById(
            "forumSubmitCreateRoomButton"
        );

    const messageElement =
        document.getElementById(
            "forumCreateRoomMessage"
        );

    const name =
        String(
            nameInput?.value ||
            ""
        )
            .trim()
            .replace(/\s+/g, " ");

    const password =
        String(
            passwordInput?.value ||
            ""
        ).trim();

    if (!name) {
        setForumInlineMessageDemo(
            messageElement,
            "Vui lòng nhập tên phòng.",
            "error"
        );

        return;
    }

    if (name.length > 100) {
        setForumInlineMessageDemo(
            messageElement,
            "Tên phòng không được vượt quá 100 ký tự.",
            "error"
        );

        return;
    }

    if (
        password.length >
        50
    ) {
        setForumInlineMessageDemo(
            messageElement,
            "Mật khẩu không được vượt quá 50 ký tự.",
            "error"
        );

        return;
    }

    if (forumCreatingRoom) {
        return;
    }

    forumCreatingRoom = true;

    if (button) {
        button.disabled = true;
        button.textContent =
            "Đang tạo...";
    }

    setForumInlineMessageDemo(
        messageElement,
        "Đang tạo phòng...",
        "info"
    );

    try {
        const data =
            await forumApiRequestDemo(
                "/api/forum/rooms",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            name,
                            password,
                        })
                }
            );

        const createdRoom =
            data.room;

        if (
            createdRoom &&
            !forumRooms.some(
                room =>
                    Number(room.id) ===
                    Number(createdRoom.id)
            )
        ) {
            forumRooms.push(
                createdRoom
            );

            forumRooms.sort(
                (a, b) => {
                    if (
                        a.roomType ===
                        "GLOBAL"
                    ) {
                        return -1;
                    }

                    if (
                        b.roomType ===
                        "GLOBAL"
                    ) {
                        return 1;
                    }

                    return (
                        Number(b.id) -
                        Number(a.id)
                    );
                }
            );
        }

        renderForumRoomsDemo();

        closeForumCreateRoomModalDemo();

        if (createdRoom) {
            joinForumRoomDemo(
                createdRoom,
                password
            );
        }
    } catch (error) {
        console.error(
            "Create forum room error:",
            error
        );

        setForumInlineMessageDemo(
            messageElement,
            error.message ||
                "Không thể tạo phòng.",
            "error"
        );
    } finally {
        forumCreatingRoom = false;

        if (button) {
            button.disabled = false;
            button.textContent =
                "Tạo phòng";
        }
    }
}


/*
=====================================================
Password Modal
=====================================================
*/

function openForumPasswordModalDemo(
    room
) {
    forumPendingPasswordRoom =
        room;

    const modal =
        document.getElementById(
            "forumPasswordModal"
        );

    const roomName =
        document.getElementById(
            "forumPasswordRoomName"
        );

    const passwordInput =
        document.getElementById(
            "forumRoomPasswordInput"
        );

    if (roomName) {
        roomName.textContent =
            room.name ||
            "phòng chat";
    }

    if (passwordInput) {
        passwordInput.value = "";
    }

    setForumInlineMessageDemo(
        document.getElementById(
            "forumPasswordMessage"
        ),
        "",
        ""
    );

    modal?.classList.remove(
        "hidden"
    );

    passwordInput?.focus();
}


function closeForumPasswordModalDemo() {
    document
        .getElementById(
            "forumPasswordModal"
        )
        ?.classList.add(
            "hidden"
        );

    forumPendingPasswordRoom =
        null;

    const passwordInput =
        document.getElementById(
            "forumRoomPasswordInput"
        );

    if (passwordInput) {
        passwordInput.value = "";
    }

    setForumInlineMessageDemo(
        document.getElementById(
            "forumPasswordMessage"
        ),
        "",
        ""
    );
}


function submitForumPasswordDemo() {
    const room =
        forumPendingPasswordRoom;

    const password =
        document
            .getElementById(
                "forumRoomPasswordInput"
            )
            ?.value ||
        "";

    if (!room) {
        closeForumPasswordModalDemo();
        return;
    }

    if (!password.trim()) {
        setForumInlineMessageDemo(
            document.getElementById(
                "forumPasswordMessage"
            ),
            "Vui lòng nhập mật khẩu phòng.",
            "error"
        );

        return;
    }

    joinForumRoomDemo(
        room,
        password
    );
}


/*
=====================================================
Socket.IO
=====================================================
*/

function connectForumSocketDemo() {
    if (
        typeof io !==
        "function"
    ) {
        setForumConnectionStatusDemo(
            "disconnected",
            "Thiếu Socket.IO"
        );

        console.error(
            "Socket.IO client is not loaded."
        );

        return;
    }

    const token =
        getForumTokenDemo();

    if (!token) {
        logoutDemo();
        return;
    }

    if (forumSocket) {
        forumSocket.disconnect();
    }

    setForumConnectionStatusDemo(
        "connecting",
        "Đang kết nối..."
    );

    forumSocket =
        io(
            `${API_BASE_URL}/forum`,
            {
                auth: {
                    token,
                },

                transports: [
                    "websocket",
                    "polling"
                ],

                reconnection: true,

                reconnectionAttempts:
                    Infinity,

                reconnectionDelay:
                    1000,

                reconnectionDelayMax:
                    5000,
            }
        );


    forumSocket.on(
        "connect",
        () => {
            setForumConnectionStatusDemo(
                "connected",
                "Đã kết nối"
            );

            loadForumRoomsDemo({
                autoJoinGlobal:
                    !forumCurrentRoom,
            });
        }
    );


    forumSocket.on(
        "disconnect",
        reason => {
            console.warn(
                "Forum socket disconnected:",
                reason
            );

            setForumConnectionStatusDemo(
                "disconnected",
                "Mất kết nối"
            );

            const input =
                document.getElementById(
                    "forumMessageInput"
                );

            const button =
                document.getElementById(
                    "forumSendMessageButton"
                );

            if (input) {
                input.disabled = true;
            }

            if (button) {
                button.disabled = true;
            }
        }
    );


    forumSocket.on(
        "connect_error",
        error => {
            console.error(
                "Forum socket connection error:",
                error
            );

            setForumConnectionStatusDemo(
                "disconnected",
                "Không thể kết nối"
            );

            setForumInlineMessageDemo(
                document.getElementById(
                    "forumChatMessage"
                ),
                error?.message ||
                    "Không thể kết nối đến Diễn đàn.",
                "error"
            );
        }
    );


    forumSocket.on(
        "forum:new-message",
        payload => {
            appendForumMessageDemo(
                payload?.message
            );
        }
    );


    forumSocket.on(
        "forum:room-created",
        payload => {
            const room =
                payload?.room;

            if (!room) {
                return;
            }

            const index =
                forumRooms.findIndex(
                    item =>
                        Number(item.id) ===
                        Number(room.id)
                );

            if (index >= 0) {
                forumRooms[index] =
                    room;
            } else {
                forumRooms.push(
                    room
                );
            }

            forumRooms.sort(
                (a, b) => {
                    if (
                        a.roomType ===
                        "GLOBAL"
                    ) {
                        return -1;
                    }

                    if (
                        b.roomType ===
                        "GLOBAL"
                    ) {
                        return 1;
                    }

                    return (
                        Number(b.id) -
                        Number(a.id)
                    );
                }
            );

            renderForumRoomsDemo();
        }
    );
}


/*
=====================================================
Bind Forum Events
=====================================================
*/

function bindForumPageEventsDemo() {
    document
        .getElementById(
            "forumOpenCreateRoomButton"
        )
        ?.addEventListener(
            "click",
            openForumCreateRoomModalDemo
        );


    document
        .getElementById(
            "forumCancelCreateRoomButton"
        )
        ?.addEventListener(
            "click",
            closeForumCreateRoomModalDemo
        );


    document
        .getElementById(
            "forumSubmitCreateRoomButton"
        )
        ?.addEventListener(
            "click",
            submitForumCreateRoomDemo
        );


    document
        .getElementById(
            "forumCancelPasswordButton"
        )
        ?.addEventListener(
            "click",
            closeForumPasswordModalDemo
        );


    document
        .getElementById(
            "forumSubmitPasswordButton"
        )
        ?.addEventListener(
            "click",
            submitForumPasswordDemo
        );


    document
        .getElementById(
            "forumRefreshRoomsButton"
        )
        ?.addEventListener(
            "click",
            () => {
                loadForumRoomsDemo({
                    autoJoinGlobal:
                        false,
                });
            }
        );


    document
        .getElementById(
            "forumMessageForm"
        )
        ?.addEventListener(
            "submit",
            event => {
                event.preventDefault();

                sendForumMessageDemo();
            }
        );


    document
        .getElementById(
            "forumMessageInput"
        )
        ?.addEventListener(
            "keydown",
            event => {
                if (
                    event.key ===
                        "Enter" &&
                    !event.shiftKey
                ) {
                    event.preventDefault();

                    sendForumMessageDemo();
                }
            }
        );


    document
        .getElementById(
            "forumRoomPasswordInput"
        )
        ?.addEventListener(
            "keydown",
            event => {
                if (
                    event.key ===
                    "Enter"
                ) {
                    event.preventDefault();

                    submitForumPasswordDemo();
                }
            }
        );


    document
        .getElementById(
            "forumCreateRoomPassword"
        )
        ?.addEventListener(
            "keydown",
            event => {
                if (
                    event.key ===
                    "Enter"
                ) {
                    event.preventDefault();

                    submitForumCreateRoomDemo();
                }
            }
        );


    document
        .getElementById(
            "forumCreateRoomModal"
        )
        ?.addEventListener(
            "click",
            event => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    closeForumCreateRoomModalDemo();
                }
            }
        );


    document
        .getElementById(
            "forumPasswordModal"
        )
        ?.addEventListener(
            "click",
            event => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    closeForumPasswordModalDemo();
                }
            }
        );
}


/*
=====================================================
Initialize Forum Page
=====================================================
*/

function initializeForumPage() {
    if (
        !isForumPageDemo() ||
        forumPageInitialized
    ) {
        return;
    }

    forumPageInitialized = true;

    bindForumPageEventsDemo();

    setForumCurrentRoomDemo(
        null
    );

    connectForumSocketDemo();
}

/*
 * =========================================================
 * STUDENT SURVEY MODULE
 * =========================================================
 */

let studentSurveyListApi = [];
let currentStudentSurveyApi = null;
let studentSurveySubmitInProgress = false;


/*
 * =========================================================
 * HÀM GỌI API KHẢO SÁT HỌC VIÊN
 * =========================================================
 */

async function studentSurveyApiRequestDemo(
    path,
    options = {}
) {
    const token =
        localStorage.getItem(
            "accessToken"
        );

    if (!token) {
        logoutDemo();

        throw new Error(
            "Phiên đăng nhập không hợp lệ."
        );
    }

    const requestHeaders = {
        Authorization:
            `Bearer ${token}`,

        ...(options.headers || {})
    };

    if (
        options.body !== undefined &&
        options.body !== null
    ) {
        requestHeaders["Content-Type"] =
            "application/json";
    }

    const response = await fetch(
        `${API_BASE_URL}${path}`,
        {
            ...options,
            headers:
                requestHeaders
        }
    );

    let result = null;

    try {
        result =
            await response.json();
    } catch (error) {
        result = null;
    }

    if (response.status === 401) {
        logoutDemo();

        throw new Error(
            "Phiên đăng nhập đã hết hạn."
        );
    }

    if (response.status === 403) {
        const forbiddenError =
            new Error(
                result?.error?.message ||
                "Bạn không có quyền sử dụng chức năng khảo sát."
            );

        forbiddenError.status =
            response.status;

        forbiddenError.code =
            result?.error?.code ||
            "FORBIDDEN";

        throw forbiddenError;
    }

    if (
        !response.ok ||
        result?.success !== true
    ) {
        const apiError =
            new Error(
                result?.error?.message ||
                "Không thể xử lý yêu cầu khảo sát."
            );

        apiError.status =
            response.status;

        apiError.code =
            result?.error?.code ||
            null;

        apiError.details =
            result?.error?.details ||
            null;

        throw apiError;
    }

    return result;
}


/*
 * =========================================================
 * ESCAPE HTML RIÊNG CHO SURVEY
 *
 * Nếu app.js đã có escapeHtml(), khối khảo sát vẫn có thể
 * dùng hàm riêng này để tránh phụ thuộc vị trí khai báo.
 * =========================================================
 */

function escapeSurveyHtmlDemo(
    value
) {
    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


/*
 * =========================================================
 * FORMAT NGÀY GIỜ NỘP KHẢO SÁT
 * =========================================================
 */

function formatSurveyDateTimeDemo(
    value
) {
    if (!value) {
        return "Không xác định";
    }

    /*
     * Backend đang trả datetime SQL dưới dạng chuỗi ISO.
     * parseSqlLocalDateTime() đã có sẵn trong app.js.
     */
    let date = null;

    if (
        typeof parseSqlLocalDateTime ===
        "function"
    ) {
        date =
            parseSqlLocalDateTime(
                value
            );
    }

    if (
        !date ||
        Number.isNaN(
            date.getTime()
        )
    ) {
        date =
            new Date(value);
    }

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Không xác định";
    }

    return date.toLocaleString(
        "vi-VN"
    );
}


/*
 * =========================================================
 * NHÃN TRẠNG THÁI KHẢO SÁT
 * =========================================================
 */

function getStudentSurveyStatusDemo(
    survey
) {
    if (survey?.hasSubmitted) {
        return {
            label:
                "Đã hoàn thành",

            className:
                "survey-status-submitted"
        };
    }

    if (
        survey?.status ===
        "OPEN"
    ) {
        return {
            label:
                "Đang mở",

            className:
                "survey-status-open"
        };
    }

    if (
        survey?.status ===
        "CLOSED"
    ) {
        return {
            label:
                "Đã đóng",

            className:
                "survey-status-closed"
        };
    }

    return {
        label:
            "Chưa mở",

        className:
            "survey-status-draft"
    };
}


/*
 * =========================================================
 * HIỂN THỊ DANH SÁCH KHẢO SÁT
 * =========================================================
 */

function renderStudentSurveyListDemo(
    surveys
) {
    const container =
        document.getElementById(
            "studentSurveyList"
        );

    if (!container) {
        return;
    }

    const normalizedSurveys =
        Array.isArray(surveys)
            ? surveys
            : [];

    if (
        normalizedSurveys.length === 0
    ) {
        container.innerHTML = `
            <div class="survey-empty-card">
                <div class="survey-empty-icon">
                    📝
                </div>

                <h3>
                    Chưa có khảo sát
                </h3>

                <p>
                    Hiện chưa có khảo sát nào
                    dành cho bạn.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        normalizedSurveys
            .map(survey => {
                const status =
                    getStudentSurveyStatusDemo(
                        survey
                    );

                const submittedTime =
                    survey.response
                        ?.submittedAt
                        ? formatSurveyDateTimeDemo(
                            survey.response
                                .submittedAt
                        )
                        : null;

                let buttonLabel =
                    "Xem khảo sát";

                if (
                    survey.canSubmit
                ) {
                    buttonLabel =
                        "Làm khảo sát";
                } else if (
                    survey.hasSubmitted
                ) {
                    buttonLabel =
                        "Xem bài đã gửi";
                } else if (
                    survey.status ===
                    "CLOSED"
                ) {
                    buttonLabel =
                        "Xem nội dung";
                }

                return `
                    <article
                        class="
                            student-survey-card
                            ${
                                survey.hasSubmitted
                                    ? "student-survey-card-submitted"
                                    : ""
                            }
                            ${
                                survey.status === "CLOSED" &&
                                !survey.hasSubmitted
                                    ? "student-survey-card-closed"
                                    : ""
                            }
                        "
                    >
                        <div class="student-survey-card-header">
                            <div class="student-survey-card-icon">
                                📝
                            </div>

                            <span
                                class="
                                    survey-status-badge
                                    ${status.className}
                                "
                            >
                                ${escapeSurveyHtmlDemo(
                                    status.label
                                )}
                            </span>
                        </div>

                        <div class="student-survey-card-content">
                            <p class="student-survey-case-label">
                                CASE STUDY
                            </p>

                            <h3>
                                ${escapeSurveyHtmlDemo(
                                    survey.title ||
                                    "Khảo sát"
                                )}
                            </h3>

                            <p class="student-survey-description">
                                ${escapeSurveyHtmlDemo(
                                    survey.description ||
                                    ""
                                )}
                            </p>

                            <div class="student-survey-meta">
                                <span>
                                    ${
                                        Number(
                                            survey.questionCount
                                        ) || 0
                                    }
                                    hạng mục
                                </span>

                                ${
                                    submittedTime
                                        ? `
                                            <span>
                                                Đã gửi:
                                                ${escapeSurveyHtmlDemo(
                                                    submittedTime
                                                )}
                                            </span>
                                        `
                                        : ""
                                }
                            </div>
                        </div>

                        <button
                            type="button"
                            class="
                                student-survey-open-button
                                ${
                                    survey.canSubmit
                                        ? "student-survey-open-button-primary"
                                        : ""
                                }
                            "
                            onclick="openStudentSurveyDemo(
                                ${Number(survey.id)}
                            )"
                        >
                            ${escapeSurveyHtmlDemo(
                                buttonLabel
                            )}
                        </button>
                    </article>
                `;
            })
            .join("");
}


/*
 * =========================================================
 * TẢI DANH SÁCH KHẢO SÁT
 * =========================================================
 */

async function loadStudentSurveysDemo() {
    const container =
        document.getElementById(
            "studentSurveyList"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="survey-loading-card">
            Đang tải danh sách khảo sát...
        </div>
    `;

    try {
        const result =
            await studentSurveyApiRequestDemo(
                "/api/surveys"
            );

        studentSurveyListApi =
            Array.isArray(
                result.data?.surveys
            )
                ? result.data.surveys
                : [];

        renderStudentSurveyListDemo(
            studentSurveyListApi
        );
    } catch (error) {
        console.error(
            "Load student surveys error:",
            error
        );

        container.innerHTML = `
            <div class="survey-error-card">
                <h3>
                    Không thể tải khảo sát
                </h3>

                <p>
                    ${escapeSurveyHtmlDemo(
                        error.message ||
                        "Vui lòng thử lại."
                    )}
                </p>

                <button
                    type="button"
                    class="student-survey-retry-button"
                    onclick="loadStudentSurveysDemo()"
                >
                    Thử lại
                </button>
            </div>
        `;
    }
}


/*
 * =========================================================
 * HIỂN THỊ TRẠNG THÁI TRÊN TRANG CHI TIẾT
 * =========================================================
 */

function renderStudentSurveyDetailStatusDemo(
    survey
) {
    const statusElement =
        document.getElementById(
            "surveyDetailStatus"
        );

    if (!statusElement) {
        return;
    }

    const status =
        getStudentSurveyStatusDemo(
            survey
        );

    statusElement.className =
        `survey-status-badge ${status.className}`;

    statusElement.innerText =
        status.label;
}


/*
 * =========================================================
 * TÌM CÂU TRẢ LỜI ĐÃ NỘP THEO QUESTION ID
 * =========================================================
 */

function getStudentSurveyExistingAnswerDemo(
    survey,
    questionId
) {
    const answers =
        Array.isArray(
            survey?.response?.answers
        )
            ? survey.response.answers
            : [];

    return (
        answers.find(
            answer =>
                Number(
                    answer.questionId
                ) ===
                Number(questionId)
        ) ||
        null
    );
}


/*
 * =========================================================
 * RENDER 5 HẠNG MỤC KHẢO SÁT
 * =========================================================
 */

function renderStudentSurveyQuestionsDemo(
    survey
) {
    const container =
        document.getElementById(
            "studentSurveyQuestions"
        );

    if (!container) {
        return;
    }

    const questions =
        Array.isArray(
            survey?.questions
        )
            ? survey.questions
            : [];

    if (questions.length === 0) {
        container.innerHTML = `
            <div class="survey-empty-card">
                Khảo sát chưa có hạng mục nào.
            </div>
        `;

        return;
    }

    const canEdit =
        survey.canSubmit === true;

    container.innerHTML =
        questions
            .map(question => {
                const existingAnswer =
                    getStudentSurveyExistingAnswerDemo(
                        survey,
                        question.id
                    );

                const yesAnswer =
                    existingAnswer
                        ?.yesAnswer ||
                    "";

                const noAnswer =
                    existingAnswer
                        ?.noAnswer ||
                    "";

                return `
                    <article
                        class="student-survey-question-card"
                        id="surveyQuestionCard-${
                            Number(question.id)
                        }"
                    >
                        <div class="student-survey-question-heading">
                            <div class="student-survey-question-number">
                                ${
                                    Number(
                                        question.displayOrder
                                    ) || ""
                                }
                            </div>

                            <div>
                                <h3>
                                    ${escapeSurveyHtmlDemo(
                                        question.title ||
                                        "Hạng mục"
                                    )}
                                </h3>

                                <p>
                                    ${escapeSurveyHtmlDemo(
                                        question.questionText ||
                                        ""
                                    )}
                                </p>
                            </div>
                        </div>

                        <div class="student-survey-answer-grid">

                            <div class="student-survey-answer-field student-survey-answer-yes">
                                <label
                                    for="surveyYesAnswer-${
                                        Number(question.id)
                                    }"
                                >
                                    ${escapeSurveyHtmlDemo(
                                        question.yesLabel ||
                                        "ĐÚNG / YES – Khi nào?"
                                    )}
                                </label>

                                <textarea
                                    id="surveyYesAnswer-${
                                        Number(question.id)
                                    }"
                                    class="student-survey-answer-textarea"
                                    data-question-id="${
                                        Number(question.id)
                                    }"
                                    data-answer-type="yes"
                                    maxlength="4000"
                                    placeholder="Nhập suy nghĩ của bạn..."
                                    ${
                                        canEdit
                                            ? ""
                                            : "disabled"
                                    }
                                >${escapeSurveyHtmlDemo(
                                    yesAnswer
                                )}</textarea>

                                <small>
                                    Tối đa 4.000 ký tự
                                </small>
                            </div>


                            <div class="student-survey-answer-field student-survey-answer-no">
                                <label
                                    for="surveyNoAnswer-${
                                        Number(question.id)
                                    }"
                                >
                                    ${escapeSurveyHtmlDemo(
                                        question.noLabel ||
                                        "SAI / NO – Khi nào?"
                                    )}
                                </label>

                                <textarea
                                    id="surveyNoAnswer-${
                                        Number(question.id)
                                    }"
                                    class="student-survey-answer-textarea"
                                    data-question-id="${
                                        Number(question.id)
                                    }"
                                    data-answer-type="no"
                                    maxlength="4000"
                                    placeholder="Nhập suy nghĩ của bạn..."
                                    ${
                                        canEdit
                                            ? ""
                                            : "disabled"
                                    }
                                >${escapeSurveyHtmlDemo(
                                    noAnswer
                                )}</textarea>

                                <small>
                                    Tối đa 4.000 ký tự
                                </small>
                            </div>

                        </div>

                        <p
                            id="surveyQuestionError-${
                                Number(question.id)
                            }"
                            class="student-survey-question-error hidden"
                        ></p>
                    </article>
                `;
            })
            .join("");
}


/*
 * =========================================================
 * HIỂN THỊ THÔNG BÁO ĐÃ NỘP
 * =========================================================
 */

function renderStudentSurveySubmittedNoticeDemo(
    survey
) {
    const notice =
        document.getElementById(
            "surveySubmittedNotice"
        );

    const timeElement =
        document.getElementById(
            "surveySubmittedTime"
        );

    if (!notice) {
        return;
    }

    if (!survey?.hasSubmitted) {
        notice.classList.add(
            "hidden"
        );

        return;
    }

    notice.classList.remove(
        "hidden"
    );

    if (timeElement) {
        const submittedAt =
            survey.response
                ?.submittedAt;

        timeElement.innerText =
            submittedAt
                ? `Đã gửi lúc ${formatSurveyDateTimeDemo(
                    submittedAt
                )}.`
                : "Bài khảo sát đã được ghi nhận.";
    }
}


/*
 * =========================================================
 * HIỂN THỊ KHU VỰC SUBMIT
 * =========================================================
 */

function renderStudentSurveySubmitAreaDemo(
    survey
) {
    const submitArea =
        document.getElementById(
            "studentSurveySubmitArea"
        );

    if (!submitArea) {
        return;
    }

    /*
     * Luôn khôi phục cấu trúc mặc định trước khi
     * hiển thị trạng thái của khảo sát mới.
     */
    submitArea.innerHTML = `
        <div class="survey-submit-note">
            <strong>Lưu ý:</strong>
            Bạn cần nhập đầy đủ cả trường hợp
            <strong>ĐÚNG / YES</strong>
            và
            <strong>SAI / NO</strong>
            cho cả 5 hạng mục.
        </div>

        <button
            id="studentSurveySubmitButton"
            type="submit"
            class="survey-submit-button"
        >
            Gửi khảo sát
        </button>

        <p
            id="studentSurveyMessage"
            class="survey-form-message"
        ></p>
    `;

    if (survey?.canSubmit) {
        submitArea.classList.remove(
            "hidden"
        );

        return;
    }

    if (
        survey?.status === "CLOSED" &&
        !survey?.hasSubmitted
    ) {
        submitArea.classList.remove(
            "hidden"
        );

        submitArea.innerHTML = `
            <div class="survey-closed-notice">
                <strong>
                    Khảo sát đã đóng
                </strong>

                <p>
                    Bạn có thể xem nội dung khảo sát,
                    nhưng hiện không thể gửi câu trả lời.
                </p>
            </div>
        `;

        return;
    }

    submitArea.classList.add(
        "hidden"
    );
}


/*
 * =========================================================
 * MỞ CHI TIẾT KHẢO SÁT
 * =========================================================
 */

async function openStudentSurveyDemo(
    surveyId
) {
    const normalizedSurveyId =
        Number(surveyId);

    if (
        !Number.isInteger(
            normalizedSurveyId
        ) ||
        normalizedSurveyId <= 0
    ) {
        return;
    }

    const listSection =
        document.getElementById(
            "surveyListSection"
        );

    const detailSection =
        document.getElementById(
            "surveyDetailSection"
        );

    const questionContainer =
        document.getElementById(
            "studentSurveyQuestions"
        );

    if (
        !listSection ||
        !detailSection
    ) {
        return;
    }

    listSection.classList.add(
        "hidden"
    );

    detailSection.classList.remove(
        "hidden"
    );

    if (questionContainer) {
        questionContainer.innerHTML = `
            <div class="survey-loading-card">
                Đang tải nội dung khảo sát...
            </div>
        `;
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    try {
        const result =
            await studentSurveyApiRequestDemo(
                `/api/surveys/${normalizedSurveyId}`
            );

        const survey =
            result.data?.survey;

        if (!survey) {
            throw new Error(
                "Không tìm thấy dữ liệu khảo sát."
            );
        }

        currentStudentSurveyApi =
            survey;

        const titleElement =
            document.getElementById(
                "surveyDetailTitle"
            );

        const descriptionElement =
            document.getElementById(
                "surveyDetailDescription"
            );

        if (titleElement) {
            titleElement.innerText =
                survey.title ||
                "Khảo sát";
        }

        if (descriptionElement) {
            descriptionElement.innerText =
                survey.description ||
                "";
        }

        renderStudentSurveyDetailStatusDemo(
            survey
        );

        renderStudentSurveySubmittedNoticeDemo(
            survey
        );

        renderStudentSurveyQuestionsDemo(
            survey
        );

        renderStudentSurveySubmitAreaDemo(
            survey
        );
    } catch (error) {
        console.error(
            "Open student survey error:",
            error
        );

        currentStudentSurveyApi =
            null;

        if (questionContainer) {
            questionContainer.innerHTML = `
                <div class="survey-error-card">
                    <h3>
                        Không thể tải khảo sát
                    </h3>

                    <p>
                        ${escapeSurveyHtmlDemo(
                            error.message ||
                            "Vui lòng thử lại."
                        )}
                    </p>

                    <button
                        type="button"
                        class="student-survey-retry-button"
                        onclick="openStudentSurveyDemo(
                            ${normalizedSurveyId}
                        )"
                    >
                        Thử lại
                    </button>
                </div>
            `;
        }
    }
}


/*
 * =========================================================
 * QUAY VỀ DANH SÁCH
 * =========================================================
 */

function backToSurveyListDemo() {
    const listSection =
        document.getElementById(
            "surveyListSection"
        );

    const detailSection =
        document.getElementById(
            "surveyDetailSection"
        );

    if (listSection) {
        listSection.classList.remove(
            "hidden"
        );
    }

    if (detailSection) {
        detailSection.classList.add(
            "hidden"
        );
    }

    currentStudentSurveyApi =
        null;

    loadStudentSurveysDemo();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/*
 * =========================================================
 * XÓA THÔNG BÁO LỖI CỦA TỪNG HẠNG MỤC
 * =========================================================
 */

function clearStudentSurveyValidationDemo() {
    document
        .querySelectorAll(
            ".student-survey-question-card"
        )
        .forEach(card => {
            card.classList.remove(
                "student-survey-question-card-error"
            );
        });

    document
        .querySelectorAll(
            ".student-survey-question-error"
        )
        .forEach(element => {
            element.classList.add(
                "hidden"
            );

            element.innerText = "";
        });
}


/*
 * =========================================================
 * LẤY VÀ VALIDATE 10 Ô CÂU TRẢ LỜI
 * =========================================================
 */

function collectStudentSurveyAnswersDemo() {
    const survey =
        currentStudentSurveyApi;

    const questions =
        Array.isArray(
            survey?.questions
        )
            ? survey.questions
            : [];

    if (questions.length === 0) {
        return {
            success: false,

            message:
                "Khảo sát chưa có hạng mục nào."
        };
    }

    clearStudentSurveyValidationDemo();

    const answers = [];

    for (const question of questions) {
        const questionId =
            Number(question.id);

        const yesElement =
            document.getElementById(
                `surveyYesAnswer-${questionId}`
            );

        const noElement =
            document.getElementById(
                `surveyNoAnswer-${questionId}`
            );

        const yesAnswer =
            String(
                yesElement?.value ||
                ""
            ).trim();

        const noAnswer =
            String(
                noElement?.value ||
                ""
            ).trim();

        if (
            !yesAnswer ||
            !noAnswer
        ) {
            const card =
                document.getElementById(
                    `surveyQuestionCard-${questionId}`
                );

            const errorElement =
                document.getElementById(
                    `surveyQuestionError-${questionId}`
                );

            if (card) {
                card.classList.add(
                    "student-survey-question-card-error"
                );
            }

            if (errorElement) {
                errorElement.classList.remove(
                    "hidden"
                );

                if (
                    !yesAnswer &&
                    !noAnswer
                ) {
                    errorElement.innerText =
                        "Vui lòng nhập cả trường hợp ĐÚNG / YES và SAI / NO.";
                } else if (
                    !yesAnswer
                ) {
                    errorElement.innerText =
                        "Vui lòng nhập trường hợp ĐÚNG / YES.";
                } else {
                    errorElement.innerText =
                        "Vui lòng nhập trường hợp SAI / NO.";
                }
            }

            const focusElement =
                !yesAnswer
                    ? yesElement
                    : noElement;

            if (focusElement) {
                focusElement.focus();

                focusElement.scrollIntoView({
                    behavior:
                        "smooth",

                    block:
                        "center"
                });
            }

            return {
                success: false,

                message:
                    `Bạn chưa hoàn thành hạng mục "${question.title}".`
            };
        }

        if (
            yesAnswer.length > 4000 ||
            noAnswer.length > 4000
        ) {
            return {
                success: false,

                message:
                    `Câu trả lời ở hạng mục "${question.title}" vượt quá 4.000 ký tự.`
            };
        }

        answers.push({
            questionId,
            yesAnswer,
            noAnswer
        });
    }

    return {
        success: true,
        answers
    };
}


/*
 * =========================================================
 * KHÓA / MỞ FORM TRONG LÚC SUBMIT
 * =========================================================
 */

function setStudentSurveyFormBusyDemo(
    isBusy
) {
    const submitButton =
        document.getElementById(
            "studentSurveySubmitButton"
        );

    document
        .querySelectorAll(
            ".student-survey-answer-textarea"
        )
        .forEach(textarea => {
            textarea.disabled =
                Boolean(isBusy);
        });

    if (submitButton) {
        submitButton.disabled =
            Boolean(isBusy);

        submitButton.innerText =
            isBusy
                ? "Đang gửi khảo sát..."
                : "Gửi khảo sát";
    }
}


/*
 * =========================================================
 * NỘP KHẢO SÁT
 * =========================================================
 */

async function submitStudentSurveyDemo(
    event
) {
    event.preventDefault();

    if (
        studentSurveySubmitInProgress
    ) {
        return;
    }

    const survey =
        currentStudentSurveyApi;

    const message =
        document.getElementById(
            "studentSurveyMessage"
        );

    if (!survey) {
        if (message) {
            message.className =
                "survey-form-message error";

            message.innerText =
                "Không tìm thấy khảo sát cần gửi.";
        }

        return;
    }

    if (!survey.canSubmit) {
        if (message) {
            message.className =
                "survey-form-message error";

            message.innerText =
                survey.hasSubmitted
                    ? "Bạn đã gửi khảo sát này trước đó."
                    : "Khảo sát hiện đã đóng.";
        }

        return;
    }

    const validation =
        collectStudentSurveyAnswersDemo();

    if (!validation.success) {
        if (message) {
            message.className =
                "survey-form-message error";

            message.innerText =
                validation.message;
        }

        return;
    }

    const confirmed =
        confirm(
            "Bạn có chắc muốn gửi khảo sát?\n\n" +
            "Sau khi gửi, bạn sẽ không thể chỉnh sửa hoặc gửi lại."
        );

    if (!confirmed) {
        return;
    }

    studentSurveySubmitInProgress =
        true;

    setStudentSurveyFormBusyDemo(
        true
    );

    if (message) {
        message.className =
            "survey-form-message info";

        message.innerText =
            "Đang gửi khảo sát...";
    }

    try {
        const result =
            await studentSurveyApiRequestDemo(
                `/api/surveys/${Number(
                    survey.id
                )}/submit`,
                {
                    method:
                        "POST",

                    body:
                        JSON.stringify({
                            answers:
                                validation.answers
                        })
                }
            );

        if (message) {
            message.className =
                "survey-form-message success";

            message.innerText =
                result.message ||
                "Bạn đã gửi khảo sát thành công.";
        }

        /*
         * Tải lại chi tiết từ Backend để:
         * - Khóa form.
         * - Hiển thị bài vừa nộp.
         * - Hiển thị thời gian gửi.
         */
        await openStudentSurveyDemo(
            survey.id
        );
    } catch (error) {
        console.error(
            "Submit student survey error:",
            error
        );

        if (message) {
            message.className =
                "survey-form-message error";

            if (
                error.code ===
                "SURVEY_ALREADY_SUBMITTED"
            ) {
                message.innerText =
                    "Bạn đã gửi khảo sát này trước đó.";

                await openStudentSurveyDemo(
                    survey.id
                );

                return;
            }

            if (
                error.code ===
                "SURVEY_NOT_OPEN"
            ) {
                message.innerText =
                    "Khảo sát vừa được đóng. Bạn không thể gửi bài.";

                await openStudentSurveyDemo(
                    survey.id
                );

                return;
            }

            message.innerText =
                error.message ||
                "Không thể gửi khảo sát. Vui lòng thử lại.";
        }
    } finally {
        studentSurveySubmitInProgress =
            false;

        /*
         * Chỉ mở lại form nếu khảo sát vẫn còn được phép gửi.
         */
        if (
            currentStudentSurveyApi
                ?.canSubmit
        ) {
            setStudentSurveyFormBusyDemo(
                false
            );
        }
    }
}


/*
 * =========================================================
 * KHỞI TẠO TRANG KHẢO SÁT
 * =========================================================
 */

function initializeStudentSurveyPageDemo() {
    const surveyList =
        document.getElementById(
            "studentSurveyList"
        );

    if (!surveyList) {
        return;
    }

    const currentUser =
        JSON.parse(
            localStorage.getItem(
                "currentUser"
            ) ||
            "null"
        );

    if (!currentUser) {
        logoutDemo();
        return;
    }

    if (
        String(
            currentUser.role ||
            ""
        ).toLowerCase() !==
        "student"
    ) {
        window.location.href =
            "admin-dashboard.html";

        return;
    }

    loadStudentSurveysDemo();
}


/*
 * Chạy sau khi HTML đã sẵn sàng.
 */
if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initializeStudentSurveyPageDemo
    );
} else {
    initializeStudentSurveyPageDemo();
}

/*
 * =========================================================
 * ADMIN SURVEY MODULE
 * =========================================================
 */

let adminSurveyListApi = [];
let currentAdminSurveyApi = null;
let filteredAdminSurveyResponsesApi = [];
let adminSurveyRequestInProgress = false;


/*
 * =========================================================
 * GỌI API ADMIN SURVEY
 * =========================================================
 */

async function adminSurveyApiRequestDemo(
    path,
    options = {}
) {
    const token =
        localStorage.getItem(
            "accessToken"
        );

    if (!token) {
        logoutDemo();

        throw new Error(
            "Phiên đăng nhập không hợp lệ."
        );
    }

    const headers = {
        Authorization:
            `Bearer ${token}`,

        ...(options.headers || {})
    };

    if (
        options.body !== undefined &&
        options.body !== null
    ) {
        headers["Content-Type"] =
            "application/json";
    }

    const response = await fetch(
        `${API_BASE_URL}${path}`,
        {
            ...options,
            headers
        }
    );

    let result = null;

    try {
        result =
            await response.json();
    } catch (error) {
        result = null;
    }

    if (response.status === 401) {
        logoutDemo();

        throw new Error(
            "Phiên đăng nhập đã hết hạn."
        );
    }

    if (response.status === 403) {
        const forbiddenError =
            new Error(
                result?.error?.message ||
                "Bạn không có quyền quản lý khảo sát."
            );

        forbiddenError.status =
            403;

        forbiddenError.code =
            result?.error?.code ||
            "FORBIDDEN";

        throw forbiddenError;
    }

    if (
        !response.ok ||
        result?.success !== true
    ) {
        const apiError =
            new Error(
                result?.error?.message ||
                "Không thể xử lý yêu cầu quản lý khảo sát."
            );

        apiError.status =
            response.status;

        apiError.code =
            result?.error?.code ||
            null;

        apiError.details =
            result?.error?.details ||
            null;

        throw apiError;
    }

    return result;
}


/*
 * =========================================================
 * HIỂN THỊ MESSAGE THAO TÁC ADMIN
 * =========================================================
 */

function setAdminSurveyActionMessageDemo(
    message,
    type = ""
) {
    const element =
        document.getElementById(
            "adminSurveyActionMessage"
        );

    if (!element) {
        return;
    }

    element.innerText =
        message || "";

    element.className =
        "survey-form-message";

    if (type) {
        element.classList.add(
            type
        );
    }
}


/*
 * =========================================================
 * FORMAT TRẠNG THÁI KHẢO SÁT
 * =========================================================
 */

function getAdminSurveyStatusDemo(
    status
) {
    const normalizedStatus =
        String(status || "")
            .trim()
            .toUpperCase();

    if (
        normalizedStatus ===
        "OPEN"
    ) {
        return {
            label:
                "Đang mở",

            className:
                "survey-status-open"
        };
    }

    if (
        normalizedStatus ===
        "CLOSED"
    ) {
        return {
            label:
                "Đã đóng",

            className:
                "survey-status-closed"
        };
    }

    return {
        label:
            "Bản nháp",

        className:
            "survey-status-draft"
    };
}


/*
 * =========================================================
 * RENDER DANH SÁCH KHẢO SÁT ADMIN
 * =========================================================
 */

function renderAdminSurveyListDemo(
    surveys
) {
    const container =
        document.getElementById(
            "adminSurveyList"
        );

    if (!container) {
        return;
    }

    const normalizedSurveys =
        Array.isArray(surveys)
            ? surveys
            : [];

    if (
        normalizedSurveys.length === 0
    ) {
        container.innerHTML = `
            <div class="survey-empty-card">
                <div class="survey-empty-icon">
                    📝
                </div>

                <h3>
                    Chưa có khảo sát
                </h3>

                <p>
                    Mùa hiện tại chưa có khảo sát nào.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        normalizedSurveys
            .map(survey => {
                const status =
                    getAdminSurveyStatusDemo(
                        survey.status
                    );

                const totalStudents =
                    Number(
                        survey.totalStudents
                    ) || 0;

                const responseCount =
                    Number(
                        survey.responseCount
                    ) || 0;

                const remainingStudents =
                    Number(
                        survey.remainingStudents
                    ) || 0;

                return `
                    <article class="admin-survey-list-card">

                        <div class="admin-survey-list-card-header">

                            <div class="admin-survey-list-card-icon">
                                📝
                            </div>

                            <span
                                class="
                                    survey-status-badge
                                    ${status.className}
                                "
                            >
                                ${escapeSurveyHtmlDemo(
                                    status.label
                                )}
                            </span>

                        </div>


                        <div class="admin-survey-list-card-content">

                            <p class="admin-survey-case-label">
                                CASE STUDY
                            </p>

                            <h3>
                                ${escapeSurveyHtmlDemo(
                                    survey.title ||
                                    "Khảo sát"
                                )}
                            </h3>

                            <p>
                                ${escapeSurveyHtmlDemo(
                                    survey.description ||
                                    ""
                                )}
                            </p>

                        </div>


                        <div class="admin-survey-list-statistics">

                            <div>
                                <span>
                                    Tổng học viên
                                </span>

                                <strong>
                                    ${totalStudents}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Đã nộp
                                </span>

                                <strong>
                                    ${responseCount}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Chưa nộp
                                </span>

                                <strong>
                                    ${remainingStudents}
                                </strong>
                            </div>

                        </div>


                        <button
                            type="button"
                            class="admin-survey-open-detail-button"
                            onclick="openAdminSurveyDetailDemo(
                                ${Number(survey.id)}
                            )"
                        >
                            Xem kết quả khảo sát
                        </button>

                    </article>
                `;
            })
            .join("");
}


/*
 * =========================================================
 * TẢI DANH SÁCH KHẢO SÁT ADMIN
 * =========================================================
 */

async function loadAdminSurveysDemo(
    showMessage = false
) {
    const container =
        document.getElementById(
            "adminSurveyList"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="survey-loading-card">
            Đang tải danh sách khảo sát...
        </div>
    `;

    try {
        const result =
            await adminSurveyApiRequestDemo(
                "/api/admin/surveys"
            );

        adminSurveyListApi =
            Array.isArray(
                result.data?.surveys
            )
                ? result.data.surveys
                : [];

        renderAdminSurveyListDemo(
            adminSurveyListApi
        );

        if (showMessage) {
            setAdminSurveyActionMessageDemo(
                "Đã làm mới danh sách khảo sát.",
                "success"
            );
        }
    } catch (error) {
        console.error(
            "Load admin surveys error:",
            error
        );

        container.innerHTML = `
            <div class="survey-error-card">
                <h3>
                    Không thể tải danh sách khảo sát
                </h3>

                <p>
                    ${escapeSurveyHtmlDemo(
                        error.message ||
                        "Vui lòng thử lại."
                    )}
                </p>

                <button
                    type="button"
                    class="student-survey-retry-button"
                    onclick="loadAdminSurveysDemo()"
                >
                    Thử lại
                </button>
            </div>
        `;
    }
}


/*
 * =========================================================
 * RENDER HEADER VÀ THỐNG KÊ CHI TIẾT
 * =========================================================
 */

function renderAdminSurveyDetailHeaderDemo(
    survey
) {
    const titleElement =
        document.getElementById(
            "adminSurveyDetailTitle"
        );

    const descriptionElement =
        document.getElementById(
            "adminSurveyDetailDescription"
        );

    const statusElement =
        document.getElementById(
            "adminSurveyDetailStatus"
        );

    const totalElement =
        document.getElementById(
            "adminSurveyTotalStudents"
        );

    const responseElement =
        document.getElementById(
            "adminSurveyResponseCount"
        );

    const remainingElement =
        document.getElementById(
            "adminSurveyRemainingCount"
        );

    if (titleElement) {
        titleElement.innerText =
            survey?.title ||
            "Khảo sát";
    }

    if (descriptionElement) {
        descriptionElement.innerText =
            survey?.description ||
            "";
    }

    if (statusElement) {
        const status =
            getAdminSurveyStatusDemo(
                survey?.status
            );

        statusElement.className =
            `survey-status-badge ${status.className}`;

        statusElement.innerText =
            status.label;
    }

    if (totalElement) {
        totalElement.innerText =
            Number(
                survey?.totalStudents
            ) || 0;
    }

    if (responseElement) {
        responseElement.innerText =
            Number(
                survey?.responseCount
            ) || 0;
    }

    if (remainingElement) {
        remainingElement.innerText =
            Number(
                survey?.remainingStudents
            ) || 0;
    }
}


/*
 * =========================================================
 * CẬP NHẬT NÚT MỞ / ĐÓNG
 * =========================================================
 */

function renderAdminSurveyStatusButtonDemo(
    survey
) {
    const button =
        document.getElementById(
            "adminSurveyStatusButton"
        );

    if (!button) {
        return;
    }

    const isOpen =
        String(
            survey?.status ||
            ""
        ).toUpperCase() ===
        "OPEN";

    button.disabled =
        Boolean(
            adminSurveyRequestInProgress
        );

    button.className =
        isOpen
            ? "admin-survey-status-button admin-survey-close-button"
            : "admin-survey-status-button admin-survey-open-button";

    button.innerText =
        isOpen
            ? "🔒 Đóng khảo sát"
            : "🔓 Mở khảo sát";
}


/*
 * =========================================================
 * TẠO DANH SÁCH NHÓM CHO FILTER
 * =========================================================
 */

function populateAdminSurveyGroupFilterDemo(
    responses
) {
    const select =
        document.getElementById(
            "adminSurveyGroupFilter"
        );

    if (!select) {
        return;
    }

    const currentValue =
        select.value;

    const groupMap =
        new Map();

    for (
        const response of
        Array.isArray(responses)
            ? responses
            : []
    ) {
        const group =
            response?.group;

        if (
            group?.id &&
            group?.name
        ) {
            groupMap.set(
                Number(group.id),
                group.name
            );
        }
    }

    const groups =
        Array.from(
            groupMap.entries()
        )
            .map(
                ([id, name]) => ({
                    id,
                    name
                })
            )
            .sort(
                (firstGroup, secondGroup) =>
                    String(firstGroup.name)
                        .localeCompare(
                            String(secondGroup.name),
                            "vi"
                        )
            );

    select.innerHTML = `
        <option value="">
            Tất cả nhóm
        </option>

        ${groups
            .map(group => `
                <option value="${Number(group.id)}">
                    ${escapeSurveyHtmlDemo(
                        group.name
                    )}
                </option>
            `)
            .join("")}
    `;

    if (
        groups.some(
            group =>
                String(group.id) ===
                String(currentValue)
        )
    ) {
        select.value =
            currentValue;
    }
}


/*
 * =========================================================
 * RENDER DANH SÁCH BÀI NỘP
 * =========================================================
 */

function renderAdminSurveyResponsesDemo(
    responses
) {
    const container =
        document.getElementById(
            "adminSurveyResponseList"
        );

    const resultText =
        document.getElementById(
            "adminSurveySearchResult"
        );

    if (!container) {
        return;
    }

    const normalizedResponses =
        Array.isArray(responses)
            ? responses
            : [];

    if (resultText) {
        resultText.innerText =
            `Đang hiển thị ${normalizedResponses.length} bài nộp`;
    }

    if (
        normalizedResponses.length === 0
    ) {
        container.innerHTML = `
            <div class="survey-empty-card">
                <div class="survey-empty-icon">
                    📭
                </div>

                <h3>
                    Chưa có bài nộp phù hợp
                </h3>

                <p>
                    Chưa có học viên nộp khảo sát
                    hoặc không có kết quả phù hợp với bộ lọc.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        normalizedResponses
            .map(response => {
                const member =
                    response.member ||
                    {};

                const groupName =
                    response.group?.name ||
                    "Chưa có nhóm";

                return `
                    <article class="admin-survey-response-card">

                        <div class="admin-survey-response-avatar">
                            ${escapeSurveyHtmlDemo(
                                String(
                                    member.fullName ||
                                    "?"
                                )
                                    .trim()
                                    .charAt(0)
                                    .toUpperCase() ||
                                "?"
                            )}
                        </div>


                        <div class="admin-survey-response-information">

                            <div class="admin-survey-response-name-row">

                                <h3>
                                    ${escapeSurveyHtmlDemo(
                                        member.fullName ||
                                        "Không rõ học viên"
                                    )}
                                </h3>

                                <span class="admin-survey-response-code">
                                    ${escapeSurveyHtmlDemo(
                                        member.tkhCode ||
                                        ""
                                    )}
                                </span>

                            </div>

                            <p>
                                Nhóm:
                                <strong>
                                    ${escapeSurveyHtmlDemo(
                                        groupName
                                    )}
                                </strong>
                            </p>

                            <p>
                                Đã gửi:
                                ${escapeSurveyHtmlDemo(
                                    formatSurveyDateTimeDemo(
                                        response.submittedAt
                                    )
                                )}
                            </p>

                        </div>


                        <button
                            type="button"
                            class="admin-survey-view-response-button"
                            onclick="openAdminSurveyResponseModalDemo(
                                ${Number(response.id)}
                            )"
                        >
                            Xem bài
                        </button>

                    </article>
                `;
            })
            .join("");
}


/*
 * =========================================================
 * FILTER DANH SÁCH BÀI NỘP
 * =========================================================
 */

function filterAdminSurveyResponsesDemo() {
    const responses =
        Array.isArray(
            currentAdminSurveyApi
                ?.responses
        )
            ? currentAdminSurveyApi
                .responses
            : [];

    const searchInput =
        document.getElementById(
            "adminSurveySearchInput"
        );

    const groupSelect =
        document.getElementById(
            "adminSurveyGroupFilter"
        );

    const keyword =
        String(
            searchInput?.value ||
            ""
        )
            .trim()
            .toLocaleLowerCase(
                "vi"
            );

    const selectedGroupId =
        String(
            groupSelect?.value ||
            ""
        );

    filteredAdminSurveyResponsesApi =
        responses.filter(response => {
            const member =
                response.member ||
                {};

            const group =
                response.group ||
                {};

            const searchableText = [
                member.tkhCode,
                member.fullName,
                group.code,
                group.name
            ]
                .filter(Boolean)
                .join(" ")
                .toLocaleLowerCase(
                    "vi"
                );

            const matchesKeyword =
                !keyword ||
                searchableText.includes(
                    keyword
                );

            const matchesGroup =
                !selectedGroupId ||
                String(group.id) ===
                selectedGroupId;

            return (
                matchesKeyword &&
                matchesGroup
            );
        });

    renderAdminSurveyResponsesDemo(
        filteredAdminSurveyResponsesApi
    );
}


/*
 * =========================================================
 * MỞ CHI TIẾT KHẢO SÁT
 * =========================================================
 */

async function openAdminSurveyDetailDemo(
    surveyId
) {
    const normalizedSurveyId =
        Number(surveyId);

    if (
        !Number.isInteger(
            normalizedSurveyId
        ) ||
        normalizedSurveyId <= 0
    ) {
        return;
    }

    const listSection =
        document.getElementById(
            "adminSurveyListSection"
        );

    const detailSection =
        document.getElementById(
            "adminSurveyDetailSection"
        );

    const responseContainer =
        document.getElementById(
            "adminSurveyResponseList"
        );

    if (
        !listSection ||
        !detailSection
    ) {
        return;
    }

    listSection.classList.add(
        "hidden"
    );

    detailSection.classList.remove(
        "hidden"
    );

    setAdminSurveyActionMessageDemo(
        ""
    );

    if (responseContainer) {
        responseContainer.innerHTML = `
            <div class="survey-loading-card">
                Đang tải bài nộp...
            </div>
        `;
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    try {
        const result =
            await adminSurveyApiRequestDemo(
                `/api/admin/surveys/${normalizedSurveyId}`
            );

        const survey =
            result.data?.survey;

        if (!survey) {
            throw new Error(
                "Không tìm thấy dữ liệu khảo sát."
            );
        }

        currentAdminSurveyApi =
            survey;

        renderAdminSurveyDetailHeaderDemo(
            survey
        );

        renderAdminSurveyStatusButtonDemo(
            survey
        );

        populateAdminSurveyGroupFilterDemo(
            survey.responses
        );

        const searchInput =
            document.getElementById(
                "adminSurveySearchInput"
            );

        if (searchInput) {
            searchInput.value = "";
        }

        const groupSelect =
            document.getElementById(
                "adminSurveyGroupFilter"
            );

        if (groupSelect) {
            groupSelect.value = "";
        }

        filterAdminSurveyResponsesDemo();
    } catch (error) {
        console.error(
            "Open admin survey detail error:",
            error
        );

        currentAdminSurveyApi =
            null;

        if (responseContainer) {
            responseContainer.innerHTML = `
                <div class="survey-error-card">
                    <h3>
                        Không thể tải kết quả khảo sát
                    </h3>

                    <p>
                        ${escapeSurveyHtmlDemo(
                            error.message ||
                            "Vui lòng thử lại."
                        )}
                    </p>

                    <button
                        type="button"
                        class="student-survey-retry-button"
                        onclick="openAdminSurveyDetailDemo(
                            ${normalizedSurveyId}
                        )"
                    >
                        Thử lại
                    </button>
                </div>
            `;
        }
    }
}


/*
 * =========================================================
 * LÀM MỚI CHI TIẾT
 * =========================================================
 */

async function reloadAdminSurveyDetailDemo() {
    const surveyId =
        Number(
            currentAdminSurveyApi?.id
        );

    if (!surveyId) {
        return;
    }

    setAdminSurveyActionMessageDemo(
        "Đang làm mới dữ liệu...",
        "info"
    );

    await openAdminSurveyDetailDemo(
        surveyId
    );

    if (currentAdminSurveyApi) {
        setAdminSurveyActionMessageDemo(
            "Đã làm mới kết quả khảo sát.",
            "success"
        );
    }
}


/*
 * =========================================================
 * QUAY LẠI DANH SÁCH
 * =========================================================
 */

function backToAdminSurveyListDemo() {
    const listSection =
        document.getElementById(
            "adminSurveyListSection"
        );

    const detailSection =
        document.getElementById(
            "adminSurveyDetailSection"
        );

    if (listSection) {
        listSection.classList.remove(
            "hidden"
        );
    }

    if (detailSection) {
        detailSection.classList.add(
            "hidden"
        );
    }

    currentAdminSurveyApi =
        null;

    filteredAdminSurveyResponsesApi =
        [];

    setAdminSurveyActionMessageDemo(
        ""
    );

    loadAdminSurveysDemo();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/*
 * =========================================================
 * MỞ / ĐÓNG KHẢO SÁT
 * =========================================================
 */

async function toggleAdminSurveyStatusDemo() {
    const survey =
        currentAdminSurveyApi;

    if (
        !survey ||
        adminSurveyRequestInProgress
    ) {
        return;
    }

    const isOpen =
        String(
            survey.status ||
            ""
        ).toUpperCase() ===
        "OPEN";

    const nextStatus =
        isOpen
            ? "CLOSED"
            : "OPEN";

    const confirmationMessage =
        isOpen
            ? (
                "Bạn có chắc muốn đóng khảo sát?\n\n" +
                "Sau khi đóng, những học viên chưa nộp sẽ không thể gửi bài."
            )
            : (
                "Bạn có chắc muốn mở khảo sát?\n\n" +
                "Những học viên chưa nộp sẽ có thể tiếp tục làm và gửi bài."
            );

    const confirmed =
        confirm(
            confirmationMessage
        );

    if (!confirmed) {
        return;
    }

    adminSurveyRequestInProgress =
        true;

    renderAdminSurveyStatusButtonDemo(
        survey
    );

    setAdminSurveyActionMessageDemo(
        isOpen
            ? "Đang đóng khảo sát..."
            : "Đang mở khảo sát...",
        "info"
    );

    try {
        const result =
            await adminSurveyApiRequestDemo(
                `/api/admin/surveys/${Number(
                    survey.id
                )}/status`,
                {
                    method:
                        "PATCH",

                    body:
                        JSON.stringify({
                            status:
                                nextStatus
                        })
                }
            );

        const updatedSurvey =
            result.data?.survey;

        currentAdminSurveyApi = {
            ...currentAdminSurveyApi,
            ...updatedSurvey
        };

        renderAdminSurveyDetailHeaderDemo(
            currentAdminSurveyApi
        );

        setAdminSurveyActionMessageDemo(
            result.message ||
            (
                nextStatus === "OPEN"
                    ? "Đã mở khảo sát."
                    : "Đã đóng khảo sát."
            ),
            "success"
        );

        await openAdminSurveyDetailDemo(
            survey.id
        );
    } catch (error) {
        console.error(
            "Toggle admin survey status error:",
            error
        );

        setAdminSurveyActionMessageDemo(
            error.message ||
            "Không thể cập nhật trạng thái khảo sát.",
            "error"
        );
    } finally {
        adminSurveyRequestInProgress =
            false;

        renderAdminSurveyStatusButtonDemo(
            currentAdminSurveyApi
        );
    }
}


/*
 * =========================================================
 * TÌM BÀI NỘP THEO RESPONSE ID
 * =========================================================
 */

function findAdminSurveyResponseDemo(
    responseId
) {
    const normalizedResponseId =
        Number(responseId);

    const responses =
        Array.isArray(
            currentAdminSurveyApi
                ?.responses
        )
            ? currentAdminSurveyApi
                .responses
            : [];

    return (
        responses.find(
            response =>
                Number(response.id) ===
                normalizedResponseId
        ) ||
        null
    );
}


/*
 * =========================================================
 * MỞ MODAL XEM BÀI
 * =========================================================
 */

function openAdminSurveyResponseModalDemo(
    responseId
) {
    const response =
        findAdminSurveyResponseDemo(
            responseId
        );

    if (!response) {
        alert(
            "Không tìm thấy bài khảo sát."
        );

        return;
    }

    const modal =
        document.getElementById(
            "adminSurveyResponseModal"
        );

    const nameElement =
        document.getElementById(
            "adminSurveyResponseModalName"
        );

    const metaElement =
        document.getElementById(
            "adminSurveyResponseModalMeta"
        );

    const contentElement =
        document.getElementById(
            "adminSurveyResponseModalContent"
        );

    const member =
        response.member ||
        {};

    const groupName =
        response.group?.name ||
        "Chưa có nhóm";

    if (nameElement) {
        nameElement.innerText =
            member.fullName ||
            "Bài khảo sát";
    }

    if (metaElement) {
        metaElement.innerText =
            [
                member.tkhCode ||
                    "Không có mã TKH",

                groupName,

                formatSurveyDateTimeDemo(
                    response.submittedAt
                )
            ].join(" • ");
    }

    const answers =
        Array.isArray(
            response.answers
        )
            ? [...response.answers]
            : [];

    answers.sort(
        (firstAnswer, secondAnswer) =>
            Number(
                firstAnswer.displayOrder
            ) -
            Number(
                secondAnswer.displayOrder
            )
    );

    if (contentElement) {
        contentElement.innerHTML =
            answers.length > 0
                ? answers
                    .map(answer => `
                        <article class="admin-survey-modal-answer-card">

                            <div class="admin-survey-modal-question-heading">

                                <span>
                                    ${Number(
                                        answer.displayOrder
                                    ) || ""}
                                </span>

                                <div>
                                    <h4>
                                        ${escapeSurveyHtmlDemo(
                                            answer.questionTitle ||
                                            "Hạng mục"
                                        )}
                                    </h4>

                                    <p>
                                        ${escapeSurveyHtmlDemo(
                                            answer.questionText ||
                                            ""
                                        )}
                                    </p>
                                </div>

                            </div>


                            <div class="admin-survey-modal-answer-grid">

                                <div class="admin-survey-modal-answer-yes">

                                    <strong>
                                        ${escapeSurveyHtmlDemo(
                                            answer.yesLabel ||
                                            "ĐÚNG / YES"
                                        )}
                                    </strong>

                                    <p>
                                        ${escapeSurveyHtmlDemo(
                                            answer.yesAnswer ||
                                            ""
                                        )}
                                    </p>

                                </div>


                                <div class="admin-survey-modal-answer-no">

                                    <strong>
                                        ${escapeSurveyHtmlDemo(
                                            answer.noLabel ||
                                            "SAI / NO"
                                        )}
                                    </strong>

                                    <p>
                                        ${escapeSurveyHtmlDemo(
                                            answer.noAnswer ||
                                            ""
                                        )}
                                    </p>

                                </div>

                            </div>

                        </article>
                    `)
                    .join("")
                : `
                    <div class="survey-empty-card">
                        Bài nộp chưa có câu trả lời.
                    </div>
                `;
    }

    if (modal) {
        modal.classList.remove(
            "hidden"
        );
    }

    document.body.style.overflow =
        "hidden";
}


/*
 * =========================================================
 * ĐÓNG MODAL XEM BÀI
 * =========================================================
 */

function closeAdminSurveyResponseModalDemo() {
    const modal =
        document.getElementById(
            "adminSurveyResponseModal"
        );

    if (modal) {
        modal.classList.add(
            "hidden"
        );
    }

    document.body.style.overflow =
        "";
}


/*
 * =========================================================
 * TẠO TÊN CỘT EXCEL AN TOÀN
 * =========================================================
 */

function createAdminSurveyExcelColumnNameDemo(
    question,
    answerType
) {
    const order =
        Number(
            question.displayOrder
        ) || "";

    const title =
        String(
            question.title ||
            "HẠNG MỤC"
        )
            .trim()
            .toUpperCase();

    return (
        `${order}. ${title} - ` +
        (
            answerType === "YES"
                ? "ĐÚNG / YES"
                : "SAI / NO"
        )
    );
}


/*
 * =========================================================
 * XUẤT EXCEL
 * =========================================================
 */

function exportAdminSurveyExcelDemo() {
    const survey =
        currentAdminSurveyApi;

    if (!survey) {
        alert(
            "Chưa có dữ liệu khảo sát để xuất."
        );

        return;
    }

    if (
        typeof XLSX ===
        "undefined"
    ) {
        alert(
            "Thư viện xuất Excel chưa được tải. Vui lòng tải lại trang."
        );

        return;
    }

    const responses =
        Array.isArray(
            survey.responses
        )
            ? survey.responses
            : [];

    if (responses.length === 0) {
        alert(
            "Khảo sát chưa có bài nộp để xuất Excel."
        );

        return;
    }

    const questions =
        Array.isArray(
            survey.questions
        )
            ? [...survey.questions]
            : [];

    questions.sort(
        (firstQuestion, secondQuestion) =>
            Number(
                firstQuestion.displayOrder
            ) -
            Number(
                secondQuestion.displayOrder
            )
    );

    /*
     * Xuất toàn bộ bài nộp, không phụ thuộc bộ lọc.
     */
    const excelRows =
        responses.map(
            (
                response,
                responseIndex
            ) => {
                const member =
                    response.member ||
                    {};

                const group =
                    response.group ||
                    {};

                const row = {
                    "STT":
                        responseIndex + 1,

                    "Mã TKH":
                        member.tkhCode ||
                        "",

                    "Họ và tên":
                        member.fullName ||
                        "",

                    "Nhóm":
                        group.name ||
                        "",

                    "Thời gian nộp":
                        formatSurveyDateTimeDemo(
                            response.submittedAt
                        )
                };

                const answerMap =
                    new Map(
                        (
                            Array.isArray(
                                response.answers
                            )
                                ? response.answers
                                : []
                        ).map(
                            answer => [
                                Number(
                                    answer.questionId
                                ),
                                answer
                            ]
                        )
                    );

                for (
                    const question of
                    questions
                ) {
                    const answer =
                        answerMap.get(
                            Number(
                                question.id
                            )
                        );

                    row[
                        createAdminSurveyExcelColumnNameDemo(
                            question,
                            "YES"
                        )
                    ] =
                        answer?.yesAnswer ||
                        "";

                    row[
                        createAdminSurveyExcelColumnNameDemo(
                            question,
                            "NO"
                        )
                    ] =
                        answer?.noAnswer ||
                        "";
                }

                return row;
            }
        );

    const worksheet =
        XLSX.utils.json_to_sheet(
            excelRows
        );

    /*
     * Độ rộng cột:
     * - Thông tin học viên gọn.
     * - Nội dung trả lời rộng để diễn giả dễ đọc.
     */
    const columnWidths = [
        { wch: 7 },
        { wch: 12 },
        { wch: 26 },
        { wch: 18 },
        { wch: 22 }
    ];

    for (
        let index = 0;
        index < questions.length * 2;
        index += 1
    ) {
        columnWidths.push({
            wch: 45
        });
    }

    worksheet["!cols"] =
        columnWidths;

    /*
     * Bật wrap text cho toàn bộ vùng dữ liệu.
     */
    const worksheetRange =
        XLSX.utils.decode_range(
            worksheet["!ref"]
        );

    for (
        let rowIndex =
            worksheetRange.s.r;
        rowIndex <=
            worksheetRange.e.r;
        rowIndex += 1
    ) {
        for (
            let columnIndex =
                worksheetRange.s.c;
            columnIndex <=
                worksheetRange.e.c;
            columnIndex += 1
        ) {
            const address =
                XLSX.utils.encode_cell({
                    r: rowIndex,
                    c: columnIndex
                });

            const cell =
                worksheet[address];

            if (!cell) {
                continue;
            }

            cell.s = {
                alignment: {
                    vertical:
                        "top",

                    wrapText:
                        true
                }
            };
        }
    }

    worksheet["!autofilter"] = {
        ref:
            worksheet["!ref"]
    };

    const workbook =
        XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Kết quả khảo sát"
    );

    const dateText =
        new Date()
            .toISOString()
            .slice(0, 10);

    const safeSurveyCode =
        String(
            survey.code ||
            `survey-${survey.id}`
        )
            .replace(
                /[^a-zA-Z0-9_-]/g,
                "-"
            );

    const fileName =
        `TKH2026-Khao-sat-${safeSurveyCode}-${dateText}.xlsx`;

    XLSX.writeFile(
        workbook,
        fileName
    );

    setAdminSurveyActionMessageDemo(
        `Đã xuất ${responses.length} bài khảo sát ra Excel.`,
        "success"
    );
}


/*
 * =========================================================
 * ĐÓNG MODAL KHI BẤM RA NGOÀI
 * =========================================================
 */

document.addEventListener(
    "click",
    event => {
        const modal =
            document.getElementById(
                "adminSurveyResponseModal"
            );

        if (
            modal &&
            !modal.classList.contains(
                "hidden"
            ) &&
            event.target === modal
        ) {
            closeAdminSurveyResponseModalDemo();
        }
    }
);


/*
 * =========================================================
 * ĐÓNG MODAL BẰNG PHÍM ESC
 * =========================================================
 */

document.addEventListener(
    "keydown",
    event => {
        if (
            event.key ===
            "Escape"
        ) {
            closeAdminSurveyResponseModalDemo();
        }
    }
);


/*
 * =========================================================
 * KHỞI TẠO TRANG ADMIN SURVEY
 * =========================================================
 */

function initializeAdminSurveyPageDemo() {
    const adminSurveyList =
        document.getElementById(
            "adminSurveyList"
        );

    if (!adminSurveyList) {
        return;
    }

    let currentUser = null;

    try {
        currentUser =
            JSON.parse(
                localStorage.getItem(
                    "currentUser"
                ) ||
                "null"
            );
    } catch (error) {
        currentUser = null;
    }

    if (!currentUser) {
        logoutDemo();

        return;
    }

    const role =
        String(
            currentUser.role ||
            ""
        )
            .trim()
            .toLowerCase();

    if (role !== "admin") {
        window.location.href =
            "attendance.html";

        return;
    }

    loadAdminSurveysDemo();
}


/*
 * Khởi tạo khi HTML sẵn sàng.
 */
if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initializeAdminSurveyPageDemo
    );
} else {
    initializeAdminSurveyPageDemo();
}

/* =========================================================
   TKH 2026 — STUDENT PAGE TRANSITION LOADER

   - Chỉ chạy trên .student-pastel-page
   - Không gọi thêm API
   - Không tác động Admin
   - Không tác động Login
   ========================================================= */


function createStudentPageLoader() {

    if (
        !document.body.classList.contains(
            "student-pastel-page"
        )
    ) {
        return null;
    }


    const existingLoader =
        document.getElementById(
            "studentPageLoader"
        );


    if (existingLoader) {
        return existingLoader;
    }


    const loader =
        document.createElement(
            "div"
        );


    loader.id =
        "studentPageLoader";


    loader.className =
        "student-page-loader";


    loader.setAttribute(
        "aria-hidden",
        "true"
    );


    loader.innerHTML = `
        <div class="student-page-loader-content">

            <div class="student-page-loader-logo-area">

                <div
                    class="student-page-loader-ring"
                    aria-hidden="true"
                ></div>

                <img
                    src="assets/images/LOGO-Mau-Chieu-Ra-2026-pastel.png"
                    class="student-page-loader-logo"
                    alt=""
                >

            </div>

            <p class="student-page-loader-text">
                Đang chuyển trang<span class="student-page-loader-dots"></span>
            </p>

        </div>
    `;


    document.body.appendChild(
        loader
    );


    return loader;
}


function showStudentPageLoader() {

    const loader =
        createStudentPageLoader();


    if (!loader) {
        return;
    }


    loader.classList.add(
        "is-visible"
    );


    loader.setAttribute(
        "aria-hidden",
        "false"
    );
}


function hideStudentPageLoader() {

    const loader =
        document.getElementById(
            "studentPageLoader"
        );


    if (!loader) {
        return;
    }


    loader.classList.remove(
        "is-visible"
    );


    loader.setAttribute(
        "aria-hidden",
        "true"
    );
}


/*
 * Kiểm tra link có phải một page navigation
 * thực sự hay không.
 */
function shouldUseStudentPageLoader(
    link,
    event
) {

    if (
        !link ||
        !link.href
    ) {
        return false;
    }


    /*
     * Ctrl / Cmd / Shift / Alt click:
     * giữ nguyên hành vi mở tab mới.
     */
    if (
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
    ) {
        return false;
    }


    /*
     * Middle mouse click.
     */
    if (
        typeof event.button === "number" &&
        event.button !== 0
    ) {
        return false;
    }


    /*
     * target="_blank"
     */
    if (
        link.target &&
        link.target.toLowerCase() ===
            "_blank"
    ) {
        return false;
    }


    const href =
        link.getAttribute(
            "href"
        );


    if (
        !href ||
        href === "#" ||
        href.startsWith("#") ||
        href.startsWith("javascript:") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
    ) {
        return false;
    }


    /*
     * Không chạy loader cho Logout.
     */
    if (
        link.classList.contains(
            "logout-menu"
        )
    ) {
        return false;
    }


    let targetUrl;


    try {

        targetUrl =
            new URL(
                link.href,
                window.location.href
            );

    } catch (error) {

        return false;
    }


    /*
     * Chỉ internal navigation.
     * External website không can thiệp.
     */
    if (
        targetUrl.origin !==
        window.location.origin
    ) {
        return false;
    }


    /*
     * Nếu click chính URL hiện tại thì
     * không cần loader.
     */
    if (
        targetUrl.pathname ===
            window.location.pathname &&
        targetUrl.search ===
            window.location.search &&
        targetUrl.hash ===
            window.location.hash
    ) {
        return false;
    }


    return true;
}


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeStudentPageLoader() {

    if (
        !document.body.classList.contains(
            "student-pastel-page"
        )
    ) {
        return;
    }


    /*
     * Tạo sẵn loader để khi click menu
     * chỉ cần bật class => phản hồi tức thì.
     */
    createStudentPageLoader();


    /*
     * Bắt tất cả link nội bộ của Student.
     *
     * Không phải sửa onclick từng menu.
     */
    document.addEventListener(
        "click",
        event => {

            const link =
                event.target.closest(
                    "a"
                );


            if (
                !shouldUseStudentPageLoader(
                    link,
                    event
                )
            ) {
                return;
            }


            /*
             * KHÔNG preventDefault.
             *
             * Navigation vẫn diễn ra ngay lập tức.
             * Loader chỉ phủ lên trang hiện tại
             * trong lúc browser chuyển trang.
             */
            showStudentPageLoader();

        }
    );


    /*
     * Trường hợp browser Back / Forward Cache:
     * đảm bảo loader không bị giữ lại.
     */
    window.addEventListener(
        "pageshow",
        () => {

            hideStudentPageLoader();

        }
    );


    /*
     * Safety:
     * nếu page được restore hoặc navigation
     * thất bại thì không để overlay mắc kẹt.
     */
    window.addEventListener(
        "focus",
        () => {

            window.setTimeout(
                () => {

                    if (
                        document.visibilityState ===
                            "visible"
                    ) {
                        hideStudentPageLoader();
                    }

                },
                700
            );

        }
    );
}


/*
 * app.js đang được dùng chung nhiều page,
 * nên khởi tạo an toàn theo trạng thái DOM.
 */

if (
    document.readyState ===
        "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeStudentPageLoader,
        {
            once: true
        }
    );

} else {

    initializeStudentPageLoader();

}