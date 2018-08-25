// Initialise editor.
var editor = ace.edit('editor');

// This is the main undo function.
var handleLineUndo = function() {
  var line = getCursorLine();
  var undoStack = editor.session.getUndoManager().$undoStack;

  // Edits are grouped together in Ace, but only the first edit has an id property.
  // We add an id to each edit operation to make it easier to remove them later.
  undoStack = addEditId(undoStack);

  // Exclude edits that occur across multiple lines e.g. linebreak.
  edits = filterNewlineEdits(undoStack);

  // Only get edits for the current cursor line.
  edits = getLineEdits(line, edits);

  if (edits.length) {
    // Get the last group of edits from the current line and its id.
    editGroup = edits.pop();
    id = editGroup[0].id;

    console.log(`Undoing edits to line number ${line} (id: ${id})`);

    // Revert the edits.
    undoEdits(editGroup);

    // Remove the edit group from the stack.
    deleteFromStack(id);
  } else {
    console.log(`No edits to undo to line ${line}`);
  }
};

// Add undo shortcut.
editor.commands.addCommand({
  name: 'lineUndo',
  bindKey: { win: 'Ctrl-Shift-u', mac: 'Command-Shift-u' },
  exec: handleLineUndo,
  readOnly: false,
});

// Get current cursor line.
var getCursorLine = function() {
  return editor.getSelection().getCursor().row;
};

// Get all edit groups from the undo stack that apply to that line.
var getLineEdits = function(linenum, edits) {
  return edits.filter(arr => arr[0].start.row === linenum);
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
var deleteFromStack = function(id) {
  var stack = editor.session.getUndoManager().$undoStack;

  editor.session.getUndoManager().$undoStack = stack.filter(
    arr => arr[0].id !== id,
  );
};

// Remove edits that span multiple lines.
var filterNewlineEdits = function(edits) {
  return edits.map(deltas => {
    return deltas.filter(delta => delta.start.row === delta.end.row);
  });
};
