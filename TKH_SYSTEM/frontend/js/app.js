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
    localStorage.removeItem("currentUser");
    localStorage.removeItem("currentUsername");
    window.location.href = "index.html";
}

const CHURCH_LOCATION = {
    lat: 10.765926509333024,
    lng: 106.6643590819157
};

const CHECKIN_RADIUS_METERS = 200;


function saveAttendanceDemo() {

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

    const today = new Date().toDateString();

    const alreadyChecked =
    attendanceHistory.find(
        item =>
            item.username === currentUser.username &&
            new Date(item.checkInTime).toDateString() === today
    );

    if (alreadyChecked) {
    return;
    }

attendanceHistory.unshift({
        username: currentUser.username,
        fullName: currentUser.fullName,
        session: "Buổi học hiện tại",
        status: "Có mặt",
        checkInTime: new Date().toLocaleString("vi-VN")
    });

    localStorage.setItem(
        "attendanceHistory",
        JSON.stringify(attendanceHistory)
    );
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

                saveAttendanceDemo();
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
    if (!document.getElementById("welcomeName")) {
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
    if (!document.getElementById("profileFullName")) {
        return;
    }

    const profileUsername = getProfileUsernameFromUrl();
    const profileUser = profileDemoUsers[profileUsername];

    if (!profileUser) {
        document.getElementById("profileName").innerText = "Không tìm thấy thành viên";
        return;
    }

    document.getElementById("profileName").innerText = "Hồ sơ: " + profileUser.fullName;
    document.getElementById("profileGroup").innerText = "Nhóm: " + profileUser.groupName;
    document.getElementById("profileAvatar").innerText = profileUser.initial;
    document.getElementById("profileFullName").innerText = profileUser.fullName;
    document.getElementById("profileUsername").innerText =
        profileUser.username + " · " + profileUser.groupName;
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
                <p>Trạng thái: ${item.status}</p>
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
    const receiverUser = profileDemoUsers[receiverUsername];

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

    if (currentUser.username === receiverUsername) {
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
        item.fromUsername === currentUser.username &&
        item.toUsername === receiverUsername &&
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
    toUsername: receiverUsername,
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

    if (currentUser && currentUser.username === profileUsername) {
        allMessages = allMessages.map(item => {
            if (item.toUsername === currentUser.username) {
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
    currentUser.username === profileUsername;

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
    .filter(item => item.toUsername === profileUsername)
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
        item => item.toUsername === currentUser.username
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
    const currentUser =
        JSON.parse(localStorage.getItem("currentUser")) ||
        demoUsers.find(user => user.username === localStorage.getItem("currentUsername"));

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
            item => item.toUsername === username
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
            item.toUsername === currentUser.username
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
        item => item.toUsername === currentUser.username
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

    if (studyMaterialsDemo.length === 0) {
        list.innerHTML = `
            <p class="empty-note">Chưa có tài liệu học tập nào.</p>
        `;
        return;
    }

    list.innerHTML = studyMaterialsDemo.map(item => `
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
                                <p>${file.type} · ${file.size}</p>
                            </div>

                            <a class="material-open-btn" href="${file.url}">
                                Mở
                            </a>
                        </div>
                    `).join("")
                }
            </div>
        </div>
    `).join("");
}