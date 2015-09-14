/**
 * Created by AlexanderC on 6/5/15.
 */

'use strict';

import {FileWalker} from '../Helpers/FileWalker';
import Path from 'path';
import JsonFile from 'jsonfile';


/**
 * DB model class
 */
export class Model {
    /**
     * @param {String} name
     * @param {Object} definition
     */
    constructor(name, definition) {
        this._name = name;
        this._definition = definition;
    }

    /**
     * @param directories
     * @returns {Model[]}
     */
    static create(...directories) {
        let ext = Model.EXTENSION;
        let walker = new FileWalker(FileWalker.RECURSIVE);
        let filter = FileWalker.matchExtensionsFilter(FileWalker.skipDotsFilter(), ext);

        let models = [];

        for (let dir of directories) {
            for (let modelFile of walker.walk(dir, filter)) {
                let name = Path.basename(modelFile, `.${ext}`);
                let definition = JsonFile.readFileSync(modelFile);

                models.push(new Model(name, definition));
            }
        }

        return models;
    }

    /**
     * @returns {String}
     */
    get name() {
        return this._name;
    }

    /**
     * @returns {Object}
     */
    get definition() {
        return this._definition;
    }

    /**
     * @returns {String}
     */
    static get EXTENSION() {
        return 'json';
    }

    /**
     * @returns {Object}
     */
    extract() {
        let obj = {};

        obj[this._name] = this._definition;

        return obj;
    }
}