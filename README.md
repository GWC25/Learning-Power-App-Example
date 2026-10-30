# Learning Power App example

A working model of the Learning Studio rebuilt on SharePoint, with a Power Apps canvas app as the way in.

**[Open the app mockup](https://gwc25.github.io/Learning-Power-App-Example/app/)** · **[How to build it in SharePoint](BUILD.md)**

## What it does

Staff find teaching practice in three ways:

- **Find by situation.** Three short questions: what is happening in your teaching, where it happens, and which layer to start from. Nothing is saved, and staff are never asked to rate themselves.
- **Browse practice.** Every resource, filtered by layer, teaching context or keyword.
- **Building blocks.** The Digital Learning Pyramid (Foundations, Inclusion, Innovation), what makes up each layer, and the research behind it.

Every resource is one teaching move shown through four lenses: **Traditional**, **Digital**, **Accessibility** and **Inclusive practice**. Traditional and digital practice are never separated. Staff can switch any lens on or off, so the traditional version, the digital version, or both are always one tap away.

Each resource also has why it works (with research), a video, watch-out-fors, a practice scenario with a model answer, how-to guides, further reading, and links up and down the pyramid.

## What is in it

19 resources across the three layers, drawn from:

- the **Digital Accessibility and Inclusion Day** (23 October 2026): the Super Six guides and the open-clinic screens, with their seven short videos;
- the **Digital Learning Studio** how-to resources (Plickers, mini whiteboards, Forms, Class Materials, pinning posts and more).

All of it has been rewritten in the same plain, step-by-step style and checked against WCAG 2.2 AA.

Pedagogy draws on Rosenshine's Principles of Instruction, Universal Design for Learning, the Question Formulation Technique, cognitive load theory, WCAG 2.2, 21st Century Learning Design and the Digital Skills Framework. Tom Sherrington's freely published Rosenshine Masterclass videos and writing are linked as further reading. The WalkThrus format is not used.

## Repository layout

| Folder | Becomes in SharePoint |
|---|---|
| `lists/` | The five SharePoint lists, as CSV files ready to import |
| `library/videos/` | Videos in the Resource Files library |
| `library/how-to/` | How-to guides in the Resource Files library |
| `app/` | The canvas app (mockup) |
| `scripts/` | The single content source and the build script |

## Changing content

All content lives in `scripts/content.py`. Edit it, then run:

```
python3 scripts/build.py
```

This regenerates `lists/*.csv` and `app/index.html`. Do not edit those files by hand. The how-to guides in `library/how-to/` are edited directly.

## Videos

YouTube videos are used only from channels confirmed as the creator's own or the organisation's: Tom Sherrington, The Learning Scientists and Jon Bergmann. The CAST "UDL at a Glance" video is a CAST production uploaded by College STAR, and is credited as such. The seven library videos are the college's own and have no sound. Each one links to its how-to guide as the text alternative.

## Data rule

This repository is public. It contains no personal names or initials, and no learner or staff data.
