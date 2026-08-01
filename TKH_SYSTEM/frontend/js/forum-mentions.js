/*
=====================================================
FORUM @MENTION — V1
=====================================================
- Gõ @ để mở danh sách học viên.
- Tìm theo họ tên, mã TKH hoặc username.
- Hiển thị tối đa 6 kết quả.
- Chọn bằng chuột hoặc phím ↑ ↓ Enter.
- Escape để đóng.
- Chèn @Họ Tên vào textarea.
=====================================================
*/

(() => {
    "use strict";

    const MAX_RESULTS = 6;

    let mentionRecipients = [];
    let filteredRecipients = [];

    let mentionActiveIndex = 0;
    let mentionStartIndex = -1;

    let mentionLoaded = false;
    let mentionLoading = false;
    let mentionInitialized = false;


    /*
    =====================================================
    Helpers
    =====================================================
    */

    function isForumMentionPage() {
        const pageName =
            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();

        return pageName === "forum.html";
    }


    function normalizeMentionSearch(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .toLowerCase()
            .trim();
    }


    function escapeMentionHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    function getMentionAvatarUrl(recipient) {
        if (
            typeof getMemberAvatarUrlDemo ===
            "function"
        ) {
            return getMemberAvatarUrlDemo({
                ...recipient,

                fullName:
                    recipient?.fullName,

                tkhCode:
                    recipient?.tkhCode ||
                    recipient?.username
            });
        }

        return (
            "assets/images/members/" +
            "default-avatar.jpg"
        );
    }


    function getMentionElements() {
        return {
            input:
                document.getElementById(
                    "forumMessageInput"
                ),

            dropdown:
                document.getElementById(
                    "forumMentionDropdown"
                )
        };
    }


    function hideMentionDropdown() {
        const { dropdown } =
            getMentionElements();

        if (!dropdown) {
            return;
        }

        dropdown.classList.add(
            "hidden"
        );

        mentionStartIndex = -1;
        mentionActiveIndex = 0;
        filteredRecipients = [];
    }


    function showMentionDropdown() {
        const { dropdown } =
            getMentionElements();

        dropdown?.classList.remove(
            "hidden"
        );
    }


    /*
    =====================================================
    Detect current @ query
    =====================================================

    Ví dụ:
    "Chào @Ngô Tấn"
             └ query = "Ngô Tấn"

    Chỉ nhận @ ở đầu câu hoặc sau khoảng trắng.
    =====================================================
    */

    function getCurrentMentionQuery(
        input
    ) {
        const cursorPosition =
            input.selectionStart;

        const textBeforeCursor =
            input.value.slice(
                0,
                cursorPosition
            );

        const match =
            textBeforeCursor.match(
                /(?:^|\s)@([^@\n]{0,60})$/
            );

        if (!match) {
            return null;
        }

        const fullMatch =
            match[0];

        const atOffset =
            fullMatch.lastIndexOf("@");

        const startIndex =
            textBeforeCursor.length -
            fullMatch.length +
            atOffset;

        return {
            query:
                match[1] || "",

            startIndex,

            cursorPosition
        };
    }


    /*
    =====================================================
    Load recipients
    =====================================================
    */

    async function loadMentionRecipients(
        {
            showDropdown = true
        } = {}
    ) {
        if (
            mentionLoaded ||
            mentionLoading
        ) {
            return;
        }

        const { dropdown } =
            getMentionElements();

        const token =
            localStorage.getItem(
                "accessToken"
            );

        if (!token) {
            return;
        }

        mentionLoading = true;

        if (
            showDropdown &&
            dropdown
        ) {
            dropdown.innerHTML = `
                <div class="forum-mention-loading">
                    Đang tải danh sách học viên...
                </div>
            `;

            showMentionDropdown();
        }

        try {
            const response =
                await fetch(
                    `${API_BASE_URL}/api/forum/mention-recipients`,
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
                throw new Error(
                    "Phiên đăng nhập không hợp lệ."
                );
            }

            if (
                !response.ok ||
                result?.success !== true
            ) {
                throw new Error(
                    result?.error?.message ||
                    result?.message ||
                    "Không thể tải danh sách học viên."
                );
            }

            mentionRecipients =
                Array.isArray(
                    result.data?.recipients
                )
                    ? result.data.recipients
                    : [];

            mentionLoaded = true;

            window.forumMentionDebug = {
                loaded: true,
                recipientCount:
                    mentionRecipients.length
            };

            /*
            * Render lại các tin đang hiển thị
            * để áp dụng highlight mention.
            */
            if (
                typeof renderForumMessagesDemo ===
                "function"
            ) {
                renderForumMessagesDemo();
            }
        } catch (error) {
            console.error(
                "Load forum mention recipients error:",
                error
            );

            mentionRecipients = [];

            if (
                showDropdown &&
                dropdown
            ) {
                dropdown.innerHTML = `
                    <div class="forum-mention-empty">
                        ${escapeMentionHtml(
                            error.message ||
                            "Không thể tải danh sách học viên."
                        )}
                    </div>
                `;
            }
        } finally {
            mentionLoading = false;
        }
    }


    /*
    =====================================================
    Filter and render
    =====================================================
    */

    function filterMentionRecipients(
        query
    ) {
        const normalizedQuery =
            normalizeMentionSearch(
                query
            );

        return mentionRecipients
            .filter(recipient => {
                const fullName =
                    normalizeMentionSearch(
                        recipient?.fullName
                    );

                const tkhCode =
                    normalizeMentionSearch(
                        recipient?.tkhCode
                    );

                const username =
                    normalizeMentionSearch(
                        recipient?.username
                    );

                return (
                    !normalizedQuery ||
                    fullName.includes(
                        normalizedQuery
                    ) ||
                    tkhCode.includes(
                        normalizedQuery
                    ) ||
                    username.includes(
                        normalizedQuery
                    )
                );
            })
            .slice(
                0,
                MAX_RESULTS
            );
    }


    function renderMentionDropdown(
        query
    ) {
        const { dropdown } =
            getMentionElements();

        if (!dropdown) {
            return;
        }

        filteredRecipients =
            filterMentionRecipients(
                query
            );

        mentionActiveIndex =
            Math.min(
                mentionActiveIndex,
                Math.max(
                    filteredRecipients.length - 1,
                    0
                )
            );

        if (
            filteredRecipients.length === 0
        ) {
            dropdown.innerHTML = `
                <div class="forum-mention-empty">
                    Không tìm thấy học viên phù hợp.
                </div>
            `;

            showMentionDropdown();
            return;
        }

        dropdown.innerHTML =
            filteredRecipients
                .map(
                    (
                        recipient,
                        index
                    ) => {
                        const fullName =
                            recipient.fullName ||
                            recipient.username ||
                            "Thành viên TKH";

                        const tkhCode =
                            recipient.tkhCode ||
                            recipient.username ||
                            "";

                        const groupName =
                            recipient.group?.name ||
                            recipient.groupName ||
                            "";

                        const metaText = [
                            tkhCode,
                            groupName
                                ? `Nhóm ${groupName}`
                                : ""
                        ]
                            .filter(Boolean)
                            .join(" · ");

                        const avatarUrl =
                            getMentionAvatarUrl(
                                recipient
                            );

                        return `
                            <button
                                type="button"
                                class="forum-mention-item ${
                                    index ===
                                    mentionActiveIndex
                                        ? "active"
                                        : ""
                                }"
                                data-mention-index="${index}"
                                role="option"
                                aria-selected="${
                                    index ===
                                    mentionActiveIndex
                                }"
                            >
                                <img
                                    class="forum-mention-avatar"
                                    src="${escapeMentionHtml(
                                        avatarUrl
                                    )}"
                                    alt="Avatar ${escapeMentionHtml(
                                        fullName
                                    )}"
                                    onerror="
                                        this.onerror=null;
                                        this.src='assets/images/members/default-avatar.jpg';
                                    "
                                >

                                <span
                                    class="forum-mention-information"
                                >
                                    <span
                                        class="forum-mention-name"
                                    >
                                        ${escapeMentionHtml(
                                            fullName
                                        )}
                                    </span>

                                    <span
                                        class="forum-mention-meta"
                                    >
                                        ${escapeMentionHtml(
                                            metaText
                                        )}
                                    </span>
                                </span>
                            </button>
                        `;
                    }
                )
                .join("");

        dropdown
            .querySelectorAll(
                "[data-mention-index]"
            )
            .forEach(button => {
                /*
                 * mousedown chạy trước blur của textarea.
                 */
                button.addEventListener(
                    "mousedown",
                    event => {
                        event.preventDefault();

                        const index =
                            Number(
                                button.dataset
                                    .mentionIndex
                            );

                        selectMentionRecipient(
                            index
                        );
                    }
                );
            });

        showMentionDropdown();
    }


    /*
    =====================================================
    Select and insert mention
    =====================================================
    */

    function selectMentionRecipient(
        index
    ) {
        const { input } =
            getMentionElements();

        const recipient =
            filteredRecipients[index];

        if (
            !input ||
            !recipient ||
            mentionStartIndex < 0
        ) {
            return;
        }

        const fullName =
            String(
                recipient.fullName ||
                recipient.username ||
                ""
            ).trim();

        if (!fullName) {
            return;
        }

        const cursorPosition =
            input.selectionStart;

        const textBeforeMention =
            input.value.slice(
                0,
                mentionStartIndex
            );

        const textAfterCursor =
            input.value.slice(
                cursorPosition
            );

        const mentionText =
            `@${fullName} `;

        input.value =
            textBeforeMention +
            mentionText +
            textAfterCursor;

        const newCursorPosition =
            textBeforeMention.length +
            mentionText.length;

        input.focus();

        input.setSelectionRange(
            newCursorPosition,
            newCursorPosition
        );

        hideMentionDropdown();

        /*
         * Báo cho các listener khác biết
         * nội dung textarea đã thay đổi.
         */
        input.dispatchEvent(
            new Event(
                "input",
                {
                    bubbles: true
                }
            )
        );
    }


    /*
    =====================================================
    Input handling
    =====================================================
    */

    async function handleMentionInput(
        event
    ) {
        const input =
            event.currentTarget;

        const mention =
            getCurrentMentionQuery(
                input
            );

        if (!mention) {
            hideMentionDropdown();
            return;
        }

        mentionStartIndex =
            mention.startIndex;

        mentionActiveIndex = 0;

        if (!mentionLoaded) {
            await loadMentionRecipients();
        }

        if (!mentionLoaded) {
            return;
        }

        renderMentionDropdown(
            mention.query
        );
    }


    /*
    =====================================================
    Keyboard handling
    =====================================================
    */

    function handleMentionKeydown(
        event
    ) {
        const { dropdown } =
            getMentionElements();

        const isOpen =
            dropdown &&
            !dropdown.classList.contains(
                "hidden"
            );

        if (!isOpen) {
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            event.stopImmediatePropagation();

            hideMentionDropdown();
            return;
        }

        if (
            filteredRecipients.length === 0
        ) {
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            event.stopImmediatePropagation();

            mentionActiveIndex =
                (
                    mentionActiveIndex + 1
                ) %
                filteredRecipients.length;

            const input =
                event.currentTarget;

            const mention =
                getCurrentMentionQuery(
                    input
                );

            renderMentionDropdown(
                mention?.query || ""
            );

            scrollActiveMentionIntoView();
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            event.stopImmediatePropagation();

            mentionActiveIndex =
                (
                    mentionActiveIndex -
                    1 +
                    filteredRecipients.length
                ) %
                filteredRecipients.length;

            const input =
                event.currentTarget;

            const mention =
                getCurrentMentionQuery(
                    input
                );

            renderMentionDropdown(
                mention?.query || ""
            );

            scrollActiveMentionIntoView();
            return;
        }

        if (
            event.key === "Enter" ||
            event.key === "Tab"
        ) {
            event.preventDefault();
            event.stopImmediatePropagation();

            selectMentionRecipient(
                mentionActiveIndex
            );
        }
    }


    function scrollActiveMentionIntoView() {
        const activeItem =
            document.querySelector(
                ".forum-mention-item.active"
            );

        activeItem?.scrollIntoView({
            block: "nearest"
        });
    }

/*
=====================================================
Render highlighted mentions
=====================================================
*/

function escapeMentionRegex(value) {
    return String(value || "")
        .replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );
}


function renderForumMentionText(
    messageText
) {
    const text =
        String(messageText || "");

    /*
     * Khi danh sách học viên chưa tải xong,
     * vẫn escape HTML bình thường.
     */
    if (
        !Array.isArray(
            mentionRecipients
        ) ||
        mentionRecipients.length === 0
    ) {
        return escapeMentionHtml(
            text
        );
    }

    /*
     * Sắp xếp tên dài trước để tránh:
     * Nguyễn Văn A
     * bị khớp trước Nguyễn Văn Anh.
     */
    const memberNames = [
        ...new Set(
            mentionRecipients
                .map(recipient =>
                    String(
                        recipient?.fullName ||
                        recipient?.username ||
                        ""
                    ).trim()
                )
                .filter(Boolean)
        )
    ].sort(
        (nameA, nameB) =>
            nameB.length -
            nameA.length
    );

    if (memberNames.length === 0) {
        return escapeMentionHtml(
            text
        );
    }

    const namePattern =
        memberNames
            .map(
                escapeMentionRegex
            )
            .join("|");

    /*
     * Chỉ highlight @ + tên học viên hợp lệ.
     * Ký tự sau tên phải là:
     * - cuối tin nhắn
     * - khoảng trắng
     * - dấu câu
     */
    const mentionRegex =
        new RegExp(
            `@(${namePattern})(?=$|[\\s.,!?;:()\\[\\]{}])`,
            "gu"
        );

    let result = "";
    let lastIndex = 0;

    for (
        const match of
        text.matchAll(
            mentionRegex
        )
    ) {
        const matchIndex =
            Number(match.index) || 0;

        result +=
            escapeMentionHtml(
                text.slice(
                    lastIndex,
                    matchIndex
                )
            );

        result += `<span class="forum-message-mention">${escapeMentionHtml(
            match[0]
        )}</span>`;

        lastIndex =
            matchIndex +
            match[0].length;
    }

    result +=
        escapeMentionHtml(
            text.slice(
                lastIndex
            )
        );

    return result;
}


/*
 * Cho app.js sử dụng helper này.
 */
window.renderForumMentionText =
    renderForumMentionText;    

    /*
    =====================================================
    Initialize
    =====================================================
    */

    function initializeForumMentions() {
        if (
            mentionInitialized ||
            !isForumMentionPage()
        ) {
            return;
        }

        const { input, dropdown } =
            getMentionElements();

        if (!input || !dropdown) {
            return;
        }

        mentionInitialized = true;

        input.addEventListener(
            "input",
            handleMentionInput
        );

        /*
         * Capture = true để xử lý Enter trước
         * listener gửi tin nhắn trong app.js.
         */
        input.addEventListener(
            "keydown",
            handleMentionKeydown,
            true
        );

        input.addEventListener(
            "blur",
            () => {
                window.setTimeout(
                    hideMentionDropdown,
                    150
                );
            }
        );

        document.addEventListener(
            "mousedown",
            event => {
                if (
                    event.target === input ||
                    dropdown.contains(
                        event.target
                    )
                ) {
                    return;
                }

                hideMentionDropdown();
            }
        );

        /*
        * Tải trước danh sách học viên để các mention
        * trong tin nhắn cũ cũng được highlight ngay,
        * kể cả khi người dùng chưa gõ @.
        */
        loadMentionRecipients({
            showDropdown: false
        });
    }


    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initializeForumMentions
        );
    } else {
        initializeForumMentions();
    }
})();