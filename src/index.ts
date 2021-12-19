import ParticleController from "./particles";
import Mask from "./particles/Mask";
import TownController from "./town";
import {Color} from "./town/town-objects";

new ParticleController('particles', 400, new Mask('public/mask.png'));

new TownController(document.getElementById('town') as HTMLCanvasElement, new Color(0.7, 0.64, 0.62, 1));
