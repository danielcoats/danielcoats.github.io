# Group 15: Advanced editing features for text editors

This repository contains our prototype implementation of line-based regional undo in a text editor. This feature is written in JavaScript and is built on top of the open source [Ace code editor](https://ace.c9.io/).

The idea behind regional undo is that the user can undo or redo the most recent operation performed in a chosen region. In our implementation, a region consists of one or more lines of text.

Two distinct undo models have been prototyped:

1. The document is conceptually a stream of characters, and lines are just the unit of selection.
2. The document as a collection of lines, and linebreak inserts/deletes are special constructor/destructor operations.

Having found that both have their uses, we have implemented on-the-fly switching between the two models. The default (and more well supported) is mode 2.

Both models currently have edge cases where their behaviour is undefined. These edge cases include editing sequences that may arise in normal, unconstrained text editor use. As such, this editor is not yet ready for everyday usage.

However, this prototype should be sufficient for the purpose of conducting a user study to evaluate user expectations and system usability over certain common editing sequences and scenarios.

The Demo section documents some of these scenarios. Open issues on this repo document known cases that are not handled correctly.

## Features

- **Single line undo and redo.** Undo and redo the most recent edit to the line that your cursor is currently on.
- **Split and merge lines.** You can split and merge lines at any point in the line whilst retaining the edit history.
- **Multi-line undo and redo.** Select multiple lines and undo or redo the most recent change that applies to the selected lines.
- **Mode-switching.** Toggle the ability to undo/redo line creation/destruction.

## Running the Editor

Download the repository and open `editor.html` in a web browser (developed for Firefox and Chrome).

## Demo

<figure class="video_container">
    <iframe src="https://drive.google.com/file/d/1AlE22nopKHz-7v7yPMxMTmg5NfFpmxc7/preview" frameborder="0" allowfullscreen="true"></iframe>
</figure>

[See all demo videos](https://drive.google.com/drive/folders/1k6Bx0Lm1pt3_CEhb0BU4sML8qaCfxpqP?usp=sharing)

## Keyboard Shortcuts

Line-based undo can be invoked either by using the **Line Undo** and **Line Redo** buttons or by using the keybindings below.

|           | Mac         | Windows      |
| --------- | ----------- | ------------ |
| Line Undo | Cmd-Shift-u | Ctrl-Shift-u |
| Line Redo | Cmd-Shift-o | Ctrl-Shift-o |

## Directory Structure

```text
.
├── README.md
├── ace.js        <-- Ace code editor dependency
├── editor.html   <-- Open this to view the editor
├── editor.js     <-- Main code file
└── style.css     <-- Custom CSS styles
```

## Future Work

- **History retrieval:** user interface for traversing the edit history in a non-destructive way so that previously deleted fragments can be recovered and copied into the current document. This feature could work by adding the selected passage from the past to the current document via an insert.
- **Timeline visualisation:** view a timeline of edits based on the current line or lines selected.

## Contributor Identification

Some commits have been made by users with names and emails set by their local machines.

- James Garner: email 'fake@fake.fake' aka 'fake'
- Junjie He: email 'chegg@CheggMac.fritz.box'
