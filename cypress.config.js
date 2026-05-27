const { defineConfig } = require("cypress");

module.exports = defineConfig({
  allowCypressEnv: false,

  reporter: "mochawesome",
  reporterOptions: {
    reportDir: "cypress/reports/.jsons",
    overwrite: false,
    html: false,
    json: true,
    timestamp: "yyyy-mm-dd_HH-MM-ss",
  },

  viewportWidth: 1920,
  viewportHeight: 1080,

  e2e: {
    setupNodeEvents(on, config) {
      on("before:browser:launch", (browser, launchOptions) => {
        if (browser.name === "chrome" || browser.family === "chromium") {
          launchOptions.args.push("--force-device-scale-factor=1");
          launchOptions.args.push("--window-size=1920,1080");
        }
        return launchOptions;
      });
    },
  },
});
