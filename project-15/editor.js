// Initialise editor.
var editor = ace.edit('editor');
editor.session.setOption('indentedSoftWrap', false);
editor.setOption('highlightActiveLine', false);
editor.session.setOption('firstLineNumber', 0);
editor.session.setUseWrapMode(true);
editor.setShowPrintMargin(false);
editor.focus();

// Initialise editor content based on local storage.
editor.session.setValue(localStorage.savedValue || '');

var excludeLinebreaks = true;

var undoManager = editor.session.getUndoManager();

var lineRedoStack = [];

// The main undo function.
var handleUndo = function() {
  var lines = getEditLines();
  var stack = getUndoStack();
  var selectionRange = editor.getSelectionRange();

  if (isEmptyEditStack(stack)) return false;

  // Edits are grouped together in Ace, but only the first edit has an id property.
  // We add an id to each atomic operation to make it easier to remove them later.
  var edits = addEditId(stack);

  // Get edits for the current cursor line or selected lines.
  edits = getLineEdits(edits, lines);

  if (isEmptyEditStack(edits)) {
    console.log(`No edits to undo to line(s): ${lines}`);
    return false;
  }

  // Get the last edit group.
  var editGroup = edits.pop();
  var id = editGroup[0].id;

  // Store the edit group in a special redo stack for line redo.
  lineRedoStack.push(editGroup);

  // Add offsets before undo.
  editGroup = editGroup.map(edit => {
    var clone = cloneObj(edit);
    var offset = clone.rowOffset || 0;

    clone.start.row += offset;
    clone.end.row += offset;

    return clone;
  });

  console.log(`Undoing edit to line: ${editGroup[0].start.row} (group: ${id})`);

  // Remove the edit group from the stack.
  deleteFromUndoStack(id);

  // Undo the edits.
  undoEdits(editGroup);

  // Multi-line edit. Reselect the same lines.
  if (lines.length > 1) {
    selectLines(selectionRange);
  }

  return true;
};

var selectLines = function(range) {
  var startRow = range.start.row;
  var endRow = range.end.row;
  var range = new ace.Range(startRow, 0, endRow, Infinity);
  editor.selection.setSelectionRange(range);
};

// Clone object to prevent modifying references.
var cloneObj = function(edit) {
  return JSON.parse(JSON.stringify(edit));
};

var isEmptyEditStack = function(stack) {
  return !stack.length || !stack[0].length;
};

// Add undo shortcut.
editor.commands.addCommand({
  name: 'lineUndo',
  bindKey: { win: 'Ctrl-Shift-u', mac: 'Command-Shift-u' },
  exec: handleUndo,
  readOnly: false,
});

// Redo the given edits.
var redoEdits = function(deltas) {
  editor.session.redoChanges(deltas);
};

// The main redo function.
var handleRedo = function() {
  var lines = getEditLines();
  var stack = getRedoStack();
  var selectionRange = editor.getSelectionRange();

  if (isEmptyEditStack(stack)) return false;

  // Edits are grouped together in Ace, but only the first edit has an id property.
  // We add an id to each atomic operation to make it easier to remove them later.
  var edits = addEditId(stack);

  // Get edits for the current cursor line or selected lines.
  edits = getLineEdits(edits, lines, redoOrder);

  if (isEmptyEditStack(edits)) {
    console.log(`No edits to undo to line(s): ${lines}`);
    return false;
  }

  // Get the last edit group.
  var editGroup = edits.pop();
  var id = editGroup[0].id;

  console.log(`Redoing edit to line: ${editGroup[0].start.row} (group: ${id})`);

  // Push the redone changes back to the undo stack.
  undoManager.$undoStack.push(editGroup);

  // Add offsets before redo.
  editGroup = editGroup.map(edit => {
    var clone = cloneObj(edit);
    var offset = clone.rowOffset || 0;

    clone.start.row += offset;
    clone.end.row += offset;

    return clone;
  });

  // Remove the edit group from the stack.
  deleteFromRedoStack(id);

  // Redo the edits.
  redoEdits(editGroup);

  // Multi-line edit. Reselect the same lines.
  if (lines.length > 1) {
    selectLines(selectionRange);
  }

  return true;
};

// Delete edit group from the redo stack by id.
var deleteFromRedoStack = function(id) {
  lineRedoStack = lineRedoStack.filter(arr => arr[0].id !== id);
};

