// general variables
var margin = 300;

var ALL_NOTES = [
	'C1',
	'C#1',
	'D1',
	'Eb1',
	'E1',
	'F1',
	'F#1',
	'G1',
	'Ab1',
	'A1',
	'Bb1',
	'B1',
	'C2',
	'C#2',
	'D2',
	'Eb2',
	'E2',
	'F2',
	'F#2',
	'G2',
	'Ab2',
	'A2',
	'Bb2',
	'B2',
	'C3',
	'C#3',
	'D3',
	'Eb3',
	'E3',
	'F3',
	'F#3',
	'G3',
	'Ab3',
	'A3',
	'Bb3',
	'B3',
	'C4',
	'C#4',
	'D4',
	'Eb4',
	'E4',
	'F4',
	'F#4',
	'G4',
	'Ab4',
	'A4',
	'Bb4',
	'B4',
	'C5',
	'C#5',
	'D5',
	'Eb5',
	'E5',
	'F5',
	'F#5',
	'G5',
	'Ab5',
	'A5',
	'Bb5',
	'B5',
	'C6',
	'C#6',
	'D6',
	'Eb6',
	'E6',
	'F6',
	'F#6',
	'G6',
	'Ab6',
	'A6',
	'Bb6',
	'B6',
	'C7',
	'C#7',
	'D7',
	'Eb7',
	'E7',
	'F7',
	'F#7',
	'G7',
	'Ab7',
	'A7',
	'Bb7',
	'B7',
	'C8',
];

var numberOfNotes;
var notesInRange;
var fromNote = 39;
var toNote = 51;
var middleC = 39;
var revealed = true;
var ALL_AUDIO_NOTES = {};
var currentNoteIndices = [];

// variables pertaining to Vexflow
const VF_NOTE = 0;
const VF_ACCIDENTAL = 1;
var currentVfTrebleNotes = [];
var currentVfBassNotes = [];
var STAVE_SIZE = 240;
var VF_DIMENSIONS = {
	WIDTH: window.innerWidth - margin * 2,
	HEIGHT: window.innerHeight / 2.5,
	TREBLE_X: (window.innerWidth - margin * 2) / 2 - STAVE_SIZE / 2,
	TREBLE_Y: window.innerHeight / 2.5 / 4,
	BASS_X: (window.innerWidth - margin * 2) / 2 - STAVE_SIZE / 2,
	BASS_Y: (2 * (window.innerHeight / 2.5)) / 4,
};

// -----------------------------------------------------------------------------------
// ------------------------------- SET UP VEXFLOW-------------------------------------
// -----------------------------------------------------------------------------------

VF = Vex.Flow;
var vexflow = document.getElementById('vexflow');

var renderer = new VF.Renderer(vexflow, VF.Renderer.Backends.SVG);
renderer.resize(VF_DIMENSIONS.WIDTH, VF_DIMENSIONS.HEIGHT);
var context = renderer.getContext().setBackgroundFillStyle('#eed');
var trebleStave;
var bassStave;
var currentGroup = context.openGroup();
window.addEventListener('resize', resizeStaves);
drawStaves();

// -----------------------------------------------------------------------------------
// -------------------------------- ADD SLIDERS --------------------------------------
// -----------------------------------------------------------------------------------

$(function() {
	$('.js-range-slider').ionRangeSlider({
		type: 'double',
		values: ALL_NOTES,
		from: 36,
		to: 48,
		skin: 'sharp',
		onStart: function(data) {
			setRangeOfNotes();
		},
		onChange: function(data) {
			fromNote = data.from;
			toNote = data.to;
			setRangeOfNotes();
		},
	});
	$('.js-range-slider2').ionRangeSlider({
		min: 1,
		max: 7,
		from: 3,
		skin: 'sharp',
		onStart: function(data) {
			numberOfNotes = data.from;
			STAVE_SIZE = numberOfNotes * 80;
		},
		onChange: function(data) {
			numberOfNotes = data.from;
			STAVE_SIZE = numberOfNotes * 80;
			VF_DIMENSIONS.TREBLE_X = VF_DIMENSIONS.WIDTH / 2 - STAVE_SIZE / 2;
			VF_DIMENSIONS.BASS_X = VF_DIMENSIONS.WIDTH / 2 - STAVE_SIZE / 2;
		},
	});
});

