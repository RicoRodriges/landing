import ParticleController from "./particles";
import Mask from "./particles/Mask";
import TownController from "./town";
import {Color} from "./town/town-objects";
import {getState, setState, State} from "./landscape";

(function() {
    const particleSection = document.getElementById('particles')!;
    const canvas = particleSection.querySelector('canvas')!;

    const onResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    onResize();
    window.addEventListener('resize', onResize);

    const particles = new ParticleController(canvas, 400, new Mask('public/mask.png'));
})();

(function() {
    const townSection = document.getElementById('town')!;
    const canvas = townSection.querySelector('canvas')!;
    const button = townSection.querySelector('button')!;

    const rangeControl = (name: string) => {
        const range = townSection.querySelector<HTMLInputElement>(`input[name=${name}]`)!;
        const span = townSection.querySelector<HTMLSpanElement>(`input[name=${name}] ~ span`)!;
        const onInput = () => span.innerHTML = range.value;
        onInput();
        range.addEventListener('input', onInput);
        return () => parseInt(range.value);
    }
    const sliders = {
        width: rangeControl('width'),
        depth: rangeControl('depth'),
        height: rangeControl('height'),
        roads: rangeControl('roads'),
        population: rangeControl('population'),
        vegetation: rangeControl('vegetation'),
    };

    const onResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    onResize();
    window.addEventListener('resize', onResize);

    let town: TownController | null = null;
    const onButtonClick = () => {
        town?.detach();
        town = new TownController(canvas, new Color(0.7, 0.64, 0.62, 1),
            sliders.width(), sliders.height(), sliders.depth(), sliders.roads(),
            sliders.population(), sliders.vegetation(),
        );
    };
    onButtonClick();
    button.addEventListener('click', onButtonClick);
})();

(function() {
    const id = 'landscape';
    const landscapeSection = document.getElementById(id)!;
    const button = landscapeSection.querySelector('button')!;

    const onClick = () => {
        switch (getState(id)) {
            case State.DAY:
                setState(id, State.NIGHT);
                break;
            case State.NIGHT:
                setState(id, State.DAY);
                break;
        }
    };
    button.addEventListener('click', onClick);
})();