var getEdits = function(undoStack, line) {
  if (isEmptyEditStack(undoStack)) return false;

  var edits = getLineEdits(undoStack, line);

  if (!edits.length) return false;

  return edits;
};

var validateStack = function(stack) {
  if (isEmptyEditStack(stack)) return false;

  // Edits are grouped together in Ace, but only the first edit has an id property.
  // We add an id to each atomic operation to make it easier to remove them later.
  stack = addEditId(stack);

  return stack;
};

var getRedoStack = function() {
  var stack = lineRedoStack;
  stack = validateStack(stack);
  return stack || [];
};

var getUndoStack = function() {
  var stack = undoManager.$undoStack;
  stack = validateStack(stack);
  return stack || [];
};

var setRedoStack = function(x) {
  lineRedoStack = x;
};

var setUndoStack = function(x) {
  undoManager.$undoStack = x;
};

// Add redo shortcut.
editor.commands.addCommand({
  name: 'lineRedo',
  bindKey: { win: 'Ctrl-Shift-o', mac: 'Command-Shift-o' },
  exec: handleRedo,
  readOnly: false,
});

// Get an array of integers in the specified range (inclusive).
var arange = function(start, end) {
  var size = end - start + 1;
  return [...Array(size).keys()].map(i => i + start);
};

var getEditLines = function() {
  var range = editor.getSelectionRange();
  return arange(range.start.row, range.end.row);
};

// Get current cursor line.
var getCursorLine = function() {
  return editor.getSelection().getCursor().row;
};

var undoOrder = (a, b) => a[0].id - b[0].id;
var redoOrder = (a, b) => b[0].id - a[0].id;

// Get all edit groups from the stack that apply to
// the specified line or lines.
var getLineEdits = function(edits, lineNums, orderBy = undoOrder) {
  if (!Array.isArray(lineNums)) {
    lineNums = [lineNums];
  }

  // Build an array of edits applying to specified line(s).
  var allEdits = [];

  allEdits = edits.filter(group => {
    if (group.length === 0) return false;
    var offset = group[0].rowOffset || 0;
    var startRow = group[0].start.row;
    if (lineNums.indexOf(startRow + offset) < 0) {
      return false;
    } else {
      return true;
    }
  });

  if (excludeLinebreaks) {
    allEdits = filterNewlineEdits(allEdits);
  }

  return allEdits;

  //lineNums.forEach(line => {
  //  var lineEdits = edits.filter(group => {
  //    if (group.length === 0) return false;

  //    var offset = group[0].rowOffset || 0;
  //    var startRow = group[0].start.row;

  //    return startRow + offset === line;
  //  });

  //  allEdits = allEdits.concat(lineEdits);
  //});

  //if (excludeLinebreaks) {
  //  allEdits = filterNewlineEdits(allEdits);
  //}

  //return allEdits.sort(orderBy);
};

// Add edit group id to all edits in that group.
var addEditId = function(edits) {
  return edits.map(arr => {
    var id = arr[0].id;

    return arr.map(e => {
      e.id = id;
      return e;
    });
  });
};

// Undo the given edits.
var undoEdits = function(deltas) {
  editor.session.undoChanges(deltas);
};

// Delete edit group from the undo stack by id.
var deleteFromUndoStack = function(id) {
  setUndoStack(getUndoStack().filter(arr => arr[0].id !== id));
};

// Remove edits that span multiple lines.
var filterNewlineEdits = function(edits) {
  var edits = edits.map(deltas => {
    return deltas.filter(delta => delta.start.row === delta.end.row);
  });

  // Remove empty edit groups.
  return edits.filter(arr => arr.length);
};

// Editor toolbar.
// Based on: https://ace.c9.io/demo/toolbar.html

var refs = {
  saveButton: document.getElementById('saveButton'),
  clearButton: document.getElementById('clearButton'),
  undoButton: document.getElementById('undoButton'),
  redoButton: document.getElementById('redoButton'),
  lineUndoButton: document.getElementById('lineUndoButton'),
  lineRedoButton: document.getElementById('lineRedoButton'),
};

// Clear contents of editor and local storage.
var handleClear = function() {
  editor.session.setValue('');
  localStorage.savedValue = editor.getValue();
  editor.session.getUndoManager().markClean();
  updateToolbar();
};

// Save contents to local storage.
var handleSave = function() {
  localStorage.savedValue = editor.getValue();
  editor.session.getUndoManager().markClean();
  updateToolbar();
};

