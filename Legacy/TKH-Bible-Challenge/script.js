//biến thời gian winner
const WINNER_DISPLAY_TIME = 6000;

//khai báo pháo hoa
const winnerBackdrop =
document.getElementById(
    "winnerBackdrop"
);
//hết

//khai báo scoredboard
const scoreBtn =
document.getElementById("scoreBtn");

const scoreScreen =
document.getElementById("scoreScreen");

const scoreBoard =
document.getElementById("scoreBoard");

let adminMode = false;

let currentLeaderId = null;

const backToGroupBtn =
document.getElementById("backToGroupBtn");
//hết

//khai báo biến winner
const winnerOverlay =
document.getElementById("winnerOverlay");

const winnerImage =
document.getElementById("winnerImage");

const winnerName =
document.getElementById("winnerName");



//function

// =====================
// Render Scoreboard
// =====================
function renderScoreBoard(){

    const sortedGroups =
    [...groupsData].sort(
    (a,b) => b.score - a.score);

    if(
    currentLeaderId === null &&
    sortedGroups.length > 0
){
    currentLeaderId =
    sortedGroups[0].id;
}

    scoreBoard.innerHTML = "";

    sortedGroups.forEach(
    (group,index) => {

        const row =
        document.createElement("div");

        row.className =
        "score-row";

        let rank = index + 1;

        if(rank === 1)
      {
        rank = "🥇";
        }
    else if(rank === 2)
        {
    rank = "🥈";
    }
    else if(rank === 3)
{
    rank = "🥉";
}

        row.innerHTML = `
    <span>
        ${rank} ${group.name}
    </span>

    <div>

        <span style="margin-left:20px;">
            ${group.score}
        </span>

        ${
            adminMode
            ?
            `
            <button onclick="addScore(${group.id},10)">
                +10
            </button>

            <button onclick="addScore(${group.id},20)">
                +20
            </button>

            <button onclick="addScore(${group.id},-5)">
                -5
            </button>
            `
            :
            ""
        }

    </div>
`;



        row.classList.add("rank-up");
        scoreBoard.appendChild(row);

    });

}//////hết


function addScore(groupId,points){

    const group =
    groupsData.find(
        g => g.id === groupId
    );

    group.score += points;

    scoreSound.currentTime = 0;
    scoreSound.play();

    if(group.score < 0)
    {
        group.score = 0;
    }

    // Leader mới
    const leader =
    [...groupsData]
    .sort((a,b)=>b.score-a.score)[0];


    console.log(
    "Leader:",
    leader.name,
    leader.id
    );

    console.log(
    "Current:",
    currentLeaderId
    );
    // Lần đầu
    if(currentLeaderId === null){

        currentLeaderId =
        leader.id;

    }
    // Đổi leader
    else if(
        currentLeaderId !== leader.id
    ){

        currentLeaderId =
        leader.id;

        showLeaderChanged(
        leader.name
        );

    }

    renderScoreBoard();

    showFloatingScore(points);

    saveGame();

}




//function hiệu ứng cộng điểm
function showFloatingScore(points){

    const popup =
    document.createElement("div");

    popup.classList.add(
        "floating-score"
    );

    if(points > 0){

        popup.classList.add("plus");

        popup.innerText =
        "+" + points;

    }
    else{

        popup.classList.add("minus");

        popup.innerText =
        points;

    }

    popup.style.left =
    (Math.random() * 300 + 500)
    + "px";

    popup.style.top =
    (window.innerHeight / 2)
    + "px";

    document.body.appendChild(
        popup
    );

    setTimeout(() => {

        popup.remove();

    },1500);

}


// =====================
// Mở Scoreboard
// =====================

scoreBtn.addEventListener("click", () => {

    groupScreen.classList.add("hidden");

    scoreScreen.classList.remove("hidden");

    renderScoreBoard();

});


// =====================
// Quay lại màn hình nhóm
// =====================

backToGroupBtn.addEventListener("click", () => {

    scoreScreen.classList.add("hidden");

    groupScreen.classList.remove("hidden");

});

