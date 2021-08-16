import React, { useState, useRef, useEffect, useContext, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NavContext } from "../context/NavContext";
import { UserContext } from "../context/UserContext";
import { SocketContext } from "../context/SocketContext";
import { v4 as uuidv4 } from "uuid";

import {
  faChevronLeft,
  faPhoneAlt,
  faVideo,
  faEllipsisV,
  faCamera,
  faImages,
  faPaperPlane,
  faMicrophone,
  faGrinSquintTears,
  faTimes,
  faKeyboard,
  faChevronRight,
  faSmile,
} from "@fortawesome/free-solid-svg-icons";
import Ripple from "../components/Effects/Ripple";
import { useLocation, useHistory } from "react-router-dom";
import { IonAlert } from "@ionic/react";

import {
  Editor,
  EditorState,
  getDefaultKeyBinding,
  ContentState,
  RichUtils,
  Modifier,
  SelectionState,
  CompositeDecorator,
} from "draft-js";
import "draft-js/dist/Draft.css";
import Avatar from "../components/Avatar";
import GroupAvatar from "../components/GroupAvatar";
import Message from "../components/Chat/Message";
import Utils from "../components/Chat/Utils";
import LinkSpan from "../components/Chat/LinkSpan";

import "emoji-mart/css/emoji-mart.css";
import { Picker } from "emoji-mart";
import Gif from "../components/Chat/Gif";
import {
  contentStateEmoji,
  enableChat,
  handleSpreadMessage,
  createMessageUI,
  listenSubmit,
  handleAddBubble,
  handleShowAvatar,
  linkStrategy,
  isInputEmpty,
} from "../utils/chat";

const draftUtils = require("draftjs-utils");

