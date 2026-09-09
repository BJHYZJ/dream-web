# DREAM project website

The original real-robot page, figures and videos are retained. The added
[`simulation/`](simulation/index.html) page follows the same site design and
contains ten cross-room dynamic pick-and-place demonstrations at 4× playback.
These are selected executed examples, not an aggregate evaluation table.

## Preview locally

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/` and follow **Simulation**. The normal page works
without a JavaScript build step. For browser seeking, use a server that supports
HTTP byte ranges. Videos are ordinary repository files under
`media/simulation/`; no Git LFS setup or external video host is required.

Public videos use the stable names `01.mp4` through `10.mp4`; their matching
posters use `01.png` through `10.png`. The page presents the video number,
instruction and playback speed. Reproducibility metadata are not duplicated
in this website repository. Full scene provenance, configurations, video
checksums and audit records are maintained in
[DREAM's gallery manifest and guide](https://github.com/BJHYZJ/DREAM/tree/realtime/simulation/evidence/gallery).
Video numbers map directly to the same reproduction profile IDs in the
[DREAM tutorial](https://github.com/BJHYZJ/DREAM/tree/realtime/simulation).
The source-control and evaluator distinctions for videos 05, 07 and 10 remain
documented with the code and summarized on the page.

## Publish after author review

This working copy retains the original Git history and `origin`:
`https://github.com/BJHYZJ/dream-web.git`, branch `master`.
The existing Pages workflow deploys pushes to `master`. Review the local commit
and the rendered page, then push yourself:

```bash
git status
git log -1 --oneline
git push origin master
```

Do not push before the final media/path checks and author acceptance. Code links
target `https://github.com/BJHYZJ/DREAM/tree/realtime/simulation`; push the DREAM
code repository first so these links exist when the site becomes public.