function showWinner(name,image){

    winnerBackdrop.classList.remove(
    "hidden"
    );
    winnerName.innerText = name;

    winnerImage.src = image;

    winnerOverlay.classList.remove("hidden");

}

function showGroupWinner(groupName,groupLogo){

    winnerName.innerText =
    "🏆 " + groupName + " 🏆";

    winnerImage.src =
    groupLogo;

    winnerOverlay.classList.remove("hidden");
    winnerBackdrop.classList.remove(
    "hidden"
);
}
function hideWinner(){

    winnerOverlay.classList.add("hidden");
    winnerBackdrop.classList.add(
    "hidden"
);

}

const leaderText =
document.getElementById("leaderText");

const leaderOverlay =
document.getElementById("leaderOverlay");

function showLeaderChanged(groupName){

    leaderText.innerHTML = `
        🏆 TOP 1 ĐÃ THAY ĐỔI! 🏆
        <br>
        ${groupName}
    `;

    winnerBackdrop.classList.remove(
        "hidden"
    );

    leaderOverlay.classList.remove(
        "hidden"
    );

    launchConfetti();

    setTimeout(() => {

        leaderOverlay.classList.add(
            "hidden"
        );

        winnerBackdrop.classList.add(
            "hidden"
        );

    },3000);

}

//hết
let lastGroupPosition = 0;
let isMemberRolling = false;
let isGroupRolling = false;
const memberRandomBtn =
document.getElementById("memberRandomBtn");//Random member

//khai báo biến âm thanh
const tickSound =
new Audio("assets/sounds/tick.mp3");

const winnerSound =
new Audio("assets/sounds/winner.mp3");


const scoreSound =
new Audio("assets/sounds/tick.mp3");//khai báo tạm hiệu ứng cộng điểm

//kết thúc phần âm thanh


let currentGroupIndex = null;//biến toàn cục
let availableMembers = [];//tạo biến lưu

const memberScreen =
document.getElementById("memberScreen");

const memberGrid =
document.getElementById("memberGrid");

const memberTitle =
document.getElementById("memberTitle");

const backBtn =
document.getElementById("backBtn");

//------------------
let availableGroups = [0,1,2,3,4,5,6,7];
const goBtn =
document.getElementById("goBtn");

const introScreen =
document.getElementById("introScreen");

const groupScreen =
document.getElementById("groupScreen");

goBtn.addEventListener("click", () => {

    introScreen.classList.add("hidden");

    groupScreen.classList.remove("hidden");

});
const randomBtn =
document.getElementById("randomBtn");

//reset
const resetBtn =
document.getElementById("resetBtn");
//hết

const groupGrid =
document.getElementById("groupGrid");
//....
//const groupCards =
//document.querySelectorAll(
   // "#groupGrid .group-card");
//....

loadGame();

groupsData.forEach((group,index) => {

    const card =
    document.createElement("div");

    card.className =
    "group-card";

    card.innerHTML = `
        <img src="${group.logo}" class="group-logo">
        <div>${group.name}</div>
    `;

    if(!availableGroups.includes(index))
{
    card.classList.add("used");
}

    card.addEventListener("click", () => {

        if(isGroupRolling) return;

        if(!availableGroups.includes(index))
        {
            return;
        }

        openMemberScreen(index);

    });

    groupGrid.appendChild(card);

});

randomBtn.addEventListener("click", () => {

    if(isGroupRolling)
    {
        return;
    }

    if(availableGroups.length === 0){

        alert("Tất cả nhóm đã được chọn!");

        return;
    }

    isGroupRolling = true;

    //hiện đang quay
    randomBtn.disabled = true;

    randomBtn.innerText =
    "ĐANG QUAY...";

    const groupCards =
    document.querySelectorAll(
    "#groupGrid .group-card"
    );

    const winnerPosition =
    Math.floor(
        Math.random() * availableGroups.length
    );

    const winnerIndex =
    availableGroups[winnerPosition];

    spinToWinner(
    groupCards,
    winnerIndex,
    () => {

        lastGroupPosition =
        winnerIndex;

        isGroupRolling = false;

        randomBtn.disabled = false;

        randomBtn.innerText =
        "RANDOM";

        groupCards.forEach(card => {
        card.classList.remove("winner");
        });

        groupCards[winnerIndex]
            .classList.add("winner");

        winnerSound.play();

        showGroupWinner(
            groupsData[winnerIndex].name,
            groupsData[winnerIndex].logo
        );

        launchConfetti();

        groupCards[winnerIndex]
            .classList.add("used");

        availableGroups =
        availableGroups.filter(
            item => item !== winnerIndex
        );

        saveGame();

        setTimeout(() => {

            hideWinner();

            openMemberScreen(
                winnerIndex
            );

        },WINNER_DISPLAY_TIME);

    },
    lastGroupPosition,
    32,   // số bước
    35    // tốc độ đầu
);

});