function Chat() {
  const { user } = useContext(UserContext);
  const { socket } = useContext(SocketContext);

  const location = useLocation();
  const history = useHistory();

  const [friends, setFriends] = useState([]);
  const [messages, setMessages] = useState([]);
  const [initMessages, setInitMessages] = useState([]);
  const [imagesHasLoaded, setImagesHasLoaded] = useState(0);
  const [imagesCount, setImagesCount] = useState(0);
  const [showChat, setShowChat] = useState(0);
  const [chat, setChat] = useState({});
  const [simpleController, setSimpleController] = useState(false);
  const [switchEmojiGif, setSwitchEmojiGif] = useState("emoji");

  const [toggleEmoji, setToggleEmoji] = useState(false);

  const [initPage, setInitPage] = useState(false);

  const inputRef = useRef(null);
  const editorWrapper = useRef(null);
  const editorContainer = useRef(null);
  const fileRef = useRef(null);
  const messageContainer = useRef(null);
  const messagesEndRef = useRef(null);

  let domEditor = useRef(null);
  const setDomEditorRef = (ref) => (domEditor = ref);

  const [files, setFiles] = useState([]);
  const [maximumFilesAlert, setMaximumFilesAlert] = useState(false);

  // Keep this state even if its not used, we use the value from the state but not the state itself,
  // because the value itself is more responsive than the state.
  const [editorHeight, setEditorHeight] = useState(0);
  const [editorMaxWidth, setEditorMaxWidth] = useState(0);
  useMemo(
    () => ({ editorHeight, setEditorHeight }),
    [editorHeight, setEditorHeight]
  );

  const [editorState, setEditorState] = useState(() =>
    EditorState.createEmpty(
      new CompositeDecorator([
        {
          strategy: linkStrategy,
          component: LinkSpan,
        },
      ])
    )
  );

  const text = editorState.getCurrentContent().getPlainText();

  const { setNav } = useContext(NavContext);

  const handleNavigation = (to) => {
    if (to === "/") {
      setNav("backward");
    } else {
      setNav("forward");
    }
    // we need to give a small delay so our transition class appends on the DOM before we redirect
    setTimeout(() => history.push(to), 10);
  };

  useEffect(() => {
    setTimeout(() => setInitPage(true), 400);
  }, []);

  useEffect(() => {
    if (imagesCount === 0) return;
    if (imagesCount === imagesHasLoaded) setShowChat(true);
  }, [imagesHasLoaded, imagesCount]);

  // Socket
  useEffect(() => {
    socket.on("message", (message) => {
      if (message[0].author._id === user.id) return;

      setInitMessages((messages) => [...message, ...messages]);
    });
  }, [socket, user.id]);

  useEffect(() => {
    const avatarMsgs = handleShowAvatar(initMessages);
    const bubbledMsgs = handleAddBubble(avatarMsgs, user);

    setMessages(bubbledMsgs);
  }, [initMessages]);

  const keyBindning = (e) => {
    if (listenSubmit(e)) return handleSubmit();

    return getDefaultKeyBinding(e);
  };

  const handleSubmit = async (gif = null) => {
    const chatId = location.pathname.replace("/chat/", "");
    if (!user.chats.includes(chatId)) return;
    if (!gif && text.replace(/\s/g, "").length === 0 && files.length === 0)
      return;
    if (messages.length === 0) enableChat(location, user);

    let formData = new FormData();

    if (!gif) {
      const filesArr = files.map(({ file }) => {
        return file;
      });
      filesArr.forEach((file) => {
        formData.append("files", file);
      });
    }
    !gif && formData.append("text", text);
    !gif && resetInput();
    formData.append("gif", JSON.stringify(gif));

    const myMessage = submitUI(gif);
    await fetch(`/api/messages/${chatId}`, {
      method: "POST",
      body: formData,
    });
    handleMessageLoading(myMessage);
  };

  const handleMessageLoading = (message) => {
    const updateMessage = message.map((obj) => {
      return { ...obj, isLoading: false };
    });
    const copyMessages = [...messages];
    const newMessages = [...updateMessage, ...copyMessages];
    setInitMessages(newMessages);
  };

  const submitUI = (gif) => {
    const message = createMessageUI(user, text, files, gif);

    const spreadMessage = handleSpreadMessage(message);

    setInitMessages((messages) => [...spreadMessage, ...messages]);
    return spreadMessage;
  };

  const addFile = (e) => {
    if (!e.target.files[0]) return;
    if (e.target.files[0].type.indexOf("image/") > -1) {
      if (e.target.files.length > 10) return setMaximumFilesAlert(true);

      const filesArr = [...e.target.files];

      const filesObjArr = filesArr.map((file) => {
        return { file, url: window.URL.createObjectURL(file), id: uuidv4() };
      });

      setFiles((items) => [...items, ...filesObjArr]);
    }
  };

  const handleRemoveFile = (id) => {
    const filesCopy = [...files];
    const updatedArr = filesCopy.filter((e) => e.id !== id);
    setFiles(updatedArr);
  };

  const handleAddEmoji = (emoji) => {
    const newContentState = contentStateEmoji(emoji, editorState, Modifier);
    const newEditorState = EditorState.push(editorState, newContentState);
    setEditorState(newEditorState);
  };

  // Init data
  useEffect(() => {
    const getChatData = async () => {
      const chatId = location.pathname.replace("/chat/", "");
      if (!user.chats.includes(chatId)) return;
      const res = await fetch(`/api/chats/${chatId}`);
      const data = await res.json();
      setInitMessages(data.messages.reverse());
      setFriends(data.friends);
      setChat(data.chat);
      console.log(data.messages);

      const filesCount = data.messages.filter((e) => e.file).length;
      setImagesCount(filesCount);
      if (filesCount === 0) setShowChat(true);
    };
    getChatData();
  }, [location.pathname, user]);

  // Scroll To Bottom
  useEffect(() => {
    if (!initPage) return;
    setTimeout(() => scrollToBottom(), 10);
  }, [messages, showChat, initPage]);

  // Focus Input
  useEffect(() => {
    if (!initPage) return;
    console.log("FOCUS");
    domEditor.focus();
  }, [toggleEmoji, initPage]);

  const resetInput = () => {
    setEditorState(draftUtils.clearEditorContent(editorState));
    setFiles([]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Set simple controller
  useEffect(() => {
    if (text.replace(/\s/g, "").length === 0) return setSimpleController(false);
    if (simpleController) return;

    domEditor && domEditor.focus();

    const textBlocks = editorState.getCurrentContent().getBlockMap()._list
      ._tail.array;

    for (let i = 0; i < textBlocks.length; i++) {
      const key = textBlocks[i][1].getKey();
      const node = document.querySelector(`span[data-offset-key="${key}-0-0"]`);
      const parentNode = node.parentElement;
      if (node && node.offsetWidth > parentNode.offsetWidth / 2)
        setSimpleController(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div className="chat-page page">
      <Utils
        container={messageContainer}
        toggleEmoji={toggleEmoji}
        editorState={editorState}
        setEditorHeight={setEditorHeight}
        setEditorMaxWidth={setEditorMaxWidth}
        editorContainer={editorContainer}
        editorWrapper={editorWrapper}
      />
      <div className="header-wrapper">
        <div className="header">
          <div className="top-bar">
            <div className="left-section">
              <Ripple.Div
                className="back-arrow"
                onClick={() => handleNavigation("/")}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </Ripple.Div>

              <div className="user-box">
                <div
                  className={`${
                    chat.isPrivate ? "img-box-wrapper" : "img-box-wrapper-group"
                  } `}
                >
                  {chat.isPrivate ? (
                    <Avatar user={friends[0]} style={{ fontSize: "16.2px" }} />
                  ) : (
                    <GroupAvatar
                      chat={chat}
                      style={{ fontSize: "16.2px" }}
                      scale={0.6}
                    />
                  )}
                </div>

                <div className="text-box">
                  {chat.isPrivate ? (
                    <div className="name">{friends[0] && friends[0].name}</div>
                  ) : (
                    <div className="name">{chat && chat.name}</div>
                  )}
                  {chat.isPrivate ? (
                    <div className="status">Currently Active</div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="right-section">
              <Ripple.Div>
                <FontAwesomeIcon icon={faPhoneAlt} />
              </Ripple.Div>
              <Ripple.Div>
                <FontAwesomeIcon icon={faVideo} />
              </Ripple.Div>
              <Ripple.Div>
                <FontAwesomeIcon icon={faEllipsisV} />
              </Ripple.Div>
            </div>
          </div>
        </div>
        <div className="blur"></div>
      </div>
      <div
        className="message-container"
        ref={messageContainer}
        style={showChat ? null : { visibility: "hidden" }}
      >
        <ul className="message-list">
          <div ref={messagesEndRef} style={{ width: "0" }} />
          {messages &&
            messages.map((e) => {
              return (
                <Message
                  key={e._id}
                  messages={messages}
                  message={e}
                  isMyMessage={e.author._id === user.id}
                  setImagesHasLoaded={setImagesHasLoaded}
                  scrollToBottom={scrollToBottom}
                  initPage={initPage}
                />
              );
            })}
        </ul>
      </div>

      <div className="controller-container">
        <div
          className="icon-outside-wrapper"
          style={simpleController ? { left: "-36px" } : null}
        >
          <Ripple.Div className="icon-outside">
            <FontAwesomeIcon icon={faCamera} />
          </Ripple.Div>
          {simpleController ? (
            <Ripple.Div
              className="icon-outside"
              onClick={() => setSimpleController(false)}
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </Ripple.Div>
          ) : (
            <Ripple.Div
              className="icon-outside"
              onClick={() => fileRef.current.click()}
            >
              <FontAwesomeIcon icon={faImages} />
              <input
                type="file"
                ref={fileRef}
                onChange={addFile}
                accept="image/*"
                multiple
                style={{ display: "none" }}
              />
            </Ripple.Div>
          )}
        </div>

        <div
          className="input-box"
          style={{
            minHeight: "40px",
            marginRight: isInputEmpty(text, files) ? "56px" : "",
            marginLeft: simpleController ? "40px" : "",
          }}
          ref={inputRef}
        >
          <Ripple.Div
            className="icon-inside"
            onClick={() => setToggleEmoji((bool) => !bool)}
          >
            {/* <FontAwesomeIcon icon={faGrinSquintTears} /> */}
            {toggleEmoji ? (
              <FontAwesomeIcon icon={faKeyboard} />
            ) : (
              <FontAwesomeIcon icon={faGrinSquintTears} />
            )}
          </Ripple.Div>
          <div
            className="editor-wrapper"
            ref={editorWrapper}
            style={{ maxHeight: "240px" }}
          >
            <ul className="file-preview-list">
              {files &&
                files.map((e) => {
                  return (
                    <li className="preview-item-wrapper" key={e.id}>
                      <div className="preview-item">
                        <FontAwesomeIcon
                          icon={faTimes}
                          onClick={() => handleRemoveFile(e.id)}
                        />
                        <img src={e.url} alt="" />
                      </div>
                    </li>
                  );
                })}
            </ul>
            <div
              className="editor-container"
              style={{
                maxWidth: `${editorMaxWidth}px`,
              }}
              ref={editorContainer}
            >
              <Editor
                editorState={editorState}
                onChange={setEditorState}
                placeholder="Enter Message"
                keyBindingFn={keyBindning}
                ref={setDomEditorRef}
              />
            </div>
          </div>
          {isInputEmpty(text, files) ? null : (
            <Ripple.Div className="icon-inside">
              <FontAwesomeIcon icon={faMicrophone} />
            </Ripple.Div>
          )}
        </div>
        <Ripple.Div
          onClick={() => handleSubmit()}
          className="send-btn"
          style={{
            right: isInputEmpty(text, files) ? "0" : "",
          }}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </Ripple.Div>
      </div>
      {toggleEmoji ? (
        <div className="emoji-wrapper">
          {switchEmojiGif === "emoji" ? (
            <Picker
              set="apple"
              title="Pick your emoji…"
              emoji="point_up"
              theme="auto"
              style={{ width: "100%", height: "100%" }}
              color="#0575e6"
              onSelect={handleAddEmoji}
            />
          ) : (
            <Gif
              setInitMessages={setInitMessages}
              handleSubmit={handleSubmit}
            />
          )}

          <div className="emoji-gif-box">
            <Ripple.Button
              className={switchEmojiGif === "emoji" ? "selected" : ""}
              onClick={() => setSwitchEmojiGif("emoji")}
            >
              <FontAwesomeIcon icon={faSmile} />
            </Ripple.Button>
            <Ripple.Button
              className={switchEmojiGif === "gif" ? "selected" : ""}
              onClick={() => setSwitchEmojiGif("gif")}
            >
              GIF
            </Ripple.Button>
          </div>
        </div>
      ) : null}

      <IonAlert
        isOpen={maximumFilesAlert}
        onDidDismiss={() => setMaximumFilesAlert(false)}
        cssClass="remove-avatar-alert"
        header={"The limit for attachments has been reached"}
        message={"Maxmimum number of attatchments is 10."}
        buttons={[{ text: "OK", handler: () => setMaximumFilesAlert(false) }]}
      />
    </div>
  );
}

export default Chat;
