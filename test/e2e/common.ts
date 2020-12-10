import {browser, protractor} from 'protractor';

let EC = protractor.ExpectedConditions;
const delays = require('./delays');
const fs = require('fs');

/**
 * Common functions to be used in multiple e2e tests.
 */

function typeIn(inputField, text) {

    browser.wait(EC.visibilityOf(inputField), delays.ECWaitTime);
    inputField.clear();
    for (let i in text) {
        inputField.sendKeys(text[i]);
    }
    return inputField;
}


function click(element) {

    browser.wait(EC.visibilityOf(element), delays.ECWaitTime);
    return element.click();
}


function rightClick(element) {

    browser.wait(EC.visibilityOf(element), delays.ECWaitTime);
    browser.actions().click(element, protractor.Button.RIGHT).perform();
}


function doubleClick(element) {

    browser.wait(EC.visibilityOf(element), delays.ECWaitTime);
    browser.actions().doubleClick(element).perform();
}


function clickWithControlKey(element) {

    browser.wait(EC.visibilityOf(element), delays.ECWaitTime);
    browser.actions()
        .mouseMove(element)
        .keyDown(protractor.Key.CONTROL)
        .click()
        .keyUp(protractor.Key.CONTROL)
        .perform();
}


function hover(element) {

    browser.wait(EC.visibilityOf(element), delays.ECWaitTime);
    browser.actions().mouseMove(element).perform();
}


function resetConfigJson(): Promise<any> {

    const configPath = browser.params.configPath;
    const configTemplate = browser.params.configTemplate;

    return new Promise(resolve => {
        fs.writeFile(configPath, JSON.stringify(configTemplate), err => {
            if (err) console.error('Failure while resetting config.json', err);
            resolve();
        });
    });
}


function resetApp(): Promise<any> {

    return new Promise(resolve => {
        require('request').post('http://localhost:3003/reset', () => {
            resolve();
        });
    });
}


module.exports = {
    typeIn: typeIn,
    click: click,
    rightClick: rightClick,
    doubleClick: doubleClick,
    clickWithControlKey: clickWithControlKey,
    hover: hover,
    resetConfigJson: resetConfigJson,
    resetApp: resetApp
};
