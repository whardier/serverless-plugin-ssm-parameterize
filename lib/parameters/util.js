'use strict';

const sleep = async (wait) => new Promise((resolve) => setTimeout(() => resolve(), wait));

module.exports = { sleep };
