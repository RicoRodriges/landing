import ParticleController from "./particles";
import Mask from "./particles/Mask";
import TownController from "./town";
import {Color} from "./town/town-objects";
import {getState, setState, State} from "./landscape";
import ObjController, {loadMtlFile, loadObjFile, ProgType} from "./obj";
import OBJ from "./WebGL/parsers/obj";
import {Material} from "./WebGL/parsers/mtl";

(function () {
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

(function () {
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

(function () {
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

(function () {
    const resetText = 'Начать заново';
    const objects: { [k: string]: { name: string, handler: Map<string, ProgType> }[] } = {
        mill: [
            {
                name: "",
                handler: new Map([["Mill", ProgType.POINTS], ["propeller", ProgType.POINTS]])
            },
            {
                name: "Утвердить требования",
                handler: new Map([["Mill", ProgType.LINES], ["propeller", ProgType.LINES]])
            },
            {
                name: "Разработать прототип",
                handler: new Map([["Mill", ProgType.SIMPLE_LIGHT], ["propeller", ProgType.LINES]])
            },
            {
                name: "Разработать рабочий прототип",
                handler: new Map([["Mill", ProgType.SIMPLE_LIGHT], ["propeller", ProgType.SIMPLE_LIGHT]])
            },
            {
                name: "Рефакторинг",
                handler: new Map([["Mill", ProgType.SPECULAR_LIGHT], ["propeller", ProgType.SPECULAR_LIGHT]])
            },
        ],
        grass: [
            {
                name: "Прояснить требования",
                handler: new Map([["Green_platform", ProgType.POINTS], ["Island", ProgType.POINTS]])
            },
            {
                name: "Утвердить требования",
                handler: new Map([["Green_platform", ProgType.LINES], ["Island", ProgType.LINES]])
            },
            {
                name: "Насыпать землю",
                handler: new Map([["Green_platform", ProgType.LINES], ["Island", ProgType.SIMPLE_LIGHT]])
            },
            {
                name: "Посадить газон",
                handler: new Map([["Green_platform", ProgType.SIMPLE_LIGHT], ["Island", ProgType.SIMPLE_LIGHT]])
            },
            {
                name: "Рефакторинг",
                handler: new Map([["Green_platform", ProgType.SPECULAR_LIGHT], ["Island", ProgType.SPECULAR_LIGHT]])
            },
        ],
        tree: [
            {
                name: "Прояснить требования",
                handler: new Map([["Tree", ProgType.POINTS], ["N/A", ProgType.POINTS]])
            },
            {
                name: "Утвердить требования",
                handler: new Map([["Tree", ProgType.LINES], ["N/A", ProgType.LINES]])
            },
            {
                name: "Поставить ствол",
                handler: new Map([["Tree", ProgType.SIMPLE_LIGHT], ["N/A", ProgType.LINES]])
            },
            {
                name: "Наклеить листву",
                handler: new Map([["Tree", ProgType.SIMPLE_LIGHT], ["N/A", ProgType.SIMPLE_LIGHT]])
            },
            {
                name: "Рефакторинг",
                handler: new Map([["Tree", ProgType.SPECULAR_LIGHT], ["N/A", ProgType.SPECULAR_LIGHT]])
            },
        ],
    };

    const objSection = document.getElementById('obj')!;
    const canvas = objSection.querySelector('canvas')!;
    const controls: { [k: string]: { e: HTMLButtonElement, reset: HTMLButtonElement } } = {};
    for (const name of Object.keys(objects)) {
        controls[name] = {
            e: objSection.querySelector<HTMLButtonElement>(`button[name=${name}]`)!,
            reset: objSection.querySelector<HTMLButtonElement>(`button[name=${name}] ~ button`)!,
        };
    }

    const onResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    onResize();
    window.addEventListener('resize', onResize);

    const objPromise = loadObjFile('public/low-poly-mill.obj');
    const mtlPromise = loadMtlFile('public/low-poly-mill.mtl');
    Promise.all([objPromise, mtlPromise]).then((v) => {
        const obj = new ObjController(canvas, v[0] as OBJ, v[1] as Map<string, Material>, 3.1, [0, 0, 0]);

        for (const [name, el] of Object.entries(controls)) {
            let stageNum = 0;
            const stages = objects[name];

            const nextStage = () => {
                stageNum = Math.min(stageNum + 1, stages.length - 1);
                el.e.innerHTML = stages[Math.min(stageNum + 1, stages.length - 1)].name;
                stages[stageNum].handler.forEach((v, k) => obj.setProperty(k, v));
            };

            const reset = () => {
                stageNum = 0;
                el.e.innerHTML = stages[stageNum + 1].name;
                el.reset.innerHTML = resetText;
                stages[stageNum].handler.forEach((v, k) => obj.setProperty(k, v));
            };

            el.e.addEventListener('click', nextStage);
            el.reset.addEventListener('click', reset);
            reset();
        }
        //console.log(obj.objectNames);
    });
})();