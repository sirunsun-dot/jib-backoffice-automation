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

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
