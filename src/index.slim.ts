import type {Container} from "./Core/Container";
import {Loader} from "./Core/Loader";
import type {IOptions} from "./Options/Interfaces/IOptions";
import type {RecursivePartial} from "./Types/RecursivePartial";
import {ShapeType} from "./Enums/ShapeType";
import {LineDrawer} from "./Core/Particle/ShapeDrawers/LineDrawer";
import {CircleDrawer} from "./Core/Particle/ShapeDrawers/CircleDrawer";
import {SquareDrawer} from "./Core/Particle/ShapeDrawers/SquareDrawer";
import {TriangleDrawer} from "./Core/Particle/ShapeDrawers/TriangleDrawer";
import {StarDrawer} from "./Core/Particle/ShapeDrawers/StarDrawer";
import {PolygonDrawer} from "./Core/Particle/ShapeDrawers/PolygonDrawer";
import {TextDrawer} from "./Core/Particle/ShapeDrawers/TextDrawer";
import {ImageDrawer} from "./Core/Particle/ShapeDrawers/ImageDrawer";
import type {IShapeDrawer} from "./Core/Interfaces/IShapeDrawer";
import type {
    ShapeDrawerAfterEffectFunction,
    ShapeDrawerDestroyFunction,
    ShapeDrawerDrawFunction,
    ShapeDrawerInitFunction
} from "./Types/ShapeDrawerFunctions";
import {Plugins} from "./Utils/Plugins";
import type {IPlugin} from "./Core/Interfaces/IPlugin";

declare global {
    interface Window {
        customRequestAnimationFrame: (callback: FrameRequestCallback) => number;
        mozRequestAnimationFrame: (callback: FrameRequestCallback) => number;
        oRequestAnimationFrame: (callback: FrameRequestCallback) => number;
        msRequestAnimationFrame: (callback: FrameRequestCallback) => number;
        customCancelRequestAnimationFrame: (handle: number) => void;
        webkitCancelRequestAnimationFrame: (handle: number) => void;
        mozCancelRequestAnimationFrame: (handle: number) => void;
        oCancelRequestAnimationFrame: (handle: number) => void;
        msCancelRequestAnimationFrame: (handle: number) => void;
    }
}

/* ---------- tsParticles functions - start ------------ */

/**
 * Main class for creating the singleton on window.
 * It's a proxy to the static [[Loader]] class
 */
class Main {
    private initialized: boolean;

    constructor() {
        this.initialized = false;

        if (typeof window !== "undefined" && window) {
            window.customRequestAnimationFrame = ((): (callback: FrameRequestCallback) => number => {
                return window.requestAnimationFrame ||
                    window.webkitRequestAnimationFrame ||
                    window.mozRequestAnimationFrame ||
                    window.oRequestAnimationFrame ||
                    window.msRequestAnimationFrame ||
                    ((callback): number => window.setTimeout(callback, 1000 / 60));
            })();

            window.customCancelRequestAnimationFrame = ((): (handle: number) => void => {
                return window.cancelAnimationFrame ||
                    window.webkitCancelRequestAnimationFrame ||
                    window.mozCancelRequestAnimationFrame ||
                    window.oCancelRequestAnimationFrame ||
                    window.msCancelRequestAnimationFrame ||
                    clearTimeout
            })();
        }

        const squareDrawer = new SquareDrawer();
        const textDrawer = new TextDrawer();
        const imageDrawer = new ImageDrawer();

        Plugins.addShapeDrawer(ShapeType.line, new LineDrawer());
        Plugins.addShapeDrawer(ShapeType.circle, new CircleDrawer());
        Plugins.addShapeDrawer(ShapeType.edge, squareDrawer);
        Plugins.addShapeDrawer(ShapeType.square, squareDrawer);
        Plugins.addShapeDrawer(ShapeType.triangle, new TriangleDrawer());
        Plugins.addShapeDrawer(ShapeType.star, new StarDrawer());
        Plugins.addShapeDrawer(ShapeType.polygon, new PolygonDrawer());
        Plugins.addShapeDrawer(ShapeType.char, textDrawer);
        Plugins.addShapeDrawer(ShapeType.character, textDrawer);
        Plugins.addShapeDrawer(ShapeType.image, imageDrawer);
        Plugins.addShapeDrawer(ShapeType.images, imageDrawer);
    }

    /**
     * init method, used by imports
     */
    public init(): void {
        if (!this.initialized) {
            this.initialized = true;
        }
    }

    /**
     * Loads an options object from the provided array to create a [[Container]] object.
     * @param tagId The particles container element id
     * @param params The options array to get the item from
     * @param index If provided gets the corresponding item from the array
     * @returns A Promise with the [[Container]] object created
     */
    public async loadFromArray(tagId: string,
                               params: RecursivePartial<IOptions>[],
                               index?: number): Promise<Container | undefined> {
        return Loader.loadFromArray(tagId, params, index);
    }

