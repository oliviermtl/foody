import { socket } from "./socket";
const SWIPE = "SWIPE";
const POTENTIAL_MATCHES = "POTENTIAL_MATCHES";
const DID_MATCH = "DID_MATCH";
const LOADING = "LOADING";
const initialState = {
  didMatch: { matched: false },
  potentials: [],
  loading: false
};

const potentialMatches = data => ({
  type: POTENTIAL_MATCHES,
  data
});
const didMatch = match => ({
  type: DID_MATCH,
  match
});

const swiped = (value, matchee) => ({
  type: SWIPE,
  value,
  matchee
});
let timeout;
export const swipe = (value, matchee, matched, fetchMore) => dispatch => {
  if (value !== undefined) socket.emit("swipe", { value, matchee, matched });
  if (value === undefined || fetchMore) {
    socket.emit("getPotentialMatches");
    timeout = new Promise(resolve => {
      setTimeout(() => {
        dispatch(loading(true));
        resolve();
      }, 250);
    });
  }
  return dispatch(swiped(value, matchee));
};

export const matchListeners = () => async dispatch => {
  return await new Promise(resolve => {
    socket.on("haveYouMatched", data => {
      if (data.matched) {
        dispatch(didMatch(data));
      } else {
        socket.on("didMatch", data => {
          dispatch(didMatch(data));
        });
      }
      resolve(data.matched);
    });
    socket.emit("haveIMatched");
  });
};
export const getPotentialMatches = () => async dispatch => {
  return await new Promise(resolve => {
    if (!socket.hasListeners("potentialMatches")) {
      socket.on("potentialMatches", async data => {
        await timeout;
        dispatch(potentialMatches(data));
        dispatch(loading(false));
        resolve();
      });
    }
    dispatch(loading(true));
    socket.emit("getPotentialMatches");
  });
};

export const loading = value => ({ type: LOADING, value });
export default (state = initialState, action) => {
  switch (action.type) {
    case DID_MATCH:
      return { ...state, didMatch: action.match };
    case POTENTIAL_MATCHES:
      return { ...state, potentials: action.data.reverse() };
    case LOADING:
      return { ...state, loading: action.value };
    case SWIPE:
      return {
        ...state
      };
    default:
      return state;
  }
};
