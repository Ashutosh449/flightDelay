/**
 * Deployment script for FlightDelay
 *
 * @author Christoph Mussenbrock
 * @description Deploy FlightDelayController
 * @copyright (c) 2017 etherisc GmbH
 *
 */
const log = require('../util/logger');

const FlightDelayAccessController = artifacts.require('FlightDelayAccessController.sol');

module.exports = (deployer, network, accounts) => {

    log.info('Deploy FlightDelayAccessController contract');

    return deployer.deploy(FlightDelayAccessController, '0xf5c3086d42cb2857ad5f52c134fc3e698e8e9edd');

};