refs.saveButton.addEventListener('click', handleSave, false);
refs.clearButton.addEventListener('click', handleClear, false);
refs.undoButton.addEventListener('click', () => editor.undo(), false);
refs.redoButton.addEventListener('click', () => editor.redo(), false);
refs.lineUndoButton.addEventListener('click', handleUndo, false);
refs.lineRedoButton.addEventListener('click', handleRedo, false);

var updateToolbar = function() {
  refs.saveButton.disabled = editor.session.getUndoManager().isClean();
  refs.undoButton.disabled = !editor.session.getUndoManager().hasUndo();
  refs.redoButton.disabled = !editor.session.getUndoManager().hasRedo();
  refs.lineUndoButton.disabled = !getEdits(getUndoStack(), getEditLines());
  refs.lineRedoButton.disabled = !getEdits(getRedoStack(), getEditLines());
};

updateToolbar();
editor.on('input', updateToolbar);
editor.selection.on('changeCursor', updateToolbar);

// Add keyboard shortcut for saving.
editor.commands.addCommand({
  name: 'save',
  exec: handleSave,
  bindKey: { win: 'Ctrl-s', mac: 'Command-s' },
});

// Determines if the edit results in a linebreak.
var isNewlineEdit = function(delta) {
  return delta.lines.length > 1;
};

// Get all edit groups starting after and including the line number.
var getAllAffectedEdits = function(edits, line) {
  return edits.filter(
    arr => arr.length > 0 && arr[0].start.row + (arr[0].rowOffset || 0) >= line,
  );
};

var updateRowOffsets = function(stack, startRow, rowOffset, ignoreID) {
  var edits = getAllAffectedEdits(stack, startRow);

  for (var editGroup of edits) {
    for (var edit of editGroup) {
      if (ignoreID != undefined && edit.id == ignoreID) {
        // don't apply offset to delta that triggers it
        continue;
      }
      if (edit.hasOwnProperty('rowOffset')) {
        edit.rowOffset += rowOffset;
      } else {
        edit.rowOffset = rowOffset;
      }
    }
  }
};

var isLineMerge = function(delta) {
  return delta.action === 'remove' && delta.lines.length > 1;
};

var isLineSplit = function(delta) {
  return delta.action === 'insert' && delta.lines.length > 1;
};

var applyColOffset = function(group, offset) {
  group.map(g => (g.start.column += offset));
  group.map(g => (g.lines.length == 1 ? (g.end.column += offset) : g));
  // don't update columns that aren't on the same row
  return group;
};

var applyRowOffset = function(group, rowOffset) {
  group.map(
    g =>
      g.hasOwnProperty('rowOffset')
        ? (g.rowOffset += rowOffset)
        : (g.rowOffset = rowOffset),
  );
  return group;
};

var clearRedoStack = function(line) {
  var editIds = getLineEdits(getRedoStack(), line).map(group => group[0].id);
  lineRedoStack = lineRedoStack.filter(
    group => editIds.indexOf(group[0].id) < 0,
  );
};

var undoStackLength = undoManager.$undoStack.length;
var redoStackLength = lineRedoStack.length;

var loadingDoc = false;

