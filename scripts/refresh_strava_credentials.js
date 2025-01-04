#!/usr/bin/env node
//
// Log a user into Strava and write the cookies to stdout for later use.
import puppeteer from "puppeteer";

const STRAVA_EMAIL = process.env.STRAVA_EMAIL;
const STRAVA_PASSWORD = process.env.STRAVA_PASSWORD;
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const REQUIRED_COOKIE_NAMES = [
    "CloudFront-Policy",
    "CloudFront-Key-Pair-Id",
    "CloudFront-Signature",
    "_strava4_session",
];

let browser = await puppeteer.launch({
    headless: true,
    devtools: false,
    timeout: 0,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled",],
});

const page = await browser.newPage();

await page.setUserAgent(USER_AGENT);
await page.setViewport({width: 1280, height: 800});

await page.goto("https://www.strava.com/login", {waitUntil: "networkidle2"});

await page.type("#desktop-email", STRAVA_EMAIL);
await page.type("#desktop-current-password", STRAVA_PASSWORD);

let submitLoginElement = await page.waitForSelector('button[type="submit"]:not([disabled])', {visible: true});
await submitLoginElement.click()
await page.waitForNavigation({waitUntil: "networkidle2"});

await page.goto("https://www.strava.com/maps/global-heatmap");
await page.waitForResponse((response) => response.url().includes("heatmap-external"));

let cookies = await browser.cookies();
let stravaId = cookies.find((c) => c.name === "strava_remember_id").value;
let stravaCookies = cookies
    .filter((c) => REQUIRED_COOKIE_NAMES.includes(c.name))
    .map((c) => `${c.name}=${c.value}`)
    .join(";");

console.log(`STRAVA_ID='${stravaId}'`);
console.log(`STRAVA_COOKIES='${stravaCookies}'`);
