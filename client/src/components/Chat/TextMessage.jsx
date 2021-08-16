import React, { useEffect, useState } from "react";

function TextMessage({
  message,
  SetAvatar,
  SetMessageLoading,
  isMyMessage,
  messageClass,
  bubbleClass,
  onlyEmoji,
  time,
}) {
  const liStyle = {
    fontSize: onlyEmoji ? "40px" : null,
  };

  return (
    <li key={message._id} className={messageClass} style={{ ...liStyle }}>
      {!isMyMessage && message.showAvatar ? <SetAvatar /> : null}
      {message.stringTag ? (
        <div
          className={`${bubbleClass} ${
            message.isNewMessage ? "bubble-fade-in" : ""
          }`}
          style={{ borderRadius: message.borderRadius }}
        >
          <span
            dangerouslySetInnerHTML={{ __html: `${message.stringTag}` }}
          ></span>
          {message.showAvatar ? (
            <div
              className={isMyMessage ? "my-bubble-time" : "user-bubble-time"}
            >
              {time}
            </div>
          ) : null}
        </div>
      ) : (
        <div
          className={`${bubbleClass} ${
            message.isNewMessage ? "bubble-fade-in" : ""
          }`}
          style={{ borderRadius: message.borderRadius }}
        >
          {message.text}
          {message.showAvatar ? (
            <div
              className={isMyMessage ? "my-bubble-time" : "user-bubble-time"}
            >
              {time}
            </div>
          ) : null}
        </div>
      )}

      <SetMessageLoading />
    </li>
  );
}

export default TextMessage;
