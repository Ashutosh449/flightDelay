/* eslint-disable no-underscore-dangle */
const utils = require('../util/test-utils.js');

const BigNumber = web3.BigNumber;

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();


contract('FlightDelayLedger', (accounts) => {
    let FD;

    before(async () => {
        FD = await utils.getDeployedContracts(artifacts);
    });

    /*
     * Initilization
     */
    it('controller should be set to FD.Controller', async () => {
        const controller = await FD.LG.controller.call();
        controller.should.be.equal(FD.C.address);
    });

    it('FD.Ledger should be registered in FD.Controller', async () => {
        const addr = await FD.C.getContract.call('FD.Ledger');
        addr.should.be.equal(FD.LG.address);
    });

    /*
     * ConrollerContract functionality
     */
    // todo: check onlyController

    // todo: test setController

    /*
     * setContracts tests
     */
    it('should not be accessed from external account', async () => {
        await FD.LG.setContracts()
            .should.be.rejectedWith(utils.EVMThrow);
    });

    // todo: check permission to methods

    /*
     * fund tests
     */
    it('should accept ETH from FD.Funder', async () => {
        const balanceBefore = web3.eth.getBalance(FD.LG.address);
        const value = web3.toWei(10, 'ether');

        try {
            await FD.LG.sendTransaction({ from: accounts[2], value, });
            assert.ok('should not be rejected');
        } catch (error) {
            utils.assertJump(error);
        }

        const balanceAfter = web3.eth.getBalance(FD.LG.address);

        Number(balanceAfter).should.be.greaterThan(Number(balanceBefore));
        Number(balanceAfter).should.be.equal(Number(value) + Number(balanceBefore));
    });

    /*
     * withdraw
     */
    it('should witdraw', async () => {
        const funderBefore = web3.eth.getBalance(accounts[2]);
        const balanceBefore = web3.eth.getBalance(FD.LG.address);

        await FD.LG.withdraw(Number(balanceBefore), { from: accounts[2] });

        const funderAfter = web3.eth.getBalance(accounts[2]);
        const balanceAfter = web3.eth.getBalance(FD.LG.address);

        Number(web3.fromWei((Number(funderAfter) - Number(funderBefore)) - Number(balanceBefore), 'ether'))
            .should.be.below(0.1);
    });

    it('should not accept ETH from other accounts', async () => {
        try {
            await FD.LG.sendTransaction({ from: accounts[1], value: web3.toWei(10, 'ether'), });
            assert.fail('should be rejected');
        } catch (error) {
            utils.assertJump(error);
        }
    });

    /*
     * receiveFunds test
     */
    it('receiveFunds should receive funds and make bookkeeping', async () => {
        await FD.DB.setAccessControlTestOnly(FD.LG.address, accounts[0], 101, true);
        await FD.DB.setAccessControlTestOnly(FD.LG.address, accounts[0], 103, true);

        const value = web3.toWei(5, 'ether');

        const balanceBefore = web3.eth.getBalance(FD.LG.address);

        const l3before = await FD.DB.ledger(3);
        const l0before = await FD.DB.ledger(0);

        const { logs, } = await FD.LG.receiveFunds(0, { value, });

        const log = logs[0];

        log.event.should.be.equal('LogReceiveFunds');
        log.args._sender.should.be.equal(accounts[0]);
        Number(log.args._to).should.be.equal(0);
        Number(log.args.ethAmount).should.be.equal(Number(value));

        const balanceAfter = web3.eth.getBalance(FD.LG.address);

        (Number(balanceAfter) - Number(balanceBefore))
            .should.be.equal(Number(value));

        const l3after = await FD.DB.ledger(3);
        const l0after = await FD.DB.ledger(0);

        assert.equal(
            Number(l3before) - Number(value),
            Number(l3after)
        );

        assert.equal(
            Number(l0before) + Number(value),
            Number(l0after)
        );

        await FD.DB.setAccessControlTestOnly(FD.LG.address, accounts[0], 101, false);
        await FD.DB.setAccessControlTestOnly(FD.LG.address, accounts[0], 103, false);
    });

    /*
     * sendFunds test
     */
    it('sendFund should cash out payout to customer', async () => {
        await FD.DB.setAccessControlTestOnly(FD.LG.address, accounts[0], 102, true);
        await FD.DB.setAccessControlTestOnly(FD.LG.address, accounts[0], 103, true);

        const value = web3.toWei(5, 'ether');

        const customer = accounts[5];
        const accBalanceBefore = web3.eth.getBalance(customer);
        const lgBalanceBefore = web3.eth.getBalance(FD.LG.address);

        // Payout Acc
        const pyAccBefore = await FD.DB.ledger(2);
        // Balance Acc
        const bAccBefore = await FD.DB.ledger(3);

        const { logs, } = await FD.LG.sendFunds(customer, 2, value);

        const accBalanceAfter = web3.eth.getBalance(customer);
        const lgBalanceAfter = web3.eth.getBalance(FD.LG.address);
        const pyAccAfter = await FD.DB.ledger(2);
        const bAccAfter = await FD.DB.ledger(3);

        assert(
            Number(web3.fromWei(accBalanceAfter), 'ether') - Number(web3.fromWei(accBalanceBefore), 'ether'),
            Number(web3.fromWei(value, 'ether')),
            '5 ethers should be sent to customer account'
        );

        assert(
            Number(web3.fromWei(lgBalanceAfter), 'ether') - Number(web3.fromWei(lgBalanceBefore), 'ether'),
            -Number(web3.fromWei(value, 'ether')),
            '5 ethers should be sent to customer account from FD.Ledger'
        );

        const log = logs[0];

        log.event.should.be.equal('LogSendFunds');
        log.args._recipient.should.be.equal(customer);
        Number(log.args._from).should.be.equal(2);
        Number(log.args.ethAmount).should.be.equal(Number(value));

        assert.equal(
            Number(pyAccBefore) - Number(value),
            Number(pyAccAfter)
        );

        assert.equal(
            Number(bAccBefore) + Number(value),
            Number(bAccAfter)
        );

        await FD.DB.setAccessControlTestOnly(FD.LG.address, accounts[0], 102, false);
        await FD.DB.setAccessControlTestOnly(FD.LG.address, accounts[0], 103, false);
    });

    /*
     * bookkeeping tests
     */
    it('should have equal balances in accounts after booking', async () => {
        await FD.DB.setAccessControlTestOnly(FD.LG.address, accounts[7], 103, true);

        const value = web3.toWei(5, 'ether');

        const balance0before = await FD.DB.ledger(3);
        const balance1before = await FD.DB.ledger(1);

        await FD.LG.bookkeeping(3, 1, value, { from: accounts[7], });

        const balance0after = await FD.DB.ledger(3);
        const balance1after = await FD.DB.ledger(1);

        assert.equal(
            -(Number(balance0after) - Number(balance0before)),
            Number(balance1after) - Number(balance1before),
            'balances are not equal'
        );

        await FD.DB.setAccessControlTestOnly(FD.LG.address, accounts[7], 103, false);
    });

    it('∑ of the ledger accounts should be zero', async () => {
        const b0 = await FD.DB.ledger(0);
        const b1 = await FD.DB.ledger(1);
        const b2 = await FD.DB.ledger(2);
        const b3 = await FD.DB.ledger(3);
        const b4 = await FD.DB.ledger(4);
        const b5 = await FD.DB.ledger(5);

        assert.equal(
            Number(b0) + Number(b1) + Number(b2) + Number(b3) + Number(b4) + Number(b5),
            0
        );
    });

    // todo: test bookkeeping (diffrent variants)
    // todo: should throw on overflow, check if safeMath for various overflows in bookkeeping works

    after(async () => {
        if (web3.version.network < 1000) {
            await FD.C.destructAll({ from: accounts[1], gas: 4700000, });
        }
    });
});