//--- mở hình thành viên
function openMemberScreen(groupIndex){
    currentGroupIndex = groupIndex;
    const group =
    groupsData[groupIndex];
    //reset thành viên chưa đc chọn
    availableMembers =
group.members
    .map((member,index)=>
        member.used
        ? null
        : index
    )
    .filter(index =>
        index !== null
    );

    introScreen.classList.add("hidden");

    groupScreen.classList.add("hidden");

    memberScreen.classList.remove("hidden");

    memberTitle.innerText =
        group.name;

    memberGrid.innerHTML = "";

    group.members.forEach((member,index) => {

        const card =
        document.createElement("div");

        card.className =
        "group-card";

        if(member.used)
        {card.classList.add("used");}

        card.innerHTML = `
        <img src="${member.avatar}" class="member-avatar">
        <div>${member.name}</div>`
        ;


        card.addEventListener("click", () => {

    if(member.used)
    {
        return;
    }

    showWinner(
        member.name,
        member.avatar
    );

    //pháo hoa
    launchConfetti();

    winnerSound.play();

    card.classList.add("used");

    member.used = true;

    saveGame();

    availableMembers =
    availableMembers.filter(
        item => item !== index
    );

    setTimeout(() => {

        hideWinner();

    },WINNER_DISPLAY_TIME);

});    

        memberGrid.appendChild(card);

    });

}

backBtn.addEventListener("click", () => {

    memberScreen.classList.add("hidden");

    groupScreen.classList.remove("hidden");

});

//Bắt sự kiện Random member
memberRandomBtn.addEventListener("click", () => {

    if(isMemberRolling){
        return;
    }

    if(availableMembers.length === 0){

        alert(
            "Tất cả thành viên đã được chọn!"
        );

        return;
    }

    isMemberRolling = true;

    memberRandomBtn.disabled = true;

    memberRandomBtn.innerText =
    "ĐANG QUAY...";

    const cards =
    document.querySelectorAll(
        "#memberGrid .group-card"
    );

    const winnerPosition =
    Math.floor(
        Math.random()
        * availableMembers.length
    );

    const winnerIndex =
    availableMembers[winnerPosition];

    spinToWinner(
        cards,
        winnerIndex,
        () => {

            isMemberRolling = false;

            memberRandomBtn.disabled = false;

            memberRandomBtn.innerText =
            "RANDOM MEMBER";

            cards.forEach(card => {

            card.classList.remove(
                "winner"
            );

            });

            cards[winnerIndex]
            .classList.add("winner");

            winnerSound.play();

            showWinner(
                groupsData[currentGroupIndex]
                .members[winnerIndex].name,

                groupsData[currentGroupIndex]
                .members[winnerIndex].avatar
            );

            launchConfetti();

            cards[winnerIndex]
            .classList.add("used");

            availableMembers =
            availableMembers.filter(
                item =>
                item !== winnerIndex
            );

            groupsData[currentGroupIndex]
            .members[winnerIndex]
            .used = true;

            saveGame();

            setTimeout(() => {

                hideWinner();

            },WINNER_DISPLAY_TIME);

        },
            0,
            70,
            45
    );

});

document.addEventListener(
"keydown",
(event) => {

    if(event.key === "e")
    {
        adminMode = !adminMode;

        if(
            !scoreScreen.classList.contains(
                "hidden"
            )
        ){
            renderScoreBoard();
        }
    }

});


// =======================
// SAVE DATA
// =======================

