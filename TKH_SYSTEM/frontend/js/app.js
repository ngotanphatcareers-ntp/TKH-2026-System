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

function loginDemo() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const message = document.getElementById("loginMessage");

    const importedStudents = getImportedStudentsDemo();

    const adminUsers = demoUsers.filter(user => user.role === "admin");

    const allUsers = [
        ...adminUsers,
        ...importedStudents
    ];

    const user = allUsers.find(item => item.username === username);

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

    localStorage.setItem("currentUsername", user.username);
    localStorage.setItem("currentUser", JSON.stringify(user));

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
    localStorage.removeItem("currentUser");
    localStorage.removeItem("currentUsername");
    window.location.href = "index.html";
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


const CHECKIN_RADIUS_METERS = 500000;


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


function saveAttendanceDemo(distance) {
    const currentUser = getCurrentUserDemo();

    if (!currentUser) {
        return {
            success: false,
            message: "Không tìm thấy tài khoản đăng nhập."
        };
    }

    const openWindows = getOpenCheckinWindowsDemo();

    if (openWindows.length === 0) {
        return {
            success: false,
            message: "Hiện chưa có khung điểm danh nào đang mở."
        };
    }

    const checkinWindow = openWindows[0];

    const attendanceHistory =
        JSON.parse(localStorage.getItem("attendanceHistory")) || [];

    const today = new Date().toDateString();
    const session = attendanceCheckinConfigDemo.activeSession;

    const myTodayRecords = attendanceHistory.filter(item =>
        item.username.toLowerCase() === currentUser.username.toLowerCase() &&
        item.dateKey === today &&
        item.session === session
    );

    const alreadySameWindow = myTodayRecords.find(
        item => item.windowKey === checkinWindow.key
    );

    if (alreadySameWindow) {
        return {
            success: false,
            message: "Bạn đã điểm danh khung " + checkinWindow.label + " rồi."
        };
    }

    const hasMorning = myTodayRecords.some(item => item.windowKey === "morning");
    const hasBreak = myTodayRecords.some(item => item.windowKey === "break");

    if (checkinWindow.key === "break" && hasMorning) {
        return {
            success: false,
            message: "Bạn đã điểm danh đầu giờ rồi nên không thể điểm danh giờ ra chơi."
        };
    }

    if (checkinWindow.key === "morning" && hasBreak) {
        return {
            success: false,
            message: "Bạn đã điểm danh giờ ra chơi rồi nên không thể điểm danh đầu giờ."
        };
    }

    attendanceHistory.unshift({
        username: currentUser.username,
        fullName: currentUser.fullName,
        groupName: currentUser.groupName,
        session: session,
        status: "Có mặt",
        windowKey: checkinWindow.key,
        windowLabel: checkinWindow.label,
        points: checkinWindow.points,
        distance: formatDistance(distance),
        dateKey: today,
        checkInTime: new Date().toLocaleString("vi-VN")
    });

    localStorage.setItem(
        "attendanceHistory",
        JSON.stringify(attendanceHistory)
    );

    addAttendanceScoreDemo(currentUser, checkinWindow);

    return {
        success: true,
        message:
            "Điểm danh thành công khung " +
            checkinWindow.label +
            ". Bạn được +" +
            checkinWindow.points +
            " điểm."
    };
}


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

                const checkinResult = saveAttendanceDemo(distance);

            if (!checkinResult.success) {
                statusCard.className = "status-card status-fail";
                statusCard.innerText = "Không thể điểm danh";

                gpsMessage.style.color = "red";
                gpsMessage.innerText = checkinResult.message;
                return;
            }

            gpsMessage.style.color = "green";
            gpsMessage.innerText = "✅ " + checkinResult.message;

            loadAttendanceHistoryDemo();
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

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser"));

    if (!currentPassword || !newPassword || !confirmPassword) {
        message.style.color = "red";
        message.innerText = "Vui lòng nhập đầy đủ thông tin.";
        return;
    }

    const savedPassword =
        localStorage.getItem("password_" + currentUser.username) ||
        currentUser.defaultPassword;

    if (currentPassword !== savedPassword) {
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

    

localStorage.setItem(
    "password_" + currentUser.username,
    newPassword
);

    message.style.color = "green";
    message.innerText = "Đổi mật khẩu thành công!";
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
    if (!document.getElementById("welcomeName")) {
        return;
    }

    const currentUser = getCurrentUserDemo();

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
    if (!document.getElementById("profileFullName")) {
        return;
    }

    const profileUsername = getProfileUsernameFromUrl();
    const profileUser = findStudentByUsernameDemo(profileUsername);

    if (!profileUser) {
        document.getElementById("profileName").innerText = "Không tìm thấy thành viên";
        document.getElementById("profileGroup").innerText = "";
        document.getElementById("profileAvatar").innerText = "?";
        document.getElementById("profileFullName").innerText = "Không tìm thấy thành viên";
        document.getElementById("profileUsername").innerText = "";
        return;
    }

    document.getElementById("profileName").innerText = "Hồ sơ: " + profileUser.fullName;
    document.getElementById("profileGroup").innerText = "Nhóm: " + profileUser.groupName;
    document.getElementById("profileAvatar").innerText = getStudentAvatarInitialDemo(profileUser);
    document.getElementById("profileFullName").innerText = profileUser.fullName;
    document.getElementById("profileUsername").innerText =
        profileUser.username + " · Nhóm " + profileUser.groupName;
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
function loadAttendanceHistoryDemo() {

    const historyContainer =
        document.getElementById("attendanceHistory");

    if (!historyContainer) {
        return;
    }

    const currentUser =
        JSON.parse(localStorage.getItem("currentUser")) ||
        demoUsers.find(
            user => user.username === localStorage.getItem("currentUsername")
        );

    if (!currentUser) {
        return;
    }

    const attendanceHistory =
        JSON.parse(localStorage.getItem("attendanceHistory")) || [];

    const myHistory =
        attendanceHistory.filter(
            item => item.username === currentUser.username
        );

    if (myHistory.length === 0) {

        historyContainer.innerHTML = `
            <p>Chưa có lịch sử điểm danh.</p>
        `;

        return;
    }

    historyContainer.innerHTML =
    myHistory.map(item => `
        <div class="question-card">
            <h3>${item.session}</h3>
            <p><strong>Khung:</strong> ${item.windowLabel || "Điểm danh"}</p>
            <p><strong>Trạng thái:</strong> ${item.status}</p>
            <p><strong>Điểm:</strong> +${item.points || 0}</p>
            <p><strong>Khoảng cách:</strong> ${item.distance || "-"}</p>
            <p class="question-meta">
                ${item.checkInTime}
            </p>
        </div>
    `).join("");
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
    loadTodayEncouragementPreview();
    loadStudyMaterialsDemo();
    loadAdminStudyMaterialsDemo();
    loadAdminMembersTableDemo();
    loadStudentDirectoryDemo();
    loadGroupScoreDemo();
    loadGroupRankingDemo();
    loadAttendanceConfig();
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
}

document.addEventListener("DOMContentLoaded", runPageLoaders);
window.addEventListener("pageshow", runPageLoaders);

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
        "💚 Cảm ơn bạn đã gửi lời khích lệ đến thành viên này Một lời động viên nho nhỏ có thể mang lại rất nhiều sự ấm áp đến người nhận được. Chúa ở cùng bạn luôn!";

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
    const currentUsername = localStorage.getItem("currentUsername");

    if (!currentUsername) {
        return null;
    }

    const importedStudents = getImportedStudentsDemo();

    const importedUser = importedStudents.find(
        user => user.username === currentUsername
    );

    if (importedUser) {
        return importedUser;
    }

    const demoUser = demoUsers.find(
        user => user.username === currentUsername
    );

    if (demoUser) {
        return demoUser;
    }

    return JSON.parse(localStorage.getItem("currentUser"));
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
function loadAdminMembersTableDemo() {
    const tableBody = document.getElementById("adminMembersTableBody");

    if (!tableBody) {
        return;
    }

    const students = getImportedStudentsDemo();

    if (students.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8">Chưa có học viên nào được import.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = students.map(student => `
        <tr>
            <td>${student.username}</td>
            <td>${student.fullName}</td>
            <td>${student.gender}</td>
            <td>${student.birthDate}</td>
            <td>${student.phone}</td>
            <td>${student.groupName}</td>
            <td>Học viên</td>
            <td>123456</td>
        </tr>
    `).join("");
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

    const students = getImportedStudentsDemo();

    return students.find(
        student => student.username.toLowerCase() === username.toLowerCase()
    );
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


function loadGroupRankingDemo() {

    const tableBody =
        document.getElementById("groupRankingTableBody");

    if (!tableBody) {
        return;
    }

    const currentUser = getCurrentUserDemo();

    if (!currentUser) {
        return;
    }

    const students = getImportedStudentsDemo();
    const scores = getStoredScoresDemo();

    // copy danh sách nhóm
    const groups = groupRankingDemo.map(group => ({
        groupName: group.groupName,
        score: 0
    }));

    // cộng điểm từng học viên vào nhóm
    scores.forEach(score => {

        const student = students.find(
            item => item.username === score.username
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

    tableBody.innerHTML = groups.map((group, index) => {

        const isMyGroup =
            group.groupName.toLowerCase() ===
            currentUser.groupName.toLowerCase();

        let status = "Đang thi đua";

        if (index === 0) {
            status = "Đang dẫn đầu";
        }

        if (isMyGroup) {
            status = "Nhóm của bạn";
        }

        return `
            <tr class="${isMyGroup ? "highlight-row" : ""}">
                <td>#${index + 1}</td>
                <td>${group.groupName}</td>
                <td>${group.score}</td>
                <td>${status}</td>
            </tr>
        `;

    }).join("");

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

function loadMyScoreDemo() {
    const totalScoreElement = document.getElementById("myTotalScore");
    const attendanceScoreElement = document.getElementById("myAttendanceScore");
    const historyBody = document.getElementById("myScoreHistoryBody");
    const groupRankText = document.getElementById("myGroupRankText");

    if (!totalScoreElement || !attendanceScoreElement || !historyBody) {
        return;
    }

    const currentUser = getCurrentUserDemo();

    if (!currentUser) {
        window.location.href = "index.html";
        return;
    }

    const myScores = getScoresByUsernameDemo(currentUser.username);

    const totalScore = myScores.reduce(
        (total, item) => total + Number(item.scoreValue),
        0
    );

    const attendanceScore = myScores
        .filter(item => item.scoreType === "attendance")
        .reduce((total, item) => total + Number(item.scoreValue), 0);

    totalScoreElement.innerText = totalScore;
    attendanceScoreElement.innerText = attendanceScore;

    if (groupRankText) {
        groupRankText.innerText = "Trong nhóm " + currentUser.groupName;
    }

    if (myScores.length === 0) {
        historyBody.innerHTML = `
            <tr>
                <td colspan="3">Chưa có lịch sử điểm.</td>
            </tr>
        `;
        return;
    }

    historyBody.innerHTML = myScores.map(item => `
        <tr>
            <td>${item.createdAt}</td>
            <td>${item.reason}</td>
            <td>${item.scoreValue > 0 ? "+" : ""}${item.scoreValue}</td>
        </tr>
    `).join("");
}

function loadDashboardPersonalScoreDemo() {
    const scoreElement = document.getElementById("dashboardPersonalScore");

    if (!scoreElement) {
        return;
    }

    const currentUser = getCurrentUserDemo();

    if (!currentUser) {
        return;
    }

    const totalScore = getTotalScoreByUsernameDemo(currentUser.username);

    scoreElement.innerText = totalScore;
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

function loadMyGroupSummaryDemo() {

    const groupName =
        document.getElementById("myGroupName");

    const totalScore =
        document.getElementById("myGroupTotalScore");

    if (!groupName || !totalScore) {
        return;
    }

    const currentUser = getCurrentUserDemo();

    if (!currentUser) {
        return;
    }

    groupName.innerText =
        currentUser.groupName;

    totalScore.innerText =
        getGroupTotalScoreDemo(currentUser.groupName);

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

function loadTopGroupRankingDemo() {
    const list = document.getElementById("topGroupRankingList");

    if (!list) {
        return;
    }

    const topGroups = getGroupRankingWithScoresDemo().slice(0, 3);

    if (topGroups.length === 0) {
        list.innerHTML = `<p class="empty-note">Chưa có dữ liệu nhóm.</p>`;
        return;
    }

    list.innerHTML = topGroups.map((group, index) => `
        <div class="question-card">
            <h3>#${index + 1} ${group.groupName}</h3>
            <p>⭐ ${group.score} điểm</p>
        </div>
    `).join("");
}

function loadMyGroupRankDemo() {
    const rankElement = document.getElementById("myGroupRankNumber");

    if (!rankElement) {
        return;
    }

    const currentUser = getCurrentUserDemo();

    if (!currentUser) {
        return;
    }

    const ranking = getGroupRankingWithScoresDemo();

    const myGroupIndex = ranking.findIndex(
        group =>
            group.groupName.toLowerCase() ===
            currentUser.groupName.toLowerCase()
    );

    if (myGroupIndex === -1) {
        rankElement.innerText = "-";
        return;
    }

    rankElement.innerText = "#" + (myGroupIndex + 1);
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

    const now = new Date();

    const currentMinutes =
        now.getHours() * 60 + now.getMinutes();

    const startParts = windowConfig.startTime.split(":");
    const endParts = windowConfig.endTime.split(":");

    const startMinutes =
        Number(startParts[0]) * 60 + Number(startParts[1]);

    const endMinutes =
        Number(endParts[0]) * 60 + Number(endParts[1]);

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
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