function setRangeOfNotes() {
	var rangeOfNotes = toNote - fromNote;
	notesInRange = new Array(rangeOfNotes);
	for (var i = 0; i < rangeOfNotes; i++) {
		notesInRange[i] = ALL_NOTES[i + fromNote];
	}
}

// -----------------------------------------------------------------------------------
// -------------------------------- ADD BUTTONS --------------------------------------
// -----------------------------------------------------------------------------------

addButtons();
function addButtons() {
	var buttons = document.getElementsByClassName('btn btn--green');

	var replayButton = buttons[0];
	replayButton.addEventListener('click', replay);

	var revealButton = buttons[1];
	revealButton.addEventListener('click', reveal);

	var playNextButton = buttons[2];
	playNextButton.addEventListener('click', playNext);
}

// -----------------------------------------------------------------------------------
// -------------------------------- LOAD SOUND ---------------------------------------
// -----------------------------------------------------------------------------------

function preload() {
	for (var i = 0; i < ALL_NOTES.length; i++) {
		var audioFile = getAudioFile(ALL_NOTES[i]);
		ALL_AUDIO_NOTES[i] = loadSound(audioFile);
	}
}
function setup() {}

// -----------------------------------------------------------------------------------
// --------------------------- NOTE NAME MANIPULATION --------------------------------
// -----------------------------------------------------------------------------------

function getVfNoteNameAndAccidental(note) {
	var result = new Array(2);
	if (note.length === 3) {
		result[VF_NOTE] = note.substring(0, 1) + '/' + note.substring(2);
		result[VF_ACCIDENTAL] = note.substring(1, 2);
	} else {
		result[VF_NOTE] = note.substring(0, 1) + '/' + note.substring(1);
	}

	return result;
}

function getAudioFile(noteName) {
	var audioFile = '../audio/' + noteName + '.mp3';
	var result = audioFile.replace('#', 's');
	return result;
}

// -----------------------------------------------------------------------------------
// ------------------------------ BUTTON FUNCTIONS -----------------------------------
// -----------------------------------------------------------------------------------

function playNext() {
	drawStaves();

	// Get random notes and construct VF notes and store note indices
	var random_notes = getRandomNotes(numberOfNotes);
	currentVfNotes = new Array(numberOfNotes);
	currentNoteIndices = new Array(numberOfNotes);
	for (var i = 0; i < numberOfNotes; i++) {
		noteIndex = ALL_NOTES.indexOf(random_notes[i]);
		getVfNotes(i, random_notes, noteIndex);
		currentNoteIndices[i] = noteIndex;
	}

	// Play the notes
	playNotes();
	revealed = false;
}

function getVfNotes(i, random_notes, noteIndex) {
	var note = random_notes[i];
	var treble = noteIndex >= middleC;
	var vfNoteNameAndAccidental = getVfNoteNameAndAccidental(note);
	console.log(vfNoteNameAndAccidental);

	// Construct the VF StaveNote and add accidentals where appropriate
	var vfNote = new VF.StaveNote({ clef: treble ? 'treble' : 'bass', keys: [vfNoteNameAndAccidental[VF_NOTE]], duration: '4', auto_stem: true });
	if (vfNoteNameAndAccidental[1] != null) {
		vfNote.addAccidental(0, new VF.Accidental(vfNoteNameAndAccidental[VF_ACCIDENTAL]));
	} else if (i !== 0) {
		var previousVfNoteNameAndAccidental = getVfNoteNameAndAccidental(random_notes[i - 1]);
		if (previousVfNoteNameAndAccidental[VF_NOTE] === vfNoteNameAndAccidental[VF_NOTE]) vfNote.addAccidental(0, new VF.Accidental('n'));
	}
	vfNote.setContext(context);

	// Add the notes to the appropriate stave
	currentVfTrebleNotes[i] = treble ? vfNote : new Vex.Flow.GhostNote({ duration: '4' }).setContext(context);
	currentVfBassNotes[i] = !treble ? vfNote : new Vex.Flow.GhostNote({ duration: '4' }).setContext(context);
}

