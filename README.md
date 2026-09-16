# DREAM research website

[Project page](https://bjhyzj.github.io/dream-web/) · [Paper](https://arxiv.org/abs/2606.00576) · [Real-robot code](https://github.com/BJHYZJ/DREAM/tree/realtime) · [Simulation code](https://github.com/BJHYZJ/DREAM/tree/simulation)

This repository hosts the DREAM research overview, method figures, real-robot demonstrations, and simulation results. The site uses semantic HTML, shared CSS, and small JavaScript enhancements. It has no production framework or build step.

## Pages

| Page | Contents |
| --- | --- |
| `index.html` | Research overview, method, physical experiments, resources, and citation |
| `simulation/index.html` | Current residential outcomes and the separate recorded video cohort |
| `simulation/selected.html` | Ten selected target-relocation demonstrations |
| `simulation/evaluation.json` | All 50 outcomes from the 36/50 residential evaluation |
| `simulation/results.json` | Outcomes and video metadata from the separate 27/50 recorded cohort |

The **72% result (36/50)** describes a fixed controller evaluated in 50 development houses. It is distinct from both the 27/50 video cohort and the selected demonstrations. Keep these protocols separate when editing the site. The [public evaluation records](https://github.com/BJHYZJ/DREAM/tree/simulation/reproducibility/evidence/residential-evaluation) contain the corresponding source and outcome hashes.

## Preview

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://localhost:8000`. Pages, figures, results, and native video controls work without JavaScript. JavaScript adds video filters, exclusive playback, stable recording links, and citation copying.

## Development checks

Use Node.js 22 or newer. Browser tooling is needed only for local checks.

```bash
npm ci
npx playwright install --with-deps chromium
npm run check
npm test
```

The tests start a local server, check desktop and mobile layouts, exercise gallery filters and video playback, verify the citation button, and run accessibility checks. `npm run format` formats the HTML, CSS, JavaScript, and tests.

Shared styles and behavior live in `static/css/index.css` and `static/js/index.js`; gallery-specific code lives in `simulation/`. Media paths and the `case-01` through `case-10` anchors are stable because the manuscript links to them. Keep the complete task recordings and source attribution when changing the presentation.
