import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, readdir, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".mp4": "video/mp4",
  ".ico": "image/x-icon",
};
let browser;
let origin;
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    let filename = path.resolve(root, `.${pathname}`);
    if (filename !== root && !filename.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end();
      return;
    }
    let info = await stat(filename);
    if (info.isDirectory()) {
      filename = path.join(filename, "index.html");
      info = await stat(filename);
    }
    let start = 0;
    let end = info.size - 1;
    let status = 200;
    const headers = {
      "Content-Type":
        types[path.extname(filename)] || "application/octet-stream",
      "Accept-Ranges": "bytes",
    };
    const range = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range || "");
    if (range) {
      start = Number(range[1]);
      end = range[2] ? Math.min(Number(range[2]), end) : end;
      if (start > end) {
        response
          .writeHead(416, { "Content-Range": `bytes */${info.size}` })
          .end();
        return;
      }
      status = 206;
      headers["Content-Range"] = `bytes ${start}-${end}/${info.size}`;
    }
    headers["Content-Length"] = end - start + 1;
    response.writeHead(status, headers);
    if (request.method === "HEAD") response.end();
    else {
      const stream = createReadStream(filename, { start, end });
      response.on("close", () => stream.destroy());
      stream.pipe(response);
    }
  } catch {
    if (!response.headersSent) response.writeHead(404);
    response.end();
  }
});

