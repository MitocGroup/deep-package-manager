/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import Joi from 'joi';

/**
 * Abstraction on Joi validation expressions
 */
export class JoiHelper {
    /**
     * List expression
     *
     * @returns {*}
     */
    static list() {
        return Joi.array().required();
    }

    /**
     * List expression with predefined values
     *
     * @param {Array} cases
     * @returns {*}
     */
    static listEnum(cases) {
        return JoiHelper.list().allow(cases);
    }

    /**
     * String expression with predefined values
     *
     * @param {Array} cases
     * @returns {*}
     */
    static stringEnum(cases) {
        return JoiHelper.string().allow(cases);
    }

    /**
     * Array of strings expression
     *
     * @returns {*}
     */
    static stringArray() {
        return JoiHelper.list().items(Joi.string());
    }

    /**
     * String or nothing expression
     *
     * @returns {String}
     */
    static maybeString() {
        return Joi.string().optional();
    }

    /**
     * Semantical versioning expression
     *
     * @returns {*}
     */
    static semver() {
        return JoiHelper.string().regex(/^\d+\.\d+\.\d+([a-zA-Z])?$/);
    }

    /**
     * String expression
     *
     * @returns {*|String}
     */
    static string() {
        return Joi.string().required();
    }

    /**
     * Boolean expression
     *
     * @returns {*}
     */
    static bool() {
        return Joi.boolean().required();
    }

    /**
     * Alphanumeric expression
     *
     * @returns {*|String}
     */
    static alnum() {
        return JoiHelper.string().alphanum();
    }

    /**
     * Email expression
     *
     * @returns {*|{type, invalids, rules}}
     */
    static email() {
        return JoiHelper.string().email();
    }

    /**
     * Website expression
     *
     * @returns {*|{type, invalids, rules}}
     */
    static website() {
        return JoiHelper.string().uri();
    }
}