var handleChange = function(delta) {
  var action = delta.action;
  var startRow = delta.start.row;
  var endRow = delta.end.row;
  var rowOffset = action === 'insert' ? endRow - startRow : startRow - endRow;

  var applyAtEnd = false;

  if (loadingDoc) {
    loadingDoc = false;
    return;
  }

  // Merging rows.
  // Merge the edit histories of the two rows.
  // ie: apply appropriate offsets to events on the second row.
  if (isLineMerge(delta)) {
    var colOffset = delta.start.column;

    // UNDO STACK
    var editIds = getLineEdits(getUndoStack(), endRow).map(
      group => group[0].id,
    );
    undoManager.$undoStack = getUndoStack().map(
      group =>
        editIds.indexOf(group[0].id) < 0
          ? group
          : applyColOffset(group, colOffset),
    );

    // REDO STACK
    var editIds = getLineEdits(getRedoStack(), endRow).map(
      group => group[0].id,
    );
    lineRedoStack = getRedoStack().map(
      group =>
        editIds.indexOf(group[0].id) < 0
          ? group
          : applyColOffset(group, colOffset),
    );
  }

  //console.log(delta);
  updateRowOffsets(getUndoStack(), endRow, rowOffset, delta.id);
  updateRowOffsets(getRedoStack(), endRow, rowOffset, delta.id);

  // Splitting rows.
  // Apply offsets to events after the linebreak in the linebreak start row.
  // Split edit groups that are split by the linebreak.
  if (isLineSplit(delta)) {
    // Account for automatic stripping of whitespace when inserting linebreak.
    var stack = getUndoStack();
    var trimmedWhitespace = 0;
    var lastEditGroup = stack[stack.length - 1] || [];

    if (lastEditGroup.length === 2) {
      //trimmedWhitespace = lastEditGroup[0].lines[0].length;
      //console.log(lastEditGroup)
      applyAtEnd = undoManager.$undoStack[getUndoStack().length - 1].splice(
        0,
        1,
      );
      applyAtEnd[0].end.row += 1;
      applyAtEnd[0].start.row += 1;
      applyAtEnd[0].end.column -= applyAtEnd[0].start.column;
      applyAtEnd[0].start.column = 0;
      console.log(applyAtEnd, !!applyAtEnd);
    }

    //console.log("handling line split")
    var col = delta.start.column;
    var colOffset = -1 * (col + trimmedWhitespace);
    //console.log(col);

    // UNDO STACK
    var editsOnLine = getLineEdits(getUndoStack(), startRow);
    //console.log(JSON.stringify(editsOnLine));

    var editsEndingAfterSplit = editsOnLine.filter(
      group =>
        lastCol(group) > col ||
        (group[0].start.row != group[0].end.row &&
          group[0].start.column != col),
      // include trailing linebreaks after the split, but not the split linebreak itself
    );
    //console.log(JSON.stringify(editsEndingAfterSplit));

    var editsAfterSplit = editsEndingAfterSplit.filter(
      group => firstCol(group) >= col || group.length == 1,
    );
    //console.log(JSON.stringify(editsAfterSplit));

    var editsOnSplit = editsEndingAfterSplit.filter(
      group => firstCol(group) < col && group.length > 1, // && group[0].start.row == group[0].end.row,
    );
    //console.log(JSON.stringify(editsOnSplit));

    // double check the trailing linebreak didn't end up in editsOnSplit
    var trailingLinebreak = editsOnSplit.filter(
      group => group[0].start.row != group[0].end.row,
    );
    //console.log(JSON.stringify(trailingLinebreak));
    editsAfterSplit = editsAfterSplit.concat(trailingLinebreak);
    editsOnSplit = editsOnSplit.filter(
      group => group[0].start.row == group[0].end.row,
    );

    var afterSplitIds = editsAfterSplit.map(group => group[0].id);
    var onSplitIds = editsOnSplit.map(group => group[0].id);

    undoManager.$undoStack = getUndoStack().map(
      group =>
        afterSplitIds.indexOf(group[0].id) < 0
          ? group
          : group[0].id == delta.id
            ? group
            : applyRowOffset(applyColOffset(group, colOffset), rowOffset),
    );

    for (var j in onSplitIds) {
      var id = onSplitIds[j];

      for (var i = 0; i < getUndoStack().length; i++) {
        if (getUndoStack()[i][0].id == id) {
          var s = splitOn(getUndoStack()[i], col);

          undoManager.$undoStack[i] = s[0];
          undoManager.$undoStack.splice(
            i + 1,
            0,
            applyRowOffset(applyColOffset(s[1], colOffset), rowOffset),
          );

          break;
        }
      }
    }

    // REDO STACK
    var editsOnLine = getLineEdits(getRedoStack(), startRow);
    var onLineIds = editsOnLine.map(group => group[0].id);
    lineRedoStack = getRedoStack().map(
      group =>
        onLineIds.indexOf(group[0].id) < 0
          ? group
          : group[0].id == delta.id
            ? group
            : applyRowOffset(applyColOffset(group, colOffset), rowOffset),
    );
  }

  if (isNewlineEdit(delta)) {
    // Make new line a separate edit group.
    undoManager.startNewGroup();
  }

  // clear redo stack if necessary

  // check if this delta is an undo operation
  var undoOperation = true;
  var newUndoStackLength = undoManager.$undoStack.length;
  //console.log(undoStackLength, newUndoStackLength)
  if (newUndoStackLength > undoStackLength) {
    undoOperation = false;
  }
  undoStackLength = newUndoStackLength;

  // check if this delta is a redo operation
  var redoOperation = true;
  var newRedoStackLength = lineRedoStack.length;
  //console.log(undoStackLength, newUndoStackLength)
  if (newRedoStackLength >= redoStackLength) {
    redoOperation = false;
  }
  redoStackLength = newRedoStackLength;

  // if neither, it was a regular edit operation:
  //console.log(undoOperation, redoOperation)
  //console.log(undoStackLength, redoStackLength)
  //console.log(delta)
  if (!undoOperation && !redoOperation) {
    clearRedoStack(startRow);
  }
  if (applyAtEnd) {
    console.log('applyAtEnd = true');
    console.log(applyAtEnd);
    undoEdits(applyAtEnd);
  }
};

