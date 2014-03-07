
var midiAccess = null;
var midiIn = null;
var midiOut = null;
var selectMIDIIn = null;
var selectMIDIOut = null;
var deviceId = 17;


function integra7_init() {
	if (navigator.requestMIDIAccess)
   		navigator.requestMIDIAccess([sysex=true]).then( onMIDIInit, onMIDIFail );
}

function midiMessageReceived( e ) {
	console.log("MIDI MESSAGE IN "+e);
}

function load_part() {
	sendSYSEXwithRolandChecksum([0x0, 0xa0], [0x0a, 1, 2, 3]);
}

// --- MIDI utilities --

// DataRequest RQ1
// f0 41 10 [00 00 64] 11 a1 a2 a3 a4 s1 s2 s3 s4 CK f7

// DataSet DT1
// f0 41 10 [00 00 64] 12 a1 a2 a3 a4 d0 .. dn CK f7

// 

function sendSYSEXwithRolandChecksum(addr, data) {
	console.log(addr);
}

function onMIDIInit( midi ) {
  var preferredIndex = 0;
  midiAccess = midi;
  selectMIDIIn=document.getElementById("midiIn");
  selectMIDIOut=document.getElementById("midiOut");

  var list=midiAccess.inputs();

  // clear the MIDI input select
  selectMIDIIn.options.length = 0;

  for (var i=0; i<list.length; i++)
    if (list[i].name.toString().indexOf("Integra") != -1)
      preferredIndex = i;

  if (list.length) {
    for (var i=0; i<list.length; i++)
      selectMIDIIn.options[i]=new Option(list[i].name,list[i].fingerprint,i==preferredIndex,i==preferredIndex);

    midiIn = list[preferredIndex];
    midiIn.onmidimessage = midiMessageReceived;

    selectMIDIIn.onchange = changeMIDIIn;
  }

  // clear the MIDI output select
  selectMIDIOut.options.length = 0;
  preferredIndex = 0;
  list=midiAccess.outputs();

  for (var i=0; i<list.length; i++)
    if (list[i].name.toString().indexOf("Integra") != -1)
      preferredIndex = i;

  if (list.length) {
    for (var i=0; i<list.length; i++)
      selectMIDIOut.options[i]=new Option(list[i].name,list[i].fingerprint,i==preferredIndex,i==preferredIndex);

    midiOut = list[preferredIndex];
    selectMIDIOut.onchange = changeMIDIOut;
  }
}

function changeMIDIIn( ev ) {
  var list=midiAccess.inputs();
  var selectedIndex = ev.target.selectedIndex;

  if (list.length >= selectedIndex) {
    midiIn = list[selectedIndex];
    midiIn.onmidimessage = midiMessageReceived;
  }
}

function changeMIDIOut( ev ) {
  var list=midiAccess.outputs();
  var selectedIndex = ev.target.selectedIndex;

  if (list.length >= selectedIndex)
    midiOut = list[selectedIndex];
}

function onMIDIFail( err ) {
  console.log("MIDI failed to initialize: " + err.code);
}