function saveGame(){

    localStorage.setItem(
        "groupsData",
        JSON.stringify(groupsData)
    );

    localStorage.setItem(
        "availableGroups",
        JSON.stringify(availableGroups)
    );

}


function loadGame(){

    const savedGroups =
    localStorage.getItem(
        "groupsData"
    );

    const savedAvailableGroups =
    localStorage.getItem(
        "availableGroups"
    );

    if(savedGroups){

        const parsedGroups =
        JSON.parse(savedGroups);

        parsedGroups.forEach(
        (savedGroup,index) => {

            groupsData[index].score =
            savedGroup.score;

            groupsData[index].members =
            savedGroup.members;

        });

    }

    if(savedAvailableGroups){

        availableGroups =
        JSON.parse(
            savedAvailableGroups
        );

    }

}

//function pháo hoa
function launchConfetti(){

    const duration = 5000;

    const end =
    Date.now() + duration;

    const interval =
    setInterval(() => {

        if(Date.now() > end){

            clearInterval(interval);

            return;

        }

        confetti({
            particleCount: 80,
            startVelocity: 45,
            spread: 360,
            ticks: 120,
            origin:{
                x:Math.random(),
                y:Math.random()*0.5
            }
        });

    },150);

}
//hết
console.log("START", Date.now());
//function mới
function spinToWinner(
    cards,
    winnerIndex,
    finishCallback,
    startIndex = 0,
    minSteps = 40,
    startSpeed = 30
){

    let currentIndex = startIndex;

    let speed = startSpeed;

    const distance =
(
    winnerIndex -
    startIndex +
    cards.length
) % cards.length;

// luôn quay tối thiểu 40 bước
const targetSteps =
minSteps + distance;

    let step = 0;

    function spin(){

        cards.forEach(card =>
            card.classList.remove(
                "selected"
            )
        );

        cards[currentIndex]
        .classList.add(
            "selected"
        );

        tickSound.currentTime = 0;
        tickSound.play();

        if(step >= targetSteps){

            finishCallback();

            return;
        }

        step++;

        currentIndex =
        (currentIndex + 1)
        % cards.length;

        const progress =
        step / targetSteps;

        if(progress < 0.4){

    speed += 1;

}
else if(progress < 0.7){

    speed += 2;

}
else if(progress < 0.9){

    speed += 90;

}
else{

    speed += 60;

}

        setTimeout(
            spin,
            speed
        );

    }

    spin();

}


//random slowdown
// function spinSlowDown(
//     cards,
//     finishCallback
// ){

//     let currentIndex = 0;

//     let speed = 50;

//     function spin(){

//         cards.forEach(card => {
//             card.classList.remove(
//                 "selected"
//             );
//         });

//         cards[currentIndex]
//             .classList.add("selected");

//         tickSound.currentTime = 0;
//         tickSound.play();

//         currentIndex++;

//         if(
//             currentIndex >= cards.length
//         ){
//             currentIndex = 0;
//         }

//         if(speed < 400){

//             speed += 12;

//             setTimeout(
//                 spin,
//                 speed
//             );

//         }
//         else{

//             finishCallback();

//         }

//     }

//     spin();

// }

// window.testSpin = function(){

//     const cards =
//     document.querySelectorAll(
//         "#groupGrid .group-card"
//     );

//     spinSlowDown(
//         cards,
//         () => {
//             console.log(
//                 "DONE"
//             );
//         }
//     );

// }


//hết




// =======================
// RESET SYSTEM
// =======================



resetBtn.addEventListener("click", () => {

    if(
        !confirm(
            "Bạn có chắc muốn reset toàn bộ hệ thống?"
        )
    ){
        return;
    }

    // Reset nhóm
    availableGroups =
    groupsData.map((_,index)=>index);

    // Reset member
    groupsData.forEach(group => {

        group.score = 0;

        group.members.forEach(member => {

            member.used = false;

        });

    });

    // Bỏ trạng thái mờ của nhóm
    document
    .querySelectorAll(
        "#groupGrid .group-card"
    )
    .forEach(card => {

        card.classList.remove(
            "used",
            "winner",
            "selected"
        );

    });

    saveGame();
    alert("Đã reset thành công!");

});