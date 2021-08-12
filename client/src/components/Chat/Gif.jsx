import React, { useEffect, useState, useRef } from "react";
import { categories } from "../../utils/gifCategories";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faArrowLeft,
  faLessThan,
} from "@fortawesome/free-solid-svg-icons";
import { v4 as uuidv4 } from "uuid";
import Ripple from "../Effects/Ripple";

const FlareKey = "PLHRTZN7D20S";

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

function Gif() {
  const imgRef = useRef(null);
  const gifContainer = useRef(null);

  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState([]);
  const [columns, setColumns] = useState(0);
  const [columnsCount, setColumnsCount] = useState(0);
  const [gifsOrder, setGifsOrder] = useState([]);
  const [freeze, setFreeze] = useState(false);

  // const [gifLoadedCount, setGifLoadedCount] = useState([]);
  const [gifsHasLoaded, setGifsHasLoaded] = useState(false);
  const [showGifs, setShowGifs] = useState(false);
  // const gifLoaded

  // useEffect(() => {
  //   console.log(gifLoadedCount);
  // }, []);

  // const handleSetGifLoaded = () => {
  //   const copy = [...gifLoadedCount];
  //   copy.push(true);
  //   setGifLoadedCount(copy);
  // };

  useEffect(() => {
    if (gifs.length === 0) return;
    handleSetGifsOrder();
  }, [gifs]);

  const handleSetColumnsCount = () => {
    let columnsCount = Math.floor(getWindowDimensions().width / 200);
    if (columnsCount < 2) columnsCount = 2;
    if (columnsCount > 6) columnsCount = 6;
    return columnsCount;
  };

  const handleSetGifsOrder = () => {
    const columnsCount = handleSetColumnsCount();
    setColumnsCount(columnsCount);
    const columnsArray = createArrayFromNum(columnsCount);
    setColumns(columnsArray);

    const gifsCopy = [...gifs];
    let array = [];
    for (let i = 0; i < columnsCount; i++) {
      let subArr = [];
      for (let j = columnsArray[i]; j < gifsCopy.length; j += columnsCount) {
        subArr.push(gifsCopy[j]);
      }
      array.push(subArr);
    }

    setGifsOrder(array);
  };

  const createArrayFromNum = (num) => {
    let arr = [];
    for (let i = 0; i < num; i++) arr.push(i);
    return arr;
  };

  // useEffect(() => {
  //   if (gifs.length === 0) return;
  //   if (gifLoadedCount === gifs.length) setGifsHasLoaded(true);
  // }, [gifLoadedCount]);

  useEffect(() => {
    if (query.length === 0) return setGifs([]);

    const timer = setTimeout(() => setFreeze(false), 200);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!freeze) setShowGifs(false);
    if (!freeze && query.length > 0) handleQueryGifs(query);
  }, [freeze]);

  const handleChangeQuery = (query) => {
    setFreeze(true);
    setQuery(query);
  };

  const handleQueryGifs = async () => {
    const res = await fetch(
      `https://g.tenor.com/v1/search?q=${query}&key=${FlareKey}&media_filter=minimal&limit=50`
    );
    const data = await res.json();
    setGifs(data.results);
    setShowGifs(true);
  };

  const handleWindowResize = () => {
    const columnsCount = handleSetColumnsCount();
    if (columnsCount !== columns) handleSetGifsOrder();
  };
  window.onresize = handleWindowResize;

  return (
    <div className="gif-container">
      <div className="input-wrapper">
        {query.length === 0 ? null : (
          <Ripple.Div
            style={{
              width: "40px",
              height: "40px",
              display: "grid",
              placeItems: "center",
              color: "white",
              borderRadius: "100%",
              marginLeft: "14px",
            }}
            onClick={() => setQuery("")}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </Ripple.Div>
        )}

        <div
          className="search-box"
          style={{ background: "unset", height: "56px" }}
        >
          <FontAwesomeIcon icon={faSearch} />
          <input
            type="text"
            className="search"
            placeholder="Search GiF"
            style={{ background: "#2f2f2f" }}
            defaultValue={query}
            onChange={(e) => handleChangeQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="__gif-wrapper__" style={{ overflowY: "auto" }}>
        <ul
          ref={gifContainer}
          className={gifs.length > 0 ? "query-gifs" : ""}
          style={!showGifs && gifs.length > 0 ? { visibility: "hidden" } : null}
        >
          {gifs && gifs.length > 0
            ? gifsOrder &&
              gifsOrder.map((gifs) => {
                return (
                  <div key={uuidv4()} className="column">
                    {gifs.map((gif) => {
                      return (
                        <li key={gif.id}>
                          <img
                            src={gif.media[0].tinygif.url}
                            alt=""
                            // ref={imgRef}
                            // onLoad={() => handleSetGifLoaded()}
                            // onLoad={() =>
                            //   setGifLoadedCount((count) => count + 1)
                            // }
                          />
                        </li>
                      );
                    })}
                  </div>
                );
              })
            : categories.map((gif) => {
                return (
                  <li key={uuidv4()}>
                    <div
                      onClick={() => handleQueryGifs(gif.query)}
                      className="overlay"
                    >
                      {gif.query}
                    </div>
                    <img src={gif.url} alt="" />
                  </li>
                );
              })}
        </ul>
      </div>
    </div>
  );
}

export default Gif;
