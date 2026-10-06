# Mutation in genetic algorithms

**José Manuel Galán**¹ · **Silvia Díaz-de la Fuente**² · **Virginia Ahedo**¹ · **María Pereda**³ · **José Ignacio Santos**¹

¹ Universidad de Burgos · ² Universidad de Salamanca · ³ Universidad Politécnica de Madrid

> Work in progress. Sister tool of [crossover-ga](https://github.com/josemagalan/crossover-ga): same approach, applied to mutation operators.

Interactive teaching tool that shows, step by step and in Spanish or English, how the classic mutation operators of genetic algorithms work for each representation, and why each representation needs its own.

It runs entirely in the browser, with no build step and no server: open `index.html`. D3 v7 is bundled in `vendor/`.

## Status

| Representation | Operators | Status |
| --- | --- | --- |
| Binary | Bit-flip (flip / random allele variants), single-bit | Available |
| Integer | Random resetting, creep (clamp / wrap variants) | Available |
| Real-valued | Uniform, non-uniform (Michalewicz), Gaussian, polynomial (Deb), with the distribution of the mutated value | Available |
| Permutation | Swap, insert, inversion, scramble, plus a counterexample (random resetting breaks permutations); route view | Available |
| Tree | Subtree, point | Coming soon |

## Tests

Requires Node.js 22 or later; Python 3 is optional (used to test the downloadable Python code too).

```
npm test
```

## License

- Code, including the downloadable Python and JavaScript implementations: MIT (see [LICENSE](LICENSE)).
- Teaching texts (explanations, step narration and pseudocode): CC BY 4.0 (see [LICENSE-CONTENT.md](LICENSE-CONTENT.md)).
- D3.js: ISC licence (see [vendor/d3-LICENSE](vendor/d3-LICENSE)).