before(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
});
after(async () => {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

for (const width of [390, 834, 1440]) {
  for (const route of ["/", "/simulation/"]) {
    test(`${route} at ${width}px: layout, resources, and accessibility`, async () => {
      const context = await browser.newContext({
        viewport: { width, height: 950 },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("response", (response) => {
        if (response.url().startsWith(origin) && response.status() >= 400)
          errors.push(`${response.status()} ${response.url()}`);
      });
      await page.goto(origin + route, { waitUntil: "networkidle" });
      assert.equal(await page.locator("h1").count(), 1);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
        "Page must fit the viewport",
      );
      const analysis = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      assert.deepEqual(
        analysis.violations.map(({ id, nodes }) => ({
          id,
          elements: nodes.map((node) => node.target),
        })),
        [],
      );
      assert.deepEqual(errors, []);
      if (process.env.DREAM_SCREENSHOT_DIR && width !== 834) {
        await mkdir(process.env.DREAM_SCREENSHOT_DIR, { recursive: true });
        const name = route === "/" ? "home" : "simulation";
        await page.screenshot({
          path: path.join(
            process.env.DREAM_SCREENSHOT_DIR,
            `${name}-${width}.png`,
          ),
          fullPage: false,
        });
      }
      await context.close();
    });
  }
}

test("gallery filters, reset, linked run, and complete result counts", async () => {
  const page = await browser.newPage();
  await page.goto(`${origin}/simulation/`);
  assert.equal(await page.locator("[data-attempt]:visible").count(), 50);
  assert.equal(await page.locator("#evaluation tbody tr").count(), 50);
  assert.equal(
    await page.locator("#evaluation .outcome-badge.success").count(),
    38,
  );
  await page.locator('[data-outcome-filter="failure"]').click();
  assert.equal(await page.locator("[data-attempt]:visible").count(), 12);
  await page.locator("#search-filter").fill("no-such-object");
  assert.equal(await page.locator("[data-attempt]:visible").count(), 0);
  assert.equal(await page.locator("#gallery-empty").isVisible(), true);
  await page.locator("#reset-filters").click();
  assert.equal(await page.locator("[data-attempt]:visible").count(), 50);
  const scene = await page
    .locator("[data-attempt]")
    .first()
    .getAttribute("data-scene");
  await page.locator("#scene-filter").selectOption(scene);
  assert.equal(await page.locator("[data-attempt]:visible").count(), 1);
  const target = await page.locator("[data-attempt]").last().getAttribute("id");
  await page.evaluate((id) => {
    location.hash = id;
  }, target);
  await page.waitForFunction(
    (id) => !document.getElementById(id).hidden,
    target,
  );
  assert.equal(await page.locator("[data-attempt]:visible").count(), 50);
  const report = JSON.parse(
    await readFile(path.join(root, "simulation/evaluation.json"), "utf8"),
  );
  assert.equal(
    report.completed,
    report.results.filter((row) => row.strict_pass).length,
  );
  assert.equal(new Set(report.results.map((row) => row.scene)).size, 50);
  await page.close();
});

test("every gallery video belongs to the reported current cohort", async () => {
  const report = JSON.parse(
    await readFile(path.join(root, "simulation/evaluation.json"), "utf8"),
  );
  const videos = JSON.parse(
    await readFile(path.join(root, "simulation/videos.json"), "utf8"),
  );
  assert.equal(videos.protocol_sha256, report.protocol_sha256);
  assert.equal(videos.new_policy_execution, false);
  assert.deepEqual(
    videos.results.map((row) => row.name).sort(),
    report.results.map((row) => row.name).sort(),
  );
  const page = await browser.newPage();
  await page.goto(`${origin}/simulation/`);
  const published = [];
  for (const row of videos.results) {
    const outcome = report.results.find((result) => result.name === row.name);
    assert.equal(row.qualified_success, outcome.strict_pass);
    assert.equal(row.robot_action_seconds, outcome.robot_action_seconds);
    assert.ok(Object.values(row.checks).every(Boolean));
    assert.ok(Object.values(row.head_checks).every(Boolean));
    assert.equal(row.semantic_counts_match, true);
    assert.ok(row.semantic_updates > 0);
    const card = page.locator(`[data-attempt="${row.name}"]`);
    assert.equal(await card.count(), 1);
    assert.equal(
      await card.getAttribute("data-outcome"),
      row.qualified_success ? "success" : "failure",
    );
    assert.equal(
      await card.locator("video source").getAttribute("src"),
      `../${row.videos.overview.file}`,
    );
    for (const [kind, video] of Object.entries(row.videos)) {
      assert.equal(video.playback_speed, kind === "overview" ? 12 : 1);
      const bytes = await readFile(path.join(root, video.file));
      assert.equal(bytes.length, video.bytes);
      assert.equal(
        createHash("sha256").update(bytes).digest("hex"),
        video.sha256,
      );
      assert.ok((await stat(path.join(root, video.poster))).size > 0);
      published.push(path.basename(video.file));
    }
  }
  assert.equal(published.length, 54);
  const stored = (
    await readdir(path.join(root, "media/simulation/current50"))
  ).filter((name) => name.endsWith(".mp4"));
  assert.deepEqual(stored.sort(), published.sort());
  const topLevel = await readdir(path.join(root, "media/simulation"));
  assert.deepEqual(topLevel.sort(), [
    "current50",
    "long_search_07.mp4",
    "long_search_07_grasp.mp4",
    "long_search_07_place.mp4",
  ]);
  await page.close();
});

test("citation copy, playback, and current trial video links", async () => {
  const context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  await page.goto(origin);
  await page.locator("[data-copy-target]").click();
  assert.match(
    await page.evaluate(() => navigator.clipboard.readText()),
    /@misc\{yan2026/,
  );
  await page.goto(`${origin}/simulation/?video=01&t=2#trial-01`);
  await page.waitForFunction(
    () => document.querySelector("#trial-01 video").currentTime >= 2,
  );
  await page.locator("#trial-01 .video-play").click();
  await page.waitForFunction(() => {
    const v = document.querySelector("#trial-01 video");
    return !v.paused && v.currentTime > 2;
  });
  await page.locator("#trial-02 .video-play").click();
  await page.waitForFunction(
    () =>
      document.querySelector("#trial-01 video").paused &&
      !document.querySelector("#trial-02 video").paused,
  );
  await context.close();
});

test("essential page content and videos work with JavaScript disabled", async () => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${origin}/simulation/`);
  assert.equal(await page.locator("[data-attempt]:visible").count(), 50);
  await page.locator("#evaluation .outcome-details > summary").click();
  assert.equal(await page.locator("#evaluation tbody tr:visible").count(), 50);
  assert.equal(
    await page.locator("[data-attempt] video[controls]").count(),
    50,
  );
  await context.close();
});

test("long-search recording preserves its separate endpoint and supports seeking", async () => {
  const page = await browser.newPage();
  await page.goto(`${origin}/simulation/#long-search-07`);
  const report = JSON.parse(
    await readFile(path.join(root, "simulation/long-search.json"), "utf8"),
  );
  assert.equal(report.selected_cases, 4);
  assert.equal(report.qualified_supplemental_successes, 1);
  assert.equal(report.main_cohort_successes, 38);
  assert.equal(report.main_cohort_attempts, 50);
  assert.equal(
    report.cases.find((row) => row.case === "07").robot_action_seconds,
    4723.7,
  );
  assert.equal(await page.locator("[data-attempt]").count(), 50);
  await page.locator("#long-search-07 video").evaluate((video) => {
    video.preload = "auto";
    video.load();
  });
  await page.waitForFunction(
    () => document.querySelector("#long-search-07 video").readyState >= 2,
  );
  const duration = await page
    .locator("#long-search-07 video")
    .evaluate((video) => video.duration);
  assert.ok(Math.abs(duration - 4723.7 / 24) < 0.2);
  await page.locator("#long-search-07 video").evaluate(async (video) => {
    video.currentTime = video.duration - 2;
    await video.play();
  });
  await page.waitForFunction(() => {
    const video = document.querySelector("#long-search-07 video");
    return video.currentTime > video.duration - 1.5;
  });
  assert.equal(
    await page
      .locator("#long-search-07 video")
      .evaluate((video) => video.error),
    null,
  );
  const file = await stat(
    path.join(root, "media/simulation/long_search_07.mp4"),
  );
  assert.ok(file.size < 50 * 1024 * 1024);
  await page.close();
});
