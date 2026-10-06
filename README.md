# Mutation in genetic algorithms

[![Live demo](https://img.shields.io/badge/Live_demo-GitHub_Pages-2ea44f?logo=github)](https://josemagalan.github.io/mutation-ga/)
[![Tests](https://github.com/josemagalan/mutation-ga/actions/workflows/tests.yml/badge.svg)](https://github.com/josemagalan/mutation-ga/actions/workflows/tests.yml)
[![Code: MIT](https://img.shields.io/badge/Code-MIT-yellow.svg)](LICENSE)
[![Content: CC BY 4.0](https://img.shields.io/badge/Content-CC_BY_4.0-lightgrey.svg)](LICENSE-CONTENT.md)
[![D3.js v7 · no build](https://img.shields.io/badge/D3.js_v7-no_build-f9a03c?logo=d3dotjs&logoColor=white)](https://d3js.org/)
[![Languages: ES | EN](https://img.shields.io/badge/Languages-ES_%7C_EN-blue.svg)](#features)
[![Purpose: Teaching tool](https://img.shields.io/badge/Purpose-Teaching_tool-informational.svg)](#pedagogical-purpose)

**José Manuel Galán**¹ · **Silvia Díaz-de la Fuente**² · **Virginia Ahedo**¹ · **María Pereda**³ · **José Ignacio Santos**¹

¹ Universidad de Burgos · ² Universidad de Salamanca · ³ Universidad Politécnica de Madrid
All authors are members of the Los Goonies research group (Group of Organization and Industrial Engineering and Simulation).

---

## Overview

Mutation is how a genetic algorithm randomly changes a small part of a solution to bring new variety into the population, and how it has to be done depends on how each solution is represented: flipping a value makes sense in a bit string, but on a permutation it produces repeated genes, and on real numbers the size of the step matters as much as the step itself. This interactive tool shows, step by step and in Spanish or English, how the classic mutation operators work for binary, integer, real-valued and permutation representations, and lets students practise predicting the mutant and compare how much each operator changes and what it keeps from the parent.

It is the sister tool of [Crossover in genetic algorithms](https://github.com/josemagalan/crossover-ga), with the same approach and features. It runs entirely in the browser, with no build step and no server: open `index.html` or use the [live demo](https://josemagalan.github.io/mutation-ga/).

## Implemented operators

| Representation | Operators |
| --- | --- |
| Binary | Bit-flip (per-position probability pm; “flip the bit” and “random allele” variants) and single-bit mutation |
| Integer | Random resetting and creep mutation (maximum step s; clamp or wrap-around at the bounds) |
| Real-valued | Uniform, non-uniform (Michalewicz; search progress t/T and b), Gaussian (σ) and polynomial (Deb; η); each with an extra panel showing the distribution of the mutated value |
| Permutation | Swap, insert, inversion (the 2-opt move) and scramble, plus a counterexample showing why random resetting fails on permutations |
| Tree (genetic programming) | Subtree and point mutation — coming soon |

## Features

- **Step-by-step animation** of every operator with a narration of each step, in Spanish and English: the mutant starts as a copy of the parent, the random number of each position is revealed, and genes that change value flip while genes that move fly to their new place.
- **Your own examples:** random parents with a reproducible seed or parents entered by hand, draggable markers for the chosen positions or stretch, operator parameters as sliders and “draw again” for the random numbers; the current example is saved in the URL, ready to project in class or share.
- **Learn more panel:** explanation of the method (grounded in Talbi’s properties of a good mutation: ergodicity, validity and locality), pseudocode that highlights the line of the current step, Python and JavaScript implementations to copy or download (tested to give exactly the same mutant as the tool with the same random numbers), and references, with the course’s core textbooks (Talbi, 2009; Bautista-Valhondo, 2020) always first after the original source.
- **Distribution of the mutated value:** for real-valued operators, a histogram of 4000 simulated mutations of the current gene, with the parent’s and the mutant’s values, so that the effect of σ, η or t/T on the size of the jumps can be seen at a glance.
- **Practice mode (“predict the mutant”):** since everything in mutation is random, the drawn numbers (or the chosen positions and stretch) are given, exactly as the operator uses them; students write the mutant and it is checked gene by gene.
- **Compare operators:** one screen per representation applies every mutation to the same parent, colours each mutant gene by what happened to it, and sums up how much each operator changes and what it keeps, averaged either over 1000 mutations of that same parent or over 1000 random parents of the same length (10 mutations each): Hamming distance for binary; genes that change, average jump and small jumps for integer and real values; position, adjacencies, circular relative order, copies of the parent and validity for permutations.
- **Question banks for Moodle (for teachers):** generates graded questions in Moodle XML — compute the mutant (cloze, one box per gene) for bit-flip, creep, Gaussian, swap, insert and inversion; identify the operator (swap, insert, inversion or scramble); and spot the mistake in bit-flip and inversion — in three difficulty levels, one category per operator, type and level, ready for Moodle’s random questions. Each question’s general feedback gives the solution and links to the step-by-step solution of that very exercise in the tool.
- **Chromosomes as routes:** for permutation mutations, each gene becomes a city and each chromosome a travelling-salesman route; the parent’s and the mutant’s routes are drawn side by side, with the new stretches marked and the change in length — inversion visibly changes only two edges.

## Pedagogical purpose

The tool is designed for undergraduate courses on metaheuristics, evolutionary computation and industrial engineering (production scheduling, sequencing, routing). It can be projected in lectures to walk through each operator, used by students on their own to check hand-worked exercises in practice mode, or used in seminars to discuss why different representations need different operators, how the mutation rate and step size trade exploration for fine-tuning, and what each operator preserves.

## Running locally

Open `index.html` in any modern browser. No server or internet connection is needed: D3 v7 is bundled in `vendor/`.

Keyboard: ← → step back/forward, Space play/pause, Home back to the start.

## Tests

Requires Node.js 22 or later; Python 3 is optional (it is used to test the downloadable Python code as well).

```
npm test
```

The tests check every operator (worked examples, thousands of random cases contrasted with an independent implementation, statistical properties such as the bit-flip rate, the uniformity of the scramble and the shape of the real-valued distributions), that the downloadable code gives the same mutant as the tool with the same random numbers, that the pseudocode is linked to the animation steps, that the practice mode gives enough data for a unique answer, the comparison metrics (including the averages over random parents, reproducible and independent of how they are split into batches) and the Moodle question generator (stored answers match what the question shows, one correct option, well-formed XML, links that reproduce each exercise). They run on every push with GitHub Actions.

## Project structure

| Path | Contents |
| --- | --- |
| `index.html`, `css/` | Page and styles |
| `js/registry.js`, `js/home.js` | Catalogue of representations and operators; home screen |
| `js/operators/` | Logic of each operator: a pure function returning the mutant and the trace of steps |
| `js/viz/` | D3 views that draw the trace (with the random numbers and the distribution panel), and the route maps |
| `js/content/` | Teaching content of each operator: explanation, narration, pseudocode, downloadable code and references |
| `js/practice.js` | “Predict the mutant”: the data that make the answer unique, and the grading |
| `js/compare.js`, `js/compare-view.js` | “Compare operators”: metrics and screen |
| `js/moodle.js`, `js/moodle-page.js` | Moodle question-bank generator (Moodle XML) and its page |
| `js/learn.js`, `js/about.js`, `js/app.js` | “Learn more” panel, about page and footer, page controller |
| `js/i18n.js`, `js/rng.js`, `js/cities.js` | Spanish and English texts; seeded random generator; random cities |
| `img/logos/`, `vendor/` | Institution logos; D3.js v7 |
| `tests/` | Tests with `node:test` |

## How to cite

A paper describing this tool is in preparation. In the meantime, if you would like to cite it, please contact the authors.

## License

- Code, including the downloadable Python and JavaScript implementations: MIT (see [LICENSE](LICENSE)).
- Teaching texts (explanations, step narration and pseudocode): CC BY 4.0 (see [LICENSE-CONTENT.md](LICENSE-CONTENT.md)).
- D3.js: ISC licence (see [vendor/d3-LICENSE](vendor/d3-LICENSE)).

## Acknowledgements

We thank Anthropic’s Claude for Science programme for supporting the development of this tool, which was built with the help of Claude.

<p>
  <img src="img/logos/ubu.png" alt="Universidad de Burgos" height="56">&nbsp;&nbsp;
  <img src="img/logos/usal.png" alt="Universidad de Salamanca" height="44">&nbsp;&nbsp;
  <img src="img/logos/upm.png" alt="Universidad Politécnica de Madrid" height="44">&nbsp;&nbsp;
  <img src="img/logos/goonies.png" alt="Los Goonies research group" height="44">
</p>
