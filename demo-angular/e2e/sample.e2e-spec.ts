import { AppiumDriver, createDriver, LogType, nsCapabilities } from "nativescript-dev-appium";
import { assert } from "chai";

describe("sample scenario", async function() {
    const defaultWaitTime = 5000;
    let driver: AppiumDriver;

    before(async function() {
        nsCapabilities.testReporter.context = this;
        driver = await createDriver();
    });

    after(async function() {
        await driver.quit();
        console.log("Quit driver!");
    });

    afterEach(async function () {
        if (this.currentTest.state === "failed") {
            await driver.logTestArtifacts(this.currentTest.title);
        }
    });

    it("assert logs from worker loaders", async function() {
        const expectedMsgs = ['Inside JS worker...', '{', '}', 'data": "Js worker loader executed!"', 'Inside TS worker...', '"data": "Ts worker loader executed!"', 'TS Worker'];
        const logType = driver.isAndroid ? LogType.logcat : LogType.syslog;
        await driver.wait(driver.defaultWaitTime);
        const logs = await driver.getlog(logType);
        console.log("LOGS: ", logs);
        const filter = driver.isAndroid ? "JS      :" : "";
        const filteredLogs = logs.filter(line => line.message.includes(filter)).map(t => t.message);
        console.log("", filteredLogs);
        expectedMsgs.forEach(msg => {
            console.log(`Contains expectedMessages '${msg}' ? ${filteredLogs.some(l => l.includes(msg))} `);
            console.log();
            assert.isTrue(filteredLogs.some(l => l.includes(msg)));
        });
    });
});