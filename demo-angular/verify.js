(async () => {
    const { spawnSync } = require("child_process");
    const { renameSync } = require("fs");

    const { execute } = require("verify-ns-build");

    const verify = async (config, update, reportDir) => {
        const { success } = await execute({
            config,
            update,
        });

        if (!success) {
            throw new Error("Verification failed! Check out the report in ./verify-report.");
        }

        renameSync("verify-report", reportDir);
    };

    const config = "./verify.config.json";
    await verify(config, "none", "latest-verify-report");
    // await verify(config, "next", "next-verify-report");
})();

process.on("unhandledRejection", err => { 
    console.error(err);
    process.exit(1);
});

