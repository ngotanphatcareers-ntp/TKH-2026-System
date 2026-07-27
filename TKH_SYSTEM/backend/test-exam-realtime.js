const {
  io,
} = require("socket.io-client");

const BASE_URL =
  process.env.BASE_URL ||
  "http://localhost:5000";

const EXAM_ID =
  Number(process.env.EXAM_ID);

const ADMIN_USERNAME =
  process.env.ADMIN_USERNAME;

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD;

const STUDENT_USERNAME =
  process.env.STUDENT_USERNAME;

const STUDENT_PASSWORD =
  process.env.STUDENT_PASSWORD;

let adminSocket;
let studentSocket;


function requireEnvironment() {
  const missing = [];

  if (
    !Number.isInteger(EXAM_ID) ||
    EXAM_ID <= 0
  ) {
    missing.push("EXAM_ID");
  }

  if (!ADMIN_USERNAME) {
    missing.push("ADMIN_USERNAME");
  }

  if (!ADMIN_PASSWORD) {
    missing.push("ADMIN_PASSWORD");
  }

  if (!STUDENT_USERNAME) {
    missing.push("STUDENT_USERNAME");
  }

  if (!STUDENT_PASSWORD) {
    missing.push("STUDENT_PASSWORD");
  }

  if (missing.length > 0) {
    throw new Error(
      `Thiếu biến môi trường: ${missing.join(", ")}`
    );
  }
}


async function requestJson(
  path,
  {
    method = "GET",
    token,
    body,
  } = {}
) {
  const response = await fetch(
    `${BASE_URL}${path}`,
    {
      method,

      headers: {
        "Content-Type":
          "application/json",

        ...(token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {}),
      },

      ...(body
        ? {
            body:
              JSON.stringify(body),
          }
        : {}),
    }
  );

  const text =
    await response.text();

  let result;

  try {
    result =
      text
        ? JSON.parse(text)
        : {};
  } catch {
    result = {
      rawResponse: text,
    };
  }

  if (!response.ok) {
    throw new Error(
      `${method} ${path} thất bại (${response.status}):\n` +
      JSON.stringify(
        result,
        null,
        2
      )
    );
  }

  return result;
}


async function login(
  username,
  password
) {
  const result =
    await requestJson(
      "/api/auth/login",
      {
        method: "POST",

        body: {
          username,
          password,
        },
      }
    );

  const token =
    result.accessToken ||
    result.data?.accessToken ||
    result.token ||
    result.data?.token;

  if (!token) {
    throw new Error(
      "Đăng nhập thành công nhưng không tìm thấy accessToken:\n" +
      JSON.stringify(
        result,
        null,
        2
      )
    );
  }

  return token;
}


function connectSocket(
  token,
  label
) {
  return new Promise(
    (resolve, reject) => {
      const socket = io(
        `${BASE_URL}/exams`,
        {
          auth: {
            token,
          },

          reconnection: false,
        }
      );

      const timeout =
        setTimeout(
          () => {
            socket.disconnect();

            reject(
              new Error(
                `${label} kết nối Socket quá thời gian.`
              )
            );
          },
          10000
        );

      socket.once(
        "connect",
        () => {
          clearTimeout(timeout);

          console.log(
            `[PASS] ${label} connected: ${socket.id}`
          );

          resolve(socket);
        }
      );

      socket.once(
        "connect_error",
        error => {
          clearTimeout(timeout);

          reject(
            new Error(
              `${label} connect_error: ` +
              `${error.message} ` +
              `${JSON.stringify(error.data || {})}`
            )
          );
        }
      );
    }
  );
}


function waitForEvent(
  socket,
  eventName
) {
  return new Promise(
    (resolve, reject) => {
      const timeout =
        setTimeout(
          () => {
            socket.off(
              eventName,
              handler
            );

            reject(
              new Error(
                `Không nhận được sự kiện ${eventName}.`
              )
            );
          },
          10000
        );

      function handler(payload) {
        clearTimeout(timeout);

        resolve(payload);
      }

      socket.once(
        eventName,
        handler
      );
    }
  );
}