var splitOn = function(g, i) {
  var s = [null, null];
  s[0] = g.filter(e => e.end.column <= i);
  //console.log("s0", s[0]);
  s[1] = g.filter(e => e.end.column > i);
  //console.log("s1", s[1]);
  var increment = Math.random();
  // random increment to try and avoid id collisions
  // need a solution that actually guarantees this
  // maybe a counter on each edit group to track how many times it's been split
  while (increment == 0.0) {
    increment = Math.random();
  }
  // not as easy as it sounds: the timesSplit implementation below is no good
  //var timesSplit = s[0].timesSplit || 0;
  //timesSplit += 1;
  //s[0].timesSplit = timesSplit;
  //s[1].timesSplit = 0;
  //var increment = 1-1/(1+timesSplit));
  s[1][0].id += increment;
  return s;
};

var firstCol = function(g) {
  var cols = g.map(e => e.start.column);
  return Math.min.apply(Math, cols);
};

var lastCol = function(g) {
  var cols = g.map(e => e.end.column);
  return Math.max.apply(Math, cols);
};

editor.session.on('change', handleChange);

resetEditor = function() {
  editor.setValue('');
  undoManager.reset();
  lineRedoStack = [];
};

// Load files

function readBlob(opt_startByte, opt_stopByte) {
  var files = document.getElementById('files').files;

  if (!files.length) {
    alert('Please select a file.');
    return;
  }

  var file = files[0];
  var start = parseInt(opt_startByte) || 0;
  var stop = parseInt(opt_stopByte) || file.size - 1;

  var blob = file.slice(start, stop + 1);

  var reader = new FileReader();
  reader.readAsText(blob);
  reader.onload = function() {
    editor.setValue(reader.result);
  };
}

document.querySelector('.readBytesButtons').addEventListener(
  'click',
  function(evt) {
    var startByte = evt.target.getAttribute('data-startbyte');
    var endByte = evt.target.getAttribute('data-endbyte');
    readBlob(startByte, endByte);
  },
  false,
);

// Load sample documents.

var sampleDocuments = {
  None: '',
  Code: `var fun5kylic6ious9 = function(x, y, z) {
    console.log(x);
    console.log(y * 3);
    console.log(z * z * z);
    return null;
};

var string_multiply = function(word, times) {
    console.log("logging", arguments);
    times = times || 1;
    var string = word;
    for (i = 1; i < times; i++) {
        string += " ";
        string += word;
    }
    console.log("testid:83");
    console.log(string)
    return string;
};

var argx = 2.71828;
var argy = 1;
var argz = 99;

string_multiply("hello");
`,
  Piranhas: `Although most people consider piranhas to be quite dangerous, they are entirely harmless. Piranhas rarely feed on large animals; they eat smaller fish and aquatic plants. 

When confronted with humans, piranhas’ first instinct is to flee, not attack. Their fear of humans makes sense. Piranhas are not an aggressive fish, they are simply group predators that take advaantage of prey when they can. When they are well-fed and in open waters, they rarely attack anything bigger than the small to medium fish that inhabit the same waters.
 
But there are two situations in which a piranha bite is likely. The first is when a frightened piranha is lifted out of the water—for example, if it has been caught in a fishing net. The second is when the water level in pools where piranhas are living falls too low. A large number of fish may be trapped in a single pool, and if they are hungry, they may attack anything that enters the water.`,
};

var documentSelector = document.getElementById('documentSelector');

for (var key in sampleDocuments) {
  var element = document.createElement('option');
  element.text = key;
  element.value = key;

  documentSelector.appendChild(element);
}

documentSelector.addEventListener('change', () => {
  if (confirm('Override existing contents?')) {
    resetEditor();
    editor.setValue(sampleDocuments[documentSelector.value]);
    editor.session.getUndoManager().reset();
  }
});
