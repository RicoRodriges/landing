import { Action } from "./Action";
import { Direction } from "./Direction";
import Maze from "./Maze";

export default class Runner {
    private static readonly PROGRESS_SPEED = 2;

    private readonly maze: Maze;

    private currentX: number;
    private currentY: number;
    private currentDirection: Direction;
    private auto: boolean; // generate actions automatically

    private currentAction: Action | undefined;
    private nextAction: Action | undefined;

    private currentMoveProgress = 0; // [0..100]
    private currentRotateProgress = 0; // [-100..100]

    public constructor(maze: Maze, auto: boolean) {
        this.maze = maze;
        this.currentX = Math.floor(Math.random() * maze.getWidth());
        this.currentY = Math.floor(Math.random() * maze.getHeight());
        this.currentDirection = [Direction.North, Direction.South, Direction.West, Direction.East][Math.floor(Math.random() * 4)];
        this.auto = auto;
    }

    public setAction(a: Action) {
        this.nextAction = a;
    }

    public getCurrentCell(): [number, number] {
        return [this.currentX, this.currentY];
    }

    public getMoveProgress() {
        return this.currentMoveProgress;
    }

    public getDirection() {
        return this.currentDirection;
    }

    public getRotateProgress() {
        return this.currentRotateProgress;
    }

    public update() {
        switch(this.currentAction) {
            case Action.UP: {
                this.currentMoveProgress += Runner.PROGRESS_SPEED;
                if (this.currentMoveProgress >= 100) {
                    this.currentAction = undefined;
                    this.currentMoveProgress = 0;
                    if (this.currentDirection === Direction.North) {
                        ++this.currentY;
                    } else if (this.currentDirection === Direction.South) {
                        --this.currentY;
                    } else if (this.currentDirection === Direction.West) {
                        --this.currentX;
                    } else if (this.currentDirection === Direction.East) {
                        ++this.currentX;
                    }
                }
                break;
            }
            case Action.LEFT: {
                this.currentRotateProgress += Runner.PROGRESS_SPEED;
                if (this.currentRotateProgress >= 100) {
                    this.currentAction = undefined;
                    this.currentRotateProgress = 0;
                    this.currentDirection = Runner.GetLeft(this.currentDirection);
                }
                break;
            }
            case Action.RIGHT: {
                this.currentRotateProgress -= Runner.PROGRESS_SPEED;
                if (this.currentRotateProgress <= -100) {
                    this.currentAction = undefined;
                    this.currentRotateProgress = 0;
                    this.currentDirection = Runner.GetRight(this.currentDirection);
                }
                break;
            }
            case undefined: {
                if (this.nextAction !== undefined) {
                    
                    let validAction = true;
                    if (this.nextAction === Action.UP && this.maze.hasWall(this.currentX, this.currentY, this.currentDirection)) {
                        validAction = false;
                    }
                    
                    if (validAction) {
                        this.currentAction = this.nextAction;
                    }
                    this.nextAction = undefined;
                } else if (this.auto) {
                    const mayUp = !this.maze.hasWall(this.currentX, this.currentY, this.currentDirection);
                    const mayLeft = !this.maze.hasWall(this.currentX, this.currentY, Runner.GetLeft(this.currentDirection));
                    const mayRight = !this.maze.hasWall(this.currentX, this.currentY, Runner.GetRight(this.currentDirection));
                    if (!mayUp) {
                        if (!mayLeft && !mayRight) {
                            // no ways, go down
                            const action = Math.random() < 0.5 ? Action.LEFT : Action.RIGHT;
                            this.currentAction = action;
                            this.nextAction = action;
                        } else if (mayLeft && mayRight) {
                            this.nextAction = Math.random() < 0.5 ? Action.LEFT : Action.RIGHT;
                        } else if (mayLeft) {
                            this.nextAction = Action.LEFT;
                        } else if (mayRight) {
                            this.nextAction = Action.RIGHT;
                        }
                    } else {
                        if (!mayLeft && !mayRight) {
                            // no ways, go up
                            this.nextAction = Action.UP;
                        } else if (Math.random() < 0.8) {
                            this.nextAction = Action.UP;
                        } else if (mayLeft && mayRight) {
                            this.nextAction = Math.random() < 0.5 ? Action.LEFT : Action.RIGHT;
                        } else if (mayLeft) {
                            this.nextAction = Action.LEFT;
                        } else if (mayRight) {
                            this.nextAction = Action.RIGHT;
                        }
                    }
                }
                break;
            }
        }
    }

    public setAuto(m: boolean) {
        this.auto = m;
    }

    private static GetLeft(d: Direction) {
        switch (d) {
            case Direction.North:
                return Direction.West;
            case Direction.West:
                return Direction.South;
            case Direction.South:
                return Direction.East;
            case Direction.East:
                return Direction.North;
            default:
                throw new Error("Invalid direction");
        }
    }

    private static GetRight(d: Direction) {
        switch (d) {
            case Direction.North:
                return Direction.East;
            case Direction.East:
                return Direction.South;
            case Direction.South:
                return Direction.West;
            case Direction.West:
                return Direction.North;
            default:
                throw new Error("Invalid direction");
        }
    }
}