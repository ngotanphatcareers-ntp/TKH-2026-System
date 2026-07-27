const {
  getExamRealtimeState,
  joinExamRealtime,
  touchWaitingRoomPresence,
} = require(
  "../services/exam.service"
);

const HEARTBEAT_WRITE_INTERVAL_MS =
  15000;


/*
=====================================================
Helpers
=====================================================
*/

function normalizeExamId(examId) {
  const normalizedExamId =
    Number(examId);

  if (
    !Number.isInteger(normalizedExamId) ||
    normalizedExamId <= 0
  ) {
    return null;
  }

  return normalizedExamId;
}


function sendAcknowledgement(
  acknowledgement,
  result
) {
  if (
    typeof acknowledgement ===
    "function"
  ) {
    acknowledgement(result);
  }
}


function createErrorResult(code) {
  return {
    success: false,
    code,
  };
}


function getNormalizedRole(socket) {
  return String(
    socket.user?.role || ""
  ).toUpperCase();
}


function getStudentRoom(examId) {
  return `exam:${examId}`;
}


function getAdminRoom(examId) {
  return `exam:${examId}:admin`;
}


/*
=====================================================
Register Exam Socket handlers
=====================================================
*/

function registerExamSocketHandlers({
  examsNamespace,
  socket,
}) {
  let joinedExamId = null;

  const heartbeatLastWrittenAt =
    new Map();


  /*
  ===================================================
  Leave previous Exam rooms
  ===================================================
  */

  async function leavePreviousExamRooms() {
    if (!joinedExamId) {
      return;
    }

    await socket.leave(
      getStudentRoom(joinedExamId)
    );

    await socket.leave(
      getAdminRoom(joinedExamId)
    );

    heartbeatLastWrittenAt.delete(
      joinedExamId
    );

    joinedExamId = null;
  }


  /*
  ===================================================
  Join Exam room

  Student:
  - Creates/returns waiting-room entry.
  - Reconnects to an existing attempt.
  - Supports late join while question is ACTIVE.

  Admin:
  - Reads authoritative state.
  - Joins the private admin room.
  ===================================================
  */

  socket.on(
    "exam:join",
    async (
      payload = {},
      acknowledgement
    ) => {
      try {
        const examId =
          normalizeExamId(
            payload.examId
          );

        if (!examId) {
          sendAcknowledgement(
            acknowledgement,
            createErrorResult(
              "INVALID_EXAM_ID"
            )
          );

          return;
        }

        const role =
          getNormalizedRole(socket);

        let result;

        if (role === "ADMIN") {
          result =
            await getExamRealtimeState({
              examId,

              memberId:
                socket.user?.memberId,

              role,
            });

          if (!result.success) {
            sendAcknowledgement(
              acknowledgement,
              result
            );

            return;
          }

          await leavePreviousExamRooms();

          await socket.join(
            getAdminRoom(examId)
          );

          joinedExamId = examId;

          sendAcknowledgement(
            acknowledgement,
            {
              ...result,

              data: {
                ...result.data,
                mode: "ADMIN",
              },
            }
          );

          return;
        }

        if (role !== "STUDENT") {
          sendAcknowledgement(
            acknowledgement,
            createErrorResult(
              "EXAM_SOCKET_FORBIDDEN"
            )
          );

          return;
        }

        result =
          await joinExamRealtime({
            examId,

            memberId:
              socket.user?.memberId,
          });

        if (!result.success) {
          sendAcknowledgement(
            acknowledgement,
            result
          );

          return;
        }

        await leavePreviousExamRooms();

        await socket.join(
          getStudentRoom(examId)
        );

        joinedExamId = examId;

        /*
        Update the admin waiting-room view after a
        student joins or reconnects.
        */

        examsNamespace
          .to(getAdminRoom(examId))
          .emit(
            "exam:status",
            {
              examId,

              realtimeState:
                result.data
                  .realtimeState,
            }
          );

        sendAcknowledgement(
          acknowledgement,
          result
        );
      } catch (error) {
        console.error(
          "Exam socket join error:",
          error
        );

        sendAcknowledgement(
          acknowledgement,
          createErrorResult(
            "EXAM_SOCKET_INTERNAL_ERROR"
          )
        );
      }
    }
  );


  /*
  ===================================================
  Synchronize authoritative Exam state

  Used after reconnect, refresh or when the browser
  needs to reconcile its local countdown/state.
  ===================================================
  */

  socket.on(
    "exam:sync",
    async (
      payload = {},
      acknowledgement
    ) => {
      try {
        const examId =
          normalizeExamId(
            payload.examId
          );

        if (!examId) {
          sendAcknowledgement(
            acknowledgement,
            createErrorResult(
              "INVALID_EXAM_ID"
            )
          );

          return;
        }

        const result =
          await getExamRealtimeState({
            examId,

            memberId:
              socket.user?.memberId,

            role:
              socket.user?.role,
          });

        sendAcknowledgement(
          acknowledgement,
          result
        );
      } catch (error) {
        console.error(
          "Exam socket sync error:",
          error
        );

        sendAcknowledgement(
          acknowledgement,
          createErrorResult(
            "EXAM_SOCKET_INTERNAL_ERROR"
          )
        );
      }
    }
  );


  /*
  ===================================================
  Waiting-room heartbeat

  Browser may emit heartbeat frequently, but the
  database is updated at most once every 15 seconds
  for each Exam on this Socket connection.
  ===================================================
  */

  socket.on(
    "exam:heartbeat",
    async (
      payload = {},
      acknowledgement
    ) => {
      try {
        const examId =
          normalizeExamId(
            payload.examId
          );

        if (!examId) {
          sendAcknowledgement(
            acknowledgement,
            createErrorResult(
              "INVALID_EXAM_ID"
            )
          );

          return;
        }

        if (
          getNormalizedRole(socket) !==
          "STUDENT"
        ) {
          sendAcknowledgement(
            acknowledgement,
            createErrorResult(
              "EXAM_SOCKET_FORBIDDEN"
            )
          );

          return;
        }

        if (joinedExamId !== examId) {
          sendAcknowledgement(
            acknowledgement,
            createErrorResult(
              "EXAM_ROOM_NOT_JOINED"
            )
          );

          return;
        }

        const currentTime =
          Date.now();

        const lastWrittenAt =
          heartbeatLastWrittenAt.get(
            examId
          ) || 0;

        if (
          currentTime - lastWrittenAt <
          HEARTBEAT_WRITE_INTERVAL_MS
        ) {
          sendAcknowledgement(
            acknowledgement,
            {
              success: true,

              data: {
                throttled: true,
              },
            }
          );

          return;
        }

        const result =
          await touchWaitingRoomPresence({
            examId,

            memberId:
              socket.user?.memberId,
          });

        if (result.success) {
          heartbeatLastWrittenAt.set(
            examId,
            currentTime
          );
        }

        sendAcknowledgement(
          acknowledgement,
          result
        );
      } catch (error) {
        console.error(
          "Exam socket heartbeat error:",
          error
        );

        sendAcknowledgement(
          acknowledgement,
          createErrorResult(
            "EXAM_SOCKET_INTERNAL_ERROR"
          )
        );
      }
    }
  );


  /*
  ===================================================
  Leave Exam room
  ===================================================
  */

  socket.on(
    "exam:leave",
    async (
      payload = {},
      acknowledgement
    ) => {
      try {
        const examId =
          normalizeExamId(
            payload.examId
          );

        if (!examId) {
          sendAcknowledgement(
            acknowledgement,
            createErrorResult(
              "INVALID_EXAM_ID"
            )
          );

          return;
        }

        await socket.leave(
          getStudentRoom(examId)
        );

        await socket.leave(
          getAdminRoom(examId)
        );

        heartbeatLastWrittenAt.delete(
          examId
        );

        if (joinedExamId === examId) {
          joinedExamId = null;
        }

        sendAcknowledgement(
          acknowledgement,
          {
            success: true,

            data: {
              examId,
              left: true,
            },
          }
        );
      } catch (error) {
        console.error(
          "Exam socket leave error:",
          error
        );

        sendAcknowledgement(
          acknowledgement,
          createErrorResult(
            "EXAM_SOCKET_INTERNAL_ERROR"
          )
        );
      }
    }
  );
}


module.exports =
  registerExamSocketHandlers;