function emitWithAck(
  socket,
  eventName,
  payload
) {
  return new Promise(
    (resolve, reject) => {
      socket
        .timeout(10000)
        .emit(
          eventName,
          payload,
          (error, result) => {
            if (error) {
              reject(
                new Error(
                  `${eventName} không acknowledgement.`
                )
              );

              return;
            }

            if (!result?.success) {
              reject(
                new Error(
                  `${eventName} thất bại:\n` +
                  JSON.stringify(
                    result,
                    null,
                    2
                  )
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


async function runTest() {
  requireEnvironment();

  console.log(
    `\nTesting Exam ID: ${EXAM_ID}\n`
  );

  const [
    adminToken,
    studentToken,
  ] = await Promise.all([
    login(
      ADMIN_USERNAME,
      ADMIN_PASSWORD
    ),

    login(
      STUDENT_USERNAME,
      STUDENT_PASSWORD
    ),
  ]);

  console.log(
    "[PASS] Admin và học viên đăng nhập thành công"
  );

  adminSocket =
    await connectSocket(
      adminToken,
      "Admin"
    );

  studentSocket =
    await connectSocket(
      studentToken,
      "Học viên"
    );

  const adminJoin =
    await emitWithAck(
      adminSocket,
      "exam:join",
      {
        examId: EXAM_ID,
      }
    );

  console.log(
    "[PASS] Admin đã vào phòng realtime"
  );

  console.log(
    JSON.stringify(
      adminJoin.data,
      null,
      2
    )
  );


  /*
  Mở phòng chờ
  */

  const [
    openStatus,
  ] = await Promise.all([
    waitForEvent(
      adminSocket,
      "exam:status"
    ),

    requestJson(
      `/api/admin/test/exams/${EXAM_ID}/open-waiting-room`,
      {
        method: "PATCH",
        token: adminToken,
      }
    ),
  ]);

  console.log(
    "[PASS] Admin nhận trạng thái mở phòng chờ"
  );

  console.log(
    JSON.stringify(
      openStatus,
      null,
      2
    )
  );


  /*
  Học viên vào phòng chờ
  */

  const [
    waitingRoomStatus,
    studentJoin,
  ] = await Promise.all([
    waitForEvent(
      adminSocket,
      "exam:status"
    ),

    emitWithAck(
      studentSocket,
      "exam:join",
      {
        examId: EXAM_ID,
      }
    ),
  ]);

  console.log(
    "[PASS] Học viên đã vào phòng chờ"
  );

  console.log(
    JSON.stringify(
      studentJoin.data,
      null,
      2
    )
  );

  console.log(
    "[PASS] Admin nhận cập nhật phòng chờ realtime"
  );

  console.log(
    JSON.stringify(
      waitingRoomStatus,
      null,
      2
    )
  );


  /*
  Admin bắt đầu Exam
  */

  const [
    adminStarted,
    studentStatus,
    studentStarted,
  ] = await Promise.all([
    waitForEvent(
      adminSocket,
      "exam:started"
    ),

    waitForEvent(
      studentSocket,
      "exam:status"
    ),

    waitForEvent(
      studentSocket,
      "exam:started"
    ),

    requestJson(
      `/api/admin/test/exams/${EXAM_ID}/start`,
      {
        method: "PATCH",
        token: adminToken,
      }
    ),
  ]);

  console.log(
    "[PASS] Admin nhận exam:started"
  );

  console.log(
    JSON.stringify(
      adminStarted,
      null,
      2
    )
  );

  console.log(
    "[PASS] Học viên nhận exam:status"
  );

  console.log(
    JSON.stringify(
      studentStatus,
      null,
      2
    )
  );

  console.log(
    "[PASS] Học viên nhận exam:started"
  );

  console.log(
    JSON.stringify(
      studentStarted,
      null,
      2
    )
  );

  const startedPayload =
    JSON.stringify({
      studentStatus,
      studentStarted,
    });

  if (
    !startedPayload.includes(
      "IN_PROGRESS"
    )
  ) {
    throw new Error(
      "Đã nhận sự kiện nhưng không tìm thấy trạng thái IN_PROGRESS."
    );
  }

  console.log(
    "\n===================================="
  );

  console.log(
    "REALTIME END-TO-END: PASS"
  );

  console.log(
    "====================================\n"
  );
}


runTest()
  .catch(error => {
    console.error(
      "\nREALTIME END-TO-END: FAIL"
    );

    console.error(
      error.message
    );

    process.exitCode = 1;
  })
  .finally(() => {
    adminSocket?.disconnect();
    studentSocket?.disconnect();
  });