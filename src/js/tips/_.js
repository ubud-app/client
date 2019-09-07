'use strict';

/* eslint no-unused-vars: 0 */

/**
 * BaseTip
 *
 * @author Sebastian Pekarek
 */
export default class BaseTip {

    /**
     * Returns the tip id.
     *
     * @returns {string}
     */
    static id () {
        throw new Error('Not implemented yet.');
    }

    /**
     * Returns the title parameters which are then
     * passed to ConfigurationHelper.getString
     *
     * @param {object} params
     * @param {string} params.month
     * @returns {object}
     */
    static title (params) {
        return {};
    }

    /**
     * Returns the description parameters which are
     * then passed to ConfigurationHelper.getString
     *
     * @param {object} params
     * @param {string} params.month
     * @returns {object}
     */
    static description (params) {
        return {};
    }

    /**
     * Prepare process by fetching the
     * required collections. These are then
     * passed to your process() method below.
     *
     * @param {object} params
     * @param {string} params.month
     * @param {DocumentModel} params.document
     * @returns {object}
     */
    static async prepare (params) {
        throw new Error('Not implemented yet.');
    }

    /**
     * Does the processing itself. Is
     * called for each budget, so it's good
     * to do the heavy loading in your prepare
     * method above.
     *
     * @param {object} params
     * @param {string} params.budgetId
     * @param {number} params.budgeted
     * @param {number} params.balance
     * @param {number} params.goal
     * @param {object} preparations Result of prepare()
     * @returns {number}
     */
    static process (params, preparations) {
        throw new Error('Not implemented yet.');
    }
}
