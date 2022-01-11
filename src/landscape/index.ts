
export enum State {
    DAY = "day",
    NIGHT = "night",
}

export function getState(id: string) {
    if (document.querySelector(`#${id} .${State.DAY}`) !== null) {
        return State.DAY;
    } else {
        return State.NIGHT;
    }
}

export function setState(id: string, s: State) {
    const oldS = s === State.DAY ? State.NIGHT : State.DAY;
    const el = document.querySelector(`#${id} .${oldS}`);
    if (el !== null) {
        el.classList.replace(oldS, s);
    }
}