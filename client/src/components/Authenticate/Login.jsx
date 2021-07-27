import React, { useState, useContext, useEffect } from "react";
import { UserContext } from "../../context/UserContext";
import { IonPage } from "@ionic/react";
import FlareIcon from "../../imgs/flare-icon.svg";
import { NavContext } from "../../context/NavContext";
import { useHistory } from "react-router-dom";
import Ripple from "../Effects/Ripple";
import { v4 as uuidv4 } from "uuid";

function Login({ changePage }) {
  const { setUser } = useContext(UserContext);
  const history = useHistory();
  const { setNav } = useContext(NavContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (username.length === 0 || password.length === 0) return;
    setIsSubmitting(true);
    setError("");
    const res = await fetch(`/api/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });
    const user = await res.json();
    if (user.error) return handleError(user);
    handleRedirect(user);
  };

  const handleError = (user) => {
    setError(user.error);
    setIsSubmitting(false);
  };

  const handleRedirect = (user) => {
    setNav("forward");
    history.location.key = uuidv4(); // Change key to invoke animation
    setUser(user);
  };

  return (
    <IonPage className="page auth-page">
      <img src={FlareIcon} className="flare-icon" alt="logo" />
      <form onSubmit={handleLogin}>
        <input
          placeholder="Username"
          type="text"
          onChange={(e) => setUsername(e.target.value)}
          name="username"
          required
        />
        <input
          placeholder="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
          name="password"
          required
        />
        <div style={{ color: "red" }}>{error}</div>
        <button
          disabled={
            isSubmitting || username.length === 0 || password.length === 0
          }
          type="submit"
          style={{ display: "none" }}
        ></button>
      </form>
      <Ripple.Button
        disabled={
          isSubmitting || username.length === 0 || password.length === 0
        }
        onClick={handleLogin}
        className="login-btn"
      >
        LOG IN
      </Ripple.Button>
      <Ripple.Button onClick={() => changePage("signup")}>
        CREATE NEW ACCOUNT
      </Ripple.Button>
      <Ripple.Button className="small-btn">FORGOT PASSWORD</Ripple.Button>
    </IonPage>
  );
}

export default Login;