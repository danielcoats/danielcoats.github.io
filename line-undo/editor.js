// Initialise editor.
var editor = ace.edit('editor');
editor.session.setOption('indentedSoftWrap', false);
editor.session.setUseWrapMode(true);

// This is the main undo function. It determines which region to apply undo to
// (line or selected region) and invokes the relevant operation.
var handleUndo = function() {
  var selection = editor.getSelectionRange();
  var start = selection.start;
  var end = selection.end;

  if (start.row === end.row && start.column === end.column) {
    invokeLineUndo();
  } else {
    invokeSelectionUndo(start, end);
  }
};

// Handle an undo to a particular selection.
var invokeSelectionUndo = function(start, end) {
  // TODO: implement regional undo based on Li and Li.
  console.log(
    `Undoing operations in the range {${start.row}, ${start.column}} to {${
      end.row
    }, ${end.column}}`,
  );
};

// Handle an undo to a line.
var invokeLineUndo = function() {
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
  exec: handleUndo,
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