    /**
     * Loads the provided options to create a [[Container]] object.
     * @param tagId The particles container element id
     * @param params The options object to initialize the [[Container]]
     * @returns A Promise with the [[Container]] object created
     */
    public async load(tagId: string, params: RecursivePartial<IOptions>): Promise<Container | undefined> {
        return Loader.load(tagId, params);
    }

    /**
     * Loads the provided json with a GET request. The content will be used to create a [[Container]] object.
     * This method is async, so if you need a callback refer to JavaScript function `fetch`
     * @param tagId the particles container element id
     * @param pathConfigJson the json path to use in the GET request
     * @returns A Promise with the [[Container]] object created
     */
    public loadJSON(tagId: string, pathConfigJson: string): Promise<Container | undefined> {
        return Loader.loadJSON(tagId, pathConfigJson);
    }

    /**
     * Adds an additional click handler to all the loaded [[Container]] objects.
     * @param callback The function called after the click event is fired
     */
    public setOnClickHandler(callback: EventListenerOrEventListenerObject): void {
        Loader.setOnClickHandler(callback);
    }

    /**
     * All the [[Container]] objects loaded
     * @returns All the [[Container]] objects loaded
     */
    public dom(): Container[] {
        return Loader.dom();
    }

    /**
     * Retrieves a [[Container]] from all the objects loaded
     * @param index The object index
     * @returns The [[Container]] object at specified index, if present or not destroyed, otherwise undefined
     */
    public domItem(index: number): Container | undefined {
        return Loader.domItem(index);
    }

    /**
     * addShape adds shape to tsParticles, it will be available to all future instances created
     * @param shape the shape name
     * @param drawer the shape drawer function or class instance that draws the shape in the canvas
     * @param init Optional: the shape drawer init function, used only if the drawer parameter is a function
     * @param afterEffect Optional: the shape drawer after effect function, used only if the drawer parameter is a function
     * @param destroy Optional: the shape drawer destroy function, used only if the drawer parameter is a function
     */
    public addShape(shape: string,
                    drawer: IShapeDrawer | ShapeDrawerDrawFunction,
                    init?: ShapeDrawerInitFunction,
                    afterEffect?: ShapeDrawerAfterEffectFunction,
                    destroy?: ShapeDrawerDestroyFunction): void {
        let customDrawer: IShapeDrawer;

        if (typeof drawer === "function") {
            customDrawer = {
                afterEffect: afterEffect,
                draw: drawer,
                destroy: destroy,
                init: init,
            };
        } else {
            customDrawer = drawer;
        }

        Plugins.addShapeDrawer(shape, customDrawer);
    }

    /**
     * addPreset adds preset to tsParticles, it will be available to all future instances created
     * @param preset the preset name
     * @param options the options to add to the preset
     */
    public addPreset(preset: string, options: RecursivePartial<IOptions>): void {
        Plugins.addPreset(preset, options);
    }

    /**
     * addPlugin adds plugin to tsParticles, if an instance needs it it will be loaded
     * @param plugin the plugin implementation of [[IPlugin]]
     */
    public addPlugin(plugin: IPlugin): void {
        Plugins.addPlugin(plugin);
    }
}

const tsParticles = new Main();

/**
 * Loads the provided options to create a [[Container]] object.
 * @deprecated this method is obsolete, please use the new tsParticles.load
 * @param tagId the particles container element id
 * @param params the options object to initialize the [[Container]]
 */
const particlesJS: any = (tagId: string, params: RecursivePartial<IOptions>):
    Promise<Container | undefined> => {
    return tsParticles.load(tagId, params);
};

/**
 * Loads the provided json with a GET request.
 * The content will be used to create a [[Container]] object.
 * @deprecated this method is obsolete, please use the new tsParticles.loadJSON
 * @param tagId the particles container element id
 * @param pathConfigJson the json path to use in the GET request
 * @param callback called after the [[Container]] is loaded and it will be passed as a parameter
 */
particlesJS.load = (tagId: string,
                    pathConfigJson: string,
                    callback: (container: Container) => void): void => {
    tsParticles.loadJSON(tagId, pathConfigJson).then((container) => {
        if (container) {
            callback(container);
        }
    });
};

/**
 * Adds an additional click handler to all the loaded [[Container]] objects.
 * @deprecated this method is obsolete, please use the new tsParticles.setOnClickHandler
 * @param callback the function called after the click event is fired
 */
particlesJS.setOnClickHandler = (callback: EventListenerOrEventListenerObject): void => {
    tsParticles.setOnClickHandler(callback);
};

/**
 * All the [[Container]] objects loaded
 * @deprecated this method is obsolete, please use the new tsParticles.dom
 */
const pJSDom = tsParticles.dom();

export {tsParticles, particlesJS, pJSDom};