function replay() {
	if (currentVfNotes.length !== 0) playNotes();
}

function playNotes() {
	// Play the notes using the p5 sounds library
	for (var i = 0; i < numberOfNotes; i++) {
		ALL_AUDIO_NOTES[currentNoteIndices[i]].play();
		ALL_AUDIO_NOTES[currentNoteIndices[i]].stop(3);
	}
}

function reveal() {
	if (!revealed) {
		showNotes();
		addNotesEvents();
	}
	revealed = true;
}

function showNotes() {
	// Treble notes
	var trebleVoice = new VF.Voice({ num_beats: numberOfNotes, beat_value: 4 });
	trebleVoice.addTickables(currentVfTrebleNotes);
	var formatter = new VF.Formatter().joinVoices([trebleVoice]).format([trebleVoice], STAVE_SIZE);
	trebleVoice.draw(context, trebleStave);

	// Bass notes
	var bassVoice = new VF.Voice({ num_beats: numberOfNotes, beat_value: 4 });
	bassVoice.addTickables(currentVfBassNotes);
	var formatter = new VF.Formatter().joinVoices([bassVoice]).format([bassVoice], STAVE_SIZE);
	bassVoice.draw(context, bassStave);
}

function addNotesEvents() {
	let notes = document.getElementsByClassName('vf-stavenote');
	for (var i = 0; i < notes.length; i++) {
		console.log(notes[i]);
		notes[i].addEventListener('mouseover', colorDescendants('#224903'), false);
		notes[i].addEventListener('mouseout', colorDescendants('black'), false);
	}
}

function colorDescendants(color) {
	return function() {
		Vex.forEach($(this).find('*'), function(child) {
			child.setAttribute('fill', color);
			child.setAttribute('stroke', color);
		});
	};
}

function playNote(i) {
	console.log('click');
	ALL_AUDIO_NOTES[currentNoteIndices[i]].play();
}

function getRandomNotes(n) {
	// Get n random notes from the notesInRange array
	var result = new Array(n),
		len = notesInRange.length,
		taken = new Array(len);
	if (n > len) throw new RangeError('getRandomNotes: more elements taken than available');
	while (n--) {
		var x = Math.floor(Math.random() * len);
		result[n] = notesInRange[x in taken ? taken[x] : x];
		taken[x] = --len in taken ? taken[len] : len;
	}
	console.log(result);
	result.sort(function(a, b) {
		return notesInRange.indexOf(a) - notesInRange.indexOf(b);
	});
	return result;
}

// -----------------------------------------------------------------------------------
// --------------------------------- DRAW STAVES -------------------------------------
// -----------------------------------------------------------------------------------

function drawStaves() {
	// Clear the current staves
	context.closeGroup();
	context.svg.removeChild(currentGroup);
	currentGroup = context.openGroup();

	// Draw new treble and bass staves
	trebleStave = new VF.Stave(VF_DIMENSIONS.TREBLE_X, VF_DIMENSIONS.TREBLE_Y, STAVE_SIZE).addClef('treble');
	trebleStave.setContext(context).draw();
	bassStave = new VF.Stave(VF_DIMENSIONS.BASS_X, VF_DIMENSIONS.BASS_Y, STAVE_SIZE).addClef('bass');
	bassStave.setContext(context).draw();
}
function resizeStaves() {
	VF_DIMENSIONS.WIDTH = window.innerWidth - margin * 2;
	VF_DIMENSIONS.HEIGHT = window.innerHeight / 2.5;
	renderer.resize(VF_DIMENSIONS.WIDTH, VF_DIMENSIONS.HEIGHT);
	VF_DIMENSIONS.TREBLE_X = VF_DIMENSIONS.WIDTH / 2 - STAVE_SIZE / 2;
	VF_DIMENSIONS.TREBLE_Y = VF_DIMENSIONS.HEIGHT / 4;
	VF_DIMENSIONS.BASS_X = VF_DIMENSIONS.WIDTH / 2 - STAVE_SIZE / 2;
	VF_DIMENSIONS.BASS_Y = (2 * VF_DIMENSIONS.HEIGHT) / 4;
	drawStaves();
	if (currentNoteIndices.length !== 0 && revealed) showNotes();
}
